import { readFileSync } from "node:fs";
import { BrandKit, CopyGuide } from "@laras/shared";
import { describe, expect, it } from "vitest";
import {
  CORE_RULES,
  contrastRatio,
  countEmoji,
  evaluateQa,
  forbiddenWordsIn,
  luminance,
  type Measurements,
  parseColor,
  type QaContext,
  type TextMeasure,
} from "./rules.ts";

const BRAND_DIR = new URL("../../../../../fixtures/brands/kopi-lembayung/", import.meta.url);
const read = (file: string): unknown => JSON.parse(readFileSync(new URL(file, BRAND_DIR), "utf8"));
const ctx: QaContext = {
  brand: BrandKit.parse(read("brand.json")),
  copyGuide: CopyGuide.parse(read("copy-guide.json")),
};

// Teks patuh: Inter 400 warna neutral-900 di atas neutral-50, di dalam safe margin.
const text = (overrides: Partial<TextMeasure> = {}): TextMeasure => ({
  id: 0,
  slot: "headline",
  text: "Kopi pagi",
  rect: { left: 64, top: 64, right: 600, bottom: 130 },
  lines: [{ left: 64, top: 62, right: 400, bottom: 132 }],
  color: "rgb(27, 26, 23)",
  fontSize: 60,
  fontWeight: 400,
  fontFamily: "Inter",
  scrollWidth: 536,
  clientWidth: 536,
  backgrounds: [{ kind: "color", color: "rgb(250, 247, 240)" }],
  platformFonts: [{ family: "Inter", custom: true, glyphs: 9 }],
  ...overrides,
});

const measure = (overrides: Partial<Measurements> = {}): Measurements => ({
  canvas: { width: 1080, height: 1350 },
  texts: [text()],
  slots: [{ slot: "headline", type: "text", rect: { left: 64, top: 64, right: 600, bottom: 130 } }],
  colors: [{ kind: "background", color: "rgb(250, 247, 240)", target: "div" }],
  brokenImages: [],
  fontFaces: [{ family: "Inter", status: "loaded" }],
  ...overrides,
});

const failures = (m: Measurements, sampled = new Map<number, number>()) =>
  evaluateQa(m, ctx, sampled).filter((check) => !check.passed);

describe("parseColor dan kontras", () => {
  it("membaca format warna computed Chromium", () => {
    expect(parseColor("rgb(15, 61, 62)")).toEqual({ r: 15, g: 61, b: 62, a: 1 });
    expect(parseColor("rgba(0, 0, 0, 0)")).toEqual({ r: 0, g: 0, b: 0, a: 0 });
    expect(parseColor("rgb(15 61 62 / 0.5)")).toEqual({ r: 15, g: 61, b: 62, a: 0.5 });
    expect(parseColor("color(srgb 0.07 0.1 0.14 / 0.16)")).toEqual({
      r: 18,
      g: 26,
      b: 36,
      a: 0.16,
    });
    expect(parseColor("#0F3D3E")).toEqual({ r: 15, g: 61, b: 62, a: 1 });
    expect(parseColor("hsl(0 0% 0%)")).toBeNull();
  });

  it("menghitung rasio kontras WCAG", () => {
    const black = luminance({ r: 0, g: 0, b: 0, a: 1 });
    const white = luminance({ r: 255, g: 255, b: 255, a: 1 });
    expect(contrastRatio(black, white)).toBeCloseTo(21, 5);
    expect(contrastRatio(white, white)).toBe(1);
  });
});

describe("teks dan copy", () => {
  it("menghitung emoji per grafem", () => {
    expect(countEmoji("Kopi ☕ pagi 👋🏽")).toBe(2);
    expect(countEmoji("Tanpa emoji 100%")).toBe(0);
  });

  it("mencocokkan kata dan frasa terlarang dengan batas kata", () => {
    expect(forbiddenWordsIn("Kopi TERENAK di gang", ["terenak", "Anda"])).toEqual(["terenak"]);
    expect(forbiddenWordsIn("Bandar kopi", ["Anda"])).toEqual([]);
    expect(forbiddenWordsIn("No  pain no gain", ["no pain no gain"])).toEqual(["no pain no gain"]);
    expect(forbiddenWordsIn("Hasil 100% alami", ["100%"])).toEqual(["100%"]);
  });
});

