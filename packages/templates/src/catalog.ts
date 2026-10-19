import { archetypes } from "./archetypes.ts";
import type { Template } from "./template.ts";

// Katalog template yang boleh dipilih Claude di tahap layout (ARCH 6.2): arketipe komposisi
// (ADR-015, T-131). Empat template feed lama dipensiunkan (keputusan pemilik 2026-10-19).
export const templates: Template[] = archetypes;
