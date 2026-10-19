import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { DEFAULT_DESIGN_LIMITS, type RenderCheck } from "@laras/shared";
import { type Browser, chromium, type Page, type Route } from "playwright-core";
import { FIT_SCRIPT, ROTATION_SCRIPT } from "./fit.ts";
import { brandRuleChecks } from "./qa/brand.ts";
import { COLLECT_SCRIPT, HIDE_TEXT_CSS } from "./qa/collect.ts";
import { type DesignMeasurements, designChecks } from "./qa/design.ts";
import { DESIGN_SCRIPT } from "./qa/design-collect.ts";
import { pixelStats } from "./qa/pixels.ts";
import {
  evaluateQa,
  type Measurements,
  type PlatformFont,
  type QaContext,
  type SampledContrast,
} from "./qa/rules.ts";
import { sampleContrast } from "./qa/sample.ts";

// Renderer slide (ARCH 7.1, ADR-014). Halaman dimuat dari origin palsu yang hanya dilayani
// route Playwright: /project/ dan /job/ dibaca dari disk, request lain diblokir.
export const RENDER_ORIGIN = "http://laras.invalid";
export const PROJECT_BASE_URL = `${RENDER_ORIGIN}/project/`;
export const JOB_BASE_URL = `${RENDER_ORIGIN}/job/`;
export const SLIDE_SIZE = { width: 1080, height: 1350 };

const SLIDE_PATH = "/slide.html";
const CONTENT_TYPES: Record<string, string> = {
  ".woff2": "font/woff2",
  ".otf": "font/otf",
  ".ttf": "font/ttf",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

// Dievaluasi di page (string agar sidecar tidak butuh tipe DOM). Membaca layout dulu supaya
// semua font yang dipakai sudah mulai dimuat sebelum menunggu document.fonts.ready.
const READY_SCRIPT = `void document.body.offsetHeight;
Promise.all([document.fonts.ready, ...Array.from(document.images, (img) => img.decode().catch(() => null))])`;

export type SlideFolders = { projectDir: string; jobDir: string };

export type SlideRender = { png: Buffer; checks: RenderCheck[] };

export type Renderer = {
  render(html: string, folders: SlideFolders, qa: QaContext): Promise<SlideRender>;
  close(): Promise<void>;
};

const DEVICE_SCALE = 2;
const SCREENSHOT = { type: "png", animations: "disabled", caret: "hide" } as const;

// Satu browser dipakai ulang; setiap slide mendapat context dan page baru. QA deterministik
// (ARCH 7.2) diukur di page sebelum screenshot; teks di atas foto disampling dari screenshot
// kedua tanpa teks.
export function createRenderer(): Renderer {
  let browser: Promise<Browser> | undefined;
  return {
    async render(html, folders, qa) {
      browser ??= chromium.launch();
      const context = await (await browser).newContext({
        viewport: SLIDE_SIZE,
        deviceScaleFactor: DEVICE_SCALE,
      });
      try {
        await context.route("**/*", (route) => handleRequest(route, html, folders));
        const page = await context.newPage();
        await page.goto(`${RENDER_ORIGIN}${SLIDE_PATH}`, { waitUntil: "load" });
        await page.evaluate(READY_SCRIPT);
        await page.evaluate(FIT_SCRIPT);
        await page.evaluate(ROTATION_SCRIPT);
        const measurements = await page.evaluate<Measurements>(COLLECT_SCRIPT);
        const design = await page.evaluate<DesignMeasurements>(DESIGN_SCRIPT);
        const fonts = await platformFonts(page);
        for (const text of measurements.texts) text.platformFonts = fonts.get(text.id) ?? [];
        const png = await page.screenshot(SCREENSHOT);
        const overImage = measurements.texts.filter((t) =>
          t.backgrounds.some((b) => b.kind === "image"),
        );
        let sampled: SampledContrast = new Map();
        if (overImage.length > 0) {
          await page.addStyleTag({ content: HIDE_TEXT_CSS });
          sampled = await sampleContrast(
            await page.screenshot(SCREENSHOT),
            overImage,
            DEVICE_SCALE,
          );
        }
        const { primary, secondary, accent, neutral } = qa.brand.colors;
        const pixels = await pixelStats(
          png,
          [primary, secondary, accent, ...Object.values(neutral)],
          design.excluded,
          design.canvas,
        );
        const checks = [
          ...evaluateQa(measurements, qa, sampled),
          ...(qa.brandRules === false ? [] : brandRuleChecks(measurements, design, qa.brand)),
          ...designChecks(design, pixels, qa.design ?? DEFAULT_DESIGN_LIMITS, qa.brand),
        ];
        return { png, checks };
      } finally {
        await context.close();
      }
    },
    async close() {
      const running = browser;
      browser = undefined;
      if (running) await (await running).close();
    },
  };
}

// Font yang benar-benar dipakai tiap elemen teks (CDP), untuk mendeteksi glyph yang jatuh ke
// font cadangan sistem walaupun computed font-family berisi font brand.
async function platformFonts(page: Page): Promise<Map<number, PlatformFont[]>> {
  const cdp = await page.context().newCDPSession(page);
  try {
    await cdp.send("DOM.enable");
    await cdp.send("CSS.enable");
    const { root } = await cdp.send("DOM.getDocument", { depth: -1 });
    const { nodeIds } = await cdp.send("DOM.querySelectorAll", {
      nodeId: root.nodeId,
      selector: "[data-qa-text]",
    });
    const fonts = new Map<number, PlatformFont[]>();
    for (const nodeId of nodeIds) {
      const { attributes } = await cdp.send("DOM.getAttributes", { nodeId });
      const id = Number(attributes[attributes.indexOf("data-qa-text") + 1]);
      const result = await cdp.send("CSS.getPlatformFontsForNode", { nodeId });
      fonts.set(
        id,
        result.fonts.map((f) => ({
          family: f.familyName,
          custom: f.isCustomFont,
          glyphs: f.glyphCount,
        })),
      );
    }
    return fonts;
  } finally {
    await cdp.detach();
  }
}

export async function handleRequest(route: Route, html: string, folders: SlideFolders) {
  const url = new URL(route.request().url());
  if (url.origin !== RENDER_ORIGIN) return route.abort("blockedbyclient");
  if (url.pathname === SLIDE_PATH) {
    return route.fulfill({ contentType: "text/html; charset=utf-8", body: html });
  }
  const file = localFile(url.pathname, folders);
  const contentType = file ? CONTENT_TYPES[extname(file).toLowerCase()] : undefined;
  if (!file || !contentType) return route.fulfill({ status: 404 });
  try {
    return await route.fulfill({ contentType, body: await readFile(file) });
  } catch {
    return route.fulfill({ status: 404 });
  }
}

// Path URL → file di dalam folder project atau job; null bila keluar folder atau tidak sah.
export function localFile(pathname: string, { projectDir, jobDir }: SlideFolders): string | null {
  const [, mount, ...rest] = pathname.split("/");
  const root = mount === "project" ? projectDir : mount === "job" ? jobDir : undefined;
  if (!root) return null;
  let relative: string;
  try {
    relative = decodeURIComponent(rest.join("/"));
  } catch {
    return null;
  }
  const base = resolve(root);
  const file = resolve(base, relative);
  return file.startsWith(base + sep) ? file : null;
}
