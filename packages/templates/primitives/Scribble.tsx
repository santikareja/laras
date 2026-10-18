import { type ColorToken, color } from "./vars.ts";

type Shape = "arrow" | "underline" | "circle";

// Coretan tangan (PRD 4 K5); warna garis dari token brand.
const VIEW_BOX: Record<Shape, string> = {
  arrow: "0 0 200 100",
  underline: "0 40 200 44",
  circle: "0 0 200 100",
};

const PATHS: Record<Shape, string[]> = {
  arrow: ["M12 82 C 52 18, 126 8, 182 46", "M182 46 L 156 44", "M182 46 L 172 22"],
  underline: ["M6 58 C 52 46, 124 70, 194 50", "M18 74 C 70 62, 128 80, 182 66"],
  circle: ["M104 10 C 168 8, 196 40, 186 66 C 172 94, 58 98, 20 72 C -4 50, 30 14, 112 14"],
};

type ScribbleProps = {
  shape: Shape;
  color: ColorToken;
  rotate?: number;
  flip?: boolean;
};

// Dekoratif: tanpa data-slot, mengisi lebar kotak induk; posisi dan ukuran diatur template.
export function Scribble({ shape, color: tone, rotate = 0, flip = false }: ScribbleProps) {
  return (
    <svg
      viewBox={VIEW_BOX[shape]}
      aria-hidden="true"
      style={{
        display: "block",
        width: "100%",
        height: "auto",
        overflow: "visible",
        color: color(tone),
        transform: `rotate(${rotate}deg)${flip ? " scaleX(-1)" : ""}`,
      }}
    >
      {PATHS[shape].map((d) => (
        <path
          key={d}
          d={d}
          fill="none"
          stroke="currentColor"
          strokeWidth={7}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}
