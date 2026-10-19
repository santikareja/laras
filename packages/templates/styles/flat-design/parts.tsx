import type { SubjectInfo } from "@laras/shared";
import type { ComponentProps, CSSProperties, ReactNode } from "react";
import { Blob, Icon, type IconName } from "../../primitives/index.ts";
import {
  type ColorToken,
  color,
  type FontSizeStep,
  fontFamily,
  fontSize,
  fontWeight,
  space,
} from "../../primitives/vars.ts";
import { CANVAS } from "../../src/geometry.ts";

// Perangkat khas Flat Design untuk arketipe T-134 (PANDUAN bagian 7 dan 9): panggung bentuk di
// belakang subjek (cakram, cincin, lensa, biji, blob), garis swirl tebal, riak tone-on-tone,
// tag gantung miring, dan baris vonis mitos/fakta. Semua koordinat dalam px kanvas 1080 × 1350;
// warna hanya dari token. Bentuk tanpa teks bertanda `data-qa-element`.

type Point = { x: number; y: number };

// --- Penempatan subjek --------------------------------------------------------------------

// Gambar cut-out berasio 4:5 (tinggi = 1,25 × lebar), digambar `contain` di kotak 4:5.
const ASPECT = 1.25;
const CUT = 0.97;

export type SubjectFrame = { left: number; top: number; width: number; focus: Point };

type SubjectTarget = {
  // Letak wajah atau pusat produk (titik fokus) yang dituju.
  focus: Point;
  // Letak dasar subjek (kaki, tepi potongan) yang dituju; subjek terpotong selalu bleed.
  bottom: number;
  // Lebar kotak alpha maksimal (px), agar subjek lebar tidak mendesak kolom teks.
  maxWidth: number;
  // Tepi kotak alpha tidak melewati batas ini (subjek terpotong di samping boleh bleed).
  minLeft: number;
  maxRight: number;
};

// Skala dan letak subjek dari kotak alpha dan titik fokusnya (analisis cut-out pipeline): wajah
// jatuh di titik sepertiga, dasar subjek di dasar yang dituju. Tanpa analisis: kotak cadangan.
export function placeSubject(
  subject: SubjectInfo | undefined,
  target: SubjectTarget,
  // Tanpa analisis cut-out: kotak selebar `width` berpusat di fokus, berdiri di dasar target.
  fallback: { width: number },
): SubjectFrame {
  if (!subject) {
    const { width } = fallback;
    const left = target.focus.x - width / 2;
    const top = target.bottom - width * ASPECT;
    return { left, top, width, focus: { x: target.focus.x, y: top + width * ASPECT * 0.3 } };
  }
  const { box, focus } = subject;
  const span = (box.bottom - focus.y) * ASPECT;
  const alpha = Math.max(box.right - box.left, 0.1);
  const natural = (target.bottom - target.focus.y) / Math.max(span, 0.2);
  const width = Math.min(natural, target.maxWidth / alpha);
  // Subjek terpotong menempel ke dasar (bleed), begitu juga subjek yang dibatasi lebarnya (tetap
  // berpijak); selain itu wajah dijaga di titik sepertiga.
  const top =
    box.bottom >= CUT || width < natural
      ? target.bottom - box.bottom * ASPECT * width
      : target.focus.y - focus.y * ASPECT * width;
  let left = target.focus.x - focus.x * width;
  const right = left + box.right * width;
  if (right > target.maxRight) left -= right - target.maxRight;
  if (left + box.left * width < target.minLeft) left = target.minLeft - box.left * width;
  return {
    left,
    top,
    width,
    focus: { x: left + focus.x * width, y: top + focus.y * ASPECT * width },
  };
}

export const subjectStyle = (frame: SubjectFrame): CSSProperties => ({
  position: "absolute",
  left: `${round(frame.left)}px`,
  top: `${round(frame.top)}px`,
  width: `${round(frame.width)}px`,
  height: `${round(frame.width * ASPECT)}px`,
});

const round = (value: number) => Math.round(value * 10) / 10;

// --- Panggung bentuk ----------------------------------------------------------------------

export type StageKind = "blob" | "cakram" | "cincin" | "lensa" | "biji";

type StageProps = {
  kind: StageKind;
  center: Point;
  // Diameter (px): 540–810 menurut panduan (50–75% lebar kanvas).
  size: number;
  fill: ColorToken;
  // Warna lekuk biji (biasanya warna bidang latar).
  line: ColorToken;
  // Lensa: gagang ke kiri bawah (subjek di kiri) atau kanan bawah.
  flip?: boolean;
};

