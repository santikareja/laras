import { z } from "zod";
import { ColorToken, HexColor, RelativePath } from "./common.ts";

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

// Aturan brand terstruktur (PRD 4 prinsip 8, F2, T-124): setiap aturan ditegakkan kode, bukan
// hanya ditulis untuk Claude. Aturan yang tidak terukur tetap di `rules` sebagai teks bebas.
export const BrandConstraints = z.strictObject({
  // Kuadran pusat logo di setiap slide.
  logoPosition: z.enum(["top-left", "top-right", "bottom-left", "bottom-right"]).optional(),
  // Tanpa gradient CSS (latar, mask, isi huruf); gaya yang butuh gradient kurang cocok.
  noGradient: z.boolean().optional(),
  // Maksimal elemen visual utama per slide: gambar, foto latar, dan bentuk (dekor tidak dihitung).
  maxMainVisuals: z.int().min(1).max(10).optional(),
  // Arahan foto yang selalu dikirim ke pembuat gambar.
  photo: z
    .strictObject({
      naturalLight: z.boolean().optional(), // produk dan suasana dengan cahaya alami
      noPlainBackdrop: z.boolean().optional(), // tanpa latar putih polos di foto
      realSkin: z.boolean().optional(), // tekstur kulit asli; tanpa perlakuan berat pada foto orang
      motion: z.boolean().optional(), // orang selalu bergerak, bukan pose diam
    })
    .optional(),
});
export type BrandConstraints = z.infer<typeof BrandConstraints>;

const ScribbleShape = z.enum(["arrow", "underline", "circle", "sparkle", "cross"]);

// Perangkat grafis khas brand (PRD 4 K5, T-124): menjadi token --device-* yang dipakai primitives
// sebagai default; arketipe dan gaya boleh menimpa bila kontras atau komposisi menuntut.
export const BrandDevices = z.strictObject({
  highlight: z
    .strictObject({
      background: ColorToken,
      color: ColorToken,
      tilt: z.number().min(-6).max(6),
    })
    .optional(),
  sticker: z.strictObject({ rotate: z.number().min(-10).max(10) }).optional(),
  // Coretan yang boleh dipakai; daftar kosong berarti tanpa coretan.
  scribbles: z.array(ScribbleShape).optional(),
  tape: z.boolean().optional(),
});
export type BrandDevices = z.infer<typeof BrandDevices>;

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
    // Font aksen opsional (T-134): label, data, dan anotasi teknis gaya seperti Cyberpunk,
    // Brutalisme, dan Retro. Tanpa font aksen, peran ini memakai font body.
    accent: FontRole.optional(),
    scale: TypeScale,
  }),
  shape: z.strictObject({
    radius: z.number().min(0),
    stroke: z.number().min(0),
    shadow: z.enum(["none", "soft"], { error: "Bayangan harus none atau soft" }),
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
  constraints: BrandConstraints.optional(),
  devices: BrandDevices.optional(),
});
export type BrandKit = z.infer<typeof BrandKit>;
