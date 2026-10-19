import { readFileSync } from "node:fs";
import { BrandKit, resolveStyleChoice } from "@laras/shared";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { styles } from "./index.ts";
import { StyleBackdrop, StyleOverlay, styleCss, styleRender, styleTreatment } from "./layer.tsx";

// Lapisan gaya (T-132): setiap gaya punya render, tanpa gaya tidak ada yang berubah.

const brand = (slug: string) =>
  BrandKit.parse(
    JSON.parse(
      readFileSync(new URL(`../../../fixtures/brands/${slug}/brand.json`, import.meta.url), "utf8"),
    ),
  );

describe("lapisan gaya", () => {
  it("tanpa gaya: tanpa lapisan dan foto natural", () => {
    expect(renderToStaticMarkup(<StyleBackdrop />)).toBe("");
    expect(renderToStaticMarkup(<StyleOverlay />)).toBe("");
    expect(styleTreatment(undefined)).toEqual({ kind: "natural" });
  });

  it.each(styles.map((s) => [s.id, s] as const))("%s: punya render dan CSS sah", (_, meta) => {
    const choice = resolveStyleChoice(
      { id: meta.id, variant: meta.variants[0]?.id ?? "", options: {} },
      meta,
    );
    expect(() => styleRender(meta.id)).not.toThrow();
    const css = styleCss(meta, choice, brand("seruni-skin"));
    expect(css).toMatch(/^:root \{\n/);
    expect(css).toContain("--style-heading-tracking:");
    expect(() => renderToStaticMarkup(<StyleBackdrop style={choice} />)).not.toThrow();
    expect(() => renderToStaticMarkup(<StyleOverlay style={choice} />)).not.toThrow();
  });

  it("pil hanya bila radius brand ≥ 16 px; huruf kapital dari gaya", () => {
    const meta = styles.find((s) => s.id === "glassmorphism-neumorphism");
    if (!meta) throw new Error("gaya tidak ada");
    const choice = resolveStyleChoice({ id: meta.id, variant: "kaca", options: {} }, meta);
    expect(styleCss(meta, choice, brand("seruni-skin"))).toContain("--radius-pill: 999px;");
    expect(styleCss(meta, choice, brand("kopi-lembayung"))).toContain(
      "--radius-pill: var(--shape-radius);",
    );
    expect(styleCss(meta, choice, brand("kopi-lembayung"))).toContain(
      "--style-heading-transform: none;",
    );
  });

  it("opsi foto menentukan perlakuan", () => {
    const meta = styles.find((s) => s.id === "brutalism");
    if (!meta) throw new Error("gaya tidak ada");
    const pick = (foto: string) =>
      styleTreatment(
        resolveStyleChoice({ id: meta.id, variant: "cetak", options: { foto } }, meta),
      );
    expect(pick("mono")).toEqual({ kind: "mono" });
    expect(pick("natural")).toEqual({ kind: "natural" });
    expect(pick("halftone")).toMatchObject({ kind: "halftone", ink: "neutral-dark" });
  });
});
