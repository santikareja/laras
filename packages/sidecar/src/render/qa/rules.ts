import type { BrandKit, CopyGuide, DesignLimits, RenderCheck, RenderRule } from "@laras/shared";

// Aturan QA deterministik (PRD F9, ARCH 7.2) sebagai fungsi murni atas data ukur dari page.

// `design`: ambang aturan desain (T-130); tanpa nilai memakai angka PRD 4.
// `brandRules: false`: lembar spesimen perangkat (bukan postingan) tidak dicek aturan brand
// terstruktur (T-124).
export type QaContext = {
  brand: BrandKit;
  copyGuide: CopyGuide;
  design?: DesignLimits;
  brandRules?: boolean;
  // Ambang variasi luminans di balik teks di atas foto (T-141); bawaan BUSY_LIMIT.
  busyLimit?: number;
};

export type Rect = { left: number; top: number; right: number; bottom: number };

// `photo`: latar berupa foto atau cut-out (IMG), bukan bentuk SVG atau panel tembus pandang.
export type TextBackground = { kind: "color"; color: string } | { kind: "image"; photo?: boolean };

export type PlatformFont = { family: string; custom: boolean; glyphs: number };

export type TextMeasure = {
  id: number;
  slot: string | null;
  text: string;
  rect: Rect;
  lines: Rect[];
  color: string;
  fontSize: number;
  fontWeight: number;
  fontFamily: string;
  scrollWidth: number;
  clientWidth: number;
  backgrounds: TextBackground[];
  platformFonts: PlatformFont[];
};

export type Measurements = {
  canvas: { width: number; height: number };
  texts: TextMeasure[];
  slots: { slot: string; type: string | null; rect: Rect }[];
  colors: { kind: "background" | "border"; color: string; target: string }[];
  // Elemen dengan gradient CSS yang tampak (T-124), selain pola.
  gradients: string[];
  brokenImages: string[];
  fontFaces: { family: string; status: string }[];
};

// Kontras teks di atas foto dari sampling piksel (id teks → rasio persentil ke-5).
export type SampledContrast = Map<number, number>;
// Simpangan baku luma (0–255) petak paling ramai di kotak baris teks di atas foto (T-141).
export type SampledBusy = Map<number, number>;

// Ambang teks di atas area foto yang ramai, dikalibrasi dari render T-127 dan T-140 yang sudah
// dinilai pemilik (KNOWLEDGE "Spike T-140").
export const BUSY_LIMIT = 13;
// Teks setinggi ini atau lebih adalah kata raksasa (di atas langkah terbesar skala brand).
const DISPLAY_SIZE = 180;

const MIN_FONT_SIZE = 24; // PRD F9
const LARGE_TEXT = 32; // PRD F9: teks besar ≥ 32 px cukup 3:1
const TOLERANCE = 0.5;

type Rgba = { r: number; g: number; b: number; a: number };

// Warna computed Chromium: rgb()/rgba() dengan koma atau spasi, dan color(srgb …) dari color-mix.
export function parseColor(value: string): Rgba | null {
  const hex = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(value.trim());
  if (hex) {
    const [r, g, b] = hex.slice(1).map((part) => Number.parseInt(part, 16));
    return { r: r ?? 0, g: g ?? 0, b: b ?? 0, a: 1 };
  }
  const srgb = /^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+))?\)$/.exec(value);
  if (srgb) {
    const [r, g, b] = srgb.slice(1, 4).map((part) => Math.round(Number(part) * 255));
    return { r: r ?? 0, g: g ?? 0, b: b ?? 0, a: srgb[4] === undefined ? 1 : Number(srgb[4]) };
  }
  const rgb = /^rgba?\(([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:\s*[,/]\s*([\d.]+))?\)$/.exec(value);
  if (!rgb) return null;
  const [r, g, b] = rgb.slice(1, 4).map(Number);
  return { r: r ?? 0, g: g ?? 0, b: b ?? 0, a: rgb[4] === undefined ? 1 : Number(rgb[4]) };
}

