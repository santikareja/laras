// Render spesimen brand dan semua template × tiga brand fixture ke out/demo (CLAUDE.md, ARCH 10).
// Dijalankan lewat `pnpm render:demo` (tsx, karena template berupa JSX).
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { BrandKit, LayoutSpec } from "../packages/shared/src/index.ts";
import { renderLayoutHtml } from "../packages/sidecar/src/render/layout.ts";
import { toMaster, toUpload } from "../packages/sidecar/src/render/postprocess.ts";
import { createRenderer } from "../packages/sidecar/src/render/renderer.ts";
import { specimen, type Template, templates } from "../packages/templates/src/index.ts";

const BRANDS = ["kopi-lembayung", "seruni-skin", "ritme-run-club"];
const OUT_DIR = resolve("out/demo");

// Isi contoh per template. Setiap template baru wajib menambahkan isinya di sini.
const DEMO_SLIDES: Record<string, (brand: BrandKit, name: string) => LayoutSpec["slides"]> = {
  specimen: (brand, name) => [
    {
      slots: {
        badge: { type: "badge", value: "Spesimen brand" },
        title: { type: "text", value: name },
        body: {
          type: "text",
          value: `${brand.typography.heading.family} untuk judul, ${brand.typography.body.family} untuk isi.`,
        },
        logo: { type: "logo", variant: "primary" },
      },
      options: {},
    },
  ],
};

const titleCase = (slug: string) =>
  slug.replace(
    /(^|-)(\w)/g,
    (_, dash: string, char: string) => `${dash ? " " : ""}${char.toUpperCase()}`,
  );

async function main() {
  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });
  const renderer = createRenderer();
  try {
    const catalog: Template[] = [specimen, ...templates];
    for (const template of catalog) {
      const demoSlides = DEMO_SLIDES[template.meta.id];
      if (!demoSlides) throw new Error(`Template "${template.meta.id}" belum punya isi demo`);
      for (const slug of BRANDS) {
        const projectDir = resolve("fixtures/brands", slug);
        const brand = BrandKit.parse(
          JSON.parse(await readFile(join(projectDir, "brand.json"), "utf8")),
        );
        const spec = LayoutSpec.parse({
          templateId: template.meta.id,
          format: template.meta.format,
          slides: demoSlides(brand, titleCase(slug)),
          assetRequests: [],
        });
        const pages = renderLayoutHtml(spec, { brand, assets: { assets: [] }, templates: catalog });
        for (const [index, html] of pages.entries()) {
          const name = `${template.meta.id}-${slug}-${index + 1}`;
          const master = await toMaster(
            await renderer.render(html, { projectDir, jobDir: OUT_DIR }),
          );
          await writeFile(join(OUT_DIR, `${name}.png`), master);
          await writeFile(join(OUT_DIR, `${name}-1080.png`), await toUpload(master, "png"));
          console.log(`out/demo/${name}.png`);
        }
      }
    }
  } finally {
    await renderer.close();
  }
}

await main();
