import { z } from "zod";
import { ContentFormat, NonEmptyText, RelativePath, Slug, slideCountError } from "./common.ts";

// Job pipeline (ARCH 5.1): satu job = satu varian dari satu brief. Disimpan di
// jobs/<job-id>/job.json; event per tahap di jobs/<job-id>/events.jsonl.

export const JobStage = z.enum(["plan", "copy", "layout", "assets", "render", "qa", "revise"]);
export type JobStage = z.infer<typeof JobStage>;

export const JobStatus = z.enum([
  "queued",
  ...JobStage.options,
  "done",
  "waiting_quota",
  "interrupted",
  "failed",
  "cancelled",
]);
export type JobStatus = z.infer<typeof JobStatus>;

export const JobSpec = z
  .strictObject({
    id: Slug,
    briefId: Slug,
    brief: NonEmptyText,
    format: ContentFormat,
    slideCount: z.int().min(1).max(20),
    variant: z.int().min(1).max(4),
    variantCount: z.int().min(1).max(4),
    templatePreference: z.string().min(1).nullable(),
    // Foto milik pengguna per id aset, relatif terhadap folder project (PRD US-15).
    userAssets: z.record(Slug, RelativePath),
  })
  .superRefine((spec, ctx) => {
    const countError = slideCountError(spec.format, spec.slideCount);
    if (countError) ctx.addIssue({ code: "custom", path: ["slideCount"], message: countError });
    if (spec.variant > spec.variantCount) {
      ctx.addIssue({
        code: "custom",
        path: ["variant"],
        message: "Nomor varian melebihi jumlah varian",
      });
    }
  });
export type JobSpec = z.infer<typeof JobSpec>;

export const JobState = z.strictObject({
  spec: JobSpec,
  status: JobStatus,
  error: z.string().min(1).nullable(),
  // Untuk waiting_quota: kapan kuota diperkirakan pulih (bila diketahui).
  resumeAt: z.iso.datetime().nullable(),
  updatedAt: z.iso.datetime(),
});
export type JobState = z.infer<typeof JobState>;

export const JobEvent = z.strictObject({
  at: z.iso.datetime(),
  step: z.int().min(1),
  stage: JobStage,
  type: z.enum(["started", "completed", "failed"]),
  durationMs: z.number().min(0).optional(),
  costUsd: z.number().min(0).optional(),
  message: z.string().min(1).optional(),
});
export type JobEvent = z.infer<typeof JobEvent>;
