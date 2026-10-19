// Registri pola khas per gaya (T-134). Setiap gaya punya file sendiri di folder ini, jadi
// pekerjaan per gaya tidak menyentuh file bersama. Pola pertama menjadi thumbnail gaya.
import type { Case } from "../archetype-content.ts";
import type { Brand } from "../demo-content.ts";
import { brutalismPatterns } from "./brutalism.ts";
import { corporateCleanPatterns } from "./corporate-clean.ts";
import { cyberpunkPatterns } from "./cyberpunk.ts";
import { flatDesignPatterns } from "./flat-design.ts";
import { glassmorphismNeumorphismPatterns } from "./glassmorphism-neumorphism.ts";
import { minimalismPatterns } from "./minimalism.ts";
import { retroVintagePatterns } from "./retro-vintage.ts";

export type StyleCase = Case & {
  archetype: string;
  variant: string;
  styleOptions?: Record<string, string>;
};

export type StylePattern = { id: string; cases: Record<Brand, StyleCase> };

const PATTERNS: Record<string, StylePattern[]> = {
  brutalism: brutalismPatterns,
  "corporate-clean": corporateCleanPatterns,
  cyberpunk: cyberpunkPatterns,
  minimalism: minimalismPatterns,
  "glassmorphism-neumorphism": glassmorphismNeumorphismPatterns,
  "flat-design": flatDesignPatterns,
  "retro-vintage": retroVintagePatterns,
};

export function stylePatterns(styleId: string): StylePattern[] {
  const patterns = PATTERNS[styleId];
  if (!patterns || patterns.length === 0) throw new Error(`Gaya "${styleId}" belum punya pola`);
  return patterns;
}

// Isi pola gaya pertama yang memakai arketipe ini untuk brand tersebut (isi demo arketipe khas).
export function patternCaseFor(archetypeId: string, slug: Brand): StyleCase | undefined {
  for (const patterns of Object.values(PATTERNS)) {
    for (const pattern of patterns) {
      const item = pattern.cases[slug];
      if (item?.archetype === archetypeId) return item;
    }
  }
  return undefined;
}
