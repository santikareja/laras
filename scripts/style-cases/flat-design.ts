import type { StylePattern } from "./index.ts";

// Flat Design varian pita: bidang jenuh, swoosh menggantikan lengkung, tanpa bayangan.
export const flatDesignPatterns: StylePattern[] = [
  {
    id: "khas",
    cases: {
      "kopi-lembayung": {
        archetype: "feed-bidang-warna",
        variant: "pita",
        text: {
          pembuka: "Disangrai sendiri",
          headline: "MINGGU INI",
          penutup: "Rp85.000 per 200 g.",
          cta: "Ambil sekantong",
        },
        images: { image: "interaksi.webp" },
        options: { tone: "secondary", arch: "none", flip: "yes" },
        logo: "primary",
      },
      "seruni-skin": {
        archetype: "feed-bidang-warna",
        variant: "pita",
        text: {
          pembuka: "Sebelum perawatan apa pun",
          headline: "KENALI",
          penutup: "kulitmu dulu.",
          cta: "Konsultasi gratis",
        },
        images: { image: "interaksi.webp" },
        options: { tone: "secondary", arch: "none", flip: "no" },
        logo: "primary",
      },
      "ritme-run-club": {
        archetype: "feed-bidang-warna",
        variant: "pita",
        text: {
          pembuka: "Never run before? Sunday,",
          headline: "5:45 AM",
          penutup: "Free. Any pace.",
          cta: "Just show up",
        },
        images: { image: "interaksi.webp" },
        options: { tone: "secondary", arch: "none", flip: "no" },
        logo: "primary",
      },
    },
  },
];