const STAGE_NAME: Record<StageKind, string> = {
  blob: "blob",
  cakram: "cakram",
  cincin: "cincin",
  lensa: "lensa",
  biji: "biji",
};

// Bentuk besar di belakang subjek yang membawa metafora (PANDUAN 9 pola 1): cakram (matahari,
// koin, piring), cincin (sorotan, target), lensa (kaca pembesar: periksa, kenali), biji (biji
// kopi, kakao, benih), atau blob. Kepala subjek keluar dari tepi atasnya (interlock).
export function Stage({ kind, center, size, fill, line, flip = false }: StageProps) {
  const half = size / 2;
  const box: CSSProperties = {
    position: "absolute",
    left: `${round(center.x - half)}px`,
    top: `${round(center.y - half)}px`,
    width: `${size}px`,
    height: `${size}px`,
  };
  const ring = Math.round(size * 0.11);
  return (
    <div data-qa-element="shape" data-qa-name={STAGE_NAME[kind]} aria-hidden="true" style={box}>
      {kind === "blob" && <InnerBlob color={fill} points={6} seed={2} variation={0.13} />}
      {kind === "cakram" && (
        <div
          style={{ width: "100%", height: "100%", borderRadius: "50%", background: color(fill) }}
        />
      )}
      {(kind === "cincin" || kind === "lensa") && (
        // SVG agar QA kontras mengukur piksel cincin bila teks melintasinya (border tidak terbaca).
        <svg
          aria-hidden="true"
          viewBox={`0 0 ${size} ${size}`}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            overflow: "visible",
          }}
        >
          <circle
            cx={half}
            cy={half}
            r={half - ring / 2}
            fill="none"
            strokeWidth={ring}
            style={{ stroke: color(fill) }}
          />
        </svg>
      )}
      {kind === "lensa" && <LensHandle size={size} ring={ring} fill={fill} flip={flip} />}
      {kind === "biji" && <Bean fill={fill} line={line} flip={flip} />}
    </div>
  );
}

// Blob primitive membawa penanda bentuknya sendiri; di dalam bentuk bernama ia dibungkus decor
// agar QA menghitung satu bentuk, bukan dua.
export function InnerBlob(props: ComponentProps<typeof Blob>) {
  return (
    <div data-qa-element="decor" style={{ width: "100%", height: "100%" }}>
      <Blob {...props} />
    </div>
  );
}

// Gagang kaca pembesar: leher pendek yang lebih tebal lalu batang, miring 45° keluar kanvas.
function LensHandle({
  size,
  ring,
  fill,
  flip,
}: {
  size: number;
  ring: number;
  fill: ColorToken;
  flip: boolean;
}) {
  const half = size / 2;
  // Batang berporos di pusat lensa, digeser keluar sepanjang sudut 45°.
  const bar = (length: number, thickness: number, offset: number): CSSProperties => ({
    position: "absolute",
    left: `${half}px`,
    top: `${round(half - thickness / 2)}px`,
    width: `${Math.round(length)}px`,
    height: `${Math.round(thickness)}px`,
    borderRadius: "var(--shape-radius)",
    background: color(fill),
    transformOrigin: "0 50%",
    transform: `rotate(${flip ? 135 : 45}deg) translateX(${round(offset)}px)`,
  });
  return (
    <>
      <div style={bar(size * 0.14, ring * 1.6, half - ring * 0.4)} />
      <div style={bar(size * 0.7, ring * 1.1, half + size * 0.08)} />
    </>
  );
}

// Biji: elips miring dengan lekuk S di sumbu panjangnya (ikon biji kopi datar).
function Bean({ fill, line, flip }: { fill: ColorToken; line: ColorToken; flip: boolean }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: "0 13%",
        transform: `rotate(${flip ? 24 : -24}deg)`,
      }}
    >
      <div
        style={{ width: "100%", height: "100%", borderRadius: "50%", background: color(fill) }}
      />
      <svg
        aria-hidden="true"
        viewBox="0 0 74 100"
        preserveAspectRatio="none"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          color: color(line),
        }}
      >
        <path
          d="M 37 4 C 21 30, 54 66, 37 96"
          fill="none"
          stroke="currentColor"
          strokeWidth={6}
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

// --- Garis swirl --------------------------------------------------------------------------

type SwirlProps = {
  // Pusat lengkung (biasanya pusat panggung bentuk) dan jari-jari awal.
  center: Point;
  radius: number;
  // Sudut awal dan akhir (derajat, 0 = arah sisi jauh, positif searah jarum jam) untuk subjek di
  // kanan; `flip` mencerminkan sudut untuk subjek di kiri.
  from: number;
  to: number;
  // Pertambahan jari-jari per putaran penuh (px): spiral tenang, bukan lingkaran kaku.
  growth?: number;
  color: ColorToken;
  // Tebal garis 32–54 px (3–5% lebar kanvas).
  thickness?: number;
  flip?: boolean;
};

