import { readFileSync } from "node:fs";
import { type BrandKit, type StyleMeta, type StyleSelection, styleFit } from "@laras/shared";
import { styleGuideUrl, styles } from "@laras/templates";

// Konteks gaya desain untuk prompt (PRD F16, T-133, ADR-016): ringkasan style.ts ditambah bagian
// PANDUAN.md yang relevan per tahap, bukan panduan utuh (10–15 ribu token per gaya). Contoh
// penyesuaian brand fixture di panduan dibuang; kecocokan brand pengguna dihitung styleFit.

export type StyleStage = "plan" | "copy" | "layout" | "qa-visual" | "revise";

// Nomor bagian PANDUAN (14 bagian seragam, styles.test.ts) per tahap.
const STAGE_SECTIONS: Record<StyleStage, number[]> = {
  plan: [2, 3], // kapan dipakai, ciri visual kunci
  copy: [5, 11], // tipografi (kapitalisasi, panjang), do dan don't
  layout: [9, 11, 12], // pola layout, do dan don't, kecocokan Brand Kit
  "qa-visual": [11, 13], // do dan don't, checklist QA gaya
  revise: [9, 11, 13],
};

const NO_STYLE = "Tanpa gaya: pakai arketipe sesuai deskripsinya, tanpa lapisan gaya.";

export function findStyle(id: string): StyleMeta {
  const style = styles.find((s) => s.id === id);
  if (!style) throw new Error(`Gaya "${id}" tidak ada`);
  return style;
}

// Isi bagian "## N. …" sampai bagian berikutnya, tanpa subbagian bertanda tebal tentang fixture.
export function guideSections(markdown: string, numbers: number[]): string {
  const parts = markdown.split(/^(?=## \d+\. )/m);
  return numbers
    .map((n) => parts.find((part) => part.startsWith(`## ${n}. `)))
    .filter((part): part is string => part !== undefined)
    .map((part) => withoutFixtureNotes(part).trim())
    .join("\n\n");
}

function withoutFixtureNotes(section: string): string {
  const blocks = section.split(/^(?=\*\*)/m);
  return blocks.filter((block) => !/^\*\*[^*\n]*fixture/i.test(block)).join("");
}

export function styleContext(
  selection: StyleSelection | null,
  brand: BrandKit,
  stage: StyleStage,
): string {
  if (!selection) return NO_STYLE;
  const style = findStyle(selection.id);
  const variant = style.variants.find((v) => v.id === selection.variant);
  if (!variant) throw new Error(`Varian "${selection.variant}" tidak ada di gaya "${style.id}"`);
  const fit = styleFit(style, brand);
  const guide = readFileSync(styleGuideUrl(style.id), "utf8");
  return [
    `Gaya: ${style.name}, varian ${variant.id} (${variant.name}: ${variant.description})`,
    `Ringkasan: ${style.summary}`,
    fit.fit === "cocok"
      ? "Kecocokan dengan brand ini: cocok."
      : `Kecocokan dengan brand ini: kurang cocok (${fit.reasons.join("; ")}). Brand Kit menang: sesuaikan gaya dengan aturan dan token brand, jangan melanggar brand demi gaya.`,
    ...stageFacts(style, stage),
    "",
    "Bagian panduan gaya:",
    "",
    guideSections(guide, STAGE_SECTIONS[stage]),
  ].join("\n");
}

function stageFacts(style: StyleMeta, stage: StyleStage): string[] {
  const { typography: t } = style;
  const type = `Tipografi: heading ${t.heading.join("/")}, kapitalisasi ${t.headingCase}, rasio headline:body ${t.scaleRatio}, tracking ${t.tracking}.`;
  if (stage === "plan" || stage === "copy") return [type];
  const options = style.options.map(
    (o) => `- ${o.name}: ${o.values.join(" | ")} (default ${o.default}) — ${o.description}`,
  );
  return [
    type,
    `Arketipe gaya ini (utamakan): ${style.archetypes.join(", ")}.`,
    options.length > 0
      ? `Opsi gaya untuk styleOptions:\n${options.join("\n")}`
      : "Gaya ini tidak punya opsi gaya; styleOptions kosong.",
  ];
}

// Arahan gaya untuk prompt gambar Codex (bahasa Inggris, sama dengan prompt aset).
export function styleImageDirection(selection: StyleSelection | null): string {
  if (!selection) return "Natural, as described.";
  const { imagery } = findStyle(selection.id);
  const avoid = imagery.avoid.length > 0 ? ` Avoid: ${imagery.avoid.join("; ")}.` : "";
  return `Treatment that suits this style: ${imagery.treatment.join(", ")}. Reference phrases: ${imagery.promptHints.join("; ")}.${avoid}`;
}
