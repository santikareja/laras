import {
  type ColorToken,
  color,
  type FontSizeStep,
  fontFamily,
  fontSize,
  fontWeight,
  space,
} from "./vars.ts";

type StickerProps = {
  background: ColorToken;
  color: ColorToken;
  // Bingkai tebal ala stiker; tanpa nilai berarti tanpa bingkai.
  edge?: ColorToken;
  rotate?: number;
  size?: FontSizeStep;
  slot?: string;
  children: string;
};

// Chip miring berisi fakta pendek (PRD 4 K5, K7), misalnya harga atau jam.
export function Sticker({
  background,
  color: tone,
  edge,
  rotate = 0,
  size = 2,
  slot,
  children,
}: StickerProps) {
  return (
    <span
      data-slot={slot}
      data-slot-type={slot ? "badge" : undefined}
      style={{
        display: "block",
        width: "fit-content",
        padding: `${space(2)} ${space(3)}`,
        borderRadius: "var(--shape-radius)",
        border: edge ? `${space(1)} solid ${color(edge)}` : undefined,
        boxShadow: "var(--shape-shadow)",
        background: color(background),
        fontFamily: fontFamily("body"),
        fontWeight: fontWeight("body", true),
        fontSize: fontSize(size),
        fontSynthesis: "none",
        lineHeight: 1.1,
        whiteSpace: "nowrap",
        color: color(tone),
        transform: `rotate(${rotate}deg)`,
      }}
    >
      {children}
    </span>
  );
}
