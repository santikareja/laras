import { Image } from "./Image.tsx";
import { type ColorToken, color, space } from "./vars.ts";

type FrameProps = {
  src: string;
  edge: ColorToken;
  rotate?: number;
  slot?: string;
};

// Foto berbingkai yang bisa dimiringkan, untuk kolase (PRD 4 K5, K6); mengisi kotak induknya.
export function Frame({ src, edge, rotate = 0, slot }: FrameProps) {
  return (
    <div
      style={{
        boxSizing: "border-box",
        width: "100%",
        height: "100%",
        padding: space(2),
        background: color(edge),
        boxShadow: "var(--shape-shadow)",
        transform: `rotate(${rotate}deg)`,
      }}
    >
      <Image src={src} {...(slot ? { slot } : {})} />
    </div>
  );
}
