// Render ulang layout akhir job yang tersimpan dengan template terkini, tanpa memanggil Claude
// atau Codex: untuk memeriksa perbaikan arketipe pada hasil nyata (T-139, T-141).
// Pakai: pnpm rerender:job -- <awalan-keluaran> <folder job>...
// Menulis <awalan>-<n>.png (1080 px) dan mencetak cek QA wajib yang gagal per job.
import { readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import {
  AssetManifest,
  BrandKit,
  CopyGuide,
  designLimits,
  type JobSpec,
  LayoutSpec,
  Revision,
} from "../packages/shared/src/index.ts";
import { findStyle } from "../packages/sidecar/src/prompts/style-context.ts";
import { renderLayoutHtml } from "../packages/sidecar/src/render/layout.ts";
import { toUpload } from "../packages/sidecar/src/render/postprocess.ts";
import { createRenderer } from "../packages/sidecar/src/render/renderer.ts";
import { experimentalArchetypes, templates } from "../packages/templates/src/index.ts";

const [out, ...jobs] = process.argv.slice(2).filter((arg) => arg !== "--");
if (!out || jobs.length === 0) {
  console.error("Pakai: pnpm rerender:job -- <awalan-keluaran> <folder job>...");
  process.exit(2);
}

const json = async (file: string): Promise<unknown> => JSON.parse(await readFile(file, "utf8"));

// File langkah terakhir yang ada dan valid, dari putaran revisi terbaru ke layout awal.
async function latest<T>(dir: string, files: string[], parse: (data: unknown, file: string) => T) {
  for (const file of files) {
    try {
      return parse(await json(join(dir, file)), file);
    } catch {}
  }
  return null;
}

const renderer = createRenderer();
try {
  for (const [index, job] of jobs.entries()) {
    const dir = resolve(job);
    const projectDir = join(dir, "../..");
    const brand = BrandKit.parse(await json(join(projectDir, "brand.json")));
    const copyGuide = CopyGuide.parse(await json(join(projectDir, "copy-guide.json")));
    const spec = (await json(join(dir, "job.json"))) as { spec: JobSpec };
    const layout = await latest(
      dir,
      ["11-revise.json", "07-revise.json", "03-layout.json"],
      (data, file) =>
        file.includes("revise") ? Revision.parse(data).layout : LayoutSpec.parse(data),
    );
    const assets = await latest(
      dir,
      ["12-assets.json", "08-assets.json", "04-assets.json"],
      (data) => AssetManifest.parse(data),
    );
    if (!layout || !assets) throw new Error(`Job tidak lengkap: ${dir}`);
    const style = spec.spec.style
      ? { ...spec.spec.style, options: layout.styleOptions ?? {} }
      : undefined;
    const [html] = renderLayoutHtml(layout, {
      brand,
      assets,
      templates: [...templates, ...experimentalArchetypes],
      ...(style ? { style } : {}),
    });
    const design = style ? designLimits(findStyle(style.id), style.variant) : undefined;
    const { png, checks } = await renderer.render(
      html ?? "",
      { projectDir, jobDir: dir },
      { brand, copyGuide, ...(design ? { design } : {}) },
    );
    await writeFile(`${out}-${index}.png`, await toUpload(png, "png"));
    const failed = checks.filter((c) => !c.passed && c.severity !== "saran");
    console.log(
      `${dir.split("/").at(-1)} ${layout.templateId}: ${
        failed.length === 0
          ? "QA kode lolos"
          : failed.map((c) => `${c.rule} ${c.target ?? ""}: ${c.message}`).join("; ")
      }`,
    );
  }
} finally {
  await renderer.close();
}
