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
  children: string;
};

// Perkiraan awal lebar huruf (em) sebelum renderer mengukur; nilai akhirnya dari langkah fit.
const ESTIMATE = 0.6;

// Kata raksasa (PRD 4 K2). Setiap baris bertanda data-fit: renderer mengukur lebar teks
// sebenarnya dan menskalakannya agar mengisi lebar kotak, dibatasi `scale` (fit-to-width T-123).
// Ukuran awal hanya perkiraan lewat container query agar HTML tanpa renderer tidak meluber jauh.
export function Display({
  font,
  color: tone,
  scale,
  align = "center",
  stack = false,
  slot,
  children,
}: DisplayProps) {
  const cap = `calc(${fontSize(6)} * ${scale})`;
  const estimate = (text: string) =>
    `min(${cap}, calc(100cqw / ${(Math.max(text.length, 1) * ESTIMATE).toFixed(2)}))`;
  const words = stack ? children.split(/\s+/).filter(Boolean) : [];
  return (
    <div style={{ containerType: "inline-size", width: "100%" }}>
      <p
        data-slot={slot}
        data-slot-type={slot ? "text" : undefined}
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
          color: color(tone),
        }}
      >
        {stack
          ? words.map((word, index) => (
              <span
                // biome-ignore lint/suspicious/noArrayIndexKey: kata boleh berulang, urutan tetap
                key={index}
                data-fit="width"
                data-fit-max={cap}
                style={{ display: "block", fontSize: estimate(word) }}
              >
                {word}
              </span>
            ))
          : children}
      </p>
    </div>
  );
}
