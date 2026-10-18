import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { BrandKit, CopyGuide, type JobSpec, type RenderCheck } from "@laras/shared";
import { templates } from "@laras/templates";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LimitReachedError } from "../cli/limits.ts";
import type { Stage } from "../prompts/index.ts";
import type { AssetProvider } from "./assets.ts";
import { jobDir, type PipelineDeps, runBrief, runJob, type StageCall } from "./engine.ts";
import { layoutSchema, planSchema } from "./stages.ts";

const BRAND_DIR = new URL("../../../../fixtures/brands/kopi-lembayung/", import.meta.url);
const read = (file: string): unknown => JSON.parse(readFileSync(new URL(file, BRAND_DIR), "utf8"));
const catalog = templates.map((t) => t.meta);

const plan = (variants: number) => ({
  format: "feed-4x5",
  keyMessage: "Kopi susu gula aren tersedia setiap pagi.",
  audience: "Pekerja di sekitar kedai.",
  slides: [{ role: "hook", intent: "Mengajak mampir pagi ini." }],
  angles: Array.from({ length: variants }, (_, i) => ({
    id: `angle-${i + 1}`,
    angle: `Sudut pandang ${i + 1}`,
    rationale: "Alasan",
  })),
});
const copy = {
  slides: [
    {
      headline: "Kopi pagi yang pelan",
      body: "Disangrai sendiri tiap minggu.",
      cta: "Mampir sebelum kerja",
    },
  ],
  caption: "Pagi yang pelan.",
  hashtags: ["#KopiLembayung"],
};
const layout = {
  templateId: "feed-foto-teks",
  format: "feed-4x5",
  slides: [
    {
      slots: {
        image: { type: "image", assetId: "hero" },
        headline: { type: "text", value: "Kopi pagi yang pelan" },
        logo: { type: "logo", variant: "primary" },
      },
      options: { tone: "light" },
    },
  ],
  assetRequests: [{ id: "hero", description: "Cangkir kopi di teras", aspectRatio: "3:2" }],
};
const visual = (score: number) => ({
  scores: {
    hierarchy: score,
    balance: score,
    readability: score,
    referenceFit: score,
    professionalism: score,
  },
  summary: "Ringkasan",
  fixes: score >= 8 ? [] : [{ target: "layout", instruction: "Perbaiki komposisi" }],
});
const revision = (regenerateAssets: string[]) => ({
  copy,
  layout,
  regenerateAssets,
  summary: "Tone diganti.",
});

const FAILED_CONTRAST: RenderCheck = {
  rule: "contrast",
  passed: false,
  target: "headline",
  message: "Kontras teks 2:1, minimal 4.5:1",
  measured: 2,
  threshold: 4.5,
};
const PASSED: RenderCheck = { rule: "contrast", passed: true, message: "Kontras semua teks cukup" };

type Fake = {
  deps: PipelineDeps;
  calls: { stage: Stage; prompt: string }[];
  assetCalls: string[];
  renders: number;
};

let tmp = "";
beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), "laras-engine-"));
});
afterEach(() => rmSync(tmp, { recursive: true, force: true }));

// Adapter palsu. `answers` per tahap diambil berurutan (yang terakhir dipakai ulang); nilai
// berupa Error dilempar. `renderChecks` menentukan hasil cek per render berurutan.
function fake(options: {
  variants?: number;
  answers?: Partial<Record<Stage, unknown[]>>;
  renderChecks?: RenderCheck[][];
  signal?: AbortSignal;
}): Fake {
  const calls: Fake["calls"] = [];
  const assetCalls: string[] = [];
  const counters: Partial<Record<Stage, number>> = {};
  const defaults: Record<Stage, unknown> = {
    plan: plan(options.variants ?? 1),
    copy,
    layout,
    "qa-visual": visual(9),
    revise: revision([]),
  };
  const claude: StageCall = async (stage, prompt, schema) => {
    calls.push({ stage, prompt });
    const list = options.answers?.[stage] ?? [defaults[stage]];
    const index = counters[stage] ?? 0;
    counters[stage] = index + 1;
    const answer = list[Math.min(index, list.length - 1)];
    if (answer instanceof Error) throw answer;
    return { data: schema.parse(answer), costUsd: 0.01 };
  };
  const provider: AssetProvider = {
    async generate(request, ctx) {
      assetCalls.push(request.id);
      await mkdir(join(ctx.jobDir, "assets"), { recursive: true });
      await writeFile(join(ctx.jobDir, "assets", `${request.id}.jpg`), "jpg");
      return {
        id: request.id,
        path: `assets/${request.id}.jpg`,
        width: 1122,
        height: 748,
        source: "codex",
      };
    },
  };
  const result: Fake = {
    calls,
    assetCalls,
    renders: 0,
    deps: undefined as unknown as PipelineDeps,
  };
  result.deps = {
    projectDir: tmp,
    brand: BrandKit.parse(read("brand.json")),
    copyGuide: CopyGuide.parse(read("copy-guide.json")),
    knowledge: "Kedai kopi di Bandung.",
    catalog,
    claude,
    assetsFor: () => provider,
    render: async () => {
      const list = options.renderChecks ?? [[PASSED]];
      const checks = list[Math.min(result.renders, list.length - 1)] ?? [PASSED];
      result.renders++;
      return [
        { png: Buffer.from("png"), html: "<html></html>", width: 2160, height: 2700, checks },
      ];
    },
    ...(options.signal ? { signal: options.signal } : {}),
    now: () => new Date("2026-10-18T10:00:00Z"),
  };
  return result;
}

