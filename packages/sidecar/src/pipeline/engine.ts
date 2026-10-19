import {
  appendFile,
  copyFile,
  mkdir,
  readdir,
  readFile,
  rename,
  stat,
  writeFile,
} from "node:fs/promises";
import { join } from "node:path";
import {
  AssetManifest,
  type BrandKit,
  type ContentPlan,
  type CopyDraft,
  type CopyGuide,
  isBlocking,
  JobEvent,
  type JobSpec,
  type JobStage,
  JobState,
  type JobStatus,
  LayoutSpec,
  QaReport,
  type RenderCheck,
  RenderReport,
  type StyleChoice,
  type TemplateMeta,
  VisualQa,
} from "@laras/shared";
import type { z } from "zod";
import { LimitReachedError } from "../cli/limits.ts";
import { brandContext, renderPrompt, type Stage } from "../prompts/index.ts";
import { findStyle, type StyleStage, styleContext } from "../prompts/style-context.ts";
import { buildRenderReport } from "../render/qa/report.ts";
import type { AssetProvider } from "./assets.ts";
import { logoPreviews } from "./logo-preview.ts";
import {
  bestQa,
  catalogFor,
  catalogForStyle,
  copySchema,
  layoutSchema,
  planSchema,
  qaReport,
  revisionSchema,
} from "./stages.ts";

// Engine pipeline (ARCH 5.1, 5.4; PRD F7). Satu job = satu varian. Setiap langkah menulis
// jobs/<job-id>/<nn>-<tahap>.json; resume mengulang langkah dari file. Revisi maksimal 1 putaran
// masuk ulang di assets (revise menghasilkan copy dan layout baru sekaligus); hasil akhir job adalah
// putaran terbaik, bukan selalu yang terakhir (T-137).

export type StageCall = <T>(
  stage: Stage,
  prompt: string,
  schema: z.ZodType<T>,
) => Promise<{ data: T; costUsd?: number }>;

export type SlideRenderOutput = {
  png: Buffer;
  html: string;
  width: number;
  height: number;
  checks: RenderCheck[];
};

export type PipelineDeps = {
  projectDir: string;
  brand: BrandKit;
  copyGuide: CopyGuide;
  knowledge: string;
  catalog: TemplateMeta[];
  claude: StageCall;
  assetsFor: (spec: JobSpec) => AssetProvider;
  // `style`: gaya job beserta styleOptions layout (T-133); undefined tanpa gaya.
  render: (
    layout: LayoutSpec,
    assets: AssetManifest,
    jobDir: string,
    style: StyleChoice | undefined,
  ) => Promise<SlideRenderOutput[]>;
  signal?: AbortSignal;
  onEvent?: (jobId: string, event: JobEvent) => void;
  now?: () => Date;
};

export type JobResult = {
  jobId: string;
  status: JobStatus;
  qa: QaReport | null;
  error: string | null;
};

// Satu putaran revisi (keputusan pemilik T-137): di T-127 putaran kedua tidak memperbaiki hasil dan
// membuat job melewati target 5 menit (PRD 3).
export const MAX_ROUNDS = 1;

type Step = { n: number; stage: JobStage; round: number };

export function jobSteps(): Step[] {
  const steps: Step[] = [];
  const first = ["plan", "copy", "layout", "assets", "render", "qa"] as const;
  for (const stage of first) steps.push({ n: steps.length + 1, stage, round: 0 });
  for (let round = 1; round <= MAX_ROUNDS; round++) {
    for (const stage of ["revise", "assets", "render", "qa"] as const) {
      steps.push({ n: steps.length + 1, stage, round });
    }
  }
  return steps;
}

export const stepFile = (step: Step) => `${String(step.n).padStart(2, "0")}-${step.stage}.json`;
// Langkah suatu tahap pada putaran tertentu, untuk membaca hasil putaran terbaik (T-137).
export const stepOf = (stage: JobStage, round: number) =>
  jobSteps().find((step) => step.stage === stage && step.round === round);
export const jobDir = (projectDir: string, jobId: string) => join(projectDir, "jobs", jobId);

// Hasil kerja yang sedang berlaku selama langkah diputar ulang.
type Working = {
  plan?: ContentPlan;
  copy?: CopyDraft;
  layout?: LayoutSpec;
  assets?: AssetManifest;
  render?: RenderReport;
  qa?: QaReport;
  // Laporan QA setiap putaran, untuk memilih putaran terbaik di akhir job.
  rounds: QaReport[];
  regenerate: Set<string>;
};

