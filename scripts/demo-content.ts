// Isi demo untuk `pnpm render:demo` dan test QA: spesimen brand per brand fixture, helper varian
// "maks" (setiap slot teks tepat maxChars), dan foto contoh per rasio slot. Isi arketipe ada di
// archetype-content.ts.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  type AssetManifest,
  BrandKit,
  CopyGuide,
  LayoutSpec,
  layoutIssues,
  type SlotValue,
  type TemplateMeta,
} from "../packages/shared/src/index.ts";
import { specimen, type Template } from "../packages/templates/src/index.ts";

export const BRANDS = ["kopi-lembayung", "seruni-skin", "ritme-run-club"] as const;
export type Brand = (typeof BRANDS)[number];
const FIXTURES = fileURLToPath(new URL("../fixtures/", import.meta.url));

// Foto contoh hasil Codex (fixtures/demo-assets/README.md): foto.jpg untuk semua rasio, kecuali
// brand punya foto khusus rasio slot, mis. foto-4x5.jpg.
type Asset = AssetManifest["assets"][number];
function photoFor(slug: Brand, aspectRatio: string): Asset {
  const special = `foto-${aspectRatio.replace(":", "x")}.jpg`;
  const path = existsSync(join(FIXTURES, "demo-assets", slug, special)) ? special : "foto.jpg";
  return { id: path.replace(".jpg", ""), path, width: 1122, height: 1402, source: "codex" };
}

// Isi contoh per template: teks per slot dan opsi. Varian "maks" mengisi setiap slot teks
// sampai maxChars dengan opsi maxOptions, untuk menguji batas karakter di ketiga brand.
type DemoCopy = {
  text: Record<string, string>;
  options?: Record<string, string>;
  maxOptions?: Record<string, string>;
};

const titleCase = (slug: string) =>
  slug.replace(
    /(^|-)(\w)/g,
    (_, dash: string, char: string) => `${dash ? " " : ""}${char.toUpperCase()}`,
  );

const DEMO_COPY: Record<string, (brand: BrandKit, slug: Brand) => DemoCopy> = {
  specimen: (brand, slug) => ({
    text: {
      badge: "Spesimen brand",
      title: titleCase(slug),
      body: `${brand.typography.heading.family} untuk judul, ${brand.typography.body.family} untuk isi.`,
    },
  }),
};

// Mengulang contoh sampai tepat maxChars, agar baris terpanjang yang diizinkan ikut dirender.
export function fill(sample: string, max: number): string {
  let text = sample;
  while (text.length < max) text = `${text} ${sample}`;
  return text.slice(0, max).trimEnd();
}

export function demoLayout(meta: TemplateMeta, copy: DemoCopy, max: boolean, slug: Brand) {
  const options = (max ? copy.maxOptions : copy.options) ?? {};
  const image = meta.slots.find((s) => s.type === "image");
  const photo = image?.aspectRatio ? photoFor(slug, image.aspectRatio) : undefined;
  const slots: Record<string, SlotValue> = {};
  for (const slot of meta.slots) {
    const sample = copy.text[slot.name];
    if (slot.type === "image" && photo) slots[slot.name] = { type: "image", assetId: photo.id };
    if (slot.type === "logo") {
      slots[slot.name] = { type: "logo", variant: options.tone === "dark" ? "onDark" : "primary" };
    }
    if ((slot.type === "text" || slot.type === "badge") && sample) {
      slots[slot.name] = {
        type: slot.type,
        value: max ? fill(sample, slot.maxChars ?? 0) : sample,
      };
    }
  }
  const spec = LayoutSpec.parse({
    templateId: meta.id,
    format: meta.format,
    slides: [{ slots, options }],
    assetRequests: photo
      ? [{ id: photo.id, description: "Foto contoh", aspectRatio: image?.aspectRatio }]
      : [],
  });
  const issues = layoutIssues(spec, meta);
  if (issues.length > 0) throw new Error(`Isi demo ${meta.id} tidak cocok: ${issues.join("; ")}`);
  return { spec, assets: { assets: photo ? [photo] : [] } };
}

// Folder dan konteks QA satu brand fixture.
export function demoBrand(slug: Brand) {
  const projectDir = join(FIXTURES, "brands", slug);
  const read = (file: string): unknown => JSON.parse(readFileSync(join(projectDir, file), "utf8"));
  return {
    folders: { projectDir, jobDir: join(FIXTURES, "demo-assets", slug) },
    qa: {
      brand: BrandKit.parse(read("brand.json")),
      copyGuide: CopyGuide.parse(read("copy-guide.json")),
    },
  };
}

// Kasus demo satu template untuk satu brand: "contoh", dan "maks" kecuali spesimen.
export function demoCases(template: Template, slug: Brand, brand: BrandKit) {
  const demoCopy = DEMO_COPY[template.meta.id];
  if (!demoCopy) throw new Error(`Template "${template.meta.id}" belum punya isi demo`);
  const copy = demoCopy(brand, slug);
  const variants = template === specimen ? ["contoh"] : ["contoh", "maks"];
  return variants.map((variant) => ({
    variant,
    ...demoLayout(template.meta, copy, variant === "maks", slug),
  }));
}
