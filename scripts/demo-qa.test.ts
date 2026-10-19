import { afterAll, describe, expect, it } from "vitest";
import { isBlocking } from "../packages/shared/src/index.ts";
import { renderLayoutHtml } from "../packages/sidecar/src/render/layout.ts";
import { createRenderer } from "../packages/sidecar/src/render/renderer.ts";
import { specimen, type Template } from "../packages/templates/src/index.ts";
import { BRANDS, demoBrand, demoCases } from "./demo-content.ts";

// Fixture patuh untuk QA deterministik (T-110): spesimen brand untuk ketiga brand lolos semua
// aturan wajib. Arketipe katalog diuji di archetype-qa.test.ts (contoh dan maks).
const catalog: Template[] = [specimen];
const renderer = createRenderer();
afterAll(() => renderer.close());

describe.each(catalog.map((t) => [t.meta.id, t] as const))("QA isi demo %s", (_, template) => {
  it.each(BRANDS)("lolos untuk %s", { timeout: 60_000 }, async (slug) => {
    const { folders, qa } = demoBrand(slug);
    const failures: string[] = [];
    for (const { variant, spec, assets } of demoCases(template, slug, qa.brand)) {
      const pages = renderLayoutHtml(spec, { brand: qa.brand, assets, templates: catalog });
      for (const html of pages) {
        const { checks } = await renderer.render(html, folders, qa);
        for (const check of checks.filter(isBlocking)) {
          failures.push(`${variant}: ${check.rule} ${check.target} ${check.message}`);
        }
      }
    }
    expect(failures).toEqual([]);
  });
});
