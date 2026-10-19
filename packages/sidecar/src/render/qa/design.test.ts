import { readFileSync } from "node:fs";
import { BrandKit, DEFAULT_DESIGN_LIMITS, type DesignLimits } from "@laras/shared";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { alignmentAxes, type DesignMeasurements, designChecks } from "./design.ts";
import { pixelStats } from "./pixels.ts";

// Aturan desain terukur PRD 4 (T-130): data ukur sintetis, satu pelanggaran per test.

const brand = BrandKit.parse(
  JSON.parse(
    readFileSync(
      new URL("../../../../../fixtures/brands/kopi-lembayung/brand.json", import.meta.url),
      "utf8",
    ),
  ),
);
const rect = (left: number, top: number, right: number, bottom: number) => ({
  left,
  top,
  right,
  bottom,
});

// Slide patuh: kata utama di sepertiga atas kiri, subjek di sepertiga bawah kanan, dua sumbu.
const design = (overrides: Partial<DesignMeasurements> = {}): DesignMeasurements => ({
  canvas: { width: 1080, height: 1350 },
  blocks: [
    { name: "headline", rect: rect(72, 380, 700, 520) },
    { name: "cta", rect: rect(72, 1180, 400, 1260) },
    { name: "logo", rect: rect(900, 1200, 1008, 1278) },
  ],
  texts: [
    { slot: "headline", size: 120, role: "display", rect: rect(72, 380, 700, 520), lines: [] },
    {
      slot: "body",
      size: 32,
      role: "body",
      rect: rect(72, 560, 600, 700),
      lines: ["Biji kopi disangrai sendiri setiap minggu", "di kedai kami."],
    },
  ],
  focus: { x: 720, y: 900 },
  elements: [
    { kind: "text", name: "headline" },
    { kind: "text", name: "body" },
    { kind: "image", name: "image" },
    { kind: "badge", name: "cta" },
    { kind: "logo", name: "logo" },
  ],
  photoBackground: false,
  centered: false,
  radii: [],
  angles: [],
  excluded: [],
  ...overrides,
});

const pixels = {
  tokens: { "#faf7f0": 0.65, "#0f3d3e": 0.25, "#f2a541": 0.05 },
  image: 0.05,
  outside: { "#faf7f0": 0.5 },
};

const advice = (d: DesignMeasurements, px = pixels, limits: DesignLimits = DEFAULT_DESIGN_LIMITS) =>
  designChecks(d, px, limits, brand).filter((check) => !check.passed);

