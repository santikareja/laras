import { z } from "zod";
import { AspectRatio, ContentFormat, duplicates, Slug, slideCountError } from "./common.ts";

export const LogoVariant = z.enum(["primary", "onDark", "onLight", "icon"]);

export const SlotValue = z.discriminatedUnion("type", [
  z.strictObject({ type: z.literal("text"), value: z.string().min(1) }),
  z.strictObject({ type: z.literal("image"), assetId: Slug }),
  z.strictObject({ type: z.literal("logo"), variant: LogoVariant }),
  z.strictObject({ type: z.literal("badge"), value: z.string().min(1) }),
]);
export type SlotValue = z.infer<typeof SlotValue>;

// Kebutuhan aset gambar tanpa teks (ARCH 4.5, PRD 4 prinsip 1).
export const AssetRequest = z.strictObject({
  id: Slug,
  description: z.string().min(1),
  aspectRatio: AspectRatio,
});
export type AssetRequest = z.infer<typeof AssetRequest>;

export const LayoutSlide = z.strictObject({
  slots: z.record(z.string().min(1), SlotValue),
  options: z.record(z.string().min(1), z.string().min(1)),
});

// Output tahap layout (ARCH 5.2, 5.3).
export const LayoutSpec = z
  .strictObject({
    templateId: z.string().min(1),
    format: ContentFormat,
    slides: z.array(LayoutSlide),
    assetRequests: z.array(AssetRequest),
  })
  .superRefine((spec, ctx) => {
    const countError = slideCountError(spec.format, spec.slides.length);
    if (countError) ctx.addIssue({ code: "custom", path: ["slides"], message: countError });
    const requested = spec.assetRequests.map((r) => r.id);
    for (const id of duplicates(requested)) {
      ctx.addIssue({
        code: "custom",
        path: ["assetRequests"],
        message: `Id aset "${id}" dipakai lebih dari sekali`,
      });
    }
    spec.slides.forEach((slide, index) => {
      for (const [slot, value] of Object.entries(slide.slots)) {
        if (value.type === "image" && !requested.includes(value.assetId)) {
          ctx.addIssue({
            code: "custom",
            path: ["slides", index, "slots", slot],
            message: `Slot gambar merujuk aset "${value.assetId}" yang tidak ada di assetRequests`,
          });
        }
      }
    });
  });
export type LayoutSpec = z.infer<typeof LayoutSpec>;
