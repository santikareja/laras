import { Highlight, type HighlightStyle } from "./Highlight.tsx";
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
  // Bagian teks yang diberi blok sorot (PRD 4 K5); diabaikan bila tidak ada di teks.
  highlight?: HighlightStyle & { text: string };
  // Panjang baris maksimal dalam karakter (PRD 4 P4), mis. 45 untuk body.
  measure?: number;
  // Ratakan panjang baris agar tidak ada baris yatim (PRD 4 P4).
  balance?: boolean;
  children: string;
};

// Teks tidak pernah dipotong (tanpa line-clamp atau overflow hidden) agar overflow tertangkap QA.
export function Text({
  font,
  size,
  color: tone,
  strong = false,
  as,
  slot,
  highlight,
  measure,
  balance = false,
  children,
}: TextProps) {
  const Tag = as ?? (font === "heading" ? "h2" : "p");
  const at = highlight?.text ? children.indexOf(highlight.text) : -1;
  const end = at + (highlight?.text.length ?? 0);
  // Karakter non-spasi tepat sesudah sorotan (mis. koma) disatukan agar tidak pindah baris sendiri.
  const tail = children.slice(end).match(/^\S*/)?.[0] ?? "";
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
        textWrap: font === "heading" || balance ? "balance" : "pretty",
        maxWidth: measure ? `${measure}ch` : undefined,
        color: color(tone),
      }}
    >
      {highlight && at >= 0 ? (
        <>
          {children.slice(0, at)}
          <span style={{ whiteSpace: "nowrap" }}>
            <Highlight {...highlight}>{highlight.text}</Highlight>
            {tail}
          </span>
          {children.slice(end + tail.length)}
        </>
      ) : (
        children
      )}
    </Tag>
  );
}
