import { z } from "zod";
import { AspectRatio, ContentFormat, duplicates, Slug } from "./common.ts";
import type { LayoutSpec } from "./layout-spec.ts";

// Meta template (ARCH 6.2): katalog yang dikirim ke Claude di tahap layout, sehingga Claude
// memilih template dan mengisi slot dalam batas yang sudah dikurasi.

const Name = z.string().regex(/^[a-z][a-zA-Z0-9]*$/, "Nama berformat camelCase, mis. headline");

export const TemplateSlot = z
  .strictObject({
    name: Name,
    type: z.enum(["text", "image", "logo", "badge"]),
    required: z.boolean(),
    description: z.string().min(1),
    maxChars: z.int().positive().optional(),
    aspectRatio: AspectRatio.optional(),
    // Slot gambar yang membutuhkan subjek cut-out berlatar transparan (T-123).
    cutout: z.boolean().optional(),
    // Kontrak komposisi gambar untuk model gambar (T-141, bahasa Inggris): kalimat dasar, dan
    // kalimat per nilai satu opsi (mis. sisi subjek), dirangkai sistem dari opsi layout.
    composition: z
      .strictObject({
        base: z.string().min(1),
        option: z.string().min(1).optional(),
        byValue: z.record(z.string(), z.string().min(1)).optional(),
      })
      .refine((c) => (c.option === undefined) === (c.byValue === undefined), {
        message: "option dan byValue komposisi diisi bersamaan",
      })
      .optional(),
  })
  .superRefine((slot, ctx) => {
    const textual = slot.type === "text" || slot.type === "badge";
    if (textual !== (slot.maxChars !== undefined)) {
      ctx.addIssue({
        code: "custom",
        path: ["maxChars"],
        message: "maxChars wajib untuk slot text dan badge, dan hanya untuk keduanya",
      });
    }
    if ((slot.type === "image") !== (slot.aspectRatio !== undefined)) {
      ctx.addIssue({
        code: "custom",
        path: ["aspectRatio"],
        message: "aspectRatio wajib untuk slot image, dan hanya untuk image",
      });
    }
    if (slot.cutout !== undefined && slot.type !== "image") {
      ctx.addIssue({ code: "custom", path: ["cutout"], message: "cutout hanya untuk slot image" });
    }
    if (slot.composition !== undefined && slot.type !== "image") {
      ctx.addIssue({
        code: "custom",
        path: ["composition"],
        message: "composition hanya untuk slot image",
      });
    }
  });
export type TemplateSlot = z.infer<typeof TemplateSlot>;

export const TemplateOption = z
  .strictObject({
    name: Name,
    values: z.array(Slug).min(2),
    default: Slug,
    description: z.string().min(1),
  })
  .refine((option) => option.values.includes(option.default), {
    message: "Default opsi harus salah satu nilainya",
    path: ["default"],
  });
export type TemplateOption = z.infer<typeof TemplateOption>;

export const TemplateMeta = z
  .strictObject({
    id: Slug,
    name: z.string().min(1),
    format: ContentFormat,
    description: z.string().min(1),
    slots: z.array(TemplateSlot).min(1),
    options: z.array(TemplateOption),
  })
  .superRefine((meta, ctx) => {
    for (const [key, names] of [
      ["slots", meta.slots.map((s) => s.name)],
      ["options", meta.options.map((o) => o.name)],
    ] as const) {
      for (const name of duplicates(names)) {
        ctx.addIssue({ code: "custom", path: [key], message: `Nama "${name}" dipakai dua kali` });
      }
    }
  });
export type TemplateMeta = z.infer<typeof TemplateMeta>;

// Kecocokan LayoutSpec dengan meta template: slot wajib, tipe, batas karakter, rasio aset,
// dan opsi. Mengembalikan daftar masalah (kosong bila cocok).
export function layoutIssues(spec: LayoutSpec, meta: TemplateMeta): string[] {
  if (spec.templateId !== meta.id) return [`LayoutSpec untuk template "${spec.templateId}"`];
  const issues: string[] = [];
  if (spec.format !== meta.format) issues.push(`Template "${meta.id}" untuk format ${meta.format}`);
  spec.slides.forEach((slide, index) => {
    const at = `Slide ${index + 1}`;
    for (const slot of meta.slots) {
      const value = slide.slots[slot.name];
      if (!value) {
        if (slot.required) issues.push(`${at}: slot "${slot.name}" wajib diisi`);
        continue;
      }
      if (value.type !== slot.type) {
        issues.push(`${at}: slot "${slot.name}" harus bertipe ${slot.type}`);
      } else if ("value" in value && slot.maxChars && value.value.length > slot.maxChars) {
        issues.push(`${at}: slot "${slot.name}" melebihi ${slot.maxChars} karakter`);
      } else if (value.type === "image") {
        const request = spec.assetRequests.find((r) => r.id === value.assetId);
        if (request && request.aspectRatio !== slot.aspectRatio) {
          issues.push(`${at}: aset "${value.assetId}" harus berasio ${slot.aspectRatio}`);
        }
        const cutout = (request?.kind ?? "photo") === "cutout";
        if (request && cutout !== (slot.cutout ?? false)) {
          issues.push(
            `${at}: slot "${slot.name}" membutuhkan aset ${slot.cutout ? "cutout" : "foto"} (kind "${slot.cutout ? "cutout" : "photo"}")`,
          );
        }
      }
    }
    for (const name of Object.keys(slide.slots)) {
      if (!meta.slots.some((s) => s.name === name))
        issues.push(`${at}: slot "${name}" tidak dikenal`);
    }
    for (const [name, value] of Object.entries(slide.options)) {
      const option = meta.options.find((o) => o.name === name);
      if (!option) issues.push(`${at}: opsi "${name}" tidak dikenal`);
      else if (!option.values.includes(value)) {
        issues.push(`${at}: opsi "${name}" harus salah satu dari ${option.values.join(", ")}`);
      }
    }
  });
  return issues;
}

// Arahan komposisi satu slot gambar untuk opsi layout yang dipilih (T-141): kalimat dasar
// ditambah kalimat untuk nilai opsinya (atau nilai default opsi bila layout tidak mengisinya).
export function slotComposition(
  slot: TemplateSlot,
  meta: TemplateMeta,
  options: Record<string, string>,
): string | undefined {
  const composition = slot.composition;
  if (!composition) return undefined;
  const name = composition.option;
  if (!name || !composition.byValue) return composition.base;
  const value = options[name] ?? meta.options.find((o) => o.name === name)?.default;
  const extra = value === undefined ? undefined : composition.byValue[value];
  return extra ? `${composition.base} ${extra}` : composition.base;
}
