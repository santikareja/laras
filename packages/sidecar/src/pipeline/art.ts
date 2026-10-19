import { copyFile, mkdir, readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, extname, join } from "node:path";
import type { ArtDirection, BrandKit, ContentPlan, StyleSelection, TextZone } from "@laras/shared";
import { TEXT_ZONES } from "@laras/templates";
import sharp from "sharp";
import { runCodex } from "../cli/codex.ts";
import type { SpawnLines } from "../cli/stream.ts";
import { styleImageDirection } from "../prompts/style-context.ts";
import {
  type AssetEntry,
  generatedImage,
  type JobContext,
  photoRules,
  settingLine,
  storeAsset,
} from "./assets.ts";

// Spike T-140: karya latar penuh dari model gambar (lapisan A), subjek yang diambil dari gambar
// yang sama lewat edit gambar (lapisan B), dan pemilihan zona teks dari piksel. Teks tetap HTML
// (PRD 4 prinsip 1); gambar tidak pernah diminta memuat tulisan.

const ZONE_WORDS: Record<TextZone, string> = {
  "atas-kiri": "upper-left third",
  "atas-tengah": "upper third, centered",
  "atas-kanan": "upper-right third",
  "bawah-kiri": "lower-left third",
  "bawah-tengah": "lower third, centered",
  "bawah-kanan": "lower-right third",
};

const PROMPTS = {
  art: new URL("../prompts/asset-art.md", import.meta.url),
  extract: new URL("../prompts/asset-extract.md", import.meta.url),
};

// Isi dari output AI dibuang tag delimiternya agar tidak bisa menutup blok data lebih awal.
const data = (value: string, tag: string) =>
  value.replace(new RegExp(`</?${tag}>`, "gi"), "").trim();

async function fill(file: URL, values: Record<string, string>) {
  const template = await readFile(file, "utf8");
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = values[key];
    if (value === undefined) throw new Error(`Placeholder prompt tidak dikenal: ${key}`);
    return value;
  });
}

const LATAR = { id: "latar", description: "Karya latar penuh", aspectRatio: "4:5" } as const;

export function artPrompt(
  direction: ArtDirection,
  brand: BrandKit,
  style: StyleSelection | null,
  setting: ContentPlan["setting"] | undefined,
) {
  const { primary, secondary, accent } = brand.colors;
  return fill(PROMPTS.art, {
    brief: data(direction.image, "brief"),
    zone: ZONE_WORDS[direction.textZone],
    palette: `primary ${primary}, secondary ${secondary}, accent ${accent}`,
    setting: settingLine(setting, LATAR),
    styleDirection: styleImageDirection(style),
    photoRules: photoRules(brand, LATAR),
  });
}

export function extractPrompt(direction: ArtDirection) {
  return fill(PROMPTS.extract, { subject: data(direction.subject.description, "subject") });
}

export class CodexArtProvider {
  readonly #codexPath: string;
  readonly #codexHome: string;
  readonly #spawn: SpawnLines | undefined;

  constructor(options: { codexPath: string; codexHome?: string; spawn?: SpawnLines }) {
    this.#codexPath = options.codexPath;
    this.#codexHome = options.codexHome ?? process.env.CODEX_HOME ?? join(homedir(), ".codex");
    this.#spawn = options.spawn;
  }

