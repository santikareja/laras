import { mitosFakta } from "../../feed/MitosFakta.tsx";
import { subjekLingkar } from "../../feed/SubjekLingkar.tsx";
import { tiket } from "../../feed/Tiket.tsx";
import type { Template } from "../../src/template.ts";

// Arketipe khas gaya ini (T-134): komposisi dari konsep PANDUAN.md, terdaftar di katalog lewat
// src/archetypes.ts. Template-nya berada di feed/.
export const flatDesignArchetypes: Template[] = [subjekLingkar, mitosFakta, tiket];
