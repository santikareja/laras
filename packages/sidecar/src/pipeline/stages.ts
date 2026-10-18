import {
  type ContentFormat,
  ContentPlan,
  CopyDraft,
  type JobSpec,
  LayoutSpec,
  layoutIssues,
  type QaFix,
  QaReport,
  type RenderReport,
  type RenderRule,
  Revision,
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

function catalogIssues(layout: LayoutSpec, catalog: TemplateMeta[], slideCount: number): string[] {
  const meta = catalog.find((t) => t.id === layout.templateId && t.format === layout.format);
  if (!meta)
    return [`Template "${layout.templateId}" tidak ada di katalog format ${layout.format}`];
  const count =
    layout.slides.length === slideCount ? [] : [`Layout harus berisi ${slideCount} slide`];
  return [...layoutIssues(layout, meta), ...count];
}

export function layoutSchema(catalog: TemplateMeta[], slideCount: number) {
  return LayoutSpec.superRefine((layout, ctx) => {
    for (const message of catalogIssues(layout, catalog, slideCount)) issue(ctx, "slides", message);
  });
}

export function revisionSchema(catalog: TemplateMeta[], slideCount: number) {
  return Revision.superRefine((revision, ctx) => {
    for (const message of catalogIssues(revision.layout, catalog, slideCount)) {
      issue(ctx, "layout", message);
    }
    if (revision.copy.slides.length !== slideCount) {
      issue(ctx, "copy", `Copy harus berisi ${slideCount} slide`);
    }
  });
}

// Ambang lolos QA visual default (PRD F9): rata-rata ≥ 8 dan tidak ada aspek < 7.
export const VISUAL_PASS = { average: 8, minimum: 7 };

export function visualPassed(visual: VisualQa): boolean {
  const scores = Object.values(visual.scores);
  const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  return average >= VISUAL_PASS.average && Math.min(...scores) >= VISUAL_PASS.minimum;
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
};

export function deterministicFixes(render: RenderReport): QaFix[] {
  return render.slides.flatMap((slide) =>
    slide.checks
      .filter((check) => !check.passed)
      .map((check) => ({
        target: RULE_TARGET[check.rule],
        severity: "wajib" as const,
        slideIndex: slide.index,
        instruction: check.target ? `${check.message} (${check.target})` : check.message,
      })),
  );
}

export function qaReport(round: number, render: RenderReport, visual: VisualQa | null): QaReport {
  const failures = render.slides.flatMap((slide) => slide.checks.filter((check) => !check.passed));
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
