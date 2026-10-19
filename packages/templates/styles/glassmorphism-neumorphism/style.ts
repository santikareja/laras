import type { StyleMeta } from "@laras/shared";

// Definisi mesin Glassmorphism dan Neumorphism (satu gaya, dua varian); rincian di PANDUAN.md.
export const glassmorphismNeumorphism: StyleMeta = {
  id: "glassmorphism-neumorphism",
  name: "Glassmorphism dan Neumorphism",
  summary:
    "Lembut dan berlapis: kartu kaca buram di atas foto atau permukaan timbul lembut, sudut membulat, tenang dan modern.",
  variants: [
    {
      id: "kaca",
      name: "Kaca",
      description:
        "Kartu kaca buram di atas foto suasana yang kuat; untuk kutipan, acara, properti, travel.",
    },
    {
      id: "timbul",
      name: "Timbul",
      description:
        "Permukaan timbul atau cekung lembut tanpa foto; butuh bayangan lembut dan radius ≥ 16 px.",
    },
  ],
  archetypes: ["feed-kartu-kaca", "feed-foto-konsep", "feed-satu-objek"],
  plannedArchetypes: [
    {
      id: "feed-objek-timbul",
      name: "Objek timbul",
      description: "Satu objek di permukaan timbul lembut.",
    },
  ],
  typography: {
    heading: ["geometric-sans", "humanist-sans", "rounded-sans"],
    body: ["humanist-sans", "geometric-sans"],
    headingCase: "sentence",
    scaleRatio: 2.5,
    tracking: "normal",
  },
  color: {
    background: "photo",
    dominant: "neutral-light",
    second: "primary",
    accent: "accent",
    gradient: "never",
  },
  shape: { radius: "large", shadow: "soft", border: "thin" },
  devices: [
    { id: "image", name: "Foto latar", status: "ada" },
    { id: "glass-panel", name: "Panel kaca buram", status: "ada" },
    { id: "soft-surface", name: "Permukaan timbul", status: "ada" },
    { id: "icon-button", name: "Tombol ikon dan set ikon garis", status: "ada" },
    { id: "pill-button", name: "Tombol pil", status: "ada" },
    { id: "progress-track", name: "Bilah progres", status: "ada" },
    { id: "keycap", name: "Tombol keycap", status: "ada" },
    { id: "tint-foto", name: "Grain dan tint foto", status: "ada" },
  ],
  imagery: {
    kinds: ["photo", "cutout"],
    treatment: ["natural", "blur"],
    promptHints: [
      "calm wide photograph of open sky and sea, soft natural light, gentle colors, large quiet area for a card overlay",
      "single object on a smooth matte surface of one soft color, diffused light, minimal shadows",
    ],
    avoid: [
      "glassmorphism",
      "frosted glass card",
      "keyboard keys with letters",
      "rainbow gradient",
      "glossy chrome",
      "abstract gradient blobs",
      "with text",
    ],
  },
  rules: [
    {
      rule: "P8",
      change: "relaxed",
      limit: "Kutipan dan objek timbul boleh berfokus di sumbu tengah pada garis sepertiga",
    },
    {
      rule: "P9",
      change: "relaxed",
      limit: "Kaca: dominan ≥ 55%, aksen ≤ 8%. Timbul: dominan 70–85%, aksen ≤ 6%",
    },
    { rule: "P10", change: "stricter", limit: "Ruang kosong ≥ 40%, maks 5 elemen" },
    {
      rule: "P11",
      change: "relaxed",
      limit: "Dua radius: token untuk panel, bulat penuh untuk pil bila radius brand ≥ 16 px",
    },
  ],
  compatibility: [
    {
      check: "rounded-corners",
      message: "Sudut brand di bawah 16 px; kelembutan kaca dan timbul hilang.",
    },
    {
      check: "light-color",
      message: "Brand tidak punya warna terang untuk tint kaca atau permukaan.",
    },
    {
      check: "soft-shadow",
      message: "Brand tanpa bayangan lembut; hanya varian Kaca yang dipakai.",
    },
  ],
  options: [],
  // Ambang QA desain dari bagian aturan PANDUAN.md (P9 per varian, P10 diperketat, dua radius).
  limits: { centerAxis: true, emptyMin: 0.4, radii: 2 },
  variantLimits: {
    kaca: { accentMax: 0.08 },
    timbul: { dominantMin: 0.7, accentMax: 0.06 },
  },
};
