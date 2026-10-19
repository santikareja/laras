import type { ReactNode } from "react";
import {
  type ColorToken,
  color,
  type FontRole,
  type FontSizeStep,
  fontFamily,
  fontSize,
  fontWeight,
} from "./vars.ts";

// Bentuk dekoratif perangkat gaya (T-132): pita swoosh, bentuk organik, panel lengkung, cakram,
// starburst, pelangi, stiker bulat, dan bayangan lantai. Warna selalu dari token. Bentuk yang
// bisa berada di belakang teks dibuat sebagai bidang `background` dengan `clip-path` (bukan SVG)
// agar QA kontras membaca warna bidang itu sebagai latar teks. Semua titik dari rumus atau tabel
// tetap (deterministik).

type Point = [number, number];
const ORIGIN: Point = [0, 0];

// Ukuran kanvas dasar (px) untuk lapisan seukuran kanvas.
const CANVAS = { width: 1080, height: 1350 };

const round = (value: number) => Math.round(value * 100) / 100;
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
const pick = <T,>(list: T[], index: number, fallback: T): T =>
  list[((index % list.length) + list.length) % list.length] ?? fallback;

// Poligon clip-path dalam persen kotak.
const polygon = (points: Point[]) =>
  `polygon(${points.map(([x, y]) => `${round(x)}% ${round(y)}%`).join(", ")})`;

// Titik dipaskan ke kotak 0–100% (bentuk mengisi penuh kotaknya).
function normalize(points: Point[]): Point[] {
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const [left, right, top, bottom] = [
    Math.min(...xs),
    Math.max(...xs),
    Math.min(...ys),
    Math.max(...ys),
  ];
  return points.map(([x, y]) => [
    ((x - left) / (right - left || 1)) * 100,
    ((y - top) / (bottom - top || 1)) * 100,
  ]);
}

// Kurva tertutup halus (Catmull-Rom) lewat titik kendali, disampel menjadi titik poligon.
function closedCurve(controls: Point[], samples: number): Point[] {
  const at = (i: number) => pick(controls, i, ORIGIN);
  return controls.flatMap((_, i) => {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    return Array.from({ length: samples }, (_, s): Point => {
      const t = s / samples;
      const axis = (k: 0 | 1) =>
        0.5 *
        (2 * p1[k] +
          (p2[k] - p0[k]) * t +
          (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t * t +
          (3 * p1[k] - p0[k] - 3 * p2[k] + p3[k]) * t * t * t);
      return [axis(0), axis(1)];
    });
  });
}

type Layer = { color: ColorToken };

// --- Swoosh --------------------------------------------------------------------------------

type SwooshPreset = "arc" | "wave" | "rise" | "corner" | "side";

// Kurva Bézier kubik di kanvas 1080 × 1350, kedua ujung di luar kanvas. Jari-jari lengkung
// minimum di bagian yang terlihat: arc 799, wave 431, rise 980, corner 773 px (≥ 300 px).
// `start` adalah posisi ujung bulat (bagian panjang path) untuk varian `ends="round"`.
const SWOOSH: Record<SwooshPreset, { d: string; start: number }> = {
  // Satu lengkung dari kiri bawah, melengkung ke atas, keluar di kanan.
  arc: { d: "M -160 1130 C 180 560, 780 470, 1240 860", start: 0.3 },
  // Gelombang S: dua lengkungan tenang melintas kanvas.
  wave: { d: "M -160 760 C 420 380, 620 1220, 1240 820", start: 0.24 },
  // Naik diagonal dari kiri bawah ke kanan atas (pola "Pita swoosh").
  rise: { d: "M -160 1260 C 420 1180, 700 640, 1240 140", start: 0.18 },
  // Menyapu sudut kiri bawah.
  corner: { d: "M -160 860 C 260 900, 560 1120, 660 1520", start: 0.32 },
  // Naik dari tepi bawah di separuh kanan dan keluar di tepi kanan: tetap di sisi subjek,
  // menjauhi teks di sisi seberang (pengganti lengkung feed-bidang-warna; flipX untuk sisi kiri).
  side: { d: "M 620 1520 C 680 1120, 940 800, 1240 640", start: 0.3 },
};

const SWOOSH_WEIGHT = { line: 44, band: 160 } as const;

type SwooshProps = Layer & {
  preset: SwooshPreset;
  // Garis tebal 32–54 px atau pita lebar 108–240 px (Flat bagian 7).
  variant?: keyof typeof SWOOSH_WEIGHT;
  // Ketebalan (px kanvas); bawaan 44 untuk garis, 160 untuk pita.
  thickness?: number;
  // Kedua ujung keluar kanvas, atau satu ujung bulat di dalam kanvas.
  ends?: "bleed" | "round";
  flipX?: boolean;
  flipY?: boolean;
};

// Pita lengkung Flat Design dan Corporate (bagian 7): lapisan seukuran kanvas, mengisi kotak
// induknya. Dekoratif; teks yang melintas swoosh tidak terbaca QA sebagai latar, jadi jauhkan teks.
export function Swoosh({
  color: tone,
  preset,
  variant = "line",
  thickness,
  ends = "bleed",
  flipX = false,
  flipY = false,
}: SwooshProps) {
  const { d, start } = SWOOSH[preset];
  const flip = `translate(${flipX ? CANVAS.width : 0} ${flipY ? CANVAS.height : 0}) scale(${flipX ? -1 : 1} ${flipY ? -1 : 1})`;
  // Ujung bulat: path dipotong dari awal lewat pola garis putus (panjang path dinormalkan 1000).
  const trim = ends === "round" ? Math.round(start * 1000) : 0;
  return (
    <svg
      data-qa-element="shape"
      aria-hidden="true"
      viewBox={`0 0 ${CANVAS.width} ${CANVAS.height}`}
      preserveAspectRatio="xMidYMid slice"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        color: color(tone),
      }}
    >
      <path
        d={d}
        transform={flipX || flipY ? flip : undefined}
        pathLength={trim ? 1000 : undefined}
        strokeDasharray={trim ? `${1000 - trim} 2000` : undefined}
        strokeDashoffset={trim ? -trim : undefined}
        fill="none"
        stroke="currentColor"
        strokeWidth={thickness ?? SWOOSH_WEIGHT[variant]}
        strokeLinecap={trim ? "round" : "butt"}
      />
    </svg>
  );
}

