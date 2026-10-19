import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { BrandKit } from "./brand-kit.ts";
import { relativeLuminance, StyleMeta, styleFit } from "./style-meta.ts";
import { issuesOf } from "./test-utils.ts";

const brand = (slug: string) =>
  BrandKit.parse(
    JSON.parse(
      readFileSync(new URL(`../../../fixtures/brands/${slug}/brand.json`, import.meta.url), "utf8"),
    ),
  );

const style = (): StyleMeta => ({
  id: "contoh",
  name: "Contoh",
  summary: "Gaya untuk test.",
  variants: [{ id: "utama", name: "Utama", description: "Varian utama" }],
  archetypes: ["feed-bidang-warna"],
  plannedArchetypes: [],
  typography: {
    heading: ["grotesk-condensed"],
    body: ["grotesk"],
    headingCase: "upper",
    scaleRatio: 4,
    tracking: "tight",
  },
  color: {
    background: "dark",
    dominant: "neutral-dark",
    second: "primary",
    accent: "accent",
    gradient: "never",
  },
  shape: { radius: "none", shadow: "glow", border: "thin" },
  devices: [{ id: "glow", name: "Glow neon", status: "perlu-dibuat" }],
  imagery: {
    kinds: ["cutout"],
    treatment: ["neon"],
    promptHints: ["rim light in brand colors"],
    avoid: ["text"],
  },
  rules: [{ rule: "P5", change: "relaxed", limit: "maks 4 elemen visual utama" }],
  compatibility: [
    { check: "dark-color", message: "Brand tidak punya warna gelap untuk latar" },
    { check: "vivid-color", message: "Brand tidak punya warna jenuh untuk neon" },
  ],
});

describe("StyleMeta (T-128)", () => {
  it("menerima definisi gaya yang lengkap", () => {
    expect(issuesOf(StyleMeta, style())).toEqual([]);
  });

  it("menolak gaya yang melonggarkan P7", () => {
    const loose = { ...style(), rules: [{ rule: "P7", change: "relaxed", limit: "kontras 2:1" }] };
    expect(issuesOf(StyleMeta, loose)).toContain("P7 tidak boleh dilonggarkan");
  });

  it("luminans relatif WCAG", () => {
    expect(relativeLuminance("#000000")).toBe(0);
    expect(relativeLuminance("#FFFFFF")).toBeCloseTo(1, 5);
  });

  it("menandai kurang cocok beserta alasannya untuk brand yang tidak memenuhi syarat", () => {
    // Seruni: navy, biru pucat, dan salmon terang tanpa warna jenuh; Kopi punya aksen amber jenuh.
    expect(styleFit(style(), brand("seruni-skin"))).toEqual({
      fit: "kurang-cocok",
      reasons: ["Brand tidak punya warna jenuh untuk neon"],
    });
    expect(styleFit(style(), brand("ritme-run-club"))).toEqual({ fit: "cocok", reasons: [] });
    expect(styleFit(style(), brand("kopi-lembayung")).fit).toBe("cocok");
  });

  it("syarat bentuk membaca radius dan bayangan Brand Kit", () => {
    const soft = {
      ...style(),
      compatibility: [
        { check: "rounded-corners" as const, message: "Sudut brand terlalu tajam" },
        { check: "soft-shadow" as const, message: "Brand tanpa bayangan lembut" },
      ],
    };
    expect(styleFit(soft, brand("seruni-skin")).fit).toBe("cocok");
    expect(styleFit(soft, brand("kopi-lembayung")).reasons).toEqual([
      "Sudut brand terlalu tajam",
      "Brand tanpa bayangan lembut",
    ]);
  });
});
