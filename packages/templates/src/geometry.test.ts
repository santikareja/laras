import { describe, expect, it } from "vitest";
import {
  boxFromPercent,
  CANVAS,
  containedFocus,
  textBelowFocus,
  thirdsPlacement,
} from "./geometry.ts";

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

  it("objek melayang digeser agar fokus jatuh di titik sepertiga sisi subjek (T-131)", () => {
    const floating = {
      box: { left: 0.1, top: 0.1, right: 0.9, bottom: 0.8 },
      focus: { x: 0.5, y: 0.5 },
    };
    // Kotak 4:5 di tengah: fokus awal (540, 675), sisi kanan → sasaran (720, 450) dalam batas geser.
    const box = { left: 270, top: 337.5, width: 540, height: 675 };
    const placed = thirdsPlacement(box, 4 / 5, floating, "right");
    expect(placed.focus.x).toBeCloseTo(669.6, 1);
    expect(placed.focus.y).toBeCloseTo(567, 0);
    expect(placed.transform).toBe("translate(129.6px, -108px)");
    // Subjek di kanan yang fokusnya sudah melewati 2/3 tidak digeser ke kiri (ke arah teks).
    const right = { left: 540, top: 337.5, width: 540, height: 675 };
    const kept = thirdsPlacement(right, 4 / 5, floating, "right");
    expect(kept.transform).toBe("translate(0px, -108px)");
    // Tanpa `rise` (kata raksasa) objek melayang tidak naik ke arah kata utama.
    const grounded = thirdsPlacement(box, 4 / 5, floating, "right", false);
    expect(grounded.transform).toBe("translate(129.6px, 0px)");
  });

  it("subjek terpotong di bawah tidak naik dan tidak diperbesar, hanya boleh turun", () => {
    const halfBody = {
      box: { left: 0.2, top: 0.1, right: 0.8, bottom: 1 },
      focus: { x: 0.5, y: 0.3 },
    };
    // Gambar 540 × 675 di tengah kotak: fokus (810, 675), sasaran terdekat 450 di atas → tetap.
    const low = thirdsPlacement(
      { left: 540, top: 270, width: 540, height: 1080 },
      4 / 5,
      halfBody,
      "right",
    );
    expect(low.transform).toBeUndefined();
    expect(low.focus.y).toBe(675);
    // Fokus 405 di atas garis sepertiga 450 → turun 45 px.
    const high = thirdsPlacement(
      { left: 540, top: 0, width: 540, height: 1080 },
      4 / 5,
      halfBody,
      "right",
    );
    expect(high.transform).toBe("translate(0px, 45px)");
    expect(high.focus.y).toBe(450);
  });
});
