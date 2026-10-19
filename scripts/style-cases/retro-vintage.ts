import type { StylePattern } from "./index.ts";

// Vintage/Retro varian iklan cetak klasik: poster huruf raksasa dalam bingkai garis ganda, foto
// bergrading hangat, grain.
export const retroVintagePatterns: StylePattern[] = [
  {
    id: "khas",
    cases: {
      "kopi-lembayung": {
        archetype: "feed-kata-raksasa",
        variant: "iklan-cetak",
        text: {
          kata: "SANGRAI",
          headline: "Tanggalnya tertulis di kemasan.",
          cta: "Ambil sekantong",
          label: "Sejak buka, harga stabil",
        },
        images: { image: "subjek.webp" },
        options: { tone: "primary", side: "left", logo: "bottom-right" },
        logo: "onDark",
      },
      "seruni-skin": {
        archetype: "feed-kata-raksasa",
        variant: "iklan-cetak",
        styleOptions: { foto: "natural" },
        text: {
          kata: "KENALI",
          headline: "Kulitmu dulu, baru perawatannya.",
          cta: "Konsultasi gratis",
          label: "Studio kulit, Surabaya",
        },
        images: { image: "subjek.webp" },
        options: { tone: "primary", side: "right", logo: "top-left" },
        logo: "onDark",
      },
      "ritme-run-club": {
        archetype: "feed-kata-raksasa",
        variant: "iklan-cetak",
        text: {
          kata: "FIRST 5K",
          headline: "Any pace. No sign-up.",
          cta: "Show up Sunday",
          label: "Since 2023, Jakarta",
        },
        images: { image: "subjek.webp" },
        // Aksen tidak boleh menjadi teks di atas primary (aturan Ritme): bidang secondary.
        options: { tone: "secondary", side: "center", logo: "top-left" },
        logo: "primary",
      },
    },
  },
];
