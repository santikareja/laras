import type { StyleMeta } from "@laras/shared";

// Definisi mesin Cyberpunk/Futuristik; rincian di PANDUAN.md.
export const cyberpunk: StyleMeta = {
  id: "cyberpunk",
  name: "Cyberpunk/Futuristik",
  summary:
    "Pernyataan heroik di masa depan: satu kata raksasa yang mengunci subjek bercahaya tepi di panggung gelap, cahaya neon dari warna brand, detail HUD dan glitch yang terkendali.",
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
  archetypes: ["feed-kata-terbelah", "feed-kata-raksasa", "feed-satu-objek", "feed-foto-konsep"],
  plannedArchetypes: [
    { id: "feed-panel-hud", name: "Panel HUD", description: "Informasi dalam bingkai HUD." },
    {
      id: "feed-koordinat",
      name: "Koordinat",
      description: "Acara dengan label koordinat dan waktu.",
    },
    { id: "feed-transmisi", name: "Transmisi", description: "Kutipan bergaya pesan masuk." },
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
    { id: "glow", name: "Glow neon (lembut atau padat)", status: "ada" },
    { id: "glitch", name: "Glitch (slice, split, echo)", status: "ada" },
    { id: "scanline", name: "Scanline", status: "ada" },
    { id: "grain", name: "Grain", status: "ada" },
    { id: "hud-frame", name: "Bingkai sudut HUD", status: "ada" },
    { id: "hud-label", name: "Label HUD", status: "ada" },
    { id: "pixel-scatter", name: "Piksel lepas", status: "ada" },
    { id: "ticker", name: "Pita berjalan", status: "ada" },
    { id: "split-word", name: "Kata berpita dua lapis (pita di depan subjek)", status: "ada" },
    { id: "hud-row", name: "Baris label HUD tiga kolom (font aksen)", status: "ada" },
    { id: "spotlight", name: "Sorot panggung (kerucut, genangan, rel, meja)", status: "ada" },
    { id: "echo-stack", name: "Gema kata bertumpuk", status: "ada" },
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
        "Fokus boleh di sumbu tengah (±4%) pada garis sepertiga untuk neon-gelap dan neon-jalanan; pola simetris khas dikecualikan",
    },
    {
      rule: "P9",
      change: "relaxed",
      limit: "Dominan ≥ 35%, warna kedua dan gambar ≤ 50% (kalibrasi referensi, T-134)",
    },
    {
      rule: "P10",
      change: "relaxed",
      limit:
        "Ruang kosong ≥ 30% (neon-jalanan dan poster-tekno ≥ 25%), maks 6 elemen (poster-tekno 8)",
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
      values: ["soft", "solid", "tidak"],
      default: "soft",
      description:
        "Glow lunak (blur), padat tanpa blur untuk brand yang melarang gradient, atau tanpa halo pada subjek yang sudah bercahaya tepi",
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
    {
      name: "cahaya",
      values: ["accent", "primary", "secondary"],
      default: "accent",
      description:
        "Token jenuh yang menjadi cahaya neon (halo subjek, glow, rel); samakan dengan opsi cahaya arketipe khas",
    },
    {
      name: "glitch",
      values: ["iris", "kanal", "gema", "tidak"],
      default: "iris",
      description:
        "Gangguan pada kata raksasa: iris geser, pemisahan kanal, gema warna cahaya, atau tanpa glitch untuk heading serif",
    },
  ],
  // Ambang QA desain dari bagian aturan PANDUAN.md (P2 diperketat, fokus sumbu tengah boleh).
  // P9 dan P10 dikalibrasi dari referensi pemilik (T-134): dominan minimal = kuartil bawah
  // referensi, warna kedua dan gambar maksimal = kuartil atas porsi selain dominan dikurangi aksen
  // 12%, ruang kosong minimal = dominan − 5%, elemen maksimal = hitungan referensi (poster tekno 8).
  limits: {
    headlineRatio: 3,
    centerAxis: true,
    dominantMin: 0.35,
    secondMax: 0.5,
    emptyMin: 0.3,
    elementsMax: 6,
  },
  variantLimits: {
    "neon-jalanan": { emptyMin: 0.25 },
    "poster-tekno": { emptyMin: 0.25, elementsMax: 8, centerAxis: false },
  },
};
