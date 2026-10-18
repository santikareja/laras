import {
  type ColorToken,
  color,
  type FontRole,
  type FontSizeStep,
  fontFamily,
  fontSize,
  fontWeight,
} from "./vars.ts";

type TextProps = {
  font: FontRole;
  size: FontSizeStep;
  color: ColorToken;
  strong?: boolean;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  slot?: string;
  children: string;
};

// Teks tidak pernah dipotong (tanpa line-clamp atau overflow hidden) agar overflow tertangkap QA.
export function Text({ font, size, color: tone, strong = false, as, slot, children }: TextProps) {
  const Tag = as ?? (font === "heading" ? "h2" : "p");
  return (
    <Tag
      data-slot={slot}
      data-slot-type={slot ? "text" : undefined}
      style={{
        margin: 0,
        fontFamily: fontFamily(font),
        fontWeight: fontWeight(font, strong),
        fontSize: fontSize(size),
        fontSynthesis: "none",
        lineHeight: font === "heading" ? 1.1 : 1.4,
        textWrap: font === "heading" ? "balance" : "pretty",
        color: color(tone),
      }}
    >
      {children}
    </Tag>
  );
}
