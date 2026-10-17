// Lint token warna (DESIGN 3, DESIGN 15, ARCH 6.2): menolak literal warna dan kelas
// palet bawaan Tailwind di UI dan template. Dijalankan lewat `pnpm lint`.
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

export type Scope = "ui" | "template";

export type Violation = {
  file: string;
  line: number;
  column: number;
  match: string;
  suggestion: string;
};

const TOKENS_CSS = "apps/desktop/src/styles/tokens.css";
const SCAN_ROOTS = ["apps/desktop/src", "packages/templates"];
const EXTENSIONS = [".ts", ".tsx", ".css"];

const HEX = /(?<![\w&])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/g;
const COLOR_FUNCTION = /(?<![\w.-])(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(/g;
const PALETTE =
  "slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|mauve|olive|mist|taupe";
const UTILITY =
  "bg|text|border(?:-[xytrbl])?|ring(?:-offset)?|outline|fill|stroke|from|via|to|divide|decoration|placeholder|caret|accent|shadow|inset-shadow|inset-ring";
const TAILWIND_PALETTE_CLASS = new RegExp(
  `(?<![\\w-])(?:${UTILITY})-(?:(?:${PALETTE})-(?:50|[1-9]00|950)|white|black)(?![\\w-])`,
  "g",
);

export function scopeOf(file: string): Scope | null {
  if (/\.test\.tsx?$/.test(file) || !EXTENSIONS.some((ext) => file.endsWith(ext))) return null;
  if (file === TOKENS_CSS) return null;
  if (file.startsWith("apps/desktop/src/")) return "ui";
  if (file.startsWith("packages/templates/tokens/")) return null;
  if (file.startsWith("packages/templates/")) return "template";
  return null;
}

export function parseTokenHexes(css: string): Map<string, string[]> {
  const tokens = new Map<string, string[]>();
  for (const [, name, hex] of css.matchAll(/(--[\w-]+):\s*(#[0-9a-fA-F]{3,8})\b/g)) {
    if (!name || !hex) continue;
    const key = hex.toLowerCase();
    const names = tokens.get(key) ?? [];
    if (!names.includes(name)) names.push(name);
    tokens.set(key, names);
  }
  return tokens;
}

function literalSuggestion(literal: string, scope: Scope, tokenHexes: Map<string, string[]>) {
  if (scope === "template") return "pakai token brand var(--color-*) dari brand.json (ARCH 6.1)";
  const names = tokenHexes.get(literal.toLowerCase());
  if (names) return `pakai ${names.map((name) => `var(${name})`).join(" atau ")}`;
  return "pakai token warna DESIGN 3, misalnya var(--text-primary) atau var(--accent)";
}

function classSuggestion(scope: Scope) {
  if (scope === "template") return "pakai token brand var(--color-*) dari brand.json (ARCH 6.1)";
  return "pakai kelas token DESIGN 15, misalnya bg-background, text-foreground, bg-primary";
}

export function lintContent(
  content: string,
  file: string,
  scope: Scope,
  tokenHexes: Map<string, string[]>,
): Violation[] {
  const violations: Violation[] = [];
  content.split("\n").forEach((text, index) => {
    const report = (match: RegExpMatchArray, suggestion: string) =>
      violations.push({
        file,
        line: index + 1,
        column: (match.index ?? 0) + 1,
        match: match[0],
        suggestion,
      });
    for (const m of text.matchAll(HEX)) report(m, literalSuggestion(m[0], scope, tokenHexes));
    for (const m of text.matchAll(COLOR_FUNCTION))
      report(m, literalSuggestion(m[0], scope, tokenHexes));
    for (const m of text.matchAll(TAILWIND_PALETTE_CLASS)) report(m, classSuggestion(scope));
  });
  return violations;
}

function listFiles(dir: string): string[] {
  return readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && !entry.parentPath.includes("node_modules"))
    .map((entry) => join(entry.parentPath, entry.name));
}

export function lintRepository(): Violation[] {
  const tokenHexes = parseTokenHexes(readFileSync(TOKENS_CSS, "utf8"));
  return SCAN_ROOTS.flatMap(listFiles).flatMap((file) => {
    const scope = scopeOf(file);
    return scope ? lintContent(readFileSync(file, "utf8"), file, scope, tokenHexes) : [];
  });
}

function main() {
  const violations = lintRepository();
  for (const v of violations) {
    console.error(`${v.file}:${v.line}:${v.column}  ${v.match} — ${v.suggestion}`);
  }
  if (violations.length > 0) {
    console.error(`\nLint token: ${violations.length} pelanggaran warna di luar token.`);
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
