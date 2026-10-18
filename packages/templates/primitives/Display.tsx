import { type ColorToken, color, type FontRole, fontFamily, fontSize, fontWeight } from "./vars.ts";

type DisplayProps = {
  font: FontRole;
  color: ColorToken;
  // Kelipatan langkah terbesar skala brand (--font-size-6).
  scale: number;
  // Perkiraan lebar satu huruf dalam em, untuk membatasi ukuran agar muat satu baris.
  charWidth?: number;
  align?: "center" | "left" | "right";
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
  slot,
  children,
}: DisplayProps) {
  const fit = `calc(100cqw / ${(Math.max(children.length, 1) * charWidth).toFixed(2)})`;
  return (
    <div style={{ containerType: "inline-size", width: "100%" }}>
      <p
        data-slot={slot}
        data-slot-type={slot ? "text" : undefined}
        style={{
          margin: 0,
          fontFamily: fontFamily(font),
          fontWeight: fontWeight(font, true),
          fontSize: `min(calc(${fontSize(6)} * ${scale}), ${fit})`,
          fontSynthesis: "none",
          lineHeight: 0.9,
          whiteSpace: "nowrap",
          textAlign: align,
          color: color(tone),
        }}
      >
        {children}
      </p>
    </div>
  );
}
