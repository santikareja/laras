import sharp from "sharp";
import { contrastRatio, parseColor, type SampledContrast, type TextMeasure } from "./rules.ts";

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
