import { readFileSync } from "node:fs";
import { type AssetManifest, BrandKit, LayoutSpec } from "@laras/shared";
import { specimen } from "@laras/templates";
import { describe, expect, it } from "vitest";
import { type LayoutContext, renderLayoutHtml, resolveSlot } from "./layout.ts";

const BRAND_DIR = new URL("../../../../fixtures/brands/kopi-lembayung/", import.meta.url);
const brand = BrandKit.parse(JSON.parse(readFileSync(new URL("brand.json", BRAND_DIR), "utf8")));
const context: LayoutContext = { brand, assets: { assets: [] }, templates: [specimen] };

const specimenSlide: LayoutSpec["slides"][number] = {
  slots: {
    badge: { type: "badge", value: "Spesimen brand" },
    title: { type: "text", value: "Kopi Lembayung" },
    body: { type: "text", value: "Isi" },
    logo: { type: "logo", variant: "primary" },
  },
  options: {},
};

const layout = (overrides: Partial<LayoutSpec> = {}): LayoutSpec =>
  LayoutSpec.parse({
    templateId: "specimen",
    format: "feed-4x5",
    slides: [specimenSlide],
    assetRequests: [],
    ...overrides,
  });

const withAsset = (path: string): LayoutContext => {
  const assets: AssetManifest = {
    assets: [{ id: "hero", path, width: 1122, height: 1402, source: "codex" }],
  };
  return { ...context, assets };
};

describe("renderLayoutHtml", () => {
  it("menghasilkan satu dokumen HTML per slide dengan CSS brand dan slot terisi", () => {
    const pages = renderLayoutHtml(layout(), context);
    expect(pages).toHaveLength(1);
    const html = pages[0] ?? "";
    expect(html).toMatch(/^<!doctype html>/);
    expect(html).toContain(
      'src: url("http://laras.invalid/project/fonts/fraunces-latin-wght-normal.woff2")',
    );
    expect(html).toContain("width: 1080px; height: 1350px");
    expect(html).toContain(">Kopi Lembayung</h1>");
    expect(html).toContain('src="http://laras.invalid/project/logo/primary.svg"');
  });

  it("menolak template yang tidak dikenal dan format yang tidak cocok", () => {
    expect(() => renderLayoutHtml(layout({ templateId: "tidak-ada" }), context)).toThrow(
      'Template "tidak-ada" tidak ditemukan',
    );
    const carousel = layout({ format: "carousel-4x5", slides: [specimenSlide, specimenSlide] });
    expect(() => renderLayoutHtml(carousel, context)).toThrow(
      "untuk format feed-4x5, bukan carousel-4x5",
    );
  });

  it("gaya menambah variabel CSS gaya; pilihan gaya yang tidak sah ditolak (T-132)", () => {
    const plain = renderLayoutHtml(layout(), context)[0] ?? "";
    expect(plain).not.toContain("--style-heading-transform:");
    const styled =
      renderLayoutHtml(layout(), {
        ...context,
        style: { id: "brutalism", variant: "cetak", options: {} },
      })[0] ?? "";
    expect(styled).toContain("--style-heading-transform: uppercase;");
    // Kopi bersudut 0 px: pil tidak dipakai, radius tetap dari brand.
    expect(styled).toContain("--radius-pill: var(--shape-radius);");
    expect(() =>
      renderLayoutHtml(layout(), {
        ...context,
        style: { id: "brutalism", variant: "neon", options: {} },
      }),
    ).toThrow('Gaya "brutalism" tidak punya varian "neon"');
    expect(() =>
      renderLayoutHtml(layout(), {
        ...context,
        style: { id: "art-deco", variant: "a", options: {} },
      }),
    ).toThrow('Gaya "art-deco" tidak ditemukan');
  });
});

describe("resolveSlot", () => {
  it("meneruskan teks dan meresolve gambar ke folder job", () => {
    expect(resolveSlot({ type: "text", value: "Halo" }, context)).toEqual({
      type: "text",
      value: "Halo",
    });
    expect(resolveSlot({ type: "image", assetId: "hero" }, withAsset("assets/hero.png"))).toEqual({
      type: "image",
      src: "http://laras.invalid/job/assets/hero.png",
    });
  });

  it("meneruskan data subjek cut-out ke template (T-123)", () => {
    const subject = {
      box: { left: 0.1, top: 0.05, right: 0.9, bottom: 1 },
      focus: { x: 0.5, y: 0.2 },
    };
    const base = withAsset("assets/subjek.webp");
    const asset = base.assets.assets[0];
    if (!asset) throw new Error("fixture tanpa aset");
    const withSubject = { ...base, assets: { assets: [{ ...asset, subject }] } };
    expect(resolveSlot({ type: "image", assetId: "hero" }, withSubject)).toEqual({
      type: "image",
      src: "http://laras.invalid/job/assets/subjek.webp",
      subject,
    });
  });

  it("menolak aset yang tidak ada, varian logo yang tidak dimiliki brand, dan path keluar folder", () => {
    expect(() => resolveSlot({ type: "image", assetId: "hero" }, context)).toThrow(
      'Aset "hero" tidak ada di manifest',
    );
    expect(() => resolveSlot({ type: "logo", variant: "onLight" }, context)).toThrow(
      "Brand tidak punya logo varian onLight",
    );
    const escaping = withAsset("assets/%2e%2e/%2e%2e/project/brand.png");
    expect(() => resolveSlot({ type: "image", assetId: "hero" }, escaping)).toThrow(
      "Path keluar dari folder",
    );
  });
});
