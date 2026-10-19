import type { BrandKit, RenderCheck } from "@laras/shared";
import type { DesignMeasurements } from "./design.ts";
import type { Measurements } from "./rules.ts";

// Aturan brand terstruktur (BrandKit.constraints, PRD 4 prinsip 8, T-124): bertingkat wajib, satu
// cek gagal per pelanggaran, satu cek lolos per aturan yang dipakai brand. Aturan yang tidak
// dipakai brand tidak menghasilkan cek.

type Corner = NonNullable<NonNullable<BrandKit["constraints"]>["logoPosition"]>;

const CORNER_NAMES: Record<Corner, string> = {
  "top-left": "kiri atas",
  "top-right": "kanan atas",
  "bottom-left": "kiri bawah",
  "bottom-right": "kanan bawah",
};

// Elemen visual utama: gambar (foto, cut-out), foto latar, dan bentuk bernama; dekor tidak dihitung.
const MAIN_VISUALS = new Set(["image", "background", "shape"]);

const pass = (rule: RenderCheck["rule"], message: string): RenderCheck => ({
  rule,
  passed: true,
  message,
});
const fail = (rule: RenderCheck["rule"], target: string, message: string): RenderCheck => ({
  rule,
  passed: false,
  target,
  message,
});

export function brandRuleChecks(
  m: Measurements,
  design: DesignMeasurements,
  brand: BrandKit,
): RenderCheck[] {
  const rules = brand.constraints;
  if (!rules) return [];
  const checks: RenderCheck[] = [];
  if (rules.logoPosition) checks.push(...logoChecks(m, rules.logoPosition));
  if (rules.noGradient) {
    checks.push(
      ...(m.gradients.length > 0
        ? m.gradients.map((target) =>
            fail("brand-gradient", target, "Gradient dipakai, aturan brand: tanpa gradient"),
          )
        : [pass("brand-gradient", "Tanpa gradient sesuai aturan brand")]),
    );
  }
  if (rules.maxMainVisuals !== undefined) {
    const visuals = design.elements.filter((e) => MAIN_VISUALS.has(e.kind));
    checks.push(
      visuals.length > rules.maxMainVisuals
        ? {
            ...fail(
              "brand-visuals",
              "slide",
              `${visuals.length} elemen visual utama (${visuals.map((v) => v.name).join(", ")}), aturan brand maksimal ${rules.maxMainVisuals}`,
            ),
            measured: visuals.length,
            threshold: rules.maxMainVisuals,
          }
        : pass("brand-visuals", `Elemen visual utama dalam batas brand (${rules.maxMainVisuals})`),
    );
  }
  return checks;
}

function logoChecks(m: Measurements, corner: Corner): RenderCheck[] {
  const { width, height } = m.canvas;
  const wrong = m.slots
    .filter((s) => s.type === "logo")
    .map((s) => {
      const x = (s.rect.left + s.rect.right) / 2;
      const y = (s.rect.top + s.rect.bottom) / 2;
      const at =
        `${y < height / 2 ? "top" : "bottom"}-${x < width / 2 ? "left" : "right"}` as Corner;
      return { slot: s.slot, at };
    })
    .filter((logo) => logo.at !== corner);
  if (wrong.length === 0) {
    return [pass("brand-logo-position", `Logo di ${CORNER_NAMES[corner]} sesuai aturan brand`)];
  }
  return wrong.map((logo) =>
    fail(
      "brand-logo-position",
      logo.slot,
      `Logo di ${CORNER_NAMES[logo.at]}, aturan brand: ${CORNER_NAMES[corner]}`,
    ),
  );
}
