import { kataTerbelah } from "../../feed/KataTerbelah.tsx";
import { panggungNeon } from "../../feed/PanggungNeon.tsx";
import { posterTekno } from "../../feed/PosterTekno.tsx";
import type { Template } from "../../src/template.ts";

// Arketipe khas gaya ini (T-134): komposisi dari konsep PANDUAN.md, terdaftar di katalog lewat
// src/archetypes.ts. Template-nya berada di feed/.
export const cyberpunkArchetypes: Template[] = [kataTerbelah, panggungNeon, posterTekno];
