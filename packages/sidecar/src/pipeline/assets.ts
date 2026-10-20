import { copyFile, mkdir, readdir, readFile, realpath } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, extname, join, relative, sep } from "node:path";
import type {
  AssetManifest,
  AssetRequest,
  BrandKit,
  ContentPlan,
  StyleSelection,
} from "@laras/shared";
import sharp from "sharp";
import { runCodex } from "../cli/codex.ts";
import type { SpawnLines } from "../cli/stream.ts";
import { promptUrl } from "../prompts/index.ts";
import { styleImageDirection } from "../prompts/style-context.ts";
import { analyzeCutout, normalizeCutout } from "./cutout.ts";

// Tahap assets (ARCH 5.2, 5.3): setiap AssetRequest menjadi file di jobs/<id>/assets/. Foto
// dipotong ke rasio slot; cut-out (T-131) tetap utuh dan beralpha, lalu dianalisis subjeknya.
// Path sumber dan tujuan divalidasi (ARCH 9).

export type AssetEntry = AssetManifest["assets"][number];
export type JobContext = {
  projectDir: string;
  jobDir: string;
  brand: BrandKit;
  // Gaya job (T-133): arahan perlakuan gambar di prompt Codex.
  style?: StyleSelection | null;
  // Lokasi dan orang dari plan (T-125), dikirim ke setiap prompt gambar.
  setting?: ContentPlan["setting"];
  // Kontrak komposisi slot arketipe per id aset (T-141), dirangkai engine dari opsi layout.
  compositions?: Record<string, string>;
  signal?: AbortSignal;
};
export type AssetProvider = {
  generate(request: AssetRequest, ctx: JobContext): Promise<AssetEntry>;
};

const ASSET_ID = /^[a-z0-9][a-z0-9-]*$/;
const THREAD_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const IMAGE_FILE = /\.(png|jpe?g|webp)$/i;
const JPEG_QUALITY = 92;

const inside = (root: string, path: string) =>
  path.startsWith(root.endsWith(sep) ? root : root + sep);

// Tujuan selalu di jobs/<id>/assets/ dengan nama dari id aset.
function assetPath(jobDir: string, id: string, suffix: string): string {
  if (!ASSET_ID.test(id)) throw new Error(`Id aset tidak sah: ${id}`);
  const dir = join(jobDir, "assets");
  const path = join(dir, `${id}${suffix}`);
  if (!inside(dir, path)) throw new Error(`Tujuan aset keluar dari folder job: ${id}`);
  return path;
}

// Potong ke rasio slot tanpa memperbesar; smart crop sharp (attention) menjaga area paling
// menonjol. Orientasi EXIF diterapkan dulu (foto ponsel). Hasil JPG sRGB.
export async function cropToRatio(source: string, destination: string, aspectRatio: string) {
  const [ratioW = 1, ratioH = 1] = aspectRatio.split(":").map(Number);
  const meta = await sharp(source).metadata();
  const rotated = (meta.orientation ?? 1) >= 5; // orientasi EXIF 5–8 menukar lebar dan tinggi
  const width = (rotated ? meta.height : meta.width) ?? 0;
  const height = (rotated ? meta.width : meta.height) ?? 0;
  const scale = Math.min(width / ratioW, height / ratioH);
  const target = { width: Math.floor(ratioW * scale), height: Math.floor(ratioH * scale) };
  await mkdir(dirname(destination), { recursive: true });
  const info = await sharp(source)
    .rotate()
    .resize(target.width, target.height, { fit: "cover", position: sharp.strategy.attention })
    .withIccProfile("srgb")
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toFile(destination);
  return { width: info.width, height: info.height };
}

function entry(
  ctx: JobContext,
  id: string,
  path: string,
  size: { width: number; height: number },
  source: AssetEntry["source"],
): AssetEntry {
  return { id, path: relative(ctx.jobDir, path).split(sep).join("/"), ...size, source };
}

const PROMPT_TEMPLATES = { photo: promptUrl("asset-image"), cutout: promptUrl("asset-cutout") };
const SUBJECT_WORDS = { person: "person", object: "product or object" } as const;

// Cut-out sah bila sebagian gambar benar-benar transparan; Codex tanpa permintaan transparan
// memberi RGB tanpa alpha (KNOWLEDGE T-121).
const MIN_TRANSPARENT = 0.05;
const TRANSPARENT_ALPHA = 16;

