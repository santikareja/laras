import { readFileSync } from "node:fs";
import { BrandKit } from "@laras/shared";
import { styles } from "@laras/templates";
import { describe, expect, it } from "vitest";
import {
  guideSections,
  type StyleStage,
  styleContext,
  styleImageDirection,
} from "./style-context.ts";

const brand = (slug: string) =>
  BrandKit.parse(
    JSON.parse(
      readFileSync(
        new URL(`../../../../fixtures/brands/${slug}/brand.json`, import.meta.url),
        "utf8",
      ),
    ),
  );
const STAGES: StyleStage[] = ["plan", "copy", "layout", "qa-visual", "revise"];

describe("konteks gaya untuk prompt (T-133)", () => {
  it("mengambil bagian bernomor sesuai urutan dan membuang subbagian contoh fixture", () => {
    const md = [
      "# Gaya",
      "## 1. Satu",
      "isi satu",
      "## 2. Dua",
      "**Aturan umum.**",
      "tetap",
      "**Contoh dengan fixture:**",
      "- Kopi: buang",
      "## 3. Tiga",
      "isi tiga",
    ].join("\n");
    const text = guideSections(md, [3, 2]);
    expect(text.indexOf("## 3. Tiga")).toBeLessThan(text.indexOf("## 2. Dua"));
    expect(text).toContain("tetap");
    expect(text).not.toContain("buang");
    expect(text).not.toContain("## 1.");
  });

  it("tanpa gaya: satu kalimat, tanpa panduan", () => {
    expect(styleContext(null, brand("kopi-lembayung"), "layout")).toMatch(/^Tanpa gaya/);
    expect(styleImageDirection(null)).toBe("Natural, as described.");
  });

  it.each(styles.flatMap((s) => STAGES.map((stage) => [s.id, stage] as const)))(
    "%s × %s: nama, varian, bagian panduan, tanpa contoh fixture, ringkas",
    (id, stage) => {
      const style = styles.find((s) => s.id === id);
      if (!style?.variants[0]) throw new Error(id);
      const text = styleContext(
        { id, variant: style.variants[0].id },
        brand("ritme-run-club"),
        stage,
      );
      expect(text).toContain(style.name);
      expect(text).toContain(`varian ${style.variants[0].id}`);
      expect(text).toMatch(/^## \d+\. /m);
      expect(text).not.toMatch(/^\*\*[^*\n]*fixture/im);
      // Batas kasar: ±6 ribu token, jauh di bawah panduan utuh (37–56 KB).
      expect(text.length).toBeLessThan(24_000);
      if (stage === "layout") expect(text).toContain("Arketipe gaya ini (utamakan)");
    },
  );

  it("menandai kurang cocok dengan alasan styleFit dan mengingatkan Brand Kit menang", () => {
    const text = styleContext(
      { id: "cyberpunk", variant: "neon-gelap" },
      brand("seruni-skin"),
      "plan",
    );
    expect(text).toContain("kurang cocok (");
    expect(text).toContain("Brand Kit menang");
  });

  it("arahan gambar memakai frasa promptHints dan avoid gaya", () => {
    const style = styles.find((s) => s.id === "cyberpunk");
    const text = styleImageDirection({ id: "cyberpunk", variant: "neon-gelap" });
    expect(text).toContain(style?.imagery.promptHints[0] ?? "-");
    expect(text).toContain("Avoid:");
  });
});
