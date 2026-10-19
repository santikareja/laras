// Render contoh setiap gaya desain × tiga brand fixture ke out/styles (PRD F16, T-132, T-134):
// postingan setiap pola khas gaya (PNG 1080; thumbnail 360 px dari pola pertama), spesimen perangkat grafis per
// gaya, lembar ringkasan per brand dengan tanda "kurang cocok" dari styleFit, dan index.json.
// QA deterministik dijalankan untuk postingan dan spesimen; keluar dengan kode 1 bila ada yang gagal.
// Dijalankan lewat `pnpm render:styles` (tsx, karena template berupa JSX); `pnpm render:styles --
// <id gaya> …` hanya merender gaya tertentu tanpa menghapus hasil gaya lain.
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { type DesignLimits, designLimits, styleFit } from "../packages/shared/src/index.ts";
import { renderLayoutHtml } from "../packages/sidecar/src/render/layout.ts";
import { toMaster, toThumbnail, toUpload } from "../packages/sidecar/src/render/postprocess.ts";
import { createRenderer, JOB_BASE_URL } from "../packages/sidecar/src/render/renderer.ts";
import { styles } from "../packages/templates/src/index.ts";
import { BRANDS, type Brand, demoBrand } from "./demo-content.ts";
import { printChecks } from "./qa-print.ts";
import { STYLE_TEMPLATES, specimenCase, styleCase, stylePatterns } from "./style-content.ts";

const OUT_DIR = resolve("out/styles");

type Entry = {
  style: string;
  name: string;
  brand: Brand;
  fit: "cocok" | "kurang-cocok";
  reasons: string[];
  files: string[];
  thumb: string;
  specimen: string;
};

async function main() {
  const only = process.argv.slice(2).filter((arg) => arg !== "--");
  const selected = only.length > 0 ? styles.filter((s) => only.includes(s.id)) : styles;
  if (only.length === 0) await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });
  const renderer = createRenderer();
  const entries: Entry[] = [];
  let failed = 0;
  let advice = 0;
  // `design`: ambang aturan desain gaya dan varian (T-130); spesimen tanpa saran desain.
  const report = async (name: string, html: string, slug: Brand, design?: DesignLimits) => {
    const { folders, qa } = demoBrand(slug);
    // Spesimen (tanpa ambang desain) bukan postingan: tanpa cek aturan brand terstruktur (T-124).
    const { png, checks } = await renderer.render(html, folders, {
      ...qa,
      ...(design ? { design } : { brandRules: false }),
    });
    const master = await toMaster(png);
    await writeFile(join(OUT_DIR, `${name}.png`), await toUpload(master, "png"));
    const result = printChecks(`out/styles/${name}.png`, checks, design !== undefined);
    failed += result.blocking;
    advice += result.advice;
    return master;
  };
  try {
    for (const style of selected) {
      for (const slug of BRANDS) {
        const { folders, qa } = demoBrand(slug);
        const name = `${style.id}-${slug}`;
        const files: string[] = [];
        // Semua pola khas gaya (T-134); pola pertama menjadi thumbnail.
        for (const [index, pattern] of stylePatterns(style.id).entries()) {
          const post = await styleCase(style.id, pattern.id, slug, folders.jobDir);
          const [html] = renderLayoutHtml(post.spec, {
            brand: qa.brand,
            assets: post.assets,
            templates: STYLE_TEMPLATES,
            style: post.style,
          });
          if (!html) throw new Error(`Pola ${style.id}/${pattern.id} tanpa slide`);
          const file = `${style.id}-${pattern.id}-${slug}`;
          const master = await report(file, html, slug, designLimits(style, post.style.variant));
          files.push(`${file}.png`);
          if (index === 0) {
            await writeFile(join(OUT_DIR, `${name}-thumb.png`), await toThumbnail(master));
          }
        }

        const specimen = await specimenCase(
          style.id,
          style.variants[0]?.id ?? "",
          slug,
          folders.jobDir,
        );
        const [specimenHtml] = renderLayoutHtml(specimen.spec, {
          brand: qa.brand,
          assets: specimen.assets,
          templates: STYLE_TEMPLATES,
          style: specimen.style,
        });
        if (!specimenHtml) throw new Error(`Spesimen ${style.id} tanpa slide`);
        await report(`perangkat-${name}`, specimenHtml, slug);

        const fit = styleFit(style, qa.brand);
        entries.push({
          style: style.id,
          name: style.name,
          brand: slug,
          ...fit,
          files,
          thumb: `${name}-thumb.png`,
          specimen: `perangkat-${name}.png`,
        });
      }
    }
    for (const slug of only.length > 0 ? [] : BRANDS) {
      const { folders, qa } = demoBrand(slug);
      const html = overviewHtml(entries.filter((e) => e.brand === slug));
      const { png } = await renderer.render(html, { ...folders, jobDir: OUT_DIR }, qa);
      await writeFile(
        join(OUT_DIR, `ringkasan-${slug}.png`),
        await toUpload(await toMaster(png), "png"),
      );
      console.log(`out/styles/ringkasan-${slug}.png`);
    }
    if (only.length === 0) {
      await writeFile(join(OUT_DIR, "index.json"), `${JSON.stringify(entries, null, 2)}\n`);
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

// Lembar ringkasan untuk pemilik: thumbnail ketujuh gaya dengan nama dan tanda kecocokan. Ini alat
// tinjau internal, bukan template, jadi memakai warna sistem netral, bukan token brand.
function overviewHtml(items: Entry[]): string {
  const cards = items
    .map((item) => {
      const mark =
        item.fit === "cocok"
          ? `<p class="ok">Cocok</p>`
          : `<p class="warn">Kurang cocok untuk brand ini</p><p class="why">${item.reasons.map(escapeHtml).join("<br>")}</p>`;
      return `<figure><img src="${JOB_BASE_URL}${item.thumb}"><figcaption><p class="name">${escapeHtml(item.name)}</p>${mark}</figcaption></figure>`;
    })
    .join("");
  return `<!doctype html><html><head><meta charset="utf-8"><style>
html, body { margin: 0; }
body { width: 1080px; height: 1350px; overflow: hidden; background: Canvas; color: CanvasText;
  font: 20px/1.3 -apple-system, "Helvetica Neue", sans-serif; }
main { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px 20px; padding: 40px; }
figure { margin: 0; }
img { display: block; width: 100%; aspect-ratio: 4 / 5; object-fit: cover; outline: 1px solid GrayText; }
p { margin: 6px 0 0; }
.name { font-weight: 700; font-size: 22px; }
.ok { color: GrayText; }
.warn { font-weight: 700; }
.why { color: GrayText; font-size: 17px; }
</style></head><body><main>${cards}</main></body></html>`;
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"]/g, (char) => `&#${char.charCodeAt(0)};`);
}

await main();
