import { describe, expect, it } from "vitest";
import { QaReport, VisualQa } from "./qa-report.ts";
import { issuesOf } from "./test-utils.ts";

const visual = (): VisualQa => ({
  scores: { hierarchy: 8, balance: 9, readability: 8, referenceFit: 7, professionalism: 8 },
  summary: "Hierarki jelas, CTA kurang kontras",
  fixes: [
    {
      target: "layout",
      severity: "saran",
      slideIndex: 0,
      instruction: "Perbesar kontras tombol CTA",
    },
  ],
});

const qaReport = (): QaReport => ({
  round: 0,
  deterministic: { passed: true, failures: [] },
  visual: visual(),
  fixes: visual().fixes,
  passed: true,
});

describe("VisualQa", () => {
  it("menerima skor 1–10 dan daftar perbaikan", () => {
    expect(issuesOf(VisualQa, visual())).toEqual([]);
  });

  it("menolak skor di luar 1–10, pecahan, dan target perbaikan tidak dikenal", () => {
    for (const score of [0, 11, 7.5]) {
      const v = visual();
      v.scores.balance = score;
      expect(VisualQa.safeParse(v).success).toBe(false);
    }
    const badFix = {
      ...visual(),
      fixes: [{ target: "render", severity: "saran", instruction: "x" }],
    };
    expect(VisualQa.safeParse(badFix).success).toBe(false);
    const noSeverity = { ...visual(), fixes: [{ target: "copy", instruction: "x" }] };
    expect(VisualQa.safeParse(noSeverity).success).toBe(false);
  });
});

describe("QaReport", () => {
  it("menerima putaran lolos dan putaran gagal deterministik tanpa QA visual", () => {
    expect(issuesOf(QaReport, qaReport())).toEqual([]);
    const failed: QaReport = {
      round: 1,
      deterministic: {
        passed: false,
        failures: [
          { rule: "overflow", passed: false, target: "headline", message: "Headline terpotong" },
        ],
      },
      visual: null,
      fixes: [
        {
          target: "copy",
          severity: "wajib",
          slideIndex: 0,
          instruction: "Pendekkan headline menjadi maks. 6 kata",
        },
      ],
      passed: false,
    };
    expect(issuesOf(QaReport, failed)).toEqual([]);
  });

  it("menolak QA lolos saat masih ada perbaikan wajib", () => {
    const fix = {
      target: "copy" as const,
      severity: "wajib" as const,
      instruction: "Hapus jam buka yang berulang",
    };
    expect(issuesOf(QaReport, { ...qaReport(), fixes: [fix] })).toContain(
      "QA tidak bisa lolos bila ada perbaikan wajib",
    );
  });

  it("menolak QA lolos saat QA deterministik gagal", () => {
    const r = {
      ...qaReport(),
      deterministic: {
        passed: false,
        failures: [{ rule: "overflow", passed: false, message: "Terpotong" }],
      },
    };
    expect(issuesOf(QaReport, r)).toContain("QA tidak bisa lolos bila QA deterministik gagal");
  });

  it("menolak failures yang tidak konsisten dan putaran lebih dari 2", () => {
    const passedFailure = {
      ...qaReport(),
      deterministic: {
        passed: false,
        failures: [{ rule: "overflow", passed: true, message: "OK" }],
      },
      passed: false,
    };
    expect(issuesOf(QaReport, passedFailure)).toContain("failures hanya berisi cek yang gagal");
    const inconsistent = {
      ...qaReport(),
      deterministic: {
        passed: true,
        failures: [{ rule: "overflow", passed: false, message: "Terpotong" }],
      },
    };
    expect(issuesOf(QaReport, inconsistent)).toContain(
      "passed harus true hanya bila tidak ada failures",
    );
    expect(QaReport.safeParse({ ...qaReport(), round: 3 }).success).toBe(false);
  });
});
