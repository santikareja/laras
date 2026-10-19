import type { StylePattern } from "./index.ts";

// Brutalisme varian cetak: kolase di atas kertas, foto mono, grid terlihat, label teknis.
export const brutalismPatterns: StylePattern[] = [
  {
    id: "khas",
    cases: {
      "kopi-lembayung": {
        archetype: "feed-kolase-diagonal",
        variant: "cetak",
        text: {
          headline: "SANGRAI SENDIRI",
          body: "Tanggal sangrai tertulis di setiap kemasan. Biji dari petani Jawa Barat.",
          cta: "Rp85.000 / 200 g",
          label: "Sangrai tiap minggu",
        },
        images: { image: "foto.jpg", subjek: "interaksi.webp" },
        options: {
          tone: "neutral",
          band: "primary",
          duotone: "none",
          flip: "yes",
          tape: "no",
          headline: "dua",
        },
        logo: "primary",
      },
      "seruni-skin": {
        archetype: "feed-kolase-diagonal",
        variant: "cetak",
        styleOptions: { foto: "natural" },
        text: {
          headline: "KENALI KULITMU",
          body: "Setiap perawatan diawali konsultasi dan foto kondisi kulit.",
          cta: "Konsultasi gratis",
          label: "Konsultasi 30 menit",
        },
        images: { image: "foto-4x5.jpg" },
        options: { tone: "neutral", band: "primary", duotone: "none", flip: "no", tape: "no" },
        logo: "primary",
      },
      "ritme-run-club": {
        archetype: "feed-kolase-diagonal",
        variant: "cetak",
        text: {
          headline: "SUNDAY 5:45 AM",
          body: "Pace groups from 5:00 to 8:30 min/km. Nobody runs alone.",
          cta: "Join for free",
          label: "Jakarta / every Sunday",
        },
        images: { image: "foto.jpg", subjek: "subjek.webp" },
        options: { tone: "neutral", band: "primary", duotone: "none", flip: "no", tape: "no" },
        logo: "primary",
      },
    },
  },
];