const spec = (overrides: Partial<JobSpec> = {}): JobSpec => ({
  id: "brief-1-v1",
  briefId: "brief-1",
  brief: "Promo kopi susu gula aren untuk pekerja pagi",
  format: "feed-4x5",
  slideCount: 1,
  variant: 1,
  variantCount: 1,
  templatePreference: null,
  userAssets: {},
  ...overrides,
});

const files =
  (id = "brief-1-v1") =>
  (n: string) =>
    existsSync(join(jobDir(tmp, id), n));
const jobJson = (id = "brief-1-v1") =>
  JSON.parse(readFileSync(join(jobDir(tmp, id), "job.json"), "utf8"));
const events = (id = "brief-1-v1") =>
  readFileSync(join(jobDir(tmp, id), "events.jsonl"), "utf8")
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line));

describe("runJob", () => {
  it("menjalankan semua tahap dan menyimpan output per langkah bila QA lolos", async () => {
    const f = fake({});
    const result = await runJob(spec(), f.deps);
    expect(result).toMatchObject({ status: "done", error: null, qa: { round: 0, passed: true } });
    const has = files();
    for (const name of [
      "01-plan.json",
      "02-copy.json",
      "03-layout.json",
      "04-assets.json",
      "05-render.json",
      "06-qa.json",
      "slides/05-1.png",
    ]) {
      expect(has(name), name).toBe(true);
    }
    expect(has("07-revise.json")).toBe(false);
    expect(f.calls.map((c) => c.stage)).toEqual(["plan", "copy", "layout", "qa-visual"]);
    expect(jobJson().status).toBe("done");
    const completed = events().filter((e) => e.type === "completed");
    expect(completed.map((e) => e.stage)).toEqual([
      "plan",
      "copy",
      "layout",
      "assets",
      "render",
      "qa",
    ]);
    expect(completed[0]).toMatchObject({ step: 1, costUsd: 0.01 });
  });

  it("merevisi dari cek deterministik tanpa QA visual, dan memakai ulang aset", async () => {
    const f = fake({ renderChecks: [[FAILED_CONTRAST], [PASSED]] });
    const result = await runJob(spec(), f.deps);
    expect(result).toMatchObject({ status: "done", qa: { round: 1, passed: true } });
    const firstQa = JSON.parse(readFileSync(join(jobDir(tmp, "brief-1-v1"), "06-qa.json"), "utf8"));
    expect(firstQa).toMatchObject({ passed: false, visual: null });
    expect(firstQa.fixes).toEqual([
      {
        target: "layout",
        slideIndex: 0,
        instruction: "Kontras teks 2:1, minimal 4.5:1 (headline)",
      },
    ]);
    expect(f.calls.map((c) => c.stage)).toEqual(["plan", "copy", "layout", "revise", "qa-visual"]);
    expect(f.calls.find((c) => c.stage === "revise")?.prompt).toContain("Kontras teks 2:1");
    expect(f.assetCalls).toEqual(["hero"]);
    expect(files()("10-qa.json")).toBe(true);
  });

  it("membuat ulang hanya aset yang diminta revise", async () => {
    const f = fake({
      renderChecks: [[FAILED_CONTRAST], [PASSED]],
      answers: { revise: [revision(["hero"])] },
    });
    await runJob(spec(), f.deps);
    expect(f.assetCalls).toEqual(["hero", "hero"]);
  });

  it("berhenti setelah 2 putaran revisi dan tetap selesai dengan QA gagal", async () => {
    const f = fake({ renderChecks: [[FAILED_CONTRAST]] });
    const result = await runJob(spec(), f.deps);
    expect(result).toMatchObject({ status: "done", qa: { round: 2, passed: false } });
    expect(f.calls.filter((c) => c.stage === "revise")).toHaveLength(2);
    expect(files()("14-qa.json")).toBe(true);
  });

  it("QA visual di bawah ambang memicu revisi dengan perbaikan dari Claude", async () => {
    const f = fake({ answers: { "qa-visual": [visual(6), visual(9)] } });
    const result = await runJob(spec(), f.deps);
    expect(result.qa).toMatchObject({ round: 1, passed: true });
    expect(f.calls.find((c) => c.stage === "revise")?.prompt).toContain("Perbaiki komposisi");
  });

  it("melanjutkan dari tahap yang gagal tanpa mengulang tahap yang sudah tersimpan", async () => {
    const f = fake({ answers: { layout: [new Error("Overloaded"), layout] } });
    expect(await runJob(spec(), f.deps)).toMatchObject({ status: "failed", error: "Overloaded" });
    expect(jobJson()).toMatchObject({ status: "failed", error: "Overloaded" });
    expect(events().at(-1)).toMatchObject({
      type: "failed",
      stage: "layout",
      message: "Overloaded",
    });
    f.calls.length = 0;
    expect((await runJob(spec(), f.deps)).status).toBe("done");
    expect(f.calls.map((c) => c.stage)).toEqual(["layout", "qa-visual"]);
  });

  it("berhenti dengan waiting_quota saat kuota habis lalu bisa dilanjutkan", async () => {
    const resetsAt = new Date("2026-10-18T15:00:00Z");
    const f = fake({ answers: { copy: [new LimitReachedError("Batas kuota", resetsAt), copy] } });
    expect((await runJob(spec(), f.deps)).status).toBe("waiting_quota");
    expect(jobJson()).toMatchObject({ status: "waiting_quota", resumeAt: resetsAt.toISOString() });
    expect((await runJob(spec(), f.deps)).status).toBe("done");
  });

  it("mengulang tahap yang filenya rusak beserta semua tahap sesudahnya", async () => {
    const f = fake({});
    await runJob(spec(), f.deps);
    writeFileSync(join(jobDir(tmp, "brief-1-v1"), "02-copy.json"), "{ rusak");
    f.calls.length = 0;
    await runJob(spec(), f.deps);
    expect(f.calls.map((c) => c.stage)).toEqual(["copy", "layout", "qa-visual"]);
  });

  it("berstatus cancelled bila dibatalkan", async () => {
    const controller = new AbortController();
    controller.abort();
    const f = fake({
      answers: { plan: [new Error("This operation was aborted")] },
      signal: controller.signal,
    });
    expect((await runJob(spec(), f.deps)).status).toBe("cancelled");
  });
});

