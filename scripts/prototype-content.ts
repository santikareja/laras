// Isi prototipe arketipe T-122: pesan sama dengan percobaan T-117 (Kopi K2, Seruni S1, Ritme R1)
// agar strukturnya bisa dibandingkan; aset cut-out dan foto konsep dari fixtures/demo-assets.
import {
  type AssetManifest,
  LayoutSpec,
  layoutIssues,
  type SlotValue,
} from "../packages/shared/src/index.ts";
import type { Template } from "../packages/templates/src/index.ts";
import type { Brand } from "./demo-content.ts";

type Case = {
  text: Record<string, string>;
  badge?: Record<string, string>;
  // Slot image → file di fixtures/demo-assets/<brand>/ (semua 1122 × 1402, 4:5).
  images: Record<string, string>;
  options: Record<string, string>;
  logo: "primary" | "onDark";
};

// Aturan brand yang dipatuhi (PRD 4 prinsip 8): Kopi logo kanan bawah dan tanpa latar putih
// polos; Seruni maksimal dua elemen visual utama; Ritme angka dan waktu ditulis besar.
const CASES: Record<string, Record<Brand, Case>> = {
  "proto-kata-raksasa": {
    "kopi-lembayung": {
      text: {
        kata: "SANGRAI",
        headline: "Tanggalnya tertulis di kemasan.",
        cta: "Ambil sekantong",
      },
      images: { image: "subjek.webp" },
      options: { tone: "primary", side: "left", text: "middle-right", logo: "bottom-right" },
      logo: "onDark",
    },
    "seruni-skin": {
      text: {
        kata: "KENALI",
        headline: "Kulitmu dulu, baru perawatannya.",
        cta: "Konsultasi gratis",
      },
      images: { image: "subjek.webp" },
      options: { tone: "primary", side: "right", text: "bottom-left", logo: "top-left" },
      logo: "onDark",
    },
    "ritme-run-club": {
      text: { kata: "FIRST 5K", headline: "Any pace. No sign-up.", cta: "Show up Sunday" },
      images: { image: "subjek.webp" },
      options: {
        tone: "secondary",
        side: "center",
        text: "bottom-left",
        logo: "top-left",
        width: "condensed",
      },
      logo: "primary",
    },
  },
  // v3: headline tiga tingkat dan subjek berinteraksi (cut-out T-122 v3).
  "proto-bidang-warna": {
    "kopi-lembayung": {
      text: {
        pembuka: "Disangrai sendiri",
        headline: "MINGGU INI",
        penutup: "bukan bulan lalu.",
        cta: "Ambil sekantong di kedai",
      },
      badge: { fakta: "Rp85.000 / 200 g" },
      images: { image: "interaksi.webp" },
      options: { tone: "secondary", mark: "accent", flip: "yes" },
      logo: "primary",
    },
    // Dua elemen visual utama saja: subjek dan lengkung (tanpa stiker fakta).
    "seruni-skin": {
      text: {
        pembuka: "Sebelum perawatan apa pun",
        headline: "KENALI",
        penutup: "kulitmu dulu.",
        cta: "Jadwalkan konsultasi gratis",
      },
      images: { image: "interaksi.webp" },
      options: { tone: "secondary", mark: "primary", flip: "no" },
      logo: "primary",
    },
    "ritme-run-club": {
      text: {
        pembuka: "Never run before? Sunday,",
        headline: "5:45 AM",
        penutup: "Any pace. Coffee after.",
        cta: "Just show up",
      },
      badge: { fakta: "Free · No sign-up" },
      images: { image: "interaksi.webp" },
      options: { tone: "secondary", mark: "primary", flip: "no", width: "condensed", fact: "low" },
      logo: "primary",
    },
  },
  "proto-satu-objek": {
    "kopi-lembayung": {
      text: {
        headline: "Cek tanggal sangrainya.",
        body: "Biji Jawa Barat, kami sangrai sendiri setiap minggu.",
      },
      images: { image: "subjek.webp" },
      options: { mode: "object", tone: "primary", logo: "bottom-right" },
      logo: "onDark",
    },
    "seruni-skin": {
      text: {
        headline: "Kenali kulitmu sebelum merawatnya.",
        body: "Setiap perawatan diawali konsultasi gratis dan foto kondisi kulit.",
      },
      images: { image: "konsep.jpg" },
      options: { mode: "full", tone: "neutral", logo: "top-left" },
      logo: "primary",
    },
    "ritme-run-club": {
      text: {
        headline: "Your first 5K. Any pace.",
        body: "The slowest group walks and runs. Free, no sign-up.",
      },
      images: { image: "subjek.webp" },
      options: { mode: "object", tone: "secondary", logo: "bottom-center" },
      logo: "primary",
    },
  },
  // v3: bingkai bertepi sobek dengan selotip, subjek keluar bingkai, fakta dilingkari coretan.
  "proto-kolase-diagonal": {
    "kopi-lembayung": {
      text: {
        headline: "SANGRAI SENDIRI",
        body: "Tanggal sangrai tertulis di setiap kemasan.",
        cta: "Mampir dan ambil sekantong",
      },
      badge: { fakta: "200 g · Rp85.000" },
      images: { image: "foto.jpg", subjek: "interaksi.webp" },
      // Bidang gelap: aturan Kopi melarang produk di latar putih polos.
      options: {
        tone: "primary",
        band: "accent",
        duotone: "secondary",
        flip: "yes",
        doodle: "yes",
      },
      logo: "onDark",
    },
    // Dua elemen visual utama (bingkai dan pita) tanpa subjek dan kilau; tanpa duotone karena
    // aturan Seruni meminta tekstur kulit asli tanpa filter berlebihan.
    "seruni-skin": {
      text: {
        headline: "KONSULTASI DULU",
        body: "Terapis memotret kondisi kulitmu sebagai acuan perkembangan.",
        cta: "Jadwalkan konsultasi gratis",
      },
      badge: { fakta: "Gratis · 30 menit" },
      images: { image: "foto-4x5.jpg" },
      options: { tone: "neutral", band: "primary", duotone: "none", flip: "no", doodle: "no" },
      logo: "primary",
    },
    "ritme-run-club": {
      text: {
        headline: "SUNDAY 5:45 AM",
        body: "Every pace has a group. Coffee after.",
        cta: "Just show up",
      },
      badge: { fakta: "Free" },
      images: { image: "foto.jpg", subjek: "interaksi.webp" },
      options: {
        tone: "primary",
        band: "accent",
        width: "condensed",
        duotone: "primary",
        flip: "no",
        doodle: "yes",
      },
      logo: "onDark",
    },
  },
};

