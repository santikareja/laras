import {
  type BrandKit,
  type ContentFormat,
  ContentPlan,
  CopyDraft,
  isBlocking,
  type JobSpec,
  LayoutSpec,
  layoutIssues,
  logoIssues,
  type QaFix,
  QaReport,
  type RenderReport,
  type RenderRule,
  Revision,
  type StyleMeta,
  styleChoiceIssues,
  type TemplateMeta,
  type VisualQa,
} from "@laras/shared";
import type { z } from "zod";

// Aturan per tahap pipeline (ARCH 5.1, 5.2): skema Zod tahap diperketat dengan konteks job,
// sehingga runClaude mengirim ulang otomatis bila output tidak cocok (retry T-112).

type Ctx = z.core.$RefinementCtx;
const issue = (ctx: Ctx, path: string, message: string) =>
  ctx.addIssue({ code: "custom", path: [path], message });

export function planSchema(spec: JobSpec) {
  return ContentPlan.superRefine((plan, ctx) => {
    if (plan.format !== spec.format) issue(ctx, "format", `Format rencana harus ${spec.format}`);
    if (plan.slides.length !== spec.slideCount) {
      issue(ctx, "slides", `Rencana harus berisi tepat ${spec.slideCount} slide`);
    }
    if (plan.angles.length !== spec.variantCount) {
      issue(ctx, "angles", `Rencana harus berisi tepat ${spec.variantCount} angle`);
    }
  });
}

export function copySchema(plan: ContentPlan) {
  return CopyDraft.superRefine((copy, ctx) => {
    if (copy.slides.length !== plan.slides.length) {
      issue(ctx, "slides", `Copy harus berisi tepat ${plan.slides.length} slide, sesuai rencana`);
    }
  });
}

export function catalogFor(catalog: TemplateMeta[], format: ContentFormat): TemplateMeta[] {
  return catalog.filter((meta) => meta.format === format);
}

type LayoutContext = {
  catalog: TemplateMeta[];
  slideCount: number;
  logo: BrandKit["logo"];
  // Gaya job dan variannya (T-133); null tanpa gaya.
  style: { meta: StyleMeta; variant: string } | null;
  // Arahan foto brand terstruktur (T-124), untuk perlakuan foto gaya.
  photo?: NonNullable<BrandKit["constraints"]>["photo"];
};

// Katalog untuk prompt: arketipe gaya job lebih dulu (T-133), sisanya tetap boleh dipilih.
export function catalogForStyle(catalog: TemplateMeta[], style: StyleMeta | null): TemplateMeta[] {
  if (!style) return catalog;
  const own = catalog.filter((meta) => style.archetypes.includes(meta.id));
  return [...own, ...catalog.filter((meta) => !style.archetypes.includes(meta.id))];
}

// styleOptions hanya sah untuk job bergaya dan hanya memakai opsi gaya itu (T-133). Brand yang
// mewajibkan kulit asli (T-124): foto dan cut-out orang memakai perlakuan `foto: natural` bila gaya
// menawarkannya, karena bawaan gaya (mono, hangat) adalah filter berat.
function styleOptionIssues(
  layout: LayoutSpec,
  style: LayoutContext["style"],
  photo: LayoutContext["photo"],
): string[] {
  const options = layout.styleOptions ?? {};
  if (!style) {
    return Object.keys(options).length > 0 ? ["Tanpa gaya desain, styleOptions harus kosong"] : [];
  }
  const issues = styleChoiceIssues(
    { id: style.meta.id, variant: style.variant, options },
    style.meta,
  );
  const naturalOffered = style.meta.options.some(
    (o) => o.name === "foto" && o.values.includes("natural"),
  );
  const people = layout.assetRequests.some((r) => r.kind !== "cutout" || r.subject === "person");
  if (photo?.realSkin && naturalOffered && people && options.foto !== "natural") {
    issues.push('Brand mewajibkan tekstur kulit asli: isi styleOptions "foto" dengan "natural"');
  }
  return issues;
}

