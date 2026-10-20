// Spike pipeline tanpa UI (PRD 11 Fase 1, T-116): brief → plan → copy → layout → aset → render →
// QA → revisi, untuk satu brand fixture. MEMAKAI KUOTA kecuali dryRun; jumlah panggilan CLI
// dibatasi (termasuk retry validasi) sebagai pengaman kuota.

import { copyFile, cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import {
  ContentPlan,
  type JobEvent,
  type JobSpec,
  LayoutSpec,
  type QaFix,
  RenderReport,
  Revision,
  type StyleSelection,
  styleFit,
} from "../../packages/shared/src/index.ts";
import { type SpawnLines, spawnLines } from "../../packages/sidecar/src/cli/stream.ts";
import {
  type AssetProvider,
  CodexAssetProvider,
} from "../../packages/sidecar/src/pipeline/assets.ts";
import {
  type JobResult,
  jobDir,
  type PipelineDeps,
  runBrief,
  type StageCall,
  stepFile,
  stepOf,
} from "../../packages/sidecar/src/pipeline/engine.ts";
import {
  claudeStage,
  demoAssets,
  dryRunAnswer,
  liveClis,
  loadProject,
  slideRender,
} from "../../packages/sidecar/src/pipeline/wiring.ts";
import { findStyle } from "../../packages/sidecar/src/prompts/style-context.ts";
import { toUpload } from "../../packages/sidecar/src/render/postprocess.ts";
import { createRenderer } from "../../packages/sidecar/src/render/renderer.ts";
import { templates } from "../../packages/templates/src/index.ts";
import { caseSpec } from "../archetype-content.ts";
import type { Brand } from "../demo-content.ts";
import { stylePatterns } from "../style-cases/index.ts";

export type SpikeOptions = {
  brand: string;
  brief: string;
  variants: number;
  template: string | null;
  // Gaya brief (T-133): undefined memakai gaya default project.json, null tanpa gaya.
  style?: StyleSelection | null;
  dryRun: boolean;
  maxClaude: number;
  maxCodex: number;
  model?: string;
  // Folder job lama yang plan dan copy-nya dipakai ulang (evaluasi T-141): job baru mulai dari
  // tahap layout dengan isi yang sama, sehingga perbandingan hanya mengubah visual.
  reusePlan?: string;
  outDir?: string;
  signal?: AbortSignal;
  log?: (line: string) => void;
};

export type SpikeReport = {
  briefId: string;
  brand: string;
  brief: string;
  style: StyleSelection | null;
  // Kecocokan gaya dengan brand (styleFit, PRD F16); null tanpa gaya.
  styleFit: { fit: "cocok" | "kurang-cocok"; reasons: string[] } | null;
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
  const { brand, copyGuide, knowledge, settings } = await loadProject(projectDir);
  const style = options.style === undefined ? settings.style : options.style;

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
      ? claudeStage({
          claudePath: live.claude,
          cwd: projectDir,
          spawn: counted("claude", options.maxClaude),
          ...(options.model ? { model: options.model } : {}),
          ...(options.signal ? { signal: options.signal } : {}),
          onRetries: (count) => {
            retries += count;
          },
        })
      : async (stage, _prompt, schema) => {
          calls.claude++;
          const answer =
            stage === "layout" && style
              ? await styleLayoutAnswer(style.id, options.brand)
              : dryRunAnswer(stage, options.variants);
          return { data: schema.parse(answer) };
        };

    // Dry-run: aset pola demo gaya (id = nama file demo, mis. gaya-retro) dipakai apa adanya agar
    // dry-run bergaya setia pada polanya; selain itu cut-out atau foto demo brand.
    const codex: AssetProvider = live
      ? new CodexAssetProvider({ codexPath: live.codex, spawn: counted("codex", options.maxCodex) })
      : demoAssets(join(ROOT, "fixtures/demo-assets", options.brand), () => {
          calls.codex++;
        });
    const render = slideRender(renderer, projectDir, { brand, copyGuide });

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
      style,
      userAssets: {},
    };
    const styleLabel = style ? `${style.id}/${style.variant}` : "tanpa gaya";
    log(
      `Spike ${briefId} · ${options.brand} · ${styleLabel} · ${options.variants} varian${options.dryRun ? " · DRY-RUN" : ""}`,
    );
    if (options.reusePlan)
      await reusePlan(options.reusePlan, jobDir(projectDir, `${briefId}-v1`), options.variants);
    const results = await runBrief(input, deps);
    const report = await buildReport(results, {
      briefId,
      options,
      style,
      fit: style ? styleFit(findStyle(style.id), brand) : null,
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

// Dry-run bergaya: layout dari pola demo pertama gaya untuk brand ini (scripts/style-cases), karena
// contoh di prompt belum tentu memakai arketipe gaya itu (T-133).
async function styleLayoutAnswer(styleId: string, brand: string): Promise<LayoutSpec> {
  const item = stylePatterns(styleId)[0]?.cases[brand as Brand];
  const template = templates.find((t) => t.meta.id === item?.archetype);
  if (!item || !template) throw new Error(`Gaya ${styleId} tanpa pola demo untuk ${brand}`);
  const { spec } = await caseSpec(
    template,
    brand as Brand,
    item,
    join(ROOT, "fixtures/demo-assets", brand),
  );
  return item.styleOptions ? { ...spec, styleOptions: item.styleOptions } : spec;
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
    style: StyleSelection | null;
    fit: SpikeReport["styleFit"];
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
    const round = result.qa?.round ?? null;
    const pngs = await copyFinalPngs(
      dir,
      result.jobId,
      ctx.runDir,
      finalFile("render", round, steps),
    );
    jobs.push({
      id: result.jobId,
      status: result.status,
      error: result.error,
      round,
      templateId: await finalTemplateId(dir, round, steps),
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
    style: ctx.style,
    styleFit: ctx.fit,
    dryRun: ctx.options.dryRun,
    startedAt: ctx.started.toISOString(),
    durationMs: Date.now() - ctx.started.getTime(),
    calls: { ...ctx.calls },
    retries: ctx.retries,
    costUsd: Math.round(costUsd * 10000) / 10000,
    jobs,
  };
}

type DoneStep = { step: number; stage: string };

// File langkah hasil akhir: tahap pada putaran terbaik job (T-137), atau langkah terakhir tahap itu
// bila job berhenti sebelum QA.
function finalFile(stage: "render" | "layout" | "revise", round: number | null, steps: DoneStep[]) {
  const best = round === null ? undefined : stepOf(stage, round);
  if (best) return stepFile(best);
  const last = steps.filter((s) => s.stage === stage).at(-1);
  return last ? `${String(last.step).padStart(2, "0")}-${stage}.json` : null;
}

// Template akhir: dari layout putaran 0, atau dari revisi putaran terbaik.
async function finalTemplateId(dir: string, round: number | null, steps: DoneStep[]) {
  const revised = (round ?? steps.filter((s) => s.stage === "revise").length) > 0;
  const file = finalFile(revised ? "revise" : "layout", round, steps);
  if (!file) return null;
  const data: unknown = JSON.parse(await readFile(join(dir, file), "utf8"));
  return (revised ? Revision.parse(data).layout : LayoutSpec.parse(data)).templateId;
}

// PNG render putaran terbaik job disalin ke folder laporan: master dan versi unggah 1080.
async function copyFinalPngs(dir: string, jobId: string, runDir: string, file: string | null) {
  if (!file) return [];
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
    `- Gaya: ${report.style ? `${report.style.id}/${report.style.variant}` : "tanpa gaya"}${report.styleFit ? ` (${report.styleFit.fit}${report.styleFit.reasons.length > 0 ? `: ${report.styleFit.reasons.join("; ")}` : ""})` : ""}`,
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

// Plan dan copy job lama disalin ke job varian 1; engine membacanya sebagai langkah tersimpan.
// Rencana harus berisi tepat satu angle per varian, kalau tidak engine diam-diam membuat plan baru.
async function reusePlan(source: string, target: string, variants: number) {
  const plan = ContentPlan.parse(JSON.parse(await readFile(join(source, "01-plan.json"), "utf8")));
  if (plan.angles.length !== variants) {
    throw new Error(`Plan ${source} berisi ${plan.angles.length} angle, bukan ${variants}`);
  }
  await mkdir(target, { recursive: true });
  for (const file of ["01-plan.json", "02-copy.json"]) {
    await copyFile(join(source, file), join(target, file));
  }
}