// --- Blob dan Scallop ----------------------------------------------------------------------

// Simpangan jari-jari tetap (−1..1); `seed` memilih titik mulai tabel dan sudut putar.
const WOBBLE = [0.8, -0.9, 0.35, -0.2, 1, -0.6, 0.55, -1, 0.15, 0.7, -0.4];

type OrganicProps = Layer & {
  children?: ReactNode;
};

// Bidang berbentuk (clip-path) di belakang isi; isi dipusatkan dengan jarak dalam dari tepi.
// Latar berupa `background`, sehingga QA kontras membaca warna bidang di belakang teks.
function ShapedField({
  tone,
  clip,
  padding,
  children,
}: {
  tone: ColorToken;
  clip: string;
  padding: string;
  children?: ReactNode;
}) {
  const field = (
    <div
      aria-hidden={children ? "true" : undefined}
      style={{ position: "absolute", inset: 0, background: color(tone), clipPath: clip }}
    />
  );
  return (
    <div
      data-qa-element="shape"
      aria-hidden={children ? undefined : "true"}
      style={{
        position: "relative",
        display: "grid",
        placeItems: "center",
        boxSizing: "border-box",
        width: "100%",
        // Isi yang lebih tinggi dari kotak memperbesar bentuk, agar teks tidak keluar dari bidangnya.
        minHeight: "100%",
        padding: children ? padding : undefined,
      }}
    >
      {field}
      {children && <div style={{ position: "relative" }}>{children}</div>}
    </div>
  );
}

type BlobProps = OrganicProps & {
  // Jumlah titik kendali 4–7.
  points?: number;
  // Variasi jari-jari 0,10–0,15.
  variation?: number;
  seed?: number;
};