export async function runJob(spec: JobSpec, deps: PipelineDeps): Promise<JobResult> {
  const dir = jobDir(deps.projectDir, spec.id);
  await mkdir(dir, { recursive: true });
  const now = () => (deps.now ?? (() => new Date()))().toISOString();
  const work: Working = { rounds: [], regenerate: new Set() };
  let current: Step | null = null;
  let fresh = false; // setelah satu langkah dijalankan ulang, file langkah sesudahnya basi
  try {
    for (const step of jobSteps()) {
      if (step.stage === "revise" && work.qa?.passed) break;
      const saved = fresh ? undefined : await readStep(dir, step, spec, deps, work);
      if (saved !== undefined) {
        apply(work, step.stage, saved);
        continue;
      }
      current = step;
      fresh = true;
      await saveState(dir, spec, step.stage, null, null, now());
      const started = Date.now();
      await recordEvent(dir, spec.id, deps, {
        at: now(),
        step: step.n,
        stage: step.stage,
        type: "started",
      });
      const { output, costUsd } = await runStep(step, spec, deps, work, dir);
      await writeJson(join(dir, stepFile(step)), output);
      apply(work, step.stage, output);
      await recordEvent(dir, spec.id, deps, {
        at: now(),
        step: step.n,
        stage: step.stage,
        type: "completed",
        durationMs: Date.now() - started,
        ...(costUsd !== undefined ? { costUsd } : {}),
      });
      current = null;
    }
    await saveState(dir, spec, "done", null, null, now());
    return { jobId: spec.id, status: "done", qa: bestQa(work.rounds), error: null };
  } catch (error) {
    // Detail (mis. stderr ClaudeRunError/CodexRunError) ikut dicatat agar penyebab terbaca.
    const detail =
      error instanceof Error &&
      "detail" in error &&
      typeof error.detail === "string" &&
      error.detail
        ? `: ${error.detail.slice(0, 500)}`
        : "";
    const message = error instanceof Error ? `${error.message}${detail}` : String(error);
    const status: JobStatus =
      error instanceof LimitReachedError
        ? "waiting_quota"
        : deps.signal?.aborted
          ? "cancelled"
          : "failed";
    const resumeAt =
      error instanceof LimitReachedError ? (error.resetsAt?.toISOString() ?? null) : null;
    if (current) {
      await recordEvent(dir, spec.id, deps, {
        at: now(),
        step: current.n,
        stage: current.stage,
        type: "failed",
        message: message || "Gagal",
      });
    }
    await saveState(dir, spec, status, message || "Gagal", resumeAt, now());
    return { jobId: spec.id, status, qa: work.qa ?? null, error: message || "Gagal" };
  }
}

// Brief dengan N varian: plan dijalankan sekali (di job pertama) lalu disalin ke job lain,
// masing-masing memakai angle sesuai nomor variannya.
export type BriefInput = Omit<JobSpec, "id" | "variant">;

export async function runBrief(input: BriefInput, deps: PipelineDeps): Promise<JobResult[]> {
  const specs = Array.from(
    { length: input.variantCount },
    (_, i): JobSpec => ({
      ...input,
      id: `${input.briefId}-v${i + 1}`,
      variant: i + 1,
    }),
  );
  const results: JobResult[] = [];
  for (const spec of specs) {
    await sharePlan(spec, specs, deps);
    const result = await runJob(spec, deps);
    results.push(result);
    if (result.status === "waiting_quota" || result.status === "cancelled") break;
  }
  return results;
}

async function sharePlan(spec: JobSpec, specs: JobSpec[], deps: PipelineDeps) {
  const file = stepFile({ n: 1, stage: "plan", round: 0 });
  const target = join(jobDir(deps.projectDir, spec.id), file);
  if (await validJson(target, planSchema(spec))) return;
  for (const other of specs) {
    const source = join(jobDir(deps.projectDir, other.id), file);
    if (other.id !== spec.id && (await validJson(source, planSchema(spec)))) {
      await mkdir(jobDir(deps.projectDir, spec.id), { recursive: true });
      await copyFile(source, target);
      return;
    }
  }
}

