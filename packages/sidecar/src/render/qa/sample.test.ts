import sharp from "sharp";
import { describe, expect, it } from "vitest";
import type { TextMeasure } from "./rules.ts";
import { sampleBusy } from "./sample.ts";

// Latar 400 × 100 px (skala 1): kiri polos, kanan berpola kotak kasar seperti objek bertekstur.
async function background(): Promise<Buffer> {
  const pixels = Buffer.alloc(400 * 100 * 3, 200);
  for (let y = 0; y < 100; y++) {
    for (let x = 200; x < 400; x++) {
      const v = (Math.floor(x / 10) + Math.floor(y / 10)) % 2 === 0 ? 30 : 230;
      pixels.fill(v, (y * 400 + x) * 3, (y * 400 + x) * 3 + 3);
    }
  }
  return sharp(pixels, { raw: { width: 400, height: 100, channels: 3 } })
    .png()
    .toBuffer();
}

const line = (left: number, right: number): TextMeasure =>
  ({ id: left, lines: [{ left, right, top: 20, bottom: 60 }] }) as unknown as TextMeasure;

describe("sampleBusy (T-141)", () => {
  it("petak terburuk menangkap tumpang tindih di ujung baris", async () => {
    const [calm, edge] = [line(20, 180), { ...line(21, 230), id: 21 } as TextMeasure];
    const result = await sampleBusy(await background(), [calm, edge], 1);
    expect(result.get(20) ?? 99).toBeLessThan(1);
    expect(result.get(21) ?? 0).toBeGreaterThan(40);
  });
});
