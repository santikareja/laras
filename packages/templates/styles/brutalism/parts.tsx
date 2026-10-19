import type { CSSProperties, ReactNode } from "react";
import { type ImageTreatment, Photo } from "../../primitives/Photo.tsx";
import {
  type ColorToken,
  color,
  type FontSizeStep,
  fontFamily,
  fontSize,
  fontWeight,
  space,
} from "../../primitives/vars.ts";

// Perangkat arketipe khas Brutalisme (T-134, PANDUAN bagian 7 dan 9): tumpukan kata per baris
// dengan satu baris disorot, rangka grid bernomor, label dan anotasi berfont aksen (mono), garis
// penunjuk, dan foto yang dipotong per sel dengan bingkai yang bisa diatur. Semua warna dari
// token; garis dan rangka berupa dekorasi (`data-qa-element="decor"`, tanpa hit-testing).

// Garis minimal 2 px agar tidak hilang setelah Instagram memperkecil gambar (bagian 7).
export const STROKE = "max(2px, var(--shape-stroke))";
// Batang label 3–4× stroke, 6–8 px.
const BAR = "clamp(6px, calc(var(--shape-stroke) * 3), 8px)";

// Opasitas lewat color-mix agar QA membaca garis sebagai latar tembus pandang, bukan bidang padat.
export const tint = (token: ColorToken, opacity: number) =>
  `color-mix(in srgb, ${color(token)} ${Math.round(opacity * 100)}%, transparent)`;

// Font aksen Brand Kit (mono; jatuh ke font body bila brand tidak punya) untuk label, data, dan
// anotasi teknis.
export const accentFont = (strong = true): CSSProperties => ({
  fontFamily: "var(--font-accent)",
  fontWeight: `var(--font-accent-weight${strong ? "-strong" : ""})`,
  fontSynthesis: "none",
});

const DECOR: CSSProperties = { pointerEvents: "none" };

// --- Tumpukan kata ----------------------------------------------------------------------------

// Perlakuan satu baris tumpukan: tinta, warna aksen/primer, atau blok knock-out.
export type LineTone = "tinta" | "aksen" | "primer" | "blok" | "balik";

const LINE: Record<LineTone, { ink: ColorToken; block?: ColorToken }> = {
  tinta: { ink: "neutral-dark" },
  aksen: { ink: "accent" },
  primer: { ink: "primary" },
  blok: { ink: "neutral-dark", block: "accent" },
  balik: { ink: "neutral-light", block: "neutral-dark" },
};

// Satu kata per baris; kata ≤ 2 karakter (AM, 5K, DI) ikut baris sebelumnya agar tidak dipaskan
// sendirian menjadi raksasa.
export function stackLines(text: string): string[] {
  const lines: string[] = [];
  for (const word of text.trim().split(/\s+/).filter(Boolean)) {
    const last = lines.length - 1;
    if (last >= 0 && word.length <= 2) lines[last] = `${lines[last]} ${word}`;
    else lines.push(word);
  }
  return lines;
}

type StackProps = {
  slot?: string;
  children: string;
  // Batas ukuran: kelipatan langkah terbesar skala brand (--font-size-6).
  scale: number;
  // Perlakuan per baris (indeks); baris lain tinta.
  tones?: Record<number, LineTone>;
  align?: "left" | "right";
  // Nama anchor CSS untuk blok tumpukan dan baris terakhirnya, agar subjek dan anotasi bisa
  // menempel ke huruf yang sebenarnya (ukuran baris baru diketahui setelah fit renderer).
  anchors?: { block: string; last: string };
};

