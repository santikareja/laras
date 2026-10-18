import { type ColorToken, color, type FontRole, fontFamily, fontSize, fontWeight } from "./vars.ts";

type DisplayProps = {
  font: FontRole;
  color: ColorToken;
  // Kelipatan langkah terbesar skala brand (--font-size-6).
  scale: number;
  // Perkiraan lebar satu huruf dalam em, untuk membatasi ukuran agar muat satu baris.
  charWidth?: number;
  align?: "center" | "left" | "right";
  // Satu kata per baris, setiap baris dipaskan ke lebar kotak (tumpukan rata, PRD 4 K2).
  stack?: boolean;
  slot?: string;
  children: string;
};

// Kata raksasa (PRD 4 K2): kelipatan skala brand, dibatasi lebar kotak induk lewat container
// query agar satu baris tidak keluar kanvas. Bila perkiraan meleset, overflow tertangkap QA.
export function Display({
  font,
  color: tone,
  scale,
  charWidth = 0.7,
  align = "center",
  stack = false,
  slot,
  children,
}: DisplayProps) {
  const cap = `calc(${fontSize(6)} * ${scale})`;
  const fit = (text: string) =>
    `min(${cap}, calc(100cqw / ${(Math.max(text.length, 1) * charWidth).toFixed(2)}))`;
  const words = stack ? children.split(/\s+/).filter(Boolean) : [];
  return (
    <div style={{ containerType: "inline-size", width: "100%" }}>
      <p
        data-slot={slot}
        data-slot-type={slot ? "text" : undefined}
        style={{
          margin: 0,
          fontFamily: fontFamily(font),
          fontWeight: fontWeight(font, true),
          fontSize: fit(stack ? (words[0] ?? children) : children),
          fontSynthesis: "none",
          lineHeight: 0.9,
          whiteSpace: "nowrap",
          textAlign: align,
          color: color(tone),
        }}
      >
        {stack
          ? words.map((word, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: kata boleh berulang, urutan tetap
              <span key={index} style={{ display: "block", fontSize: fit(word) }}>
                {word}
              </span>
            ))
          : children}
      </p>
    </div>
  );
}
