import { describe, expect, it } from "vitest";
import { styleChoiceIssues } from "../packages/shared/src/index.ts";
import { renderLayoutHtml } from "../packages/sidecar/src/render/layout.ts";
import { styles } from "../packages/templates/src/index.ts";
import { BRANDS, demoBrand } from "./demo-content.ts";
import { STYLE_TEMPLATES, specimenCase, styleCase, stylePatterns } from "./style-content.ts";

// Isi contoh gaya (T-132, T-134): setiap pola khas gaya dan spesimennya untuk ketiga brand,
// pilihan gayanya sah, dan LayoutSpec-nya bisa dirender ke HTML. QA visualnya lewat render:styles.
describe("isi contoh gaya", () => {
  it.each(styles.flatMap((style) => BRANDS.map((slug) => [style.id, slug] as const)))(
    "%s × %s",
    async (id, slug) => {
      const style = styles.find((s) => s.id === id);
      if (!style) throw new Error(id);
      const { folders, qa } = demoBrand(slug);
      const posts = await Promise.all(
        stylePatterns(id).map((pattern) => styleCase(id, pattern.id, slug, folders.jobDir)),
      );
      for (const item of [
        ...posts,
        await specimenCase(id, style.variants[0]?.id ?? "", slug, folders.jobDir),
      ]) {
        expect(styleChoiceIssues(item.style, style)).toEqual([]);
        const pages = renderLayoutHtml(item.spec, {
          brand: qa.brand,
          assets: item.assets,
          templates: STYLE_TEMPLATES,
          style: item.style,
        });
        expect(pages).toHaveLength(1);
      }
    },
  );
});
