import type { CSSProperties, ReactElement } from "react";
import { Image } from "./Image.tsx";
import { noiseMask } from "./noise.ts";
import { type ColorToken, color } from "./vars.ts";

// Perlakuan foto dan cut-out per gaya (T-132). Warna selalu dari token; hasil berupa piksel foto,
// jadi QA warna Brand Kit hanya membaca latar elemen pembungkusnya (token).
export type ImageTreatment =
  | { kind: "natural" }
  | { kind: "mono" }
  // Kontras tinggi sampai nada tengah hilang, dengan butir (Brutalisme).
  | { kind: "fotokopi"; ink: ColorToken }
  // Titik bulat berbeda ukuran, diputar 45° (Brutalisme, Vintage/Retro). Tanpa `paper`, titik
  // dicetak langsung di atas bidang di belakangnya (multiply).
  | { kind: "halftone"; ink: ColorToken; paper?: ColorToken; pitch?: number }
  // Hitam ke token gelap, putih ke token terang.
  | { kind: "duotone"; dark: ColorToken; light: ColorToken }
  // Grading hangat pudar dari satu token (Vintage/Retro).
  | { kind: "hangat"; tone: ColorToken }
  // Tint lembut satu token (Glassmorphism).
  | { kind: "tint"; tone: ColorToken; strength?: number };

type PhotoProps = {
  src: string;
  fit?: "cover" | "contain";
  treatment?: ImageTreatment;
  slot?: string;
};

const FILL: CSSProperties = { position: "absolute", inset: 0 };

// Foto dengan perlakuan gaya; mengisi kotak induknya. Tanpa perlakuan (natural) hasilnya sama
// dengan Image. Lapisan warna dimask ke alpha gambar agar cut-out tetap bertepi bersih.
export function Photo({ src, fit = "cover", treatment = { kind: "natural" }, slot }: PhotoProps) {
  const image = (filter?: string): ReactElement => (
    <div key="foto" style={{ ...FILL, filter }}>
      <Image src={src} fit={fit} {...(slot ? { slot } : {})} />
    </div>
  );
  if (treatment.kind === "natural")
    return <Image src={src} fit={fit} {...(slot ? { slot } : {})} />;
  const mask: CSSProperties = {
    maskImage: `url("${src}")`,
    maskSize: fit,
    maskPosition: "center",
    maskRepeat: "no-repeat",
  };
  const frame = (children: ReactElement[], style: CSSProperties = {}) => (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        isolation: "isolate",
        ...mask,
        ...style,
      }}
    >
      {children}
    </div>
  );
  const layer = (key: string, style: CSSProperties) => (
    <div key={key} style={{ ...FILL, ...style }} />
  );
  switch (treatment.kind) {
    case "mono":
      return frame([image("grayscale(1) contrast(1.1)")]);
    case "fotokopi":
      return frame([
        image("grayscale(1) contrast(2.4) brightness(1.08)"),
        layer("butir", {
          background: color(treatment.ink),
          opacity: 0.5,
          maskImage: noiseMask({ frequency: 0.9, coverage: 0.05, seed: 3 }),
        }),
      ]);
    case "halftone": {
      const pitch = treatment.pitch ?? 12;
      // Teknik color-dodge + kontras: titik gelap membesar di area gelap, lalu dua lapis
      // lighten/darken memetakan hitam ke tinta dan putih ke kertas.
      const paper = treatment.paper;
      return frame(
        [
          <div
            key="titik"
            style={{
              ...FILL,
              overflow: "hidden",
              background: color("neutral-light"),
              // Grayscale sesudah kontras: token netral yang sedikit berwarna tidak memunculkan
              // bintik warna di ambang.
              filter: "contrast(30) grayscale(1)",
            }}
          >
            {image("grayscale(1) brightness(0.42) blur(2px)")}
            <div
              style={{
                position: "absolute",
                inset: "-50%",
                transform: "rotate(45deg)",
                backgroundImage: `radial-gradient(circle at center, ${color("neutral-dark")}, ${color("neutral-light")} 72%)`,
                backgroundSize: `${pitch}px ${pitch}px`,
                mixBlendMode: "color-dodge",
              }}
            />
          </div>,
          layer("tinta", { background: color(treatment.ink), mixBlendMode: "lighten" }),
          ...(paper ? [layer("kertas", { background: color(paper), mixBlendMode: "darken" })] : []),
        ],
        paper ? {} : { mixBlendMode: "multiply" },
      );
    }
    case "duotone":
      return frame([
        image("grayscale(1) contrast(1.1)"),
        layer("gelap", { background: color(treatment.dark), mixBlendMode: "lighten" }),
        layer("terang", { background: color(treatment.light), mixBlendMode: "darken" }),
      ]);
    case "hangat":
      return frame([
        image("saturate(0.8) contrast(0.9) brightness(1.04)"),
        layer("nada", {
          background: color(treatment.tone),
          mixBlendMode: "soft-light",
          opacity: 0.45,
        }),
        layer("pudar", {
          background: color("neutral-light"),
          mixBlendMode: "lighten",
          opacity: 0.12,
        }),
      ]);
    case "tint":
      return frame([
        image(),
        layer("tint", {
          background: color(treatment.tone),
          mixBlendMode: "color",
          opacity: treatment.strength ?? 0.25,
        }),
      ]);
  }
}
