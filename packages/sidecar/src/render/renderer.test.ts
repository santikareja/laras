import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { BrandKit, CopyGuide, LayoutSpec } from "@laras/shared";
import { specimen } from "@laras/templates";
import { chromium, type Route } from "playwright-core";
import sharp from "sharp";
import { afterAll, describe, expect, it, vi } from "vitest";
import { renderLayoutHtml } from "./layout.ts";
import { toMaster, toThumbnail, toUpload } from "./postprocess.ts";
import { createRenderer, handleRequest, localFile, type SlideFolders } from "./renderer.ts";

const BRANDS_DIR = fileURLToPath(new URL("../../../../fixtures/brands/", import.meta.url));
const folders: SlideFolders = {
  projectDir: join(BRANDS_DIR, "kopi-lembayung"),
  jobDir: "/laras/job",
};
const readJson = (file: string): unknown =>
  JSON.parse(readFileSync(join(folders.projectDir, file), "utf8"));
const qa = {
  brand: BrandKit.parse(readJson("brand.json")),
  copyGuide: CopyGuide.parse(readJson("copy-guide.json")),
};

function specimenHtml(): string {
  const spec = LayoutSpec.parse({
    templateId: "specimen",
    format: "feed-4x5",
    slides: [
      {
        slots: {
          badge: { type: "badge", value: "Spesimen brand" },
          title: { type: "text", value: "Kopi Lembayung" },
          body: { type: "text", value: "Isi" },
          logo: { type: "logo", variant: "primary" },
        },
        options: {},
      },
    ],
    assetRequests: [],
  });
  const [html] = renderLayoutHtml(spec, {
    brand: qa.brand,
    assets: { assets: [] },
    templates: [specimen],
  });
  return html ?? "";
}

// Deskripsi profil ICC dari tag "desc" bertipe mluc (ICC v4, dipakai profil sRGB bawaan sharp):
// tabel tag mulai byte 128; string record pertama berupa UTF-16BE.
function iccDescription(icc: Buffer | undefined): string | null {
  if (!icc) return null;
  for (let i = 0; i < icc.readUInt32BE(128); i++) {
    const entry = 132 + i * 12;
    if (icc.toString("latin1", entry, entry + 4) !== "desc") continue;
    const tag = icc.readUInt32BE(entry + 4);
    if (icc.toString("latin1", tag, tag + 4) !== "mluc") return null;
    const start = tag + icc.readUInt32BE(tag + 24);
    return Buffer.from(icc.subarray(start, start + icc.readUInt32BE(tag + 20)))
      .swap16()
      .toString("utf16le");
  }
  return null;
}

async function describeImage(buffer: Buffer) {
  const meta = await sharp(buffer).metadata();
  return {
    format: meta.format,
    width: meta.width,
    height: meta.height,
    profile: iccDescription(meta.icc),
  };
}

describe("createRenderer", () => {
  const launch = vi.spyOn(chromium, "launch");
  const renderer = createRenderer();
  afterAll(() => renderer.close());

  it("merender slide ke PNG 2160 × 2700 yang lolos QA, dengan satu browser untuk beberapa slide", {
    timeout: 30_000,
  }, async () => {
    const html = specimenHtml();
    const first = await renderer.render(html, folders, qa);
    const second = await renderer.render(html, folders, qa);
    for (const { png, checks } of [first, second]) {
      expect(await describeImage(png)).toMatchObject({ format: "png", width: 2160, height: 2700 });
      expect(checks.filter((check) => !check.passed)).toEqual([]);
    }
    expect(launch).toHaveBeenCalledTimes(1);

    expect(await describeImage(await toMaster(first.png))).toEqual({
      format: "png",
      width: 2160,
      height: 2700,
      profile: "sRGB",
    });
    const master = await toMaster(first.png);
    expect(await describeImage(await toUpload(master, "png"))).toEqual({
      format: "png",
      width: 1080,
      height: 1350,
      profile: "sRGB",
    });
    expect(await describeImage(await toUpload(master, "jpg"))).toEqual({
      format: "jpeg",
      width: 1080,
      height: 1350,
      profile: "sRGB",
    });
    expect(await describeImage(await toThumbnail(master))).toEqual({
      format: "png",
      width: 360,
      height: 450,
      profile: "sRGB",
    });
  });
});

describe("handleRequest", () => {
  const fakeRoute = (url: string) => ({
    request: () => ({ url: () => url }),
    abort: vi.fn(async () => {}),
    fulfill: vi.fn(async () => {}),
  });
  const handle = (route: ReturnType<typeof fakeRoute>) =>
    handleRequest(route as unknown as Route, "<p>slide</p>", folders);

  it("memblokir origin lain dan melayani dokumen slide serta file project", async () => {
    const external = fakeRoute("https://example.com/foto.png");
    await handle(external);
    expect(external.abort).toHaveBeenCalledWith("blockedbyclient");

    const page = fakeRoute("http://laras.invalid/slide.html");
    await handle(page);
    expect(page.fulfill).toHaveBeenCalledWith(expect.objectContaining({ body: "<p>slide</p>" }));

    const font = fakeRoute("http://laras.invalid/project/fonts/inter-latin-wght-normal.woff2");
    await handle(font);
    expect(font.fulfill).toHaveBeenCalledWith(
      expect.objectContaining({ contentType: "font/woff2" }),
    );
  });

  it("menjawab 404 untuk tipe file lain, file yang tidak ada, dan path keluar folder", async () => {
    for (const url of [
      "http://laras.invalid/project/brand.json",
      "http://laras.invalid/project/fonts/tidak-ada.woff2",
      "http://laras.invalid/project/..%2Fseruni-skin%2Ffonts%2Fmanrope-latin-wght-normal.woff2",
    ]) {
      const route = fakeRoute(url);
      await handle(route);
      expect(route.fulfill).toHaveBeenCalledWith({ status: 404 });
    }
  });
});

describe("localFile", () => {
  it("memetakan /project/ dan /job/ ke file di dalam foldernya saja", () => {
    expect(localFile("/project/fonts/a.woff2", folders)).toBe(
      join(folders.projectDir, "fonts/a.woff2"),
    );
    expect(localFile("/job/assets/hero.png", folders)).toBe("/laras/job/assets/hero.png");
    expect(localFile("/project/..%2F..%2Fetc%2Fpasswd", folders)).toBeNull();
    expect(localFile("/lain/a.png", folders)).toBeNull();
    expect(localFile("/job/%E0%A4%A.png", folders)).toBeNull();
  });
});
