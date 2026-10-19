import { describe, expect, it } from "vitest";
import { boxFromPercent, CANVAS, containedFocus, textBelowFocus } from "./geometry.ts";

const subject = { box: { left: 0, top: 0, right: 1, bottom: 1 }, focus: { x: 0.5, y: 0.25 } };

describe("geometri arketipe (T-123)", () => {
  it("kotak dari persen kanvas, termasuk sisi kanan dan nilai negatif", () => {
    expect(boxFromPercent({ left: 0, bottom: -5, width: 100, height: 84 })).toEqual({
      left: 0,
      top: CANVAS.height * 0.21,
      width: CANVAS.width,
      height: CANVAS.height * 0.84,
    });
    const right = boxFromPercent({ right: -6, bottom: -3, width: 60, height: 82 });
    expect(right.left).toBeCloseTo(CANVAS.width * 0.46);
  });

  it("titik fokus gambar contain di kotak yang lebih lebar dari gambarnya", () => {
    const box = { left: 0, top: 100, width: 1000, height: 1000 };
    // Gambar 4:5 dibatasi tinggi: lebar 800, tergeser 100 dari kiri.
    expect(containedFocus(box, 4 / 5, subject)).toEqual({ x: 500, y: 350 });
  });

  it("teks di bawah bila fokus di atas 45% tinggi kanvas", () => {
    expect(textBelowFocus(CANVAS.height * 0.4)).toBe(true);
    expect(textBelowFocus(CANVAS.height * 0.5)).toBe(false);
  });
});