async function transparentShare(file: string): Promise<number> {
  const { data, info } = await sharp(file)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let clear = 0;
  for (let i = 3; i < data.length; i += info.channels) {
    if ((data[i] ?? 255) < TRANSPARENT_ALPHA) clear++;
  }
  return clear / (info.width * info.height);
}

// Simpan satu gambar sumber sebagai aset job: foto dipotong ke rasio slot (JPG), cut-out
// dinormalkan alpha-nya (WebP), tidak dipotong, dan diberi data subjek (kotak alpha, fokus).
export async function storeAsset(
  request: AssetRequest,
  source: string,
  ctx: JobContext,
  origin: AssetEntry["source"],
): Promise<AssetEntry> {
  if (request.kind !== "cutout") {
    const path = assetPath(ctx.jobDir, request.id, ".jpg");
    return entry(
      ctx,
      request.id,
      path,
      await cropToRatio(source, path, request.aspectRatio),
      origin,
    );
  }
  const share = await transparentShare(source);
  if (share < MIN_TRANSPARENT) {
    throw new Error(
      `Gambar untuk aset cut-out "${request.id}" tidak berlatar transparan (${Math.round(share * 100)}% piksel transparan); buat ulang asetnya atau pakai PNG beralpha`,
    );
  }
  const path = assetPath(ctx.jobDir, request.id, ".webp");
  await mkdir(dirname(path), { recursive: true });
  const size = await normalizeCutout(source, path);
  const subject = await analyzeCutout(path, request.subject ?? "object");
  return { ...entry(ctx, request.id, path, size, origin), subject };
}

// Arahan foto brand terstruktur (BrandKit.constraints.photo, T-124), selalu dikirim dan menang
// atas arahan gaya. Latar putih polos tidak relevan untuk cut-out (latarnya transparan).
export function photoRules(brand: BrandKit, request: AssetRequest): string {
  const rules = brand.constraints?.photo ?? {};
  const lines = [
    rules.naturalLight &&
      "Products and scenes are lit with natural daylight; no studio flash, colored gels, or neon light on the product.",
    rules.noPlainBackdrop &&
      request.kind !== "cutout" &&
      "Never a plain white seamless backdrop; show a real surface or place.",
    rules.realSkin &&
      "Any person shows real, unretouched skin texture with natural pores; no beauty filter or airbrushing.",
    rules.motion && "Any person is clearly in motion, never a static pose.",
    // Gradasi di dalam foto tidak tertangkap cek gradient CSS (temuan T-140, langit R2).
    brand.constraints?.noGradient &&
      request.kind !== "cutout" &&
      "No color gradients: backdrops, skies, walls, and light are solid or evenly lit, never a gradient color wash.",
  ].filter((line): line is string => typeof line === "string");
  return lines.length > 0 ? lines.join(" ") : "None beyond the palette above.";
}

// Lokasi dan orang dari plan (T-125). Cut-out berlatar transparan, jadi hanya orangnya.
export function settingLine(setting: ContentPlan["setting"] | undefined, request: AssetRequest) {
  if (!setting) return "As described.";
  const people = `People, if any appear: ${setting.people}.`;
  return request.kind === "cutout" ? people : `Location: ${setting.location}. ${people}`;
}

export async function assetPrompt(
  request: AssetRequest,
  brand: BrandKit,
  style: StyleSelection | null = null,
  setting?: ContentPlan["setting"],
  composition?: string,
): Promise<string> {
  const [w = 1, h = 1] = request.aspectRatio.split(":").map(Number);
  const { primary, secondary, accent } = brand.colors;
  const values: Record<string, string> = {
    // Deskripsi berasal dari output AI: penanda delimiter dibuang agar tidak bisa ditutup dini.
    description: request.description.replace(/<\/?description>/gi, "").trim(),
    orientation: w > h ? "Landscape" : w < h ? "Portrait" : "Square",
    aspectRatio: request.aspectRatio,
    palette: `primary ${primary}, secondary ${secondary}, accent ${accent}`,
    subject: SUBJECT_WORDS[request.subject ?? "object"],
    styleDirection: styleImageDirection(style),
    photoRules: photoRules(brand, request),
    setting: settingLine(setting, request),
    composition: composition ?? "As described.",
  };
  const kind = request.kind === "cutout" ? "cutout" : "photo";
  const template = await readFile(PROMPT_TEMPLATES[kind], "utf8");
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = values[key];
    if (value === undefined) throw new Error(`Placeholder prompt tidak dikenal: ${key}`);
    return value;
  });
}

