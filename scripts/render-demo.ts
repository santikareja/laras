// Render spesimen brand dan semua template × tiga brand fixture ke out/demo (CLAUDE.md, ARCH 10),
// sekaligus menjalankan QA deterministik dan mencetak cek yang gagal.
// Dijalankan lewat `pnpm render:demo` (tsx, karena template berupa JSX).
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { renderLayoutHtml } from "../packages/sidecar/src/render/layout.ts";
import { toMaster, toUpload } from "../packages/sidecar/src/render/postprocess.ts";
import { createRenderer } from "../packages/sidecar/src/render/renderer.ts";
import { specimen, type Template, templates } from "../packages/templates/src/index.ts";
import { BRANDS, demoBrand, demoCases } from "./demo-content.ts";

const OUT_DIR = resolve("out/demo");

async function main() {
  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });
  const renderer = createRenderer();
  let failed = 0;
  try {
    const catalog: Template[] = [specimen, ...templates];
    for (const template of catalog) {
      for (const slug of BRANDS) {
        const { folders, qa } = demoBrand(slug);
        for (const { variant, spec, assets } of demoCases(template, slug, qa.brand)) {
          const pages = renderLayoutHtml(spec, { brand: qa.brand, assets, templates: catalog });
          for (const [index, html] of pages.entries()) {
            const name = `${template.meta.id}-${slug}-${variant}-${index + 1}`;
            const { png, checks } = await renderer.render(html, folders, qa);
            const master = await toMaster(png);
            await writeFile(join(OUT_DIR, `${name}.png`), master);
            await writeFile(join(OUT_DIR, `${name}-1080.png`), await toUpload(master, "png"));
            const failures = checks.filter((check) => !check.passed);
            failed += failures.length;
            console.log(`out/demo/${name}.png ${failures.length === 0 ? "QA lolos" : "QA GAGAL"}`);
            for (const check of failures)
              console.log(`  - ${check.rule} ${check.target}: ${check.message}`);
          }
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
