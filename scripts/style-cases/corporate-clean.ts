import type { StylePattern } from "./index.ts";

// Corporate Clean mode terang: panel samping, subjek menembus panel, checklist, tombol, kontak.
export const corporateCleanPatterns: StylePattern[] = [
  {
    id: "khas",
    cases: {
      "kopi-lembayung": {
        archetype: "feed-panel-info",
        variant: "terang",
        text: {
          eyebrow: "Biji kopi sangrai",
          headline: "Disangrai sendiri setiap minggu",
          subjudul: "Biji dari petani Jawa Barat, tanggal sangrai di kemasan.",
          poin1: "200 g, Rp85.000",
          poin2: "Pesan antar radius 3 km",
          poin3: "Buka 06.30–21.00",
          cta: "Pesan sekarang",
          kontak: "Bandung",
        },
        images: { image: "interaksi.webp" },
        // Logo selalu kanan bawah dan tanpa latar putih polos (aturan Kopi).
        options: {
          tone: "secondary",
          panel: "primary",
          flip: "yes",
          logo: "bottom",
          kontak: "pin",
        },
        logo: "primary",
      },
      "seruni-skin": {
        archetype: "feed-panel-info",
        variant: "terang",
        text: {
          eyebrow: "Facial dasar",
          headline: "Setiap perawatan diawali konsultasi",
          subjudul: "Terapis bersertifikat dan dokter kulit mitra.",
          poin1: "Konsultasi 30 menit gratis",
          poin2: "Facial dasar Rp250.000",
          poin3: "Tanpa paket produk wajib",
          cta: "Reservasi",
          kontak: "Reservasi via WhatsApp",
        },
        images: { image: "subjek.webp" },
        options: { tone: "neutral", panel: "primary", flip: "no", logo: "top", kontak: "chat" },
        logo: "primary",
      },
      "ritme-run-club": {
        archetype: "feed-panel-info",
        variant: "terang",
        // Tanpa eyebrow: aksen tidak boleh menjadi teks di atas primary (aturan Ritme); angka hanya
        // di headline agar tertulis besar.
        text: {
          headline: "Sunday 5:45 AM. Free group run.",
          subjudul: "Every run ends with coffee and stretching.",
          poin1: "Pace groups for everyone",
          poin2: "No sign-up needed",
          poin3: "Beginners welcome",
          cta: "Join free",
          kontak: "Jakarta",
        },
        images: { image: "subjek.webp" },
        options: { tone: "neutral", panel: "primary", flip: "no", logo: "top", kontak: "pin" },
        logo: "primary",
      },
    },
  },
];