describe("aturan desain (T-130)", () => {
  it("slide patuh: semua aturan lolos dan bertingkat saran", () => {
    const checks = designChecks(design(), pixels, DEFAULT_DESIGN_LIMITS, brand);
    expect(checks.every((check) => check.passed && check.severity === "saran")).toBe(true);
    expect(checks).toHaveLength(8);
  });

  it("P1: sumbu perataan terkecil yang menutup semua blok", () => {
    expect(alignmentAxes([{ rect: rect(72, 0, 500, 10) }, { rect: rect(72, 50, 300, 60) }])).toBe(
      1,
    );
    const scattered = design({
      blocks: [
        { name: "a", rect: rect(72, 0, 300, 10) },
        { name: "b", rect: rect(400, 50, 500, 60) },
        { name: "c", rect: rect(760, 100, 1008, 110) },
      ],
    });
    expect(advice(scattered).map((c) => c.rule)).toContain("alignment");
  });

  it("P2: jumlah ukuran, rasio headline terhadap body, dan ukuran kedua", () => {
    const flat = design({
      texts: [
        { slot: "headline", size: 48, role: "heading", rect: rect(72, 380, 700, 520), lines: [] },
        { slot: "body", size: 36, role: "body", rect: rect(72, 560, 600, 700), lines: [] },
        { slot: "cta", size: 32, role: "body", rect: rect(72, 1180, 400, 1260), lines: [] },
        { slot: "label", size: 24, role: "body", rect: rect(72, 72, 300, 100), lines: [] },
      ],
    });
    expect(advice(flat).map((c) => c.message)).toEqual([
      "4 ukuran huruf, maksimal 3",
      "Ukuran kedua 36 px lebih dari 50% ukuran dominan 48 px",
    ]);
  });

  it("P4: baris yatim, tanda baca terpisah, dan panjang baris body", () => {
    const text = design({
      texts: [
        {
          slot: "body",
          size: 32,
          role: "body",
          rect: rect(72, 400, 600, 520),
          lines: ["Biji kopi", ", disangrai sendiri setiap minggu di kedai", "kami."],
        },
      ],
    });
    expect(advice(text).map((c) => c.message)).toEqual([
      'Baris yatim: "kami." sendirian di baris akhir',
      'Tanda baca terpisah dari katanya: ", disangrai sendiri setiap minggu di kedai"',
      "Baris body 9 karakter, seharusnya 30–45",
    ]);
  });

  it("P8: fokus subjek dan kata utama di titik potong 3×3; sumbu tengah bila gaya mengizinkan", () => {
    const centered = design({ focus: { x: 540, y: 450 } });
    expect(advice(centered).map((c) => c.target)).toEqual(["fokus subjek"]);
    expect(advice(centered, pixels, { ...DEFAULT_DESIGN_LIMITS, centerAxis: true })).toEqual([]);
    // Arketipe terpusat (keputusan pemilik): P8 tidak dicek sama sekali.
    expect(advice(design({ focus: { x: 540, y: 700 }, centered: true }))).toEqual([]);
  });

  it("P4 dan P9: minimal panjang baris hanya untuk paragraf, desain lapang tanpa batas bawah", () => {
    const short = design({
      texts: [
        {
          slot: "body",
          size: 32,
          role: "body",
          rect: rect(72, 400, 600, 520),
          lines: ["Konsultasi kulit", "gratis 30 menit."],
        },
      ],
    });
    expect(advice(short)).toEqual([]);
    const calm = {
      tokens: { "#faf7f0": 0.86, "#0f3d3e": 0.1, "#f2a541": 0.02 },
      image: 0.02,
      outside: { "#faf7f0": 0.8 },
    };
    expect(advice(design(), calm)).toEqual([]);
  });

  it("P9: dominan, warna kedua dan gambar, aksen", () => {
    const loud = {
      tokens: { "#faf7f0": 0.4, "#0f3d3e": 0.35, "#f2a541": 0.2 },
      image: 0.05,
      outside: { "#faf7f0": 0.4 },
    };
    expect(advice(design(), loud).map((c) => c.message)).toEqual([
      "Warna dominan 40%, minimal 55%",
      "Warna kedua dan gambar 40%, seharusnya 20%–35%",
      "Aksen 20%, maksimal 12%",
    ]);
  });

  it("P10: ruang kosong (dilewati pada latar foto) dan jumlah elemen", () => {
    const crowded = { ...pixels, outside: { "#faf7f0": 0.2 } };
    expect(advice(design(), crowded).map((c) => c.rule)).toEqual(["whitespace"]);
    expect(
      advice(design({ photoBackground: true }), { ...crowded, image: 0.7 }).map((c) => c.rule),
    ).not.toContain("whitespace");
    const many = design({
      elements: Array.from({ length: 7 }, (_, i) => ({ kind: "shape", name: `bentuk ${i}` })),
    });
    expect(advice(many).map((c) => c.rule)).toEqual(["element-count"]);
  });

  it("P11: jarak tepi, radius, dan sudut kemiringan; bleed dan rotasi 90° tidak dihitung", () => {
    const mixed = design({
      blocks: [
        { name: "a", rect: rect(64, 200, 500, 260) },
        { name: "b", rect: rect(96, 600, 500, 660) },
        { name: "panel", rect: rect(0, 300, 500, 400) },
      ],
      radii: [24, -1, 8],
      angles: [-3, 5, 90],
    });
    // Ketiga blok berbagi tepi kanan (satu sumbu); panel bleed (0 px) tidak dihitung jarak tepi.
    expect(advice(mixed).map((c) => `${c.rule} ${c.target}`)).toEqual([
      "consistency jarak tepi",
      "consistency radius",
      "consistency kemiringan",
    ]);
  });
});

describe("pixelStats (T-130)", () => {
  it("memetakan piksel ke warna palet terdekat dan mengecualikan kotak teks", async () => {
    // Kanvas 1080 × 1350: setengah atas krem, setengah bawah hijau tua.
    const top = {
      create: { width: 1080, height: 675, channels: 3 as const, background: "#FAF7F0" },
    };
    const png = await sharp({
      create: { width: 1080, height: 1350, channels: 3, background: "#0F3D3E" },
    })
      .composite([{ input: await sharp(top).png().toBuffer(), top: 0, left: 0 }])
      .png()
      .toBuffer();
    const stats = await pixelStats(
      png,
      ["#FAF7F0", "#0F3D3E", "#F2A541"],
      [rect(0, 0, 1080, 337)],
      {
        width: 1080,
        height: 1350,
      },
    );
    expect(stats.tokens["#faf7f0"]).toBeCloseTo(0.5, 1);
    expect(stats.tokens["#0f3d3e"]).toBeCloseTo(0.5, 1);
    expect(stats.outside["#faf7f0"]).toBeCloseTo(0.25, 1);
    expect(stats.image).toBeLessThan(0.02);
  });
});