// Garis swirl tebal (Swoosh garis, referensi Opay): spiral lebar yang mengorbit panggung bentuk
// di sisi jauh, lewat di belakang subjek dan menjauhi kolom teks. Ujungnya keluar kanvas atau
// membulat.
export function Swirl({
  center,
  radius,
  from,
  to,
  growth = 200,
  color: tone,
  thickness = 44,
  flip = false,
}: SwirlProps) {
  const steps = Math.max(2, Math.ceil(Math.abs(to - from) / 3));
  const points = Array.from({ length: steps + 1 }, (_, i) => {
    const angle = from + ((to - from) * i) / steps;
    const r = radius + (growth * (angle - from)) / 360;
    const rad = ((flip ? 180 - angle : angle) * Math.PI) / 180;
    return `${round(center.x + r * Math.cos(rad))} ${round(center.y + r * Math.sin(rad))}`;
  });
  return (
    <svg
      data-qa-element="shape"
      data-qa-name="swirl"
      aria-hidden="true"
      viewBox={`0 0 ${CANVAS.width} ${CANVAS.height}`}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        color: color(tone),
        overflow: "hidden",
      }}
    >
      <path
        d={`M ${points.join(" L ")}`}
        fill="none"
        stroke="currentColor"
        strokeWidth={Math.min(Math.max(thickness, 32), 54)}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// --- Riak tone-on-tone --------------------------------------------------------------------

type RippleProps = {
  center: Point;
  // Bidang di bawah riak dan warna campurannya; kontras ≤ 1,3:1 (PolaTone, PANDUAN 7).
  field: ColorToken;
  ink: ColorToken;
  // Jari-jari lingkaran pertama dan jumlah lingkaran.
  from: number;
  count?: number;
};

// Pola kontur datar: lingkaran konsentris tipis di sekitar panggung, seperti riak atau sidik
// jari pada referensi. Tint dari dua token (color-mix), tanpa hit-testing agar QA kontras teks
// membaca bidang latarnya.
export function Ripple({ center, field, ink, from, count = 7 }: RippleProps) {
  const stroke = `color-mix(in srgb, ${color(field)} 91%, ${color(ink)})`;
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
        pointerEvents: "none",
      }}
    >
      {Array.from({ length: count }, (_, i) => (
        <circle
          // biome-ignore lint/suspicious/noArrayIndexKey: lingkaran berurutan dan tetap
          key={i}
          cx={round(center.x)}
          cy={round(center.y)}
          r={from + i * 46}
          fill="none"
          strokeWidth={12}
          style={{ stroke }}
        />
      ))}
    </svg>
  );
}

// --- Tag gantung --------------------------------------------------------------------------

type HangTagProps = {
  slot: string;
  children: string;
  background: ColorToken;
  color: ColorToken;
  // Tali dari tepi atas kanvas sampai lubang tag (px).
  drop: number;
  // Kemiringan tag (−6 sampai −10°); satu-satunya sudut di postingan (P11).
  rotate?: number;
  string: ColorToken;
};

// Tag gantung miring "Mitos vs Fakta" (referensi thryv): kartu font heading digantung tali
// tipis dari tepi atas, diputar dari lubangnya sehingga tali tetap tegak.
export function HangTag({
  slot,
  children,
  background,
  color: tone,
  drop,
  rotate = -8,
  string,
}: HangTagProps) {
  return (
    <div style={{ position: "relative", display: "grid", justifyItems: "center" }}>
      <span
        data-qa-element="decor"
        aria-hidden="true"
        style={{
          position: "absolute",
          bottom: "100%",
          left: "50%",
          width: "4px",
          height: `${drop}px`,
          marginLeft: "-2px",
          background: color(string),
        }}
      />
      <div
        style={{
          display: "grid",
          justifyItems: "center",
          gap: space(1),
          padding: `${space(2)} ${space(4)} ${space(3)}`,
          borderRadius: "var(--shape-radius)",
          background: color(background),
          transformOrigin: "50% 16px",
          transform: `rotate(${rotate}deg)`,
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: "16px",
            height: "16px",
            borderRadius: "50%",
            border: `4px solid ${color(string)}`,
            boxSizing: "border-box",
          }}
        />
        <span
          data-slot={slot}
          data-slot-type="text"
          style={{
            fontFamily: fontFamily("heading"),
            fontWeight: fontWeight("heading", true),
            fontSize: fontSize(2),
            fontSynthesis: "none",
            lineHeight: 1,
            textAlign: "center",
            textWrap: "balance",
            maxWidth: "9em",
            color: color(tone),
          }}
        >
          {children}
        </span>
      </div>
    </div>
  );
}

