import { deretFitur } from "../../feed/DeretFitur.tsx";
import { kataKunci } from "../../feed/KataKunci.tsx";
import { panelBerlapis } from "../../feed/PanelBerlapis.tsx";
import type { Template } from "../../src/template.ts";

// Arketipe khas gaya ini (T-134): komposisi dari konsep PANDUAN.md, terdaftar di katalog lewat
// src/archetypes.ts. Template-nya berada di feed/.
export const corporateCleanArchetypes: Template[] = [panelBerlapis, deretFitur, kataKunci];
