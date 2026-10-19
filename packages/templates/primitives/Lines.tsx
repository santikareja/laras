import type { CSSProperties, ReactNode } from "react";
import {
  type ColorToken,
  color,
  fontFamily,
  fontSize,
  fontWeight,
  type SpaceStep,
  space,
} from "./vars.ts";

// Garis dan bingkai dekoratif per gaya (T-132): tanpa teks copy dan tanpa data-slot. Spesifikasi
// di styles/<gaya>/PANDUAN.md bagian 7. Lapisan mengisi kotak induknya; penempatan oleh pemakai.

export type Side = "top" | "right" | "bottom" | "left";

// Garis minimal 2 px: garis 1 px hilang setelah Instagram memperkecil gambar (Brutalisme 7).
const STROKE = "max(2px, var(--shape-stroke))";
// Garis rambut Minimalism: --shape-stroke dibatasi 2–4 px.
const HAIRLINE = "clamp(2px, var(--shape-stroke), 4px)";
// Garis tebal bingkai cetak Retro: 6–8 px.
const THICK = "clamp(6px, calc(var(--shape-stroke) * 3), 8px)";
// Border Neo-brutalism: 2–3× stroke, 4–8 px.
const BORDER = "clamp(4px, calc(var(--shape-stroke) * 3), 8px)";

const FILL: CSSProperties = { position: "absolute", inset: 0 };

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

// Opasitas lewat color-mix (bukan `opacity`) agar QA membaca garis sebagai latar tembus pandang.
function tint(token: ColorToken, opacity: number): string {
  if (opacity >= 1) return color(token);
  return `color-mix(in srgb, ${color(token)} ${Math.round(opacity * 100)}%, transparent)`;
}

type RuleProps = {
  color: ColorToken;
  // Panjang dalam px kanvas; tanpa nilai mengisi panjang kotak induk.
  length?: number;
  vertical?: boolean;
  // Tebal dalam px (mis. 6 untuk garis aksen Corporate); tanpa nilai garis rambut 2–4 px.
  weight?: number;
};

// Minimalism "garis rambut" dan Corporate "garis aksen pendek": pemisah headline-body atau lantai.
export function Rule({ color: tone, length, vertical = false, weight }: RuleProps) {
  const along = length === undefined ? "100%" : `${length}px`;
  const across = weight === undefined ? HAIRLINE : `${weight}px`;
  return (
    <span
      data-qa-element="decor"
      aria-hidden="true"
      style={{
        display: "block",
        flex: "none",
        width: vertical ? across : along,
        height: vertical ? along : across,
        background: color(tone),
      }}
    />
  );
}

type GridLinesProps = {
  color: ColorToken;
  columns?: number;
  // Jumlah baris modul (8–12 di Brutalisme); tanpa nilai hanya garis kolom.
  rows?: number;
  // Celah seperti `Grid`: garis dalam jatuh di tengah celah, garis luar di tepi area aman.
  gap?: SpaceStep;
  // Opasitas garis 35–70%.
  opacity?: number;
  // Tanda register (+) di persilangan garis kolom ke-c dan garis baris ke-r (0 = tepi), maks 4.
  marks?: Array<[column: number, row: number]>;
  // Nomor penggaris 01–12 di pojok atas setiap kolom.
  ruler?: boolean;
};

const MARK = 28; // tanda register 24–32 px

// Brutalisme "GarisGrid": overlay garis kolom/baris 12 kolom di dalam safe margin.
export function GridLines({
  color: tone,
  columns = 12,
  rows = 0,
  gap,
  opacity = 0.5,
  marks = [],
  ruler = false,
}: GridLinesProps) {
  const line = tint(tone, clamp(opacity, 0.35, 0.7));
  const at = (i: number, count: number) => {
    if (i <= 0) return "0%";
    if (i >= count) return "100%";
    if (!gap) return `calc(100% * ${i} / ${count})`;
    return `calc((100% + ${space(gap)}) * ${i} / ${count} - ${space(gap)} / 2)`;
  };
  const indices = (count: number) => Array.from({ length: count + 1 }, (_, i) => i);
  const bar = (key: string, style: CSSProperties, fill = line) => (
    <span key={key} style={{ position: "absolute", background: fill, ...style }} />
  );
  return (
    <div
      data-qa-element="decor"
      aria-hidden="true"
      style={{ position: "absolute", inset: "var(--space-safe)" }}
    >
      {indices(columns).map((i) =>
        bar(`c${i}`, {
          top: 0,
          bottom: 0,
          left: at(i, columns),
          width: STROKE,
          transform: "translateX(-50%)",
        }),
      )}
      {rows > 0 &&
        indices(rows).map((i) =>
          bar(`r${i}`, {
            left: 0,
            right: 0,
            top: at(i, rows),
            height: STROKE,
            transform: "translateY(-50%)",
          }),
        )}
      {marks.slice(0, 4).map(([c, r], index) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: isi boleh kembar, urutan tetap
          key={`m${index}-${c}-${r}`}
          style={{
            position: "absolute",
            left: at(c, columns),
            top: at(r, Math.max(rows, 1)),
            width: MARK,
            height: MARK,
            transform: "translate(-50%, -50%)",
          }}
        >
          {bar(
            "h",
            { left: 0, right: 0, top: "50%", height: STROKE, translate: "0 -50%" },
            color(tone),
          )}
          {bar(
            "v",
            { top: 0, bottom: 0, left: "50%", width: STROKE, translate: "-50% 0" },
            color(tone),
          )}
        </span>
      ))}
      {ruler &&
        indices(columns - 1).map((i) => (
          <span
            key={`n${i}`}
            style={{
              position: "absolute",
              top: space(1),
              // Awal kolom ke-i (bukan garis di tengah celah) ditambah satu langkah spasi.
              left: gap
                ? `calc((100% + ${space(gap)}) * ${i} / ${columns} + ${space(1)})`
                : `calc(100% * ${i} / ${columns} + ${space(1)})`,
              fontFamily: fontFamily("body"),
              fontWeight: fontWeight("body", true),
              fontSize: fontSize(1),
              fontSynthesis: "none",
              lineHeight: 1,
              letterSpacing: "0.08em",
              color: color(tone),
            }}
          >
            {String(i + 1).padStart(2, "0")}
          </span>
        ))}
    </div>
  );
}

