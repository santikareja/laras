// Isi demo arketipe (T-122, T-123): pesan sama dengan percobaan T-117 (Kopi K2, Seruni S1, Ritme
// R1); aset cut-out dan foto konsep dari fixtures/demo-assets. Cut-out dianalisis seperti di
// pipeline (kotak alpha dan titik fokus) sehingga letak teks dihitung arketipe sendiri.
import { join } from "node:path";
import {
  type AssetManifest,
  LayoutSpec,
  layoutIssues,
  type SlotValue,
} from "../packages/shared/src/index.ts";
import { analyzeCutout, type SubjectKind } from "../packages/sidecar/src/pipeline/cutout.ts";
import type { Template } from "../packages/templates/src/index.ts";
import { type Brand, fill } from "./demo-content.ts";
import { patternCaseFor } from "./style-cases/index.ts";

export type Case = {
  text: Record<string, string>;
  // Slot image → file di fixtures/demo-assets/<brand>/ (semua 1122 × 1402, 4:5).
  images: Record<string, string>;
  options: Record<string, string>;
  logo: "primary" | "onDark";
};

// Jenis subjek setiap cut-out fixture, masukan analisis titik fokus.
// Aset `gaya-*` dari Codex untuk konsep gaya (T-134).
const CUTOUTS: Record<Brand, Record<string, SubjectKind>> = {
  "kopi-lembayung": {
    "subjek.webp": "object",
    "interaksi.webp": "object",
    "gaya-corporate.webp": "person",
    "gaya-cyberpunk.webp": "object",
    "gaya-retro.webp": "person",
  },
  "seruni-skin": {
    "subjek.webp": "person",
    "interaksi.webp": "person",
    "gaya-corporate.webp": "person",
    "gaya-cyberpunk.webp": "person",
  },
  "ritme-run-club": {
    "subjek.webp": "person",
    "interaksi.webp": "person",
    "gaya-corporate.webp": "person",
    "gaya-cyberpunk.webp": "person",
    "gaya-retro.webp": "person",
  },
};

