import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { placeSubject, Stage } from "./parts.tsx";

// Penempatan subjek arketipe Flat Design (T-134): wajah di titik sepertiga, subjek terpotong
// selalu bleed di dasar, subjek yang dibatasi lebarnya tetap berpijak, dan kolom teks dijaga.

const target = {
  focus: { x: 770, y: 430 },
  bottom: 1294,
  maxWidth: 560,
  minLeft: 470,
  maxRight: 1056,
};
const subject = (bottom: number, left = 0.3, right = 0.7) => ({
  box: { left, top: 0.05, right, bottom },
  focus: { x: 0.5, y: 0.2 },
});

describe("placeSubject", () => {
  it("subjek utuh: wajah tepat di fokus dan dasar di dasar target", () => {
    const frame = placeSubject(subject(0.9), target, { width: 700 });
    expect(frame.focus.x).toBeCloseTo(770);
    expect(frame.focus.y).toBeCloseTo(430);
    expect(frame.top + 0.9 * 1.25 * frame.width).toBeCloseTo(1294);
  });

  it("subjek terpotong menempel ke dasar walau lebarnya dibatasi", () => {
    const frame = placeSubject(subject(1, 0.05, 0.95), { ...target, bottom: 1362 }, { width: 700 });
    expect(frame.width * 0.9).toBeCloseTo(560);
    expect(frame.top + 1.25 * frame.width).toBeCloseTo(1362);
  });

  it("subjek lebar yang dibatasi tetap berpijak di dasar target", () => {
    const frame = placeSubject(subject(0.9, 0.05, 0.95), target, { width: 700 });
    expect(frame.top + 0.9 * 1.25 * frame.width).toBeCloseTo(1294);
    expect(frame.focus.y).toBeGreaterThan(430);
  });

  it("kotak alpha tidak masuk kolom teks (minLeft) dan tidak melewati maxRight", () => {
    const left = placeSubject(
      subject(0.9),
      { ...target, focus: { x: 500, y: 430 } },
      { width: 700 },
    );
    expect(left.left + 0.3 * left.width).toBeCloseTo(470);
    const right = placeSubject(
      subject(0.9),
      { ...target, focus: { x: 1000, y: 430 } },
      { width: 700 },
    );
    expect(right.left + 0.7 * right.width).toBeCloseTo(1056);
  });

  it("tanpa analisis cut-out: kotak cadangan berdiri di dasar target", () => {
    const frame = placeSubject(undefined, target, { width: 600 });
    expect(frame.left).toBe(470);
    expect(frame.top + 600 * 1.25).toBe(1294);
  });
});

describe("Stage", () => {
  it.each(["cakram", "cincin", "lensa", "biji", "blob"] as const)(
    "%s: satu bentuk QA bernama, warna dari token",
    (kind) => {
      const markup = renderToStaticMarkup(
        <Stage
          kind={kind}
          center={{ x: 500, y: 600 }}
          size={600}
          fill="secondary"
          line="primary"
        />,
      );
      // Bentuk bernama di luar; penanda bentuk di dalamnya (Blob primitive) dibungkus decor.
      expect(markup.startsWith(`<div data-qa-element="shape" data-qa-name="${kind}"`)).toBe(true);
      const shapes = markup.match(/data-qa-element="shape"/g)?.length ?? 0;
      const decor = markup.match(/data-qa-element="decor"/g)?.length ?? 0;
      expect(shapes - 1).toBeLessThanOrEqual(decor);
      expect(markup).toContain("var(--color-secondary)");
    },
  );
});
