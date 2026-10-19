import type { StyleMeta } from "@laras/shared";
import { brutalism } from "./brutalism/style.ts";
import { corporateClean } from "./corporate-clean/style.ts";
import { cyberpunk } from "./cyberpunk/style.ts";
import { flatDesign } from "./flat-design/style.ts";
import { glassmorphismNeumorphism } from "./glassmorphism-neumorphism/style.ts";
import { minimalism } from "./minimalism/style.ts";
import { retroVintage } from "./retro-vintage/style.ts";

export {
  StyleBackdrop,
  StyleOverlay,
  styleCss,
  styleEffect,
  styleRender,
  styleTreatment,
} from "./layer.tsx";
export { styleSpecimen } from "./specimen.tsx";

// Gaya desain tahap 1 (PRD F16, T-128). Setiap folder berisi PANDUAN.md (panduan lengkap untuk
// generate desain), style.ts (definisi mesin), dan render.tsx (lapisan gaya, T-132).
export const styles: StyleMeta[] = [
  brutalism,
  corporateClean,
  cyberpunk,
  flatDesign,
  minimalism,
  glassmorphismNeumorphism,
  retroVintage,
];

// Lokasi PANDUAN.md gaya (T-133): sidecar membaca bagian yang relevan per tahap untuk prompt.
export function styleGuideUrl(id: string): URL {
  if (!styles.some((style) => style.id === id)) throw new Error(`Gaya "${id}" tidak ada`);
  return new URL(`./${id}/PANDUAN.md`, import.meta.url);
}