// Blob Flat Design (bagian 7): bentuk tertutup halus dari 4–7 titik kendali dengan jari-jari
// bervariasi. Mengisi kotak induknya; dengan children menjadi kartu teks atau penyangga subjek.
export function Blob({ color: tone, points = 6, variation = 0.12, seed = 0, children }: BlobProps) {
  const n = clamp(Math.round(points), 4, 7);
  const spread = clamp(variation, 0.1, 0.15);
  const turn = seed * 0.7;
  const controls = Array.from({ length: n }, (_, i): Point => {
    const angle = turn + (i / n) * Math.PI * 2;
    const radius = 1 + spread * pick(WOBBLE, seed + i * 3, 0);
    return [Math.cos(angle) * radius, Math.sin(angle) * radius];
  });
  const clip = polygon(normalize(closedCurve(controls, 24)));
  return (
    <ShapedField tone={tone} clip={clip} padding="16% 18%">
      {children}
    </ShapedField>
  );
}

type ScallopProps = OrganicProps & {
  // Jumlah lekuk 10–16.
  lobes?: number;
  // Amplitudo lekuk 0,02–0,03 lebar bentuk.
  amplitude?: number;
  // Dasar lingkaran (penyangga subjek, stiker); tanpa nilai: kartu persegi membulat.
  round?: boolean;
  // Rasio lebar : tinggi kotak, agar lekuk sama besar di sisi panjang dan pendek.
  ratio?: number;
};

// Kartu scallop Flat Design (bagian 7): tepi bergelombang 10–16 lekuk beramplitudo 2–3% lebar.
export function Scallop({
  color: tone,
  lobes = 14,
  amplitude = 0.025,
  round: circle = false,
  ratio = 1,
  children,
}: ScallopProps) {
  const count = clamp(Math.round(lobes), 10, 16);
  // Dasar superelips (eksponen 4) atau lingkaran, setengah tinggi = 1.
  const power = circle ? 2 : 4;
  const base = Array.from({ length: 720 }, (_, i): Point => {
    const t = (i / 720) * Math.PI * 2;
    const [c, s] = [Math.cos(t), Math.sin(t)];
    return [
      Math.sign(c) * Math.abs(c) ** (2 / power) * ratio,
      Math.sign(s) * Math.abs(s) ** (2 / power),
    ];
  });
  // Panjang busur kumulatif agar lekuk berjarak sama di sepanjang tepi.
  const step = (i: number) => {
    const [a, b] = [pick(base, i - 1, ORIGIN), pick(base, i, ORIGIN)];
    return Math.hypot(b[0] - a[0], b[1] - a[1]);
  };
  const lengths: number[] = [];
  base.forEach((_, i) => {
    lengths.push((lengths[i - 1] ?? 0) + (i ? step(i) : 0));
  });
  const total = (lengths.at(-1) ?? 0) + step(0);
  // Amplitudo terhadap lebar bentuk (lebar = 2 × ratio pada satuan ini).
  const wave = clamp(amplitude, 0.02, 0.03) * 2 * ratio;
  const outline = base.map(([x, y], i): Point => {
    const [ax, ay] = pick(base, i - 1, [x, y]);
    const [bx, by] = pick(base, i + 1, [x, y]);
    // Normal keluar dari arah tepi.
    const [tx, ty] = [bx - ax, by - ay];
    const size = Math.hypot(tx, ty) || 1;
    const offset = wave * Math.cos(((lengths[i] ?? 0) / total) * count * Math.PI * 2);
    return [x + (ty / size) * offset, y - (tx / size) * offset];
  });
  const clip = polygon(normalize(outline.filter((_, i) => i % 3 === 0)));
  return (
    <ShapedField tone={tone} clip={clip} padding={circle ? "18%" : "12% 13%"}>
      {children}
    </ShapedField>
  );
}

// --- Panel lengkung ------------------------------------------------------------------------

type CurvedPanelProps = Layer & {
  // Tepi gelombang S satu panjang gelombang selebar kanvas, satu busur, atau garis bertakik chevron.
  edge: "wave" | "arc" | "notch";
  // Letak batas sebagai bagian tinggi kanvas, 0,40–0,65.
  at?: number;
  // Panel mengisi bagian bawah (bawaan) atau atas batas.
  side?: "bottom" | "top";
  // Amplitudo gelombang atau busur 40–100 px.
  amplitude?: number;
  // Dalam takik chevron 48–80 px.
  notch?: number;
  // Membalik fase gelombang, arah busur, atau arah takik.
  flip?: boolean;
};

