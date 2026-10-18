import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import { BrandKit, CopyGuide } from "@laras/shared";
import { describe, expect, it } from "vitest";
import { fontCodepoints, missingBasicLatin } from "./fonts.ts";

// Integritas tiga brand fixture (T-104): skema, file yang dirujuk, font, dan lisensi.
const BRANDS_DIR = new URL("../../../../fixtures/brands/", import.meta.url).pathname;
const EXPECTED_LANGUAGE = { "kopi-lembayung": "id", "seruni-skin": "id", "ritme-run-club": "en" };

const readJson = (path: string): unknown => JSON.parse(readFileSync(path, "utf8"));

describe("fixture brand", () => {
  it("berisi tepat tiga brand yang disetujui", () => {
    expect(readdirSync(BRANDS_DIR).sort()).toEqual(Object.keys(EXPECTED_LANGUAGE).sort());
  });

  describe.each(Object.entries(EXPECTED_LANGUAGE))("%s", (slug, language) => {
    const dir = join(BRANDS_DIR, slug);
    const inside = (relative: string) => {
      const absolute = resolve(dir, relative);
      expect(absolute.startsWith(dir + sep)).toBe(true);
      expect(existsSync(absolute)).toBe(true);
      return absolute;
    };

    it("brand.json lolos skema BrandKit dan semua file yang dirujuk ada", () => {
      const brand = BrandKit.parse(readJson(join(dir, "brand.json")));
      for (const role of [brand.typography.heading, brand.typography.body]) {
        const codepoints = fontCodepoints(readFileSync(inside(role.file)));
        expect(missingBasicLatin(codepoints)).toEqual([]);
      }
      const logos = Object.values(brand.logo).filter((path): path is string => path !== undefined);
      for (const logo of logos) {
        const svg = readFileSync(inside(logo), "utf8");
        expect(svg).toMatch(/^<svg [^>]*viewBox="0 0 64 64"/);
      }
    });

    it("copy-guide.json lolos skema CopyGuide dengan bahasa yang disetujui", () => {
      const guide = CopyGuide.parse(readJson(join(dir, "copy-guide.json")));
      expect(guide.language).toBe(language);
    });

    it("setiap font disertai lisensi OFL", () => {
      const files = readdirSync(join(dir, "fonts"));
      const fonts = files.filter((f) => f.endsWith(".woff2"));
      const licenses = files.filter((f) => /^LICENSE-.+\.txt$/.test(f));
      expect(licenses).toHaveLength(fonts.length);
      for (const license of licenses) {
        expect(readFileSync(join(dir, "fonts", license), "utf8")).toContain(
          "SIL OPEN FONT LICENSE",
        );
      }
    });

    it("knowledge/business.md ada dan menandai data sebagai fiktif", () => {
      const knowledge = readFileSync(join(dir, "knowledge", "business.md"), "utf8");
      expect(knowledge).toMatch(/fiktif|Fictional/);
    });
  });
});
