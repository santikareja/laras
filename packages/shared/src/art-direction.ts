import { z } from "zod";
import { SubjectKind } from "./layout-spec.ts";

// Zona teks di atas karya latar penuh (T-140): sepertiga atas atau bawah kanvas, rata kiri, tengah,
// atau kanan. Zona yang diminta Claude diperiksa sistem dari piksel gambar sebelum dipakai.
export const TextZone = z.enum([
  "atas-kiri",
  "atas-tengah",
  "atas-kanan",
  "bawah-kiri",
  "bawah-tengah",
  "bawah-kanan",
]);
export type TextZone = z.infer<typeof TextZone>;

// Output tahap art direction spike T-140: Claude menyusun seluruh karya visual satu postingan
// untuk model gambar Codex. Teks, angka, dan logo tidak pernah ada di gambar (PRD 4 prinsip 1);
// zona teks dibiarkan tenang agar headline HTML terbaca. `image` dan `subject` dalam bahasa
// Inggris (bahan prompt gambar); `idea` dalam bahasa konten brand.
export const ArtDirection = z.strictObject({
  idea: z.string().min(1).max(300),
  image: z.string().min(80).max(1500),
  textZone: TextZone,
  // Subjek utama yang diambil dari gambar sebagai cut-out (lapisan B) agar bisa menimpa headline.
  subject: z.strictObject({
    description: z.string().min(1).max(200),
    kind: SubjectKind,
  }),
});
export type ArtDirection = z.infer<typeof ArtDirection>;
