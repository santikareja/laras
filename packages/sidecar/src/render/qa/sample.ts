import sharp from "sharp";
import {
  contrastRatio,
  parseColor,
  type SampledBusy,
  type SampledContrast,
  type TextMeasure,
} from "./rules.ts";

// Kontras teks di atas foto (ARCH 7.2): piksel latar di area setiap baris teks, diambil dari
// screenshot dengan teks disembunyikan. Rasio persentil ke-5: 95% piksel latar memenuhinya.
const PERCENTILE = 0.05;

const LINEAR = Array.from({ length: 256 }, (_, channel) => {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
});

export async function sampleContrast(
  background: Buffer,
  texts: TextMeasure[],
  scale: number,
): Promise<SampledContrast> {
  const { data, info } = await sharp(background)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const pixelLuminance = (offset: number) =>
    0.2126 * (LINEAR[data[offset] ?? 0] ?? 0) +
    0.7152 * (LINEAR[data[offset + 1] ?? 0] ?? 0) +
    0.0722 * (LINEAR[data[offset + 2] ?? 0] ?? 0);
  const clampX = (x: number) => Math.min(info.width, Math.max(0, Math.round(x * scale)));
  const clampY = (y: number) => Math.min(info.height, Math.max(0, Math.round(y * scale)));

  const result: SampledContrast = new Map();
  for (const text of texts) {
    const color = parseColor(text.color);
    if (!color) continue;
    const textLuminance =
      0.2126 * (LINEAR[color.r] ?? 0) +
      0.7152 * (LINEAR[color.g] ?? 0) +
      0.0722 * (LINEAR[color.b] ?? 0);
    const ratios: number[] = [];
    for (const line of text.lines) {
      for (let y = clampY(line.top); y < clampY(line.bottom); y++) {
        for (let x = clampX(line.left); x < clampX(line.right); x++) {
          const offset = (y * info.width + x) * info.channels;
          ratios.push(contrastRatio(textLuminance, pixelLuminance(offset)));
        }
      }
    }
    if (ratios.length === 0) continue;
    ratios.sort((a, b) => a - b);
    result.set(text.id, ratios[Math.floor(ratios.length * PERCENTILE)] ?? 0);
  }
  return result;
}

// Keramaian latar di balik teks di atas foto (T-141): setiap baris dibagi petak persegi setinggi
// barisnya, dan nilai teks adalah simpangan baku luma sRGB (0–255) petak paling ramai. Rata-rata
// satu kotak baris menenggelamkan tumpang tindih kecil (kepala di bawah sebagian baris).
export async function sampleBusy(
  background: Buffer,
  texts: TextMeasure[],
  scale: number,
): Promise<SampledBusy> {
  const { data, info } = await sharp(background)
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const clampX = (x: number) => Math.min(info.width, Math.max(0, Math.round(x * scale)));
  const clampY = (y: number) => Math.min(info.height, Math.max(0, Math.round(y * scale)));
  const deviation = (x0: number, x1: number, y0: number, y1: number) => {
    let sum = 0;
    let squares = 0;
    let count = 0;
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const offset = (y * info.width + x) * info.channels;
        const luma =
          0.2126 * (data[offset] ?? 0) +
          0.7152 * (data[offset + 1] ?? 0) +
          0.0722 * (data[offset + 2] ?? 0);
        sum += luma;
        squares += luma * luma;
        count++;
      }
    }
    if (count === 0) return 0;
    const mean = sum / count;
    return Math.sqrt(Math.max(0, squares / count - mean * mean));
  };
  const result: SampledBusy = new Map();
  for (const text of texts) {
    let worst = -1;
    for (const line of text.lines) {
      const [y0, y1] = [clampY(line.top), clampY(line.bottom)];
      const [x0, x1] = [clampX(line.left), clampX(line.right)];
      const tile = Math.max(1, y1 - y0);
      for (let x = x0; x < x1; x += tile) {
        worst = Math.max(worst, deviation(x, Math.min(x1, x + tile), y0, y1));
      }
    }
    if (worst >= 0) result.set(text.id, worst);
  }
  return result;
}
