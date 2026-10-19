import type { StyleMeta } from "@laras/shared";

// Definisi mesin Cyberpunk/Futuristik; rincian di PANDUAN.md.
export const cyberpunk: StyleMeta = {
  id: "cyberpunk",
  name: "Cyberpunk/Futuristik",
  summary:
    "Gelap dan menyala: panggung hitam, cahaya neon dari warna brand, subjek futuristik, detail HUD dan glitch yang terkendali.",
  variants: [
    {
      id: "neon-gelap",
      name: "Neon gelap",
      description: "Default: dingin, premium, sinematik; satu subjek di panggung gelap.",
    },
    {
      id: "neon-jalanan",
      name: "Neon jalanan",
      description: "Urban dan energik; foto duotone dua warna, lebih padat.",
    },
    {
      id: "poster-tekno",
      name: "Poster tekno",
      description: "Bidang token jenuh terang, label vertikal, HUD lebih banyak.",
    },
  ],
  archetypes: ["feed-kata-raksasa", "feed-satu-objek", "feed-foto-konsep"],
  plannedArchetypes: [
    {
      id: "feed-panggung-neon",
      name: "Panggung neon",
      description: "Subjek di panggung gelap dengan rel neon.",
    },
    { id: "feed-panel-hud", name: "Panel HUD", description: "Informasi dalam bingkai HUD." },
    {
      id: "feed-koordinat",
      name: "Koordinat",
      description: "Acara dengan label koordinat dan waktu.",
    },
    { id: "feed-transmisi", name: "Transmisi", description: "Kutipan bergaya pesan masuk." },
    {
      id: "feed-poster-tekno",
      name: "Poster tekno",
      description: "Poster terang dengan label teknis.",
    },
  ],
  typography: {
    heading: ["grotesk-condensed", "geometric-sans"],
    body: ["grotesk", "monospace"],
    headingCase: "upper",
    scaleRatio: 3,
    tracking: "tight",
  },
  color: {
    background: "dark",
    dominant: "neutral-dark",
    second: "primary",
    accent: "accent",
    gradient: "subtle",
  },
  shape: { radius: "brand", shadow: "glow", border: "thin" },
  devices: [
    { id: "display", name: "Kata raksasa", status: "ada" },
    { id: "image-mono", name: "Foto monokrom", status: "ada" },
    { id: "glow", name: "Glow neon (lembut atau padat)", status: "perlu-dibuat" },
    { id: "glitch", name: "Glitch (slice, split, echo)", status: "perlu-dibuat" },
    { id: "scanline", name: "Scanline", status: "perlu-dibuat" },
    { id: "grain", name: "Grain", status: "perlu-dibuat" },
    { id: "hud-frame", name: "Bingkai sudut HUD", status: "perlu-dibuat" },
    { id: "hud-label", name: "Label HUD", status: "perlu-dibuat" },
    { id: "pixel-scatter", name: "Piksel lepas", status: "perlu-dibuat" },
    { id: "ticker", name: "Pita berjalan", status: "perlu-dibuat" },
  ],
  imagery: {
    kinds: ["cutout", "concept", "photo"],
    treatment: ["mono", "neon", "grain"],
    promptHints: [
      "studio portrait of a person wearing a sleek matte black helmet with a reflective visor, hard white rim light, pitch black background, monochrome, high contrast",
      "black marble classical bust wearing a futuristic VR headset, low key lighting, single hard rim light, monochrome, isolated on transparent background",
      "single glossy black object on a reflective floor, dramatic low angle, thin haze, deep black surroundings, empty space above the object, desaturated",
    ],
    avoid: [
      "neon sign",
      "signage",
      "billboard",
      "hologram text",
      "HUD overlay",
      "user interface on screen",
      "code on screen",
      "rainy neon city street",
      "synthwave sunset",
      "matrix code rain",
      "glowing brain",
    ],
  },
  rules: [
    {
      rule: "P1",
      change: "relaxed",
      limit: "Elemen HUD menempel safe margin dan tidak dihitung sumbu; teks tetap maks 2 sumbu",
    },
    {
      rule: "P2",
      change: "stricter",
      limit: "Headline ≥ 3× body (kutipan ≥ 2×); maks 3 ukuran huruf termasuk label HUD",
    },
    {
      rule: "P4",
      change: "relaxed",
      limit: "Keluarga ketiga hanya monospace dari font aksen (T-124) untuk ≤ 4 label HUD",
    },
    {
      rule: "P6",
      change: "relaxed",
      limit:
        "Headline boleh menimpa subjek hingga 30% luasnya, tidak di wajah atau pengenal produk",
    },
    {
      rule: "P7",
      change: "stricter",
      limit: "Body minimal langkah 2 skala brand; kontras dihitung tanpa bantuan glow",
    },
    {
      rule: "P8",
      change: "relaxed",
      limit:
        "Fokus boleh di sumbu tengah (±4%) pada garis sepertiga untuk neon-gelap dan neon-jalanan",
    },
    {
      rule: "P10",
      change: "relaxed",
      limit: "neon-jalanan dan poster-tekno: ruang kosong ≥ 25%, maks 6 elemen",
    },
  ],
  compatibility: [
    { check: "dark-color", message: "Brand tidak punya warna cukup gelap untuk latar neon." },
    {
      check: "vivid-color",
      message: "Brand tidak punya warna jenuh yang bisa menyala seperti neon.",
    },
  ],
  options: [
    {
      name: "glow",
      values: ["soft", "solid"],
      default: "soft",
      description: "Glow lunak (blur), atau padat tanpa blur untuk brand yang melarang gradient",
    },
    {
      name: "foto",
      values: ["mono", "natural"],
      default: "mono",
      description: "Foto monokrom; natural untuk brand yang mewajibkan warna asli",
    },
    {
      name: "tekstur",
      values: ["scanline", "grain", "none"],
      default: "scanline",
      description: "Tekstur layar di atas seluruh kanvas",
    },
  ],
};
