import { PILL_RADIUS } from "./Glass.tsx";
import { type ColorToken, color } from "./vars.ts";

// Set ikon garis buatan sendiri (T-132; tanpa pustaka berlisensi): grid 24, isi 2–22, garis
// `currentColor` berujung membulat. Dipakai Corporate (Icon, IconRow, ContactBar), Flat
// (IkonDatar), Glassmorphism (IconButton), dan Brutalisme (IkonTeknis: arrow-right, x, plus,
// target, eye). Ikon selalu dekoratif pendamping teks: tanpa data-slot.

// Lingkaran dan persegi membulat sebagai path agar setiap ikon cukup berupa daftar `d`.
const circle = (cx: number, cy: number, r: number) =>
  `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`;
const rect = (x: number, y: number, w: number, h: number, r: number) =>
  `M${x + r} ${y}H${x + w - r}a${r} ${r} 0 0 1 ${r} ${r}V${y + h - r}a${r} ${r} 0 0 1 ${-r} ${r}` +
  `H${x + r}a${r} ${r} 0 0 1 ${-r} ${-r}V${y + r}a${r} ${r} 0 0 1 ${r} ${-r}Z`;

const ICONS = {
  phone: [
    "M4 5C4 3.9 4.9 3 6 3H8.6L10.4 7.4L8.2 9C9.4 11.6 12.4 14.6 15 15.8L16.6 13.6L21 15.4V18" +
      "C21 19.1 20.1 20 19 20C10.7 20 4 13.3 4 5Z",
  ],
  chat: [
    "M6.5 4H17.5A2.5 2.5 0 0 1 20 6.5V14A2.5 2.5 0 0 1 17.5 16.5H11.5L7 20.5V16.5H6.5" +
      "A2.5 2.5 0 0 1 4 14V6.5A2.5 2.5 0 0 1 6.5 4Z",
    "M8.5 9H15.5",
    "M8.5 12.5H13",
  ],
  mail: [rect(3, 5, 18, 14, 2), "M3.5 7.5L12 13.5L20.5 7.5"],
  globe: [
    circle(12, 12, 9),
    "M12 3C9.6 5.4 8.5 8.6 8.5 12S9.6 18.6 12 21C14.4 18.6 15.5 15.4 15.5 12S14.4 5.4 12 3Z",
    "M3 12H21",
  ],
  pin: ["M12 21.5S19 15.2 19 9.8A7 7 0 0 0 5 9.8C5 15.2 12 21.5 12 21.5Z", circle(12, 9.8, 2.6)],
  calendar: [rect(3.5, 5, 17, 15.5, 2), "M3.5 10H20.5", "M8 3V7", "M16 3V7"],
  clock: [circle(12, 12, 9), "M12 7V12L15.5 14"],
  check: ["M4.5 12.5L9.5 17.5L19.5 6.5"],
  shield: [
    "M12 3L19.5 5.8V11.5C19.5 16 16.3 19.6 12 21C7.7 19.6 4.5 16 4.5 11.5V5.8Z",
    "M8.8 12L11.2 14.4L15.4 9.8",
  ],
  truck: [
    "M14.5 16.5V5.5H3.5A1 1 0 0 0 2.5 6.5V15.5A1 1 0 0 0 3.5 16.5H4.8",
    "M14.5 9H18L21.5 12.5V15.5A1 1 0 0 1 20.5 16.5H19.7",
    "M9.2 16.5H15.3",
    circle(7, 16.5, 2.2),
    circle(17.5, 16.5, 2.2),
  ],
  card: [rect(2.5, 5, 19, 14, 2), "M2.5 9.5H21.5", "M6 15H10"],
  chart: ["M4 4V20H20", "M8.5 16V12", "M12.5 16V8", "M16.5 16V10.5", "M20 16V6"],
  user: [circle(12, 8, 4), "M4.5 20.5C4.5 16.4 7.9 13.5 12 13.5S19.5 16.4 19.5 20.5"],
  star: [
    "M12 3.3L14.37 9.64L21.13 9.93L15.83 14.15L17.64 20.67L12 16.93L6.36 20.67L8.17 14.15" +
      "L2.87 9.93L9.63 9.64Z",
  ],
  "arrow-right": ["M4.5 12H19.5", "M13.5 6L19.5 12L13.5 18"],
  plus: ["M12 5V19", "M5 12H19"],
  x: ["M6 6L18 18", "M18 6L6 18"],
  target: [circle(12, 12, 7), "M12 2.5V8", "M12 16V21.5", "M2.5 12H8", "M16 12H21.5"],
  eye: [
    "M2.5 12C5 7.5 8.3 5.5 12 5.5S19 7.5 21.5 12C19 16.5 15.7 18.5 12 18.5S5 16.5 2.5 12Z",
    circle(12, 12, 3),
  ],
  play: ["M8.5 5.5L19 12L8.5 18.5Z"],
  pause: [rect(6.5, 5, 4, 14, 1), rect(13.5, 5, 4, 14, 1)],
  headphones: [
    "M4 15V12A8 8 0 0 1 20 12V15",
    "M4 13.5H6A1.5 1.5 0 0 1 7.5 15V18.5A1.5 1.5 0 0 1 6 20H5.5A1.5 1.5 0 0 1 4 18.5Z",
    "M20 13.5H18A1.5 1.5 0 0 0 16.5 15V18.5A1.5 1.5 0 0 0 18 20H18.5A1.5 1.5 0 0 0 20 18.5Z",
  ],
  heart: [
    "M12 20.5C6 16.5 3 13 3 9.3C3 6.6 5 4.5 7.6 4.5C9.4 4.5 11 5.5 12 7.2" +
      "C13 5.5 14.6 4.5 16.4 4.5C19 4.5 21 6.6 21 9.3C21 13 18 16.5 12 20.5Z",
  ],
  leaf: ["M5 19C5 10.5 10.5 5 20 4C19.5 13.5 14 19 5 19Z", "M3.5 20.5L13 11"],
  bag: [
    "M4.5 8H19.5L18.6 19.2A1.5 1.5 0 0 1 17.1 20.5H6.9A1.5 1.5 0 0 1 5.4 19.2Z",
    "M8.5 8V7A3.5 3.5 0 0 1 15.5 7V8",
  ],
  home: [
    "M3.5 11L12 3.8L20.5 11",
    "M5.5 9.5V19.5A1 1 0 0 0 6.5 20.5H17.5A1 1 0 0 0 18.5 19.5V9.5",
    "M10 20.5V15H14V20.5",
  ],
} satisfies Record<string, string[]>;