// Kata raksasa bertumpuk (PANDUAN bagian 5): setiap baris dipaskan renderer ke lebar kotak
// (data-fit), satu baris boleh disorot warna atau blok knock-out. Satu slot, jadi QA menghitung
// satu ukuran Display.
export function Stack({ slot, children, scale, tones = {}, align = "left", anchors }: StackProps) {
  const cap = `calc(${fontSize(6)} * ${scale})`;
  const lines = stackLines(children);
  return (
    <p
      data-slot={slot}
      data-slot-type={slot ? "text" : undefined}
      style={{
        margin: 0,
        fontFamily: fontFamily("heading"),
        fontWeight: fontWeight("heading", true),
        fontSize: fontSize(1),
        fontSynthesis: "none",
        lineHeight: 0.86,
        whiteSpace: "nowrap",
        textAlign: align,
        textTransform: "var(--style-heading-transform, none)" as CSSProperties["textTransform"],
        letterSpacing: "var(--style-heading-tracking, normal)",
        containerType: "inline-size",
        anchorName: anchors?.block,
      }}
    >
      {lines.map((line, index) => {
        const tone = LINE[tones[index] ?? "tinta"];
        const fit = (
          <span
            key="baris"
            data-fit="width"
            data-fit-max={cap}
            style={{
              display: "block",
              // Kotak baris = tinggi huruf kapital sampai garis dasar, sama untuk semua font
              // heading, jadi jarak antarbaris dan titik gigit subjek tidak bergantung metrik font.
              textBox: "trim-both cap alphabetic",
              // Perkiraan awal sebelum renderer mengukur (0,62 em per huruf).
              fontSize: `min(${cap}, calc(100cqw / ${(Math.max(line.length, 1) * 0.62).toFixed(2)}))`,
              marginTop: index > 0 && !tone.block ? "0.1em" : undefined,
              padding: tone.block ? "0.12em 0" : undefined,
              color: color(tone.ink),
              anchorName: index === lines.length - 1 ? anchors?.last : undefined,
            }}
          >
            {line}
          </span>
        );
        return tone.block ? (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: kata boleh berulang, urutan tetap
            key={index}
            style={{
              display: "block",
              marginTop: index > 0 ? space(3) : undefined,
              padding: `0 ${space(2)}`,
              borderRadius: "var(--shape-radius)",
              background: color(tone.block),
            }}
          >
            {fit}
          </span>
        ) : (
          // biome-ignore lint/suspicious/noArrayIndexKey: kata boleh berulang, urutan tetap
          <span key={index} style={{ display: "block" }}>
            {fit}
          </span>
        );
      })}
    </p>
  );
}

// --- Rangka grid ------------------------------------------------------------------------------

type RangkaProps = {
  columns?: number;
  // Opasitas garis kolom 35–70%.
  opacity?: number;
  // Warna garis; netral terang untuk garis yang melintas di atas blok gelap.
  tone?: ColorToken;
  // Potong lapisan ke satu bidang (clip-path kanvas), mis. garis di atas blok dasar.
  clip?: string;
};

// Garis kolom grid dari tepi atas sampai bawah kanvas, x di dalam area aman (PANDUAN bagian 4,
// "GarisGrid"): grid yang dipamerkan, di belakang semua isi.
export function Rangka({ columns = 12, opacity = 0.35, tone = "neutral-dark", clip }: RangkaProps) {
  const line = tint(tone, Math.min(Math.max(opacity, 0.35), 0.7));
  return (
    <div
      data-qa-element="decor"
      aria-hidden="true"
      style={{ ...DECOR, position: "absolute", inset: 0, clipPath: clip }}
    >
      {Array.from({ length: columns + 1 }, (_, i) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: garis ke-i, urutan tetap
          key={i}
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: `calc(var(--space-safe) + (100% - 2 * var(--space-safe)) * ${i} / ${columns})`,
            width: STROKE,
            transform: "translateX(-50%)",
            background: line,
          }}
        />
      ))}
    </div>
  );
}

const MARK = 28; // tanda register 24–32 px