// PanelLengkung Flat Design (bagian 7): bidang warna seukuran kanvas yang membagi kanvas di
// 40–65% tinggi. Mengisi kotak induknya (lapisan kanvas); nilai di luar rentang panduan dibatasi.
export function CurvedPanel({
  color: tone,
  edge,
  at = 0.5,
  side = "bottom",
  amplitude = 64,
  notch = 64,
  flip = false,
}: CurvedPanelProps) {
  const { width, height } = CANVAS;
  const line = clamp(at, 0.4, 0.65) * height;
  const reach = clamp(amplitude, 40, 100);
  const depth = clamp(notch, 48, 80);
  // Arah "masuk ke panel": ke bawah untuk panel bawah.
  const inward = (side === "bottom" ? 1 : -1) * (flip ? -1 : 1);
  const boundary: Point[] =
    edge === "notch"
      ? [
          [0, line],
          [width / 2 - depth, line],
          [width / 2, line + inward * depth],
          [width / 2 + depth, line],
          [width, line],
        ]
      : Array.from({ length: 49 }, (_, i): Point => {
          const x = (i / 48) * width;
          const y =
            edge === "wave"
              ? line + (flip ? -1 : 1) * reach * Math.sin((x / width) * Math.PI * 2)
              : line - inward * reach * Math.sin((x / width) * Math.PI);
          return [x, y];
        });
  const corners: Point[] =
    side === "bottom"
      ? [
          [width, height],
          [0, height],
        ]
      : [
          [width, 0],
          [0, 0],
        ];
  const points = [...boundary, ...corners].map(
    ([x, y]): Point => [(x / width) * 100, (y / height) * 100],
  );
  return (
    <div
      data-qa-element="shape"
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, background: color(tone), clipPath: polygon(points) }}
    />
  );
}

// --- Cakram dan cincin ---------------------------------------------------------------------

type DiscProps = Layer & {
  // Diameter dalam px kanvas: 540–810 (50–75% lebar kanvas).
  diameter: number;
};

// Cakram Flat Design (bagian 7), pusatnya di belakang subjek; penempatan diatur pemakai.
export function Disc({ color: tone, diameter }: DiscProps) {
  return (
    <div
      data-qa-element="shape"
      aria-hidden="true"
      style={{
        width: `${diameter}px`,
        height: `${diameter}px`,
        borderRadius: "50%",
        background: color(tone),
      }}
    />
  );
}

type RingProps = DiscProps & {
  // Ketebalan sebagai bagian diameter, 0,08–0,12.
  thickness?: number;
};

// Cincin Flat Design (bagian 7): tebal 8–12% diameter, tengahnya tembus.
export function Ring({ color: tone, diameter, thickness = 0.1 }: RingProps) {
  return (
    <div
      data-qa-element="shape"
      aria-hidden="true"
      style={{
        boxSizing: "border-box",
        width: `${diameter}px`,
        height: `${diameter}px`,
        borderRadius: "50%",
        border: `${Math.round(diameter * clamp(thickness, 0.08, 0.12))}px solid ${color(tone)}`,
      }}
    />
  );
}

// --- Starburst dan stiker bulat ------------------------------------------------------------

type BadgeShapeProps = {
  background?: ColorToken;
  color: ColorToken;
  rotate?: number;
  font?: FontRole;
  slot?: string;
};

// Teks 1–3 kata di tengah bentuk; panjang berlebih tertangkap QA overflow (tidak dipotong).
function ShapeLabel({
  tone,
  font,
  size,
  slot,
  children,
}: {
  tone: ColorToken;
  font: FontRole;
  size: string;
  slot?: string | undefined;
  children: string;
}) {
  return (
    <span
      data-slot={slot}
      data-slot-type={slot ? "badge" : undefined}
      style={{
        position: "relative",
        maxWidth: "66%",
        fontFamily: fontFamily(font),
        fontWeight: fontWeight(font, true),
        fontSize: size,
        fontSynthesis: "none",
        lineHeight: 1,
        textAlign: "center",
        textWrap: "balance",
        color: color(tone),
      }}
    >
      {children}
    </span>
  );
}