  // Satu panggilan Codex; gambar asli disalin ke folder aset job sebagai <id>.original.<ext>.
  async #generate(id: string, prompt: string, ctx: JobContext, images: string[] = []) {
    const run = await runCodex({
      codexPath: this.#codexPath,
      cwd: ctx.projectDir,
      prompt,
      images,
      ...(ctx.signal ? { signal: ctx.signal } : {}),
      ...(this.#spawn ? { spawn: this.#spawn } : {}),
    });
    const source = await generatedImage(this.#codexHome, run.threadId);
    const original = join(ctx.jobDir, "assets", `${id}.original${extname(source).toLowerCase()}`);
    await mkdir(dirname(original), { recursive: true });
    await copyFile(source, original);
    return original;
  }

  // Lapisan A: karya latar penuh 4:5.
  async art(
    direction: ArtDirection,
    ctx: JobContext,
  ): Promise<{ entry: AssetEntry; original: string }> {
    const prompt = await artPrompt(direction, ctx.brand, ctx.style ?? null, ctx.setting);
    const original = await this.#generate(LATAR.id, prompt, ctx);
    const entry = await storeAsset(
      { ...LATAR, description: direction.image },
      original,
      ctx,
      "codex",
    );
    return { entry, original };
  }

  // Lapisan B: subjek dari gambar latar yang dilampirkan, berlatar transparan.
  async subject(
    direction: ArtDirection,
    art: string,
    ctx: JobContext,
  ): Promise<{ entry: AssetEntry; original: string }> {
    const original = await this.#generate("subjek", await extractPrompt(direction), ctx, [art]);
    const request = {
      id: "subjek",
      description: direction.subject.description,
      aspectRatio: "4:5",
      kind: "cutout" as const,
      subject: direction.subject.kind,
    };
    return { entry: await storeAsset(request, original, ctx, "codex"), original };
  }
}

// Gambar kecil RGBA untuk pengukuran (lebar 216 px, rasio asli dipertahankan oleh fill 4:5).
const SAMPLE = { width: 216, height: 270 };
async function sample(file: string) {
  const { data: pixels } = await sharp(file)
    .resize(SAMPLE.width, SAMPLE.height, { fit: "fill" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return pixels;
}
const luminance = (r: number, g: number, b: number) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

// Kecocokan posisi subjek dengan latar: selisih RGB rata-rata (0–255) di piksel subjek yang
// pekat. Edit gambar bisa menggeser atau menggambar ulang subjek; di atas ambang, lapisan B
// tidak dipakai agar tidak muncul kontur ganda.
export const ALIGN_LIMIT = 24;
export async function alignment(
  art: string,
  subject: string,
): Promise<{ diff: number; share: number }> {
  const [a, s] = await Promise.all([sample(art), sample(subject)]);
  let total = 0;
  let count = 0;
  for (let i = 0; i < s.length; i += 4) {
    if ((s[i + 3] ?? 0) < 250) continue;
    total +=
      (Math.abs((s[i] ?? 0) - (a[i] ?? 0)) +
        Math.abs((s[i + 1] ?? 0) - (a[i + 1] ?? 0)) +
        Math.abs((s[i + 2] ?? 0) - (a[i + 2] ?? 0))) /
      3;
    count++;
  }
  const pixels = SAMPLE.width * SAMPLE.height;
  return { diff: count > 0 ? total / count : 255, share: count / pixels };
}

export type ZoneChoice = {
  zone: TextZone;
  tone: "terang" | "gelap";
  // Simpangan baku luminans (0–255) di setiap zona; kecil berarti tenang.
  calm: Record<TextZone, number>;
  // Kontras persentil-10 warna teks terpilih terhadap piksel zona terpilih.
  contrast: number;
  // Kandidat cadangan (zona dan nada) berurutan dari kontras tertinggi, dicoba bila cek kontras
  // render gagal karena teks hanya menempati sebagian zona.
  fallbacks: { zone: TextZone; tone: "terang" | "gelap"; contrast: number }[];
};

// Warna teks terang dan gelap brand (token neutral-light dan neutral-dark, ARCH 6.1).
export function textInks(brand: BrandKit) {
  const neutrals = Object.entries(brand.colors.neutral).sort(([a], [b]) => Number(a) - Number(b));
  return { terang: neutrals.at(0)?.[1] ?? "#FFFFFF", gelap: neutrals.at(-1)?.[1] ?? "#000000" };
}

// Luminans relatif WCAG dari kanal sRGB 0–255.
const channel = (value: number) => {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
const relative = (r: number, g: number, b: number) =>
  0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
const hexLuminance = (hex: string) => {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  return relative((n >> 16) & 255, (n >> 8) & 255, n & 255);
};
const ratio = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

// Zona teks: zona yang diminta dipakai bila tenang (simpangan baku luminans ≤ CALM_LIMIT atau
// paling banyak 1,25× zona tertenang) dan terbaca (kontras persentil-10 warna teks terbaiknya
// ≥ READABLE, ambang teks body PRD F9). Bila tidak, zona dengan kontras terbaik. Piksel subjek
// (lapisan B) tidak dihitung karena subjek memang boleh menimpa headline. Nada teks adalah warna
// teks brand dengan kontras persentil-10 tertinggi.
export const CALM_LIMIT = 28;
export const READABLE = 4.5;
export async function chooseZone(
  art: string,
  requested: TextZone,
  inks: { terang: string; gelap: string },
  subject?: string,
): Promise<ZoneChoice> {
  const pixels = await sample(art);
  const mask = subject ? await sample(subject) : null;
  const ink = { terang: hexLuminance(inks.terang), gelap: hexLuminance(inks.gelap) };
  const p10 = (values: number[]) =>
    values.sort((a, b) => a - b)[Math.floor(values.length * 0.1)] ?? 1;
  const stats = (zone: TextZone) => {
    const box = TEXT_ZONES[zone];
    const luma: number[] = [];
    const light: number[] = [];
    const dark: number[] = [];
    for (
      let y = Math.floor(box.top * SAMPLE.height);
      y < Math.ceil(box.bottom * SAMPLE.height);
      y++
    ) {
      for (
        let x = Math.floor(box.left * SAMPLE.width);
        x < Math.ceil(box.right * SAMPLE.width);
        x++
      ) {
        const i = (y * SAMPLE.width + x) * 4;
        if (mask && (mask[i + 3] ?? 0) > 128) continue;
        const [r, g, b] = [pixels[i] ?? 0, pixels[i + 1] ?? 0, pixels[i + 2] ?? 0];
        luma.push(luminance(r, g, b));
        const l = relative(r, g, b);
        light.push(ratio(ink.terang, l));
        dark.push(ratio(ink.gelap, l));
      }
    }
    const mean = luma.reduce((a, v) => a + v, 0) / Math.max(1, luma.length);
    const sd = Math.sqrt(luma.reduce((a, v) => a + (v - mean) ** 2, 0) / Math.max(1, luma.length));
    const contrast = { terang: p10(light), gelap: p10(dark) };
    const tone: "terang" | "gelap" = contrast.terang >= contrast.gelap ? "terang" : "gelap";
    return { sd: luma.length > 0 ? sd : 255, tone, contrast: contrast[tone], both: contrast };
  };
  const zones = Object.keys(TEXT_ZONES) as TextZone[];
  const measured = Object.fromEntries(zones.map((z) => [z, stats(z)])) as Record<
    TextZone,
    ReturnType<typeof stats>
  >;
  const minSd = Math.min(...zones.map((z) => measured[z].sd));
  const wanted = measured[requested];
  const keep =
    (wanted.sd <= CALM_LIMIT || wanted.sd <= minSd * 1.25) && wanted.contrast >= READABLE;
  const zone = keep
    ? requested
    : zones.reduce((best, z) =>
        measured[z].contrast > measured[best].contrast ||
        (measured[z].contrast === measured[best].contrast && measured[z].sd < measured[best].sd)
          ? z
          : best,
      );
  const round = (value: number) => Math.round(value * 100) / 100;
  const fallbacks = zones
    .flatMap((z) =>
      (["terang", "gelap"] as const).map((tone) => ({
        zone: z,
        tone,
        contrast: round(measured[z].both[tone]),
      })),
    )
    .filter((c) => c.contrast >= 3 && !(c.zone === zone && c.tone === measured[zone].tone))
    .sort((a, b) => b.contrast - a.contrast);
  return {
    zone,
    tone: measured[zone].tone,
    fallbacks,
    calm: Object.fromEntries(zones.map((z) => [z, Math.round(measured[z].sd)])) as Record<
      TextZone,
      number
    >,
    contrast: round(measured[zone].contrast),
  };
}

// Nada latar di sudut logo (kotak 22% × 12% dari tepi): varian logo `onDark` untuk sudut gelap.
// Logo duduk di luar zona teks, jadi nadanya diukur sendiri, bukan diambil dari nada teks.
export async function cornerTone(art: string, corner: string): Promise<"terang" | "gelap"> {
  const pixels = await sample(art);
  const width = Math.round(SAMPLE.width * 0.22);
  const height = Math.round(SAMPLE.height * 0.12);
  const x0 = corner.endsWith("left") ? 0 : SAMPLE.width - width;
  const y0 = corner.startsWith("top") ? 0 : SAMPLE.height - height;
  let sum = 0;
  for (let y = y0; y < y0 + height; y++) {
    for (let x = x0; x < x0 + width; x++) {
      const i = (y * SAMPLE.width + x) * 4;
      sum += luminance(pixels[i] ?? 0, pixels[i + 1] ?? 0, pixels[i + 2] ?? 0);
    }
  }
  return sum / (width * height) > 140 ? "terang" : "gelap";
}
