import { readFile } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";
import { type Browser, chromium, type Route } from "playwright-core";

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

export type Renderer = {
  render(html: string, folders: SlideFolders): Promise<Buffer>;
  close(): Promise<void>;
};

// Satu browser dipakai ulang; setiap slide mendapat context dan page baru.
export function createRenderer(): Renderer {
  let browser: Promise<Browser> | undefined;
  return {
    async render(html, folders) {
      browser ??= chromium.launch();
      const context = await (await browser).newContext({
        viewport: SLIDE_SIZE,
        deviceScaleFactor: 2,
      });
      try {
        await context.route("**/*", (route) => handleRequest(route, html, folders));
        const page = await context.newPage();
        await page.goto(`${RENDER_ORIGIN}${SLIDE_PATH}`, { waitUntil: "load" });
        await page.evaluate(READY_SCRIPT);
        return await page.screenshot({ type: "png", animations: "disabled", caret: "hide" });
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
