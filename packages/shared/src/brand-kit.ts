import { z } from "zod";
import { HexColor, RelativePath } from "./common.ts";

const MIN_FONT_SIZE = 24; // PRD F9: ukuran font minimum pada ukuran dasar 1080 px

const FontFile = RelativePath.refine(
  (path) => /\.(woff2|otf|ttf)$/i.test(path),
  "File font harus WOFF2, OTF, atau TTF",
);
const LogoFile = RelativePath.refine(
  (path) => /\.(svg|png)$/i.test(path),
  "File logo harus SVG atau PNG",
);

const FontRole = z.strictObject({
  family: z.string().min(1),
  file: FontFile,
  weights: z.array(z.int().min(100).max(900).multipleOf(100)).min(1),
});

const TypeScale = z
  .array(z.number().positive())
  .min(2)
  .refine((scale) => scale.every((size, i) => i === 0 || size > (scale[i - 1] ?? 0)), {
    message: "Skala tipografi harus naik berurutan",
  })
  .refine((scale) => Math.min(...scale) >= MIN_FONT_SIZE, {
    message: `Ukuran terkecil skala tipografi minimal ${MIN_FONT_SIZE} px`,
  });

// brand.json per project (ARCH 6.1, PRD F2).
export const BrandKit = z.strictObject({
  colors: z.strictObject({
    primary: HexColor,
    secondary: HexColor,
    accent: HexColor,
    neutral: z
      .record(
        z.string().regex(/^\d{2,3}$/, "Kunci warna netral berupa angka, mis. 50 atau 900"),
        HexColor,
      )
      .refine((neutral) => Object.keys(neutral).length >= 2, {
        message: "Minimal dua warna netral (terang dan gelap)",
      }),
  }),
  typography: z.strictObject({
    heading: FontRole,
    body: FontRole,
    scale: TypeScale,
  }),
  shape: z.strictObject({
    radius: z.number().min(0),
    stroke: z.number().min(0),
    shadow: z.string().min(1),
  }),
  spacing: z.strictObject({
    unit: z.int().positive(),
    safeMargin: z.number().min(0),
  }),
  logo: z.strictObject({
    primary: LogoFile,
    onDark: LogoFile.optional(),
    onLight: LogoFile.optional(),
    icon: LogoFile.optional(),
  }),
  rules: z.array(z.string().min(1)),
});
export type BrandKit = z.infer<typeof BrandKit>;
