import type { StyleMeta } from "@laras/shared";

// Definisi mesin Vintage/Retro; rincian di PANDUAN.md.
export const retroVintage: StyleMeta = {
  id: "retro-vintage",
  name: "Vintage/Retro",
  summary:
    "Hangat dan bernostalgia: warna pudar dari token brand, tekstur cetak, huruf display berkarakter, dan foto bernuansa film.",
  variants: [
    {
      id: "editorial-hangat",
      name: "Editorial hangat",
      description: "Default: foto bergrading hangat, kata raksasa, pasangan huruf serif dan sans.",
    },
    {
      id: "iklan-cetak",
      name: "Iklan cetak klasik",
      description: "Iklan 50–70-an: latar kertas, starburst, bingkai retro, halftone.",
    },
    {
      id: "groovy",
      name: "Groovy",
      description: "Ceria ala 70-an dan 90-an: pelangi, kotak-kotak, stiker bulat.",
    },
  ],
  archetypes: ["feed-kata-raksasa", "feed-kolase-diagonal", "feed-foto-konsep"],
  plannedArchetypes: [
    {
      id: "feed-iklan-cetak",
      name: "Iklan cetak",
      description: "Iklan lawas dengan starburst dan blok harga.",
    },
    {
      id: "feed-sampul-editorial",
      name: "Sampul editorial",
      description: "Sampul majalah 70-an dengan foto hangat.",
    },
    {
      id: "feed-potret-oval",
      name: "Potret oval",
      description: "Potret dalam bingkai oval retro.",
    },
    { id: "feed-groovy", name: "Groovy", description: "Pelangi dan stiker bulat ala 70-an." },
    { id: "feed-kisi-panel", name: "Kisi panel", description: "Panel kisi seperti katalog lawas." },
  ],
  typography: {
    heading: ["serif-display", "slab", "rounded-sans"],
    body: ["serif-text", "grotesk"],
    headingCase: "mixed",
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
  shape: { radius: "brand", shadow: "hard", border: "thin" },
  devices: [
    { id: "display", name: "Kata raksasa", status: "ada" },
    { id: "frame", name: "Foto duotone berbingkai", status: "ada" },
    { id: "sticker", name: "Stiker", status: "ada" },
    { id: "grain", name: "Grain", status: "ada" },
    { id: "halftone", name: "Halftone", status: "ada" },
    { id: "misregister", name: "Cetak meleset", status: "ada" },
    { id: "starburst", name: "Starburst", status: "ada" },
    { id: "sunburst", name: "Sunburst", status: "ada" },
    { id: "checker", name: "Kotak-kotak", status: "ada" },
    { id: "rainbow", name: "Pelangi", status: "ada" },
    { id: "retro-frame", name: "Bingkai retro", status: "ada" },
    { id: "round-badge", name: "Stiker bulat", status: "ada" },
  ],
  imagery: {
    kinds: ["photo", "cutout"],
    treatment: ["grain", "duotone", "mono", "halftone"],
    promptHints: [
      "1970s editorial photograph, warm late-afternoon sunlight, crisp hard shadow cast on a plain wall",
      "shot on 35mm film, fine natural film grain, slightly faded warm tones, soft contrast, lifted blacks",
      "full-body person mid-jump, dynamic dance pose, plain seamless backdrop, isolated subject with clean edges for cut-out",
    ],
    avoid: [
      "poster",
      "vintage advertisement",
      "magazine cover",
      "album cover",
      "packaging with brand name",
      "sepia",
      "dust and scratches",
      "torn old paper",
      "crumpled paper",
      "polaroid frame",
      "with text",
    ],
  },
  rules: [
    {
      rule: "P1",
      change: "relaxed",
      limit: "Maks 2 dekorasi di luar grid, dimiringkan −8° sampai 8°",
    },
    {
      rule: "P2",
      change: "relaxed",
      limit: "Ukuran keempat hanya teks kredit 24 px (maks 3 butir)",
    },
    {
      rule: "P4",
      change: "relaxed",
      limit: "Keluarga ketiga hanya font aksen (T-124) untuk maks 4 kata",
    },
    { rule: "P5", change: "relaxed", limit: "iklan-cetak dan groovy: maks 4 elemen visual utama" },
    {
      rule: "P8",
      change: "relaxed",
      limit: "iklan-cetak dan groovy boleh berporos tengah pada garis sepertiga",
    },
    {
      rule: "P10",
      change: "relaxed",
      limit: "iklan-cetak dan groovy: ruang kosong ≥ 25%, maks 7 elemen",
    },
    {
      rule: "P11",
      change: "stricter",
      limit: "Satu tekstur, satu sudut miring, bayangan keras tanpa blur, satu era dekorasi",
    },
  ],
  compatibility: [
    {
      check: "light-color",
      message:
        "Gaya retro butuh warna terang untuk latar kertas; hanya editorial hangat yang dipakai.",
    },
    {
      check: "vivid-color",
      message:
        "Palet brand terlalu kalem untuk bidang warna retro; gaya tampil sebagai editorial bernuansa foto.",
    },
  ],
  options: [
    {
      name: "foto",
      values: ["hangat", "duotone", "mono", "natural"],
      default: "hangat",
      description: "Grading foto; natural untuk brand yang melarang filter berat",
    },
    {
      name: "tekstur",
      values: ["grain", "halftone", "none"],
      default: "grain",
      description: "Tekstur cetak di atas seluruh kanvas",
    },
  ],
  // Ambang QA desain dari bagian aturan PANDUAN.md (sub-varian iklan cetak dan groovy lebih longgar).
  limits: { fontSizes: 4 },
  variantLimits: {
    "iklan-cetak": { centerAxis: true, emptyMin: 0.25, elementsMax: 7 },
    groovy: { centerAxis: true, emptyMin: 0.25, elementsMax: 7 },
  },
};
