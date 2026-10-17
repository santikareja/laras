import { describe, expect, it } from "vitest";
import { type RenderCheck, RenderReport } from "./render-report.ts";
import { issuesOf } from "./test-utils.ts";

const check = (passed: boolean): RenderCheck => ({
  rule: "contrast",
  passed,
  target: "headline",
  message: passed ? "Kontras 7.1:1" : "Kontras 2.9:1 di bawah 4.5:1",
  measured: passed ? 7.1 : 2.9,
  threshold: 4.5,
});

const report = (passed = true): RenderReport => ({
  slides: [
    {
      index: 0,
      htmlPath: "slides/01.html",
      pngPath: "slides/01.png",
      width: 2160,
      height: 2700,
      checks: [check(passed), { rule: "overflow", passed: true, message: "Tidak ada overflow" }],
    },
  ],
  passed,
});

describe("RenderReport", () => {
  it("menerima laporan lolos dan laporan gagal yang konsisten", () => {
    expect(issuesOf(RenderReport, report(true))).toEqual([]);
    expect(issuesOf(RenderReport, report(false))).toEqual([]);
  });

  it("menolak passed yang tidak sesuai hasil cek", () => {
    expect(issuesOf(RenderReport, { ...report(false), passed: true })).toContain(
      "passed harus sesuai hasil semua cek",
    );
  });

  it("menolak index slide yang tidak berurutan", () => {
    const r = report();
    const slide = r.slides[0];
    if (!slide) throw new Error("fixture tanpa slide");
    r.slides = [slide, { ...slide, index: 2 }];
    expect(issuesOf(RenderReport, r)).toContain("Index slide harus berurutan mulai 0");
  });

  it("menolak aturan yang tidak dikenal dan laporan tanpa slide", () => {
    const r = report();
    const unknownRule = {
      ...r,
      slides: r.slides.map((s) => ({ ...s, checks: [{ ...check(true), rule: "vibe" }] })),
    };
    expect(RenderReport.safeParse(unknownRule).success).toBe(false);
    expect(RenderReport.safeParse({ slides: [], passed: true }).success).toBe(false);
  });
});
