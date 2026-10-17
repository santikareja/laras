import { z } from "zod";
import { duplicates, RelativePath, Slug } from "./common.ts";

export const AssetSource = z.enum(["codex", "user", "library"]);

const ImageFile = RelativePath.refine(
  (path) => /\.(png|jpe?g|webp)$/i.test(path),
  "File aset harus PNG, JPG, atau WebP",
);

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
