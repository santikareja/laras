import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { BrandKit, CopyGuide, isBlocking, RenderReport } from "@laras/shared";
import { brandCss } from "@laras/templates";
import { afterAll, describe, expect, it } from "vitest";
import { createRenderer, PROJECT_BASE_URL, type SlideFolders } from "../renderer.ts";
import { buildRenderReport } from "./report.ts";

// Fixture HTML yang sengaja melanggar satu aturan QA (PRD F9, ARCH 7.2), dirender di Chromium.
const fixture = (path: string) =>
  fileURLToPath(new URL(`../../../../../fixtures/${path}`, import.meta.url));
const folders: SlideFolders = {
  projectDir: fixture("brands/kopi-lembayung"),
  jobDir: fixture("demo-assets/kopi-lembayung"),
};
const readJson = (file: string): unknown =>
  JSON.parse(readFileSync(`${folders.projectDir}/${file}`, "utf8"));
const qa = {
  brand: BrandKit.parse(readJson("brand.json")),
  copyGuide: CopyGuide.parse(readJson("copy-guide.json")),
};

const slide = (body: string) => `<!doctype html><html><head><meta charset="utf-8"><style>
${brandCss(qa.brand, { assetBaseUrl: PROJECT_BASE_URL })}
html, body { margin: 0; }
body { width: 1080px; height: 1350px; overflow: hidden; background: var(--color-neutral-light); }
p { margin: 0; position: absolute; font-family: var(--font-body); font-weight: 400; font-size: 32px; color: var(--color-neutral-dark); }
</style></head><body>${body}</body></html>`;

const text = (style: string, content: string, slot = "teks") =>
  `<p data-slot="${slot}" data-slot-type="text" style="${style}">${content}</p>`;
const photo = (src: string, style = "inset: 0; width: 1080px; height: 1350px") =>
  `<img data-slot="foto" data-slot-type="image" src="http://laras.invalid/job/${src}" style="position: absolute; object-fit: cover; ${style}">`;

const renderer = createRenderer();
afterAll(() => renderer.close());

async function failures(body: string): Promise<string[]> {
  const { checks } = await renderer.render(slide(body), folders, qa);
  return checks.filter(isBlocking).map((check) => `${check.rule} ${check.target}`);
}

