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

// Output QA visual dari Claude (PRD F9, T-126): delapan aspek dari kriteria K dan prinsip P di
// PRD 4. Ambang lolos tidak di sini karena bisa diatur.
export const VisualQa = z.strictObject({
  scores: z.strictObject({
    idea: Score, // K1 satu ide besar
    typography: Score, // K2 tipografi sebagai elemen visual, K7 teks hemat
    interlock: Score, // K3 teks dan gambar mengunci, K4 cut-out di bidang warna bila cocok
    brand: Score, // K5 perangkat grafis brand, aturan brand teks bebas, kesesuaian gaya
    hierarchy: Score, // P2 satu elemen dominan, urutan baca
    balance: Score, // P3 kedekatan, P5 anggaran visual, P6 keseimbangan
    readability: Score, // P7 keterbacaan di ukuran feed
    professionalism: Score, // dikerjakan desainer, bukan generik atau AI-slop
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
