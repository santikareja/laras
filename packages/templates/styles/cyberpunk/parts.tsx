import type { StyleChoice } from "@laras/shared";
import type { CSSProperties, ReactElement } from "react";
import { type TextEffect, TextEffectFrame, type TextLayer } from "../../primitives/Effects.tsx";
import { Grain, PixelScatter } from "../../primitives/index.ts";
import { type ColorToken, color, fontSize, space } from "../../primitives/vars.ts";

// Perangkat khas arketipe Cyberpunk (T-134, PANDUAN.md bagian 7 dan 9): kata raksasa dengan
// potongan berpita yang bisa dipisah ke lapisan depan subjek, baris label HUD tiga kolom dalam
// font aksen, cahaya di belakang subjek, dan tekstur layar. Semua warna dari token.

export const CANVAS_HEIGHT = 1350;
const CANVAS_WIDTH = 1080;

// Warna cahaya (pita, kolam, piksel, CTA) dan warna huruf di atasnya. Primary brand biasanya
// gelap atau jenuh tua (teks terang), accent dan secondary terang (teks gelap).
export type Light = "accent" | "primary" | "secondary";
export const inkOn = (light: Light): ColorToken =>
  light === "primary" ? "neutral-light" : "neutral-dark";

const fade = (tone: ColorToken, percent: number) =>
  `color-mix(in srgb, ${color(tone)} ${percent}%, transparent)`;

// Teks label HUD: font aksen brand (jatuh ke body bila kosong), langkah 1, kapital, tracking +0,1 em.
export function hudText(tone: ColorToken): CSSProperties {
  return {
    fontFamily: "var(--font-accent)",
    fontWeight: "var(--font-accent-weight-strong)",
    fontSize: fontSize(1),
    fontSynthesis: "none",
    lineHeight: 1,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
    color: color(tone),
  };
}

type HudRowProps = {
  labels: [string | undefined, string | undefined, string | undefined];
  color: ColorToken;
  style?: CSSProperties;
};

// Tiga label HUD sejajar di garis safe margin (kiri, tengah, kanan), satu grup elemen. Slot
// `hud1`–`hud3` selalu tampil (bagian komposisi), berbeda dari slot `label` yang hanya tampil
// dengan gaya.
export function HudRow({ labels, color: tone, style }: HudRowProps) {
  const [left, middle, right] = labels;
  if (!left && !middle && !right) return null;
  const cell = (slot: string, text: string | undefined, justify: string) => (
    <div style={{ display: "flex", justifyContent: justify, minWidth: 0 }}>
      {text && (
        <span data-slot={slot} data-slot-type="text" style={hudText(tone)}>
          {text}
        </span>
      )}
    </div>
  );
  return (
    <div
      data-qa-element="group"
      data-qa-name="label HUD"
      style={{
        position: "absolute",
        left: "var(--space-safe)",
        right: "var(--space-safe)",
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)",
        columnGap: space(3),
        alignItems: "center",
        ...style,
      }}
    >
      {cell("hud1", left, "flex-start")}
      {cell("hud2", middle, "center")}
      {cell("hud3", right, "flex-end")}
    </div>
  );
}

type SplitWordProps = {
  text: string;
  ink: ColorToken;
  band: ColorToken;
  // Batas ukuran: kelipatan --font-size-6.
  scale: number;
  // Lapisan depan subjek: hanya potongan berpita yang terlihat, tanpa slot.
  front?: boolean;
  slot?: string;
  effect?: TextEffect | undefined;
};

const ESTIMATE = 0.6;

// Kata raksasa dipaskan ke lebar kotak (data-fit), dengan satu potongan berpita warna cahaya
// (AUTO[MA]TIS, PANDUAN bagian 5) yang ditandai kurung siku di isi slot. Dirender dua kali dengan markup yang sama: lapisan belakang
// (seluruh kata, di belakang subjek) dan lapisan depan (hanya potongan), sehingga subjek terjepit
// di antara kata dan pitanya. Renderer memaskan keduanya ke ukuran yang sama; efek gaya (glitch)
// berlaku untuk kedua lapisan.
export function SplitWord({ effect, front = false, ...props }: SplitWordProps) {
  const render = (layer?: TextLayer) => <WordLayer {...props} front={front} layer={layer} />;
  const content = effect ? (
    <TextEffectFrame effect={effect} frame={{ width: "100%" }} render={render} />
  ) : (
    render()
  );
  if (!front) return content;
  return (
    <div aria-hidden="true" style={{ pointerEvents: "none", visibility: "hidden" }}>
      {content}
    </div>
  );
}

// Potongan berpita ditandai kurung siku di isi slot, mis. DI[UNDUH]; tanpa kurung, tanpa pita.
export function splitChunk(raw: string): { before: string; chunk: string; after: string } | null {
  const match = /^([^[\]]*)\[([^[\]]+)\]([^[\]]*)$/.exec(raw);
  return match ? { before: match[1] ?? "", chunk: match[2] ?? "", after: match[3] ?? "" } : null;
}

