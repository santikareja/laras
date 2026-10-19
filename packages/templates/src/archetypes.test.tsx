import { TemplateMeta } from "@laras/shared";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { archetypes } from "./archetypes.ts";
import { templates } from "./catalog.ts";
import type { ResolvedSlot, Template } from "./template.ts";

// Arketipe yang disetujui di T-122 (ADR-015): meta sah, bisa dirender, belum di katalog Claude
// (diganti di T-131), dan letak teks mengikuti titik fokus subjek (PRD 4 P8).

const focusAt = (y: number) => ({
  box: { left: 0.2, top: 0.05, right: 0.8, bottom: 1 },
  focus: { x: 0.5, y },
});

function slots(template: Template, subjectY?: number): Record<string, ResolvedSlot> {
  const result: Record<string, ResolvedSlot> = {};
  for (const slot of template.meta.slots.filter((s) => s.required)) {
    if (slot.type === "image") {
      result[slot.name] =
        slot.cutout && subjectY !== undefined
          ? { type: "image", src: "a.webp", subject: focusAt(subjectY) }
          : { type: "image", src: "a.webp" };
    } else if (slot.type === "logo") result[slot.name] = { type: "logo", src: "logo.svg" };
    else result[slot.name] = { type: slot.type, value: `Isi ${slot.name}` };
  }
  return result;
}

const render = (template: Template, subjectY?: number, options = {}) =>
  renderToStaticMarkup(
    <template.Slide slots={slots(template, subjectY)} options={options} index={0} total={1} />,
  );

describe("arketipe", () => {
  it("id unik, berawalan feed-, dan menjadi katalog Claude (T-131)", () => {
    const ids = archetypes.map((a) => a.meta.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^feed-/);
    expect(templates.map((t) => t.meta.id)).toEqual(ids);
  });

  it.each(archetypes.map((a) => [a.meta.id, a] as const))(
    "%s: meta sah dan slot wajib dirender",
    (_, template) => {
      expect(TemplateMeta.safeParse(template.meta).success).toBe(true);
      const markup = render(template, 0.3);
      for (const slot of template.meta.slots.filter((s) => s.required)) {
        expect(markup).toContain(`data-slot="${slot.name}"`);
      }
      expect(template.meta.options.map((o) => o.name)).not.toContain("width");
    },
  );

  it("bidang warna: blok teks di bawah bila fokus subjek tinggi, di atas bila rendah", () => {
    const bidang = archetypes.find((a) => a.meta.id === "feed-bidang-warna");
    if (!bidang) throw new Error("arketipe bidang warna tidak ada");
    expect(render(bidang, 0.1)).not.toContain("top:calc(var(--space-safe) + var(--space-1))");
    expect(render(bidang, 0.9)).toContain("top:calc(var(--space-safe) + var(--space-1))");
  });

  it("kata raksasa: headline di bawah bila fokus tinggi, di tengah bila rendah", () => {
    const kata = archetypes.find((a) => a.meta.id === "feed-kata-raksasa");
    if (!kata) throw new Error("arketipe kata raksasa tidak ada");
    expect(render(kata, 0.1)).not.toContain("top:46%");
    expect(render(kata, 0.9)).toContain("top:46%");
  });
});
