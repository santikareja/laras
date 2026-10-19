import type { SubjectInfo } from "@laras/shared";
import type { CSSProperties, ReactNode } from "react";
import { PILL_RADIUS } from "../../primitives/Glass.tsx";
import { Icon, IconDisc, type IconName } from "../../primitives/Icons.tsx";
import {
  type ColorToken,
  color,
  type FontSizeStep,
  fontSize,
  space,
} from "../../primitives/vars.ts";
import { CANVAS } from "../../src/geometry.ts";

// Perangkat arketipe khas Corporate Clean (T-134, PANDUAN bagian 7 dan 9): label font aksen,
// pil yang menempel pada subjek, baris jaminan, bar kaki, lintasan berlabel, dan penempatan
// subjek dari kotak alpha-nya. Semua warna dari token; teks dari slot.

// --- Font aksen ------------------------------------------------------------------------------

type AccentTextProps = {
  color: ColorToken;
  size?: FontSizeStep;
  // Kapital dengan tracking lebar (label ≤ 4 kata).
  caps?: boolean;
  // Dibaca dari bawah ke atas (label vertikal tipis di tepi).
  vertical?: boolean;
  slot?: string;
  slotType?: "text" | "badge";
  children: string;
};

// Label, data, dan anotasi memakai font aksen brand (--font-accent, T-134; jatuh ke font body
// bila brand tidak punya). Satu baris, tidak pernah dipotong agar overflow tertangkap QA.
export function AccentText({
  color: tone,
  size = 1,
  caps = true,
  vertical = false,
  slot,
  slotType = "text",
  children,
}: AccentTextProps) {
  return (
    <span
      data-slot={slot}
      data-slot-type={slot ? slotType : undefined}
      style={{
        display: "block",
        width: "fit-content",
        fontFamily: "var(--font-accent)",
        fontWeight: "var(--font-accent-weight-strong)",
        fontSize: fontSize(size),
        fontSynthesis: "none",
        // Teks vertikal: kotak baris selebar area konten font (Space Mono, IBM Plex Mono tinggi)
        // agar tidak terbaca luber oleh QA.
        lineHeight: vertical ? 1.6 : 1.2,
        whiteSpace: "nowrap",
        textTransform: caps ? "uppercase" : undefined,
        letterSpacing: caps ? "0.12em" : undefined,
        color: color(tone),
        ...(vertical ? { writingMode: "vertical-rl", transform: "rotate(180deg)" } : {}),
      }}
    >
      {children}
    </span>
  );
}

// --- Tipografi headline ---------------------------------------------------------------------

const NBSP = "\u00a0";

// Angka tidak dipisah dari satuannya ("5:45 AM", "200 g", "3 km"), dan dua kata terakhir yang
// pendek disatukan agar baris akhir tidak berisi satu kata (P4). Batas 10 karakter menjaga
// gabungan tetap muat di kolom teks tersempit arketipe ini.
export function tidy(text: string): string {
  const units = text.replace(/(\d)\s+(?=[\p{L}%]{1,3}\b)/gu, `$1${NBSP}`);
  const at = units.lastIndexOf(" ");
  if (at < 0) return units;
  const tail = units.slice(units.lastIndexOf(" ", at - 1) + 1);
  return tail.length <= 10 ? `${units.slice(0, at)}${NBSP}${units.slice(at + 1)}` : units;
}

// Klausa terakhir headline (sesudah koma, titik, titik dua, atau tanda tanya terakhir) untuk warna
// sorot; tanpa pemisah, kata terakhir. Spasi tak terpisah dari tidy() ikut menjadi batas kata.
export function lastClause(text: string): string {
  const body = text.replace(/[.,;:!?]+$/, "");
  const cut = Math.max(
    ...[...body.matchAll(/[.,;:!?][\s\u00a0]+/g)].map((m) => m.index + m[0].length),
    -1,
  );
  if (cut > 0) return text.slice(cut);
  const space = Math.max(text.lastIndexOf(" "), text.lastIndexOf(NBSP));
  return space > 0 ? text.slice(space + 1) : text;
}

// --- Penempatan subjek -----------------------------------------------------------------------

// Kotak alpha bawaan bila aset tidak dianalisis (foto biasa): subjek mengisi tengah gambar.
const DEFAULT_BOX = { left: 0.15, top: 0.04, right: 0.85, bottom: 0.98 };
// Rasio slot gambar 4:5 (lebar/tinggi).
const ASPECT = 4 / 5;

export type SubjectFrame = {
  // Kotak gambar 4:5 di kanvas (px).
  left: number;
  top: number;
  width: number;
  height: number;
  // Kotak alpha subjek di kanvas (px).
  subject: { left: number; top: number; right: number; bottom: number };
  focus: { x: number; y: number };
};

