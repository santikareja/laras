import sharp from "sharp";
import type { Rect } from "./rules.ts";

// Statistik warna dari piksel render (PRD 4 P9, P10; cara ukur T-122): render diperkecil, setiap
// piksel dipetakan ke warna palet terdekat bila jaraknya ≤ 40 (RGB), selain itu dihitung gambar.

const SAMPLE = { width: 216, height: 270 };
const MAX_DISTANCE = 40;

export type PixelStats = {
  // Bagian piksel per warna palet (hex huruf kecil) dan gambar, dari seluruh kanvas.
  tokens: Record<string, number>;
  image: number;
  // Bagian piksel per warna palet di luar kotak teks dan logo (dasar ruang kosong P10).
  outside: Record<string, number>;
};

const rgb = (hex: string) => [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));

export async function pixelStats(
  png: Buffer,
  palette: string[],
  excluded: Rect[],
  canvas: { width: number; height: number },
): Promise<PixelStats> {
  const { data, info } = await sharp(png)
    .resize(SAMPLE.width, SAMPLE.height, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const colors = [...new Set(palette.map((hex) => hex.toLowerCase()))].map((hex) => ({
    hex,
    value: rgb(hex),
  }));
  const tokens: Record<string, number> = Object.fromEntries(colors.map((c) => [c.hex, 0]));
  const outside: Record<string, number> = { ...tokens };
  let image = 0;
  const total = info.width * info.height;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const i = (y * info.width + x) * info.channels;
      const pixel = [data[i] ?? 0, data[i + 1] ?? 0, data[i + 2] ?? 0];
      let best: string | undefined;
      let bestDistance = Number.POSITIVE_INFINITY;
      for (const color of colors) {
        const distance = Math.hypot(...pixel.map((v, k) => v - (color.value[k] ?? 0)));
        if (distance < bestDistance) {
          bestDistance = distance;
          best = color.hex;
        }
      }
      if (!best || bestDistance > MAX_DISTANCE) {
        image++;
        continue;
      }
      tokens[best] = (tokens[best] ?? 0) + 1;
      const cx = ((x + 0.5) * canvas.width) / info.width;
      const cy = ((y + 0.5) * canvas.height) / info.height;
      const covered = excluded.some(
        (r) => cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom,
      );
      if (!covered) outside[best] = (outside[best] ?? 0) + 1;
    }
  }
  const share = (counts: Record<string, number>) =>
    Object.fromEntries(Object.entries(counts).map(([hex, n]) => [hex, n / total]));
  return { tokens: share(tokens), image: image / total, outside: share(outside) };
}
