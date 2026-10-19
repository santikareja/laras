import { readFileSync } from "node:fs";
import {
  type BrandKit,
  ContentPlan,
  CopyDraft,
  type CopyGuide,
  LayoutSpec,
  logoVariants,
  Revision,
  VisualQa,
} from "@laras/shared";
import { z } from "zod";

// Prompt runtime per tahap (ARCH 5.2, CLAUDE.md Prompt Agent): file .md dengan placeholder
// {{nama}}. {{schema}} diisi JSON Schema dari skema Zod tahap. Data pengguna dan output AI
// sebelumnya ditaruh di blok <tag>{{nama}}</tag> yang ditandai sebagai data (ARCH 9).

export const STAGE_SCHEMAS = {
  plan: ContentPlan,
  copy: CopyDraft,
  layout: LayoutSpec,
  "qa-visual": VisualQa,
  revise: Revision,
} as const;
export type Stage = keyof typeof STAGE_SCHEMAS;

export type PromptInputs = {
  plan: {
    brief: string;
    brand: string;
    knowledge: string;
    format: string;
    slideCount: string;
    variantCount: string;
    style: string;
  };
  copy: {
    brief: string;
    brand: string;
    knowledge: string;
    plan: string;
    angle: string;
    style: string;
  };
  layout: {
    brand: string;
    copy: string;
    angle: string;
    catalog: string;
    templatePreference: string;
    usedTemplates: string;
    userAssets: string;
    style: string;
  };
  "qa-visual": {
    brand: string;
    copy: string;
    layout: string;
    deterministic: string;
    references: string;
    slides: string;
    style: string;
  };
  revise: {
    brand: string;
    copy: string;
    layout: string;
    catalog: string;
    fixes: string;
    style: string;
  };
};

// Blok data: tag pembuka, satu placeholder, tag penutup, masing-masing di barisnya sendiri.
export const DATA_BLOCK = /<([a-z][a-z-]*)>\n\{\{(\w+)\}\}\n<\/\1>/g;

export function promptTemplate(stage: Stage): string {
  return readFileSync(new URL(`./${stage}.md`, import.meta.url), "utf8");
}

export function renderPrompt<S extends Stage>(stage: S, inputs: PromptInputs[S]): string {
  const template = promptTemplate(stage);
  const values: Record<string, string> = {
    ...inputs,
    schema: JSON.stringify(z.toJSONSchema(STAGE_SCHEMAS[stage], { target: "draft-7" }), null, 2),
  };
  const tags = new Map([...template.matchAll(DATA_BLOCK)].map(([, tag, key]) => [key, tag]));
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const value = values[key];
    if (value === undefined) throw new Error(`Input prompt ${stage} tidak diisi: ${key}`);
    const tag = tags.get(key);
    // Tag data di dalam isi dibuang agar data tidak bisa menutup bloknya sendiri.
    return tag ? value.replace(new RegExp(`</?${tag}>`, "gi"), "").trim() : value;
  });
}

// Blok <brand> untuk semua tahap Claude: aturan copy dan aturan desain dari Brand Kit.
export function brandContext(brand: BrandKit, guide: CopyGuide): string {
  const list = (items: string[]) =>
    items.length > 0 ? items.map((item) => `- ${item}`) : ["- (tidak ada)"];
  const always =
    guide.hashtags.always.length > 0 ? `, wajib ${guide.hashtags.always.join(" ")}` : "";
  return [
    `Bahasa konten: ${guide.language === "id" ? "Indonesia" : "Inggris"} (${guide.language})`,
    `Tone: ${guide.tone}`,
    `Gaya CTA: ${guide.ctaStyle}`,
    `Kata terlarang: ${guide.forbiddenWords.join(", ") || "tidak ada"}`,
    `Emoji: ${guide.emoji.allowed ? `boleh, maksimal ${guide.emoji.max} per postingan` : "tidak boleh"}`,
    `Hashtag di caption: maksimal ${guide.hashtags.max}${always}`,
    `Varian logo tersedia: ${logoVariants(brand.logo).join(", ")}`,
    "Aturan desain dan foto brand:",
    ...list([...constraintRules(brand.constraints), ...brand.rules]),
    "Contoh copy yang baik:",
    ...list(guide.examples.good),
    "Contoh copy yang buruk:",
    ...list(guide.examples.bad),
  ].join("\n");
}

// Aturan brand terstruktur (T-124) sebagai teks untuk Claude; yang bertanda "dicek kode" juga
// ditegakkan QA renderer, sehingga pelanggarannya menjadi perbaikan wajib.
const CORNERS = {
  "top-left": "kiri atas",
  "top-right": "kanan atas",
  "bottom-left": "kiri bawah",
  "bottom-right": "kanan bawah",
} as const;

export function constraintRules(constraints: BrandKit["constraints"]): string[] {
  if (!constraints) return [];
  const photo = constraints.photo ?? {};
  return [
    constraints.logoPosition &&
      `Logo selalu di ${CORNERS[constraints.logoPosition]} (dicek kode): pilih opsi logo atau sisi yang menghasilkannya`,
    constraints.noGradient &&
      "Tanpa gradient (dicek kode): latar, cahaya, dan isi huruf memakai warna padat",
    constraints.maxMainVisuals !== undefined &&
      `Maksimal ${constraints.maxMainVisuals} elemen visual utama per slide (dicek kode): gambar, foto latar, dan bentuk; dekor tipis tidak dihitung`,
    photo.naturalLight && "Foto produk dan suasana selalu dengan cahaya alami",
    photo.noPlainBackdrop && "Foto tanpa latar putih polos",
    photo.realSkin &&
      'Tekstur kulit asli tanpa filter berat: foto orang memakai perlakuan gaya "foto: natural" bila tersedia (dicek kode)',
    photo.motion && "Orang di foto selalu bergerak, bukan pose diam",
  ].filter((rule): rule is string => typeof rule === "string");
}