// Tanda register (+) 28 px berpusat di titik kotak induknya (`left`/`top` dari pemakai).
function Register({ style }: { style: CSSProperties }) {
  const arm = (vertical: boolean): CSSProperties => ({
    position: "absolute",
    background: color("neutral-dark"),
    ...(vertical
      ? { top: 0, bottom: 0, left: "50%", width: STROKE, translate: "-50% 0" }
      : { left: 0, right: 0, top: "50%", height: STROKE, translate: "0 -50%" }),
  });
  return (
    <span
      style={{
        position: "absolute",
        width: MARK,
        height: MARK,
        translate: "-50% -50%",
        ...style,
      }}
    >
      <span style={arm(false)} />
      <span style={arm(true)} />
    </span>
  );
}

// Penggaris kolom 01–12 di atas garis horizontal penuh (sejajar garis Rangka). Dekorasi: nomor
// kolom adalah struktur grid, bukan data.
export function Ruler({ columns = 12 }: { columns?: number }) {
  return (
    <div
      data-qa-element="decor"
      aria-hidden="true"
      style={{
        ...DECOR,
        position: "relative",
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        paddingBottom: space(1),
        borderBottom: `${STROKE} solid ${color("neutral-dark")}`,
      }}
    >
      {Array.from({ length: columns }, (_, i) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: nomor kolom, urutan tetap
          key={i}
          style={{
            ...accentFont(),
            paddingLeft: space(1),
            fontSize: fontSize(1),
            lineHeight: 1,
            color: color("neutral-dark"),
          }}
        >
          {String(i + 1).padStart(2, "0")}
        </span>
      ))}
      <Register style={{ left: 0, top: "100%" }} />
      <Register style={{ left: "100%", top: "100%" }} />
    </div>
  );
}

// --- Label dan anotasi -----------------------------------------------------------------------

type MonoProps = {
  slot?: string;
  color: ColorToken;
  size?: FontSizeStep;
  // Batang tebal di atas label (LabelTeknis); warna batang.
  bar?: ColorToken;
  align?: "left" | "right";
  children: string;
};

// Label teknis berfont aksen: kapital, tracking +8%, 24 px; batang opsional di atasnya.
export function Mono({ slot, color: tone, size = 1, bar, align = "left", children }: MonoProps) {
  return (
    <div style={{ display: "grid", justifyItems: align === "right" ? "end" : "start" }}>
      {bar && (
        <span
          aria-hidden="true"
          style={{
            display: "block",
            width: 64,
            height: BAR,
            marginBottom: space(2),
            background: color(bar),
          }}
        />
      )}
      <p
        data-slot={slot}
        data-slot-type={slot ? "text" : undefined}
        style={{
          ...accentFont(),
          margin: 0,
          fontSize: fontSize(size),
          lineHeight: 1.2,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          textAlign: align,
          textWrap: "balance",
          color: color(tone),
        }}
      >
        {children}
      </p>
    </div>
  );
}

// Baris kredit "JUDUL: isi" (rujukan poster film): judul berwarna `head`, isi tinta. Teks dari
// copy dipisah " / " per baris.
export function Credits({
  slot,
  head,
  children,
  align = "left",
}: {
  slot?: string;
  head: ColorToken;
  children: string;
  align?: "left" | "right";
}) {
  const rows = pairs(children);
  return (
    <div
      data-slot={slot}
      data-slot-type={slot ? "text" : undefined}
      style={{
        ...accentFont(),
        display: "grid",
        gap: space(1),
        fontSize: fontSize(1),
        lineHeight: 1.15,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        textAlign: align,
        color: color("neutral-dark"),
      }}
    >
      {rows.map((row, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: isi boleh kembar, urutan tetap
        <p key={index} style={{ margin: 0 }}>
          {row.label && <span style={{ color: color(head) }}>{row.label}: </span>}
          {row.value}
        </p>
      ))}
    </div>
  );
}

// Garis penunjuk anotasi: garis mendatar sepanjang kotaknya dengan titik di ujung `to`.
export function Leader({ to }: { to: "left" | "right" }) {
  const dot = 16;
  return (
    <span
      data-qa-element="decor"
      aria-hidden="true"
      style={{
        ...DECOR,
        position: "relative",
        display: "block",
        flex: "1 1 auto",
        minWidth: space(5),
        height: dot,
      }}
    >
      <span
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: "50%",
          height: STROKE,
          translate: "0 -50%",
          background: color("neutral-dark"),
        }}
      />
      <span
        style={{
          position: "absolute",
          [to]: 0,
          top: 0,
          width: dot,
          height: dot,
          borderRadius: "50%",
          background: color("neutral-dark"),
        }}
      />
    </span>
  );
}

