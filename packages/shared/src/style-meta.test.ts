import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { BrandKit } from "./brand-kit.ts";
import { DEFAULT_DESIGN_LIMITS } from "./design-limits.ts";
import {
  designLimits,
  relativeLuminance,
  resolveStyleChoice,
  StyleMeta,
  styleChoiceIssues,
  styleFit,
} from "./style-meta.ts";
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
  options: [
    {
      name: "glow",
      values: ["soft", "solid"],
      default: "soft",
      description: "Glow lunak, atau padat untuk brand tanpa gradient",
    },
  ],
  limits: { centerAxis: true },
  variantLimits: { utama: { elementsMax: 6 } },
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

  it("menolak nama opsi gaya ganda", () => {
    const base = style();
    const doubled = { ...base, options: [...base.options, ...base.options] };
    expect(issuesOf(StyleMeta, doubled)).toContain("Nama opsi gaya harus unik");
  });
});

describe("StyleChoice (T-132)", () => {
  it("memeriksa varian dan opsi terhadap definisi gaya", () => {
    expect(styleChoiceIssues({ id: "contoh", variant: "utama", options: {} }, style())).toEqual([]);
    expect(
      styleChoiceIssues(
        { id: "contoh", variant: "lain", options: { glow: "keras", tekstur: "grain" } },
        style(),
      ),
    ).toEqual([
      'Gaya "contoh" tidak punya varian "lain"',
      'Opsi "glow" gaya "contoh" tidak menerima "keras"',
      'Gaya "contoh" tidak punya opsi "tekstur"',
    ]);
  });

  it("mengisi opsi yang tidak dipilih dengan default", () => {
    expect(resolveStyleChoice({ id: "contoh", variant: "utama", options: {} }, style())).toEqual({
      id: "contoh",
      variant: "utama",
      options: { glow: "soft" },
    });
    expect(
      resolveStyleChoice({ id: "contoh", variant: "utama", options: { glow: "solid" } }, style())
        .options,
    ).toEqual({ glow: "solid" });
    expect(() =>
      resolveStyleChoice({ id: "lain", variant: "utama", options: {} }, style()),
    ).toThrow('Pilihan untuk gaya "lain"');
  });
});

describe("designLimits (T-130)", () => {
  it("angka PRD tanpa gaya; gaya lalu varian menimpa", () => {
    expect(designLimits()).toEqual(DEFAULT_DESIGN_LIMITS);
    const limits = designLimits(style(), "utama");
    expect(limits.centerAxis).toBe(true);
    expect(limits.elementsMax).toBe(6);
    expect(limits.emptyMin).toBe(DEFAULT_DESIGN_LIMITS.emptyMin);
  });

  it("menolak ambang untuk varian yang tidak ada", () => {
    const wrong = { ...style(), variantLimits: { lain: { axes: 3 } } };
    expect(issuesOf(StyleMeta, wrong)).toContain('Varian "lain" tidak ada');
  });
});
