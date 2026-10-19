import type { SubjectInfo } from "@laras/shared";

// Geometri arketipe (ADR-015, T-123): titik fokus subjek cut-out di kanvas, agar letak teks
// bisa dipilih berseberangan diagonal dengan fokus (PRD 4 P8) tanpa parameter manual.

// Sama dengan SLIDE_SIZE renderer (ARCH 7.1); template memakai persen, perhitungan memakai px.
export const CANVAS = { width: 1080, height: 1350 } as const;

export type Box = { left: number; top: number; width: number; height: number };

// Kotak dari posisi CSS dalam persen kanvas (nilai negatif berarti keluar kanvas).
export function boxFromPercent(position: {
  left?: number;
  right?: number;
  bottom: number;
  width: number;
  height: number;
}): Box {
  const width = (position.width / 100) * CANVAS.width;
  const height = (position.height / 100) * CANVAS.height;
  const left =
    position.left !== undefined
      ? (position.left / 100) * CANVAS.width
      : CANVAS.width - ((position.right ?? 0) / 100) * CANVAS.width - width;
  const top = CANVAS.height - (position.bottom / 100) * CANVAS.height - height;
  return { left, top, width, height };
}

// Titik fokus di kanvas untuk gambar `object-fit: contain` berasio `aspect` (lebar/tinggi) di `box`.
export function containedFocus(box: Box, aspect: number, subject: SubjectInfo) {
  const width = aspect > box.width / box.height ? box.width : box.height * aspect;
  const height = width / aspect;
  const left = box.left + (box.width - width) / 2;
  const top = box.top + (box.height - height) / 2;
  return { x: left + subject.focus.x * width, y: top + subject.focus.y * height };
}

// Fokus di atas garis ini (pecahan tinggi kanvas) membuat teks diletakkan di bawah, dan
// sebaliknya. Dikalibrasi pada render T-122 yang disetujui pemilik.
export const FOCUS_HIGH = 0.45;

export function textBelowFocus(focusY: number): boolean {
  return focusY / CANVAS.height < FOCUS_HIGH;
}
