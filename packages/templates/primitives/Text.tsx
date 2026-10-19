import { type TextEffect, TextEffectFrame, type TextLayer } from "./Effects.tsx";
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
  // Headline dua nada (Flat bagian 5): frasa yang diberi warna kedua; diabaikan bila tidak ada
  // di teks atau bila sorot dipakai.
  accentWords?: { text: string; color: ColorToken };
  // Efek teks (Effects.tsx), mis. registrasi meleset atau glow pada headline besar. Teks dibungkus
  // satu blok bersama salinan dekoratifnya.
  effect?: TextEffect | undefined;
  children: string;
};

// Teks tidak pernah dipotong (tanpa line-clamp atau overflow hidden) agar overflow tertangkap QA.
export function Text({ effect, ...props }: TextProps) {
  if (!effect) return <TextLayerElement {...props} />;
  return (
    <TextEffectFrame
      effect={effect}
      render={(layer) => <TextLayerElement {...props} layer={layer} />}
    />
  );
}

// Satu lapisan Text: teks asli, atau salinan efek tanpa slot, tanpa warna kedua, dan dengan
// sorot yang tetap mengambil tempat tetapi tidak terlihat (baris pecah di titik yang sama).
function TextLayerElement({
  font,
  size,
  color: tone,
  strong = false,
  as,
  slot,
  highlight,
  measure,
  balance = false,
  accentWords,
  layer,
  children,
}: Omit<TextProps, "effect"> & { layer?: TextLayer }) {
  const Tag = as ?? (font === "heading" ? "h2" : "p");
  const copy = layer?.copy ?? false;
  const at = highlight?.text ? children.indexOf(highlight.text) : -1;
  const end = at + (highlight?.text.length ?? 0);
  // Karakter non-spasi tepat sesudah sorotan (mis. koma) disatukan agar tidak pindah baris sendiri.
  const tail = children.slice(end).match(/^\S*/)?.[0] ?? "";
  const accentAt = at < 0 && !copy && accentWords?.text ? children.indexOf(accentWords.text) : -1;
  const accent = accentAt >= 0 ? accentWords : undefined;
  const marker = highlight && at >= 0 && <Highlight {...highlight}>{highlight.text}</Highlight>;
  return (
    <Tag
      data-slot={copy ? undefined : slot}
      data-slot-type={slot && !copy ? "text" : undefined}
      style={{
        margin: 0,
        fontFamily: fontFamily(font),
        fontWeight: fontWeight(font, strong),
        fontSize: fontSize(size),
        fontSynthesis: "none",
        lineHeight: font === "heading" ? 1.1 : 1.4,
        textWrap: font === "heading" || balance ? "balance" : "pretty",
        maxWidth: measure ? `${measure}ch` : undefined,
        // Huruf kapital dan jarak huruf heading dari lapisan gaya (T-132); tanpa gaya: bawaan.
        textTransform: font === "heading" ? "var(--style-heading-transform, none)" : undefined,
        letterSpacing: font === "heading" ? "var(--style-heading-tracking, normal)" : undefined,
        color: color(layer?.color ?? tone),
        ...layer?.style,
      }}
    >
      {marker ? (
        <>
          {children.slice(0, at)}
          <span style={{ whiteSpace: "nowrap" }}>
            {copy ? <span style={{ visibility: "hidden" }}>{marker}</span> : marker}
            {tail}
          </span>
          {children.slice(end + tail.length)}
        </>
      ) : accent ? (
        <>
          {children.slice(0, accentAt)}
          <span style={{ color: color(accent.color) }}>{accent.text}</span>
          {children.slice(accentAt + accent.text.length)}
        </>
      ) : (
        children
      )}
    </Tag>
  );
}
