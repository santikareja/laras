import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { lintContent, lintRepository, parseTokenHexes, scopeOf } from "./lint-tokens.ts";

const tokenHexes = parseTokenHexes(readFileSync("apps/desktop/src/styles/tokens.css", "utf8"));
const lintUi = (content: string) =>
  lintContent(content, "apps/desktop/src/x.tsx", "ui", tokenHexes);

describe("scopeOf", () => {
  it("memeriksa UI dan template", () => {
    expect(scopeOf("apps/desktop/src/app/App.tsx")).toBe("ui");
    expect(scopeOf("apps/desktop/src/styles/global.css")).toBe("ui");
    expect(scopeOf("packages/templates/feed/Hero.tsx")).toBe("template");
  });

  it("melewati sumber token, file test, dan file non-kode", () => {
    expect(scopeOf("apps/desktop/src/styles/tokens.css")).toBeNull();
    expect(scopeOf("packages/templates/tokens/brandToCss.ts")).toBeNull();
    expect(scopeOf("apps/desktop/src/app/App.test.tsx")).toBeNull();
    expect(scopeOf("apps/desktop/src/assets/logo.svg")).toBeNull();
    expect(scopeOf("packages/sidecar/src/index.ts")).toBeNull();
  });
});

describe("lintContent", () => {
  it("menolak hex dan menyebut token pengganti yang nilainya sama", () => {
    const [v] = lintUi('const style = { color: "#8C6420" };');
    expect(v).toMatchObject({ line: 1, column: 25, match: "#8C6420" });
    expect(v?.suggestion).toContain("var(--accent)");
  });

  it("menolak hex tanpa padanan token dengan saran umum", () => {
    const [v] = lintUi('<div className="bg-[#123abc]" />');
    expect(v?.match).toBe("#123abc");
    expect(v?.suggestion).toContain("DESIGN 3");
  });

  it("menolak fungsi warna CSS", () => {
    const css =
      ".a { color: rgb(0 0 0); background: oklch(0.7 0.1 80); border-color: hsla(0, 0%, 0%, 0.5); }";
    expect(lintUi(css).map((v) => v.match)).toEqual(["rgb(", "oklch(", "hsla("]);
  });

  it("menolak kelas palet bawaan Tailwind, termasuk varian dan opacity", () => {
    const tsx = '<p className="bg-blue-500 hover:text-white border-x-zinc-200 ring-red-950/50" />';
    expect(lintUi(tsx).map((v) => v.match)).toEqual([
      "bg-blue-500",
      "text-white",
      "border-x-zinc-200",
      "ring-red-950",
    ]);
  });

  it("melaporkan baris dan kolom yang benar", () => {
    const [v] = lintUi("const a = 1;\nconst b = 2;\n  color: #fff;");
    expect(v).toMatchObject({ line: 3, column: 10, match: "#fff" });
  });

  it("menerima pemakaian token dan teks yang mirip warna", () => {
    const ok = [
      "background: var(--surface-app);",
      '<div className="h-11 bg-primary text-foreground bg-accent" />',
      'document.getElementById("root"); #root { height: 100%; }',
      "<p>Harga &#123;</p>",
      "const background = rgbToHex(value);",
    ].join("\n");
    expect(lintUi(ok)).toEqual([]);
  });

  it("memberi saran token brand untuk template", () => {
    const [v] = lintContent(
      'color: "#0F3D3E"',
      "packages/templates/feed/A.tsx",
      "template",
      tokenHexes,
    );
    expect(v?.suggestion).toContain("var(--color-*)");
  });
});

describe("lintRepository", () => {
  it("repo saat ini bebas pelanggaran", () => {
    expect(lintRepository()).toEqual([]);
  });
});