// Gambar hasil satu thread Codex: thread_id harus UUID, dan file (setelah symlink di-resolve)
// harus tetap di dalam generated_images/<thread_id>/ (ADR-012, ARCH 9).
export async function generatedImage(codexHome: string, threadId: string): Promise<string> {
  if (!THREAD_ID.test(threadId)) throw new Error(`thread_id Codex tidak sah: ${threadId}`);
  const root = await realpath(join(codexHome, "generated_images"));
  const threadDir = join(root, threadId);
  const files = (await readdir(threadDir).catch(() => [])).filter((f) => IMAGE_FILE.test(f)).sort();
  if (files.length === 0) throw new Error("Codex tidak menghasilkan gambar");
  if ((await realpath(threadDir)) !== threadDir) {
    throw new Error("Folder gambar Codex berada di luar generated_images");
  }
  const file = await realpath(join(threadDir, files[0] ?? ""));
  if (!inside(threadDir, file)) throw new Error("File gambar Codex berada di luar folder thread");
  return file;
}

export class CodexAssetProvider implements AssetProvider {
  readonly #codexPath: string;
  readonly #codexHome: string;
  readonly #spawn: SpawnLines | undefined;

  constructor(options: { codexPath: string; codexHome?: string; spawn?: SpawnLines }) {
    this.#codexPath = options.codexPath;
    this.#codexHome = options.codexHome ?? process.env.CODEX_HOME ?? join(homedir(), ".codex");
    this.#spawn = options.spawn;
  }

  async generate(request: AssetRequest, ctx: JobContext): Promise<AssetEntry> {
    const run = await runCodex({
      codexPath: this.#codexPath,
      cwd: ctx.projectDir,
      prompt: await assetPrompt(
        request,
        ctx.brand,
        ctx.style ?? null,
        ctx.setting,
        ctx.compositions?.[request.id],
      ),
      ...(ctx.signal ? { signal: ctx.signal } : {}),
      ...(this.#spawn ? { spawn: this.#spawn } : {}),
    });
    const source = await generatedImage(this.#codexHome, run.threadId);
    // Asli disimpan agar revisi ke rasio lain bisa dipotong ulang tanpa generate lagi.
    const original = assetPath(ctx.jobDir, request.id, `.original${extname(source).toLowerCase()}`);
    await mkdir(dirname(original), { recursive: true });
    await copyFile(source, original);
    return storeAsset(request, original, ctx, "codex");
  }
}

// Foto milik pengguna (PRD US-15): hanya dari folder yang diizinkan, dan harus gambar.
export class UserUploadAssetProvider implements AssetProvider {
  readonly #files: Record<string, string>;
  readonly #allowedRoots: string[];

  constructor(options: { files: Record<string, string>; allowedRoots: string[] }) {
    this.#files = options.files;
    this.#allowedRoots = options.allowedRoots;
  }

  async generate(request: AssetRequest, ctx: JobContext): Promise<AssetEntry> {
    const file = this.#files[request.id];
    if (!file) throw new Error(`Tidak ada foto pengguna untuk aset "${request.id}"`);
    const real = await realpath(file).catch(() => null);
    if (!real) throw new Error(`Foto pengguna tidak ditemukan: ${file}`);
    const roots = await Promise.all(
      this.#allowedRoots.map((root) => realpath(root).catch(() => null)),
    );
    if (!roots.some((root) => root !== null && inside(root, real))) {
      throw new Error(`Foto pengguna berada di luar folder yang diizinkan: ${file}`);
    }
    const meta = await sharp(real)
      .metadata()
      .catch(() => null);
    if (!meta?.width || !meta.height || !IMAGE_FILE.test(`.${meta.format}`)) {
      throw new Error(`File bukan gambar PNG, JPG, atau WebP: ${file}`);
    }
    return storeAsset(request, real, ctx, "user");
  }
}