type StarburstProps = BadgeShapeProps & {
  // Jumlah titik 14–20.
  points?: number;
  // Jari-jari dalam 0,78–0,86.
  inner?: number;
  // Diameter 180–280 px.
  diameter?: number;
  children: string;
};

// Starburst Vintage/Retro (bagian 7): bintang bergerigi isi accent berisi 1–3 kata ≥ 32 px,
// misalnya "Baru!" atau harga. Miring mengikuti sudut postingan lewat `rotate`.
export function Starburst({
  background = "accent",
  color: tone,
  points = 16,
  inner = 0.82,
  diameter = 240,
  rotate = 0,
  font = "heading",
  slot,
  children,
}: StarburstProps) {
  const count = clamp(Math.round(points), 14, 20);
  const depth = clamp(inner, 0.78, 0.86);
  const star = Array.from({ length: count * 2 }, (_, i): Point => {
    const angle = -Math.PI / 2 + (i / (count * 2)) * Math.PI * 2;
    const radius = 50 * (i % 2 ? depth : 1);
    return [50 + Math.cos(angle) * radius, 50 + Math.sin(angle) * radius];
  });
  return (
    <div
      style={{
        position: "relative",
        display: "grid",
        placeItems: "center",
        width: `${clamp(diameter, 180, 280)}px`,
        aspectRatio: "1",
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: color(background),
          clipPath: polygon(star),
        }}
      />
      <ShapeLabel tone={tone} font={font} size={`max(${fontSize(2)}, 32px)`} slot={slot}>
        {children}
      </ShapeLabel>
    </div>
  );
}

type RoundBadgeIcon = "star" | "heart" | "flower";

// Ikon sederhana bergaya cetak (viewBox 24), isi currentColor.
const ICON: Record<Exclude<RoundBadgeIcon, "flower">, string> = {
  star: "M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.6L12 17.5l-5.9 3.2 1.2-6.6-4.8-4.6 6.6-.9z",
  heart:
    "M12 20.8s-7.6-4.5-9.5-9.3C1.2 8.1 3.2 4.6 6.7 4.6c2.2 0 3.7 1.2 5.3 3.1 1.6-1.9 3.1-3.1 5.3-3.1 3.5 0 5.5 3.5 4.2 6.9-1.9 4.8-9.5 9.3-9.5 9.3z",
};

type RoundBadgeProps = BadgeShapeProps & {
  // Diameter 120–200 px.
  diameter?: number;
  // Tebal outline 4–6 px.
  stroke?: number;
  edge?: ColorToken;
  icon?: RoundBadgeIcon;
  size?: FontSizeStep;
  children?: string;
};

// Stiker bulat Vintage/Retro (bagian 7): Ø 120–200 px berisi 1–2 kata atau ikon sederhana,
// outline neutral-dark 4–6 px. Teks dari props (copy); tanpa teks hanya ikon.
export function RoundBadge({
  background = "secondary",
  color: tone,
  edge = "neutral-dark",
  diameter = 160,
  stroke = 5,
  rotate = 0,
  font = "heading",
  icon,
  size = 2,
  slot,
  children,
}: RoundBadgeProps) {
  return (
    <div
      style={{
        position: "relative",
        display: "grid",
        placeItems: "center",
        alignContent: "center",
        gap: "0.15em",
        boxSizing: "border-box",
        width: `${clamp(diameter, 120, 200)}px`,
        aspectRatio: "1",
        borderRadius: "50%",
        border: `${clamp(stroke, 4, 6)}px solid ${color(edge)}`,
        background: color(background),
        color: color(tone),
        transform: rotate ? `rotate(${rotate}deg)` : undefined,
      }}
    >
      {icon && (
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          style={{ display: "block", width: children ? "34%" : "52%", height: "auto" }}
        >
          {icon === "flower" ? (
            <>
              {[0, 1, 2, 3, 4].map((i) => (
                <circle
                  key={i}
                  cx={12 + Math.cos(-Math.PI / 2 + (i * Math.PI * 2) / 5) * 5.6}
                  cy={12 + Math.sin(-Math.PI / 2 + (i * Math.PI * 2) / 5) * 5.6}
                  r={4.4}
                  fill="currentColor"
                />
              ))}
              <circle cx={12} cy={12} r={3} style={{ fill: color(background) }} />
            </>
          ) : (
            <path d={ICON[icon]} fill="currentColor" />
          )}
        </svg>
      )}
      {children && (
        <ShapeLabel tone={tone} font={font} size={fontSize(size)} slot={slot}>
          {children}
        </ShapeLabel>
      )}
    </div>
  );
}

