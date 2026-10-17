import { z } from "zod";
import { ContentFormat, duplicates, Slug, slideCountError } from "./common.ts";

// Tipe slide sistem carousel (ARCH 6.2); feed memakai satu slide.
export const SlideRole = z.enum(["hook", "body", "list", "quote", "cta"]);
export type SlideRole = z.infer<typeof SlideRole>;

export const Angle = z.strictObject({
  id: Slug,
  angle: z.string().min(1),
  rationale: z.string().min(1),
});
export type Angle = z.infer<typeof Angle>;

// Output tahap plan: satu per brief, satu angle per varian (ARCH 5.1, 5.2; PRD F7).
export const ContentPlan = z
  .strictObject({
    format: ContentFormat,
    keyMessage: z.string().min(1),
    audience: z.string().min(1),
    slides: z.array(z.strictObject({ role: SlideRole, intent: z.string().min(1) })),
    angles: z.array(Angle).min(1).max(4),
  })
  .superRefine((plan, ctx) => {
    const countError = slideCountError(plan.format, plan.slides.length);
    if (countError) ctx.addIssue({ code: "custom", path: ["slides"], message: countError });
    for (const id of duplicates(plan.angles.map((a) => a.id))) {
      ctx.addIssue({
        code: "custom",
        path: ["angles"],
        message: `Id angle "${id}" dipakai lebih dari sekali`,
      });
    }
    const normalized = plan.angles.map((a) => a.angle.trim().toLowerCase());
    if (duplicates(normalized).length > 0) {
      ctx.addIssue({
        code: "custom",
        path: ["angles"],
        message: "Setiap varian harus memakai angle yang berbeda",
      });
    }
  });
export type ContentPlan = z.infer<typeof ContentPlan>;
