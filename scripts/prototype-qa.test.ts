import { existsSync } from "node:fs";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { renderLayoutHtml } from "../packages/sidecar/src/render/layout.ts";
import { createRenderer } from "../packages/sidecar/src/render/renderer.ts";
import { prototypes } from "../packages/templates/src/index.ts";
import { BRANDS, demoBrand } from "./demo-content.ts";
import { prototypeCase } from "./prototype-content.ts";

// Isi prototipe T-122 untuk ketiga brand: aset ada, LayoutSpec cocok dengan meta, dan
// QA deterministik lolos, agar perbaikan berikutnya tidak diam-diam merusak arketipe.
const renderer = createRenderer();
afterAll(() => renderer.close());

describe.each(prototypes.map((t) => [t.meta.id, t] as const))("prototipe %s", (_, template) => {
  it.each(BRANDS)("lolos QA untuk %s", { timeout: 60_000 }, async (slug) => {
    const { folders, qa } = demoBrand(slug);
    const { spec, assets } = prototypeCase(template, slug);
    for (const asset of assets.assets)
      expect(existsSync(join(folders.jobDir, asset.path))).toBe(true);
    const failures: string[] = [];
    for (const html of renderLayoutHtml(spec, { brand: qa.brand, assets, templates: prototypes })) {
      const { checks } = await renderer.render(html, folders, qa);
      for (const check of checks.filter((c) => !c.passed)) {
        failures.push(`${check.rule} ${check.target} ${check.message}`);
      }
    }
    expect(failures).toEqual([]);
  });
});
