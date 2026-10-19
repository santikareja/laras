import type { CSSProperties, ReactNode } from "react";
import {
  type ColorToken,
  color,
  fontFamily,
  fontSize,
  fontWeight,
  space,
} from "../primitives/vars.ts";

// Kerangka spesimen perangkat per gaya (T-132), dipakai `Specimen` di render.tsx setiap gaya.

// Kisi sel spesimen: kolom × baris mengisi area di dalam safe margin.
export function SpecimenGrid({
  columns,
  rows,
  children,
}: {
  columns: number;
  rows: number;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
        gap: space(3),
        height: "100%",
        minHeight: 0,
      }}
    >
      {children}
    </div>
  );
}

// Satu sel: bidang contoh dengan nama perangkat di pita bawah (selalu netral agar terbaca).
export function SpecimenCell({
  name,
  background = "neutral-light",
  span = 1,
  style,
  children,
}: {
  name: string;
  background?: ColorToken;
  span?: number;
  style?: CSSProperties;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        gridColumn: span > 1 ? `span ${span}` : undefined,
        background: color(background),
        outline: `1px solid color-mix(in srgb, ${color("neutral-dark")} 20%, transparent)`,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ position: "relative", flex: 1, minHeight: 0, ...style }}>{children}</div>
      <p
        style={{
          margin: 0,
          padding: `${space(1)} ${space(2)}`,
          background: color("neutral-light"),
          color: color("neutral-dark"),
          fontFamily: fontFamily("body"),
          fontWeight: fontWeight("body", false),
          fontSize: fontSize(1),
          fontSynthesis: "none",
          lineHeight: 1.2,
          whiteSpace: "nowrap",
        }}
      >
        {name}
      </p>
    </div>
  );
}
