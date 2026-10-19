// Render spesimen brand, semua template katalog, dan arketipe × tiga brand fixture ke out/demo
// (CLAUDE.md, ARCH 10), sekaligus menjalankan QA deterministik dan mencetak cek yang gagal.
// Dijalankan lewat `pnpm render:demo` (tsx, karena template berupa JSX).
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { renderLayoutHtml } from "../packages/sidecar/src/render/layout.ts";
import { toMaster, toUpload } from "../packages/sidecar/src/render/postprocess.ts";
import { createRenderer } from "../packages/sidecar/src/render/renderer.ts";
import { archetypes, specimen, type Template, templates } from "../packages/templates/src/index.ts";
import { archetypeCase, hasArchetypeCase } from "./archetype-content.ts";
import { BRANDS, demoBrand, demoCases } from "./demo-content.ts";

const OUT_DIR = resolve("out/demo");

async function main() {
  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });
  const renderer = createRenderer();
  let failed = 0;
  const report = async (name: string, html: string, slug: (typeof BRANDS)[number]) => {
    const { folders, qa } = demoBrand(slug);
    const { png, checks } = await renderer.render(html, folders, qa);
    const master = await toMaster(png);
    await writeFile(join(OUT_DIR, `${name}.png`), master);
    await writeFile(join(OUT_DIR, `${name}-1080.png`), await toUpload(master, "png"));
    const failures = checks.filter((check) => !check.passed);
    failed += failures.length;
    console.log(`out/demo/${name}.png ${failures.length === 0 ? "QA lolos" : "QA GAGAL"}`);
    for (const check of failures)
      console.log(`  - ${check.rule} ${check.target}: ${check.message}`);
  };
  try {
    const catalog: Template[] = [specimen, ...templates];
    for (const template of catalog) {
      for (const slug of BRANDS) {
        const { qa } = demoBrand(slug);
        for (const { variant, spec, assets } of demoCases(template, slug, qa.brand)) {
          const pages = renderLayoutHtml(spec, { brand: qa.brand, assets, templates: catalog });
          for (const [index, html] of pages.entries()) {
            await report(`${template.meta.id}-${slug}-${variant}-${index + 1}`, html, slug);
          }
        }
      }
    }
    for (const template of archetypes) {
      for (const slug of BRANDS) {
        if (!hasArchetypeCase(template, slug)) continue;
        const { folders, qa } = demoBrand(slug);
        const { spec, assets } = await archetypeCase(template, slug, folders.jobDir);
        const pages = renderLayoutHtml(spec, { brand: qa.brand, assets, templates: archetypes });
        for (const [index, html] of pages.entries()) {
          await report(`${template.meta.id}-${slug}-${index + 1}`, html, slug);
        }
      }
    }
  } finally {
    await renderer.close();
  }
  if (failed > 0) {
    console.log(`${failed} cek QA gagal`);
    process.exitCode = 1;
  }
}

await main();