// Isi kata tanpa tanda kurung (untuk dibaca dan diukur).
export const plainWord = (raw: string) => raw.replace(/[[\]]/g, "");

function WordLayer({
  text,
  ink,
  band,
  scale,
  front,
  slot,
  layer,
}: Omit<SplitWordProps, "effect"> & { layer?: TextLayer | undefined }) {
  const cap = `calc(${fontSize(6)} * ${scale})`;
  const parts = splitChunk(text);
  const plain = plainWord(text);
  const copy = front || (layer?.copy ?? false);
  return (
    <div style={{ containerType: "inline-size", width: "100%" }}>
      <p
        data-slot={copy ? undefined : slot}
        data-slot-type={slot && !copy ? "text" : undefined}
        data-fit="width"
        data-fit-max={cap}
        style={{
          margin: 0,
          fontFamily: "var(--font-heading)",
          fontWeight: "var(--font-heading-weight-strong)",
          fontSize: `min(${cap}, calc(100cqw / ${(Math.max(plain.length, 1) * ESTIMATE).toFixed(2)}))`,
          fontSynthesis: "none",
          lineHeight: 0.9,
          whiteSpace: "nowrap",
          textAlign: "center",
          textTransform: "uppercase",
          letterSpacing: "var(--style-heading-tracking, -0.01em)",
          color: color(layer?.color ?? ink),
          ...layer?.style,
        }}
      >
        {parts ? (
          <>
            {parts.before}
            <span
              style={{
                display: "inline-block",
                padding: "0 0.05em",
                // Salinan berwarna (kanal, gema) hanya huruf, tanpa bidang pita.
                background: layer?.color ? undefined : color(band),
                color: color(layer?.color ?? inkOnBand(band)),
                visibility: front ? "visible" : undefined,
              }}
            >
              {parts.chunk}
            </span>
            {parts.after}
          </>
        ) : (
          plain
        )}
      </p>
    </div>
  );
}

const inkOnBand = (band: ColorToken): ColorToken =>
  band === "primary" ? "neutral-light" : "neutral-dark";

type HaloProps = {
  kind: "kolam" | "cakram";
  light: Light;
  // Pusat dan diameter (px kanvas).
  x: number;
  y: number;
  size: number;
};

// Cahaya di belakang subjek. Kolam: radial lunak warna cahaya (brand yang mengizinkan gradient,
// opasitas puncak 45%). Cakram: bidang padat primary dengan cincin garis warna cahaya, tanpa
// gradasi (brand tanpa gradient, PANDUAN bagian 6).
export function Halo({ kind, light, x, y, size }: HaloProps) {
  const box: CSSProperties = {
    position: "absolute",
    left: x - size / 2,
    top: y - size / 2,
    width: size,
    height: size,
    borderRadius: "50%",
    pointerEvents: "none",
  };
  if (kind === "kolam") {
    return (
      <div
        data-qa-element="decor"
        aria-hidden="true"
        style={{
          ...box,
          background: `radial-gradient(closest-side, ${fade(light, 45)}, ${fade(light, 18)} 55%, transparent)`,
        }}
      />
    );
  }
  const ring = Math.round(size * 0.06);
  return (
    <div
      data-qa-element="decor"
      aria-hidden="true"
      style={{ ...box, background: color("primary") }}
    >
      <div
        style={{
          position: "absolute",
          inset: -ring,
          borderRadius: "50%",
          border: `var(--shape-stroke) solid ${fade(light, 70)}`,
        }}
      />
    </div>
  );
}

type PixelsProps = {
  side: "left" | "right";
  light: Light;
  // Kotak pita (px kanvas).
  left: number;
  top: number;
  width: number;
  height: number;
  seed?: number;
};

// Pecahan piksel di sisi subjek (PANDUAN bagian 7): rapat di sisi yang menempel ke subjek.
export function Pixels({ side, light, left, top, width, height, seed = 3 }: PixelsProps) {
  return (
    <div style={{ position: "absolute", left, top, width, height, pointerEvents: "none" }}>
      <PixelScatter
        mode="scatter"
        tone={light}
        side={side === "right" ? "left" : "right"}
        count={26}
        seed={seed}
      />
    </div>
  );
}

type PixelGridProps = {
  // Sisi subjek tempat grid menempel (grid menipis menjauhi subjek).
  side: "left" | "right";
  light: Light;
  // Titik tempel grid di tepi subjek (px kanvas).
  x: number;
  top: number;
  rows: number;
};

const GRID_CELL = 40;
const GRID_COLS = 5;

// Grid piksel bergaris tipis di sisi subjek (rujukan FAZER/SOMOS): sel 40 px, menipis menjauhi
// subjek dengan membuang sel, berseberangan dengan piksel lepas.
export function PixelField({ side, light, x, top, rows }: PixelGridProps) {
  const width = GRID_CELL * GRID_COLS;
  return (
    <div
      style={{
        position: "absolute",
        left: side === "right" ? x : x - width,
        top,
        pointerEvents: "none",
      }}
    >
      <PixelScatter
        mode="grid"
        tone={light}
        side={side === "right" ? "left" : "right"}
        cell={GRID_CELL}
        cols={GRID_COLS}
        rows={rows}
        seed={5}
      />
    </div>
  );
}

