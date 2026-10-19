import type { StyleMeta } from "@laras/shared";

// Definisi mesin Flat Design; rincian di PANDUAN.md.
export const flatDesign: StyleMeta = {
  id: "flat-design",
  name: "Flat Design",
  summary:
    "Cerah dan ramah: bidang warna jenuh tanpa bayangan, satu bentuk besar pembawa metafora (cakram, lensa, biji, tiket), subjek cut-out yang menembus bentuk, swirl tebal.",
  variants: [
    {
      id: "pita",
      name: "Pita",
      description: "Bentuk berupa pita dan swoosh yang melintasi kanvas.",
    },
    { id: "organik", name: "Organik", description: "Blob, scallop, dan panel melengkung." },
    {
      id: "geometris",
      name: "Geometris",
      description: "Busur, cakram, ubin persegi; cocok untuk brand bersudut siku.",
    },
  ],
  archetypes: [
    "feed-subjek-lingkar",
    "feed-mitos-fakta",
    "feed-tiket",
    "feed-bidang-warna",
    "feed-kata-raksasa",
    "feed-satu-objek",
  ],
  plannedArchetypes: [
    {
      id: "feed-panel-lengkung",
      name: "Panel lengkung",
      description: "Panel melengkung memisahkan foto dan teks.",
    },
    {
      id: "feed-kartu-organik",
      name: "Kartu organik",
      description: "Kartu scallop berisi kutipan testimoni dan kartu rating.",
    },
  ],
  typography: {
    heading: ["geometric-sans", "rounded-sans", "grotesk"],
    body: ["geometric-sans", "humanist-sans"],
    headingCase: "sentence",
    scaleRatio: 3.5,
    tracking: "normal",
  },
  color: {
    background: "brand",
    dominant: "primary",
    second: "secondary",
    accent: "accent",
    gradient: "never",
  },
  shape: { radius: "brand", shadow: "none", border: "none" },
  devices: [
    { id: "display", name: "Kata raksasa", status: "ada" },
    { id: "sticker", name: "Chip dan tombol", status: "ada" },
    { id: "swoosh", name: "Swoosh", status: "ada" },
    { id: "blob", name: "Blob dan scallop", status: "ada" },
    { id: "panel-lengkung", name: "Panel melengkung", status: "ada" },
    { id: "cakram", name: "Cakram dan cincin", status: "ada" },
    { id: "ikon-datar", name: "Ikon datar", status: "ada" },
    { id: "headline-dua-nada", name: "Headline dua nada", status: "ada" },
    { id: "panggung", name: "Panggung bentuk (cakram, cincin, lensa, biji)", status: "ada" },
    { id: "swirl", name: "Swirl orbit", status: "ada" },
    { id: "riak", name: "Riak tone-on-tone", status: "ada" },
    { id: "tag-gantung", name: "Tag gantung miring", status: "ada" },
    { id: "vonis", name: "Vonis mitos dan fakta", status: "ada" },
    { id: "tiket", name: "Tiket bertakik", status: "ada" },
  ],
  imagery: {
    kinds: ["cutout", "illustration"],
    treatment: ["natural"],
    promptHints: [
      "cheerful person in a dynamic natural pose, clothing in solid brand colors, even soft light, isolated on a transparent background",
      "skeptical or thinking person, arms crossed or hand on cheek, waist-up, plain solid-color top, isolated on a transparent background",
      "person pointing toward the side of the frame or holding a product up, full body, even soft light, isolated on a transparent background",
      "single product in a clean three-quarter view, even soft light, isolated on a transparent background",
    ],
    avoid: [
      "paper texture",
      "bokeh office background",
      "exaggerated long limbs",
      "faceless character",
      "app interface on screen",
      "with text",
    ],
  },
  rules: [
    {
      rule: "P1",
      change: "relaxed",
      limit: "Bentuk dekoratif boleh keluar grid dan bleed, minimal 15% luasnya terpotong",
    },
    {
      rule: "P5",
      change: "relaxed",
      limit:
        "Bentuk berlapis satu keluarga dihitung satu bentuk; riak dan bingkai garis tidak dihitung",
    },
    {
      rule: "P8",
      change: "relaxed",
      limit: "Pola simetris boleh berfokus di sumbu tengah, maks 1 dari 3 postingan",
    },
    {
      rule: "P9",
      change: "relaxed",
      limit: "Dominan ≥ 33%, warna kedua dan gambar ≤ 55%, aksen ≤ 12% (kalibrasi referensi)",
    },
    {
      rule: "P10",
      change: "relaxed",
      limit: "Ruang kosong ≥ 28%, maksimal 7 elemen (grup dihitung satu)",
    },
    {
      rule: "P11",
      change: "relaxed",
      limit:
        "Dua radius: token untuk kartu, bulat penuh untuk chip dan CTA bila radius brand ≥ 16 px; satu tag gantung boleh miring 6–10°",
    },
  ],
  compatibility: [
    { check: "vivid-color", message: "Brand tidak punya warna jenuh untuk bidang flat." },
    {
      check: "dark-color",
      message: "Brand tidak punya warna jangkar gelap untuk teks dan kontras.",
    },
  ],
  options: [],
  // Ambang QA desain dari bagian aturan PANDUAN.md (P8, P9, P10, P11 dilonggarkan), dikalibrasi
  // dari referensi pemilik (T-134): dominan ≥ kuartil bawah referensi, warna kedua dan gambar ≤
  // kuartil atas − aksen, ruang kosong ≥ dominan − 5%, elemen ≤ hitungan referensi.
  limits: {
    centerAxis: true,
    dominantMin: 0.33,
    secondMax: 0.55,
    emptyMin: 0.28,
    elementsMax: 7,
    radii: 2,
  },
  variantLimits: {},
};
