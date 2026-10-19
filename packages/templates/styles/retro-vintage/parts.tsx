import type { CSSProperties } from "react";
import { type ColorToken, color, type FontSizeStep, fontSize } from "../../primitives/vars.ts";

// Perangkat arketipe khas Vintage/Retro (T-134): kata raksasa bertumpuk yang bisa berselang
// depan-belakang subjek, teks font aksen (label, data, kredit cetak), dan bayangan keras subjek
// di dinding warna. Dipakai arketipe feed-kata-dilompati, feed-poster-huruf, dan
// feed-sampul-editorial; tanpa gaya pun tetap layak (katalog Claude).

// Tumpukan z antara kata dan subjek: baris kata di belakang subjek, subjek, baris di depannya.
export const LAYER = { behind: 1, subject: 2, front: 3, text: 4 } as const;

// Baris kata raksasa dari isi slot: setiap kata satu baris (maks `max`); kata tunggal ≥ 4 huruf
// boleh dipecah dua di tengah (HORE → HO / RE) agar hurufnya cukup besar untuk dilompati.
export function wordRows(text: string, max: number, split: boolean): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1 && split) {
    const [word = ""] = words;
    if (word.length >= 4) {
      const cut = Math.ceil(word.length / 2);
      return [word.slice(0, cut), word.slice(cut)];
    }
  }
  if (words.length <= max) return words;
  return [...words.slice(0, max - 1), words.slice(max - 1).join(" ")];
}

type BigWordProps = {
  slot: string;
  rows: string[];
  color: ColorToken;
  // Batas ukuran huruf (px): kata dipaskan ke lebar kotaknya, tetapi tingginya dijaga.
  cap: number;
  // equal: semua baris sama besar, baris terlebar mengisi lebar (MO / OO / VE); justify: setiap
  // baris dipaskan sendiri ke lebar kotak (poster LUNCH / TIMES).
  mode: "equal" | "justify";
  align?: "left" | "center" | "right";
  // Indeks baris yang berada di depan subjek (equal); lainnya di belakang subjek.
  front?: number[];
  lineHeight?: number;
  // Bayangan keras baris depan (warna CSS dari shadowTone): baris itu melayang di depan subjek.
  frontShadow?: string | undefined;
};

// Perkiraan awal lebar huruf (em) sebelum renderer mengukur (fit-to-width T-123).
const ESTIMATE = 0.62;
// Lebar area aman terbesar (1080 − 2 × 64) untuk ukuran awal tanpa renderer.
const SAFE_WIDTH = 952;

// Kata raksasa (PRD 4 K2) dalam satu slot. Pada mode equal, elemen slot tidak membuat stacking
// context (tanpa container query, transform, atau z-index) sehingga setiap baris bisa diletakkan
// di depan atau di belakang subjek bersaudara (K3: subjek menembus huruf).
export function BigWord({
  slot,
  rows,
  color: tone,
  cap,
  mode,
  align = "center",
  front = [],
  lineHeight = 0.82,
  frontShadow,
}: BigWordProps) {
  const longest = Math.max(...rows.map((row) => row.length), 1);
  const estimate = (chars: number) =>
    `${Math.min(cap, SAFE_WIDTH / (chars * ESTIMATE)).toFixed(1)}px`;
  const base: CSSProperties = {
    margin: 0,
    fontFamily: "var(--font-heading)",
    fontWeight: "var(--font-heading-weight-strong)",
    fontSynthesis: "none",
    // Angka raksasa memakai angka sejajar (tinggi huruf kapital) bila font punya fiturnya.
    fontVariantNumeric: "lining-nums",
    lineHeight,
    whiteSpace: "nowrap",
    textAlign: align,
    textTransform: "var(--style-heading-transform, none)" as CSSProperties["textTransform"],
    letterSpacing: "var(--style-heading-tracking, normal)",
    color: color(tone),
  };
  if (mode === "justify") {
    return (
      <p data-slot={slot} data-slot-type="text" style={base}>
        {rows.map((row, index) => (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: baris boleh kembar, urutan tetap
            key={index}
            data-fit="width"
            data-fit-max={`${cap}px`}
            style={{ display: "block", fontSize: estimate(row.length) }}
          >
            {row}
          </span>
        ))}
      </p>
    );
  }
  return (
    <p
      data-slot={slot}
      data-slot-type="text"
      data-fit="width"
      data-fit-max={`${cap}px`}
      style={{ ...base, fontSize: estimate(longest) }}
    >
      <span style={{ display: "inline-block", textAlign: "left" }}>
        {rows.map((row, index) => (
          <span
            // biome-ignore lint/suspicious/noArrayIndexKey: baris boleh kembar, urutan tetap
            key={index}
            style={{
              display: "block",
              position: "relative",
              zIndex: front.includes(index) ? LAYER.front : LAYER.behind,
              textShadow:
                frontShadow && front.includes(index) ? `0.03em 0.02em 0 ${frontShadow}` : undefined,
            }}
          >
            {row}
          </span>
        ))}
      </span>
    </p>
  );
}

type AccentTextProps = {
  slot?: string;
  color: ColorToken;
  size?: FontSizeStep;
  // Huruf besar dengan tracking lebar untuk kredit cetak (Vintage/Retro bagian 5).
  caps?: boolean;
  align?: "left" | "center" | "right";
  // Panjang baris maksimal dalam karakter.
  measure?: number;
  children: string;
};

// Teks font aksen Brand Kit (T-134): label, data, kredit cetak, kalimat ketik. Tanpa font aksen,
// --font-accent jatuh ke font body brand.
export function AccentText({
  slot,
  color: tone,
  size = 1,
  caps = false,
  align,
  measure,
  children,
}: AccentTextProps) {
  return (
    <p
      data-slot={slot}
      data-slot-type={slot ? "text" : undefined}
      style={{
        margin: 0,
        fontFamily: "var(--font-accent)",
        fontWeight: "var(--font-accent-weight)",
        fontSize: fontSize(size),
        fontSynthesis: "none",
        lineHeight: 1.3,
        letterSpacing: caps ? "0.06em" : undefined,
        textTransform: caps ? "uppercase" : undefined,
        textAlign: align,
        textWrap: "balance",
        maxWidth: measure ? `${measure}ch` : undefined,
        color: color(tone),
      }}
    >
      {children}
    </p>
  );
}

export type CastShadow = "keras" | "lembut" | "tanpa";

// Bayangan subjek di dinding warna (Vintage/Retro bagian 3 butir 6 dan 10): token bidang yang
// digelapkan dengan neutral-dark, jatuh ke kanan bawah. Keras untuk brand tanpa bayangan lembut
// (tanpa blur, aman untuk brand "tanpa gradient"); lembut untuk brand berbayangan lembut.
export const shadowTone = (wall: ColorToken) =>
  `color-mix(in srgb, ${color("neutral-dark")} 34%, ${color(wall)})`;

export function castShadow(wall: ColorToken, kind: CastShadow, flip = false): string | undefined {
  if (kind === "tanpa") return undefined;
  const tone = shadowTone(wall);
  const x = flip ? -34 : 34;
  return kind === "keras"
    ? `drop-shadow(${x}px 22px 0 ${tone})`
    : `drop-shadow(${x * 0.6}px 18px 22px ${tone})`;
}
