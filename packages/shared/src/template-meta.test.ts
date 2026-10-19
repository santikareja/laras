import { describe, expect, it } from "vitest";
import { LayoutSpec } from "./layout-spec.ts";
import { layoutIssues, TemplateMeta } from "./template-meta.ts";
import { issuesOf } from "./test-utils.ts";

const meta = (): TemplateMeta => ({
  id: "feed-contoh",
  name: "Contoh",
  format: "feed-4x5",
  description: "Untuk test",
  slots: [
    { name: "image", type: "image", required: true, description: "Foto", aspectRatio: "3:2" },
    { name: "headline", type: "text", required: true, description: "Judul", maxChars: 10 },
    { name: "badge", type: "badge", required: false, description: "Label", maxChars: 8 },
    { name: "logo", type: "logo", required: true, description: "Logo" },
  ],
  options: [{ name: "tone", values: ["light", "dark"], default: "light", description: "Latar" }],
});

const spec = (slots: object, options: object = {}, aspectRatio = "3:2"): LayoutSpec =>
  LayoutSpec.parse({
    templateId: "feed-contoh",
    format: "feed-4x5",
    slides: [{ slots, options }],
    assetRequests: [{ id: "foto", description: "Cangkir kopi", aspectRatio }],
  });

const validSlots = {
  image: { type: "image", assetId: "foto" },
  headline: { type: "text", value: "Kopi pagi" },
  logo: { type: "logo", variant: "primary" },
};

describe("TemplateMeta", () => {
  it("menerima meta yang lengkap", () => {
    expect(issuesOf(TemplateMeta, meta())).toEqual([]);
  });

  it("mewajibkan maxChars untuk teks/badge dan aspectRatio untuk gambar", () => {
    const noLimit = meta();
    noLimit.slots[1] = { name: "headline", type: "text", required: true, description: "Judul" };
    expect(issuesOf(TemplateMeta, noLimit)).toContain(
      "maxChars wajib untuk slot text dan badge, dan hanya untuk keduanya",
    );
    const noRatio = meta();
    noRatio.slots[0] = { name: "image", type: "image", required: true, description: "Foto" };
    expect(issuesOf(TemplateMeta, noRatio)).toContain(
      "aspectRatio wajib untuk slot image, dan hanya untuk image",
    );
  });

  it("menolak nama slot ganda dan default opsi di luar nilainya", () => {
    const twice = meta();
    twice.slots.push({ name: "logo", type: "logo", required: false, description: "Lagi" });
    expect(issuesOf(TemplateMeta, twice)).toContain('Nama "logo" dipakai dua kali');
    const badDefault = meta();
    badDefault.options = [
      { name: "tone", values: ["light", "dark"], default: "x", description: "y" },
    ];
    expect(issuesOf(TemplateMeta, badDefault)).toContain("Default opsi harus salah satu nilainya");
  });
});

describe("layoutIssues", () => {
  it("tidak melaporkan apa pun untuk LayoutSpec yang cocok", () => {
    expect(layoutIssues(spec(validSlots, { tone: "dark" }), meta())).toEqual([]);
  });

  it("melaporkan slot wajib yang kosong, tipe salah, teks terlalu panjang, dan slot asing", () => {
    const issues = layoutIssues(
      spec({
        image: { type: "text", value: "bukan gambar" },
        headline: { type: "text", value: "Judul yang terlalu panjang" },
        caption: { type: "text", value: "x" },
      }),
      meta(),
    );
    expect(issues).toEqual([
      'Slide 1: slot "image" harus bertipe image',
      'Slide 1: slot "headline" melebihi 10 karakter',
      'Slide 1: slot "logo" wajib diisi',
      'Slide 1: slot "caption" tidak dikenal',
    ]);
  });

  it("melaporkan rasio aset dan opsi yang tidak sesuai meta", () => {
    expect(layoutIssues(spec(validSlots, { tone: "biru", align: "left" }, "4:5"), meta())).toEqual([
      'Slide 1: aset "foto" harus berasio 3:2',
      'Slide 1: opsi "tone" harus salah satu dari light, dark',
      'Slide 1: opsi "align" tidak dikenal',
    ]);
  });

  it("slot cutout hanya untuk gambar dan jenis aset harus cocok (T-123)", () => {
    const badMeta = meta();
    badMeta.slots[1] = { ...badMeta.slots[1], cutout: true } as TemplateMeta["slots"][number];
    expect(issuesOf(TemplateMeta, badMeta)).toContain("cutout hanya untuk slot image");
    const cutoutMeta = meta();
    cutoutMeta.slots[0] = { ...cutoutMeta.slots[0], cutout: true } as TemplateMeta["slots"][number];
    expect(issuesOf(TemplateMeta, cutoutMeta)).toEqual([]);
    expect(layoutIssues(spec(validSlots), cutoutMeta)).toEqual([
      'Slide 1: slot "image" membutuhkan aset cutout (kind "cutout")',
    ]);
    const withCutout = spec(validSlots);
    withCutout.assetRequests = [
      { ...withCutout.assetRequests[0], kind: "cutout" } as LayoutSpec["assetRequests"][number],
    ];
    expect(layoutIssues(withCutout, cutoutMeta)).toEqual([]);
    expect(layoutIssues(withCutout, meta())).toEqual([
      'Slide 1: slot "image" membutuhkan aset foto (kind "photo")',
    ]);
  });

  it("menolak LayoutSpec untuk template atau format lain", () => {
    expect(layoutIssues({ ...spec(validSlots), templateId: "lain" }, meta())).toEqual([
      'LayoutSpec untuk template "lain"',
    ]);
    const carousel = { ...spec(validSlots), format: "carousel-4x5" as const };
    expect(layoutIssues(carousel, meta())).toContain(
      'Template "feed-contoh" untuk format feed-4x5',
    );
  });
});