// Tekstur layar gaya Cyberpunk di atas bidang latar (opsi `tekstur`): butir halus; scanline
// dipasang di foto lewat perlakuan gambar.
export function ScreenTexture({ style }: { style: StyleChoice }): ReactElement | null {
  return style.options.tekstur === "grain" ? <Grain tone="neutral-light" opacity={0.06} /> : null;
}

// Baris CTA berpita warna cahaya (rujukan "para escalar com IA?"): ukuran body, satu baris.
export function CtaBand({ text, light }: { text: string; light: Light }) {
  return (
    <span
      data-slot="cta"
      data-slot-type="text"
      style={{
        fontFamily: "var(--font-body)",
        fontWeight: "var(--font-body-weight-strong)",
        fontSize: fontSize(2),
        fontSynthesis: "none",
        lineHeight: 1.2,
        whiteSpace: "nowrap",
        padding: `0.12em ${space(2)}`,
        borderRadius: "var(--shape-radius)",
        background: color(light),
        color: color(inkOn(light)),
      }}
    >
      {text}
    </span>
  );
}

// Mode cahaya garis: lunak (blur), padat (garis kedua tanpa blur; juga untuk glow "tidak", yang
// hanya mematikan halo subjek), atau garis polos tanpa gaya Cyberpunk.
export type LightMode = "soft" | "solid" | "flat";

export const lightMode = (style: StyleChoice | undefined): LightMode =>
  style?.id !== "cyberpunk" ? "flat" : style.options.glow === "soft" ? "soft" : "solid";

const glowShadow = (light: Light, mode: LightMode) =>
  mode === "soft"
    ? `0 0 12px ${fade(light, 70)}, 0 0 36px ${fade(light, 35)}`
    : mode === "solid"
      ? `0 0 0 6px ${color("neutral-dark")}, 0 0 0 9px ${fade(light, 45)}`
      : undefined;

type LightBarProps = {
  light: Light;
  mode: LightMode;
  // Kotak batang (px kanvas); batang mendatar atau tegak 4–8 px.
  left: number;
  top: number;
  width: number;
  height: number;
};

// Batang lampu panggung (rel neon mendatar atau tiang tegak, sudut 0°/90°, PANDUAN bagian 7).
export function LightBar({ light, mode, left, top, width, height }: LightBarProps) {
  return (
    <div
      data-qa-element="decor"
      aria-hidden="true"
      style={{
        position: "absolute",
        left,
        top,
        width,
        height,
        pointerEvents: "none",
        background: color(light),
        boxShadow: glowShadow(light, mode),
      }}
    />
  );
}

type StageProps = {
  kind: "lantai" | "meja";
  // Isi sorot: kolam (gradasi) atau cakram (padat, brand tanpa gradient).
  fill: "kolam" | "cakram" | "tidak";
  light: Light;
  mode: LightMode;
  // Lantai subjek (px kanvas) dan lebar bidang panggung.
  floor: number;
  width: number;
};

export const STAGE = { pool: 96, rail: 28, desk: 128 } as const;

// Panggung di bawah sorot (PANDUAN bagian 9.1). Lantai: genangan cahaya elips tempat subjek
// berdiri dan rel neon di tepi panggung. Meja: bidang padat dengan rel di tepi atas, digambar di
// depan subjek setengah badan agar potongan badannya tersembunyi.
export function Stage({ kind, fill, light, mode, floor, width }: StageProps) {
  const left = (CANVAS_WIDTH - width) / 2;
  if (kind === "meja") {
    return (
      <>
        <div
          data-qa-element="decor"
          aria-hidden="true"
          style={{
            position: "absolute",
            left,
            top: floor,
            width,
            height: STAGE.desk,
            pointerEvents: "none",
            background: `color-mix(in srgb, ${color(light)} 14%, ${color("neutral-dark")})`,
          }}
        />
        <LightBar light={light} mode={mode} left={left} top={floor} width={width} height={4} />
      </>
    );
  }
  const pool =
    fill === "kolam"
      ? `radial-gradient(closest-side, ${fade(light, 55)}, ${fade(light, 20)} 60%, transparent)`
      : fill === "cakram"
        ? `color-mix(in srgb, ${color("neutral-light")} 14%, ${color("primary")})`
        : `color-mix(in srgb, ${color(light)} 18%, ${color("neutral-dark")})`;
  return (
    <>
      <div
        data-qa-element="decor"
        aria-hidden="true"
        style={{
          position: "absolute",
          left,
          top: floor - STAGE.pool / 2,
          width,
          height: STAGE.pool,
          borderRadius: "50%",
          pointerEvents: "none",
          background: pool,
        }}
      />
      <LightBar
        light={light}
        mode={mode}
        left={left - width * 0.1}
        top={floor + STAGE.pool / 2 + STAGE.rail}
        width={width * 1.2}
        height={4}
      />
    </>
  );
}
