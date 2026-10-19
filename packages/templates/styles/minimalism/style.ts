import type { StyleMeta } from "@laras/shared";

// Definisi mesin Minimalism; rincian di PANDUAN.md.
export const minimalism: StyleMeta = {
  id: "minimalism",
  name: "Minimalism",
  summary:
    "Satu ide, banyak ruang: satu objek atau metafora, tipografi kecil yang tenang, aksen warna hanya di satu titik.",
  variants: [
    { id: "produk", name: "Minimal produk", description: "Satu objek cut-out di bidang netral." },
    {
      id: "konsep",
      name: "Minimal konsep",
      description:
        "Satu metafora visual: dua objek berdampingan, menyatu, atau di tempat tak terduga.",
    },
  ],
  archetypes: ["feed-satu-objek", "feed-foto-konsep"],
  plannedArchetypes: [
    {
      id: "feed-minimal-tipografi",
      name: "Minimal tipografi",
      description: "Satu kata atau angka besar tanpa gambar.",
    },
    {
      id: "feed-foto-bingkai",
      name: "Foto berbingkai",
      description: "Satu foto kecil berbingkai di bidang netral.",
    },
  ],
  typography: {
    heading: ["serif-display", "grotesk", "geometric-sans"],
    body: ["grotesk", "humanist-sans"],
    headingCase: "sentence",
    scaleRatio: 2.5,
    tracking: "normal",
  },
  color: {
    background: "light",
    dominant: "neutral-light",
    second: "primary",
    accent: "accent",
    gradient: "never",
  },
  shape: { radius: "brand", shadow: "none", border: "none" },
  devices: [
    { id: "image-cutout", name: "Objek cut-out", status: "ada" },
    { id: "garis", name: "Garis tipis", status: "perlu-dibuat" },
    { id: "bingkai-garis", name: "Bingkai garis", status: "perlu-dibuat" },
    { id: "label-vertikal", name: "Label vertikal 90°", status: "perlu-dibuat" },
    { id: "bayangan-lantai", name: "Bayangan lantai", status: "perlu-dibuat" },
  ],
  imagery: {
    kinds: ["cutout", "concept", "photo"],
    treatment: ["natural", "mono"],
    promptHints: [
      "studio product photograph of a single object, three-quarter view from slightly above, isolated on a transparent background, soft diffused light, true-to-life muted colors",
      "minimal conceptual photograph of one object in an unexpected material or place, seamless pale backdrop, upper 40 percent of the frame completely empty, single soft light",
    ],
    avoid: [
      "poster",
      "advertisement",
      "social media post",
      "typography",
      "packaging with text",
      "busy",
      "cluttered",
      "bokeh lights",
      "glowing particles",
      "8k",
      "ultra detailed",
      "trending on artstation",
    ],
  },
  rules: [
    { rule: "P1", change: "stricter", limit: "Semua teks pada satu sumbu perataan" },
    { rule: "P2", change: "stricter", limit: "Maks 2 ukuran huruf (3 hanya pada pola tipografi)" },
    {
      rule: "P5",
      change: "stricter",
      limit: "Tepat 1 elemen visual utama ditambah maks 1 dekorasi garis",
    },
    {
      rule: "P8",
      change: "relaxed",
      limit: "Fokus boleh di sumbu tengah (±32 px) pada garis sepertiga",
    },
    { rule: "P9", change: "stricter", limit: "Dominan ≥ 65%, aksen ≤ 5% di maks 2 tempat" },
    {
      rule: "P10",
      change: "stricter",
      limit: "Ruang kosong ≥ 50% (produk dan tipografi ≥ 60%), maks 4 elemen",
    },
    {
      rule: "P11",
      change: "stricter",
      limit: "Kemiringan 0° kecuali satu label vertikal 90°; satu jenis dekorasi garis",
    },
  ],
  compatibility: [
    {
      check: "light-color",
      message: "Brand tidak punya warna terang yang tenang untuk bidang luas.",
    },
  ],
  options: [],
};