// Aturan brand yang dipatuhi (PRD 4 prinsip 8): Kopi logo kanan bawah dan tanpa latar putih
// polos; Seruni maksimal dua elemen visual utama dan tanpa filter berlebihan pada kulit; Ritme
// angka dan waktu ditulis besar.
const CASES: Record<string, Partial<Record<Brand, Case>>> = {
  "feed-kata-raksasa": {
    "kopi-lembayung": {
      text: {
        kata: "SANGRAI",
        headline: "Tanggalnya tertulis di kemasan.",
        cta: "Ambil sekantong",
      },
      images: { image: "subjek.webp" },
      options: { tone: "primary", side: "left", logo: "bottom-right" },
      logo: "onDark",
    },
    "seruni-skin": {
      text: {
        kata: "KENALI",
        headline: "Kulitmu dulu, baru perawatannya.",
        cta: "Konsultasi gratis",
      },
      images: { image: "subjek.webp" },
      options: { tone: "primary", side: "right", logo: "top-left" },
      logo: "onDark",
    },
    "ritme-run-club": {
      text: { kata: "FIRST 5K", headline: "Any pace. No sign-up.", cta: "Show up Sunday" },
      images: { image: "subjek.webp" },
      options: { tone: "secondary", side: "center", logo: "top-left" },
      logo: "primary",
    },
  },
  "feed-bidang-warna": {
    "kopi-lembayung": {
      text: {
        pembuka: "Disangrai sendiri",
        headline: "MINGGU INI",
        penutup: "Rp85.000 per 200 g.",
        cta: "Ambil sekantong",
      },
      images: { image: "interaksi.webp" },
      options: { tone: "secondary", arch: "high", flip: "yes" },
      logo: "primary",
    },
    "seruni-skin": {
      text: {
        pembuka: "Sebelum perawatan apa pun",
        headline: "KENALI",
        penutup: "kulitmu dulu.",
        cta: "Konsultasi gratis",
      },
      images: { image: "interaksi.webp" },
      options: { tone: "secondary", arch: "high", flip: "no" },
      logo: "primary",
    },
    "ritme-run-club": {
      text: {
        pembuka: "Never run before? Sunday,",
        headline: "5:45 AM",
        penutup: "Free. Any pace.",
        cta: "Just show up",
      },
      images: { image: "interaksi.webp" },
      options: { tone: "secondary", arch: "low", flip: "no" },
      logo: "primary",
    },
  },
  "feed-satu-objek": {
    "kopi-lembayung": {
      text: {
        headline: "Cek tanggal sangrainya.",
        body: "Biji Jawa Barat, kami sangrai sendiri setiap minggu.",
      },
      images: { image: "subjek.webp" },
      options: { tone: "primary", logo: "bottom-right" },
      logo: "onDark",
    },
    "seruni-skin": {
      text: {
        headline: "Kenali kulitmu dulu.",
        body: "Konsultasi gratis sebelum perawatan apa pun.",
      },
      images: { image: "subjek.webp" },
      options: { tone: "secondary", logo: "bottom-center" },
      logo: "primary",
    },
    "ritme-run-club": {
      text: {
        headline: "Your first 5K. Any pace.",
        body: "The slowest group walks and runs. Free, no sign-up.",
      },
      images: { image: "subjek.webp" },
      options: { tone: "secondary", logo: "bottom-center" },
      logo: "primary",
    },
  },
  // Foto konsep baru ada untuk Seruni (T-121); Kopi dan Ritme menyusul lewat pipeline (T-131).
  "feed-foto-konsep": {
    "seruni-skin": {
      text: {
        headline: "Kenali kulitmu sebelum merawatnya.",
        body: "Setiap perawatan diawali konsultasi gratis dan foto kondisi kulit.",
      },
      images: { image: "konsep.jpg" },
      options: { logo: "top-left" },
      logo: "primary",
    },
  },
  "feed-kolase-diagonal": {
    "kopi-lembayung": {
      text: { headline: "SANGRAI SENDIRI", cta: "Ambil sekantong, Rp85.000" },
      images: { image: "foto.jpg", subjek: "interaksi.webp" },
      options: {
        tone: "primary",
        band: "secondary",
        duotone: "secondary",
        flip: "yes",
        headline: "dua",
      },
      logo: "onDark",
    },
    "seruni-skin": {
      text: {
        headline: "KONSULTASI DULU",
        body: "Gratis, 30 menit. Kondisi kulitmu difoto sebagai acuan.",
        cta: "Jadwalkan konsultasi",
      },
      images: { image: "foto-4x5.jpg" },
      options: { tone: "neutral", band: "primary", duotone: "none", flip: "no" },
      logo: "primary",
    },
    "ritme-run-club": {
      text: { headline: "SUNDAY 5:45 AM", cta: "Join for free" },
      images: { image: "foto.jpg", subjek: "interaksi.webp" },
      options: { tone: "primary", band: "secondary", duotone: "primary", flip: "no" },
      logo: "onDark",
    },
  },
  // Panel info dan kartu kaca (T-132, T-131): isi sama dengan contoh gaya Corporate dan Glassmorphism.
  "feed-panel-info": {
    "kopi-lembayung": {
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
      options: { tone: "secondary", panel: "primary", flip: "yes", logo: "bottom", kontak: "pin" },
      logo: "primary",
    },
    "seruni-skin": {
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
  "feed-kartu-kaca": {
    "kopi-lembayung": {
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
};

const assetId = (file: string) => file.replace(/\.\w+$/, "");

// Arketipe khas gaya (T-134) tidak punya isi di sini: isi pola gaya yang memakainya dipakai,
// dirender tanpa lapisan gaya, sehingga arketipe itu juga diuji contoh dan maks.
const caseFor = (template: Template, slug: Brand): Case | undefined =>
  CASES[template.meta.id]?.[slug] ?? patternCaseFor(template.meta.id, slug);

export function hasArchetypeCase(template: Template, slug: Brand): boolean {
  return caseFor(template, slug) !== undefined;
}

// LayoutSpec dan AssetManifest satu arketipe untuk satu brand, dengan analisis cut-out.
// `max`: setiap slot teks yang terisi diulang sampai tepat maxChars (uji batas karakter, T-131),
// karena Claude boleh mengisi slot sampai batas itu.
export async function archetypeCase(
  template: Template,
  slug: Brand,
  assetsDir: string,
  max = false,
) {
  const item = caseFor(template, slug);
  if (!item) throw new Error(`Arketipe "${template.meta.id}" belum punya isi untuk ${slug}`);
  if (!max) return caseSpec(template, slug, item, assetsDir);
  const text = Object.fromEntries(
    Object.entries(item.text).map(([name, value]) => {
      const limit = template.meta.slots.find((slot) => slot.name === name)?.maxChars;
      return [name, limit ? fill(value, limit) : value];
    }),
  );
  return caseSpec(template, slug, { ...item, text }, assetsDir);
}

// Isi demo → LayoutSpec dan AssetManifest; juga dipakai isi contoh gaya (scripts/style-content.ts).
export async function caseSpec(template: Template, slug: Brand, item: Case, assetsDir: string) {
  const slots: Record<string, SlotValue> = { logo: { type: "logo", variant: item.logo } };
  for (const [name, value] of Object.entries(item.text)) slots[name] = { type: "text", value };
  for (const [name, file] of Object.entries(item.images))
    slots[name] = { type: "image", assetId: assetId(file) };
  const assets: AssetManifest["assets"] = [];
  for (const path of new Set(Object.values(item.images))) {
    const kind = CUTOUTS[slug][path];
    assets.push({
      id: assetId(path),
      path,
      width: 1122,
      height: 1402,
      source: "codex",
      ...(kind ? { subject: await analyzeCutout(join(assetsDir, path), kind) } : {}),
    });
  }
  const spec = LayoutSpec.parse({
    templateId: template.meta.id,
    format: template.meta.format,
    slides: [{ slots, options: item.options }],
    assetRequests: assets.map((a) => ({
      id: a.id,
      description: "Aset demo",
      aspectRatio: "4:5",
      ...(a.subject ? { kind: "cutout", subject: CUTOUTS[slug][a.path] } : {}),
    })),
  });
  const issues = layoutIssues(spec, template.meta);
  if (issues.length > 0)
    throw new Error(`Isi ${template.meta.id} tidak cocok: ${issues.join("; ")}`);
  return { spec, assets: { assets } };
}
