import { describe, expect, it } from "vitest";
import { AssetManifest } from "./asset-manifest.ts";
import { issuesOf } from "./test-utils.ts";

const manifest = (): AssetManifest => ({
  assets: [
    { id: "bg-01", path: "assets/bg-01.png", width: 1122, height: 1402, source: "codex" },
    { id: "produk", path: "assets/produk.jpg", width: 2000, height: 2500, source: "user" },
  ],
});

describe("AssetManifest", () => {
  it("menerima aset dari Codex dan pengguna", () => {
    expect(issuesOf(AssetManifest, manifest())).toEqual([]);
  });

  it("menolak path di luar folder job dan format file yang tidak didukung", () => {
    const outside = { assets: [{ ...manifest().assets[0], path: "../../rahasia.png" }] };
    expect(issuesOf(AssetManifest, outside)).toContain("Path tidak boleh keluar folder lewat ..");
    const gif = { assets: [{ ...manifest().assets[0], path: "assets/anim.gif" }] };
    expect(issuesOf(AssetManifest, gif)).toContain("File aset harus PNG, JPG, atau WebP");
  });

  it("menolak id ganda, ukuran nol, dan sumber tidak dikenal", () => {
    const first = manifest().assets[0];
    expect(issuesOf(AssetManifest, { assets: [first, first] })).toContain(
      'Id aset "bg-01" dipakai lebih dari sekali',
    );
    expect(AssetManifest.safeParse({ assets: [{ ...first, width: 0 }] }).success).toBe(false);
    expect(AssetManifest.safeParse({ assets: [{ ...first, source: "midjourney" }] }).success).toBe(
      false,
    );
  });

  it("menerima data subjek cut-out dan menolak kotak tanpa ukuran (T-123)", () => {
    const first = manifest().assets[0];
    const subject = {
      box: { left: 0.1, top: 0.05, right: 0.9, bottom: 1 },
      focus: { x: 0.5, y: 0.2 },
    };
    expect(issuesOf(AssetManifest, { assets: [{ ...first, subject }] })).toEqual([]);
    const flat = { ...subject, box: { ...subject.box, bottom: 0.05 } };
    expect(issuesOf(AssetManifest, { assets: [{ ...first, subject: flat }] })).toContain(
      "Kotak subjek harus punya lebar dan tinggi",
    );
    const outside = { ...subject, focus: { x: 1.2, y: 0.2 } };
    expect(AssetManifest.safeParse({ assets: [{ ...first, subject: outside }] }).success).toBe(
      false,
    );
  });
});
