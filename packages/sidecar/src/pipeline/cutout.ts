import { SUBJECT_BANDS, type SubjectInfo, type SubjectKind } from "@laras/shared";
import sharp from "sharp";

// Aset cut-out berlatar transparan (T-121, T-123): normalisasi alpha dan analisis subjek untuk
// penempatan arketipe (PRD 4 P8).

// Codex memberi alpha subjek 253, bukan 255 (KNOWLEDGE T-121): tanpa normalisasi, teks di
// belakang subjek tembus sekitar 1%.
const SOLID = 250;
const VISIBLE = 16;

// Titik fokus heuristik: pusat massa bagian teratas kotak alpha. 30% untuk orang (wajah) dan 75%
// untuk objek (produk tanpa tangan atau pegangan di bawahnya). Dikalibrasi pada 6 cut-out fixture
// dengan galat terbesar 0,08 lebar atau tinggi gambar.
const FOCUS_SHARE: Record<SubjectKind, number> = { person: 0.3, object: 0.75 };

export type { SubjectKind };

async function rgba(file: string) {
  return sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
}

// Alpha ≥ 250 menjadi 255, disimpan sebagai WebP beralpha.
export async function normalizeCutout(source: string, destination: string) {
  const { data, info } = await rgba(source);
  for (let i = 3; i < data.length; i += 4) if ((data[i] ?? 0) >= SOLID) data[i] = 255;
  await sharp(data, { raw: info }).webp({ quality: 88, alphaQuality: 100 }).toFile(destination);
  return { width: info.width, height: info.height };
}

export async function analyzeCutout(file: string, kind: SubjectKind): Promise<SubjectInfo> {
  const { data, info } = await rgba(file);
  const { width, height } = info;
  const visible = (x: number, y: number) => (data[(y * width + x) * 4 + 3] ?? 0) > VISIBLE;
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;
  const bands: ([number, number] | null)[] = Array.from({ length: SUBJECT_BANDS }, () => null);
  for (let y = 0; y < height; y++) {
    const band = Math.min(SUBJECT_BANDS - 1, Math.floor((y / height) * SUBJECT_BANDS));
    for (let x = 0; x < width; x++) {
      if (!visible(x, y)) continue;
      left = Math.min(left, x);
      right = Math.max(right, x);
      top = Math.min(top, y);
      bottom = Math.max(bottom, y);
      const [l, r] = bands[band] ?? [x, x];
      bands[band] = [Math.min(l, x), Math.max(r, x)];
    }
  }
  if (right < 0) throw new Error("Cut-out tidak punya subjek (alpha kosong)");
  const limit = top + Math.max(1, Math.round((bottom - top + 1) * FOCUS_SHARE[kind]));
  let sumX = 0;
  let sumY = 0;
  let count = 0;
  for (let y = top; y < limit; y++) {
    for (let x = left; x <= right; x++) {
      if (!visible(x, y)) continue;
      sumX += x;
      sumY += y;
      count++;
    }
  }
  return {
    box: {
      left: left / width,
      top: top / height,
      right: (right + 1) / width,
      bottom: (bottom + 1) / height,
    },
    focus: { x: (sumX / count + 0.5) / width, y: (sumY / count + 0.5) / height },
    bands: bands.map((band) => (band ? [band[0] / width, (band[1] + 1) / width] : null)),
  };
}
