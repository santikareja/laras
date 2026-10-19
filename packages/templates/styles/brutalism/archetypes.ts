import { kolaseSobek } from "../../feed/KolaseSobek.tsx";
import { posterGrid } from "../../feed/PosterGrid.tsx";
import { selWajah } from "../../feed/SelWajah.tsx";
import type { Template } from "../../src/template.ts";

// Arketipe khas gaya ini (T-134): komposisi dari konsep PANDUAN.md, terdaftar di katalog lewat
// src/archetypes.ts. Template-nya berada di feed/.
export const brutalismArchetypes: Template[] = [posterGrid, selWajah, kolaseSobek];
