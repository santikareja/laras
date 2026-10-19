import type { StylePattern } from "./index.ts";

// Glassmorphism varian kaca: foto penuh dan panel kaca buram di sepertiga bawah.
export const glassmorphismNeumorphismPatterns: StylePattern[] = [
  {
    id: "khas",
    cases: {
      "kopi-lembayung": {
        archetype: "feed-kartu-kaca",
        variant: "kaca",
        text: {
          chip: "Menu pagi",
          headline: "Kopi susu gula aren",
          angka: "Rp22.000",
          body: "Buka setiap hari 06.30–21.00.",
          cta: "Pesan antar",
        },
        images: { image: "foto.jpg" },
        options: { kaca: "light", posisi: "bawah", logo: "bottom-right" },
        logo: "primary",
      },
      "seruni-skin": {
        archetype: "feed-kartu-kaca",
        variant: "kaca",
        text: {
          chip: "Facial hidrasi",
          headline: "Kulit lembap, langkah demi langkah",
          angka: "Rp350.000",
          body: "Diawali konsultasi dan foto kondisi kulit.",
          cta: "Reservasi",
        },
        images: { image: "foto-4x5.jpg" },
        options: { kaca: "light", posisi: "bawah", logo: "top-left" },
        logo: "primary",
      },
      "ritme-run-club": {
        archetype: "feed-kartu-kaca",
        variant: "kaca",
        text: {
          chip: "City race",
          headline: "Ritme 10K City Race",
          angka: "IDR 250,000",
          body: "Entry fees fund free water stations.",
          cta: "Register",
        },
        images: { image: "foto.jpg" },
        options: { kaca: "dark", posisi: "bawah", logo: "top-left" },
        logo: "primary",
      },
    },
  },
];
