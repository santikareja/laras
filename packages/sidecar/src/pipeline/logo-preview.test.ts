import { mkdtempSync, rmSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { BrandKit } from "@laras/shared";
import sharp from "sharp";
import { afterAll, describe, expect, it } from "vitest";
import { logoPreviews } from "./logo-preview.ts";

// Pratinjau logo untuk QA visual (T-126): PNG per varian di folder job.
const project = new URL("../../../../fixtures/brands/kopi-lembayung/", import.meta.url).pathname;
const jobs = mkdtempSync(join(tmpdir(), "laras-logo-"));
afterAll(() => rmSync(jobs, { recursive: true, force: true }));

const brand = async () =>
  BrandKit.parse(JSON.parse(await readFile(join(project, "brand.json"), "utf8")));

describe("pratinjau logo (T-126)", () => {
  it("merender primary dan onDark ke PNG di folder qa job, path relatif project", async () => {
    const files = await logoPreviews(project, join(jobs, "a"), await brand());
    expect(files).toHaveLength(2);
    for (const file of files) {
      expect(file).toMatch(/qa\/logo-(primary|onDark)\.png$/);
      const meta = await sharp(join(project, file)).metadata();
      expect(meta.format).toBe("png");
      expect(meta.height).toBeGreaterThan(240);
    }
  });

  it("melewati logo yang tidak ada dan menolak path di luar project", async () => {
    const b = await brand();
    const missing = { ...b, logo: { primary: "logo/hilang.svg" } };
    expect(await logoPreviews(project, join(jobs, "b"), missing)).toEqual([]);
    const outside = { ...b, logo: { primary: "../seruni-skin/logo/primary.svg" } };
    await expect(logoPreviews(project, join(jobs, "c"), outside)).rejects.toThrow("di luar folder");
  });
});
