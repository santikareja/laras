import type { AssetManifest, BrandKit, LayoutSpec, SlotValue } from "@laras/shared";
import { brandCss, type ResolvedSlot, type Template } from "@laras/templates";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { JOB_BASE_URL, PROJECT_BASE_URL, SLIDE_SIZE } from "./renderer.ts";

// LayoutSpec → satu dokumen HTML per slide (ARCH 6.2, 7.1).

export type LayoutContext = {
  brand: BrandKit;
  assets: AssetManifest;
  templates: Template[];
};

const BASE_CSS = `html, body { margin: 0; }
body { width: ${SLIDE_SIZE.width}px; height: ${SLIDE_SIZE.height}px; overflow: hidden; }`;

export function renderLayoutHtml(spec: LayoutSpec, context: LayoutContext): string[] {
  const template = context.templates.find((t) => t.meta.id === spec.templateId);
  if (!template) throw new Error(`Template "${spec.templateId}" tidak ditemukan`);
  if (template.meta.format !== spec.format) {
    throw new Error(
      `Template "${spec.templateId}" untuk format ${template.meta.format}, bukan ${spec.format}`,
    );
  }
  const css = brandCss(context.brand, { assetBaseUrl: PROJECT_BASE_URL });
  return spec.slides.map((slide, index) => {
    const slots = Object.fromEntries(
      Object.entries(slide.slots).map(([name, value]) => [name, resolveSlot(value, context)]),
    );
    const props = { slots, options: slide.options, index, total: spec.slides.length };
    const body = renderToStaticMarkup(createElement(template.Slide, props));
    return `<!doctype html><html><head><meta charset="utf-8"><style>\n${css}\n${BASE_CSS}\n</style></head><body>${body}</body></html>`;
  });
}

export function resolveSlot(value: SlotValue, { brand, assets }: LayoutContext): ResolvedSlot {
  switch (value.type) {
    case "text":
    case "badge":
      return value;
    case "image": {
      const asset = assets.assets.find((a) => a.id === value.assetId);
      if (!asset) throw new Error(`Aset "${value.assetId}" tidak ada di manifest`);
      return { type: "image", src: childUrl(JOB_BASE_URL, asset.path) };
    }
    case "logo": {
      const path = brand.logo[value.variant];
      if (!path) throw new Error(`Brand tidak punya logo varian ${value.variant}`);
      return { type: "logo", src: childUrl(PROJECT_BASE_URL, path) };
    }
  }
}

// %2e%2e dibaca URL sebagai "..", jadi hasil resolve dicek tetap di bawah base (KNOWLEDGE).
function childUrl(base: string, path: string): string {
  const url = new URL(path, base).href;
  if (!url.startsWith(base)) throw new Error(`Path keluar dari folder: ${path}`);
  return url;
}