// --- Vonis mitos/fakta --------------------------------------------------------------------

type VerdictProps = {
  icon: Extract<IconName, "x" | "check">;
  // Label kapital pendek dari copy ("Mitos", "Fakta").
  label: { slot: string; text: string };
  statement: { slot: string; text: string };
  mark: ColorToken;
  markInk: ColorToken;
  ink: ColorToken;
  // Mitos dicoret garis aksen (dibantah); fakta ditulis lebih tebal.
  struck?: ColorToken | undefined;
  size?: FontSizeStep;
  strong?: boolean;
  children?: ReactNode;
};

// Baris vonis: ikon datar dalam lingkaran (× untuk mitos, ✓ untuk fakta), label kapital, lalu
// pernyataan. Coretan memakai text-decoration agar tidak menambah elemen dan tetap terbaca.
export function Verdict({
  icon,
  label,
  statement,
  mark,
  markInk,
  ink,
  struck,
  size = 2,
  strong = false,
  children,
}: VerdictProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "auto minmax(0, 1fr)",
        columnGap: space(3),
        rowGap: space(1),
        alignItems: "center",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: color(mark),
          color: color(markInk),
        }}
      >
        <Icon name={icon} size={32} stroke={4} />
      </span>
      <span
        data-slot={label.slot}
        data-slot-type="text"
        style={{
          fontFamily: fontFamily("body"),
          fontWeight: fontWeight("body", true),
          fontSize: fontSize(1),
          fontSynthesis: "none",
          lineHeight: 1.2,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: color(ink),
        }}
      >
        {label.text}
      </span>
      {children}
      <p
        data-slot={statement.slot}
        data-slot-type="text"
        style={{
          gridColumn: "1 / -1",
          margin: 0,
          fontFamily: fontFamily("body"),
          fontWeight: fontWeight("body", strong),
          fontSize: fontSize(size),
          fontSynthesis: "none",
          lineHeight: 1.3,
          textWrap: "pretty",
          color: color(ink),
          textDecorationLine: struck ? "line-through" : undefined,
          textDecorationColor: struck ? color(struck) : undefined,
          textDecorationThickness: struck ? "0.12em" : undefined,
        }}
      >
        {statement.text}
      </p>
    </div>
  );
}

// --- Baris pas-lebar ----------------------------------------------------------------------

type FitLineProps = {
  slot: string;
  children: string;
  color: ColorToken;
  // Ukuran maksimal (langkah skala brand); teks yang lebih panjang dikecilkan renderer agar
  // tetap satu baris selebar kotaknya (fit-to-width, T-123).
  step: FontSizeStep;
  font?: "heading" | "body";
  // Blok sorot aksen bersudut brand di balik teks (kata dalam pill, PANDUAN 5).
  block?: ColorToken | undefined;
  align?: "left" | "right";
};

// Satu baris headline yang tidak pernah terlipat: ukuran langkah skala bila muat, lebih kecil
// bila copy panjang. Dipakai di kolom sempit (tiket) agar tinggi blok judul tetap.
export function FitLine({
  slot,
  children,
  color: tone,
  step,
  font = "heading",
  block,
  align = "left",
}: FitLineProps) {
  return (
    <p
      data-slot={slot}
      data-slot-type="text"
      data-fit="width"
      data-fit-max={fontSize(step)}
      style={{
        // Selebar kolom: tanpa ini lebar baris nowrap = lebar teks dan fit tidak mengecilkannya.
        boxSizing: "border-box",
        width: "100%",
        margin: 0,
        whiteSpace: "nowrap",
        textAlign: align,
        fontFamily: fontFamily(font),
        fontWeight: fontWeight(font, true),
        fontSize: fontSize(step),
        fontSynthesis: "none",
        lineHeight: 1.08,
        textTransform: font === "heading" ? "var(--style-heading-transform, none)" : undefined,
        letterSpacing: font === "heading" ? "var(--style-heading-tracking, normal)" : undefined,
        color: color(tone),
      }}
    >
      {block ? (
        <span
          style={{
            padding: "0 0.18em 0.04em",
            borderRadius: "var(--shape-radius)",
            background: color(block),
          }}
        >
          {children}
        </span>
      ) : (
        children
      )}
    </p>
  );
}
