import { mkdir, realpath } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import type { BrandKit } from "@laras/shared";
import sharp from "sharp";

// Pratinjau logo brand untuk QA visual (T-126): Claude membaca SVG sebagai teks, jadi logo
// dirender ke PNG di atas latar sesuai variannya agar bentuknya dikenali (logo chevron Ritme
// pernah dikira ikon, T-117 dan T-131). Path file logo divalidasi di dalam folder project.

const HEIGHT = 240;
const PAD = 48;

export async function logoPreviews(
  projectDir: string,
  jobDir: string,
  brand: BrandKit,
): Promise<string[]> {
  const neutrals = Object.entries(brand.colors.neutral).sort(([a], [b]) => Number(a) - Number(b));
  const light = neutrals.at(0)?.[1] ?? "#FFFFFF";
  const dark = neutrals.at(-1)?.[1] ?? "#000000";
  const variants: [name: string, file: string | undefined, background: string][] = [
    ["primary", brand.logo.primary, light],
    ["onDark", brand.logo.onDark, dark],
  ];
  const root = await realpath(projectDir);
  const out = join(jobDir, "qa");
  await mkdir(out, { recursive: true });
  const files: string[] = [];
  for (const [name, file, background] of variants) {
    if (!file) continue;
    // File logo yang tidak ada tidak menggagalkan QA; pratinjaunya saja yang dilewati.
    const source = await realpath(join(projectDir, file)).catch(() => null);
    if (!source) continue;
    if (!source.startsWith(root + sep))
      throw new Error(`File logo di luar folder project: ${file}`);
    const logo = await sharp(source, { density: 300 })
      .resize({ height: HEIGHT, fit: "inside" })
      .png()
      .toBuffer({ resolveWithObject: true });
    const target = join(out, `logo-${name}.png`);
    await sharp({
      create: {
        width: logo.info.width + PAD * 2,
        height: logo.info.height + PAD * 2,
        channels: 4,
        background,
      },
    })
      .composite([{ input: logo.data, left: PAD, top: PAD }])
      .png()
      .toFile(target);
    files.push(relative(projectDir, target));
  }
  return files;
}
