import { join } from "node:path";
import {
  type JobFinishedParams,
  type JobStartParams,
  type JobStartResult,
  RpcErrorCode,
} from "@laras/shared";
import { templates } from "@laras/templates";
import { type AssetProvider, CodexAssetProvider } from "../pipeline/assets.ts";
import { finalSlides, type JobResult, runBrief, type StageCall } from "../pipeline/engine.ts";
import {
  claudeStage,
  demoAssets,
  dryRunAnswer,
  liveClis,
  loadProject,
  slideRender,
} from "../pipeline/wiring.ts";
import { createRenderer, type Renderer } from "../render/renderer.ts";
import { RpcError, type RpcServer } from "../rpc/server.ts";
import { projectPath } from "../storage/data-dir.ts";

// Antrean walking skeleton (T-202): satu brief sekaligus, brief kedua saat sibuk ditolak `busy`.
// Antrean dengan konkurensi dan kuota (PRD F15) menyusul di Fase 3.

export type JobRunnerOptions = {
  dataDir: string;
  // Aset demo per brand (fixtures/demo-assets/<slug>) pengganti Codex saat dry-run.
  demoAssetsDir: string;
  notify: RpcServer["notify"];
  log: (line: string) => void;
  now?: () => Date;
  renderer?: () => Renderer;
};

type Brief = { projectDir: string; briefId: string; jobIds: string[]; params: JobStartParams };

export function createJobRunner(options: JobRunnerOptions) {
  let running: Promise<void> | null = null;

  async function execute({ projectDir, briefId, jobIds, params }: Brief, finished: Set<string>) {
    const project = await loadProject(projectDir);
    const live = params.dryRun ? null : await liveClis();
    const claude: StageCall = live
      ? claudeStage({ claudePath: live.claude, cwd: projectDir })
      : async (stage, _prompt, schema) => {
          const answer = dryRunAnswer(stage, params.variantCount);
          // Contoh revisi membuat ulang gambar, yang ditolak bila tidak ada perbaikan bertarget
          // assets; seperti retry validasi Claude, contoh dikirim ulang tanpa gambar baru.
          const parsed = schema.safeParse(answer);
          return {
            data: parsed.success
              ? parsed.data
              : schema.parse({ ...(answer as object), regenerateAssets: [] }),
          };
        };
    const assets: AssetProvider = live
      ? new CodexAssetProvider({ codexPath: live.codex })
      : demoAssets(join(options.demoAssetsDir, params.project));
    const renderer = (options.renderer ?? createRenderer)();
    try {
      const results = await runBrief(
        {
          briefId,
          brief: params.brief,
          format: params.format,
          slideCount: params.slideCount,
          variantCount: params.variantCount,
          templatePreference: null,
          // Jawaban contoh dry-run tidak mengenal gaya, jadi dry-run berjalan tanpa gaya.
          style: params.dryRun ? null : project.settings.style,
          userAssets: {},
        },
        {
          projectDir,
          brand: project.brand,
          copyGuide: project.copyGuide,
          knowledge: project.knowledge,
          catalog: templates.map((template) => template.meta),
          claude,
          assetsFor: () => assets,
          render: slideRender(renderer, projectDir, project),
          onEvent: (jobId, event) => options.notify("job.event", { jobId, event }),
        },
      );
      for (const result of results) {
        options.notify("job.finished", await finishedParams(projectDir, result));
        finished.add(result.jobId);
      }
      // runBrief berhenti setelah varian yang menunggu kuota atau dibatalkan.
      const last = results.at(-1);
      for (const jobId of jobIds.filter((id) => !finished.has(id))) {
        options.notify("job.finished", {
          jobId,
          status: "cancelled",
          slides: [],
          qaPassed: null,
          error: `Tidak dijalankan karena varian sebelumnya berhenti (${last?.status ?? "gagal"})`,
        });
        finished.add(jobId);
      }
    } finally {
      await renderer.close();
    }
  }

  return {
    // Selesai saat brief yang sedang berjalan selesai.
    idle: (): Promise<void> => running ?? Promise.resolve(),
    start(params: JobStartParams): JobStartResult {
      if (running) throw new RpcError(RpcErrorCode.busy, "Masih ada konten yang sedang dibuat");
      const projectDir = projectPath(options.dataDir, params.project);
      if (!projectDir) {
        throw new RpcError(RpcErrorCode.projectNotFound, `Project ${params.project} tidak ada`);
      }
      // Sampai milidetik agar brief berurutan dalam satu detik tidak berbagi folder job.
      const stamp = (options.now?.() ?? new Date()).toISOString().replace(/\D/g, "").slice(0, 17);
      const briefId = `brief-${stamp}`;
      const jobIds = Array.from({ length: params.variantCount }, (_, i) => `${briefId}-v${i + 1}`);
      const finished = new Set<string>();
      running = execute({ projectDir, briefId, jobIds, params }, finished)
        .catch((error: unknown) => {
          const message = error instanceof Error ? error.message : String(error);
          options.log(`Brief ${briefId} gagal: ${error instanceof Error ? error.stack : message}`);
          for (const jobId of jobIds.filter((id) => !finished.has(id))) {
            options.notify("job.finished", {
              jobId,
              status: "failed",
              slides: [],
              qaPassed: null,
              error: message || "Gagal",
            });
          }
        })
        .finally(() => {
          running = null;
        });
      return { briefId, jobIds };
    },
  };
}

async function finishedParams(projectDir: string, result: JobResult): Promise<JobFinishedParams> {
  return {
    jobId: result.jobId,
    status: result.status,
    slides: await finalSlides(projectDir, result),
    qaPassed: result.qa?.passed ?? null,
    error: result.error,
  };
}
