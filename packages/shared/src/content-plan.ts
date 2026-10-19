import { z } from "zod";
import { ContentFormat, duplicates, Slug, slideCountError } from "./common.ts";

// Tipe slide sistem carousel (ARCH 6.2); feed memakai satu slide.
export const SlideRole = z.enum(["hook", "body", "list", "quote", "cta"]);
export type SlideRole = z.infer<typeof SlideRole>;

// Konsep visual satu varian (PRD 4 K1, T-125): satu ide besar yang membawa pesan, bukan foto
// suasana. `idea` dalam bahasa konten brand; `image` dalam bahasa Inggris (bahan prompt gambar).
export const VisualConcept = z.strictObject({
  idea: z.string().min(1),
  image: z.string().min(1),
  // cutout: subjek terpisah di atas bidang warna (K4); photo: foto utuh; concept: foto metafora.
  kind: z.enum(["cutout", "photo", "concept"]),
});
export type VisualConcept = z.infer<typeof VisualConcept>;

export const Angle = z.strictObject({
  id: Slug,
  angle: z.string().min(1),
  rationale: z.string().min(1),
  visual: VisualConcept,
});
export type Angle = z.infer<typeof Angle>;

// Output tahap plan: satu per brief, satu angle per varian (ARCH 5.1, 5.2; PRD F7).
export const ContentPlan = z
  .strictObject({
    format: ContentFormat,
    keyMessage: z.string().min(1),
    audience: z.string().min(1),
    // Lokasi dan orang untuk semua gambar brief ini, dari knowledge (bahasa Inggris, T-125).
    setting: z.strictObject({ location: z.string().min(1), people: z.string().min(1) }),
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
