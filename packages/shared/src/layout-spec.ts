import { z } from "zod";
import type { BrandKit } from "./brand-kit.ts";
import { AspectRatio, ContentFormat, duplicates, Slug, slideCountError } from "./common.ts";

export const LogoVariant = z.enum(["primary", "onDark", "onLight", "icon"]);
export type LogoVariant = z.infer<typeof LogoVariant>;

export const SlotValue = z.discriminatedUnion("type", [
  z.strictObject({ type: z.literal("text"), value: z.string().min(1) }),
  z.strictObject({ type: z.literal("image"), assetId: Slug }),
  z.strictObject({ type: z.literal("logo"), variant: LogoVariant }),
  z.strictObject({ type: z.literal("badge"), value: z.string().min(1) }),
]);
export type SlotValue = z.infer<typeof SlotValue>;

// Jenis aset: foto utuh, atau subjek cut-out berlatar transparan (T-121, T-123).
export const AssetKind = z.enum(["photo", "cutout"]);
export type AssetKind = z.infer<typeof AssetKind>;

// Jenis subjek cut-out: menentukan titik fokus (wajah untuk orang, badan untuk objek) (T-123).
export const SubjectKind = z.enum(["person", "object"]);
export type SubjectKind = z.infer<typeof SubjectKind>;

// Kebutuhan aset gambar tanpa teks (ARCH 4.5, PRD 4 prinsip 1). Tanpa `kind` berarti foto;
// cut-out wajib menyebut jenis subjeknya (T-131).
export const AssetRequest = z
  .strictObject({
    id: Slug,
    description: z.string().min(1),
    aspectRatio: AspectRatio,
    kind: AssetKind.optional(),
    subject: SubjectKind.optional(),
  })
  .refine((request) => request.kind !== "cutout" || request.subject !== undefined, {
    message: 'Aset cutout wajib punya subject "person" atau "object"',
    path: ["subject"],
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

// Varian logo yang punya file di Brand Kit (primary selalu ada).
export function logoVariants(logo: BrandKit["logo"]): LogoVariant[] {
  return LogoVariant.options.filter((variant) => logo[variant] !== undefined);
}

// Kecocokan slot logo dengan Brand Kit (T-119): varian tanpa file ditolak saat validasi tahap,
// sebelum sampai ke renderer. Mengembalikan daftar masalah (kosong bila cocok).
export function logoIssues(spec: LayoutSpec, logo: BrandKit["logo"]): string[] {
  const available = logoVariants(logo);
  const issues: string[] = [];
  spec.slides.forEach((slide, index) => {
    for (const [name, value] of Object.entries(slide.slots)) {
      if (value.type === "logo" && !available.includes(value.variant)) {
        issues.push(
          `Slide ${index + 1} slot "${name}": varian logo ${value.variant} tidak ada di Brand Kit (tersedia: ${available.join(", ")})`,
        );
      }
    }
  });
  return issues;
}
