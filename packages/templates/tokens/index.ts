import type { BrandKit } from "@laras/shared";

// BrandKit → CSS untuk template (ARCH 6.1): @font-face dari file font project dan
// CSS variables di :root. Nama variabel adalah kontrak; daftarnya ada di tabel ARCH 6.1.

const SPACE_STEPS = [1, 2, 3, 4, 6, 8, 12, 16]; // kelipatan spacing.unit, pola skala DESIGN 4
const FONT_FORMATS: Record<string, string> = { woff2: "woff2", otf: "opentype", ttf: "truetype" };

type FontRole = BrandKit["typography"]["heading"];
type Variable = [name: string, value: string];

export type BrandCssOptions = {
  // URL folder project berakhiran "/"; path file di brand.json di-resolve terhadapnya.
  assetBaseUrl: string;
};

export function brandCss(brand: BrandKit, { assetBaseUrl }: BrandCssOptions): string {
  if (!assetBaseUrl.endsWith("/")) throw new Error("assetBaseUrl harus diakhiri /");
  const { heading, body, accent } = brand.typography;
  const declarations = brandVariables(brand).map(([name, value]) => `  ${name}: ${value};`);
  return [
    fontFace(heading, assetBaseUrl),
    fontFace(body, assetBaseUrl),
    ...(accent ? [fontFace(accent, assetBaseUrl)] : []),
    `:root {\n${declarations.join("\n")}\n}`,
  ].join("\n\n");
}

function brandVariables(brand: BrandKit): Variable[] {
  const { colors, typography, spacing, shape } = brand;
  const neutrals = Object.entries(colors.neutral).sort(([a], [b]) => Number(a) - Number(b));
  return [
    ["--color-primary", colors.primary],
    ["--color-secondary", colors.secondary],
    ["--color-accent", colors.accent],
    ...neutrals.map(([key, hex]): Variable => [`--color-neutral-${key}`, hex]),
    // Kunci netral berbeda per brand; template memakai alias terang (kunci terendah) dan gelap.
    ["--color-neutral-light", `var(--color-neutral-${neutrals.at(0)?.[0]})`],
    ["--color-neutral-dark", `var(--color-neutral-${neutrals.at(-1)?.[0]})`],
    ["--font-heading", cssString(typography.heading.family)],
    ["--font-body", cssString(typography.body.family)],
    // Tanpa font aksen, peran aksen jatuh ke font body (T-134).
    ["--font-accent", cssString((typography.accent ?? typography.body).family)],
    ...weightVariables("heading", typography.heading.weights),
    ...weightVariables("body", typography.body.weights),
    ...weightVariables("accent", (typography.accent ?? typography.body).weights),
    ...typography.scale.map((size, i): Variable => [`--font-size-${i + 1}`, px(size)]),
    ...SPACE_STEPS.map((step, i): Variable => [`--space-${i + 1}`, px(step * spacing.unit)]),
    ["--space-safe", px(spacing.safeMargin)],
    ["--shape-radius", px(shape.radius)],
    ["--shape-stroke", px(shape.stroke)],
    [
      "--shape-shadow",
      shape.shadow === "soft"
        ? "0 8px 24px color-mix(in srgb, var(--color-neutral-dark) 16%, transparent)"
        : "none",
    ],
    ...deviceVariables(brand.devices),
  ];
}

const SCRIBBLES = ["arrow", "underline", "circle", "sparkle", "cross"] as const;

// Perangkat grafis brand (T-124) sebagai default primitives. Tanpa `devices` nilainya sama dengan
// bawaan primitives sebelumnya: sorot aksen miring -2°, stiker tegak, semua coretan dan selotip.
function deviceVariables(devices: BrandKit["devices"]): Variable[] {
  const highlight = devices?.highlight ?? { background: "accent", color: "neutral-dark", tilt: -2 };
  const scribbles = devices?.scribbles ?? SCRIBBLES;
  return [
    ["--device-highlight-bg", `var(--color-${highlight.background})`],
    ["--device-highlight-text", `var(--color-${highlight.color})`],
    ["--device-highlight-tilt", `${highlight.tilt}deg`],
    ["--device-sticker-rotate", `${devices?.sticker?.rotate ?? 0}deg`],
    ...SCRIBBLES.map(
      (shape): Variable => [
        `--device-scribble-${shape}`,
        scribbles.includes(shape) ? "block" : "none",
      ],
    ),
    ["--device-tape", devices?.tape === false ? "none" : "block"],
  ];
}

// Bobot eksplisit dari daftar yang diizinkan, agar browser tidak memakai bobot bawaan elemen
// (mis. <h1> = 700) yang memicu tebal palsu pada font yang hanya punya satu bobot.
function weightVariables(role: "heading" | "body" | "accent", weights: number[]): Variable[] {
  return [
    [`--font-${role}-weight`, `${Math.min(...weights)}`],
    [`--font-${role}-weight-strong`, `${Math.max(...weights)}`],
  ];
}

function fontFace(role: FontRole, assetBaseUrl: string): string {
  const url = new URL(role.file, assetBaseUrl).href;
  // %2e%2e di path dibaca URL sebagai "..", jadi cek hasil resolve, bukan hanya teks path.
  if (!url.startsWith(new URL(assetBaseUrl).href)) {
    throw new Error(`File font berada di luar folder project: ${role.file}`);
  }
  const extension = role.file.slice(role.file.lastIndexOf(".") + 1).toLowerCase();
  const format = FONT_FORMATS[extension];
  if (!format) throw new Error(`Format font tidak dikenal: ${role.file}`);
  const lightest = Math.min(...role.weights);
  const boldest = Math.max(...role.weights);
  const weight = lightest === boldest ? `${lightest}` : `${lightest} ${boldest}`;
  return [
    "@font-face {",
    `  font-family: ${cssString(role.family)};`,
    `  src: url(${cssString(url)}) format("${format}");`,
    `  font-weight: ${weight};`,
    "  font-display: block;",
    "}",
  ].join("\n");
}

// Nama family berasal dari data pengguna: escape agar tidak bisa keluar dari string CSS
// maupun dari elemen <style> tempat CSS ini disisipkan.
function cssString(value: string): string {
  const escapeChar = (char: string) => {
    const code = char.codePointAt(0) ?? 0;
    if (code < 0x20 || code === 0x7f || char === "<") return `\\${code.toString(16)} `;
    return char === '"' || char === "\\" ? `\\${char}` : char;
  };
  return `"${Array.from(value, escapeChar).join("")}"`;
}

function px(value: number): string {
  return `${value}px`;
}
