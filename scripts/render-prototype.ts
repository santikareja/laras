// Render prototipe arketipe T-122 × tiga brand fixture ke out/prototype. QA deterministik
// dicetak sebagai informasi saja: QA belum memahami lapisan seperti teks di belakang subjek
// (T-123), jadi skrip tidak gagal karena QA. Dijalankan lewat `pnpm render:prototype`.
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { renderLayoutHtml } from "../packages/sidecar/src/render/layout.ts";
import { toMaster, toUpload } from "../packages/sidecar/src/render/postprocess.ts";
import { createRenderer } from "../packages/sidecar/src/render/renderer.ts";
import { prototypes } from "../packages/templates/src/index.ts";
import { BRANDS, demoBrand } from "./demo-content.ts";
import { prototypeCase } from "./prototype-content.ts";

const OUT_DIR = resolve("out/prototype");

async function main() {
  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });
  const renderer = createRenderer();
  try {
    for (const template of prototypes) {
      for (const slug of BRANDS) {
        const { folders, qa } = demoBrand(slug);
        const { spec, assets } = prototypeCase(template, slug);
        const pages = renderLayoutHtml(spec, { brand: qa.brand, assets, templates: prototypes });
        for (const [index, html] of pages.entries()) {
          const name = `${template.meta.id}-${slug}-${index + 1}`;
          const { png, checks } = await renderer.render(html, folders, qa);
          const master = await toMaster(png);
          await writeFile(join(OUT_DIR, `${name}.png`), master);
          await writeFile(join(OUT_DIR, `${name}-1080.png`), await toUpload(master, "png"));
          const failures = checks.filter((check) => !check.passed);
          console.log(`out/prototype/${name}.png QA ${failures.length === 0 ? "lolos" : "gagal"}`);
          for (const check of failures)
            console.log(`  - ${check.rule} ${check.target}: ${check.message}`);
        }
      }
    }
  } finally {
    await renderer.close();
  }
}

await main();