async function runStep(
  step: Step,
  spec: JobSpec,
  deps: PipelineDeps,
  work: Working,
  dir: string,
): Promise<{ output: unknown; costUsd?: number }> {
  const brand = brandContext(deps.brand, deps.copyGuide);
  const catalog = jobCatalog(spec, deps);
  const style = (stage: StyleStage) => styleContext(spec.style, deps.brand, stage);
  const json = (value: unknown) => JSON.stringify(value, null, 2);
  const need = <T>(value: T | undefined, name: string): T => {
    if (value === undefined) throw new Error(`Tahap ${step.stage} butuh ${name}`);
    return value;
  };
  const angle = () => need(work.plan, "plan").angles[spec.variant - 1];
  const ask = async <T>(stage: Stage, prompt: string, schema: z.ZodType<T>) => {
    const { data, costUsd } = await deps.claude(stage, prompt, schema);
    return { output: data, ...(costUsd !== undefined ? { costUsd } : {}) };
  };

  switch (step.stage) {
    case "plan":
      return ask(
        "plan",
        renderPrompt("plan", {
          brief: spec.brief,
          brand,
          knowledge: deps.knowledge,
          format: spec.format,
          slideCount: String(spec.slideCount),
          variantCount: String(spec.variantCount),
          style: style("plan"),
        }),
        planSchema(spec),
      );
    case "copy": {
      const plan = need(work.plan, "plan");
      const prompt = renderPrompt("copy", {
        brief: spec.brief,
        brand,
        knowledge: deps.knowledge,
        plan: json(plan),
        angle: json(angle()),
        style: style("copy"),
      });
      return ask("copy", prompt, copySchema(plan));
    }
    case "layout": {
      const userAssets = Object.keys(spec.userAssets);
      const prompt = renderPrompt("layout", {
        brand,
        copy: json(need(work.copy, "copy")),
        angle: json(angle()),
        catalog: json(catalog),
        templatePreference: spec.templatePreference ?? "Tidak ada preferensi",
        usedTemplates: await usedTemplates(spec, deps),
        userAssets: userAssets.length > 0 ? userAssets.join(", ") : "Tidak ada",
        setting: json(need(work.plan, "plan").setting),
        style: style("layout"),
      });
      return ask("layout", prompt, layoutSchema(layoutContext(spec, deps, catalog)));
    }
    case "assets":
      return { output: await produceAssets(spec, deps, work, dir) };
    case "render":
      return { output: await renderSlides(step, spec, deps, work, dir) };
    case "qa":
      return runQa(step, spec, deps, work, brand, style("qa-visual"));
    case "revise": {
      const prompt = renderPrompt("revise", {
        brand,
        copy: json(need(work.copy, "copy")),
        layout: json(need(work.layout, "layout")),
        catalog: json(catalog),
        fixes: json(fixesForRevision(need(work.qa, "qa"))),
        style: style("revise"),
      });
      return ask("revise", prompt, reviseSchema(spec, deps, work, catalog));
    }
  }
}

// Perbaikan wajib saja bila ada, agar saran selera tidak ikut mengubah bagian lain; bila QA
// gagal karena skor tanpa perbaikan wajib, semua perbaikan dikirim (T-118).
function fixesForRevision(qa: QaReport) {
  const required = qa.fixes.filter((fix) => fix.severity === "wajib");
  return required.length > 0 ? required : qa.fixes;
}

// Gambar hanya boleh dibuat ulang bila ada perbaikan bertarget assets yang dikirim ke revisi (T-137).
const reviseSchema = (spec: JobSpec, deps: PipelineDeps, work: Working, catalog: TemplateMeta[]) =>
  revisionSchema(
    layoutContext(spec, deps, catalog),
    work.qa ? fixesForRevision(work.qa).some((fix) => fix.target === "assets") : true,
  );

// Aset lama dipakai ulang kecuali diminta dibuat ulang lewat revise atau belum ada.
async function produceAssets(spec: JobSpec, deps: PipelineDeps, work: Working, dir: string) {
  const layout = work.layout;
  if (!layout) throw new Error("Tahap assets butuh layout");
  const provider = deps.assetsFor(spec);
  const assets: AssetManifest["assets"] = [];
  for (const request of layout.assetRequests) {
    const previous = work.assets?.assets.find((a) => a.id === request.id);
    if (previous && !work.regenerate.has(request.id) && (await exists(join(dir, previous.path)))) {
      assets.push(previous);
      continue;
    }
    const ctx = {
      projectDir: deps.projectDir,
      jobDir: dir,
      brand: deps.brand,
      style: spec.style,
      ...(work.plan ? { setting: work.plan.setting } : {}),
    };
    assets.push(
      await provider.generate(request, deps.signal ? { ...ctx, signal: deps.signal } : ctx),
    );
  }
  return AssetManifest.parse({ assets });
}

