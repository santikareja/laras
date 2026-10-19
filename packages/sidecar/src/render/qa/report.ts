import { isBlocking, type RenderReport } from "@laras/shared";

// RenderReport untuk tahap render (ARCH 5.2): index berurutan; passed bila tidak ada cek wajib
// yang gagal (cek saran T-130 tidak menggagalkan).
export type RenderedSlideInput = Omit<RenderReport["slides"][number], "index">;

export function buildRenderReport(slides: RenderedSlideInput[]): RenderReport {
  const indexed = slides.map((slide, index) => ({ index, ...slide }));
  return {
    slides: indexed,
    passed: indexed.every((slide) => !slide.checks.some(isBlocking)),
  };
}
