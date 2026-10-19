import type { StyleMeta } from "@laras/shared";

// Definisi mesin Corporate Clean; rincian di PANDUAN.md.
export const corporateClean: StyleMeta = {
  id: "corporate-clean",
  name: "Corporate Clean",
  summary:
    "Rapi dan tepercaya: bidang warna tenang, orang profesional, kartu dan ikon fitur, CTA tombol yang jelas.",
  variants: [
    {
      id: "terang",
      name: "Mode terang",
      description: "Default: bidang netral terang, warna primary untuk panel dan headline.",
    },
    {
      id: "primary",
      name: "Mode primary",
      description: "Bidang primary bernada tenang dengan teks terang dan panel netral.",
    },
  ],
  archetypes: ["feed-panel-info", "feed-bidang-warna", "feed-satu-objek", "feed-foto-konsep"],
  plannedArchetypes: [
    {
      id: "feed-deret-fitur",
      name: "Deret fitur",
      description: "Subjek di tengah dengan deret ikon fitur.",
    },
    {
      id: "feed-daftar-ikon",
      name: "Daftar ikon",
      description: "Langkah atau tips dengan ikon garis.",
    },
    {
      id: "feed-kutipan-profil",
      name: "Kutipan profil",
      description: "Testimoni dengan foto dan tag profil.",
    },
    { id: "feed-kartu-statistik", name: "Kartu statistik", description: "Angka bukti di kartu." },
    {
      id: "feed-foto-bingkai",
      name: "Foto berbingkai",
      description: "Foto kerja di panel membulat.",
    },
  ],
  typography: {
    heading: ["geometric-sans", "grotesk", "humanist-sans"],
    body: ["humanist-sans", "grotesk"],
    headingCase: "sentence",
    scaleRatio: 3,
    tracking: "normal",
  },
  color: {
    background: "light",
    dominant: "neutral-light",
    second: "primary",
    accent: "accent",
    gradient: "never",
  },
  shape: { radius: "brand", shadow: "soft", border: "none" },
  devices: [
    { id: "sticker", name: "Chip dan tombol", status: "ada" },
    { id: "panel", name: "Panel membulat", status: "ada" },
    { id: "ikon", name: "Set ikon garis", status: "ada" },
    { id: "deret-ikon", name: "Deret ikon berlabel", status: "ada" },
    { id: "bar-kontak", name: "Bar kontak", status: "ada" },
    { id: "tombol-panah", name: "Tombol berpanah", status: "ada" },
    { id: "kartu-statistik", name: "Kartu statistik", status: "ada" },
    { id: "kartu-rating", name: "Kartu rating", status: "ada" },
    { id: "tag-profil", name: "Tag profil", status: "ada" },
    { id: "mockup-perangkat", name: "Mockup perangkat", status: "ada" },
    { id: "swoosh", name: "Swoosh", status: "ada" },
  ],
  imagery: {
    kinds: ["cutout", "photo"],
    treatment: ["natural"],
    promptHints: [
      "confident professional in a natural pose using a laptop or holding the product, bright soft daylight, isolated on a transparent background",
      "real worker on the job site, candid moment, natural light, clean uncluttered background",
    ],
    avoid: [
      "business people shaking hands",
      "pointing at a chart",
      "pointing at a whiteboard",
      "glowing globe network",
      "light bulb idea",
      "puzzle pieces",
      "city skyline with light trails",
      "with text",
    ],
  },
  rules: [
    {
      rule: "P8",
      change: "relaxed",
      limit: "Pola terpusat boleh, maks 1 dari setiap 3 postingan berurutan",
    },
    {
      rule: "P10",
      change: "relaxed",
      limit:
        "Satu grup informasi (≤ 4 item) dan satu blok aksi masing-masing dihitung 1 elemen; total item kecil ≤ 8",
    },
    {
      rule: "P11",
      change: "relaxed",
      limit:
        "Radius penuh untuk tombol dan chip hanya bila radius brand ≥ 16 px; maks 2 nilai radius",
    },
  ],
  compatibility: [
    { check: "light-color", message: "Brand tidak punya warna netral terang untuk mode terang." },
  ],
  options: [
    {
      name: "dekor",
      values: ["none", "swoosh"],
      default: "none",
      description: "Satu swoosh warna brand di tepi kanvas",
    },
  ],
  // Ambang QA desain dari bagian aturan PANDUAN.md (pola terpusat boleh, dua radius).
  limits: { centerAxis: true, radii: 2 },
  variantLimits: {},
};
