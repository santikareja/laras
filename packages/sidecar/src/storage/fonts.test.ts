import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { FontReadError, fontCodepoints, missingBasicLatin } from "./fonts.ts";

const BRANDS_DIR = new URL("../../../../fixtures/brands/", import.meta.url).pathname;

function fixtureFonts(): string[] {
  return readdirSync(BRANDS_DIR).flatMap((slug) =>
    readdirSync(join(BRANDS_DIR, slug, "fonts"))
      .filter((file) => file.endsWith(".woff2"))
      .map((file) => join(BRANDS_DIR, slug, "fonts", file)),
  );
}

// TTF minimal: satu tabel cmap format 4 yang memetakan A–C ke glyph 1–3.
function syntheticTtf(): Uint8Array {
  const bytes = new Uint8Array(28 + 44);
  const v = new DataView(bytes.buffer);
  v.setUint32(0, 0x00010000);
  v.setUint16(4, 1);
  for (const [i, ch] of [..."cmap"].entries()) v.setUint8(12 + i, ch.charCodeAt(0));
  v.setUint32(20, 28);
  v.setUint32(24, 44);
  const c = 28;
  v.setUint16(c + 2, 1);
  v.setUint16(c + 4, 3);
  v.setUint16(c + 6, 1);
  v.setUint32(c + 8, 12);
  const f = c + 12;
  v.setUint16(f, 4);
  v.setUint16(f + 2, 32);
  v.setUint16(f + 6, 4);
  v.setUint16(f + 14, 67);
  v.setUint16(f + 16, 0xffff);
  v.setUint16(f + 20, 65);
  v.setUint16(f + 22, 0xffff);
  v.setInt16(f + 24, -64);
  v.setInt16(f + 26, 1);
  return bytes;
}

describe("fontCodepoints", () => {
  const fonts = fixtureFonts();

  it("menemukan enam font WOFF2 di fixture brand", () => {
    expect(fonts).toHaveLength(6);
  });

  it.each(fonts.map((path) => [path.split("/").slice(-3).join("/"), path]))(
    "%s memuat seluruh glyph Latin dasar",
    (_name, path) => {
      const codepoints = fontCodepoints(readFileSync(path));
      expect(missingBasicLatin(codepoints)).toEqual([]);
    },
  );

  it("membaca TTF dengan cmap format 4", () => {
    const codepoints = fontCodepoints(syntheticTtf());
    expect([...codepoints].sort((a, b) => a - b)).toEqual([65, 66, 67]);
    expect(missingBasicLatin(codepoints)).toContain(0x20);
  });

  it("menolak file yang bukan font", () => {
    expect(() =>
      fontCodepoints(new TextEncoder().encode("ini bukan file font sama sekali")),
    ).toThrow(FontReadError);
    expect(() => fontCodepoints(new Uint8Array(4))).toThrow("File terlalu kecil untuk sebuah font");
  });
});
