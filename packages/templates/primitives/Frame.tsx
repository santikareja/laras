import { Image } from "./Image.tsx";
import { type ColorToken, color, space } from "./vars.ts";

type FrameProps = {
  src: string;
  edge: ColorToken;
  rotate?: number;
  // Tepi atas dan bawah seperti kertas sobek.
  torn?: boolean;
  // Foto hitam-putih diwarnai satu warna brand (mix-blend "color"); tanpa nilai berarti asli.
  duotone?: ColorToken;
  slot?: string;
};

// Titik tepi sobek dalam persen: tetap (deterministik) agar render bisa diulang dan dites.
const TORN = [
  "0% 2%",
  "8% 0%",
  "15% 2.5%",
  "24% 0.5%",
  "33% 2%",
  "41% 0%",
  "52% 2.5%",
  "60% 0.5%",
  "69% 2%",
  "78% 0%",
  "86% 2.5%",
  "94% 0.5%",
  "100% 2%",
  "100% 98%",
  "93% 100%",
  "85% 97.5%",
  "76% 99.5%",
  "67% 98%",
  "58% 100%",
  "48% 97.5%",
  "39% 99.5%",
  "30% 98%",
  "21% 100%",
  "12% 97.5%",
  "5% 99.5%",
  "0% 98%",
];

// Foto berbingkai yang bisa dimiringkan, untuk kolase (PRD 4 K5, K6); mengisi kotak induknya.
export function Frame({ src, edge, rotate = 0, torn = false, duotone, slot }: FrameProps) {
  return (
    <div
      style={{
        position: "relative",
        boxSizing: "border-box",
        width: "100%",
        height: "100%",
        padding: space(2),
        background: color(edge),
        boxShadow: torn ? undefined : "var(--shape-shadow)",
        clipPath: torn ? `polygon(${TORN.join(", ")})` : undefined,
        isolation: "isolate",
        transform: `rotate(${rotate}deg)`,
      }}
    >
      <Image src={src} mono={duotone !== undefined} {...(slot ? { slot } : {})} />
      {duotone && (
        <div
          style={{
            position: "absolute",
            inset: space(2),
            background: color(duotone),
            mixBlendMode: "color",
          }}
        />
      )}
    </div>
  );
}
