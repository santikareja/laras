// Render spesimen brand dan arketipe katalog (isi contoh dan maks) × tiga brand fixture ke out/demo
// (CLAUDE.md, ARCH 10), sekaligus menjalankan QA deterministik dan mencetak cek yang gagal.
// Dijalankan lewat `pnpm render:demo` (tsx, karena template berupa JSX).
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { renderLayoutHtml } from "../packages/sidecar/src/render/layout.ts";
import { toMaster, toUpload } from "../packages/sidecar/src/render/postprocess.ts";
import { createRenderer } from "../packages/sidecar/src/render/renderer.ts";
import { specimen, templates } from "../packages/templates/src/index.ts";
import { archetypeCase, hasArchetypeCase } from "./archetype-content.ts";
import { BRANDS, demoBrand, demoCases } from "./demo-content.ts";
import { printChecks } from "./qa-print.ts";

const OUT_DIR = resolve("out/demo");

async function main() {
  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });
  const renderer = createRenderer();
  let failed = 0;
  let advice = 0;
  const report = async (name: string, html: string, slug: (typeof BRANDS)[number]) => {
    const { folders, qa } = demoBrand(slug);
    const { png, checks } = await renderer.render(html, folders, qa);
    const master = await toMaster(png);
    await writeFile(join(OUT_DIR, `${name}.png`), master);
    await writeFile(join(OUT_DIR, `${name}-1080.png`), await toUpload(master, "png"));
    const result = printChecks(`out/demo/${name}.png`, checks);
    failed += result.blocking;
    advice += result.advice;
  };
  try {
    for (const slug of BRANDS) {
      const { qa } = demoBrand(slug);
      for (const { variant, spec, assets } of demoCases(specimen, slug, qa.brand)) {
        const pages = renderLayoutHtml(spec, { brand: qa.brand, assets, templates: [specimen] });
        for (const [index, html] of pages.entries()) {
          await report(`${specimen.meta.id}-${slug}-${variant}-${index + 1}`, html, slug);
        }
      }
    }
    // Arketipe = katalog Claude (T-131): isi contoh dan varian maks (setiap slot sampai maxChars).
    for (const template of templates) {
      for (const slug of BRANDS) {
        if (!hasArchetypeCase(template, slug)) continue;
        const { folders, qa } = demoBrand(slug);
        for (const max of [false, true]) {
          const { spec, assets } = await archetypeCase(template, slug, folders.jobDir, max);
          const pages = renderLayoutHtml(spec, { brand: qa.brand, assets, templates });
          for (const [index, html] of pages.entries()) {
            await report(
              `${template.meta.id}-${slug}${max ? "-maks" : ""}-${index + 1}`,
              html,
              slug,
            );
          }
        }
      }
    }
  } finally {
    await renderer.close();
  }
  if (advice > 0) console.log(`${advice} saran desain (tidak menggagalkan, T-130)`);
  if (failed > 0) {
    console.log(`${failed} cek QA gagal`);
    process.exitCode = 1;
  }
}

await main();
