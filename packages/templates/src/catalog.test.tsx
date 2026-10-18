import { TemplateMeta } from "@laras/shared";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { specimen } from "../specimen/Specimen.tsx";
import { templates } from "./catalog.ts";
import type { ResolvedSlot, Template } from "./template.ts";

// Isi setiap slot sesuai tipenya; opsional ikut diisi bila `withOptional`.
function filledSlots(meta: TemplateMeta, withOptional: boolean): Record<string, ResolvedSlot> {
  const slots: Record<string, ResolvedSlot> = {};
  for (const slot of meta.slots) {
    if (!slot.required && !withOptional) continue;
    if (slot.type === "image") slots[slot.name] = { type: "image", src: "foto.jpg" };
    else if (slot.type === "logo") slots[slot.name] = { type: "logo", src: "logo.svg" };
    else slots[slot.name] = { type: slot.type, value: `Isi ${slot.name}` };
  }
  return slots;
}

const render = (template: Template, slots: Record<string, ResolvedSlot>, options = {}) =>
  renderToStaticMarkup(<template.Slide slots={slots} options={options} index={0} total={1} />);

const slotNames = (markup: string) =>
  [...markup.matchAll(/data-slot="([^"]+)"/g)].map((match) => match[1]).sort();

describe("katalog template", () => {
  it("berisi template feed dengan id unik, tanpa spesimen", () => {
    const ids = templates.map((t) => t.meta.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).not.toContain(specimen.meta.id);
    expect(templates.length).toBeGreaterThanOrEqual(2);
  });

  describe.each([...templates, specimen].map((t) => [t.meta.id, t] as const))(
    "%s",
    (_, template) => {
      it("meta lolos skema TemplateMeta", () => {
        expect(TemplateMeta.safeParse(template.meta).success).toBe(true);
      });

      it("merender setiap slot di meta dengan data-slot yang sama", () => {
        const markup = render(template, filledSlots(template.meta, true));
        expect(slotNames(markup)).toEqual(template.meta.slots.map((s) => s.name).sort());
      });

      it("tetap merender tanpa slot opsional", () => {
        const required = template.meta.slots.filter((s) => s.required).map((s) => s.name);
        expect(slotNames(render(template, filledSlots(template.meta, false)))).toEqual(
          required.sort(),
        );
      });

      it("menerima setiap nilai opsi yang diizinkan", () => {
        const slots = filledSlots(template.meta, true);
        for (const option of template.meta.options) {
          const outputs = option.values.map((value) =>
            render(template, slots, { [option.name]: value }),
          );
          expect(new Set(outputs).size).toBe(option.values.length);
        }
      });
    },
  );
});
