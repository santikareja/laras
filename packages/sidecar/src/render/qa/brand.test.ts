import { readFileSync } from "node:fs";
import { BrandKit } from "@laras/shared";
import { describe, expect, it } from "vitest";
import { brandRuleChecks } from "./brand.ts";
import type { DesignMeasurements } from "./design.ts";
import type { Measurements } from "./rules.ts";

// Aturan brand terstruktur (T-124): data ukur sintetis, satu pelanggaran per test.

const brand = (slug: string) =>
  BrandKit.parse(
    JSON.parse(
      readFileSync(
        new URL(`../../../../../fixtures/brands/${slug}/brand.json`, import.meta.url),
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

const measure = (overrides: Partial<Measurements> = {}): Measurements => ({
  canvas: { width: 1080, height: 1350 },
  texts: [],
  slots: [{ slot: "logo", type: "logo", rect: rect(900, 1200, 1008, 1278) }],
  colors: [],
  gradients: [],
  brokenImages: [],
  fontFaces: [],
  ...overrides,
});

const design = (kinds: string[]): DesignMeasurements => ({
  canvas: { width: 1080, height: 1350 },
  blocks: [],
  texts: [],
  focus: null,
  elements: kinds.map((kind, i) => ({ kind, name: `${kind} ${i + 1}` })),
  photoBackground: false,
  centered: false,
  radii: [],
  angles: [],
  excluded: [],
});

const failed = (checks: ReturnType<typeof brandRuleChecks>) =>
  checks.filter((c) => !c.passed).map((c) => `${c.rule} ${c.target}: ${c.message}`);

describe("aturan brand terstruktur (T-124)", () => {
  it("Kopi: logo kanan bawah dan tanpa gradient lolos, wajib (tanpa severity)", () => {
    const checks = brandRuleChecks(measure(), design(["image"]), brand("kopi-lembayung"));
    expect(checks.map((c) => [c.rule, c.passed, c.severity])).toEqual([
      ["brand-logo-position", true, undefined],
      ["brand-gradient", true, undefined],
    ]);
  });

  it("posisi logo: pusat slot logo di kuadran yang salah", () => {
    const topLeft = measure({
      slots: [{ slot: "logo", type: "logo", rect: rect(64, 64, 172, 142) }],
    });
    expect(failed(brandRuleChecks(topLeft, design([]), brand("kopi-lembayung")))).toEqual([
      "brand-logo-position logo: Logo di kiri atas, aturan brand: kanan bawah",
    ]);
  });

  it("gradient: satu cek gagal per elemen bergradient", () => {
    const m = measure({ gradients: ["kata", "div"] });
    expect(failed(brandRuleChecks(m, design([]), brand("kopi-lembayung")))).toEqual([
      "brand-gradient kata: Gradient dipakai, aturan brand: tanpa gradient",
      "brand-gradient div: Gradient dipakai, aturan brand: tanpa gradient",
    ]);
  });

  it("Seruni: maksimal dua elemen visual utama; teks, logo, dan dekor tidak dihitung", () => {
    const ok = design(["image", "shape", "text", "logo", "badge"]);
    expect(failed(brandRuleChecks(measure(), ok, brand("seruni-skin")))).toEqual([]);
    const many = design(["image", "shape", "background"]);
    expect(failed(brandRuleChecks(measure(), many, brand("seruni-skin")))).toEqual([
      "brand-visuals slide: 3 elemen visual utama (image 1, shape 2, background 3), aturan brand maksimal 2",
    ]);
  });

  it("brand tanpa aturan terukur yang relevan tidak menghasilkan cek (Ritme hanya arahan foto)", () => {
    expect(
      brandRuleChecks(
        measure({ gradients: ["div"] }),
        design(["image", "shape", "shape"]),
        brand("ritme-run-club"),
      ),
    ).toEqual([]);
  });
});
