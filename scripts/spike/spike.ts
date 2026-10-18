// Spike pipeline tanpa UI (PRD 11 Fase 1, T-116): brief → plan → copy → layout → aset → render →
// QA → revisi, untuk satu brand fixture. MEMAKAI KUOTA kecuali dryRun; jumlah panggilan CLI
// dibatasi (termasuk retry validasi) sebagai pengaman kuota.
import { copyFile, cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import {
  type AssetManifest,
  BrandKit,
  CopyGuide,
  type JobEvent,
  type JobSpec,
  LayoutSpec,
  type QaFix,
  RenderReport,
  Revision,
} from "../../packages/shared/src/index.ts";
import { runClaude } from "../../packages/sidecar/src/cli/claude.ts";
import { resolveClis } from "../../packages/sidecar/src/cli/resolvePath.ts";
import { type SpawnLines, spawnLines } from "../../packages/sidecar/src/cli/stream.ts";
import {
  type AssetProvider,
  CodexAssetProvider,
  cropToRatio,
} from "../../packages/sidecar/src/pipeline/assets.ts";
import {
  type JobResult,
  jobDir,
  type PipelineDeps,
  runBrief,
  type SlideRenderOutput,
  type StageCall,
} from "../../packages/sidecar/src/pipeline/engine.ts";
import { promptTemplate, type Stage } from "../../packages/sidecar/src/prompts/index.ts";
import { renderLayoutHtml } from "../../packages/sidecar/src/render/layout.ts";
import { toMaster, toUpload } from "../../packages/sidecar/src/render/postprocess.ts";
import { createRenderer, SLIDE_SIZE } from "../../packages/sidecar/src/render/renderer.ts";
import { templates } from "../../packages/templates/src/index.ts";

export type SpikeOptions = {
  brand: string;
  brief: string;
  variants: number;
  template: string | null;
  dryRun: boolean;
  maxClaude: number;
  maxCodex: number;
  model?: string;
  outDir?: string;
  signal?: AbortSignal;
  log?: (line: string) => void;
};

export type SpikeReport = {
  briefId: string;
  brand: string;
  brief: string;
  dryRun: boolean;
  startedAt: string;
  durationMs: number;
  calls: { claude: number; codex: number };
  // Retry validasi Claude (panggilan ulang karena output tidak lolos skema), termasuk di calls.
  retries: number;
  costUsd: number;
  jobs: {
    id: string;
    status: string;
    error: string | null;
    round: number | null;
    templateId: string | null;
    qaPassed: boolean | null;
    scores: Record<string, number> | null;
    failures: string[];
    fixes: QaFix[];
    steps: { step: number; stage: string; durationMs: number; costUsd: number | null }[];
    pngs: string[];
  }[];
};

const ROOT = resolve(import.meta.dirname, "../..");
const MASTER = { width: SLIDE_SIZE.width * 2, height: SLIDE_SIZE.height * 2 };

export async function spike(options: SpikeOptions): Promise<SpikeReport> {
  const log = options.log ?? ((line: string) => console.log(line));
  const started = new Date();
  const briefId = `spike-${started.toISOString().replace(/\D/g, "").slice(0, 14)}`;
  const fixtureDir = join(ROOT, "fixtures/brands", options.brand);
  const workspace = resolve(options.outDir ?? join(ROOT, "out/spike"), options.brand);
  const projectDir = join(workspace, "project");
  const runDir = join(workspace, "runs", briefId);
  // Folder project tetap per brand (satu folder auto-memory Claude per cwd); file brand disalin
  // ulang dari fixture setiap jalan, jobs/ lama dibiarkan.
  await cp(fixtureDir, projectDir, { recursive: true, force: true });
  await mkdir(runDir, { recursive: true });
  const read = async (file: string) => readFile(join(projectDir, file), "utf8");
  const brand = BrandKit.parse(JSON.parse(await read("brand.json")));
  const copyGuide = CopyGuide.parse(JSON.parse(await read("copy-guide.json")));
  const knowledge = await read("knowledge/business.md");

  const calls = { claude: 0, codex: 0 };
  let retries = 0;
  const renderer = createRenderer();
  try {
    const live = options.dryRun ? null : await liveClis();
    const counted =
      (name: "claude" | "codex", max: number): SpawnLines =>
      async (file, args, spawnOptions, onLine) => {
        calls[name]++;
        if (calls[name] > max)
          throw new Error(`Batas panggilan ${name} untuk spike tercapai (${max})`);
        return spawnLines(file, args, spawnOptions, onLine);
      };

    const claude: StageCall = live
      ? async (_stage, prompt, schema) => {
          const run = await runClaude({
            claudePath: live.claude,
            cwd: projectDir,
            prompt,
            schema,
            spawn: counted("claude", options.maxClaude),
            ...(options.model ? { model: options.model } : {}),
            ...(options.signal ? { signal: options.signal } : {}),
          });
          retries += run.attempts - 1;
          return { data: run.data, costUsd: run.costUsd };
        }
      : async (stage, _prompt, schema) => {
          calls.claude++;
          return { data: schema.parse(dryRunAnswer(stage, options.variants)) };
        };

    const codex: AssetProvider = live
      ? new CodexAssetProvider({ codexPath: live.codex, spawn: counted("codex", options.maxCodex) })
      : {
          // Dry-run: foto demo brand menggantikan hasil Codex, crop tetap sungguhan.
          async generate(request, ctx) {
            calls.codex++;
            const original = join(ctx.jobDir, "assets", `${request.id}.original.jpg`);
            await mkdir(join(ctx.jobDir, "assets"), { recursive: true });
            await copyFile(join(ROOT, "fixtures/demo-assets", options.brand, "foto.jpg"), original);
            const path = `assets/${request.id}.jpg`;
            const size = await cropToRatio(original, join(ctx.jobDir, path), request.aspectRatio);
            return { id: request.id, path, ...size, source: "codex" };
          },
        };

    const render = async (layout: LayoutSpec, assets: AssetManifest, dir: string) => {
      const pages = renderLayoutHtml(layout, { brand, assets, templates });
      const slides: SlideRenderOutput[] = [];
      for (const html of pages) {
        const { png, checks } = await renderer.render(
          html,
          { projectDir, jobDir: dir },
          { brand, copyGuide },
        );
        slides.push({ png: await toMaster(png), html, ...MASTER, checks });
      }
      return slides;
    };

    const deps: PipelineDeps = {
      projectDir,
      brand,
      copyGuide,
      knowledge,
      catalog: templates.map((t) => t.meta),
      claude,
      assetsFor: () => codex,
      render,
      onEvent: (jobId, event) => log(eventLine(jobId, event)),
      ...(options.signal ? { signal: options.signal } : {}),
    };
    const input: Omit<JobSpec, "id" | "variant"> = {
      briefId,
      brief: options.brief,
      format: "feed-4x5",
      slideCount: 1,
      variantCount: options.variants,
      templatePreference: options.template,
      userAssets: {},
    };
    log(
      `Spike ${briefId} · ${options.brand} · ${options.variants} varian${options.dryRun ? " · DRY-RUN" : ""}`,
    );
    const results = await runBrief(input, deps);
    const report = await buildReport(results, {
      briefId,
      options,
      projectDir,
      runDir,
      started,
      calls,
      retries,
    });
    await writeFile(join(runDir, "laporan.json"), `${JSON.stringify(report, null, 2)}\n`);
    await writeFile(join(runDir, "laporan.md"), reportMarkdown(report));
    log(`Laporan: ${join(runDir, "laporan.md")}`);
    return report;
  } finally {
    await renderer.close();
  }
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

// Dry-run: contoh output di prompt T-114, disesuaikan jumlah angle. Contoh QA visual berada di
// bawah ambang, sehingga kedua putaran revisi ikut berjalan.
function dryRunAnswer(stage: Stage, variants: number): unknown {
  const blocks = [...promptTemplate(stage).matchAll(/```json\n([\s\S]*?)```/g)];
  const example = JSON.parse(blocks.at(-1)?.[1] ?? "null") as Record<string, unknown>;
  if (stage !== "plan") return example;
  const angles = example.angles as unknown[];
  return {
    ...example,
    angles: Array.from({ length: variants }, (_, i) => ({
      ...(angles[i % angles.length] as object),
      id: `angle-${i + 1}`,
    })),
  };
}

function eventLine(jobId: string, event: JobEvent): string {
  const step = String(event.step).padStart(2, "0");
  if (event.type === "started") return `[${jobId}] ${step} ${event.stage} mulai`;
  if (event.type === "failed") return `[${jobId}] ${step} ${event.stage} GAGAL: ${event.message}`;
  const seconds = ((event.durationMs ?? 0) / 1000).toFixed(1);
  return `[${jobId}] ${step} ${event.stage} selesai (${seconds} s)`;
}

async function buildReport(
  results: JobResult[],
  ctx: {
    briefId: string;
    options: SpikeOptions;
    projectDir: string;
    runDir: string;
    started: Date;
    calls: { claude: number; codex: number };
    retries: number;
  },
): Promise<SpikeReport> {
  const jobs: SpikeReport["jobs"] = [];
  for (const result of results) {
    const dir = jobDir(ctx.projectDir, result.jobId);
    const events = (await readFile(join(dir, "events.jsonl"), "utf8").catch(() => ""))
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as JobEvent);
    const steps = events
      .filter((e) => e.type === "completed")
      .map((e) => ({
        step: e.step,
        stage: e.stage,
        durationMs: e.durationMs ?? 0,
        costUsd: e.costUsd ?? null,
      }));
    const pngs = await copyFinalPngs(dir, result.jobId, ctx.runDir, steps);
    jobs.push({
      id: result.jobId,
      status: result.status,
      error: result.error,
      round: result.qa?.round ?? null,
      templateId: await finalTemplateId(dir, steps),
      qaPassed: result.qa?.passed ?? null,
      scores: result.qa?.visual?.scores ?? null,
      failures: (result.qa?.deterministic.failures ?? []).map(
        (c) => `${c.rule} ${c.target ?? ""}: ${c.message}`,
      ),
      fixes: result.qa?.fixes ?? [],
      steps,
      pngs,
    });
  }
  const costUsd = jobs.flatMap((j) => j.steps).reduce((sum, s) => sum + (s.costUsd ?? 0), 0);
  return {
    briefId: ctx.briefId,
    brand: ctx.options.brand,
    brief: ctx.options.brief,
    dryRun: ctx.options.dryRun,
    startedAt: ctx.started.toISOString(),
    durationMs: Date.now() - ctx.started.getTime(),
    calls: { ...ctx.calls },
    retries: ctx.retries,
    costUsd: Math.round(costUsd * 10000) / 10000,
    jobs,
  };
}

// Template akhir: dari layout, atau dari revisi terakhir bila ada.
async function finalTemplateId(dir: string, steps: { step: number; stage: string }[]) {
  const last = steps.filter((s) => s.stage === "layout" || s.stage === "revise").at(-1);
  if (!last) return null;
  const file = `${String(last.step).padStart(2, "0")}-${last.stage}.json`;
  const data: unknown = JSON.parse(await readFile(join(dir, file), "utf8"));
  return (last.stage === "revise" ? Revision.parse(data).layout : LayoutSpec.parse(data))
    .templateId;
}

// PNG render terakhir job disalin ke folder laporan: master dan versi unggah 1080.
async function copyFinalPngs(
  dir: string,
  jobId: string,
  runDir: string,
  steps: { step: number; stage: string }[],
) {
  const lastRender = steps.filter((s) => s.stage === "render").at(-1);
  if (!lastRender) return [];
  const file = `${String(lastRender.step).padStart(2, "0")}-render.json`;
  const report = RenderReport.parse(JSON.parse(await readFile(join(dir, file), "utf8")));
  const names: string[] = [];
  for (const slide of report.slides) {
    const master = await readFile(join(dir, slide.pngPath));
    const name = `${jobId}-${slide.index + 1}`;
    await writeFile(join(runDir, `${name}.png`), master);
    await writeFile(join(runDir, `${name}-1080.png`), await toUpload(master, "png"));
    names.push(`${name}.png`, `${name}-1080.png`);
  }
  return names;
}

function reportMarkdown(report: SpikeReport): string {
  const lines = [
    `# Spike ${report.briefId}${report.dryRun ? " (dry-run)" : ""}`,
    "",
    `- Brand: ${report.brand}`,
    `- Brief: ${report.brief}`,
    `- Mulai: ${report.startedAt}, durasi ${(report.durationMs / 1000).toFixed(1)} s`,
    `- Panggilan: Claude ${report.calls.claude} (retry validasi ${report.retries}), Codex ${report.calls.codex}; estimasi biaya Claude $${report.costUsd}`,
    "",
  ];
  for (const job of report.jobs) {
    lines.push(`## ${job.id}: ${job.status}${job.error ? ` (${job.error})` : ""}`, "");
    lines.push(
      `- Template: ${job.templateId ?? "-"}`,
      `- QA: ${job.qaPassed === null ? "-" : job.qaPassed ? "lolos" : "GAGAL"}, putaran ${job.round ?? "-"}`,
    );
    if (job.scores)
      lines.push(
        `- Skor visual: ${Object.entries(job.scores)
          .map(([k, v]) => `${k} ${v}`)
          .join(", ")}`,
      );
    for (const failure of job.failures) lines.push(`- Cek gagal: ${failure}`);
    for (const fix of job.fixes) {
      const slide = fix.slideIndex === undefined ? "" : `, slide ${fix.slideIndex + 1}`;
      lines.push(`- Perbaikan (${fix.severity}, ${fix.target}${slide}): ${fix.instruction}`);
    }
    lines.push("", "| Langkah | Tahap | Durasi (s) | Biaya ($) |", "|---|---|---|---|");
    for (const step of job.steps) {
      lines.push(
        `| ${step.step} | ${step.stage} | ${(step.durationMs / 1000).toFixed(1)} | ${step.costUsd ?? "-"} |`,
      );
    }
    lines.push("", ...job.pngs.map((png) => `- ${png}`), "");
  }
  return `${lines.join("\n")}\n`;
}