// Luminans relatif dan rasio kontras WCAG 2.
export function luminance({ r, g, b }: Rgba): number {
  const [lr, lg, lb] = [r, g, b].map((channel) => {
    const c = channel / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * (lr ?? 0) + 0.7152 * (lg ?? 0) + 0.0722 * (lb ?? 0);
}

export function contrastRatio(l1: number, l2: number): number {
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

const emojiPattern = /\p{Extended_Pictographic}/u;
const hashtagPattern = /(?:^|[^\p{L}\p{N}_&])#[\p{L}\p{N}_]+/u;

export function countEmoji(text: string): number {
  const segments = new Intl.Segmenter("und", { granularity: "grapheme" }).segment(text);
  return [...segments].filter(({ segment }) => emojiPattern.test(segment)).length;
}

export function forbiddenWordsIn(text: string, words: string[]): string[] {
  return words.filter((word) => {
    const phrase = word
      .trim()
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      .replace(/\s+/g, "\\s+");
    return new RegExp(`(?<![\\p{L}\\p{N}])${phrase}(?![\\p{L}\\p{N}])`, "iu").test(text);
  });
}

const targetOf = (text: TextMeasure) => text.slot ?? `teks "${text.text.slice(0, 24)}"`;
const round = (value: number) => Math.round(value * 100) / 100;

function fail(rule: RenderRule, target: string, message: string, extra = {}): RenderCheck {
  return { rule, passed: false, target, message, ...extra };
}

// Teks di atas foto yang menimpa objek, wajah, atau tekstur ramai (catatan pemilik T-140) tidak
// selalu gagal kontras, jadi variasi latarnya diukur terpisah.
function busyChecks(m: Measurements, busy: SampledBusy, limit: number): RenderCheck[] {
  return m.texts.flatMap((text) => {
    // Kata raksasa sengaja mengunci dengan subjek (K3) dan tetap terbaca karena ukurannya; teks
    // di atas bentuk atau panel (kaca) tidak langsung menimpa foto.
    if (text.fontSize >= DISPLAY_SIZE) return [];
    if (!text.backgrounds.some((b) => b.kind === "image" && b.photo)) return [];
    const measured = busy.get(text.id);
    if (measured === undefined || measured <= limit) return [];
    return [
      fail(
        "busy-background",
        targetOf(text),
        `Teks menimpa area foto yang ramai (variasi ${Math.round(measured)}, maksimal ${limit}): pindahkan teks ke area tenang atau buat ulang foto dengan area polos di balik teks`,
        { measured: Math.round(measured), threshold: limit },
      ),
    ];
  });
}

function contrastChecks(m: Measurements, sampled: SampledContrast): RenderCheck[] {
  return m.texts.flatMap((text) => {
    const color = parseColor(text.color);
    if (!color)
      return [fail("contrast", targetOf(text), `Warna teks tidak terbaca: ${text.color}`)];
    const ratios = text.backgrounds.flatMap((background) => {
      if (background.kind === "image")
        return sampled.has(text.id) ? [sampled.get(text.id) ?? 0] : [];
      const bg = parseColor(background.color);
      return bg ? [contrastRatio(luminance(color), luminance(bg))] : [];
    });
    if (ratios.length === 0) return [];
    const measured = round(Math.min(...ratios));
    const threshold = text.fontSize >= LARGE_TEXT ? 3 : 4.5;
    if (measured >= threshold) return [];
    const overImage = text.backgrounds.some((b) => b.kind === "image") ? " di atas foto" : "";
    return [
      fail(
        "contrast",
        targetOf(text),
        `Kontras teks${overImage} ${measured}:1, minimal ${threshold}:1`,
        {
          measured,
          threshold,
        },
      ),
    ];
  });
}

const intersects = (a: Rect, b: Rect) =>
  Math.min(a.right, b.right) - Math.max(a.left, b.left) > TOLERANCE &&
  Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > TOLERANCE;

// Overflow (ARCH 7.2): luber horizontal, baris keluar kanvas, atau slot saling bertabrakan.
function overflowChecks(m: Measurements): RenderCheck[] {
  const { width, height } = m.canvas;
  const checks = m.texts.flatMap((text) => {
    const out: RenderCheck[] = [];
    if (text.clientWidth > 0 && text.scrollWidth > text.clientWidth + 1) {
      out.push(fail("overflow", targetOf(text), "Teks lebih lebar dari kotaknya"));
    }
    const outside = text.lines.some(
      (line) =>
        line.left < -TOLERANCE ||
        line.top < -TOLERANCE ||
        line.right > width + TOLERANCE ||
        line.bottom > height + TOLERANCE,
    );
    if (outside) out.push(fail("overflow", targetOf(text), "Teks terpotong di tepi postingan"));
    return out;
  });
  const solid = m.slots.filter((s) => s.type !== "image");
  solid.forEach((a, i) => {
    for (const b of solid.slice(i + 1)) {
      if (intersects(a.rect, b.rect)) {
        checks.push(fail("overflow", `${a.slot}+${b.slot}`, `Slot ${a.slot} menabrak ${b.slot}`));
      }
    }
  });
  return checks;
}

function safeMarginChecks(m: Measurements, margin: number): RenderCheck[] {
  const { width, height } = m.canvas;
  return m.slots
    .filter((s) => s.type !== "image")
    .flatMap(({ slot, rect }) => {
      const measured = round(
        Math.min(rect.left, rect.top, width - rect.right, height - rect.bottom),
      );
      if (measured >= margin - TOLERANCE) return [];
      const message = `Slot ${slot} ${measured} px dari tepi, minimal ${margin} px`;
      return [fail("safe-margin", slot, message, { measured, threshold: margin })];
    });
}

function fontSizeChecks(m: Measurements): RenderCheck[] {
  return m.texts
    .filter((text) => text.fontSize < MIN_FONT_SIZE)
    .map((text) =>
      fail(
        "font-size",
        targetOf(text),
        `Ukuran font ${text.fontSize} px, minimal ${MIN_FONT_SIZE} px`,
        {
          measured: text.fontSize,
          threshold: MIN_FONT_SIZE,
        },
      ),
    );
}

const firstFamily = (fontFamily: string) =>
  (fontFamily.split(",")[0] ?? "").trim().replace(/^["']|["']$/g, "");

// Font brand: semua glyph dari @font-face (CDP), family dan bobot sesuai peran Brand Kit.
// Glyph emoji boleh memakai font emoji sistem; jumlahnya diatur aturan emoji-hashtag.
function brandFontChecks(m: Measurements, brand: BrandKit): RenderCheck[] {
  const { heading, body, accent } = brand.typography;
  const roles = [heading, body, ...(accent ? [accent] : [])];
  return m.texts.flatMap((text) => {
    const out: RenderCheck[] = [];
    const hasEmoji = countEmoji(text.text) > 0;
    for (const font of text.platformFonts) {
      if (font.custom || (hasEmoji && /emoji/i.test(font.family))) continue;
      out.push(
        fail(
          "brand-font",
          targetOf(text),
          `${font.glyphs} glyph memakai font cadangan ${font.family}`,
        ),
      );
    }
    const family = firstFamily(text.fontFamily);
    const matching = roles.filter((role) => role.family === family);
    if (matching.length === 0) {
      out.push(fail("brand-font", targetOf(text), `Font ${family} bukan font Brand Kit`));
    } else if (!matching.some((role) => role.weights.includes(text.fontWeight))) {
      const allowed = matching.flatMap((role) => role.weights).join(", ");
      out.push(
        fail(
          "brand-font",
          targetOf(text),
          `Bobot ${text.fontWeight} tidak diizinkan untuk ${family} (${allowed})`,
        ),
      );
    }
    return out;
  });
}

// Tint turunan token (keputusan pemilik T-128): latar dan border boleh berupa campuran dua warna
// palet (`color-mix`), yaitu titik pada garis RGB di antara keduanya dengan toleransi pembulatan.
const MIX_TOLERANCE = 2.5;

function isPaletteMix(c: Rgba, palette: Rgba[]): boolean {
  return palette.some((a, i) =>
    palette.slice(i + 1).some((b) => {
      const d = [b.r - a.r, b.g - a.g, b.b - a.b];
      const v = [c.r - a.r, c.g - a.g, c.b - a.b];
      const length = d.reduce((sum, x) => sum + x * x, 0);
      if (length === 0) return false;
      const t = Math.min(
        Math.max(v.reduce((sum, x, k) => sum + x * (d[k] ?? 0), 0) / length, 0),
        1,
      );
      const distance = Math.hypot(...v.map((x, k) => x - t * (d[k] ?? 0)));
      return distance <= MIX_TOLERANCE;
    }),
  );
}

function brandColorChecks(m: Measurements, brand: BrandKit): RenderCheck[] {
  const { primary, secondary, accent, neutral } = brand.colors;
  const key = ({ r, g, b }: Rgba) => `${r},${g},${b}`;
  const colors = [primary, secondary, accent, ...Object.values(neutral)].flatMap((hex) => {
    const color = parseColor(hex);
    return color ? [color] : [];
  });
  const palette = new Set(colors.map(key));
  const used = [
    ...m.texts.map((text) => ({
      kind: "text" as const,
      color: text.color,
      target: targetOf(text),
    })),
    ...m.colors,
  ];
  const seen = new Set<string>();
  return used.flatMap(({ kind, color, target }) => {
    const parsed = parseColor(color);
    if (parsed?.a === 0) return [];
    const id = `${target}|${color}`;
    if ((parsed && palette.has(key(parsed))) || seen.has(id)) return [];
    if (parsed && kind !== "text" && isPaletteMix(parsed, colors)) return [];
    seen.add(id);
    return [fail("brand-color", target, `Warna ${color} tidak ada di palet Brand Kit`)];
  });
}

function copyRuleChecks(m: Measurements, guide: CopyGuide): RenderCheck[] {
  const checks = m.texts.flatMap((text) => {
    const out = forbiddenWordsIn(text.text, guide.forbiddenWords).map((word) =>
      fail("forbidden-word", targetOf(text), `Kata terlarang "${word}"`),
    );
    if (hashtagPattern.test(text.text)) {
      out.push(
        fail(
          "emoji-hashtag",
          targetOf(text),
          "Hashtag tidak boleh di gambar, tempatnya di caption",
        ),
      );
    }
    return out;
  });
  const emoji = m.texts.reduce((total, text) => total + countEmoji(text.text), 0);
  const limit = guide.emoji.allowed ? guide.emoji.max : 0;
  if (emoji > limit) {
    checks.push(
      fail("emoji-hashtag", "slide", `${emoji} emoji di gambar, maksimal ${limit}`, {
        measured: emoji,
        threshold: limit,
      }),
    );
  }
  return checks;
}

function assetChecks(m: Measurements): RenderCheck[] {
  return [
    ...m.brokenImages.map((src) => fail("asset-load", src, "Gambar gagal dimuat")),
    ...m.fontFaces
      .filter((face) => face.status === "error")
      .map((face) => fail("asset-load", face.family, `Font ${face.family} gagal dimuat`)),
  ];
}

// Aturan wajib PRD F9; aturan desain T-130 ada di design.ts.
export const CORE_RULES = [
  "contrast",
  "overflow",
  "safe-margin",
  "font-size",
  "brand-font",
  "brand-color",
  "forbidden-word",
  "emoji-hashtag",
  "asset-load",
  "busy-background",
] as const satisfies readonly RenderRule[];

const PASSED: Record<(typeof CORE_RULES)[number], string> = {
  contrast: "Kontras semua teks cukup",
  overflow: "Tidak ada teks yang luber, terpotong, atau bertabrakan",
  "safe-margin": "Semua elemen penting di dalam safe margin",
  "font-size": `Semua teks minimal ${MIN_FONT_SIZE} px`,
  "brand-font": "Semua teks memakai font dan bobot Brand Kit",
  "brand-color": "Semua warna dari palet Brand Kit",
  "forbidden-word": "Tidak ada kata terlarang",
  "emoji-hashtag": "Emoji dan hashtag sesuai panduan",
  "asset-load": "Semua gambar dan font termuat",
  "busy-background": "Teks di atas foto berada di area yang tenang",
};

// Satu cek gagal per pelanggaran; aturan tanpa pelanggaran menghasilkan satu cek lolos.
export function evaluateQa(
  m: Measurements,
  ctx: QaContext,
  sampled: SampledContrast,
  busy: SampledBusy = new Map(),
): RenderCheck[] {
  const failures = [
    ...contrastChecks(m, sampled),
    ...busyChecks(m, busy, ctx.busyLimit ?? BUSY_LIMIT),
    ...overflowChecks(m),
    ...safeMarginChecks(m, ctx.brand.spacing.safeMargin),
    ...fontSizeChecks(m),
    ...brandFontChecks(m, ctx.brand),
    ...brandColorChecks(m, ctx.brand),
    ...copyRuleChecks(m, ctx.copyGuide),
    ...assetChecks(m),
  ];
  const passed = CORE_RULES.filter((rule) => !failures.some((check) => check.rule === rule)).map(
    (rule): RenderCheck => ({ rule, passed: true, message: PASSED[rule] }),
  );
  return [...failures, ...passed];
}
