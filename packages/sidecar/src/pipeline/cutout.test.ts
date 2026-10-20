import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { afterAll, describe, expect, it } from "vitest";
import { analyzeCutout, normalizeCutout, type SubjectKind } from "./cutout.ts";

const ASSETS = new URL("../../../../fixtures/demo-assets/", import.meta.url).pathname;
const tmp = mkdtempSync(join(tmpdir(), "laras-cutout-"));
afterAll(() => rmSync(tmp, { recursive: true, force: true }));

// Kotak buram berukuran tertentu di kanvas transparan, dengan alpha subjek tertentu.
async function square(file: string, alpha: number) {
  const subject = await sharp({
    create: {
      width: 40,
      height: 60,
      channels: 4,
      background: { r: 200, g: 50, b: 50, alpha: alpha / 255 },
    },
  })
    .png()
    .toBuffer();
  await sharp({
    create: { width: 100, height: 200, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: subject, left: 30, top: 50 }])
    .png()
    .toFile(file);
}

describe("cut-out (T-123)", () => {
  it("menghitung kotak alpha tepat dan fokus di dalam kotak", async () => {
    const file = join(tmp, "kotak.png");
    await square(file, 255);
    const info = await analyzeCutout(file, "object");
    expect(info.box).toEqual({ left: 0.3, top: 0.25, right: 0.7, bottom: 0.55 });
    expect(info.focus.x).toBeCloseTo(0.5, 2);
    expect(info.focus.y).toBeGreaterThan(0.25);
    expect(info.focus.y).toBeLessThan(0.55);
  });

  it("mencatat profil lebar subjek per pita horizontal (T-139)", async () => {
    // Kepala sempit di atas badan lebar: pita atas hanya selebar kepala, pita kosong null.
    const file = join(tmp, "profil.png");
    const block = (width: number, height: number) =>
      sharp({
        create: { width, height, channels: 4, background: { r: 90, g: 90, b: 90, alpha: 1 } },
      })
        .png()
        .toBuffer();
    await sharp({
      create: { width: 100, height: 160, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
      .composite([
        { input: await block(20, 40), left: 10, top: 20 },
        { input: await block(80, 60), left: 10, top: 60 },
      ])
      .png()
      .toFile(file);
    const { bands } = await analyzeCutout(file, "person");
    // 160 px dibagi 16 pita: tiap pita 10 px.
    expect(bands?.[0]).toBeNull();
    expect(bands?.[2]).toEqual([0.1, 0.3]);
    expect(bands?.[5]).toEqual([0.1, 0.3]);
    expect(bands?.[6]).toEqual([0.1, 0.9]);
    expect(bands?.[11]).toEqual([0.1, 0.9]);
    expect(bands?.[12]).toBeNull();
  });

  it("menormalkan alpha subjek 253 menjadi 255 dan menyimpan WebP beralpha", async () => {
    const source = join(tmp, "codex.png");
    const target = join(tmp, "codex.webp");
    await square(source, 253);
    expect(await normalizeCutout(source, target)).toEqual({ width: 100, height: 200 });
    const { data, info } = await sharp(target).raw().toBuffer({ resolveWithObject: true });
    expect(info.channels).toBe(4);
    expect(data[(100 * 100 + 50) * 4 + 3]).toBe(255);
    expect(data[3]).toBe(0);
  });

  it("menolak cut-out tanpa subjek", async () => {
    const file = join(tmp, "kosong.png");
    await sharp({
      create: { width: 10, height: 10, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
      .png()
      .toFile(file);
    await expect(analyzeCutout(file, "person")).rejects.toThrow("alpha kosong");
  });

  // Titik fokus sebenarnya dinilai dari gambar fixture: wajah untuk orang, pusat produk untuk objek.
  it.each<[string, SubjectKind, [number, number]]>([
    ["kopi-lembayung/subjek.webp", "object", [0.42, 0.5]],
    ["kopi-lembayung/interaksi.webp", "object", [0.55, 0.45]],
    ["seruni-skin/subjek.webp", "person", [0.52, 0.28]],
    ["seruni-skin/interaksi.webp", "person", [0.55, 0.3]],
    ["ritme-run-club/subjek.webp", "person", [0.53, 0.13]],
    ["ritme-run-club/interaksi.webp", "person", [0.57, 0.12]],
  ])("fokus %s (%s) dalam 0,08 dari titik sebenarnya", async (file, kind, [x, y]) => {
    const { focus } = await analyzeCutout(join(ASSETS, file), kind);
    expect(Math.abs(focus.x - x)).toBeLessThanOrEqual(0.08);
    expect(Math.abs(focus.y - y)).toBeLessThanOrEqual(0.08);
  });
});