type OutlineFrameProps = {
  color: ColorToken;
  // Jarak bingkai dari kotak induk, 16–32 px.
  offset?: number;
  // Tepi tempat garis bingkai masuk dan menimpa kotak induk (mis. foto inset).
  side?: Side;
};

// Minimalism "OutlineFrame": persegi garis yang menjauh 16–32 px dari foto inset di tiga sisi dan
// masuk menimpa satu tepinya. Diletakkan sesudah foto di kotak yang sama.
export function OutlineFrame({ color: tone, offset = 24, side = "left" }: OutlineFrameProps) {
  const d = clamp(offset, 16, 32);
  const at = (s: Side) => `${s === side ? d : -d}px`;
  return (
    <span
      data-qa-element="decor"
      aria-hidden="true"
      style={{
        position: "absolute",
        top: at("top"),
        right: at("right"),
        bottom: at("bottom"),
        left: at("left"),
        border: `${HAIRLINE} solid ${color(tone)}`,
        // Radius brand, kecuali ≥ 32 px: radius besar hanya untuk foto, bukan garis (Minimalism 7).
        borderRadius: "clamp(0px, calc((32px - var(--shape-radius)) * 1000), var(--shape-radius))",
      }}
    />
  );
}

type HardFrameProps = {
  // Warna bayangan keras.
  shadow: ColorToken;
  // Border tebal 2–3× stroke (Brutalisme Neo); tanpa nilai tanpa border (Flat "BayanganDatar").
  edge?: ColorToken;
  background?: ColorToken;
  // Offset bayangan ke kanan bawah: 12–20 px (Brutalisme), 12–24 px (Flat).
  offset?: number;
  children?: ReactNode;
};

// Brutalisme Neo "BingkaiKeras" dan Flat "BayanganDatar": pembungkus kartu, foto, tombol, atau
// chip dengan border tebal dan bayangan keras tanpa blur. Mengisi kotak induknya.
export function HardFrame({ shadow, edge, background, offset = 16, children }: HardFrameProps) {
  const d = clamp(offset, 12, 24);
  return (
    <div
      style={{
        position: "relative",
        boxSizing: "border-box",
        width: "100%",
        height: "100%",
        border: edge ? `${BORDER} solid ${color(edge)}` : undefined,
        borderRadius: "var(--shape-radius)",
        background: background ? color(background) : undefined,
        boxShadow: `${d}px ${d}px 0 0 ${color(shadow)}`,
      }}
    >
      {children}
    </div>
  );
}

type HudFrameProps = {
  color: ColorToken;
  // Panjang lengan sudut L, 40–64 px.
  arm?: number;
  // Opasitas 70–100%.
  opacity?: number;
  // 5–9 tanda tick di tengah satu tepi.
  ticks?: { side: Side; count: number };
  // Tanda plus (maks 4), posisi pecahan 0–1 dari area aman.
  plus?: Array<[x: number, y: number]>;
};

const PLUS = 20; // tanda plus 16–24 px