const assetId = (file: string) => file.replace(/\.\w+$/, "");

export function prototypeCase(template: Template, slug: Brand) {
  const item = CASES[template.meta.id]?.[slug];
  if (!item) throw new Error(`Prototipe "${template.meta.id}" belum punya isi untuk ${slug}`);
  const slots: Record<string, SlotValue> = { logo: { type: "logo", variant: item.logo } };
  for (const [name, value] of Object.entries(item.text)) slots[name] = { type: "text", value };
  for (const [name, value] of Object.entries(item.badge ?? {}))
    slots[name] = { type: "badge", value };
  for (const [name, file] of Object.entries(item.images))
    slots[name] = { type: "image", assetId: assetId(file) };
  const assets: AssetManifest["assets"] = [...new Set(Object.values(item.images))].map((path) => ({
    id: assetId(path),
    path,
    width: 1122,
    height: 1402,
    source: "codex",
  }));
  const spec = LayoutSpec.parse({
    templateId: template.meta.id,
    format: template.meta.format,
    slides: [{ slots, options: item.options }],
    assetRequests: assets.map((a) => ({
      id: a.id,
      description: "Aset prototipe",
      aspectRatio: "4:5",
    })),
  });
  const issues = layoutIssues(spec, template.meta);
  if (issues.length > 0)
    throw new Error(`Isi ${template.meta.id} tidak cocok: ${issues.join("; ")}`);
  return { spec, assets: { assets } };
}
