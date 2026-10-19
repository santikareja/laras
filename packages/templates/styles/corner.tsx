import type { ReactNode } from "react";
import type { Corner } from "../src/style.ts";

// Penempatan elemen gaya di sudut kosong yang disediakan arketipe, tepat di safe margin.
export function AtCorner({ corner, children }: { corner: Corner; children: ReactNode }) {
  const [vertical, horizontal] = corner.split("-") as ["top" | "bottom", "left" | "right"];
  return (
    <div
      style={{
        position: "absolute",
        [vertical]: "var(--space-safe)",
        [horizontal]: "var(--space-safe)",
        display: "flex",
        flexDirection: "column",
        alignItems: horizontal === "right" ? "flex-end" : "flex-start",
        textAlign: horizontal,
      }}
    >
      {children}
    </div>
  );
}
