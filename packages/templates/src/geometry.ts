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

// Penempatan subjek agar titik fokusnya jatuh di titik sepertiga sisi subjek (PRD 4 P8, T-131).
// Subjek yang terpotong di bawah (orang setengah badan, lengan dari tepi) hanya boleh turun agar
// potongannya tidak terlihat, dan tidak diperbesar: pembesaran mendorongnya ke kolom teks dan
// kata utama. Objek melayang boleh digeser naik atau turun, kecuali `rise` false (kata raksasa:
// letak subjek terhadap kata adalah desainnya, naik berarti menutup huruf). Teks ada di sisi
// seberang subjek, jadi geser horizontal hanya menjauhi teks (P6 di atas P8). Pergeseran dibatasi
// agar komposisi arketipe tetap sama.
const MAX_SHIFT = { x: 0.12, y: 0.08 };
const BOTTOM_CUT = 0.97;

export type Placement = {
  // Transform CSS untuk pembungkus gambar (tanpa nilai: tidak perlu digeser).
  transform: string | undefined;
  focus: { x: number; y: number };
};

const clamp = (value: number, limit: number) => Math.min(Math.max(value, -limit), limit);
const round = (value: number) => Math.round(value * 10) / 10;

export function thirdsPlacement(
  box: Box,
  aspect: number,
  subject: SubjectInfo,
  side: "left" | "right",
  rise = true,
): Placement {
  const width = aspect > box.width / box.height ? box.width : box.height * aspect;
  const height = width / aspect;
  const content = {
    left: box.left + (box.width - width) / 2,
    top: box.top + (box.height - height) / 2,
  };
  const focus = {
    x: content.left + subject.focus.x * width,
    y: content.top + subject.focus.y * height,
  };
  const targetX = (side === "right" ? 2 / 3 : 1 / 3) * CANVAS.width;
  const thirds = [CANVAS.height / 3, (2 * CANVAS.height) / 3];
  const targetY = thirds.reduce((a, b) => (Math.abs(b - focus.y) < Math.abs(a - focus.y) ? b : a));
  const cut = subject.box.bottom >= BOTTOM_CUT;
  const dy =
    cut || !rise
      ? Math.min(Math.max(targetY - focus.y, 0), MAX_SHIFT.y * CANVAS.height)
      : clamp(targetY - focus.y, MAX_SHIFT.y * CANVAS.height);
  const away = side === "right" ? 1 : -1;
  const dx = Math.max(0, clamp(targetX - focus.x, MAX_SHIFT.x * CANVAS.width) * away) * away;
  const moved = Math.abs(dx) >= 0.5 || Math.abs(dy) >= 0.5;
  return {
    transform: moved ? `translate(${round(dx)}px, ${round(dy)}px)` : undefined,
    focus: { x: focus.x + dx, y: focus.y + dy },
  };
}
