import { z } from "zod";
import { duplicates, RelativePath, Slug } from "./common.ts";

export const AssetSource = z.enum(["codex", "user", "library"]);

const ImageFile = RelativePath.refine(
  (path) => /\.(png|jpe?g|webp)$/i.test(path),
  "File aset harus PNG, JPG, atau WebP",
);

const Fraction = z.number().min(0).max(1);

// Hasil analisis cut-out (T-123): kotak alpha dan titik fokus dalam pecahan lebar/tinggi gambar,
// dipakai arketipe untuk menempatkan subjek dan teks (PRD 4 P8).
export const SubjectInfo = z
  .strictObject({
    box: z.strictObject({ left: Fraction, top: Fraction, right: Fraction, bottom: Fraction }),
    focus: z.strictObject({ x: Fraction, y: Fraction }),
  })
  .refine(({ box }) => box.left < box.right && box.top < box.bottom, {
    message: "Kotak subjek harus punya lebar dan tinggi",
  });
export type SubjectInfo = z.infer<typeof SubjectInfo>;

// Output tahap assets (ARCH 5.2, 5.3): path relatif terhadap folder job.
export const AssetManifest = z
  .strictObject({
    assets: z.array(
      z.strictObject({
        id: Slug,
        path: ImageFile,
        width: z.int().positive(),
        height: z.int().positive(),
        source: AssetSource,
        // Hanya untuk aset cut-out berlatar transparan.
        subject: SubjectInfo.optional(),
      }),
    ),
  })
  .superRefine((manifest, ctx) => {
    for (const id of duplicates(manifest.assets.map((a) => a.id))) {
      ctx.addIssue({
        code: "custom",
        path: ["assets"],
        message: `Id aset "${id}" dipakai lebih dari sekali`,
      });
    }
  });
export type AssetManifest = z.infer<typeof AssetManifest>;
