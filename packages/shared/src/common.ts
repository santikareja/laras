import { z } from "zod";

export const HexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Warna harus berformat #RRGGBB");

// Lapis pertama pengaman path dari output AI (CLAUDE.md, ARCH 9); sidecar tetap memeriksa
// path hasil resolve berada di dalam folder job.
export const RelativePath = z
  .string()
  .min(1)
  .refine(
    (path) => !path.startsWith("/") && !path.startsWith("~") && !path.includes("\\"),
    "Path harus relatif dan memakai pemisah /",
  )
  .refine((path) => !path.split("/").includes(".."), "Path tidak boleh keluar folder lewat ..");

export const NonEmptyText = z.string().trim().min(1);

export const HASHTAG_LIMIT = 30; // batas hashtag per postingan Instagram
export const Hashtag = z
  .string()
  .regex(/^#[\p{L}\p{N}_]+$/u, "Hashtag harus berbentuk #kata tanpa spasi");

export const Slug = z.string().regex(/^[a-z0-9][a-z0-9-]*$/, "Id hanya huruf kecil, angka, dan -");

export const ContentFormat = z.enum(["feed-4x5", "carousel-4x5"]);
export type ContentFormat = z.infer<typeof ContentFormat>;

const SLIDE_LIMITS: Record<ContentFormat, { min: number; max: number }> = {
  "feed-4x5": { min: 1, max: 1 },
  "carousel-4x5": { min: 2, max: 20 },
};

export function slideCountError(format: ContentFormat, count: number): string | null {
  const { min, max } = SLIDE_LIMITS[format];
  if (count >= min && count <= max) return null;
  return min === max
    ? `Format ${format} harus berisi tepat ${min} slide`
    : `Format ${format} harus berisi ${min}–${max} slide`;
}

export function duplicates(values: string[]): string[] {
  const seen = new Set<string>();
  const repeated = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) repeated.add(value);
    seen.add(value);
  }
  return [...repeated];
}
