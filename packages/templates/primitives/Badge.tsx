import { type ColorToken, color, fontFamily, fontSize, fontWeight, space } from "./vars.ts";

type BadgeProps = {
  background: ColorToken;
  color: ColorToken;
  slot?: string;
  children: string;
};

export function Badge({ background, color: tone, slot, children }: BadgeProps) {
  return (
    <span
      data-slot={slot}
      data-slot-type={slot ? "badge" : undefined}
      style={{
        display: "block",
        width: "fit-content",
        padding: `${space(1)} ${space(2)}`,
        borderRadius: "var(--shape-radius)",
        background: color(background),
        fontFamily: fontFamily("body"),
        fontWeight: fontWeight("body", true),
        fontSize: fontSize(1),
        fontSynthesis: "none",
        lineHeight: 1.2,
        whiteSpace: "nowrap",
        color: color(tone),
      }}
    >
      {children}
    </span>
  );
}
