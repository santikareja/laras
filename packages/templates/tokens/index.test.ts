import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { BrandKit } from "@laras/shared";
import { describe, expect, it } from "vitest";
import { brandCss } from "./index.ts";

const BRANDS_DIR = new URL("../../../fixtures/brands/", import.meta.url);
const SLUGS = ["kopi-lembayung", "seruni-skin", "ritme-run-club"];

const loadBrand = (slug: string): BrandKit =>
  BrandKit.parse(JSON.parse(readFileSync(new URL(`${slug}/brand.json`, BRANDS_DIR), "utf8")));
const fontUrls = (css: string) => [...css.matchAll(/url\("([^"]+)"\)/g)].map((m) => m[1] ?? "");

describe("brandCss", () => {
  it.each(SLUGS)("CSS %s sesuai snapshot", (slug) => {
    const css = brandCss(loadBrand(slug), { assetBaseUrl: `file:///projects/${slug}/` });
    expect(css).toMatchSnapshot();
  });

  it.each(SLUGS)("URL font %s menunjuk file yang ada di folder fixture", (slug) => {
    const assetBaseUrl = new URL(`${slug}/`, BRANDS_DIR).href;
    const urls = fontUrls(brandCss(loadBrand(slug), { assetBaseUrl }));
    expect(urls).toHaveLength(3);
    for (const url of urls) expect(existsSync(fileURLToPath(url))).toBe(true);
  });

  it("font aksen opsional: tanpa font aksen, peran aksen memakai font body (T-134)", () => {
    const brand = loadBrand("kopi-lembayung");
    const withAccent = brandCss(brand, { assetBaseUrl: "file:///p/" });
    expect(withAccent).toContain('--font-accent: "Courier Prime";');
    expect(withAccent).toContain("--font-accent-weight: 700;");
    delete brand.typography.accent;
    const css = brandCss(brand, { assetBaseUrl: "file:///p/" });
    expect(fontUrls(css)).toHaveLength(2);
    expect(css).toContain('--font-accent: "Inter";');
    expect(css).toContain("--font-accent-weight: 400;");
    expect(css).toContain("--font-accent-weight-strong: 600;");
  });

  it("perangkat grafis brand: token --device-*, tanpa devices sama dengan bawaan lama (T-124)", () => {
    const brand = loadBrand("seruni-skin");
    const css = brandCss(brand, { assetBaseUrl: "file:///p/" });
    expect(css).toContain("--device-highlight-tilt: 0deg;");
    expect(css).toContain("--device-scribble-arrow: none;");
    expect(css).toContain("--device-tape: none;");
    delete brand.devices;
    const plain = brandCss(brand, { assetBaseUrl: "file:///p/" });
    expect(plain).toContain("--device-highlight-bg: var(--color-accent);");
    expect(plain).toContain("--device-highlight-tilt: -2deg;");
    expect(plain).toContain("--device-sticker-rotate: 0deg;");
    expect(plain).toContain("--device-scribble-cross: block;");
    expect(plain).toContain("--device-tape: block;");
  });

  it("meng-encode spasi di folder project", () => {
    const css = brandCss(loadBrand("kopi-lembayung"), {
      assetBaseUrl: "file:///Users/a/Library/Application Support/Laras/p/",
    });
    expect(fontUrls(css)[0]).toBe(
      "file:///Users/a/Library/Application%20Support/Laras/p/fonts/fraunces-latin-wght-normal.woff2",
    );
  });

  it("memetakan ekstensi OTF dan TTF ke format CSS", () => {
    const brand = loadBrand("kopi-lembayung");
    brand.typography.heading.file = "fonts/Display.OTF";
    brand.typography.body.file = "fonts/Sans.ttf";
    const css = brandCss(brand, { assetBaseUrl: "file:///p/" });
    expect(css).toContain('Display.OTF") format("opentype")');
    expect(css).toContain('Sans.ttf") format("truetype")');
  });

  it("meng-escape nama family agar tidak keluar dari string CSS maupun elemen <style>", () => {
    const brand = loadBrand("kopi-lembayung");
    brand.typography.heading.family = 'Evil"; } </style><script>\\';
    const css = brandCss(brand, { assetBaseUrl: "file:///p/" });
    expect(css).not.toContain("</style>");
    expect(css).toContain('font-family: "Evil\\"; } \\3c /style>\\3c script>\\\\";');
  });

  it("menolak base URL tanpa / dan file font di luar folder project", () => {
    const brand = loadBrand("kopi-lembayung");
    expect(() => brandCss(brand, { assetBaseUrl: "file:///p" })).toThrow("diakhiri /");
    brand.typography.body.file = "fonts/%2e%2e/%2e%2e/rahasia.woff2";
    expect(() => brandCss(brand, { assetBaseUrl: "file:///p/q/" })).toThrow("di luar folder");
  });
});
