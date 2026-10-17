import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { BrandKit } from "./brand-kit.ts";
import { issuesOf } from "./test-utils.ts";

// Contoh brand.json diambil langsung dari ARCH 6.1 agar dokumen dan skema tidak menyimpang.
function architectureExample(): unknown {
  const doc = readFileSync(new URL("../../../docs/ARCHITECTURE.md", import.meta.url), "utf8");
  const section = doc.slice(doc.indexOf("### 6.1 Design token"));
  const json = section.match(/```json\n([\s\S]*?)```/)?.[1];
  if (!json) throw new Error("Contoh brand.json tidak ditemukan di ARCH 6.1");
  return JSON.parse(json);
}

const valid = (): BrandKit => structuredClone(BrandKit.parse(architectureExample()));

describe("BrandKit", () => {
  it("menerima contoh brand.json di ARCH 6.1", () => {
    expect(issuesOf(BrandKit, architectureExample())).toEqual([]);
  });

  it("menerima varian logo opsional", () => {
    const brand = valid();
    brand.logo.onLight = "logo/on-light.png";
    brand.logo.icon = "logo/icon.svg";
    expect(BrandKit.safeParse(brand).success).toBe(true);
  });

  it("menolak skala tipografi di bawah 24 px atau tidak berurutan", () => {
    const small = valid();
    small.typography.scale = [20, 32, 44];
    expect(issuesOf(BrandKit, small)).toContain("Ukuran terkecil skala tipografi minimal 24 px");
    const unordered = valid();
    unordered.typography.scale = [24, 44, 32];
    expect(issuesOf(BrandKit, unordered)).toContain("Skala tipografi harus naik berurutan");
  });

  it("menolak file font, logo, dan path yang tidak sah", () => {
    const font = valid();
    font.typography.heading.file = "fonts/BrandDisplay.exe";
    expect(issuesOf(BrandKit, font)).toContain("File font harus WOFF2, OTF, atau TTF");
    const logo = valid();
    logo.logo.primary = "../luar/logo.svg";
    expect(issuesOf(BrandKit, logo)).toContain("Path tidak boleh keluar folder lewat ..");
  });

  it("menolak warna, bobot font, dan netral yang tidak sah", () => {
    const color = valid();
    color.colors.accent = "orange";
    expect(issuesOf(BrandKit, color)).toContain("Warna harus berformat #RRGGBB");
    const weight = valid();
    weight.typography.body.weights = [450];
    expect(BrandKit.safeParse(weight).success).toBe(false);
    const neutral = valid();
    neutral.colors.neutral = { "50": "#FAFAF7" };
    expect(issuesOf(BrandKit, neutral)).toContain("Minimal dua warna netral (terang dan gelap)");
  });

  it("menolak key yang tidak dikenal", () => {
    expect(BrandKit.safeParse({ ...valid(), gradient: true }).success).toBe(false);
  });
});