// Layout harus cocok dengan katalog dan Brand Kit: template, slot, opsi, jumlah slide, dan varian
// logo yang benar-benar ada (T-119), agar kesalahan masuk retry validasi, bukan gagal di render.
function layoutContextIssues(
  layout: LayoutSpec,
  { catalog, slideCount, logo, style, photo }: LayoutContext,
) {
  const meta = catalog.find((t) => t.id === layout.templateId && t.format === layout.format);
  if (!meta)
    return [`Template "${layout.templateId}" tidak ada di katalog format ${layout.format}`];
  const count =
    layout.slides.length === slideCount ? [] : [`Layout harus berisi ${slideCount} slide`];
  return [
    ...layoutIssues(layout, meta),
    ...count,
    ...logoIssues(layout, logo),
    ...styleOptionIssues(layout, style, photo),
  ];
}

export function layoutSchema(context: LayoutContext) {
  return LayoutSpec.superRefine((layout, ctx) => {
    for (const message of layoutContextIssues(layout, context)) issue(ctx, "slides", message);
  });
}

export function revisionSchema(context: LayoutContext) {
  const { slideCount } = context;
  return Revision.superRefine((revision, ctx) => {
    for (const message of layoutContextIssues(revision.layout, context)) {
      issue(ctx, "layout", message);
    }
    if (revision.copy.slides.length !== slideCount) {
      issue(ctx, "copy", `Copy harus berisi ${slideCount} slide`);
    }
  });
}

// Ambang lolos QA visual default (PRD F9, keputusan pemilik T-126): rata-rata ≥ 8, tidak ada aspek
// < 7, dan ide serta kesan profesional ≥ 8 (inti keluhan T-117: generik dan AI-slop).
export const VISUAL_PASS = { average: 8, minimum: 7, core: { idea: 8, professionalism: 8 } };

export function visualPassed(visual: VisualQa): boolean {
  const scores = Object.values(visual.scores);
  const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const core = Object.entries(VISUAL_PASS.core).every(
    ([aspect, min]) => visual.scores[aspect as keyof VisualQa["scores"]] >= min,
  );
  return average >= VISUAL_PASS.average && Math.min(...scores) >= VISUAL_PASS.minimum && core;
}

// Tahap tempat perbaikan untuk cek deterministik yang gagal (ARCH 5.4).
const RULE_TARGET: Record<RenderRule, QaFix["target"]> = {
  contrast: "layout",
  overflow: "copy",
  "safe-margin": "layout",
  "font-size": "layout",
  "brand-font": "layout",
  "brand-color": "layout",
  "forbidden-word": "copy",
  "emoji-hashtag": "copy",
  "asset-load": "assets",
  // Aturan brand terstruktur (T-124): posisi logo, gradient, dan jumlah visual diatur layout.
  "brand-logo-position": "layout",
  "brand-gradient": "layout",
  "brand-visuals": "layout",
  // Aturan desain (T-130) diperbaiki di tahap layout.
  alignment: "layout",
  hierarchy: "layout",
  typography: "layout",
  thirds: "layout",
  "color-balance": "layout",
  whitespace: "layout",
  "element-count": "layout",
  consistency: "layout",
};

export function deterministicFixes(render: RenderReport): QaFix[] {
  return render.slides.flatMap((slide) =>
    slide.checks.filter(isBlocking).map((check) => ({
      target: RULE_TARGET[check.rule],
      severity: "wajib" as const,
      slideIndex: slide.index,
      instruction: check.target ? `${check.message} (${check.target})` : check.message,
    })),
  );
}

export function qaReport(round: number, render: RenderReport, visual: VisualQa | null): QaReport {
  const failures = render.slides.flatMap((slide) => slide.checks.filter(isBlocking));
  const deterministicPassed = failures.length === 0;
  return QaReport.parse({
    round,
    deterministic: { passed: deterministicPassed, failures },
    visual,
    fixes: deterministicPassed ? (visual?.fixes ?? []) : deterministicFixes(render),
    // Lolos hanya bila skor cukup DAN tidak ada perbaikan wajib (T-118); saran disimpan untuk UI.
    passed:
      deterministicPassed &&
      visual !== null &&
      visualPassed(visual) &&
      !visual.fixes.some((fix) => fix.severity === "wajib"),
  });
}
