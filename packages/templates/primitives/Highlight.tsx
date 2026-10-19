import { type ColorToken, color } from "./vars.ts";

export type HighlightStyle = { background: ColorToken; color: ColorToken; tilt?: number };

type HighlightProps = HighlightStyle & { children: string };

// Blok sorot di balik kata (PRD 4 K5), dipakai di dalam teks; ukuran huruf mengikuti induknya.
export function Highlight({ background, color: tone, tilt = -2, children }: HighlightProps) {
  return (
    <span
      style={{
        display: "inline-block",
        // Sorotan panjang terlipat di dalam kotaknya, tidak meluber (T-131); induknya nowrap.
        whiteSpace: "normal",
        padding: "0 0.15em",
        background: color(background),
        color: color(tone),
        transform: `rotate(${tilt}deg)`,
      }}
    >
      {children}
    </span>
  );
}