describe("runBrief", () => {
  it("menjalankan plan sekali untuk semua varian, masing-masing dengan angle-nya", async () => {
    const f = fake({ variants: 3 });
    const { id: _, variant: __, ...brief } = spec({ variantCount: 3 });
    const results = await runBrief(brief, f.deps);
    expect(results.map((r) => [r.jobId, r.status])).toEqual([
      ["brief-1-v1", "done"],
      ["brief-1-v2", "done"],
      ["brief-1-v3", "done"],
    ]);
    expect(f.calls.filter((c) => c.stage === "plan")).toHaveLength(1);
    const copyPrompts = f.calls.filter((c) => c.stage === "copy").map((c) => c.prompt);
    expect(copyPrompts[1]).toContain('"id": "angle-2"');
    expect(copyPrompts[2]).toContain('"id": "angle-3"');
    expect(files("brief-1-v3")("01-plan.json")).toBe(true);
  });
});

describe("skema tahap", () => {
  it("menolak plan dengan jumlah angle salah dan layout yang melanggar katalog", () => {
    expect(planSchema(spec({ variantCount: 2 })).safeParse(plan(1)).error?.issues[0]?.message).toBe(
      "Rencana harus berisi tepat 2 angle",
    );
    const long = structuredClone(layout);
    long.slides[0] = {
      ...long.slides[0],
      slots: { ...long.slides[0]?.slots, headline: { type: "text", value: "x".repeat(46) } },
    } as (typeof layout.slides)[number];
    const messages = layoutSchema(catalog, 1)
      .safeParse(long)
      .error?.issues.map((i) => i.message);
    expect(messages).toContain('Slide 1: slot "headline" melebihi 45 karakter');
  });
});
