import type { ReactNode } from "react";
import { type ImageTreatment, Photo } from "./Photo.tsx";
import { type ColorToken, color, space } from "./vars.ts";

const GRIDS = { "3x2": [3, 2], "3x3": [3, 3], "4x3": [4, 3] } as const;

type PhotoCellsProps = {
  src: string;
  // Kolom × baris.
  grid?: keyof typeof GRIDS;
  // Celah antarsel 8–16 px; celah memotong foto, bukan menggeser isinya.
  gap?: number;
  // Perlakuan foto gaya (mono, halftone, fotokopi, duotone).
  treatment?: ImageTreatment;
  // Indeks sel (baris demi baris, mulai 0) yang turun setengah atau satu modul (Brutalisme 7).
  // Sel di baris terakhir menjulur keluar kotak; pemakai menyisakan ruang di bawahnya.
  shift?: number;
  shiftBy?: "half" | "full";
  // Satu sel diganti blok aksen berisi children (teks dari copy; pemakai memberi slot pada teksnya,
  // mis. Text dengan `slot`, agar ikut dicek QA). Blok selalu di atas foto yang digeser.
  block?: { cell: number; background: ColorToken; children: ReactNode };
  slot?: string;
};

// Satu foto dipotong ke sel grid dengan celah (Brutalisme SelFoto); mengisi kotak induknya.
// Tiap sel menampilkan potongan foto yang dibentang seukuran seluruh grid, jadi foto tetap
// menyambung melintasi celah.
export function PhotoCells({
  src,
  grid = "3x2",
  gap = 12,
  treatment = { kind: "natural" },
  shift,
  shiftBy = "half",
  block,
  slot,
}: PhotoCellsProps) {
  const [cols, rows] = GRIDS[grid];
  const cell = (n: number, axis: "cqw" | "cqh") =>
    `calc((100${axis} + ${gap}px) * ${n} / ${axis === "cqw" ? cols : rows})`;
  return (
    <div
      data-slot={slot}
      data-slot-type={slot ? "image" : undefined}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
        gap,
        width: "100%",
        height: "100%",
        containerType: "size",
      }}
    >
      {Array.from({ length: cols * rows }, (_, i) => `sel-${i}`).map((id, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        if (block?.cell === i)
          return (
            <div
              key={id}
              style={{
                position: "relative",
                zIndex: 2,
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                padding: space(3),
                borderRadius: "var(--shape-radius)",
                background: color(block.background),
              }}
            >
              {block.children}
            </div>
          );
        return (
          <div
            key={id}
            style={{
              position: "relative",
              overflow: "hidden",
              borderRadius: "var(--shape-radius)",
              ...(shift === i
                ? {
                    zIndex: 1,
                    transform:
                      shiftBy === "full" ? `translateY(calc(100% + ${gap}px))` : "translateY(50%)",
                  }
                : {}),
            }}
          >
            <div
              style={{
                position: "absolute",
                left: `calc(-1 * ${cell(col, "cqw")})`,
                top: `calc(-1 * ${cell(row, "cqh")})`,
                width: "100cqw",
                height: "100cqh",
              }}
            >
              <Photo src={src} treatment={treatment} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