// --- Foto per sel -----------------------------------------------------------------------------

// Bingkai foto di dalam grid sel: `zoom` relatif terhadap ukuran cover grid, titik gambar (x, y)
// yang diletakkan di (atX, atY) grid. Posisi dijepit agar gambar selalu menutup grid.
export type CellFrame = { zoom: number; x: number; y: number; atX?: number; atY?: number };

export type CellFill =
  // Potongan foto; `tint` mencetak satu sel dengan warna token (multiply), mis. sel aksen.
  | { kind: "photo"; tint?: ColorToken }
  // Sel kosong: latar kanvas terlihat, isinya teks dari copy (mis. body).
  | { kind: "panel"; children?: ReactNode; span?: number }
  // Blok warna berisi teks dari copy (mis. CTA).
  | { kind: "block"; background: ColorToken; children?: ReactNode };

type CellsProps = {
  src: string;
  // Rasio gambar (lebar/tinggi); aset Laras 4:5.
  aspect?: number;
  columns: number;
  rows: number;
  gap: number;
  frame: CellFrame;
  treatment?: ImageTreatment;
  // Isi sel per indeks (baris demi baris); tanpa nilai berarti foto.
  fills?: Record<number, CellFill>;
  slot?: string;
};

// Satu foto dipotong ke sel berjeda (PANDUAN bagian 7 "SelFoto", rujukan c9ca…). Setiap sel
// memuat gambar seukuran bingkai yang sama, digeser sebesar posisi selnya, jadi foto menyambung
// melintasi celah. Panel `span` 2 menempati dua sel mendatar (sel berikutnya dilewati).
export function Cells({
  src,
  aspect = 4 / 5,
  columns,
  rows,
  gap,
  frame,
  treatment = { kind: "natural" },
  fills = {},
  slot,
}: CellsProps) {
  // Ukuran gambar: cover grid (rasio grid dari container query), lalu diperbesar `zoom`.
  const width = `max(100cqw, calc(100cqh * ${aspect.toFixed(4)})) * ${frame.zoom}`;
  const height = `(${width}) / ${aspect.toFixed(4)}`;
  const left = `clamp(calc(100cqw - ${width}), calc(${frame.atX ?? 0.5} * 100cqw - ${frame.x} * ${width}), 0px)`;
  const top = `clamp(calc(100cqh - ${height}), calc(${frame.atY ?? 0.5} * 100cqh - ${frame.y} * ${height}), 0px)`;
  const cell = (n: number, axis: "cqw" | "cqh", count: number) =>
    `((100${axis} + ${gap}px) * ${n} / ${count})`;
  const skipped = new Set<number>();
  for (const [index, fill] of Object.entries(fills)) {
    if (fill.kind === "panel" && (fill.span ?? 1) > 1) {
      for (let k = 1; k < (fill.span ?? 1); k++) skipped.add(Number(index) + k);
    }
  }
  return (
    <div
      data-slot={slot}
      data-slot-type={slot ? "image" : undefined}
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
        gap,
        width: "100%",
        height: "100%",
        containerType: "size",
      }}
    >
      {Array.from({ length: columns * rows }, (_, i) => i).map((i) => {
        if (skipped.has(i)) return null;
        const fill = fills[i] ?? { kind: "photo" };
        const col = i % columns;
        const row = Math.floor(i / columns);
        if (fill.kind === "panel")
          return (
            <div
              key={i}
              style={{
                gridColumn: `span ${fill.span ?? 1}`,
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                minWidth: 0,
              }}
            >
              {fill.children}
            </div>
          );
        if (fill.kind === "block")
          return (
            <div
              key={i}
              style={{
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                minWidth: 0,
                padding: space(3),
                borderRadius: "var(--shape-radius)",
                background: color(fill.background),
              }}
            >
              {fill.children}
            </div>
          );
        return (
          <div
            key={i}
            style={{
              position: "relative",
              overflow: "hidden",
              borderRadius: "var(--shape-radius)",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: `calc(${left} - ${cell(col, "cqw", columns)})`,
                top: `calc(${top} - ${cell(row, "cqh", rows)})`,
                width: `calc(${width})`,
                height: `calc(${height})`,
              }}
            >
              <Photo src={src} treatment={treatment} />
            </div>
            {fill.tint && (
              <div
                aria-hidden="true"
                style={{
                  ...DECOR,
                  position: "absolute",
                  inset: 0,
                  background: color(fill.tint),
                  mixBlendMode: "multiply",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// --- Baris info ---------------------------------------------------------------------------------

// "Judul: isi" dipisah " / " → pasangan judul dan isi (kredit, baris info).
export function pairs(text: string): { label: string; value: string }[] {
  return text
    .split(/\s+\/\s+/)
    .map((row) => row.trim())
    .filter(Boolean)
    .map((row) => {
      const at = row.indexOf(":");
      return at > 0
        ? { label: row.slice(0, at).trim(), value: row.slice(at + 1).trim() }
        : { label: "", value: row };
    });
}

// Baris info 2–4 kolom bergaya arsip (rujukan 365b…: RECORD NO. / LOCATION / STATUS): judul
// kolom berwarna `head` di atas isinya, garis penuh di atasnya. Teks dari copy.
export function InfoRow({
  slot,
  head,
  children,
}: {
  slot?: string;
  head: ColorToken;
  children: string;
}) {
  const items = pairs(children);
  return (
    <div
      data-slot={slot}
      data-slot-type={slot ? "text" : undefined}
      style={{
        ...accentFont(),
        display: "grid",
        gridTemplateColumns: `repeat(${Math.max(items.length, 1)}, minmax(0, 1fr))`,
        columnGap: space(3),
        paddingTop: space(3),
        borderTop: `${STROKE} solid ${color("neutral-dark")}`,
        fontSize: fontSize(1),
        lineHeight: 1.15,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        color: color("neutral-dark"),
      }}
    >
      {/* Urutan DOM per baris (semua judul, lalu semua isi): satu baris baca per deret. */}
      {items.map((item, index) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: isi boleh kembar, urutan tetap
          key={`judul-${index}`}
          style={{ marginBottom: space(1), color: color(head) }}
        >
          {item.label}{" "}
        </span>
      ))}
      {items.map((item, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: isi boleh kembar, urutan tetap
        <span key={`isi-${index}`}>{item.value} </span>
      ))}
    </div>
  );
}

// --- Tepi sobek ---------------------------------------------------------------------------------

// Bilangan semu-acak 0–1 dari bilangan bulat: pola sobekan sama di setiap render.
function noise(n: number): number {
  let x = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b);
  x ^= x >>> 13;
  x = Math.imul(x, 0xc2b2ae35);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}

// clip-path poligon dengan tepi atas dan/atau bawah sobek (gerigi 3–10 px setiap ±3% lebar).
export function tornClip(seed: number, top: boolean, bottom: boolean): string {
  const steps = 32;
  const edge = (y: (jag: number) => string, offset: number) =>
    Array.from({ length: steps + 1 }, (_, i) => {
      const jag = 3 + Math.round(noise(seed * 101 + offset + i) * 7);
      return `${((i / steps) * 100).toFixed(2)}% ${y(jag)}`;
    });
  const upper = top ? edge((jag) => `${jag}px`, 0) : ["0% 0%", "100% 0%"];
  const lower = bottom
    ? edge((jag) => `calc(100% - ${jag}px)`, 500).reverse()
    : ["100% 100%", "0% 100%"];
  return `polygon(${[...upper, ...lower].join(", ")})`;
}
