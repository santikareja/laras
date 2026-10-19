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
        display: "block",
        width: "100%",
        height: space(5),
        background: color(tone),
        opacity: 0.85,
        transform: `rotate(${rotate}deg)`,
      }}
    />
  );
}
