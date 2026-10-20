import { cp, glob, mkdir } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { defineConfig } from "tsup";

// Bundel sidecar (ARCH 4.4, T-203): satu file dist/sidecar.mjs. Paket workspace (@laras/*, sumber
// TS/TSX) ikut dibundel; dependency npm (Playwright, sharp, React, Zod) tetap di node_modules.
// File yang dibaca saat runtime lewat import.meta.url disalin ke sebelah bundel: prompts/*.md
// (promptUrl) dan PANDUAN.md tiap gaya (styleGuideUrl).
export default defineConfig({
  entry: { sidecar: "src/main.ts" },
  format: ["esm"],
  platform: "node",
  target: "node22",
  outDir: "dist",
  outExtension: () => ({ js: ".mjs" }),
  noExternal: [/^@laras\//],
  clean: true,
  esbuildOptions(options) {
    options.jsx = "automatic";
  },
  async onSuccess() {
    for await (const file of glob("src/prompts/*.md")) {
      await cp(file, join("dist", basename(file)));
    }
    for await (const file of glob("../templates/styles/*/PANDUAN.md")) {
      const target = join("dist", basename(dirname(file)), "PANDUAN.md");
      await mkdir(dirname(target), { recursive: true });
      await cp(file, target);
    }
  },
});
