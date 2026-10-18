import { z } from "zod";
import { RenderCheck } from "./render-report.ts";

const MAX_REVISION_ROUNDS = 2; // PRD F7

const Score = z.int().min(1).max(10);

// target menentukan tahap tempat revisi masuk ulang (ARCH 5.1). severity `wajib` = kesalahan
// yang harus diperbaiki sebelum lolos; `saran` = peningkatan opsional untuk ditampilkan di UI.
export const QaFix = z.strictObject({
  target: z.enum(["copy", "layout", "assets"]),
  severity: z.enum(["wajib", "saran"]),
  slideIndex: z.int().min(0).optional(),
  instruction: z.string().min(1),
});
export type QaFix = z.infer<typeof QaFix>;

// Output QA visual dari Claude (PRD F9). Ambang lolos tidak di sini karena bisa diatur.
export const VisualQa = z.strictObject({
  scores: z.strictObject({
    hierarchy: Score,
    balance: Score,
    readability: Score,
    referenceFit: Score,
    professionalism: Score,
  }),
  summary: z.string().min(1),
  fixes: z.array(QaFix),
});
export type VisualQa = z.infer<typeof VisualQa>;

// Gabungan QA deterministik dan visual per putaran (ARCH 5.2, 5.4).
export const QaReport = z
  .strictObject({
    round: z.int().min(0).max(MAX_REVISION_ROUNDS),
    deterministic: z.strictObject({
      passed: z.boolean(),
      failures: z.array(RenderCheck),
    }),
    visual: VisualQa.nullable(),
    fixes: z.array(QaFix),
    passed: z.boolean(),
  })
  .superRefine((report, ctx) => {
    const { passed, failures } = report.deterministic;
    if (failures.some((check) => check.passed)) {
      ctx.addIssue({
        code: "custom",
        path: ["deterministic", "failures"],
        message: "failures hanya berisi cek yang gagal",
      });
    }
    if (passed !== (failures.length === 0)) {
      ctx.addIssue({
        code: "custom",
        path: ["deterministic", "passed"],
        message: "passed harus true hanya bila tidak ada failures",
      });
    }
    if (report.passed && !passed) {
      ctx.addIssue({
        code: "custom",
        path: ["passed"],
        message: "QA tidak bisa lolos bila QA deterministik gagal",
      });
    }
    if (report.passed && report.fixes.some((fix) => fix.severity === "wajib")) {
      ctx.addIssue({
        code: "custom",
        path: ["passed"],
        message: "QA tidak bisa lolos bila ada perbaikan wajib",
      });
    }
  });
export type QaReport = z.infer<typeof QaReport>;
