import { type CSSProperties, Fragment } from "react";
import {
  type ColorToken,
  color,
  type FontSizeStep,
  fontFamily,
  fontSize,
  fontWeight,
  space,
} from "./vars.ts";

// Label bertekst per gaya (T-132). Semua teks dari props (isi copy); kurung, garis miring, dan
// batang hanya dekorasi format. Font label = font body (font aksen menunggu T-124).

// Batang label Brutalisme: 3–4× --shape-stroke, 6–8 px.
const BAR = "clamp(6px, calc(var(--shape-stroke) * 3), 8px)";

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

// Label kapital langkah 1 dengan tracking lebar (Brutalisme +6–12%, Cyberpunk +8–12%).
function caps(tone: ColorToken, tracking: string): CSSProperties {
  return {
    fontFamily: fontFamily("body"),
    fontWeight: fontWeight("body", true),
    fontSize: fontSize(1),
    fontSynthesis: "none",
    lineHeight: 1.2,
    textTransform: "uppercase",
    letterSpacing: tracking,
    color: color(tone),
  };
}

function Bar({ tone, length }: { tone: ColorToken; length: number }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: "block",
        width: `${clamp(length, 48, 120)}px`,
        height: BAR,
        marginBottom: space(2),
        background: color(tone),
      }}
    />
  );
}

type InfoRow = { label: string; value: string };

type TechLabelProps = {
  color: ColorToken;
  // Warna batang; tanpa nilai sama dengan teks.
  bar?: ColorToken;
  // Panjang batang 48–120 px.
  barLength?: number;
  slot?: string;
} & (
  | { lines: string[]; rows?: never }
  // Baris info 3 kolom: judul label + isi, mis. TEMPAT / WAKTU / TIKET.
  | { rows: InfoRow[]; lines?: never }
);

// Brutalisme "LabelTeknis": batang tebal + 1–4 baris label kapital 24–28 px, atau baris info.
export function TechLabel({ color: tone, bar, barLength = 64, slot, ...content }: TechLabelProps) {
  const ink = bar ?? tone;
  const label = caps(tone, "0.08em");
  return (
    <div
      data-slot={slot}
      data-slot-type={slot ? "text" : undefined}
      style={
        content.rows
          ? {
              display: "grid",
              gridTemplateColumns: `repeat(${content.rows.length}, minmax(0, 1fr))`,
              columnGap: space(3),
            }
          : undefined
      }
    >
      {content.rows ? (
        content.rows.map((row, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: isi boleh kembar, urutan tetap
          <div key={`${index}-${row.label}`}>
            <Bar tone={ink} length={barLength} />
            <span style={{ ...label, display: "block" }}>{row.label}</span>
            <span
              style={{
                display: "block",
                fontFamily: fontFamily("body"),
                fontWeight: fontWeight("body", false),
                fontSize: fontSize(1),
                fontSynthesis: "none",
                lineHeight: 1.25,
                color: color(tone),
              }}
            >
              {row.value}
            </span>
          </div>
        ))
      ) : (
        <>
          <Bar tone={ink} length={barLength} />
          {content.lines.map((line, index) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: isi boleh kembar, urutan tetap
            <span key={`${index}-${line}`} style={{ ...label, display: "block" }}>
              {line}
            </span>
          ))}
        </>
      )}
    </div>
  );
}

const HUD_TRACKING = 0.1; // em, Cyberpunk +0,08–0,12

type HudLabelProps = {
  color: ColorToken;
  // Pita solid di belakang label; kontras teks terhadap pita wajib ≥ 4,5:1.
  band?: ColorToken;
  slot?: string;
} & ( // `[ LABEL ]` atau `LABEL //`.
  | { format?: "bracket" | "slash"; children: string }
  // Penghitung `02 / 06`.
  | { format: "count"; current: number; total: number }
);

const pad = (n: number) => String(n).padStart(2, "0");

// Cyberpunk "Label HUD": langkah 1, kapital, tracking +0,1 em, dengan format dekoratif.
export function HudLabel({ color: tone, band, slot, ...content }: HudLabelProps) {
  const mark = (text: string) => <span aria-hidden="true">{text}</span>;
  const body =
    content.format === "count" ? (
      `${pad(content.current)} / ${pad(content.total)}`
    ) : content.format === "slash" ? (
      <>
        {content.children}
        {mark(" //")}
      </>
    ) : (
      <>
        {mark("[ ")}
        {content.children}
        {mark(" ]")}
      </>
    );
  return (
    <span
      data-slot={slot}
      data-slot-type={slot ? "badge" : undefined}
      style={{
        ...caps(tone, `${HUD_TRACKING}em`),
        display: "block",
        width: "fit-content",
        lineHeight: 1,
        whiteSpace: "nowrap",
        // Tracking juga menambah jarak sesudah huruf terakhir; dikurangi agar pita seimbang.
        padding: band
          ? `${space(1)} calc(${space(2)} - ${HUD_TRACKING}em) ${space(1)} ${space(2)}`
          : undefined,
        borderRadius: band ? "var(--shape-radius)" : undefined,
        background: band ? color(band) : undefined,
      }}
    >
      {body}
    </span>
  );
}

type VerticalLabelProps = {
  color: ColorToken;
  size?: FontSizeStep;
  // Kapital dengan tracking lebar (label ≤ 4 kata); tanpa nilai teks body biasa.
  caps?: boolean;
  slot?: string;
  children: string;
};