// --- Pelangi -------------------------------------------------------------------------------

type RainbowProps = {
  // 3–5 warna pita, dari terluar ke terdalam.
  colors: ColorToken[];
  // Jari-jari luar (px kanvas).
  radius: number;
  // Lebar pita 28–56 px.
  band?: number;
  // Celah antarpita 0 atau 8 px; celah tembus memperlihatkan bidang kertas di belakangnya.
  gap?: 0 | 8;
  // Tepi kanvas tempat pelangi masuk.
  from?: "bottom" | "top" | "left" | "right";
};

// Pelangi Vintage/Retro (bagian 7): pita lengkung konsentris solid yang masuk dari satu tepi.
// Kotaknya setengah lingkaran (2r × r untuk tepi bawah/atas); letakkan menempel tepi kanvas.
export function Rainbow({ colors, radius, band = 40, gap = 0, from = "bottom" }: RainbowProps) {
  const width = clamp(band, 28, 56);
  const tones = colors.slice(0, 5);
  const across = from === "bottom" || from === "top";
  const viewBox = {
    bottom: [-radius, -radius, radius * 2, radius],
    top: [-radius, 0, radius * 2, radius],
    left: [0, -radius, radius, radius * 2],
    right: [-radius, -radius, radius, radius * 2],
  }[from].join(" ");
  return (
    <svg
      data-qa-element="shape"
      aria-hidden="true"
      viewBox={viewBox}
      style={{
        display: "block",
        width: `${across ? radius * 2 : radius}px`,
        height: `${across ? radius : radius * 2}px`,
      }}
    >
      {tones.map((tone, i) => (
        <circle
          // biome-ignore lint/suspicious/noArrayIndexKey: warna pita boleh berulang, urutan tetap
          key={i}
          r={radius - width / 2 - i * (width + gap)}
          fill="none"
          strokeWidth={width}
          style={{ stroke: color(tone) }}
        />
      ))}
    </svg>
  );
}

// --- Bayangan lantai -----------------------------------------------------------------------

type FloorShadowProps = {
  // Lebar (% kotak induk), 50–70% lebar objek; bawaan 40% kanvas untuk objek 60% di feed-satu-objek.
  width?: number;
  // Jarak dari bawah dan tinggi elips (% kotak induk).
  bottom?: number;
  height?: number;
  // Pergeseran mendatar (% kotak induk) searah cahaya foto; positif ke kanan.
  shift?: number;
  // Latar gelap memakai opasitas lebih tinggi (30–40%); latar terang 12–20%.
  dark?: boolean;
  opacity?: number;
  // Blur 12–20 px.
  blur?: number;
  color?: ColorToken;
};

// Bayangan kontak elips buram di bawah objek cut-out (Minimalism bagian 7). Nilai bawaan sama
// dengan elips di feed-satu-objek. Posisinya absolut di dalam kotak induk.
export function FloorShadow({
  width = 40,
  bottom = 19,
  height = 3,
  shift = 0,
  dark = false,
  opacity,
  blur = 14,
  color: tone = "neutral-dark",
}: FloorShadowProps) {
  const side = (100 - width) / 2;
  return (
    <div
      data-qa-element="decor"
      style={{
        position: "absolute",
        left: `${side + shift}%`,
        right: `${side - shift}%`,
        bottom: `${bottom}%`,
        height: `${height}%`,
        borderRadius: "50%",
        background: color(tone),
        opacity: opacity ?? (dark ? 0.35 : 0.18),
        filter: `blur(${blur}px)`,
      }}
    />
  );
}
