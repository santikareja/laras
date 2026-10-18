// Isi demo untuk `pnpm render:demo` dan test QA: copy contoh per template × brand fixture,
// varian "maks" (setiap slot teks tepat maxChars), dan foto contoh per rasio slot.
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

const FOTO_PENUH: Record<Brand, DemoCopy> = {
  "kopi-lembayung": {
    text: {
      badge: "Biji baru",
      headline: "Sangrai minggu ini sudah siap",
      body: "Biji Jawa Barat 200 g. Tanggal sangrai tertulis di kemasan.",
      cta: "Ambil di kedai",
    },
    options: { tone: "light", position: "top" },
    maxOptions: { tone: "dark", position: "bottom" },
  },
  "seruni-skin": {
    text: {
      badge: "Edukasi",
      headline: "Pori dan tekstur itu bagian dari kulit sehat",
      body: "Kami merawat kulitmu, bukan menutupinya. Konsultasi dulu, perawatan kemudian.",
      cta: "Baca penjelasan lengkapnya",
    },
    options: { tone: "light", position: "bottom" },
    maxOptions: { tone: "dark", position: "top" },
  },
  "ritme-run-club": {
    text: {
      badge: "Ritme 10K City Race",
      headline: "Your first 10K starts on Sunday",
      body: "Train with pace groups from 5:00 to 8:30 min/km before race day.",
      cta: "Save your spot",
    },
    options: { tone: "dark", position: "bottom" },
    maxOptions: { tone: "light", position: "bottom" },
  },
};

const KUTIPAN: Record<Brand, DemoCopy> = {
  "kopi-lembayung": {
    text: {
      badge: "Kata pelanggan",
      quote: "Teras kecil ini tempat saya memulai pagi sebelum kerja, sejak kedai ini buka.",
      attribution: "Rina, pelanggan sejak 2022",
    },
    options: { tone: "secondary" },
    maxOptions: { tone: "dark" },
  },
  "seruni-skin": {
    text: {
      badge: "Cerita klien",
      quote: "Saya jadi paham kenapa kulit saya kering, bukan sekadar ditawari produk.",
      attribution: "Dimas, klien facial hidrasi",
    },
    options: { tone: "dark" },
    maxOptions: { tone: "secondary" },
  },
  "ritme-run-club": {
    text: {
      badge: "Member story",
      quote: "I joined the 8:30 pace group as a walker. Six months later I ran my first 10K.",
      attribution: "Sari, member since 2024",
    },
    options: { tone: "secondary" },
    maxOptions: { tone: "dark" },
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
  "feed-foto-penuh": (_, slug) => FOTO_PENUH[slug],
  "feed-kutipan": (_, slug) => KUTIPAN[slug],
};

// Mengulang contoh sampai tepat maxChars, agar baris terpanjang yang diizinkan ikut dirender.
function fill(sample: string, max: number): string {
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
