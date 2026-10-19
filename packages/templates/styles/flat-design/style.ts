import type { StyleMeta } from "@laras/shared";

// Definisi mesin Flat Design; rincian di PANDUAN.md.
export const flatDesign: StyleMeta = {
  id: "flat-design",
  name: "Flat Design",
  summary:
    "Cerah dan ramah: bidang warna jenuh tanpa bayangan, bentuk lengkung dan swoosh, subjek cut-out yang menembus bentuk.",
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
  archetypes: ["feed-bidang-warna", "feed-kata-raksasa", "feed-satu-objek"],
  plannedArchetypes: [
    {
      id: "feed-panel-lengkung",
      name: "Panel lengkung",
      description: "Panel melengkung memisahkan foto dan teks.",
    },
    {
      id: "feed-kartu-organik",
      name: "Kartu organik",
      description: "Kartu bentuk organik untuk tips atau mitos.",
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
  ],
  imagery: {
    kinds: ["cutout", "illustration"],
    treatment: ["natural"],
    promptHints: [
      "cheerful person in a dynamic natural pose, clothing in solid colors, even soft light, isolated on a transparent background",
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
      limit: "Bentuk dekoratif tidak dihitung bila ≤ 3 potong satu keluarga",
    },
    {
      rule: "P8",
      change: "relaxed",
      limit: "Pola simetris boleh berfokus di sumbu tengah, maks 1 dari 3 postingan",
    },
    {
      rule: "P9",
      change: "relaxed",
      limit: "Dominan ≥ 50%, warna kedua dan gambar 20–40%, aksen ≤ 12%",
    },
    {
      rule: "P10",
      change: "relaxed",
      limit: "Bidang polos di dalam bentuk dihitung kosong; area tanpa bentuk ≥ 25%",
    },
    {
      rule: "P11",
      change: "relaxed",
      limit:
        "Dua radius: token untuk kartu, bulat penuh untuk chip dan CTA bila radius brand ≥ 16 px",
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
};