type FrameRequest = {
  subject: SubjectInfo | undefined;
  // Batas atas kepala dan lantai (tepi bawah subjek), px dari atas kanvas.
  top: number;
  floor: number;
  // Sisi kanvas tempat subjek berada; `edge` = tepi dalam subjek (ke arah teks) dan `limit` = tepi
  // luar terjauh yang boleh dicapai, keduanya px dari kiri kanvas.
  side: "left" | "right" | "center";
  edge: number;
  limit: number;
};

// Subjek dipaskan lewat kotak alpha-nya, bukan kotak gambar: tinggi mengisi kepala sampai lantai,
// tepi dalam menempel `edge` (menembus panel), dan dikecilkan bila lebarnya melewati `limit`.
// Untuk `center`, `edge` adalah sumbu tengah dan `limit` setengah lebar maksimal.
export function frameSubject({
  subject,
  top,
  floor,
  side,
  edge,
  limit,
}: FrameRequest): SubjectFrame {
  const box = subject?.box ?? DEFAULT_BOX;
  const focus = subject?.focus ?? { x: 0.5, y: 0.2 };
  const boxWidth = (box.right - box.left) * ASPECT;
  const room = side === "center" ? limit * 2 : Math.abs(edge - limit);
  const height = Math.min((floor - top) / (box.bottom - box.top), room / boxWidth);
  const width = height * ASPECT;
  const imageTop = floor - box.bottom * height;
  const imageLeft =
    side === "left"
      ? edge - box.right * width
      : side === "right"
        ? edge - box.left * width
        : edge - ((box.left + box.right) / 2) * width;
  return {
    left: imageLeft,
    top: imageTop,
    width,
    height,
    subject: {
      left: imageLeft + box.left * width,
      top: imageTop + box.top * height,
      right: imageLeft + box.right * width,
      bottom: floor,
    },
    focus: { x: imageLeft + focus.x * width, y: imageTop + focus.y * height },
  };
}

export const px = (value: number) => `${Math.round(value * 10) / 10}px`;
// Posisi x dicerminkan untuk tata letak terbalik (subjek di kanan).
export const mirror = (x: number, flip: boolean) => (flip ? CANVAS.width - x : x);

// --- Pil pada subjek -------------------------------------------------------------------------

type ChipProps = {
  background: ColorToken;
  color: ColorToken;
  // Batang pendek di ujung pil (penanda kursor seperti chip antarmuka).
  mark: ColorToken;
  slot?: string;
  style?: CSSProperties;
  children: string;
};

// Pil kecil yang menempel di atas subjek (kategori, harga, peran). Boleh dua baris bila panjang.
export function Chip({ background, color: tone, mark, slot, style, children }: ChipProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: space(3),
        boxSizing: "border-box",
        width: "fit-content",
        maxWidth: "100%",
        padding: `${space(2)} ${space(4)}`,
        borderRadius: PILL_RADIUS,
        background: color(background),
        boxShadow: "var(--shape-shadow)",
        ...style,
      }}
    >
      <span
        data-slot={slot}
        data-slot-type={slot ? "text" : undefined}
        style={{
          fontFamily: "var(--font-body)",
          fontWeight: "var(--font-body-weight-strong)",
          fontSize: fontSize(1),
          fontSynthesis: "none",
          lineHeight: 1.25,
          textWrap: "balance",
          color: color(tone),
        }}
      >
        {children}
      </span>
      <span
        aria-hidden="true"
        style={{
          flex: "none",
          alignSelf: "stretch",
          width: 6,
          minHeight: 32,
          borderRadius: 3,
          background: color(mark),
        }}
      />
    </div>
  );
}

// --- Baris jaminan ---------------------------------------------------------------------------

type AssuranceProps = {
  icon?: IconName;
  // Cincin ikon dan warna ikon.
  ring: ColorToken;
  color: ColorToken;
  slot?: string;
  children: string;
};

// Satu baris jaminan: ikon centang dalam cincin tipis + kalimat pendek (referensi 528a).
export function Assurance({ icon = "check", ring, color: tone, slot, children }: AssuranceProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: space(3) }}>
      <span
        style={{
          boxSizing: "border-box",
          display: "flex",
          flex: "none",
          alignItems: "center",
          justifyContent: "center",
          width: 56,
          height: 56,
          borderRadius: "50%",
          border: `2px solid ${color(ring)}`,
          color: color(ring),
        }}
      >
        <Icon name={icon} size={28} stroke={3} />
      </span>
      <span
        data-slot={slot}
        data-slot-type={slot ? "text" : undefined}
        style={{
          fontFamily: "var(--font-body)",
          fontWeight: "var(--font-body-weight-strong)",
          fontSize: fontSize(1),
          fontSynthesis: "none",
          lineHeight: 1.3,
          textWrap: "balance",
          color: color(tone),
        }}
      >
        {children}
      </span>
    </div>
  );
}

