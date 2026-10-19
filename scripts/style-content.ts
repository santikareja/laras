// Isi contoh gaya desain (PRD F16, T-132, T-134): pola khas per gaya × brand fixture.
// Fakta dari fixtures/brands/<brand>/knowledge; opsi gaya dan arketipe mematuhi aturan brand
// (Kopi: logo kanan bawah, tanpa gradient, tanpa latar putih polos; Seruni: tanpa filter
// berlebihan, maksimal dua elemen visual utama; Ritme: angka besar, foto bergerak, aksen tidak
// di atas primary). Pola khas per gaya disetujui pemilik 2026-10-19 (TASKS T-132).
import type { StyleChoice } from "../packages/shared/src/index.ts";
import { archetypes, styleSpecimen, type Template } from "../packages/templates/src/index.ts";
import { type Case, caseSpec } from "./archetype-content.ts";
import type { Brand } from "./demo-content.ts";
import { stylePatterns } from "./style-cases/index.ts";

export { stylePatterns };
export const STYLE_TEMPLATES: Template[] = [...archetypes, styleSpecimen];

function template(id: string): Template {
  const found = STYLE_TEMPLATES.find((t) => t.meta.id === id);
  if (!found) throw new Error(`Template "${id}" tidak ada`);
  return found;
}

export async function styleCase(
  styleId: string,
  patternId: string,
  slug: Brand,
  assetsDir: string,
) {
  const item = stylePatterns(styleId).find((p) => p.id === patternId)?.cases[slug];
  if (!item) throw new Error(`Pola "${styleId}/${patternId}" belum punya isi contoh untuk ${slug}`);
  const { spec, assets } = await caseSpec(template(item.archetype), slug, item, assetsDir);
  const style: StyleChoice = {
    id: styleId,
    variant: item.variant,
    options: item.styleOptions ?? {},
  };
  return { spec, assets, style };
}

// Spesimen perangkat: subjek cut-out dan foto contoh brand, varian pertama gaya.
export async function specimenCase(
  styleId: string,
  variant: string,
  slug: Brand,
  assetsDir: string,
) {
  const item: Case = {
    text: {},
    images: { subjek: "subjek.webp", foto: slug === "seruni-skin" ? "foto-4x5.jpg" : "foto.jpg" },
    options: {},
    logo: "primary",
  };
  const { spec, assets } = await caseSpec(styleSpecimen, slug, item, assetsDir);
  const style: StyleChoice = { id: styleId, variant, options: {} };
  return { spec, assets, style };
}