// Minimalism "label vertikal" (juga Brutalisme tegak 90°, Cyberpunk): teks diputar 90°, dibaca
// dari bawah ke atas, untuk kolom paling tepi. Lebar kotaknya setinggi satu baris.
export function VerticalLabel({
  color: tone,
  size = 1,
  caps: upper = false,
  slot,
  children,
}: VerticalLabelProps) {
  return (
    <span
      data-slot={slot}
      data-slot-type={slot ? "text" : undefined}
      style={{
        display: "block",
        width: "fit-content",
        writingMode: "vertical-rl",
        transform: "rotate(180deg)",
        whiteSpace: "nowrap",
        fontFamily: fontFamily("body"),
        fontWeight: fontWeight("body", upper),
        fontSize: fontSize(size),
        fontSynthesis: "none",
        lineHeight: 1.2,
        textTransform: upper ? "uppercase" : undefined,
        letterSpacing: upper ? "0.1em" : undefined,
        color: color(tone),
      }}
    >
      {children}
    </span>
  );
}

type TickerProps = {
  // Kata nyata dari copy (nama brand, tema, tagar tanpa #), dipisah `//`.
  items: string[];
  color: ColorToken;
  background: ColorToken;
  // Berapa kali deret kata diulang di sepanjang pita.
  repeat?: number;
  slot?: string;
};

const TICKER_HEIGHT = 56; // pita 48–64 px

// Cyberpunk "Pita berulang": bidang pita boleh full-bleed (lebar kotak induk), kata utuh dibagi
// rata di dalam safe margin; slot hanya area kata itu. Kata yang tidak muat meluber, tidak
// dipotong, agar tertangkap QA.
export function Ticker({ items, color: tone, background, repeat = 1, slot }: TickerProps) {
  const words = Array.from({ length: Math.max(repeat, 1) }, () => items).flat();
  return (
    <div
      style={{
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        width: "100%",
        height: TICKER_HEIGHT,
        paddingInline: "var(--space-safe)",
        background: color(background),
      }}
    >
      <div
        data-slot={slot}
        data-slot-type={slot ? "text" : undefined}
        style={{
          ...caps(tone, "0.1em"),
          display: "flex",
          flex: "1 0 auto",
          justifyContent: "space-between",
          gap: space(3),
          lineHeight: 1,
          whiteSpace: "nowrap",
        }}
      >
        {words.map((word, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: kata berulang, urutan tetap
          <Fragment key={i}>
            {i > 0 && <span aria-hidden="true">{"//"}</span>}
            <span>{word}</span>
          </Fragment>
        ))}
      </div>
    </div>
  );
}

type TextBlockProps = {
  background: ColorToken;
  // Warna knock-out untuk pernyataan, label, dan batang.
  color: ColorToken;
  // Label pendek di atas pernyataan, didahului batang.
  label?: string;
  // Langkah skala pernyataan (Brutalisme: 4–5).
  size?: FontSizeStep;
  slot?: string;
  labelSlot?: string;
  children: string;
};

// Brutalisme "BlokTeks": blok persegi padat berisi batang label dan pernyataan knock-out kapital.
// Mengisi kotak induknya (sampai 6 kolom × 4 modul).
export function TextBlock({
  background,
  color: tone,
  label,
  size = 4,
  slot,
  labelSlot,
  children,
}: TextBlockProps) {
  return (
    <div
      style={{
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        gap: space(4),
        width: "100%",
        height: "100%",
        padding: space(5),
        borderRadius: "var(--shape-radius)",
        background: color(background),
      }}
    >
      {label ? (
        <div>
          <Bar tone={tone} length={64} />
          <span
            data-slot={labelSlot}
            data-slot-type={labelSlot ? "text" : undefined}
            style={{ ...caps(tone, "0.08em"), display: "block" }}
          >
            {label}
          </span>
        </div>
      ) : (
        <span />
      )}
      <p
        data-slot={slot}
        data-slot-type={slot ? "text" : undefined}
        style={{
          margin: 0,
          fontFamily: fontFamily("heading"),
          fontWeight: fontWeight("heading", true),
          fontSize: fontSize(size),
          fontSynthesis: "none",
          lineHeight: 1,
          letterSpacing: "-0.01em",
          textTransform: "uppercase",
          textWrap: "balance",
          color: color(tone),
        }}
      >
        {children}
      </p>
    </div>
  );
}

type MarkerProps = {
  // Warna penanda kotak/bulatan.
  mark: ColorToken;
  color: ColorToken;
  shape?: "square" | "circle";
  // Kapital dengan tracking +6% (label ≤ 3 kata).
  caps?: boolean;
  slot?: string;
  children: string;
};

const MARK = 28; // penanda 24–32 px

// Flat "penanda kotak": kotak atau bulatan solid di depan label pendek (Mitos, Fakta, nomor).
export function Marker({
  mark,
  color: tone,
  shape = "square",
  caps: upper = false,
  slot,
  children,
}: MarkerProps) {
  return (
    <span
      style={{
        display: "flex",
        width: "fit-content",
        alignItems: "center",
        gap: space(2),
      }}
    >
      <span
        aria-hidden="true"
        style={{
          flex: "none",
          width: MARK,
          height: MARK,
          // Radius brand, dibatasi agar kotak tetap terbaca sebagai kotak.
          borderRadius: shape === "circle" ? "50%" : "min(var(--shape-radius), 25%)",
          background: color(mark),
        }}
      />
      <span
        data-slot={slot}
        data-slot-type={slot ? "badge" : undefined}
        style={{
          fontFamily: fontFamily("body"),
          fontWeight: fontWeight("body", true),
          fontSize: fontSize(1),
          fontSynthesis: "none",
          lineHeight: 1.2,
          whiteSpace: "nowrap",
          textTransform: upper ? "uppercase" : undefined,
          letterSpacing: upper ? "0.06em" : undefined,
          color: color(tone),
        }}
      >
        {children}
      </span>
    </span>
  );
}