// --- Baris kontak ringkas --------------------------------------------------------------------

export type ContactItem = { icon: IconName; text: string; slot: string };

type ContactLineProps = {
  items: ContactItem[];
  color: ColorToken;
  iconBackground: ColorToken;
  iconColor: ColorToken;
  // Garis pemisah antar item.
  divider: ColorToken;
  // columns = kolom sama lebar, item di tengah kolom (bar kaki); inline = item berderet di tengah.
  layout?: "columns" | "inline";
  // Logo di ujung baris bila aturan brand meminta logo di bawah.
  children?: ReactNode;
};

// Item kontak berikon dalam lingkaran dengan pemisah garis tipis (bar kaki, atau baris di bawah
// tombol). Teks boleh dua baris bila kolomnya sempit.
export function ContactLine({
  items,
  color: tone,
  iconBackground,
  iconColor,
  divider,
  layout = "columns",
  children,
}: ContactLineProps) {
  const rule = `2px solid color-mix(in srgb, ${color(divider)} 40%, transparent)`;
  const columns = layout === "columns";
  const cells = [
    ...items.map((item) => (
      <div
        key={item.slot}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: space(2),
          minWidth: 0,
        }}
      >
        <IconDisc
          name={item.icon}
          size={28}
          ratio={52 / 28}
          stroke={3}
          background={iconBackground}
          color={iconColor}
        />
        <span
          data-slot={item.slot}
          data-slot-type="text"
          style={{
            minWidth: 0,
            fontFamily: "var(--font-body)",
            fontWeight: "var(--font-body-weight-strong)",
            fontSize: fontSize(1),
            fontSynthesis: "none",
            lineHeight: 1.25,
            textWrap: "balance",
            color: color(tone),
          }}
        >
          {item.text}
        </span>
      </div>
    )),
    ...(children ? [<div key="logo">{children}</div>] : []),
  ];
  return (
    <div
      style={{
        display: columns ? "grid" : "flex",
        gridTemplateColumns: columns
          ? `repeat(${items.length}, minmax(0, 1fr))${children ? " auto" : ""}`
          : undefined,
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
      }}
    >
      {cells.map((cell, i) => (
        <div
          key={cell.key}
          style={{
            display: "flex",
            justifyContent: "center",
            minWidth: 0,
            padding: `0 ${space(3)}`,
            borderLeft: i > 0 ? rule : undefined,
          }}
        >
          {cell}
        </div>
      ))}
    </div>
  );
}

// --- Bar kaki ---------------------------------------------------------------------------------

// Tinggi bagian bar yang terlihat di atas tepi bawah kanvas; isinya berakhir tepat di safe margin.
export const FOOTER_HEIGHT = 128;

// Bar kaki terisi yang menempel ke tepi bawah kanvas (bleed), sudut atas mengikuti radius brand.
// Isinya diletakkan di atas safe margin bawah.
export function FooterBar({
  background,
  children,
}: {
  background: ColorToken;
  children: ReactNode;
}) {
  return (
    <div
      data-qa-element="group"
      data-qa-name="bar kontak"
      style={{
        position: "absolute",
        left: "var(--space-safe)",
        right: "var(--space-safe)",
        bottom: 0,
        height: FOOTER_HEIGHT,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        // Isi (setinggi ±52 px) berpusat di atas padding bawah ini: teks berakhir ≥ safe margin.
        padding: `0 ${space(3)} calc(var(--space-safe) - 16px)`,
        borderRadius: "var(--shape-radius) var(--shape-radius) 0 0",
        background: color(background),
      }}
    >
      {children}
    </div>
  );
}

// --- Lintasan ---------------------------------------------------------------------------------

type Point = [number, number];

type PathLineProps = {
  // Titik lintasan di kanvas (px); garis melewati titik berurutan.
  points: Point[];
  color: ColorToken;
  // Garis padat atau putus-putus (rute).
  dashed?: boolean;
  width?: number;
  // Ujung akhir: panah, titik, atau tanpa penanda.
  end?: "arrow" | "dot" | "none";
  // Penanda bulat di titik antara (kunjungan, pos).
  stops?: boolean;
  // Warna isi penanda (lubang di tengah titik).
  hole?: ColorToken;
};

const SAMPLES = 10;

