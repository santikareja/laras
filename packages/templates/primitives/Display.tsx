import { type TextEffect, TextEffectFrame, type TextLayer } from "./Effects.tsx";
import { type ColorToken, color, type FontRole, fontFamily, fontSize, fontWeight } from "./vars.ts";

type DisplayProps = {
  font: FontRole;
  color: ColorToken;
  // Batas ukuran: kelipatan langkah terbesar skala brand (--font-size-6).
  scale: number;
  align?: "center" | "left" | "right";
  // Satu kata per baris, setiap baris dipaskan ke lebar kotak (tumpukan rata, PRD 4 K2).
  stack?: boolean;
  slot?: string;
  // Headline dua nada (Flat bagian 5): frasa yang diberi warna kedua; pada tumpukan, setiap kata
  // yang termasuk frasa. Diabaikan bila frasa tidak ada di teks.
  accentWords?: { text: string; color: ColorToken };
  // Efek teks (Effects.tsx): glow, glitch, tinta aus, registrasi meleset, huruf retro.
  effect?: TextEffect;
  children: string;
};

// Perkiraan awal lebar huruf (em) sebelum renderer mengukur; nilai akhirnya dari langkah fit.
const ESTIMATE = 0.6;

// Kata raksasa (PRD 4 K2). Setiap baris bertanda data-fit: renderer mengukur lebar teks
// sebenarnya dan menskalakannya agar mengisi lebar kotak, dibatasi `scale` (fit-to-width T-123).
// Ukuran awal hanya perkiraan lewat container query agar HTML tanpa renderer tidak meluber jauh.
// Dengan `effect`, salinan dekoratif memakai markup yang sama sehingga ikut dipaskan sama besar.
export function Display({ effect, ...props }: DisplayProps) {
  if (!effect) return <DisplayLayer {...props} />;
  return (
    <TextEffectFrame
      effect={effect}
      frame={{ width: "100%" }}
      render={(layer) => <DisplayLayer {...props} layer={layer} />}
    />
  );
}

// Satu lapisan Display: teks asli, atau salinan efek tanpa slot dan tanpa warna kedua.
function DisplayLayer({
  font,
  color: tone,
  scale,
  align = "center",
  stack = false,
  slot,
  accentWords,
  layer,
  children,
}: Omit<DisplayProps, "effect"> & { layer?: TextLayer }) {
  const cap = `calc(${fontSize(6)} * ${scale})`;
  const estimate = (text: string) =>
    `min(${cap}, calc(100cqw / ${(Math.max(text.length, 1) * ESTIMATE).toFixed(2)}))`;
  const words = stack ? children.split(/\s+/).filter(Boolean) : [];
  const copy = layer?.copy ?? false;
  const at = !copy && accentWords?.text ? children.indexOf(accentWords.text) : -1;
  const accent = at >= 0 ? accentWords : undefined;
  const end = at + (accent?.text.length ?? 0);
  // Posisi awal setiap kata, untuk menandai kata tumpukan yang termasuk frasa dua nada.
  const starts = accent && stack ? [...children.matchAll(/\S+/g)].map((m) => m.index) : [];
  const inAccent = (index: number, word: string) => {
    const start = starts[index] ?? -1;
    return start >= 0 && start < end && start + word.length > at;
  };
  return (
    <div style={{ containerType: "inline-size", width: "100%" }}>
      <p
        data-slot={copy ? undefined : slot}
        data-slot-type={slot && !copy ? "text" : undefined}
        data-fit={stack ? undefined : "width"}
        data-fit-max={stack ? undefined : cap}
        style={{
          margin: 0,
          fontFamily: fontFamily(font),
          fontWeight: fontWeight(font, true),
          fontSize: estimate(stack ? (words[0] ?? children) : children),
          fontSynthesis: "none",
          lineHeight: 0.9,
          whiteSpace: "nowrap",
          textAlign: align,
          textTransform: font === "heading" ? "var(--style-heading-transform, none)" : undefined,
          letterSpacing: font === "heading" ? "var(--style-heading-tracking, normal)" : undefined,
          color: color(layer?.color ?? tone),
          ...(stack ? undefined : layer?.style),
        }}
      >
        {stack ? (
          words.map((word, index) => (
            <span
              // biome-ignore lint/suspicious/noArrayIndexKey: kata boleh berulang, urutan tetap
              key={index}
              data-fit="width"
              data-fit-max={cap}
              style={{
                display: "block",
                fontSize: estimate(word),
                ...(accent && inAccent(index, word) ? { color: color(accent.color) } : undefined),
                ...layer?.style,
              }}
            >
              {word}
            </span>
          ))
        ) : accent ? (
          <>
            {children.slice(0, at)}
            <span style={{ color: color(accent.color) }}>{accent.text}</span>
            {children.slice(end)}
          </>
        ) : (
          children
        )}
      </p>
    </div>
  );
}
