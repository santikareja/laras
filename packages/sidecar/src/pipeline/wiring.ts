import { existsSync } from "node:fs";
import { copyFile, mkdir, readFile } from "node:fs/promises";
import { extname, join } from "node:path";
import {
  type AssetManifest,
  BrandKit,
  CopyGuide,
  designLimits,
  type LayoutSpec,
  ProjectSettings,
  type StyleChoice,
} from "@laras/shared";
import { templates } from "@laras/templates";
import { runClaude } from "../cli/claude.ts";
import { resolveClis } from "../cli/resolvePath.ts";
import type { SpawnLines } from "../cli/stream.ts";
import { promptTemplate, type Stage } from "../prompts/index.ts";
import { findStyle } from "../prompts/style-context.ts";
import { renderLayoutHtml } from "../render/layout.ts";
import { toMaster } from "../render/postprocess.ts";
import { type Renderer, SLIDE_SIZE } from "../render/renderer.ts";
import { type AssetProvider, storeAsset } from "./assets.ts";
import type { PipelineDeps, SlideRenderOutput, StageCall } from "./engine.ts";

// Rangkaian pipeline yang dipakai bersama `pnpm spike` dan server RPC (T-202): membaca project,
// render slide, panggilan Claude sungguhan, dan pengganti tanpa kuota untuk dry-run.

export type ProjectFiles = {
  brand: BrandKit;
  copyGuide: CopyGuide;
  knowledge: string;
  settings: ProjectSettings;
};

export async function loadProject(projectDir: string): Promise<ProjectFiles> {
  const read = (file: string) => readFile(join(projectDir, file), "utf8");
  return {
    brand: BrandKit.parse(JSON.parse(await read("brand.json"))),
    copyGuide: CopyGuide.parse(JSON.parse(await read("copy-guide.json"))),
    knowledge: await read("knowledge/business.md"),
    settings: existsSync(join(projectDir, "project.json"))
      ? ProjectSettings.parse(JSON.parse(await read("project.json")))
      : { style: null },
  };
}

const MASTER = { width: SLIDE_SIZE.width * 2, height: SLIDE_SIZE.height * 2 };

// Render bergaya: lapisan gaya dan ambang QA desain gaya serta variannya (T-133).
export function slideRender(
  renderer: Renderer,
  projectDir: string,
  { brand, copyGuide }: Pick<ProjectFiles, "brand" | "copyGuide">,
): PipelineDeps["render"] {
  return async (layout: LayoutSpec, assets: AssetManifest, dir: string, choice?: StyleChoice) => {
    const pages = renderLayoutHtml(layout, {
      brand,
      assets,
      templates,
      ...(choice ? { style: choice } : {}),
    });
    const design = choice ? designLimits(findStyle(choice.id), choice.variant) : undefined;
    const slides: SlideRenderOutput[] = [];
    for (const html of pages) {
      const { png, checks } = await renderer.render(
        html,
        { projectDir, jobDir: dir },
        { brand, copyGuide, ...(design ? { design } : {}) },
      );
      slides.push({ png: await toMaster(png), html, ...MASTER, checks });
    }
    return slides;
  };
}

export async function liveClis(): Promise<{ claude: string; codex: string }> {
  const statuses = await resolveClis();
  const path = (name: "claude" | "codex") => {
    const status = statuses.find((s) => s.name === name);
    if (!status?.found) throw new Error(`${name} tidak ditemukan`);
    if (!status.loggedIn) throw new Error(`${name} belum login`);
    return status.path;
  };
  return { claude: path("claude"), codex: path("codex") };
}

export function claudeStage(options: {
  claudePath: string;
  cwd: string;
  spawn?: SpawnLines;
  model?: string;
  signal?: AbortSignal;
  onRetries?: (count: number) => void;
}): StageCall {
  return async (_stage, prompt, schema) => {
    const run = await runClaude({
      claudePath: options.claudePath,
      cwd: options.cwd,
      prompt,
      schema,
      ...(options.spawn ? { spawn: options.spawn } : {}),
      ...(options.model ? { model: options.model } : {}),
      ...(options.signal ? { signal: options.signal } : {}),
    });
    options.onRetries?.(run.attempts - 1);
    return { data: run.data, costUsd: run.costUsd };
  };
}

// Dry-run: contoh output di prompt tahap (T-114), disesuaikan jumlah angle. Contoh QA visual berada
// di bawah ambang, sehingga putaran revisi ikut berjalan.
export function dryRunAnswer(stage: Stage, variants: number): unknown {
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

// Dry-run: foto atau cut-out demo brand menggantikan hasil Codex; penyimpanan aset (crop foto,
// normalisasi dan analisis cut-out) tetap sungguhan. Aset bernama sama dengan id permintaan (mis.
// pola demo gaya) dipakai apa adanya.
export function demoAssets(demoDir: string, onGenerate?: () => void): AssetProvider {
  return {
    async generate(request, ctx) {
      onGenerate?.();
      const named = [".webp", ".jpg"]
        .map((ext) => `${request.id}${ext}`)
        .find((file) => existsSync(join(demoDir, file)));
      const fixture = named ?? (request.kind === "cutout" ? "subjek.webp" : "foto.jpg");
      const original = join(ctx.jobDir, "assets", `${request.id}.original${extname(fixture)}`);
      await mkdir(join(ctx.jobDir, "assets"), { recursive: true });
      await copyFile(join(demoDir, fixture), original);
      return storeAsset(request, original, ctx, "codex");
    },
  };
}
