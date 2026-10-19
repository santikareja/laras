import { existsSync } from "node:fs";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { isBlocking } from "../packages/shared/src/index.ts";
import { renderLayoutHtml } from "../packages/sidecar/src/render/layout.ts";
import { createRenderer } from "../packages/sidecar/src/render/renderer.ts";
import { archetypes } from "../packages/templates/src/index.ts";
import { archetypeCase, hasArchetypeCase } from "./archetype-content.ts";
import { BRANDS, demoBrand } from "./demo-content.ts";

// Isi demo arketipe untuk ketiga brand: aset ada, LayoutSpec cocok dengan meta, analisis cut-out
// berjalan, dan QA deterministik lolos setelah langkah fit-to-width (T-123).
const renderer = createRenderer();
afterAll(() => renderer.close());

// Isi contoh dan varian maks (setiap slot teks tepat maxChars, T-131).
const cases = archetypes.flatMap((template) =>
  BRANDS.filter((slug) => hasArchetypeCase(template, slug)).flatMap((slug) =>
    [false, true].map(
      (max) => [`${template.meta.id} ${slug}${max ? " maks" : ""}`, template, slug, max] as const,
    ),
  ),
);

describe("arketipe demo", () => {
  it.each(cases)("%s lolos QA", { timeout: 60_000 }, async (_, template, slug, max) => {
    const { folders, qa } = demoBrand(slug);
    const { spec, assets } = await archetypeCase(template, slug, folders.jobDir, max);
    for (const asset of assets.assets)
      expect(existsSync(join(folders.jobDir, asset.path))).toBe(true);
    const failures: string[] = [];
    for (const html of renderLayoutHtml(spec, { brand: qa.brand, assets, templates: archetypes })) {
      const { checks } = await renderer.render(html, folders, qa);
      for (const check of checks.filter(isBlocking)) {
        failures.push(`${check.rule} ${check.target} ${check.message}`);
      }
    }
    expect(failures).toEqual([]);
  });
});
