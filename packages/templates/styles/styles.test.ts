import { readFileSync } from "node:fs";
import { StyleMeta } from "@laras/shared";
import { describe, expect, it } from "vitest";
import { archetypes } from "../src/archetypes.ts";
import type { Template } from "../src/template.ts";
import { brutalismArchetypes } from "./brutalism/archetypes.ts";
import { corporateCleanArchetypes } from "./corporate-clean/archetypes.ts";
import { cyberpunkArchetypes } from "./cyberpunk/archetypes.ts";
import { flatDesignArchetypes } from "./flat-design/archetypes.ts";
import { retroVintageArchetypes } from "./retro-vintage/archetypes.ts";

const OWN_ARCHETYPES: Record<string, Template[]> = {
  brutalism: brutalismArchetypes,
  "corporate-clean": corporateCleanArchetypes,
  cyberpunk: cyberpunkArchetypes,
  "flat-design": flatDesignArchetypes,
  "retro-vintage": retroVintageArchetypes,
};

import { styles } from "./index.ts";

// Folder gaya tahap 1 (PRD F16, T-128): definisi mesin sah dan panduan lengkap dengan struktur
// yang sama di setiap gaya.

const SECTIONS = [
  "## 1. Asal-usul dan esensi",
  "## 2. Kapan dipakai dan kapan dihindari",
  "## 3. Ciri visual kunci",
  "## 4. Komposisi, grid, dan hierarki",
  "## 5. Tipografi",
  "## 6. Warna",
  "## 7. Bentuk, tekstur, dan perangkat grafis",
  "## 8. Foto dan ilustrasi",
  "## 9. Pola layout feed 4:5",
  "## 10. Carousel",
  "## 11. Do dan don't",
  "## 12. Kecocokan dengan Brand Kit",
  "## 13. Checklist QA gaya",
  "## 14. Referensi",
];

const guide = (id: string) => readFileSync(new URL(`./${id}/PANDUAN.md`, import.meta.url), "utf8");

describe("gaya tahap 1", () => {
  it("tujuh gaya dengan id unik", () => {
    const ids = styles.map((s) => s.id);
    expect(ids).toEqual([
      "brutalism",
      "corporate-clean",
      "cyberpunk",
      "flat-design",
      "minimalism",
      "glassmorphism-neumorphism",
      "retro-vintage",
    ]);
  });

  it.each(styles.map((s) => [s.id, s] as const))("%s", (id, style) => {
    expect(StyleMeta.safeParse(style).success).toBe(true);
    // T-132: semua perangkat grafis gaya sudah dibuat; arketipe yang direncanakan belum ada.
    expect(style.devices.filter((d) => d.status !== "ada")).toEqual([]);
    for (const planned of style.plannedArchetypes) {
      expect(archetypes.map((a) => a.meta.id)).not.toContain(planned.id);
    }
    for (const archetype of style.archetypes) {
      expect(archetypes.map((a) => a.meta.id)).toContain(archetype);
    }
    // T-133: arketipe khas gaya (styles/<id>/archetypes.ts) wajib tercantum di daftar gayanya,
    // karena katalog layout mengutamakan daftar itu.
    for (const own of OWN_ARCHETYPES[id] ?? []) {
      expect(style.archetypes).toContain(own.meta.id);
    }
    const text = guide(id);
    expect(text.startsWith(`# ${style.name}`)).toBe(true);
    let last = -1;
    for (const section of SECTIONS) {
      const at = text.indexOf(section);
      expect(at, section).toBeGreaterThan(last);
      last = at;
    }
    const patterns = text.slice(text.indexOf(SECTIONS[8] ?? ""), text.indexOf(SECTIONS[9] ?? ""));
    expect(patterns.match(/^### /gm)?.length ?? 0).toBeGreaterThanOrEqual(5);
    expect(text).toMatch(/https?:\/\//);
  });
});
