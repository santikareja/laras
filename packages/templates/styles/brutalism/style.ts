import type { StyleMeta } from "@laras/shared";

// Definisi mesin Brutalisme; rincian di PANDUAN.md.
export const brutalism: StyleMeta = {
  id: "brutalism",
  name: "Brutalisme",
  summary:
    "Poster mentah dan tegas: huruf condensed raksasa, foto hitam-putih kasar, grid terbuka, dan satu warna aksen keras.",
  variants: [
    {
      id: "cetak",
      name: "Cetak",
      description:
        "Varian utama: kertas atau bidang tinta, halftone, grid terlihat, foto hitam-putih.",
    },
    {
      id: "neo",
      name: "Neo-brutalism",
      description:
        "Bidang warna datar, border gelap tebal, bayangan keras tanpa blur; aturan lebih ketat.",
    },
  ],
  archetypes: ["feed-kata-raksasa", "feed-kolase-diagonal", "feed-bidang-warna"],
  plannedArchetypes: [
    {
      id: "feed-poster-grid",
      name: "Poster grid",
      description: "Grid terlihat dengan sel teks dan foto.",
    },
    {
      id: "feed-sel-wajah",
      name: "Sel wajah",
      description: "Wajah dipotong per sel grid untuk testimoni.",
    },
    {
      id: "feed-indeks",
      name: "Indeks bernomor",
      description: "Daftar tips bernomor besar bergaya katalog.",
    },
    {
      id: "feed-mitos-fakta",
      name: "Mitos dan fakta",
      description: "Pernyataan dicoret lalu diganti fakta.",
    },
    {
      id: "feed-kartu-neo",
      name: "Kartu neo",
      description: "Kartu border tebal dengan bayangan keras.",
    },
  ],
  typography: {
    heading: ["grotesk-condensed", "grotesk"],
    body: ["grotesk", "monospace"],
    headingCase: "upper",
    scaleRatio: 5,
    tracking: "tight",
  },
  color: {
    background: "light",
    dominant: "neutral-light",
    second: "neutral-dark",
    accent: "accent",
    gradient: "never",
  },
  shape: { radius: "none", shadow: "none", border: "thin" },
  devices: [
    { id: "display", name: "Kata raksasa dan tumpukan", status: "ada" },
    { id: "image-mono", name: "Foto hitam-putih", status: "ada" },
    { id: "frame", name: "Bingkai bertepi sobek", status: "ada" },
    { id: "halftone", name: "Halftone", status: "ada" },
    { id: "fotokopi", name: "Efek fotokopi", status: "ada" },
    { id: "garis-grid", name: "Garis grid terlihat", status: "ada" },
    { id: "label-teknis", name: "Label teknis monospace", status: "ada" },
    { id: "tekstur-kertas", name: "Tekstur kertas", status: "ada" },
    { id: "tinta-aus", name: "Tinta aus", status: "ada" },
    { id: "sel-foto", name: "Foto dipotong per sel", status: "ada" },
    { id: "blok-teks", name: "Blok teks berlatar aksen", status: "ada" },
    { id: "bingkai-keras", name: "Border tebal dan bayangan keras", status: "ada" },
    { id: "coret-silang", name: "Coretan silang", status: "ada" },
  ],
  imagery: {
    kinds: ["photo", "cutout", "concept"],
    treatment: ["mono", "halftone", "grain"],
    promptHints: [
      "extreme close-up portrait, hard direct flash, deep shadows, high-contrast black and white photograph, coarse film grain, plain dark background",
      "full-body subject isolated on a plain seamless light grey background, hard side light, crisp edges, black and white",
      "single object on raw concrete, top-down, harsh midday shadow, large empty area in the upper half, monochrome documentary style",
    ],
    avoid: [
      "poster",
      "typography",
      "graphic design",
      "magazine cover",
      "collage",
      "halftone",
      "grunge texture",
      "glitch",
      "newspaper",
      "barcode",
      "with text",
    ],
  },
  rules: [
    {
      rule: "P1",
      change: "relaxed",
      limit: "Maks 3 sumbu perataan dan 2 pelanggaran grid (≥ 32 px atau sampai tepi)",
    },
    {
      rule: "P2",
      change: "relaxed",
      limit: "Maks 4 ukuran huruf (Display, pernyataan, body, label)",
    },
    {
      rule: "P4",
      change: "relaxed",
      limit: "Keluarga ketiga hanya font aksen monospace (T-124) untuk label ≤ 6 kata",
    },
    { rule: "P8", change: "relaxed", limit: "Toleransi titik potong ±10%" },
    {
      rule: "P9",
      change: "relaxed",
      limit: "Dominan ≥ 50%, aksen ≤ 18% sebagai blok struktural, maks 3 kemunculan",
    },
    {
      rule: "P10",
      change: "relaxed",
      limit: "Ruang kosong ≥ 20%, maks 7 elemen (Neo: ≥ 30%, maks 6)",
    },
    {
      rule: "P11",
      change: "relaxed",
      limit: "Kemiringan 0° dan 90° ditambah satu sudut ≤ 8° yang sama",
    },
  ],
  compatibility: [
    {
      check: "sharp-corners",
      message: "Sudut brand membulat (> 8 px), melunakkan kesan mentah brutalisme.",
    },
    { check: "vivid-color", message: "Brand tidak punya warna jenuh untuk aksen keras." },
    {
      check: "dark-color",
      message: "Brand tidak punya warna cukup gelap untuk tinta dan teks berkontras tinggi.",
    },
  ],
  options: [
    {
      name: "foto",
      values: ["mono", "halftone", "fotokopi", "natural"],
      default: "mono",
      description: "Perlakuan foto; natural untuk brand yang melarang filter berat",
    },
    {
      name: "tekstur",
      values: ["kertas", "none"],
      default: "kertas",
      description: "Tekstur kertas di atas bidang latar",
    },
    {
      name: "grid",
      values: ["yes", "no"],
      default: "yes",
      description: "Tampilkan garis grid dan tanda register",
    },
  ],
  // Ambang QA desain dari bagian aturan PANDUAN.md (P1, P2, P8, P9, P10, P11 dilonggarkan).
  limits: {
    axes: 3,
    fontSizes: 4,
    thirdsTolerance: 0.1,
    dominantMin: 0.5,
    accentMax: 0.18,
    emptyMin: 0.2,
    elementsMax: 7,
  },
  variantLimits: { neo: { emptyMin: 0.3, elementsMax: 6 } },
};
