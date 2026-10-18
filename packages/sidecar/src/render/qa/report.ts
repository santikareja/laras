import type { RenderReport } from "@laras/shared";

// RenderReport untuk tahap render (ARCH 5.2): index berurutan dan passed dari semua cek.
export type RenderedSlideInput = Omit<RenderReport["slides"][number], "index">;

export function buildRenderReport(slides: RenderedSlideInput[]): RenderReport {
  const indexed = slides.map((slide, index) => ({ index, ...slide }));
  return {
    slides: indexed,
    passed: indexed.every((slide) => slide.checks.every((check) => check.passed)),
  };
}
