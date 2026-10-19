import { z } from "zod";
import type { BrandKit } from "./brand-kit.ts";
import { Slug } from "./common.ts";

// Definisi mesin gaya desain (PRD F16, T-128). Panduan lengkapnya ada di
// packages/templates/styles/<id>/PANDUAN.md; definisi ini dipakai pemilih gaya, renderer (T-132),
// QA (T-130), dan prompt (T-133).

export const DesignRule = z.enum([
  "P1",
  "P2",
  "P3",
  "P4",
  "P5",
  "P6",
  "P7",
  "P8",
  "P9",
  "P10",
  "P11",
]);
export type DesignRule = z.infer<typeof DesignRule>;

const ColorToken = z.enum(["primary", "secondary", "accent", "neutral-light", "neutral-dark"]);

const TypeCategory = z.enum([
  "grotesk-condensed",
  "grotesk",
  "geometric-sans",
  "humanist-sans",
  "rounded-sans",
  "serif-display",
  "serif-text",
  "slab",
  "monospace",
  "script",
]);

// Syarat Brand Kit agar gaya tampil sesuai esensinya (dicek styleFit).
export const BrandCheck = z.enum([
  "dark-color", // ada warna brand cukup gelap untuk latar (luminans ≤ 0,08)
  "light-color", // ada warna brand cukup terang untuk latar (luminans ≥ 0,8)
  "vivid-color", // ada warna brand jenuh yang bisa menjadi aksen kuat atau neon
  "soft-shadow", // shape.shadow = soft
  "rounded-corners", // shape.radius ≥ 16
  "sharp-corners", // shape.radius ≤ 8
]);
export type BrandCheck = z.infer<typeof BrandCheck>;

const Named = z.strictObject({ id: Slug, name: z.string().min(1), description: z.string().min(1) });

export const StyleMeta = z
  .strictObject({
    id: Slug,
    name: z.string().min(1),
    // Satu kalimat untuk kartu pemilih gaya.
    summary: z.string().min(1),
    variants: z.array(Named).min(1),
    // Arketipe yang sudah ada dan cocok untuk gaya ini (id template).
    archetypes: z.array(z.string().min(1)).min(1),
    // Arketipe yang diusulkan panduan dan belum ada (dibuat di T-132 atau sesudahnya).
    plannedArchetypes: z.array(Named),
    typography: z.strictObject({
      heading: z.array(TypeCategory).min(1),
      body: z.array(TypeCategory).min(1),
      headingCase: z.enum(["upper", "title", "sentence", "mixed"]),
      // Rasio ukuran headline terhadap body.
      scaleRatio: z.number().min(1),
      tracking: z.enum(["tight", "normal", "wide"]),
    }),
    color: z.strictObject({
      background: z.enum(["light", "dark", "brand", "photo"]),
      dominant: ColorToken,
      second: ColorToken,
      accent: ColorToken,
      gradient: z.enum(["never", "subtle"]),
    }),
    shape: z.strictObject({
      radius: z.enum(["none", "small", "large", "pill", "brand"]),
      shadow: z.enum(["none", "soft", "hard", "glow", "neumorphic"]),
      border: z.enum(["none", "thin", "thick"]),
    }),
    devices: z
      .array(
        z.strictObject({
          id: Slug,
          name: z.string().min(1),
          status: z.enum(["ada", "perlu-dibuat"]),
        }),
      )
      .min(1),
    imagery: z.strictObject({
      kinds: z.array(z.enum(["photo", "cutout", "concept", "illustration"])).min(1),
      treatment: z
        .array(z.enum(["natural", "mono", "duotone", "halftone", "grain", "neon", "blur"]))
        .min(1),
      // Frasa prompt gambar (bahasa Inggris) yang khas gaya ini dan yang harus dihindari.
      promptHints: z.array(z.string().min(1)).min(1),
      avoid: z.array(z.string().min(1)),
    }),
    // Penyesuaian aturan desain PRD 4 untuk gaya ini; P7 tidak pernah dilonggarkan.
    rules: z.array(
      z.strictObject({
        rule: DesignRule,
        change: z.enum(["relaxed", "stricter"]),
        limit: z.string().min(1),
      }),
    ),
    compatibility: z.array(z.strictObject({ check: BrandCheck, message: z.string().min(1) })),
  })
  .superRefine((style, ctx) => {
    if (style.rules.some((r) => r.rule === "P7" && r.change === "relaxed")) {
      ctx.addIssue({ code: "custom", path: ["rules"], message: "P7 tidak boleh dilonggarkan" });
    }
  });
export type StyleMeta = z.infer<typeof StyleMeta>;

function rgb(hex: string): [number, number, number] {
  return [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255) as [
    number,
    number,
    number,
  ];
}

// Luminans relatif WCAG.
export function relativeLuminance(hex: string): number {
  const [r, g, b] = rgb(hex).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
}

// Saturasi dan lightness HSL (0–1).
function hsl(hex: string): { saturation: number; lightness: number } {
  const channels = rgb(hex);
  const max = Math.max(...channels);
  const min = Math.min(...channels);
  const lightness = (max + min) / 2;
  const delta = max - min;
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
  return { saturation, lightness };
}

function passes(check: BrandCheck, brand: BrandKit): boolean {
  const palette = [
    brand.colors.primary,
    brand.colors.secondary,
    brand.colors.accent,
    ...Object.values(brand.colors.neutral),
  ];
  switch (check) {
    case "dark-color":
      return palette.some((hex) => relativeLuminance(hex) <= 0.08);
    case "light-color":
      return palette.some((hex) => relativeLuminance(hex) >= 0.8);
    case "vivid-color":
      return [brand.colors.primary, brand.colors.secondary, brand.colors.accent].some((hex) => {
        const { saturation, lightness } = hsl(hex);
        return saturation >= 0.6 && lightness >= 0.35 && lightness <= 0.7;
      });
    case "soft-shadow":
      return brand.shape.shadow === "soft";
    case "rounded-corners":
      return brand.shape.radius >= 16;
    case "sharp-corners":
      return brand.shape.radius <= 8;
  }
}

// Kecocokan gaya dengan Brand Kit (PRD F16): "kurang-cocok" bila ada syarat gaya yang tidak
// dipenuhi brand; gaya tetap bisa dipakai dalam versi adaptasi.
export function styleFit(style: StyleMeta, brand: BrandKit) {
  const reasons = style.compatibility.filter((c) => !passes(c.check, brand)).map((c) => c.message);
  return { fit: reasons.length === 0 ? ("cocok" as const) : ("kurang-cocok" as const), reasons };
}
