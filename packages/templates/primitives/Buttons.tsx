import { type GlassTone, glassStyle, PILL_RADIUS, softShadow, surfaceColor } from "./Glass.tsx";
import { Icon, IconDisc, type IconName } from "./Icons.tsx";
import {
  type ColorToken,
  color,
  type FontSizeStep,
  fontFamily,
  fontSize,
  fontWeight,
} from "./vars.ts";

// Ukuran tombol CTA (PANDUAN corporate-clean bagian 7): tinggi 88–104 px, padding 40 px, ikon
// panah dalam lingkaran 56–64 px di kanan.
const HEIGHT = 96;
const PAD = 40;
const DISC = 60;
const GLYPH = 32;

type ButtonProps = {
  // Latar tombol padat; bawaan accent. Diabaikan pada varian kaca.
  background?: ColorToken;
  // Warna label; bawaan neutral-dark (neutral-light pada kaca gelap).
  color?: ColorToken;
  // Ikon dalam lingkaran di kanan; null = tanpa ikon.
  icon?: IconName | null;
  // Bawaan: lingkaran warna label dengan ikon warna latar tombol.
  iconBackground?: ColorToken;
  iconColor?: ColorToken;
  // "pill" = PillButton Glassmorphism (pil hanya bila radius brand ≥ 16 px).
  shape?: "brand" | "pill";
  // Wadah ikon: lingkaran (bawaan) atau ikut sudut brand (Corporate radius 0 "siku").
  iconShape?: "circle" | "brand";
  // Tebal garis ikon; "brand" = --shape-stroke (satu keluarga ikon per postingan, P11).
  iconStroke?: number | "brand";
  // Varian kaca (tombol sekunder Glassmorphism) sebagai ganti latar padat.
  glass?: GlassTone;
  size?: FontSizeStep;
  slot?: string;
  // Label 2–3 kata dari copy.
  children: string;
};

// Tombol CTA (Corporate Button, Flat CTA dengan ikon, Glassmorphism PillButton); satu per slide.
export function Button({
  background = "accent",
  color: tone,
  icon = "arrow-right",
  iconBackground,
  iconColor,
  shape = "brand",
  iconShape = "circle",
  iconStroke = 3,
  glass,
  size = 2,
  slot,
  children,
}: ButtonProps) {
  const text = tone ?? (glass === "dark" ? "neutral-light" : "neutral-dark");
  const glyph =
    iconColor ?? (glass ? (glass === "dark" ? "neutral-dark" : "neutral-light") : background);
  const surface = glass ? glassStyle({ tone: glass }) : { background: color(background) };
  return (
    <span
      data-slot={slot}
      data-slot-type={slot ? "text" : undefined}
      style={{
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        gap: 24,
        width: "fit-content",
        height: HEIGHT,
        paddingLeft: PAD,
        paddingRight: icon ? (HEIGHT - DISC) / 2 : PAD,
        borderRadius: shape === "pill" ? PILL_RADIUS : "var(--shape-radius)",
        ...surface,
        fontFamily: fontFamily("body"),
        fontWeight: fontWeight("body", true),
        fontSize: fontSize(size),
        fontSynthesis: "none",
        lineHeight: 1.1,
        whiteSpace: "nowrap",
        color: color(text),
      }}
    >
      {children}
      {icon && (
        <IconDisc
          name={icon}
          size={GLYPH}
          ratio={DISC / GLYPH}
          stroke={iconStroke}
          shape={shape === "pill" ? "pill" : iconShape}
          background={iconBackground ?? text}
          color={glyph}
        />
      )}
    </span>
  );
}

type IconButtonProps = {
  name: IconName;
  // Sisi tombol 72–96 px; ikon ±0,5× (32–48 px).
  size?: number;
  // solid = bidang token; glass = kaca; raised = permukaan Timbul (latar sama dengan sekitarnya).
  variant?: "solid" | "glass" | "raised";
  // Bidang (solid) atau permukaan (raised); diabaikan pada kaca.
  background?: ColorToken;
  // Permukaan raised diturunkan 8% ke token ini, sama dengan SoftSurface di sekitarnya.
  deepen?: ColorToken;
  glass?: GlassTone;
  color: ColorToken;
};

// Tombol ikon bulat Glassmorphism; bulat penuh hanya bila radius brand ≥ 16 px. Ikon harus
// bermakna dan sebaiknya berlabel teks di dekatnya.
export function IconButton({
  name,
  size = 88,
  variant = "solid",
  background = "neutral-light",
  deepen,
  glass = "light",
  color: tone,
}: IconButtonProps) {
  const surface = surfaceColor(background, variant === "raised" ? deepen : undefined);
  const look =
    variant === "glass"
      ? glassStyle({ tone: glass })
      : {
          background: surface,
          boxShadow: variant === "raised" ? softShadow(surface, 8) : undefined,
        };
  return (
    <span
      style={{
        boxSizing: "border-box",
        display: "flex",
        flex: "none",
        alignItems: "center",
        justifyContent: "center",
        width: size,
        height: size,
        borderRadius: PILL_RADIUS,
        ...look,
        color: color(tone),
      }}
    >
      <Icon name={name} size={Math.min(48, Math.max(32, Math.round(size / 2)))} stroke="brand" />
    </span>
  );
}
