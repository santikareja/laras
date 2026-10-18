import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ContentPlan } from "./content-plan.ts";
import { CopyDraft } from "./copy-draft.ts";
import { LayoutSpec } from "./layout-spec.ts";
import { VisualQa } from "./qa-report.ts";
import { Revision } from "./revision.ts";

// Skema yang diisi Claude dikirim lewat --json-schema (ADR-013), jadi harus bisa dikonversi.
const claudeOutputs = { ContentPlan, CopyDraft, LayoutSpec, Revision, VisualQa };

describe("konversi ke JSON Schema untuk --json-schema", () => {
  for (const [name, schema] of Object.entries(claudeOutputs)) {
    it(`${name} menjadi objek JSON Schema yang menolak key tambahan`, () => {
      const json = z.toJSONSchema(schema) as Record<string, unknown>;
      expect(json.type).toBe("object");
      expect(json.additionalProperties).toBe(false);
      expect(Array.isArray(json.required)).toBe(true);
      expect(() => JSON.stringify(json)).not.toThrow();
    });
  }

  it("slot LayoutSpec dikonversi sebagai union dengan diskriminator type", () => {
    const text = JSON.stringify(z.toJSONSchema(LayoutSpec));
    for (const type of ["text", "image", "logo", "badge"]) {
      expect(text).toContain(`"const":"${type}"`);
    }
  });
});
