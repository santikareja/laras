import type { StyleMeta } from "@laras/shared";
import { brutalism } from "./brutalism/style.ts";
import { corporateClean } from "./corporate-clean/style.ts";
import { cyberpunk } from "./cyberpunk/style.ts";
import { flatDesign } from "./flat-design/style.ts";
import { glassmorphismNeumorphism } from "./glassmorphism-neumorphism/style.ts";
import { minimalism } from "./minimalism/style.ts";
import { retroVintage } from "./retro-vintage/style.ts";

// Gaya desain tahap 1 (PRD F16, T-128). Setiap folder berisi PANDUAN.md (panduan lengkap untuk
// generate desain) dan style.ts (definisi mesin). Render dan thumbnail menyusul di T-132.
export const styles: StyleMeta[] = [
  brutalism,
  corporateClean,
  cyberpunk,
  flatDesign,
  minimalism,
  glassmorphismNeumorphism,
  retroVintage,
];
