import { type ColorToken, color, space } from "./vars.ts";

type TapeProps = {
  color: ColorToken;
  rotate?: number;
};

// Selotip kolase (PRD 4 K5): pita tipis setengah transparan, lebar mengikuti kotak induk.
export function Tape({ color: tone, rotate = 0 }: TapeProps) {
  return (
    <span
      data-qa-element="decor"
      aria-hidden="true"
      style={{
        // Brand tanpa selotip menyembunyikannya (token --device-tape, T-124).
        display: "var(--device-tape, block)",
        width: "100%",
        height: space(5),
        background: color(tone),
        opacity: 0.85,
        transform: `rotate(${rotate}deg)`,
      }}
    />
  );
}
