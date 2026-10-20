import { z } from "zod";
import { RelativePath } from "./common.ts";

// Aturan QA deterministik (PRD F9, ARCH 7.2).
export const RenderRule = z.enum([
  "contrast",
  "overflow",
  "safe-margin",
  "font-size",
  "brand-font",
  "brand-color",
  "forbidden-word",
  "emoji-hashtag",
  "asset-load",
  // Teks di atas area foto yang ramai (T-141, keputusan pemilik: wajib).
  "busy-background",
  // Aturan brand terstruktur (BrandKit.constraints, T-124), bertingkat wajib.
  "brand-logo-position",
  "brand-gradient",
  "brand-visuals",
  // Aturan desain terukur PRD 4 (T-130), awalnya bertingkat saran.
  "alignment",
  "hierarchy",
  "typography",
  "thirds",
  "color-balance",
  "whitespace",
  "element-count",
  "consistency",
]);
export type RenderRule = z.infer<typeof RenderRule>;

export const RenderCheck = z.strictObject({
  rule: RenderRule,
  passed: z.boolean(),
  target: z.string().min(1).optional(),
  message: z.string().min(1),
  measured: z.number().optional(),
  threshold: z.number().optional(),
  // `saran` tidak menggagalkan render (aturan desain baru sampai terkalibrasi, keputusan pemilik
  // T-123); tanpa nilai berarti wajib.
  severity: z.enum(["wajib", "saran"]).optional(),
});
export type RenderCheck = z.infer<typeof RenderCheck>;

// Cek yang gagal dan wajib: menggagalkan render dan memicu revisi.
export function isBlocking(check: RenderCheck): boolean {
  return !check.passed && check.severity !== "saran";
}

export const RenderedSlide = z.strictObject({
  index: z.int().min(0),
  htmlPath: RelativePath,
  pngPath: RelativePath,
  width: z.int().positive(),
  height: z.int().positive(),
  checks: z.array(RenderCheck),
});

// Output tahap render (ARCH 5.2, 7.2).
export const RenderReport = z
  .strictObject({
    slides: z.array(RenderedSlide).min(1),
    passed: z.boolean(),
  })
  .superRefine((report, ctx) => {
    if (report.slides.some((slide, i) => slide.index !== i)) {
      ctx.addIssue({
        code: "custom",
        path: ["slides"],
        message: "Index slide harus berurutan mulai 0",
      });
    }
    const allPassed = report.slides.every((slide) => !slide.checks.some(isBlocking));
    if (report.passed !== allPassed) {
      ctx.addIssue({
        code: "custom",
        path: ["passed"],
        message: "passed harus sesuai hasil semua cek",
      });
    }
  });
export type RenderReport = z.infer<typeof RenderReport>;