// Kurva halus (Catmull-Rom) lewat titik kendali, disampel menjadi polyline.
function smooth(points: Point[]): Point[] {
  const at = (i: number): Point => points[Math.min(Math.max(i, 0), points.length - 1)] ?? [0, 0];
  const out: Point[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    for (let s = 0; s < SAMPLES; s++) {
      const t = s / SAMPLES;
      const axis = (k: 0 | 1) =>
        0.5 *
        (2 * p1[k] +
          (p2[k] - p0[k]) * t +
          (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t * t +
          (3 * p1[k] - p0[k] - 3 * p2[k] + p3[k]) * t * t * t);
      out.push([axis(0), axis(1)]);
    }
  }
  out.push(at(points.length - 1));
  return out;
}

const r1 = (value: number) => Math.round(value * 10) / 10;

// Lintasan berlabel (metafora "dari A ke B": rute asal, langkah kunjungan, jalan ke lari). Lapisan
// seukuran kanvas, dekoratif; label titiknya slot terpisah milik arketipe.
export function PathLine({
  points,
  color: tone,
  dashed = false,
  width = 14,
  end = "arrow",
  stops = false,
  hole = "neutral-light",
}: PathLineProps) {
  const curve = smooth(points);
  const d = curve.map(([x, y], i) => `${i === 0 ? "M" : "L"}${r1(x)} ${r1(y)}`).join(" ");
  const last = curve[curve.length - 1] ?? [0, 0];
  const before = curve[curve.length - 3] ?? [0, 0];
  const angle = (Math.atan2(last[1] - before[1], last[0] - before[0]) * 180) / Math.PI;
  const head = width * 3.2;
  const first = points[0] ?? [0, 0];
  const dot = (key: string, [x, y]: Point, r: number) => (
    <g key={key}>
      <circle cx={r1(x)} cy={r1(y)} r={r} fill="currentColor" />
      <circle cx={r1(x)} cy={r1(y)} r={r * 0.42} fill={color(hole)} />
    </g>
  );
  return (
    <svg
      data-qa-element="decor"
      aria-hidden="true"
      viewBox={`0 0 ${CANVAS.width} ${CANVAS.height}`}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        overflow: "visible",
        pointerEvents: "none",
        color: color(tone),
      }}
    >
      <path
        d={d}
        fill="none"
        stroke="currentColor"
        strokeWidth={width}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeDasharray={dashed ? `${width * 0.1} ${width * 2.2}` : undefined}
      />
      {dot("awal", first, width * 1.5)}
      {stops && points.slice(1, -1).map((p, i) => dot(`titik-${i}`, p, width * 1.25))}
      {end === "dot" && dot("akhir", last, width * 1.5)}
      {end === "arrow" && (
        <path
          d={`M0 ${-head / 2} L${head * 0.95} 0 L0 ${head / 2} Z`}
          fill="currentColor"
          strokeLinejoin="round"
          stroke="currentColor"
          strokeWidth={width * 0.4}
          transform={`translate(${r1(last[0])} ${r1(last[1])}) rotate(${r1(angle)})`}
        />
      )}
    </svg>
  );
}

// --- Deret fitur ------------------------------------------------------------------------------

export type FeatureItem = { icon: IconName; label: string; slot: string };

type FeatureRowProps = {
  items: FeatureItem[];
  color: ColorToken;
  iconBackground: ColorToken;
  iconColor: ColorToken;
  divider: ColorToken;
};

// Deret 3 manfaat (referensi 7626): ikon dalam wadah + label tebal di sampingnya, kolom sama lebar
// dengan garis pemisah. Label boleh dua baris.
export function FeatureRow({
  items,
  color: tone,
  iconBackground,
  iconColor,
  divider,
}: FeatureRowProps) {
  const rule = `2px solid color-mix(in srgb, ${color(divider)} 24%, transparent)`;
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
        alignItems: "center",
        width: "100%",
      }}
    >
      {items.map((item, i) => (
        <div
          key={item.slot}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: space(2),
            minWidth: 0,
            padding: `0 ${space(2)}`,
            borderLeft: i > 0 ? rule : undefined,
          }}
        >
          <IconDisc
            name={item.icon}
            size={32}
            ratio={2}
            stroke={3}
            background={iconBackground}
            color={iconColor}
          />
          <span
            data-slot={item.slot}
            data-slot-type="text"
            style={{
              minWidth: 0,
              fontFamily: "var(--font-body)",
              fontWeight: "var(--font-body-weight-strong)",
              fontSize: fontSize(1),
              fontSynthesis: "none",
              lineHeight: 1.2,
              textWrap: "balance",
              color: color(tone),
            }}
          >
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
