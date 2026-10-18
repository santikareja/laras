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

const CASES: Record<string, Record<Brand, Case>> = {
  "proto-kata-raksasa": {
    "kopi-lembayung": {
      text: {
        kata: "SANGRAI",
        headline: "Tanggalnya tertulis di kemasan.",
        cta: "Ambil sekantong",
      },
      images: { image: "subjek.webp" },
      options: { tone: "primary", side: "left", text: "bottom-right" },
      logo: "onDark",
    },
    "seruni-skin": {
      text: {
        kata: "KENALI",
        headline: "Kulitmu dulu, baru perawatannya.",
        cta: "Konsultasi gratis",
      },
      images: { image: "subjek.webp" },
      options: { tone: "primary", side: "right", text: "bottom-left" },
      logo: "onDark",
    },
    "ritme-run-club": {
      text: { kata: "FIRST 5K", headline: "Any pace. No sign-up.", cta: "Show up Sunday" },
      images: { image: "subjek.webp" },
      options: { tone: "secondary", side: "center", text: "bottom-left", width: "condensed" },
      logo: "primary",
    },
  },
  "proto-bidang-warna": {
    "kopi-lembayung": {
      text: {
        headline: "Disangrai minggu ini, bukan bulan lalu.",
        sorot: "minggu ini",
        cta: "Ambil sekantong di kedai",
      },
      badge: { stiker: "Rp85.000 / 200 g" },
      images: { image: "subjek.webp" },
      options: { tone: "secondary", mark: "accent", size: "large" },
      logo: "primary",
    },
    "seruni-skin": {
      text: { headline: "Kenali kulitmu dulu.", sorot: "dulu.", cta: "Reservasi lewat WhatsApp" },
      badge: { stiker: "Konsultasi gratis" },
      images: { image: "subjek.webp" },
      options: { tone: "secondary", mark: "primary", size: "large" },
      logo: "primary",
    },
    "ritme-run-club": {
      text: { headline: "Every pace has a group.", sorot: "Every pace", cta: "Show up Sunday" },
      badge: { stiker: "5:45 AM" },
      images: { image: "subjek.webp" },
      options: { tone: "secondary", mark: "primary", size: "medium" },
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
      options: { mode: "object", tone: "neutral" },
      logo: "primary",
    },
    "seruni-skin": {
      text: {
        headline: "Kenali kulitmu sebelum merawatnya.",
        body: "Setiap perawatan diawali konsultasi gratis dan foto kondisi kulit.",
      },
      images: { image: "konsep.jpg" },
      options: { mode: "full", tone: "neutral" },
      logo: "primary",
    },
    "ritme-run-club": {
      text: {
        headline: "Your first 5K. Any pace.",
        body: "The 8:30 group walks and runs. Free, no sign-up.",
      },
      images: { image: "subjek.webp" },
      options: { mode: "object", tone: "secondary" },
      logo: "primary",
    },
  },
  "proto-kolase-diagonal": {
    "kopi-lembayung": {
      text: {
        headline: "SANGRAI SENDIRI",
        body: "Tanggal sangrai tertulis di setiap kemasan.",
        cta: "Mampir dan ambil sekantong",
      },
      badge: { stiker: "200 g · Rp85.000" },
      images: { image: "foto.jpg", subjek: "subjek.webp" },
      options: { tone: "neutral", band: "primary" },
      logo: "primary",
    },
    // Tanpa subjek: aturan brand Seruni membatasi dua elemen visual utama per slide.
    "seruni-skin": {
      text: {
        headline: "KONSULTASI DULU",
        body: "Terapis memotret kondisi kulitmu sebagai acuan perkembangan.",
        cta: "Jadwalkan konsultasi gratis",
      },
      badge: { stiker: "Gratis · 30 menit" },
      images: { image: "foto-4x5.jpg" },
      options: { tone: "neutral", band: "primary" },
      logo: "primary",
    },
    "ritme-run-club": {
      text: {
        headline: "FIRST 5K SUNDAY",
        body: "Pace groups from 5:00 to 8:30 min/km. Coffee after.",
        cta: "Show up Sunday",
      },
      badge: { stiker: "5:45 AM · Free" },
      images: { image: "foto.jpg", subjek: "subjek.webp" },
      options: { tone: "primary", band: "accent", width: "condensed" },
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