async function renderSlides(
  step: Step,
  spec: JobSpec,
  deps: PipelineDeps,
  work: Working,
  dir: string,
) {
  const { layout, assets } = work;
  if (!layout || !assets) throw new Error("Tahap render butuh layout dan aset");
  const style = spec.style ? { ...spec.style, options: layout.styleOptions ?? {} } : undefined;
  const slides = await deps.render(layout, assets, dir, style);
  await mkdir(join(dir, "slides"), { recursive: true });
  const prefix = String(step.n).padStart(2, "0");
  const rendered = [];
  for (const [index, slide] of slides.entries()) {
    const base = `slides/${prefix}-${index + 1}`;
    await writeFile(join(dir, `${base}.png`), slide.png);
    await writeFile(join(dir, `${base}.html`), slide.html);
    rendered.push({
      htmlPath: `${base}.html`,
      pngPath: `${base}.png`,
      width: slide.width,
      height: slide.height,
      checks: slide.checks,
    });
  }
  return buildRenderReport(rendered);
}

// QA visual hanya bila cek deterministik lolos (hemat kuota; keputusan pemilik).
async function runQa(
  step: Step,
  spec: JobSpec,
  deps: PipelineDeps,
  work: Working,
  brand: string,
  style: string,
) {
  const render = work.render;
  if (!render) throw new Error("Tahap qa butuh hasil render");
  const deterministicPassed = render.slides.every((s) => !s.checks.some(isBlocking));
  if (!deterministicPassed) return { output: qaReport(step.round, render, null) };
  const dir = jobDir(deps.projectDir, spec.id);
  const prompt = renderPrompt("qa-visual", {
    brand,
    knowledge: deps.knowledge,
    copy: JSON.stringify(work.copy, null, 2),
    layout: JSON.stringify(work.layout, null, 2),
    deterministic: deterministicSummary(render),
    references: await referenceImages(deps.projectDir),
    logo:
      (await logoPreviews(deps.projectDir, dir, deps.brand)).join("\n") || "Logo tidak tersedia.",
    slides: render.slides.map((s) => `jobs/${spec.id}/${s.pngPath}`).join("\n"),
    style,
  });
  const { data, costUsd } = await deps.claude("qa-visual", prompt, VisualQa);
  return {
    output: qaReport(step.round, render, data),
    ...(costUsd !== undefined ? { costUsd } : {}),
  };
}

// Hasil kode untuk QA visual (T-126): cek wajib sudah lolos; saran desain terukur (T-130) dan aturan
// brand terstruktur (T-124) disertakan agar tidak dinilai atau dilaporkan dua kali.
function deterministicSummary(render: RenderReport): string {
  const brandRules = new Set(["brand-logo-position", "brand-gradient", "brand-visuals"]);
  const lines = ["Semua cek wajib kode lolos (kontras, overflow, safe margin, font, warna, aset)."];
  const enforced = [
    ...new Set(
      render.slides.flatMap((s) => s.checks.map((c) => c.rule)).filter((r) => brandRules.has(r)),
    ),
  ];
  if (enforced.length > 0)
    lines.push(`Aturan brand terstruktur dicek dan lolos: ${enforced.join(", ")}.`);
  const advice = render.slides.flatMap((slide) =>
    slide.checks
      .filter((c) => !c.passed && !isBlocking(c))
      .map(
        (c) =>
          `- slide ${slide.index + 1}, ${c.rule}${c.target ? ` ${c.target}` : ""}: ${c.message}`,
      ),
  );
  lines.push(
    advice.length > 0 ? "Saran desain terukur:" : "Tidak ada saran desain terukur.",
    ...advice,
  );
  return lines.join("\n");
}

// Gambar referensi project (ARCH 8.1, folder references/), relatif terhadap folder project.
async function referenceImages(projectDir: string): Promise<string> {
  const files = await readdir(join(projectDir, "references")).catch(() => [] as string[]);
  const images = files
    .filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
    .sort()
    .slice(0, 6);
  return images.length > 0
    ? images.map((f) => `references/${f}`).join("\n")
    : "Tidak ada referensi visual.";
}

function apply(work: Working, stage: JobStage, output: unknown) {
  switch (stage) {
    case "plan":
      work.plan = output as ContentPlan;
      break;
    case "copy":
      work.copy = output as CopyDraft;
      break;
    case "layout":
      work.layout = output as LayoutSpec;
      break;
    case "assets":
      work.assets = output as AssetManifest;
      work.regenerate = new Set();
      break;
    case "render":
      work.render = output as RenderReport;
      break;
    case "qa":
      work.qa = output as QaReport;
      work.rounds.push(work.qa);
      break;
    case "revise": {
      const revision = output as {
        copy: CopyDraft;
        layout: LayoutSpec;
        regenerateAssets: string[];
      };
      work.copy = revision.copy;
      work.layout = revision.layout;
      work.regenerate = new Set(revision.regenerateAssets);
      break;
    }
  }
}

