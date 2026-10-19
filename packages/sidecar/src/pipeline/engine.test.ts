import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  BrandKit,
  CopyGuide,
  type JobSpec,
  type RenderCheck,
  type StyleChoice,
  VisualQa,
} from "@laras/shared";
import { templates } from "@laras/templates";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ClaudeRunError } from "../cli/claude.ts";
import { LimitReachedError } from "../cli/limits.ts";
import type { Stage } from "../prompts/index.ts";
import { findStyle } from "../prompts/style-context.ts";
import type { AssetProvider } from "./assets.ts";
import { jobDir, type PipelineDeps, runBrief, runJob, type StageCall } from "./engine.ts";
import { layoutSchema, planSchema, revisionSchema, visualPassed } from "./stages.ts";

const BRAND_DIR = new URL("../../../../fixtures/brands/kopi-lembayung/", import.meta.url);
const read = (file: string): unknown => JSON.parse(readFileSync(new URL(file, BRAND_DIR), "utf8"));
const catalog = templates.map((t) => t.meta);

const plan = (variants: number) => ({
  format: "feed-4x5",
  keyMessage: "Kopi susu gula aren tersedia setiap pagi.",
  audience: "Pekerja di sekitar kedai.",
  setting: {
    location: "a quiet alley in Bandung, Indonesia",
    people: "Indonesian office workers in their twenties",
  },
  slides: [{ role: "hook", intent: "Mengajak mampir pagi ini." }],
  angles: Array.from({ length: variants }, (_, i) => ({
    id: `angle-${i + 1}`,
    angle: `Sudut pandang ${i + 1}`,
    rationale: "Alasan",
    visual: {
      idea: `Ide visual ${i + 1}`,
      image: `a glass of iced palm sugar coffee ${i + 1}`,
      kind: "photo",
    },
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
  templateId: "feed-foto-konsep",
  format: "feed-4x5",
  slides: [
    {
      slots: {
        image: { type: "image", assetId: "hero" },
        headline: { type: "text", value: "Kopi pagi yang pelan" },
        logo: { type: "logo", variant: "primary" },
      },
      options: { logo: "top-left" },
    },
  ],
  assetRequests: [{ id: "hero", description: "Cangkir kopi di teras", aspectRatio: "4:5" }],
};
const visual = (score: number) => ({
  scores: {
    idea: score,
    typography: score,
    interlock: score,
    brand: score,
    hierarchy: score,
    balance: score,
    readability: score,
    professionalism: score,
  },
  summary: "Ringkasan",
  fixes:
    score >= 8 ? [] : [{ target: "layout", severity: "saran", instruction: "Perbaiki komposisi" }],
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
  // Setting yang diterima penyedia aset per panggilan (T-125).
  settings: unknown[];
  renders: number;
  // Pilihan gaya yang diterima render per panggilan (T-133).
  styles: (StyleChoice | undefined)[];
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
    // Tahap spike T-140, tidak dipakai engine.
    "art-direction": null,
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
      result.settings.push(ctx.setting);
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
    settings: [],
    renders: 0,
    styles: [],
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
    render: async (_layout, _assets, _dir, style) => {
      result.styles.push(style);
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
  style: null,
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
        severity: "wajib",
        slideIndex: 0,
        instruction: "Kontras teks 2:1, minimal 4.5:1 (headline)",
      },
    ]);
    expect(f.calls.map((c) => c.stage)).toEqual(["plan", "copy", "layout", "revise", "qa-visual"]);
    expect(f.calls.find((c) => c.stage === "revise")?.prompt).toContain("Kontras teks 2:1");
    expect(f.assetCalls).toEqual(["hero"]);
    expect(files()("10-qa.json")).toBe(true);
  });

  it("membuat ulang hanya aset yang diminta revise bila ada perbaikan bertarget assets", async () => {
    const assetFix = {
      ...visual(9),
      fixes: [{ target: "assets", severity: "wajib", instruction: "Ganti foto yang buram" }],
    };
    const f = fake({
      answers: { "qa-visual": [assetFix, visual(9)], revise: [revision(["hero"])] },
    });
    await runJob(spec(), f.deps);
    expect(f.assetCalls).toEqual(["hero", "hero"]);
  });

  it("tanpa perbaikan bertarget assets, revisi tidak boleh membuat ulang gambar (T-137)", async () => {
    expect(
      revisionSchema(layoutContext(), false)
        .safeParse(revision(["hero"]))
        .error?.issues.map((i) => i.message),
    ).toEqual(["Tidak ada perbaikan bertarget assets: regenerateAssets harus kosong"]);
    // Perbaikan kontras bertarget layout: engine memvalidasi revisi dengan larangan buat ulang.
    const f = fake({
      renderChecks: [[FAILED_CONTRAST], [PASSED]],
      answers: { revise: [revision(["hero"])] },
    });
    const result = await runJob(spec(), f.deps);
    expect(result.status).toBe("failed");
    expect(result.error).toContain("regenerateAssets harus kosong");
    expect(f.assetCalls).toEqual(["hero"]);
  });

  it("berhenti setelah 1 putaran revisi dan tetap selesai dengan QA gagal (T-137)", async () => {
    const f = fake({ renderChecks: [[FAILED_CONTRAST]] });
    const result = await runJob(spec(), f.deps);
    expect(result).toMatchObject({ status: "done", qa: { round: 1, passed: false } });
    expect(f.calls.filter((c) => c.stage === "revise")).toHaveLength(1);
    expect(files()("10-qa.json")).toBe(true);
    expect(files()("11-revise.json")).toBe(false);
  });

  it("revisi yang memperburuk skor: hasil akhir tetap putaran terbaik (T-137)", async () => {
    const scored = (idea: number) => ({ ...visual(7), scores: { ...visual(7).scores, idea } });
    const f = fake({ answers: { "qa-visual": [scored(6), scored(5)] } });
    const result = await runJob(spec(), f.deps);
    expect(result.qa).toMatchObject({ round: 0, passed: false, visual: { scores: { idea: 6 } } });
  });

  it("skor lolos tetapi ada perbaikan wajib: revisi hanya dengan perbaikan wajib (T-118)", async () => {
    const withFixes = {
      ...visual(9),
      fixes: [
        { target: "copy", severity: "wajib", instruction: "Hapus jam buka yang berulang di body" },
        { target: "copy", severity: "saran", instruction: "CTA bisa lebih spesifik" },
      ],
    };
    const f = fake({ answers: { "qa-visual": [withFixes, visual(9)] } });
    const result = await runJob(spec(), f.deps);
    expect(result.qa).toMatchObject({ round: 1, passed: true });
    const revisePrompt = f.calls.find((c) => c.stage === "revise")?.prompt ?? "";
    expect(revisePrompt).toContain("Hapus jam buka yang berulang di body");
    expect(revisePrompt).not.toContain("CTA bisa lebih spesifik");
  });

  it("skor lolos dengan saran saja: selesai tanpa revisi dan saran tetap tersimpan", async () => {
    const suggestion = {
      target: "copy",
      severity: "saran",
      instruction: "CTA bisa lebih spesifik",
    };
    const f = fake({ answers: { "qa-visual": [{ ...visual(9), fixes: [suggestion] }] } });
    const result = await runJob(spec(), f.deps);
    expect(result.qa).toMatchObject({ round: 0, passed: true, fixes: [suggestion] });
    expect(f.calls.some((c) => c.stage === "revise")).toBe(false);
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

  it("mencatat detail error CLI (stderr) di job.json", async () => {
    const stderr = "Error: --json-schema is not a valid JSON Schema: no schema with key or ref";
    const f = fake({ answers: { plan: [new ClaudeRunError("Claude gagal (exit 1)", stderr)] } });
    await runJob(spec(), f.deps);
    expect(jobJson().error).toBe(`Claude gagal (exit 1): ${stderr}`);
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

  it("revisi dengan varian logo yang tidak ada di Brand Kit ditolak sebelum render (T-119)", async () => {
    const bad = structuredClone(revision([]));
    bad.layout.slides[0] = {
      ...bad.layout.slides[0],
      slots: { ...bad.layout.slides[0]?.slots, logo: { type: "logo", variant: "onLight" } },
    } as (typeof layout.slides)[number];
    const f = fake({ answers: { revise: [bad] }, renderChecks: [[FAILED_CONTRAST], [PASSED]] });
    const result = await runJob(spec(), f.deps);
    expect(result.status).toBe("failed");
    expect(result.error).toContain(
      "varian logo onLight tidak ada di Brand Kit (tersedia: primary, onDark)",
    );
    expect(f.renders).toBe(1);
  });

  it("file layout lama dengan varian logo yang tidak ada dianggap tidak valid saat resume", async () => {
    const f = fake({});
    await runJob(spec(), f.deps);
    const path = join(jobDir(tmp, "brief-1-v1"), "03-layout.json");
    const stored = JSON.parse(readFileSync(path, "utf8"));
    stored.slides[0].slots.logo.variant = "icon";
    writeFileSync(path, JSON.stringify(stored));
    f.calls.length = 0;
    expect((await runJob(spec(), f.deps)).status).toBe("done");
    expect(f.calls.map((c) => c.stage)).toEqual(["layout", "qa-visual"]);
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

describe("QA visual dengan knowledge, logo, dan hasil kode (T-126)", () => {
  it("prompt QA memuat knowledge, keterangan logo, dan saran desain terukur dari render", async () => {
    const advice: RenderCheck = {
      rule: "thirds",
      passed: false,
      severity: "saran",
      target: "fokus subjek",
      message: "Fokus subjek 12% dari titik potong terdekat",
    };
    const f = fake({ renderChecks: [[PASSED, advice]] });
    await runJob(spec(), f.deps);
    const prompt = f.calls.find((c) => c.stage === "qa-visual")?.prompt ?? "";
    expect(prompt).toContain("<knowledge>\nKedai kopi di Bandung.\n</knowledge>");
    expect(prompt).toContain("<logo>\nLogo tidak tersedia.\n</logo>");
    expect(prompt).toContain("Saran desain terukur:");
    expect(prompt).toContain(
      "- slide 1, thirds fokus subjek: Fokus subjek 12% dari titik potong terdekat",
    );
  });
});

describe("konsep visual dan setting dari plan (T-125)", () => {
  it("angle berisi ide visual ke copy dan layout; setting ke layout dan setiap aset", async () => {
    const f = fake({});
    await runJob(spec(), f.deps);
    const copyPrompt = f.calls.find((c) => c.stage === "copy")?.prompt ?? "";
    expect(copyPrompt).toContain('"idea": "Ide visual 1"');
    const layoutPrompt = f.calls.find((c) => c.stage === "layout")?.prompt ?? "";
    expect(layoutPrompt).toContain("<setting>");
    expect(layoutPrompt).toContain("a quiet alley in Bandung, Indonesia");
    expect(f.settings).toEqual([plan(1).setting]);
  });
});

describe("gaya desain di pipeline (T-133)", () => {
  const CYBERPUNK = { id: "cyberpunk", variant: "neon-gelap" };

  it("konteks gaya di setiap prompt Claude, katalog arketipe gaya dulu, styleOptions ke render", async () => {
    const styled = { ...structuredClone(layout), styleOptions: { glow: "solid" } };
    const f = fake({ answers: { layout: [styled], "qa-visual": [visual(9)] } });
    const result = await runJob(spec({ style: CYBERPUNK }), f.deps);
    expect(result.status).toBe("done");
    for (const stage of ["plan", "copy", "layout", "qa-visual"] as const) {
      const prompt = f.calls.find((c) => c.stage === stage)?.prompt ?? "";
      expect(prompt, stage).toContain("Gaya: Cyberpunk/Futuristik, varian neon-gelap");
    }
    const layoutPrompt = f.calls.find((c) => c.stage === "layout")?.prompt ?? "";
    const catalogBlock = layoutPrompt.slice(layoutPrompt.indexOf("<catalog>"));
    expect(catalogBlock.indexOf('"feed-kata-terbelah"')).toBeLessThan(
      catalogBlock.indexOf('"feed-bidang-warna"'),
    );
    expect(f.styles).toEqual([{ ...CYBERPUNK, options: { glow: "solid" } }]);
  });

  it("tanpa gaya: prompt menyebut tanpa gaya dan render tanpa pilihan gaya", async () => {
    const f = fake({});
    await runJob(spec(), f.deps);
    expect(f.calls.find((c) => c.stage === "layout")?.prompt).toContain("Tanpa gaya:");
    expect(f.styles).toEqual([undefined]);
  });

  it("brand berkulit asli: foto orang wajib foto natural bila gaya menawarkannya (T-124)", () => {
    const context = {
      ...layoutContext({ meta: findStyle("brutalism"), variant: "cetak" }),
      photo: { realSkin: true },
    };
    const withFoto = (foto?: string) => ({
      ...structuredClone(layout),
      ...(foto ? { styleOptions: { foto } } : {}),
    });
    const expected =
      'Brand mewajibkan tekstur kulit asli: isi styleOptions "foto" dengan "natural"';
    expect(
      layoutSchema(context)
        .safeParse(withFoto())
        .error?.issues.map((i) => i.message),
    ).toEqual([expected]);
    expect(
      layoutSchema(context)
        .safeParse(withFoto("mono"))
        .error?.issues.map((i) => i.message),
    ).toEqual([expected]);
    expect(layoutSchema(context).safeParse(withFoto("natural")).success).toBe(true);
  });

  it("styleOptions divalidasi terhadap gaya job; tanpa gaya harus kosong", () => {
    const withOptions = (styleOptions: Record<string, string>) => ({
      ...structuredClone(layout),
      styleOptions,
    });
    const styled = layoutSchema(
      layoutContext({ meta: findStyle("cyberpunk"), variant: "neon-gelap" }),
    );
    expect(styled.safeParse(withOptions({ glow: "solid" })).success).toBe(true);
    expect(
      styled.safeParse(withOptions({ kilau: "solid" })).error?.issues.map((i) => i.message),
    ).toEqual(['Gaya "cyberpunk" tidak punya opsi "kilau"']);
    expect(
      layoutSchema(layoutContext())
        .safeParse(withOptions({ glow: "solid" }))
        .error?.issues.map((i) => i.message),
    ).toEqual(["Tanpa gaya desain, styleOptions harus kosong"]);
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

const layoutContext = (style: Parameters<typeof layoutSchema>[0]["style"] = null) => ({
  catalog,
  slideCount: 1,
  logo: BrandKit.parse(read("brand.json")).logo,
  style,
});

describe("skema tahap", () => {
  it("menolak plan dengan jumlah angle salah dan layout yang melanggar katalog", () => {
    expect(planSchema(spec({ variantCount: 2 })).safeParse(plan(1)).error?.issues[0]?.message).toBe(
      "Rencana harus berisi tepat 2 angle",
    );
    const long = structuredClone(layout);
    long.slides[0] = {
      ...long.slides[0],
      slots: { ...long.slides[0]?.slots, headline: { type: "text", value: "x".repeat(41) } },
    } as (typeof layout.slides)[number];
    const messages = layoutSchema(layoutContext())
      .safeParse(long)
      .error?.issues.map((i) => i.message);
    expect(messages).toContain('Slide 1: slot "headline" melebihi 40 karakter');
  });

  it("ambang QA visual: ide ≥ 7 dan rata-rata ≥ 6, tanpa batas per aspek (T-137)", () => {
    const scored = (score: number, overrides: Record<string, number> = {}) =>
      VisualQa.parse({ ...visual(score), scores: { ...visual(score).scores, ...overrides } });
    expect(visualPassed(scored(7))).toBe(true);
    expect(visualPassed(scored(9, { idea: 6 }))).toBe(false);
    expect(visualPassed(scored(6, { idea: 7 }))).toBe(true);
    expect(visualPassed(scored(6, { idea: 7, balance: 4, interlock: 4 }))).toBe(false);
    expect(visualPassed(scored(7, { interlock: 4 }))).toBe(true);
  });

  it("layout dan revisi hanya boleh memakai varian logo yang ada di Brand Kit (T-119)", () => {
    const withLogo = (variant: string) => {
      const l = structuredClone(layout);
      l.slides[0] = {
        ...l.slides[0],
        slots: { ...l.slides[0]?.slots, logo: { type: "logo", variant } },
      } as (typeof layout.slides)[number];
      return l;
    };
    const expected =
      'Slide 1 slot "logo": varian logo onLight tidak ada di Brand Kit (tersedia: primary, onDark)';
    expect(layoutSchema(layoutContext()).safeParse(withLogo("onDark")).success).toBe(true);
    expect(
      layoutSchema(layoutContext())
        .safeParse(withLogo("onLight"))
        .error?.issues.map((i) => i.message),
    ).toEqual([expected]);
    const revised = { ...revision([]), layout: withLogo("onLight") };
    expect(
      revisionSchema(layoutContext())
        .safeParse(revised)
        .error?.issues.map((i) => i.message),
    ).toEqual([expected]);
  });
});
