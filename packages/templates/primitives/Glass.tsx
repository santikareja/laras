import type { CSSProperties, ReactNode } from "react";
import {
  type ColorToken,
  color,
  type FontSizeStep,
  fontFamily,
  fontSize,
  fontWeight,
  type SpaceStep,
  space,
} from "./vars.ts";

// Perangkat Glassmorphism dan Neumorphism (PANDUAN glassmorphism-neumorphism bagian 7):
// resep varian Kaca dan Timbul. Warna selalu token atau campuran dua token.

// Pil bila radius brand ≥ 16 px (didefinisikan lapisan gaya), selain itu radius brand.
export const PILL_RADIUS = "var(--radius-pill, var(--shape-radius))";

export type GlassTone = "light" | "dark";

type GlassOptions = {
  tone?: GlassTone;
  // Token tint kaca gelap: neutral-dark (bawaan) atau primary. Kaca terang selalu neutral-light.
  darkTint?: "neutral-dark" | "primary";
  // Kekuatan tint 0–1; bawaan 0,65 (terang) atau 0,55 (gelap), naikkan sampai 0,85 bila kontras
  // gagal, 1 = panel padat.
  tint?: number;
  // Blur latar dalam px kanvas: 32–48 di atas foto, 24–32 di atas bidang warna.
  blur?: number;
  // Saturasi hasil blur, 1,2–1,4.
  saturate?: number;
};

const percent = (value: number) => `${Math.round(value * 100)}%`;

// Gaya permukaan kaca, dipakai GlassPanel dan tombol varian kaca. Efek hilang bila induknya
// memakai opacity < 1, filter, mask, atau mix-blend-mode (backdrop root): letakkan kaca sebagai
// saudara langsung lapisan foto.
export function glassStyle({
  tone = "light",
  darkTint = "neutral-dark",
  tint,
  blur = 40,
  saturate = 1.3,
}: GlassOptions = {}): CSSProperties {
  const light = tone === "light";
  const strength = tint ?? (light ? 0.65 : 0.55);
  return {
    background: `color-mix(in srgb, ${color(light ? "neutral-light" : darkTint)} ${percent(strength)}, transparent)`,
    backdropFilter: `blur(${blur}px) saturate(${percent(saturate)})`,
    border: `min(var(--shape-stroke), 2px) solid color-mix(in srgb, ${color("neutral-light")} ${light ? "50%" : "25%"}, transparent)`,
    boxShadow: "var(--shape-shadow)",
  };
}

type GlassPanelProps = GlassOptions & {
  padding?: SpaceStep;
  children?: ReactNode;
};

// Kartu kaca buram (varian Kaca); mengisi kotak induknya, isi rata kiri dari children.
export function GlassPanel({ padding = 6, children, ...glass }: GlassPanelProps) {
  return (
    <div
      style={{
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: space(3),
        width: "100%",
        height: "100%",
        padding: space(padding),
        borderRadius: "var(--shape-radius)",
        ...glassStyle(glass),
      }}
    >
      {children}
    </div>
  );
}

// Warna permukaan Timbul: token, atau token diturunkan 8% ke token lain bila nyaris putih
// (mis. neutral-light 92% + primary 8%).
export function surfaceColor(surface: ColorToken, deepen?: ColorToken): string {
  return deepen ? `color-mix(in srgb, ${color(surface)} 92%, ${color(deepen)})` : color(surface);
}

// Bayangan Timbul: gelap di (+d,+d), terang di (−d,−d), blur 2d; cahaya dari kiri atas.
export function softShadow(surface: string, depth: number, inset = false): string {
  const dark = `color-mix(in srgb, ${surface} 82%, ${color("neutral-dark")})`;
  const light = `color-mix(in srgb, ${surface} 35%, ${color("neutral-light")})`;
  const pre = inset ? "inset " : "";
  return `${pre}${depth}px ${depth}px ${2 * depth}px ${dark}, ${pre}${-depth}px ${-depth}px ${2 * depth}px ${light}`;
}

type SoftSurfaceProps = {
  // Permukaan harus sama dengan bidang di belakangnya agar bentuk terbaca timbul.
  surface: ColorToken;
  deepen?: ColorToken;
  variant?: "raised" | "inset";
  // Jarak bayangan d: 12–24 px untuk bentuk ≥ 300 px, 6–10 px untuk bentuk ≤ 120 px.
  depth?: number;
  shape?: "brand" | "pill";
  padding?: SpaceStep;
  children?: ReactNode;
};

// Permukaan timbul atau cekung (varian Timbul); hanya untuk brand dengan bayangan soft.
// Mengisi kotak induknya.
export function SoftSurface({
  surface,
  deepen,
  variant = "raised",
  depth = 16,
  shape = "brand",
  padding,
  children,
}: SoftSurfaceProps) {
  const tone = surfaceColor(surface, deepen);
  return (
    <div
      style={{
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: space(3),
        width: "100%",
        height: "100%",
        padding: padding ? space(padding) : undefined,
        borderRadius: shape === "pill" ? PILL_RADIUS : "var(--shape-radius)",
        background: tone,
        boxShadow: softShadow(tone, depth, variant === "inset"),
      }}
    >
      {children}
    </div>
  );
}

type ProgressTrackProps = {
  // 0–1, dari data copy (mis. durasi audio, slide ke-n).
  value: number;
  surface: ColorToken;
  deepen?: ColorToken;
  fill?: ColorToken;
  // Tinggi lintasan dalam px kanvas.
  height?: number;
};

// Bilah progres: lintasan cekung berisi pil padat; selebar kotak induknya.
export function ProgressTrack({
  value,
  surface,
  deepen,
  fill = "primary",
  height = 32,
}: ProgressTrackProps) {
  const tone = surfaceColor(surface, deepen);
  const inner = Math.round(height * 0.6);
  const gap = (height - inner) / 2;
  const share = Math.min(Math.max(value, 0), 1);
  return (
    <div
      style={{
        boxSizing: "border-box",
        width: "100%",
        height,
        padding: gap,
        borderRadius: PILL_RADIUS,
        background: tone,
        boxShadow: softShadow(tone, Math.max(3, Math.round(height / 5)), true),
      }}
    >
      <div
        style={{
          width: `max(${inner}px, ${percent(share)})`,
          height: inner,
          borderRadius: PILL_RADIUS,
          background: color(fill),
        }}
      />
    </div>
  );
}

type KeycapProps = {
  surface: ColorToken;
  deepen?: ColorToken;
  color: ColorToken;
  // Sisi tuts dalam px kanvas; huruf ≥ 48 px.
  size?: number;
  depth?: number;
  textSize?: FontSizeStep;
  slot?: string;
  // Satu huruf atau angka dari copy.
  children: string;
};

// Tuts timbul berisi satu karakter HTML (varian Timbul, pola 5); maksimal 9 per postingan.
export function Keycap({
  surface,
  deepen,
  color: tone,
  size = 120,
  depth = 8,
  textSize = 4,
  slot,
  children,
}: KeycapProps) {
  const face = surfaceColor(surface, deepen);
  return (
    <span
      data-slot={slot}
      data-slot-type={slot ? "text" : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: "min(var(--shape-radius), 24%)",
        background: face,
        boxShadow: softShadow(face, depth),
        fontFamily: fontFamily("body"),
        fontWeight: fontWeight("body", true),
        fontSize: `max(48px, ${fontSize(textSize)})`,
        fontSynthesis: "none",
        lineHeight: 1,
        color: color(tone),
      }}
    >
      {children}
    </span>
  );
}