describe("evaluateQa", () => {
  it("meloloskan slide patuh dengan satu cek lolos per aturan", () => {
    const checks = evaluateQa(measure(), ctx, new Map());
    expect(checks.every((check) => check.passed)).toBe(true);
    expect(checks.map((check) => check.rule).sort()).toEqual([...CORE_RULES].sort());
  });

  it("kontras: warna latar, ambang teks besar, dan sampling foto", () => {
    const pale = text({ color: "rgb(226, 220, 200)", fontSize: 30 });
    expect(failures(measure({ texts: [pale] }))).toMatchObject([
      { rule: "contrast", target: "headline", threshold: 4.5 },
    ]);
    const overPhoto = text({ backgrounds: [{ kind: "image" }] });
    expect(failures(measure({ texts: [overPhoto] }), new Map([[0, 2.1]]))).toMatchObject([
      { rule: "contrast", measured: 2.1, threshold: 3 },
    ]);
    expect(failures(measure({ texts: [overPhoto] }), new Map([[0, 3.2]]))).toEqual([]);
  });

  it("overflow: luber horizontal, keluar kanvas, dan slot bertabrakan", () => {
    const wide = text({ scrollWidth: 700, clientWidth: 536 });
    const cut = text({
      id: 1,
      slot: "body",
      lines: [{ left: 64, top: 1320, right: 300, bottom: 1370 }],
    });
    const slots = [
      { slot: "headline", type: "text", rect: { left: 64, top: 64, right: 600, bottom: 200 } },
      { slot: "logo", type: "logo", rect: { left: 500, top: 150, right: 600, bottom: 214 } },
      { slot: "image", type: "image", rect: { left: 0, top: 0, right: 1080, bottom: 720 } },
    ];
    const messages = failures(measure({ texts: [wide, cut], slots }))
      .filter((check) => check.rule === "overflow")
      .map((check) => check.message);
    expect(messages).toEqual([
      "Teks lebih lebar dari kotaknya",
      "Teks terpotong di tepi postingan",
      "Slot headline menabrak logo",
    ]);
  });

  it("safe margin memakai spacing.safeMargin brand dan mengabaikan slot gambar", () => {
    const slots = [
      { slot: "badge", type: "badge", rect: { left: 20, top: 64, right: 200, bottom: 110 } },
      { slot: "image", type: "image", rect: { left: 0, top: 0, right: 1080, bottom: 1350 } },
    ];
    expect(failures(measure({ slots }))).toMatchObject([
      { rule: "safe-margin", target: "badge", measured: 20, threshold: 64 },
    ]);
  });

  it("font: ukuran minimum, glyph cadangan, family, dan bobot", () => {
    const small = text({ fontSize: 16, color: "rgb(27, 26, 23)" });
    const fallback = text({
      id: 1,
      slot: "body",
      text: "Panah →",
      platformFonts: [
        { family: "Inter", custom: true, glyphs: 6 },
        { family: "Lucida Grande", custom: false, glyphs: 1 },
      ],
    });
    const otherFamily = text({ id: 2, slot: "cta", fontFamily: "Georgia, serif" });
    const heavy = text({ id: 3, slot: "title", fontFamily: '"Fraunces"', fontWeight: 400 });
    const rules = failures(measure({ texts: [small, fallback, otherFamily, heavy] })).map(
      (check) => `${check.rule} ${check.target}`,
    );
    expect(rules).toEqual([
      "font-size headline",
      "brand-font body",
      "brand-font cta",
      "brand-font title",
    ]);
  });

  it("font aksen Brand Kit diterima dengan bobot yang diizinkan (T-134)", () => {
    const label = text({ slot: "label", fontFamily: '"Courier Prime"', fontWeight: 700 });
    expect(failures(measure({ texts: [label] }))).toEqual([]);
    const thin = text({ slot: "label", fontFamily: '"Courier Prime"', fontWeight: 400 });
    expect(failures(measure({ texts: [thin] })).map((check) => check.message)).toEqual([
      "Bobot 400 tidak diizinkan untuk Courier Prime (700)",
    ]);
  });

  it("font emoji sistem tidak dihitung sebagai font cadangan", () => {
    const withEmoji = text({
      text: "Kopi ☕",
      platformFonts: [
        { family: "Inter", custom: true, glyphs: 5 },
        { family: "Apple Color Emoji", custom: false, glyphs: 1 },
      ],
    });
    expect(failures(measure({ texts: [withEmoji] }))).toEqual([]);
  });

  it("warna di luar palet ditolak, transparan diabaikan", () => {
    const colors = [
      { kind: "background" as const, color: "rgb(0, 255, 0)", target: "div" },
      { kind: "border" as const, color: "rgba(0, 0, 0, 0)", target: "div" },
    ];
    expect(failures(measure({ colors }))).toMatchObject([
      {
        rule: "brand-color",
        target: "div",
        message: "Warna rgb(0, 255, 0) tidak ada di palet Brand Kit",
      },
    ]);
  });

  it("tint campuran dua token boleh untuk latar dan border, tidak untuk teks", () => {
    // 30% primary #0F3D3E + 70% neutral #FAF7F0, seperti hasil color-mix di Chromium.
    const tint = "color(srgb 0.703922 0.749804 0.731765)";
    const colors = [
      { kind: "background" as const, color: tint, target: "div.bidang" },
      { kind: "border" as const, color: "rgb(180, 120, 60)", target: "div.lain" },
    ];
    const brandColor = failures(measure({ colors, texts: [text({ color: tint })] })).filter(
      (check) => check.rule === "brand-color",
    );
    expect(brandColor.map((check) => check.target)).toEqual(["headline", "div.lain"]);
  });

  it("copy: kata terlarang, hashtag di gambar, dan batas emoji", () => {
    const texts = [
      text({ text: "Kopi terenak #KopiLembayung" }),
      text({ id: 1, slot: "body", text: "☕☕☕ pagi" }),
    ];
    expect(failures(measure({ texts })).map((check) => check.message)).toEqual([
      'Kata terlarang "terenak"',
      "Hashtag tidak boleh di gambar, tempatnya di caption",
      "3 emoji di gambar, maksimal 2",
    ]);
  });

  it("aset: gambar rusak dan font gagal dimuat", () => {
    const m = measure({
      brokenImages: ["http://laras.invalid/job/hilang.png"],
      fontFaces: [{ family: "Fraunces", status: "error" }],
    });
    expect(failures(m).map((check) => check.rule)).toEqual(["asset-load", "asset-load"]);
  });
});
