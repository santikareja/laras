import type { StylePattern } from "./index.ts";

// Cyberpunk neon gelap: satu subjek di panggung gelap, halo dan rel neon, HUD.
export const cyberpunkPatterns: StylePattern[] = [
  {
    id: "khas",
    cases: {
      "kopi-lembayung": {
        archetype: "feed-satu-objek",
        variant: "neon-gelap",
        // Tanpa gradient (glow padat) dan foto produk dengan cahaya alami (warna asli).
        styleOptions: { glow: "solid", foto: "natural" },
        text: {
          headline: "Disangrai minggu ini.",
          body: "Biji kopi sangrai 200 g, Rp85.000.",
          label: "Batch mingguan",
        },
        images: { image: "subjek.webp" },
        options: { tone: "primary", logo: "bottom-right" },
        logo: "onDark",
      },
      "seruni-skin": {
        archetype: "feed-satu-objek",
        variant: "neon-gelap",
        styleOptions: { foto: "natural" },
        text: {
          headline: "Kenali kulitmu dulu.",
          body: "Konsultasi kulit 30 menit, gratis.",
          label: "Studio Surabaya",
        },
        images: { image: "subjek.webp" },
        options: { tone: "dark", logo: "bottom-center" },
        logo: "onDark",
      },
      "ritme-run-club": {
        archetype: "feed-satu-objek",
        variant: "neon-gelap",
        text: {
          headline: "Sunday, 5:45 AM.",
          body: "Free group run. Any pace, no sign-up.",
          label: "Jakarta",
        },
        images: { image: "subjek.webp" },
        options: { tone: "dark", logo: "bottom-center" },
        logo: "onDark",
      },
    },
  },
];
