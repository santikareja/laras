import type { ReactNode } from "react";
import { type ColorToken, color, type SpaceStep, space } from "./vars.ts";

type GridProps = {
  columns?: number;
  rows?: string;
  gap: SpaceStep;
  inset?: boolean;
  background?: ColorToken;
  children: ReactNode;
};

// Kolom sama lebar; penempatan anak (grid-column/grid-row) diatur template.
// inset memberi padding safe margin brand di keempat sisi.
export function Grid({ columns = 12, rows, gap, inset = false, background, children }: GridProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gridTemplateRows: rows,
        gap: space(gap),
        boxSizing: "border-box",
        width: "100%",
        height: "100%",
        padding: inset ? "var(--space-safe)" : undefined,
        background: background ? color(background) : undefined,
      }}
    >
      {children}
    </div>
  );
}
