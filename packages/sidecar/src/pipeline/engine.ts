import { appendFile, copyFile, mkdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import {
  AssetManifest,
  type BrandKit,
  type ContentPlan,
  type CopyDraft,
  type CopyGuide,
  JobEvent,
  type JobSpec,
  type JobStage,
  JobState,
  type JobStatus,
  type LayoutSpec,
  QaReport,
  type RenderCheck,
  RenderReport,
  type TemplateMeta,
  VisualQa,
} from "@laras/shared";
import type { z } from "zod";
import { LimitReachedError } from "../cli/limits.ts";
import { brandContext, renderPrompt, type Stage } from "../prompts/index.ts";
import { buildRenderReport } from "../render/qa/report.ts";
import type { AssetProvider } from "./assets.ts";
import {
  catalogFor,
  copySchema,
  layoutSchema,
  planSchema,
  qaReport,
  revisionSchema,
} from "./stages.ts";

// Engine pipeline (ARCH 5.1, 5.4; PRD F7). Satu job = satu varian. Setiap langkah menulis
// jobs/<job-id>/<nn>-<tahap>.json; resume mengulang langkah dari file. Revisi maksimal 2 putaran
// masuk ulang di assets (revise menghasilkan copy dan layout baru sekaligus).

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
  render: (
    layout: LayoutSpec,
    assets: AssetManifest,
    jobDir: string,
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

export const MAX_ROUNDS = 2;

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
export const jobDir = (projectDir: string, jobId: string) => join(projectDir, "jobs", jobId);

// Hasil kerja yang sedang berlaku selama langkah diputar ulang.
type Working = {
  plan?: ContentPlan;
  copy?: CopyDraft;
  layout?: LayoutSpec;
  assets?: AssetManifest;
  render?: RenderReport;
  qa?: QaReport;
  regenerate: Set<string>;
};

export async function runJob(spec: JobSpec, deps: PipelineDeps): Promise<JobResult> {
  const dir = jobDir(deps.projectDir, spec.id);
  await mkdir(dir, { recursive: true });
  const now = () => (deps.now ?? (() => new Date()))().toISOString();
  const work: Working = { regenerate: new Set() };
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
    return { jobId: spec.id, status: "done", qa: work.qa ?? null, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
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
  const catalog = catalogFor(deps.catalog, spec.format);
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
        userAssets: userAssets.length > 0 ? userAssets.join(", ") : "Tidak ada",
      });
      return ask("layout", prompt, layoutSchema(catalog, spec.slideCount));
    }
    case "assets":
      return { output: await produceAssets(spec, deps, work, dir) };
    case "render":
      return { output: await renderSlides(step, deps, work, dir) };
    case "qa":
      return runQa(step, spec, deps, work, brand);
    case "revise": {
      const prompt = renderPrompt("revise", {
        brand,
        copy: json(need(work.copy, "copy")),
        layout: json(need(work.layout, "layout")),
        catalog: json(catalog),
        fixes: json(need(work.qa, "qa").fixes),
      });
      return ask("revise", prompt, revisionSchema(catalog, spec.slideCount));
    }
  }
}

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
    const ctx = { projectDir: deps.projectDir, jobDir: dir, brand: deps.brand };
    assets.push(
      await provider.generate(request, deps.signal ? { ...ctx, signal: deps.signal } : ctx),
    );
  }
  return AssetManifest.parse({ assets });
}

async function renderSlides(step: Step, deps: PipelineDeps, work: Working, dir: string) {
  const { layout, assets } = work;
  if (!layout || !assets) throw new Error("Tahap render butuh layout dan aset");
  const slides = await deps.render(layout, assets, dir);
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
async function runQa(step: Step, spec: JobSpec, deps: PipelineDeps, work: Working, brand: string) {
  const render = work.render;
  if (!render) throw new Error("Tahap qa butuh hasil render");
  const deterministicPassed = render.slides.every((s) => s.checks.every((c) => c.passed));
  if (!deterministicPassed) return { output: qaReport(step.round, render, null) };
  const prompt = renderPrompt("qa-visual", {
    brand,
    copy: JSON.stringify(work.copy, null, 2),
    layout: JSON.stringify(work.layout, null, 2),
    deterministic: "Semua cek kode lolos.",
    references: "Tidak ada referensi visual.",
    slides: render.slides.map((s) => `jobs/${spec.id}/${s.pngPath}`).join("\n"),
  });
  const { data, costUsd } = await deps.claude("qa-visual", prompt, VisualQa);
  return {
    output: qaReport(step.round, render, data),
    ...(costUsd !== undefined ? { costUsd } : {}),
  };
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

// Output langkah yang tersimpan, divalidasi skema tahap; undefined bila belum ada atau rusak.
async function readStep(dir: string, step: Step, spec: JobSpec, deps: PipelineDeps, work: Working) {
  const path = join(dir, stepFile(step));
  const catalog = catalogFor(deps.catalog, spec.format);
  switch (step.stage) {
    case "plan":
      return validJson(path, planSchema(spec));
    case "copy":
      return work.plan ? validJson(path, copySchema(work.plan)) : undefined;
    case "layout":
      return validJson(path, layoutSchema(catalog, spec.slideCount));
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
      return validJson(path, revisionSchema(catalog, spec.slideCount));
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
