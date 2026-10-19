import { z } from "zod";

// Ambang aturan desain terukur PRD 4 (P1, P2, P4, P8–P11) untuk QA kode (T-130). Tanpa gaya
// berlaku angka PRD; setiap gaya boleh mengubahnya sesuai bagian aturan di panduannya (F16).

export const DesignLimits = z.strictObject({
  // P1: maksimal sumbu perataan blok teks, logo, dan grup.
  axes: z.int().min(1),
  // P2: maksimal ukuran huruf; headline ≥ headlineRatio × body; ukuran kedua ≤ secondaryRatio ×
  // ukuran dominan.
  fontSizes: z.int().min(1),
  headlineRatio: z.number().min(1),
  secondaryRatio: z.number().gt(0).max(1),
  // P4: panjang baris body dalam karakter (baris selain yang terakhir ≥ min, semua ≤ max).
  bodyLineMin: z.int().min(1),
  bodyLineMax: z.int().min(1),
  // P8: jarak titik fokus dari titik potong grid 3×3 (pecahan kanvas); centerAxis = sumbu tengah
  // vertikal pada garis sepertiga juga diterima.
  thirdsTolerance: z.number().min(0).max(0.5),
  centerAxis: z.boolean(),
  // P9: proporsi warna dari piksel.
  dominantMin: z.number().min(0).max(1),
  secondMin: z.number().min(0).max(1),
  secondMax: z.number().min(0).max(1),
  accentMax: z.number().min(0).max(1),
  // P10: ruang kosong minimal dan jumlah elemen maksimal.
  emptyMin: z.number().min(0).max(1),
  elementsMax: z.int().min(1),
  // P11: jumlah jarak tepi, radius, dan sudut kemiringan yang berbeda.
  edges: z.int().min(1),
  radii: z.int().min(1),
  angles: z.int().min(1),
});
export type DesignLimits = z.infer<typeof DesignLimits>;

export const DesignLimitsPatch = DesignLimits.partial();
export type DesignLimitsPatch = z.infer<typeof DesignLimitsPatch>;

// Angka PRD 4 (disetujui pemilik, T-122).
export const DEFAULT_DESIGN_LIMITS: DesignLimits = {
  axes: 2,
  fontSizes: 3,
  headlineRatio: 2,
  secondaryRatio: 0.5,
  bodyLineMin: 30,
  bodyLineMax: 45,
  thirdsTolerance: 0.08,
  centerAxis: false,
  dominantMin: 0.55,
  secondMin: 0.2,
  secondMax: 0.35,
  accentMax: 0.12,
  emptyMin: 0.35,
  elementsMax: 5,
  edges: 1,
  radii: 1,
  angles: 1,
};
