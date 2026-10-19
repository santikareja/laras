import type { StylePattern } from "./index.ts";

// Minimalism produk: satu objek, ruang kosong luas, garis rambut sebagai lantai.
export const minimalismPatterns: StylePattern[] = [
  {
    id: "khas",
    cases: {
      "kopi-lembayung": {
        archetype: "feed-satu-objek",
        variant: "produk",
        text: {
          headline: "Disangrai minggu ini.",
          body: "Biji kopi 200 g, Rp85.000.",
          label: "Sangrai sendiri",
        },
        images: { image: "subjek.webp" },
        options: { tone: "secondary", logo: "bottom-right" },
        logo: "primary",
      },
      "seruni-skin": {
        archetype: "feed-satu-objek",
        variant: "produk",
        text: {
          headline: "Kulitmu dulu, baru perawatannya.",
          body: "Konsultasi 30 menit, gratis.",
          label: "Surabaya",
        },
        images: { image: "subjek.webp" },
        options: { tone: "secondary", logo: "bottom-center" },
        logo: "primary",
      },
      "ritme-run-club": {
        archetype: "feed-satu-objek",
        variant: "produk",
        text: {
          headline: "Sunday, 5:45 AM.",
          body: "Free group run. Any pace.",
          label: "Jakarta",
        },
        images: { image: "subjek.webp" },
        options: { tone: "neutral", logo: "bottom-center" },
        logo: "primary",
      },
    },
  },
];