export type IconName = keyof typeof ICONS;
export const ICON_NAMES = Object.keys(ICONS) as IconName[];

type IconProps = {
  name: IconName;
  // Sisi ikon dalam px kanvas.
  size: number;
  // Tebal garis dalam px kanvas; bawaan ±1/16 ukuran, minimal 2 px. "brand" = --shape-stroke
  // (minimal 2 px), untuk Glassmorphism.
  stroke?: number | "brand";
  // Tanpa nilai: mewarisi warna teks induk.
  color?: ColorToken;
  // Isi padat, hanya untuk bentuk tertutup tunggal (star, heart, play, pause).
  solid?: boolean;
};

const round = (value: number) => Math.round(value * 1000) / 1000;

// Ikon garis tunggal; ukuran tetap, penempatan diatur pemakai.
export function Icon({ name, size, stroke, color: tone, solid = false }: IconProps) {
  const scale = 24 / size;
  const width =
    stroke === "brand"
      ? `calc(max(2px, var(--shape-stroke)) * ${round(scale)})`
      : round((stroke ?? Math.max(2, size / 16)) * scale);
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      fill={solid ? "currentColor" : "none"}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        display: "block",
        flex: "none",
        overflow: "visible",
        strokeWidth: width,
        color: tone ? color(tone) : undefined,
      }}
    >
      {ICONS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

type IconDiscProps = Omit<IconProps, "color"> & {
  // Wadah: lingkaran, sudut brand (Corporate radius 0 "ikut siku", Flat kotak membulat), atau
  // pil (lingkaran hanya bila radius brand ≥ 16 px, Glassmorphism).
  shape?: "circle" | "brand" | "pill";
  // Sisi wadah = ukuran ikon × ratio (Corporate 1,5; Flat 1,6).
  ratio?: number;
  background: ColorToken;
  color: ColorToken;
};

const RADIUS = { circle: "50%", brand: "var(--shape-radius)", pill: PILL_RADIUS };

// Ikon di dalam wadah bidang token (Corporate wadah ikon, Flat IkonDatar).
export function IconDisc({
  shape = "circle",
  ratio = 1.5,
  background,
  color: tone,
  ...icon
}: IconDiscProps) {
  const side = Math.round(icon.size * ratio);
  return (
    <span
      style={{
        display: "flex",
        flex: "none",
        alignItems: "center",
        justifyContent: "center",
        width: side,
        height: side,
        borderRadius: RADIUS[shape],
        background: color(background),
        color: color(tone),
      }}
    >
      <Icon {...icon} />
    </span>
  );
}
