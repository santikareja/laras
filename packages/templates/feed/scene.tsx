import type { TemplateSlot } from "@laras/shared";
import { type ImageTreatment, Photo } from "../primitives/index.ts";

// Latar adegan (T-141, arah pemilik setelah spike T-140): arketipe bidang warna boleh mengganti
// bidang datarnya dengan foto adegan dari model gambar, sementara kata raksasa, perangkat grafis,
// dan subjek cut-out tetap dari arketipe. Adegan aktif bila slot `adegan` diisi; tanpa itu tampil
// bidang warna seperti biasa.

export function SceneBackdrop({ src, treatment }: { src: string; treatment?: ImageTreatment }) {
  return (
    <div
      data-qa-element="background"
      data-qa-name="adegan"
      style={{ position: "absolute", inset: 0 }}
    >
      <Photo slot="adegan" src={src} {...(treatment ? { treatment } : {})} />
    </div>
  );
}

// Foto adegan selalu pelat latar tanpa subjek: subjek cut-out dipasang di depannya.
const PLATE =
  "Background plate for a cut-out subject placed in front later: an environment only, with no people and no main subject, slightly soft in depth, with a clear ground line near the bottom and light that a person standing in front would match.";
const LIGHT =
  "Keep the text areas light, calm, and plain (pale wall, paper, or sky) so dark letters read.";
const DARK =
  "Keep the text areas dark, calm, and plain (deep shade close to the brand primary color) so light letters read.";

// Slot adegan dengan kontrak komposisi: kalimat khusus arketipe dan nada area teks per `tone`.
export function sceneSlot(areas: string, tones: Record<string, "light" | "dark">): TemplateSlot {
  return {
    name: "adegan",
    type: "image",
    required: false,
    description:
      "Foto pelat latar (tempat nyata tanpa orang atau subjek utama) yang menggantikan bidang warna; subjek cut-out tetap di depannya. Isi bila ide hidup di tempat atau suasana nyata, kosongkan bila bidang warna brand lebih kuat",
    aspectRatio: "4:5",
    composition: {
      base: `${PLATE} ${areas}`,
      option: "tone",
      byValue: Object.fromEntries(
        Object.entries(tones).map(([value, tone]) => [value, tone === "dark" ? DARK : LIGHT]),
      ),
    },
  };
}
