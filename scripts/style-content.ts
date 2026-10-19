// Isi contoh gaya desain (PRD F16, T-132): satu postingan pola khas per gaya × brand fixture.
// Fakta dari fixtures/brands/<brand>/knowledge; opsi gaya dan arketipe mematuhi aturan brand
// (Kopi: logo kanan bawah, tanpa gradient, tanpa latar putih polos; Seruni: tanpa filter
// berlebihan, maksimal dua elemen visual utama; Ritme: angka besar, foto bergerak, aksen tidak
// di atas primary). Pola khas per gaya disetujui pemilik 2026-10-19 (TASKS T-132).
import type { StyleChoice } from "../packages/shared/src/index.ts";
import { archetypes, styleSpecimen, type Template } from "../packages/templates/src/index.ts";
import { type Case, caseSpec } from "./archetype-content.ts";
import type { Brand } from "./demo-content.ts";

export const STYLE_TEMPLATES: Template[] = [...archetypes, styleSpecimen];

type StyleCase = Case & {
  archetype: string;
  variant: string;
  styleOptions?: Record<string, string>;
};

const CASES: Record<string, Record<Brand, StyleCase>> = {
  // Brutalisme varian cetak: kolase di atas kertas, foto mono, grid terlihat, label teknis.
  brutalism: {
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
  // Corporate Clean mode terang: panel samping, subjek menembus panel, checklist, tombol, kontak.
  "corporate-clean": {
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
      options: { tone: "secondary", panel: "primary", flip: "yes", logo: "bottom", kontak: "pin" },
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
  // Cyberpunk neon gelap: satu subjek di panggung gelap, halo dan rel neon, HUD.
  cyberpunk: {
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
  // Minimalism produk: satu objek, ruang kosong luas, garis rambut sebagai lantai.
  minimalism: {
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
  // Glassmorphism varian kaca: foto penuh dan panel kaca buram di sepertiga bawah.
  "glassmorphism-neumorphism": {
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
  // Flat Design varian pita: bidang jenuh, swoosh menggantikan lengkung, tanpa bayangan.
  "flat-design": {
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
  // Vintage/Retro varian iklan cetak klasik: poster huruf raksasa dalam bingkai garis ganda, foto
  // bergrading hangat, grain.
  "retro-vintage": {
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
};

function template(id: string): Template {
  const found = STYLE_TEMPLATES.find((t) => t.meta.id === id);
  if (!found) throw new Error(`Template "${id}" tidak ada`);
  return found;
}

export async function styleCase(styleId: string, slug: Brand, assetsDir: string) {
  const item = CASES[styleId]?.[slug];
  if (!item) throw new Error(`Gaya "${styleId}" belum punya isi contoh untuk ${slug}`);
  const { spec, assets } = await caseSpec(template(item.archetype), slug, item, assetsDir);
  const style: StyleChoice = {
    id: styleId,
    variant: item.variant,
    options: item.styleOptions ?? {},
  };
  return { spec, assets, style };
}

// Spesimen perangkat: subjek cut-out dan foto contoh brand, varian pertama gaya.
export async function specimenCase(
  styleId: string,
  variant: string,
  slug: Brand,
  assetsDir: string,
) {
  const item: Case = {
    text: {},
    images: { subjek: "subjek.webp", foto: slug === "seruni-skin" ? "foto-4x5.jpg" : "foto.jpg" },
    options: {},
    logo: "primary",
  };
  const { spec, assets } = await caseSpec(styleSpecimen, slug, item, assetsDir);
  const style: StyleChoice = { id: styleId, variant, options: {} };
  return { spec, assets, style };
}
