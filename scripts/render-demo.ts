// Render spesimen brand dan semua template × tiga brand fixture ke out/demo (CLAUDE.md, ARCH 10).
// Dijalankan lewat `pnpm render:demo` (tsx, karena template berupa JSX).
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import {
  type AssetManifest,
  BrandKit,
  LayoutSpec,
  layoutIssues,
  type SlotValue,
  type TemplateMeta,
} from "../packages/shared/src/index.ts";
import { renderLayoutHtml } from "../packages/sidecar/src/render/layout.ts";
import { toMaster, toUpload } from "../packages/sidecar/src/render/postprocess.ts";
import { createRenderer } from "../packages/sidecar/src/render/renderer.ts";
import { specimen, type Template, templates } from "../packages/templates/src/index.ts";

const BRANDS = ["kopi-lembayung", "seruni-skin", "ritme-run-club"] as const;
type Brand = (typeof BRANDS)[number];
const OUT_DIR = resolve("out/demo");

// Foto contoh hasil Codex (fixtures/demo-assets/README.md), satu per brand.
const PHOTO: AssetManifest["assets"][number] = {
  id: "foto",
  path: "foto.jpg",
  width: 1122,
  height: 1402,
  source: "codex",
};

// Isi contoh per template: teks per slot dan opsi. Varian "maks" mengisi setiap slot teks
// sampai maxChars dengan opsi maxOptions, untuk menguji batas karakter di ketiga brand.
type DemoCopy = {
  text: Record<string, string>;
  options?: Record<string, string>;
  maxOptions?: Record<string, string>;
};

const FOTO_TEKS: Record<Brand, DemoCopy> = {
  "kopi-lembayung": {
    text: {
      badge: "Menu tetap",
      headline: "Kopi susu gula aren, diseduh pelan",
      body: "Biji Jawa Barat yang kami sangrai sendiri tiap minggu. Manisnya pas untuk pagi.",
      cta: "Mampir sebelum kerja",
    },
    options: { tone: "light" },
    maxOptions: { tone: "secondary" },
  },
  "seruni-skin": {
    text: {
      badge: "Facial hidrasi",
      headline: "Kulit lembap dimulai dari konsultasi",
      body: "Terapis memeriksa kondisi kulitmu dulu, lalu menyesuaikan perawatan.",
      cta: "Jadwalkan konsultasi gratis",
    },
    options: { tone: "secondary" },
    maxOptions: { tone: "light" },
  },
  "ritme-run-club": {
    text: {
      badge: "Sunday group run",
      headline: "Every pace has a group waiting",
      body: "Pace groups from 5:00 to 8:30 min/km. Every run ends with coffee and stretching.",
      cta: "Show up at 5:45 AM",
    },
    options: { tone: "light" },
    maxOptions: { tone: "secondary" },
  },
};

const SOROTAN: Record<Brand, DemoCopy> = {
  "kopi-lembayung": {
    text: {
      badge: "Setiap hari",
      highlight: "06.30",
      headline: "Teras kami sudah buka sepagi ini",
      body: "Kursi teras sudah kami lap. Tinggal kamu yang datang.",
      cta: "Pesan kopimu di teras",
    },
    options: { tone: "dark" },
    maxOptions: { tone: "light" },
  },
  "seruni-skin": {
    text: {
      badge: "Konsultasi",
      highlight: "Gratis",
      headline: "Kenali kulitmu sebelum memilih perawatan",
      body: "30 menit bersama terapis bersertifikat untuk memahami kebutuhan kulitmu.",
      cta: "Jadwalkan lewat WhatsApp",
    },
    options: { tone: "dark" },
    maxOptions: { tone: "light" },
  },
  "ritme-run-club": {
    text: {
      badge: "Sunday",
      highlight: "5K",
      headline: "Free group run, every pace welcome",
      body: "Meet at 5:45 AM. The 8:30 pace group walks and runs, so nobody runs alone.",
      cta: "Save your spot",
    },
    options: { tone: "dark" },
    maxOptions: { tone: "light" },
  },
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
  "feed-foto-teks": (_, slug) => FOTO_TEKS[slug],
  "feed-sorotan": (_, slug) => SOROTAN[slug],
};

// Mengulang contoh sampai tepat maxChars, agar baris terpanjang yang diizinkan ikut dirender.
function fill(sample: string, max: number): string {
  let text = sample;
  while (text.length < max) text = `${text} ${sample}`;
  return text.slice(0, max).trimEnd();
}

function demoLayout(meta: TemplateMeta, copy: DemoCopy, max: boolean): LayoutSpec {
  const options = (max ? copy.maxOptions : copy.options) ?? {};
  const slots: Record<string, SlotValue> = {};
  for (const slot of meta.slots) {
    const sample = copy.text[slot.name];
    if (slot.type === "image") slots[slot.name] = { type: "image", assetId: PHOTO.id };
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
  const image = meta.slots.find((s) => s.type === "image");
  const spec = LayoutSpec.parse({
    templateId: meta.id,
    format: meta.format,
    slides: [{ slots, options }],
    assetRequests: image
      ? [{ id: PHOTO.id, description: "Foto contoh", aspectRatio: image.aspectRatio }]
      : [],
  });
  const issues = layoutIssues(spec, meta);
  if (issues.length > 0) throw new Error(`Isi demo ${meta.id} tidak cocok: ${issues.join("; ")}`);
  return spec;
}

async function main() {
  await rm(OUT_DIR, { recursive: true, force: true });
  await mkdir(OUT_DIR, { recursive: true });
  const renderer = createRenderer();
  try {
    const catalog: Template[] = [specimen, ...templates];
    for (const template of catalog) {
      const demoCopy = DEMO_COPY[template.meta.id];
      if (!demoCopy) throw new Error(`Template "${template.meta.id}" belum punya isi demo`);
      for (const slug of BRANDS) {
        const projectDir = resolve("fixtures/brands", slug);
        const jobDir = resolve("fixtures/demo-assets", slug);
        const brand = BrandKit.parse(
          JSON.parse(await readFile(join(projectDir, "brand.json"), "utf8")),
        );
        const copy = demoCopy(brand, slug);
        const variants = template === specimen ? ["contoh"] : ["contoh", "maks"];
        for (const variant of variants) {
          const spec = demoLayout(template.meta, copy, variant === "maks");
          const assets = { assets: [PHOTO] };
          const pages = renderLayoutHtml(spec, { brand, assets, templates: catalog });
          for (const [index, html] of pages.entries()) {
            const name = `${template.meta.id}-${slug}-${variant}-${index + 1}`;
            const master = await toMaster(await renderer.render(html, { projectDir, jobDir }));
            await writeFile(join(OUT_DIR, `${name}.png`), master);
            await writeFile(join(OUT_DIR, `${name}-1080.png`), await toUpload(master, "png"));
            console.log(`out/demo/${name}.png`);
          }
        }
      }
    }
  } finally {
    await renderer.close();
  }
}

await main();
