import { kataDilompati } from "../../feed/KataDilompati.tsx";
import { posterHuruf } from "../../feed/PosterHuruf.tsx";
import { sampulEditorial } from "../../feed/SampulEditorial.tsx";
import type { Template } from "../../src/template.ts";

// Arketipe khas gaya ini (T-134): komposisi dari konsep PANDUAN.md, terdaftar di katalog lewat
// src/archetypes.ts. Template-nya berada di feed/.
export const retroVintageArchetypes: Template[] = [kataDilompati, posterHuruf, sampulEditorial];
