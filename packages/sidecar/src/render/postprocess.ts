import sharp from "sharp";
import { SLIDE_SIZE } from "./renderer.ts";

// Pasca-proses (ARCH 7.3). Chromium Playwright berjalan dengan --force-color-profile=srgb,
// jadi piksel screenshot sudah sRGB; profil ICC sRGB ditanam agar aplikasi lain membacanya benar.

export type UploadFormat = "png" | "jpg";

export function toMaster(screenshot: Buffer): Promise<Buffer> {
  return sharp(screenshot).withIccProfile("srgb").png().toBuffer();
}

// Export upload 1080 × 1350: Lanczos, sharpening ringan; JPG tanpa chroma subsampling agar
// tepi teks tetap tajam.
export function toUpload(master: Buffer, format: UploadFormat): Promise<Buffer> {
  const image = sharp(master)
    .resize(SLIDE_SIZE.width, SLIDE_SIZE.height, { kernel: "lanczos3" })
    .sharpen({ sigma: 0.5 })
    .withIccProfile("srgb");
  return format === "png"
    ? image.png().toBuffer()
    : image.jpeg({ quality: 92, chromaSubsampling: "4:4:4" }).toBuffer();
}