// Konteks validasi layout dan revisi: katalog format job, jumlah slide, dan logo Brand Kit.
// Arketipe yang sudah dipilih varian sebelumnya dari brief yang sama (PRD 4 K6, T-131), dibaca
// dari file langkah layout mereka agar tetap benar saat job dilanjutkan.
async function usedTemplates(spec: JobSpec, deps: PipelineDeps): Promise<string> {
  const used: string[] = [];
  const file = stepFile({ n: 3, stage: "layout", round: 0 });
  for (let variant = 1; variant < spec.variant; variant++) {
    const sibling = `${spec.briefId}-v${variant}`;
    const layout = await validJson(join(jobDir(deps.projectDir, sibling), file), LayoutSpec);
    if (layout && !used.includes(layout.templateId)) used.push(layout.templateId);
  }
  return used.length > 0 ? used.join(", ") : "Belum ada";
}

const layoutContext = (spec: JobSpec, deps: PipelineDeps, catalog: TemplateMeta[]) => ({
  catalog,
  slideCount: spec.slideCount,
  logo: deps.brand.logo,
  style: spec.style ? { meta: findStyle(spec.style.id), variant: spec.style.variant } : null,
  photo: deps.brand.constraints?.photo,
});

// Katalog format job, arketipe gaya job lebih dulu (T-133).
const jobCatalog = (spec: JobSpec, deps: PipelineDeps) =>
  catalogForStyle(
    catalogFor(deps.catalog, spec.format),
    spec.style ? findStyle(spec.style.id) : null,
  );

// Output langkah yang tersimpan, divalidasi skema tahap; undefined bila belum ada atau rusak.
async function readStep(dir: string, step: Step, spec: JobSpec, deps: PipelineDeps, work: Working) {
  const path = join(dir, stepFile(step));
  const catalog = jobCatalog(spec, deps);
  switch (step.stage) {
    case "plan":
      return validJson(path, planSchema(spec));
    case "copy":
      return work.plan ? validJson(path, copySchema(work.plan)) : undefined;
    case "layout":
      return validJson(path, layoutSchema(layoutContext(spec, deps, catalog)));
    case "assets": {
      const manifest = await validJson(path, AssetManifest);
      const files = manifest
        ? await Promise.all(manifest.assets.map((a) => exists(join(dir, a.path))))
        : [];
      return manifest && files.every(Boolean) ? manifest : undefined;
    }
    case "render": {
      const report = await validJson(path, RenderReport);
      const files = report
        ? await Promise.all(report.slides.map((s) => exists(join(dir, s.pngPath))))
        : [];
      return report && files.every(Boolean) ? report : undefined;
    }
    case "qa":
      return validJson(path, QaReport);
    case "revise":
      return validJson(path, reviseSchema(spec, deps, work, catalog));
  }
}

async function validJson<T>(path: string, schema: z.ZodType<T>): Promise<T | undefined> {
  try {
    const parsed = schema.safeParse(JSON.parse(await readFile(path, "utf8")));
    return parsed.success ? parsed.data : undefined;
  } catch {
    return undefined;
  }
}

const exists = (path: string) =>
  stat(path).then(
    (s) => s.isFile(),
    () => false,
  );

// Tulis ke file sementara lalu rename, agar crash tidak meninggalkan JSON setengah jadi.
async function writeJson(path: string, value: unknown) {
  await writeFile(`${path}.tmp`, `${JSON.stringify(value, null, 2)}\n`);
  await rename(`${path}.tmp`, path);
}

async function saveState(
  dir: string,
  spec: JobSpec,
  status: JobStatus,
  error: string | null,
  resumeAt: string | null,
  updatedAt: string,
) {
  await writeJson(
    join(dir, "job.json"),
    JobState.parse({ spec, status, error, resumeAt, updatedAt }),
  );
}

async function recordEvent(dir: string, jobId: string, deps: PipelineDeps, event: JobEvent) {
  const parsed = JobEvent.parse(event);
  await appendFile(join(dir, "events.jsonl"), `${JSON.stringify(parsed)}\n`);
  deps.onEvent?.(jobId, parsed);
}