describe("QA deterministik di Chromium", { timeout: 30_000 }, () => {
  it("fixture patuh lolos semua aturan, termasuk teks gelap di atas foto terang", async () => {
    expect(await failures(text("left: 100px; top: 100px", "Kopi pagi di teras"))).toEqual([]);
    const overPhoto = photo("foto.jpg") + text("left: 100px; top: 300px", "Di atas linen");
    expect(await failures(overPhoto)).toEqual([]);
  });

  it("contrast memakai latar elemen teks itu sendiri, mis. badge di atas latar gelap", async () => {
    const dark =
      '<div style="position: absolute; inset: 0; background: var(--color-primary)"></div>';
    const badge = text("left: 100px; top: 100px; background: var(--color-accent)", "Menu baru");
    expect(await failures(dark + badge)).toEqual([]);
  });

  it("contrast: warna latar dan teks terang di atas foto terang", async () => {
    const pale = text("left: 100px; top: 100px; color: var(--color-secondary)", "Pucat");
    expect(await failures(pale)).toEqual(["contrast teks"]);
    const overPhoto =
      photo("foto.jpg") +
      text("left: 100px; top: 300px; color: var(--color-neutral-light)", "Di atas linen");
    const { checks } = await renderer.render(slide(overPhoto), folders, qa);
    const contrast = checks.filter(isBlocking);
    expect(contrast).toHaveLength(1);
    expect(contrast[0]?.message).toMatch(/^Kontras teks di atas foto [\d.]+:1, minimal 3:1$/);
  });

  it("overflow: luber horizontal, terpotong di tepi, dan slot bertabrakan", async () => {
    const wide = text(
      "left: 100px; top: 100px; width: 200px",
      "Supercalifragilistikekspialidosius",
    );
    expect(await failures(wide)).toEqual(["overflow teks"]);
    const cut = text("left: 100px; top: 1330px", "Terpotong");
    expect(await failures(cut)).toContain("overflow teks");
    // Kata raksasa dengan line-height rapat di dekat tepi atas: area konten font di atas kotak
    // baris bukan huruf yang terpotong (T-127).
    const display = text(
      "left: 100px; top: 24px; font-family: var(--font-heading); font-weight: 700; font-size: 220px; line-height: 0.9",
      "KOPI",
      "headline",
    );
    expect(await failures(display)).not.toContain("overflow headline");
    const collide =
      text("left: 100px; top: 100px", "Judul pertama", "headline") +
      text("left: 150px; top: 110px", "Menimpa", "cta");
    expect(await failures(collide)).toEqual(["overflow headline+cta"]);
  });

  it("safe-margin dan font-size", async () => {
    expect(await failures(text("left: 20px; top: 100px", "Terlalu ke tepi"))).toEqual([
      "safe-margin teks",
    ]);
    expect(await failures(text("left: 100px; top: 100px; font-size: 16px", "Kecil"))).toEqual([
      "font-size teks",
    ]);
  });

  it("brand-font: glyph cadangan, family lain, dan bobot yang tidak diizinkan", async () => {
    expect(await failures(text("left: 100px; top: 100px", "Panah →"))).toEqual(["brand-font teks"]);
    expect(await failures(text("left: 100px; top: 100px; font-family: Georgia", "Serif"))).toEqual([
      "brand-font teks",
      "brand-font teks",
    ]);
    const thin = text(
      "left: 100px; top: 100px; font-family: var(--font-heading); font-weight: 400",
      "Fraunces tipis",
    );
    expect(await failures(thin)).toEqual(["brand-font teks"]);
  });

  it("brand-color: warna teks dan latar di luar palet", async () => {
    const magenta = text("left: 100px; top: 100px; color: #8a1c7c", "Magenta");
    const block =
      '<div style="position: absolute; left: 100px; top: 400px; width: 200px; height: 200px; background: #00a35c"></div>';
    expect(await failures(magenta + block)).toEqual(["brand-color teks", "brand-color div"]);
  });

  it("forbidden-word dan emoji-hashtag; emoji tidak dianggap font cadangan", async () => {
    expect(await failures(text("left: 100px; top: 100px", "Kopi terenak"))).toEqual([
      "forbidden-word teks",
    ]);
    expect(await failures(text("left: 100px; top: 100px", "Mampir ☕☕"))).toEqual([]);
    expect(await failures(text("left: 100px; top: 100px", "Mampir ☕☕☕"))).toEqual([
      "emoji-hashtag slide",
    ]);
    expect(await failures(text("left: 100px; top: 100px", "Mampir #KopiLembayung"))).toEqual([
      "emoji-hashtag teks",
    ]);
  });

  it("asset-load: gambar yang gagal dimuat", async () => {
    const broken = photo("tidak-ada.png", "left: 100px; top: 300px; width: 200px; height: 200px");
    expect(await failures(broken)).toEqual(["asset-load http://laras.invalid/job/tidak-ada.png"]);
  });

  it("P11: jarak tepi teks display diukur dari kotak barisnya, bukan area konten font", async () => {
    // Fraunces 112 px dengan line-height 0,8: Range melaporkan atas ~20 px di luar kotak baris.
    const display = text(
      "left: 64px; top: 64px; font-family: var(--font-heading); font-size: 112px; line-height: 0.8",
      "Kopi",
      "headline",
    );
    const cta = text("left: 64px; bottom: 64px", "Pesan sekarang", "cta");
    const { checks } = await renderer.render(slide(display + cta), folders, qa);
    const edges = checks.filter((check) => check.target === "jarak tepi" && !check.passed);
    expect(edges.map((check) => check.message)).toEqual([]);
  });

  it("gradient brand (T-124): gradient lembut tertangkap; pola dan bidang polos tidak", async () => {
    const box = (style: string, attrs = "") =>
      `<div ${attrs} style="position: absolute; width: 200px; height: 200px; ${style}"></div>`;
    const gradientTargets = async (body: string) =>
      (await renderer.render(slide(body), folders, qa)).checks
        .filter((c) => c.rule === "brand-gradient" && !c.passed)
        .map((c) => c.target);
    const soft = box(
      "left: 100px; top: 100px; background: linear-gradient(var(--color-primary), var(--color-accent))",
    );
    expect(await gradientTargets(soft)).toEqual(["div"]);
    const patterns = [
      box(
        "left: 100px; top: 400px; background: repeating-linear-gradient(0deg, var(--color-primary) 0 2px, transparent 2px 6px)",
      ),
      box(
        "left: 400px; top: 400px; background: linear-gradient(var(--color-primary), var(--color-primary))",
      ),
      box(
        "left: 700px; top: 400px; background: radial-gradient(circle, var(--color-primary) 4px, transparent 5px); background-size: 16px 16px",
        'data-qa-gradient="pattern"',
      ),
    ].join("");
    expect(await gradientTargets(patterns)).toEqual([]);
  });

  it("menyusun RenderReport yang lolos skema", async () => {
    const { checks } = await renderer.render(
      slide(text("left: 100px; top: 100px", "Kopi")),
      folders,
      qa,
    );
    const report = buildRenderReport([
      { htmlPath: "slides/1.html", pngPath: "slides/1.png", width: 2160, height: 2700, checks },
      {
        htmlPath: "slides/2.html",
        pngPath: "slides/2.png",
        width: 2160,
        height: 2700,
        checks: [{ rule: "contrast", passed: false, message: "x" }],
      },
    ]);
    expect(RenderReport.safeParse(report).success).toBe(true);
    expect(report.passed).toBe(false);
    expect(report.slides.map((s) => s.index)).toEqual([0, 1]);
  });
});
