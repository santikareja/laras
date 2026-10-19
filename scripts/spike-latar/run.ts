// Spike T-140: karya latar penuh dari model gambar dengan teks HTML berlapis, memakai plan dan copy
// sembilan job T-127. Per percobaan: art direction (Claude) → lapisan A (Codex) → lapisan B (Codex,
// edit gambar; dihentikan untuk sisa jalan bila percobaan pertama gagal) → zona teks dari piksel →
// render dan QA lewat engine pipeline (satu putaran, tanpa revisi). Setiap langkah disimpan di
// folder job sehingga jalan bisa dilanjutkan. MEMAKAI KUOTA kecuali --dry-run.
//
// Pakai: pnpm spike:latar -- --trials <trials.json> --out <folder> [--dry-run]
//        [--max-claude 18] [--max-codex 19] [--only K1,R3] [--fresh]

import { existsSync } from "node:fs";
import { copyFile, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { parseArgs } from "node:util";
import {
  ArtDirection,
  type AssetManifest,
  BrandKit,
  ContentPlan,
  CopyDraft,
  CopyGuide,
  designLimits,
  type JobSpec,
  LayoutSpec,
  logoVariants,
  QaReport,
  RenderReport,
  type TextZone,
  VisualQa,
} from "../../packages/shared/src/index.ts";
import { runClaude } from "../../packages/sidecar/src/cli/claude.ts";
import { resolveClis } from "../../packages/sidecar/src/cli/resolvePath.ts";
import { type SpawnLines, spawnLines } from "../../packages/sidecar/src/cli/stream.ts";
import {
  ALIGN_LIMIT,
  alignment,
  CodexArtProvider,
  chooseZone,
  cornerTone,
  textInks,
} from "../../packages/sidecar/src/pipeline/art.ts";
import { type AssetEntry, storeAsset } from "../../packages/sidecar/src/pipeline/assets.ts";
import {
  jobDir,
  type PipelineDeps,
  runJob,
  type SlideRenderOutput,
  type StageCall,
} from "../../packages/sidecar/src/pipeline/engine.ts";
import { brandContext, renderPrompt } from "../../packages/sidecar/src/prompts/index.ts";
import { findStyle, styleContext } from "../../packages/sidecar/src/prompts/style-context.ts";
import { renderLayoutHtml } from "../../packages/sidecar/src/render/layout.ts";
import { toMaster, toUpload } from "../../packages/sidecar/src/render/postprocess.ts";
import { createRenderer, SLIDE_SIZE } from "../../packages/sidecar/src/render/renderer.ts";
import { experimentalArchetypes, templates } from "../../packages/templates/src/index.ts";

const ROOT = resolve(import.meta.dirname, "../..");
const MASTER = { width: SLIDE_SIZE.width * 2, height: SLIDE_SIZE.height * 2 };
const CATALOG = [...templates, ...experimentalArchetypes];

type Trial = { id: string; brand: string; job: string };
type Row = {
  id: string;
  job: string;
  style: string | null;
  requestedZone: TextZone;
  zone: TextZone;
  tone: string;
  layerB: string;
  status: string;
  deterministicPassed: boolean | null;
  qaPassed: boolean | null;
  scores: VisualQa["scores"] | null;
  wajib: number;
  failures: string[];
  candidates: string[];
  png: string | null;
};

const { values } = parseArgs({
  args: process.argv.slice(2).filter((arg) => arg !== "--"),
  options: {
    trials: { type: "string" },
    out: { type: "string" },
    "dry-run": { type: "boolean", default: false },
    "max-claude": { type: "string", default: "18" },
    "max-codex": { type: "string", default: "19" },
    only: { type: "string" },
    fresh: { type: "boolean", default: false },
  },
});
if (!values.trials || !values.out) throw new Error("Wajib: --trials <file> --out <folder>");
const dryRun = values["dry-run"] ?? false;
// --fresh: render dan QA diulang walau masukannya sama (mis. setelah template berubah).
const fresh = values.fresh ?? false;
const outDir = resolve(values.out);
const only = values.only?.split(",");
const trials = (JSON.parse(await readFile(resolve(values.trials), "utf8")) as Trial[]).filter(
  (t) => !only || only.includes(t.id),
);
const limits = { claude: Number(values["max-claude"]), codex: Number(values["max-codex"]) };
const calls = { claude: 0, codex: 0 };
const suffix = dryRun ? "-latar-dry" : "-latar";
// Lapisan B dihentikan untuk sisa jalan bila percobaan pertamanya gagal (keputusan pemilik).
const stateFile = join(outDir, dryRun ? "state-dry.json" : "state.json");

await mkdir(outDir, { recursive: true });
const state: { layerB: "belum" | "aktif" | "dihentikan"; reason?: string } = existsSync(stateFile)
  ? JSON.parse(await readFile(stateFile, "utf8"))
  : { layerB: "belum" };
const saveState = () => writeFile(stateFile, `${JSON.stringify(state, null, 2)}\n`);

const counted =
  (name: "claude" | "codex"): SpawnLines =>
  async (file, args, options, onLine) => {
    calls[name]++;
    if (calls[name] > limits[name])
      throw new Error(`Batas panggilan ${name} tercapai (${limits[name]})`);
    return spawnLines(file, args, options, onLine);
  };
const clis = dryRun ? null : await liveClis();
const renderer = createRenderer();
const rows: Row[] = [];

try {
  for (const trial of trials) rows.push(await runTrial(trial));
} finally {
  await renderer.close();
}
await writeFile(
  join(outDir, dryRun ? "hasil-dry.json" : "hasil.json"),
  `${JSON.stringify({ calls, rows }, null, 2)}\n`,
);
console.log(`Selesai: Claude ${calls.claude}, Codex ${calls.codex}. Lapisan B: ${state.layerB}`);

async function runTrial(trial: Trial): Promise<Row> {
  const projectDir = join(ROOT, "out/spike", trial.brand, "project");
  const source = jobDir(projectDir, trial.job);
  const read = async <T>(file: string, parse: (v: unknown) => T) =>
    parse(JSON.parse(await readFile(file, "utf8")));
  const brand = await read(join(projectDir, "brand.json"), (v) => BrandKit.parse(v));
  const copyGuide = await read(join(projectDir, "copy-guide.json"), (v) => CopyGuide.parse(v));
  const knowledge = await readFile(join(projectDir, "knowledge/business.md"), "utf8");
  const base = await read(join(source, "job.json"), (v) => (v as { spec: JobSpec }).spec);
  const plan = await read(join(source, "01-plan.json"), (v) => ContentPlan.parse(v));
  const copy = await read(join(source, "02-copy.json"), (v) => CopyDraft.parse(v));
  const firstLayout = await read(join(source, "03-layout.json"), (v) => LayoutSpec.parse(v));
  const spec: JobSpec = { ...base, id: `${trial.job}${suffix}` };
  const dir = jobDir(projectDir, spec.id);
  await mkdir(join(dir, "assets"), { recursive: true });
  const ctx = { projectDir, jobDir: dir, brand, style: spec.style, setting: plan.setting };
  const log = (line: string) => console.log(`[${trial.id}] ${line}`);

  // 1. Art direction (Claude), disimpan agar jalan bisa dilanjutkan.
  const directionFile = join(dir, "00-art-direction.json");
  const direction = existsSync(directionFile)
    ? await read(directionFile, (v) => ArtDirection.parse(v))
    : await artDirection();
  await writeFile(directionFile, `${JSON.stringify(direction, null, 2)}\n`);
  log(`art direction: zona ${direction.textZone}, subjek ${direction.subject.kind}`);

  // 2. Lapisan A.
  const provider = clis
    ? new CodexArtProvider({ codexPath: clis.codex, spawn: counted("codex") })
    : null;
  const artOriginal = join(dir, "assets", "latar.original.png");
  let art: AssetEntry;
  if (existsSync(join(dir, "assets", "latar.jpg")) && existsSync(artOriginal)) {
    art = await storeAsset(
      { id: "latar", description: direction.image, aspectRatio: "4:5" },
      artOriginal,
      ctx,
      "codex",
    );
  } else if (provider) {
    art = (await provider.art(direction, ctx)).entry;
  } else {
    await copyFile(join(ROOT, "fixtures/demo-assets", trial.brand, "foto.jpg"), artOriginal);
    art = await storeAsset(
      { id: "latar", description: direction.image, aspectRatio: "4:5" },
      artOriginal,
      ctx,
      "codex",
    );
  }
  log("lapisan A siap");

  // 3. Lapisan B: dipakai hanya bila sejajar dengan lapisan A.
  let subject: AssetEntry | null = null;
  let subjectOriginal: string | null = null;
  let layerB = state.layerB === "dihentikan" ? `dihentikan: ${state.reason}` : "tidak dipakai";
  if (state.layerB !== "dihentikan") {
    try {
      const existing = join(dir, "assets", "subjek.original.png");
      const request = {
        id: "subjek",
        description: direction.subject.description,
        aspectRatio: "4:5",
        kind: "cutout" as const,
        subject: direction.subject.kind,
      };
      if (existsSync(existing)) {
        subject = await storeAsset(request, existing, ctx, "codex");
        subjectOriginal = existing;
      } else if (provider) {
        const result = await provider.subject(direction, artOriginal, ctx);
        subject = result.entry;
        subjectOriginal = result.original;
      } else {
        const demo = join(ROOT, "fixtures/demo-assets", trial.brand, "subjek.webp");
        await copyFile(demo, existing);
        subject = await storeAsset(request, existing, ctx, "codex");
        subjectOriginal = existing;
      }
      const fit = await alignment(artOriginal, subjectOriginal);
      if (fit.diff > ALIGN_LIMIT || fit.share < 0.01) {
        throw new Error(
          `subjek tidak sejajar dengan latar (selisih ${fit.diff.toFixed(1)}, luas ${(fit.share * 100).toFixed(1)}%)`,
        );
      }
      layerB = `dipakai (selisih ${fit.diff.toFixed(1)})`;
      if (state.layerB === "belum") state.layerB = "aktif";
    } catch (error) {
      const reason = error instanceof Error ? error.message.slice(0, 200) : String(error);
      subject = null;
      subjectOriginal = null;
      layerB = `gagal: ${reason}`;
      if (state.layerB === "belum") {
        state.layerB = "dihentikan";
        state.reason = reason;
      }
    }
    await saveState();
  }
  log(`lapisan B ${layerB}`);

  // 4. Zona teks dari piksel; kandidat cadangan dicoba bila cek kontras render gagal (tanpa
  // kuota: QA visual hanya berjalan setelah cek kode lolos).
  const choice = await chooseZone(
    artOriginal,
    direction.textZone,
    textInks(brand),
    subjectOriginal ?? undefined,
  );
  log(
    `zona diminta ${direction.textZone}, terpilih ${choice.zone} (${choice.tone}, kontras p10 ${choice.contrast})`,
  );
  const candidates = [
    { zone: choice.zone, tone: choice.tone, contrast: choice.contrast },
    ...choice.fallbacks.slice(0, 3),
  ];
  const slide = copy.slides[0] ?? {};
  const support = slide.subheadline ?? slide.body;
  const available = logoVariants(brand.logo);
  const manifest: AssetManifest = { assets: subject ? [art, subject] : [art] };
  const logoCorner = (zone: TextZone) =>
    brand.constraints?.logoPosition ?? (zone.startsWith("atas") ? "bottom-right" : "top-right");
  const corners: Record<string, "terang" | "gelap"> = {};
  for (const corner of ["top-left", "top-right", "bottom-left", "bottom-right"]) {
    corners[corner] = await cornerTone(artOriginal, corner);
  }
  const layoutFor = (candidate: (typeof candidates)[number]) =>
    LayoutSpec.parse({
      templateId: "feed-latar-penuh",
      format: spec.format,
      slides: [
        {
          slots: {
            latar: { type: "image", assetId: "latar" },
            ...(subject ? { subjek: { type: "image", assetId: "subjek" } } : {}),
            headline: { type: "text", value: slide.headline ?? support ?? "" },
            ...(support && slide.headline ? { body: { type: "text", value: support } } : {}),
            ...(slide.cta ? { cta: { type: "text", value: slide.cta } } : {}),
            logo: {
              type: "logo",
              variant:
                corners[logoCorner(candidate.zone)] === "gelap" && available.includes("onDark")
                  ? "onDark"
                  : "primary",
            },
          },
          options: {
            zona: candidate.zone,
            nada: candidate.tone,
            logo: logoCorner(candidate.zone),
          },
        },
      ],
      assetRequests: [
        { id: "latar", description: direction.image, aspectRatio: "4:5" },
        ...(subject
          ? [
              {
                id: "subjek",
                description: direction.subject.description,
                aspectRatio: "4:5",
                kind: "cutout",
                subject: direction.subject.kind,
              },
            ]
          : []),
      ],
      ...(firstLayout.styleOptions ? { styleOptions: firstLayout.styleOptions } : {}),
    });
  // File langkah 01–04 ditulis bila berubah; render dan QA lama lalu basi dan dihapus.
  const writeInputs = async (layout: LayoutSpec) => {
    let changed = fresh;
    for (const [file, value] of [
      ["01-plan.json", plan],
      ["02-copy.json", copy],
      ["03-layout.json", layout],
      ["04-assets.json", manifest],
    ] as const) {
      const text = `${JSON.stringify(value, null, 2)}\n`;
      const path = join(dir, file);
      if (existsSync(path) && (await readFile(path, "utf8")) === text) continue;
      await writeFile(path, text);
      changed = true;
    }
    if (changed) {
      for (const file of await readdir(dir)) {
        if (/^(0[5-9]|1\d)-/.test(file)) await rm(join(dir, file));
      }
    }
  };

  // 5. Render dan QA lewat engine: satu putaran; revisi dihentikan (spike tanpa revisi).
  const claude: StageCall = async (stage, prompt, schema) => {
    if (stage !== "qa-visual") throw new Error(`Spike berhenti sebelum ${stage}`);
    if (!clis) return { data: schema.parse(dryVisual()) };
    const run = await runClaude({
      claudePath: clis.claude,
      cwd: projectDir,
      prompt,
      schema,
      spawn: counted("claude"),
    });
    return { data: run.data, costUsd: run.costUsd };
  };
  const deps: PipelineDeps = {
    projectDir,
    brand,
    copyGuide,
    knowledge,
    catalog: CATALOG.map((t) => t.meta),
    claude,
    assetsFor: () => {
      throw new Error("Aset spike sudah tersimpan");
    },
    render: async (spec, assets, jobDirectory, style) => {
      const pages = renderLayoutHtml(spec, {
        brand,
        assets,
        templates: CATALOG,
        ...(style ? { style } : {}),
      });
      const design = style ? designLimits(findStyle(style.id), style.variant) : undefined;
      const slides: SlideRenderOutput[] = [];
      for (const html of pages) {
        const { png, checks } = await renderer.render(
          html,
          { projectDir, jobDir: jobDirectory },
          { brand, copyGuide, ...(design ? { design } : {}) },
        );
        slides.push({ png: await toMaster(png), html, ...MASTER, checks });
      }
      return slides;
    },
  };
  const LAYOUT_RULES = new Set(["contrast", "safe-margin"]);
  let used = candidates[0] ?? { zone: choice.zone, tone: choice.tone, contrast: choice.contrast };
  let result: Awaited<ReturnType<typeof runJob>> | null = null;
  let qa: QaReport | null = null;
  const tried: string[] = [];
  for (const candidate of candidates) {
    used = candidate;
    await writeInputs(layoutFor(candidate));
    result = await runJob(spec, deps);
    qa = await read(join(dir, "06-qa.json"), (v) => QaReport.parse(v)).catch(() => null);
    const failed = qa?.deterministic.failures ?? [];
    tried.push(
      `${candidate.zone}/${candidate.tone}: ${failed.length === 0 ? "lolos" : failed.map((f) => f.rule).join(",")}`,
    );
    // Lanjut ke kandidat berikutnya hanya bila semua kegagalan kode bisa diatasi letak dan nada.
    if (failed.length === 0 || !failed.every((f) => LAYOUT_RULES.has(f.rule))) break;
  }
  log(`kandidat: ${tried.join(" | ")}`);
  const render = await read(join(dir, "05-render.json"), (v) => RenderReport.parse(v)).catch(
    () => null,
  );
  let png: string | null = null;
  const first = render?.slides[0];
  if (first) {
    png = join(outDir, `${trial.id}${dryRun ? "-dry" : ""}.png`);
    await writeFile(png, await toUpload(await readFile(join(dir, first.pngPath)), "png"));
  }
  log(
    `QA kode ${qa?.deterministic.passed ? "lolos" : "gagal"}, QA ${qa?.passed ? "lolos" : "gagal"}`,
  );
  return {
    id: trial.id,
    job: spec.id,
    style: spec.style ? `${spec.style.id}/${spec.style.variant}` : null,
    requestedZone: direction.textZone,
    zone: used.zone,
    tone: used.tone,
    layerB,
    status:
      result?.status === "failed" && result.error?.startsWith("Spike berhenti")
        ? "selesai"
        : (result?.status ?? "gagal"),
    deterministicPassed: qa?.deterministic.passed ?? null,
    qaPassed: qa?.passed ?? null,
    scores: qa?.visual?.scores ?? null,
    wajib: qa?.fixes.filter((f) => f.severity === "wajib").length ?? 0,
    failures: (qa?.deterministic.failures ?? []).map(
      (c) => `${c.rule} ${c.target ?? ""}: ${c.message}`,
    ),
    candidates: tried,
    png,
  };

  async function artDirection(): Promise<ArtDirection> {
    if (!clis) return dryDirection();
    const { primary, secondary, accent } = brand.colors;
    const prompt = renderPrompt("art-direction", {
      brand: brandContext(brand, copyGuide),
      knowledge,
      style: styleContext(spec.style, brand, "layout"),
      plan: JSON.stringify(
        { keyMessage: plan.keyMessage, audience: plan.audience, setting: plan.setting },
        null,
        2,
      ),
      angle: JSON.stringify(plan.angles[0], null, 2),
      copy: JSON.stringify(slide0(copy), null, 2),
      palette: `primary ${primary}, secondary ${secondary}, accent ${accent}`,
    });
    const run = await runClaude({
      claudePath: clis.claude,
      cwd: projectDir,
      prompt,
      schema: ArtDirection,
      spawn: counted("claude"),
    });
    return run.data;
  }
}

function slide0(copy: CopyDraft) {
  return copy.slides[0] ?? {};
}

// Jawaban dry-run: art direction tetap dan QA visual netral.
function dryDirection(): ArtDirection {
  return ArtDirection.parse({
    idea: "Dry-run: foto demo brand sebagai latar.",
    image:
      "Dry-run placeholder brief: the brand demo photograph fills the frame, calm upper third kept free for the headline, no text anywhere.",
    textZone: "atas-kiri",
    subject: { description: "the main subject of the demo photo", kind: "person" },
  });
}
function dryVisual() {
  const scores = {
    idea: 7,
    typography: 7,
    interlock: 6,
    brand: 7,
    hierarchy: 7,
    balance: 7,
    readability: 8,
    professionalism: 7,
  };
  return VisualQa.parse({ scores, summary: "Dry-run.", fixes: [] });
}

async function liveClis() {
  const statuses = await resolveClis();
  const path = (name: "claude" | "codex") => {
    const status = statuses.find((s) => s.name === name);
    if (!status?.found) throw new Error(`${name} tidak ditemukan`);
    if (!status.loggedIn) throw new Error(`${name} belum login`);
    return status.path;
  };
  return { claude: path("claude"), codex: path("codex") };
}