// Cyberpunk "Bingkai HUD": empat sudut L di garis safe margin, tanpa teks.
export function HudFrame({ color: tone, arm = 56, opacity = 1, ticks, plus = [] }: HudFrameProps) {
  const ink = tint(tone, clamp(opacity, 0.7, 1));
  const length = `${clamp(arm, 40, 64)}px`;
  const edge = `${STROKE} solid ${ink}`;
  const corner = (vertical: "top" | "bottom", horizontal: "left" | "right") => {
    const style: CSSProperties = {
      position: "absolute",
      width: length,
      height: length,
      boxSizing: "border-box",
    };
    style[vertical] = 0;
    style[horizontal] = 0;
    style[vertical === "top" ? "borderTop" : "borderBottom"] = edge;
    style[horizontal === "left" ? "borderLeft" : "borderRight"] = edge;
    return <span key={`${vertical}-${horizontal}`} style={style} />;
  };
  return (
    <div
      data-qa-element="decor"
      aria-hidden="true"
      style={{ position: "absolute", inset: "var(--space-safe)" }}
    >
      {corner("top", "left")}
      {corner("top", "right")}
      {corner("bottom", "left")}
      {corner("bottom", "right")}
      {ticks && <Ticks side={ticks.side} count={ticks.count} ink={ink} />}
      {plus.slice(0, 4).map(([x, y], index) => (
        <span
          // biome-ignore lint/suspicious/noArrayIndexKey: isi boleh kembar, urutan tetap
          key={`${index}-${x}-${y}`}
          style={{
            position: "absolute",
            left: `${x * 100}%`,
            top: `${y * 100}%`,
            width: PLUS,
            height: PLUS,
            transform: "translate(-50%, -50%)",
          }}
        >
          <span
            style={{
              ...FILL,
              top: "50%",
              bottom: "auto",
              height: STROKE,
              translate: "0 -50%",
              background: ink,
            }}
          />
          <span
            style={{
              ...FILL,
              left: "50%",
              right: "auto",
              width: STROKE,
              translate: "-50% 0",
              background: ink,
            }}
          />
        </span>
      ))}
    </div>
  );
}

// Deret tick tegak lurus tepi, mulai dari garis safe margin ke dalam; tick tengah lebih panjang.
function Ticks({ side, count, ink }: { side: Side; count: number; ink: string }) {
  const n = clamp(Math.round(count), 5, 9);
  const across = side === "top" || side === "bottom";
  const style: CSSProperties = {
    position: "absolute",
    display: "flex",
    flexDirection: across ? "row" : "column",
    alignItems: side === "top" || side === "left" ? "flex-start" : "flex-end",
    gap: space(3),
    ...(across
      ? { left: "50%", transform: "translateX(-50%)" }
      : { top: "50%", transform: "translateY(-50%)" }),
  };
  style[side] = 0;
  return (
    <span style={style}>
      {Array.from({ length: n }, (_, i) => {
        const size = i === Math.floor(n / 2) ? "16px" : "10px";
        return (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: deret tetap tanpa identitas lain
            key={i}
            style={{
              display: "block",
              width: across ? STROKE : size,
              height: across ? size : STROKE,
              background: ink,
            }}
          />
        );
      })}
    </span>
  );
}

type CanvasFrameProps = {
  color: ColorToken;
  // Jarak garis dari tepi kotak induk: 28–40 px (Retro), 32–40 px (Flat).
  inset?: number;
  // Garis ganda tebal-tipis (Retro); tanpa nilai garis tunggal setebal stroke (Flat).
  double?: boolean;
  // Opasitas garis, mis. agar garis Flat hanya 1,5–3:1 terhadap latar.
  opacity?: number;
};

const DOUBLE_GAP = 10; // jeda garis ganda 8–12 px
const THIN = 2; // garis tipis bingkai ganda

// Retro "RetroFrame" (a) bingkai garis ganda dan Flat "BingkaiGaris" garis tunggal di dalam tepi
// kotak induk (biasanya kanvas).
export function CanvasFrame({
  color: tone,
  inset = 32,
  double = false,
  opacity = 1,
}: CanvasFrameProps) {
  const ink = tint(tone, opacity);
  const d = clamp(inset, 28, 40);
  const ring = (offset: string, width: string, radius: string) => (
    <span
      key={offset}
      style={{
        position: "absolute",
        inset: offset,
        border: `${width} solid ${ink}`,
        borderRadius: radius,
      }}
    />
  );
  return (
    <div data-qa-element="decor" aria-hidden="true" style={FILL}>
      {ring(`${d}px`, double ? THICK : STROKE, "var(--shape-radius)")}
      {double &&
        ring(
          `calc(${d + DOUBLE_GAP}px + ${THICK})`,
          `${THIN}px`,
          `max(0px, calc(var(--shape-radius) - ${DOUBLE_GAP}px - ${THICK}))`,
        )}
    </div>
  );
}

type OvalFrameProps = {
  color: ColorToken;
  // Foto yang dibingkai (Image atau Photo), dipotong oval.
  children: ReactNode;
};

// Retro "RetroFrame" (b): bingkai oval 3:4 bergaris ganda untuk foto; lebar dari kotak induk.
export function OvalFrame({ color: tone, children }: OvalFrameProps) {
  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: "3 / 4" }}>
      <span
        aria-hidden="true"
        style={{
          ...FILL,
          borderRadius: "50%",
          border: `${THICK} solid ${color(tone)}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: `calc(${THICK} + ${DOUBLE_GAP}px)`,
          borderRadius: "50%",
          border: `${THIN}px solid ${color(tone)}`,
          overflow: "hidden",
        }}
      >
        {children}
      </div>
    </div>
  );
}
