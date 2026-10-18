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
  const { heading, body } = brand.typography;
  const declarations = brandVariables(brand).map(([name, value]) => `  ${name}: ${value};`);
  return [
    fontFace(heading, assetBaseUrl),
    fontFace(body, assetBaseUrl),
    `:root {\n${declarations.join("\n")}\n}`,
  ].join("\n\n");
}

function brandVariables(brand: BrandKit): Variable[] {
  const { colors, typography, spacing, shape } = brand;
  const neutrals = Object.entries(colors.neutral).sort(([a], [b]) => Number(a) - Number(b));
  const darkestNeutral = `var(--color-neutral-${neutrals.at(-1)?.[0]})`;
  return [
    ["--color-primary", colors.primary],
    ["--color-secondary", colors.secondary],
    ["--color-accent", colors.accent],
    ...neutrals.map(([key, hex]): Variable => [`--color-neutral-${key}`, hex]),
    ["--font-heading", cssString(typography.heading.family)],
    ["--font-body", cssString(typography.body.family)],
    ...typography.scale.map((size, i): Variable => [`--font-size-${i + 1}`, px(size)]),
    ...SPACE_STEPS.map((step, i): Variable => [`--space-${i + 1}`, px(step * spacing.unit)]),
    ["--space-safe", px(spacing.safeMargin)],
    ["--shape-radius", px(shape.radius)],
    ["--shape-stroke", px(shape.stroke)],
    [
      "--shape-shadow",
      shape.shadow === "soft"
        ? `0 8px 24px color-mix(in srgb, ${darkestNeutral} 16%, transparent)`
        : "none",
    ],
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
