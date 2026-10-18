import { TemplateMeta } from "@laras/shared";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { templates } from "../src/catalog.ts";
import type { ResolvedSlot } from "../src/template.ts";
import { prototypes } from "./index.ts";

// Prototipe arketipe T-122: meta sah, bisa dirender dengan slot wajib saja, dan tidak ikut
// katalog yang dikirim ke Claude.
describe("prototipe arketipe", () => {
  it("tidak ada di katalog dan id unik", () => {
    const ids = prototypes.map((p) => p.meta.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(templates.map((t) => t.meta.id)).not.toContain(id);
  });

  it.each(prototypes.map((p) => [p.meta.id, p] as const))("%s", (_, template) => {
    expect(TemplateMeta.safeParse(template.meta).success).toBe(true);
    const slots: Record<string, ResolvedSlot> = {};
    for (const slot of template.meta.slots.filter((s) => s.required)) {
      if (slot.type === "image") slots[slot.name] = { type: "image", src: "a.png" };
      else if (slot.type === "logo") slots[slot.name] = { type: "logo", src: "logo.svg" };
      else slots[slot.name] = { type: slot.type, value: `Isi ${slot.name}` };
    }
    const markup = renderToStaticMarkup(
      <template.Slide slots={slots} options={{}} index={0} total={1} />,
    );
    for (const slot of template.meta.slots.filter((s) => s.required)) {
      expect(markup).toContain(`data-slot="${slot.name}"`);
    }
  });
});
