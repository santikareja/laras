import type { CSSProperties } from "react";
import { noiseMask } from "./noise.ts";
import { type ColorToken, color } from "./vars.ts";

// Tekstur dan pola dekoratif gaya (T-132; spesifikasi di PANDUAN.md bagian 7 tiap gaya). Semua
// tanpa data-slot dan tanpa teks; warna hanya dari token atau campuran token. Lapisan mengisi kotak
// induknya (induk perlu `position: relative`), kecuali yang ukurannya dari props.

type Side = "top" | "right" | "bottom" | "left";
type Blend = "soft-light" | "multiply" | "normal";

const FILL: CSSProperties = { position: "absolute", inset: 0, pointerEvents: "none" };

// Campuran token: `amount` (0–1) bagian `tone`, sisanya `into`.
const mix = (tone: ColorToken, amount: number, into: ColorToken | "transparent") =>
  `color-mix(in srgb, ${color(tone)} ${Math.round(amount * 100)}%, ${into === "transparent" ? into : color(into)})`;

// Bilangan semu-acak 0–1 dari bilangan bulat (hash integer): pola sama di setiap render.
function hash(n: number): number {
  let x = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b);
  x ^= x >>> 13;
  x = Math.imul(x, 0xc2b2ae35);
  x ^= x >>> 16;
  return (x >>> 0) / 4294967296;
}

type GrainProps = {
  // neutral-dark di latar terang/menengah, neutral-light di latar gelap.
  tone?: ColorToken;
  // Kekuatan butir sesuai panduan: Retro 0,06–0,12; Cyberpunk 0,04–0,08; Glass 0,02–0,04.
  opacity?: number;
  // soft-light di atas warna atau foto, multiply di atas kertas terang.
  blend?: Blend;
  // Bagian piksel yang menjadi butir (0–1).
  density?: number;
};

// Soft-light dengan token pekat hanya menggeser nada menengah ±1/3 dari mode normal; lapisannya
// dipertebal agar `opacity` yang sama terlihat setara di ketiga mode.
const SOFT_LIGHT_GAIN = 3;

// Butir film monokrom satu token (Retro, Cyberpunk, Glass; PANDUAN bagian 7). Di bawah teks body.
export function Grain({
  tone = "neutral-dark",
  opacity = 0.08,
  blend = "soft-light",
  density = 0.5,
}: GrainProps) {
  return (
    <div
      aria-hidden="true"
      style={{
        ...FILL,
        background: color(tone),
        opacity: blend === "soft-light" ? Math.min(opacity * SOFT_LIGHT_GAIN, 1) : opacity,
        mixBlendMode: blend,
        maskImage: noiseMask({ frequency: 0.8, coverage: density }),
      }}
    />
  );
}

type PaperTextureProps = {
  tone?: ColorToken;
  // Opasitas total 0,06–0,12.
  opacity?: number;
};

// Kertas kusam (Brutalisme `TeksturKertas`, PANDUAN bagian 7): butir halus, serat memanjang, dan
// bercak lebar yang sangat samar, dicetak multiply.
export function PaperTexture({ tone = "neutral-dark", opacity = 0.1 }: PaperTextureProps) {
  const layer = (key: string, style: CSSProperties) => (
    <div key={key} style={{ ...FILL, background: color(tone), ...style }} />
  );
  return (
    <div
      aria-hidden="true"
      style={{ ...FILL, opacity, mixBlendMode: "multiply", isolation: "isolate" }}
    >
      {layer("bercak", {
        opacity: 0.12,
        maskImage: noiseMask({ frequency: 0.025, octaves: 3, coverage: 0.35, seed: 19, tile: 720 }),
      })}
      {/* Serat: noise direntangkan mendatar (3 : 1) agar butirnya memanjang. */}
      {layer("serat", {
        opacity: 0.7,
        maskImage: noiseMask({ frequency: 0.35, octaves: 3, coverage: 0.05, seed: 5 }),
        maskSize: "720px 240px",
      })}
      {layer("butir", {
        opacity: 0.6,
        maskImage: noiseMask({ frequency: 0.85, coverage: 0.3, seed: 11 }),
      })}
    </div>
  );
}

type ScanlineProps = {
  tone?: ColorToken;
  // 0,20–0,35.
  opacity?: number;
  // Jarak antargaris 6–8 px; garis 2 px.
  pitch?: number;
};

// Garis pindai horizontal bertepi tajam (Cyberpunk, PANDUAN bagian 7). Hanya di atas foto.
export function Scanline({ tone = "neutral-dark", opacity = 0.28, pitch = 6 }: ScanlineProps) {
  return (
    <div
      aria-hidden="true"
      style={{
        ...FILL,
        opacity,
        backgroundImage: `repeating-linear-gradient(to bottom, ${color(tone)} 0 2px, transparent 2px ${pitch}px)`,
      }}
    />
  );
}

type HalftonePatternProps = {
  tone: ColorToken;
  // Sel 12–20 px.
  cell?: number;
  // Diameter titik 0,35–0,6 sel.
  dot?: number;
  // Titik mengecil sampai hilang ke arah ini. Termasuk gradasi visual: jangan dipakai pada brand
  // yang melarang gradient (Retro bagian 6).
  fade?: Side;
};

// Dua lapis titik yang diimbangi setengah sel sehingga tersusun diagonal.
const lattice = (cell: number) => ({
  size: `${cell}px ${cell}px`,
  position: `0 0, ${cell / 2}px ${cell / 2}px`,
});

// Kecuraman ambang alpha: transisi tepi titik ±0,3 px (titik besar) sampai ±1 px (titik kecil).
const EDGE = 20;

// Halftone dekoratif untuk satu bidang (Retro, PANDUAN bagian 7), bukan foto. Maks 25% kanvas,
// tidak di belakang teks body.
export function HalftonePattern({ tone, cell = 16, dot = 0.5, fade }: HalftonePatternProps) {
  const { size, position } = lattice(cell);
  const r = (cell * Math.min(dot, 0.65)) / 2;
  if (!fade) {
    // Tepi titik diberi transisi 1 px agar tidak bergerigi.
    const disc = `radial-gradient(circle, ${color(tone)} ${r - 0.5}px, transparent ${r + 0.5}px)`;
    return (
      <div
        aria-hidden="true"
        style={{
          ...FILL,
          backgroundImage: `${disc}, ${disc}`,
          backgroundSize: size,
          backgroundPosition: position,
        }}
      />
    );
  }
  // Gradasi ukuran: kerucut alpha per titik (jari-jari setengah jarak titik diagonal, jadi tidak
  // bertumpuk) dikalikan gradien linear, lalu diambangkan filter SVG. Titik mengecil mulus tanpa
  // titik terpotong, berapa pun ukuran kotak induk. Warna mask tidak dipakai, hanya alpha.
  const reach = (cell * Math.SQRT1_2) / 2;
  const threshold = 1 - r / reach;
  const ink = color("neutral-dark");
  const cone = `radial-gradient(circle ${reach}px, ${ink}, transparent)`;
  // Alpha gradien g agar jari-jari titik R(1 − threshold/g) turun linear sepanjang kotak.
  const stops = [0, 0.25, 0.5, 0.75, 1].map((y) => {
    const g = threshold / (1 - (1 - threshold) * (1 - y));
    return `${mix("neutral-dark", g, "transparent")} ${y * 100}%`;
  });
  const id = `laras-halftone-${Math.round(threshold * 1000)}`;
  return (
    <div aria-hidden="true" style={{ ...FILL, filter: `url(#${id})` }}>
      <svg aria-hidden="true" width="0" height="0" style={{ position: "absolute" }}>
        <filter id={id} colorInterpolationFilters="sRGB">
          <feComponentTransfer>
            <feFuncA type="linear" slope={EDGE} intercept={0.5 - threshold * EDGE} />
          </feComponentTransfer>
        </filter>
      </svg>
      <div
        style={{
          ...FILL,
          background: color(tone),
          maskImage: `linear-gradient(to ${fade}, ${stops.join(", ")}), ${cone}, ${cone}`,
          maskSize: `100% 100%, ${size}, ${size}`,
          maskPosition: `0 0, ${position}`,
          maskRepeat: "no-repeat, repeat, repeat",
          maskComposite: "intersect, add, add",
        }}
      />
    </div>
  );
}

type PixelScatterProps =
  | {
      mode: "scatter";
      tone?: ColorToken;
      // Warna kotak berongga.
      line?: ColorToken;
      // Sisi rapat (menempel ke subjek); makin jauh makin jarang.
      side?: Side;
      // 12–40 kotak.
      count?: number;
      seed?: number;
    }
  | {
      mode: "grid";
      tone?: ColorToken;
      side?: Side;
      // Sel 32–48 px; ukuran komponen = cols × rows sel.
      cell?: number;
      cols?: number;
      rows?: number;
      seed?: number;
    };

// Piksel lepas (Cyberpunk, PANDUAN bagian 7). `scatter` mengisi pita induk (≤ 25% lebar kanvas di
// satu sisi subjek); `grid` berukuran dari props (≤ 20% kanvas). Tidak menimpa kotak teks.
export function PixelScatter(props: PixelScatterProps) {
  return props.mode === "grid" ? <PixelGrid {...props} /> : <PixelDots {...props} />;
}

// Slot pita: ALONG menjauhi sisi rapat, ACROSS sepanjang sisi itu.
const ALONG = 8;
const ACROSS = 12;
const UNIT = ["var(--space-1)", "var(--space-2)", "var(--space-3)"] as const;

// Posisi dibulatkan ke kelipatan unit spacing agar semua kotak duduk di satu grid piksel.
const snap = (fraction: number) => `round(down, ${(fraction * 100).toFixed(2)}%, var(--space-1))`;

function PixelDots({
  tone = "accent",
  line = "neutral-light",
  side = "left",
  count = 24,
  seed = 1,
}: Omit<Extract<PixelScatterProps, { mode: "scatter" }>, "mode">) {
  const base = seed * 7919;
  // Sampel berbobot tanpa pengembalian: slot dekat sisi rapat lebih sering terpilih.
  const slots = Array.from({ length: ALONG * ACROSS }, (_, i) => {
    const t = (i % ALONG) / (ALONG - 1);
    const weight = (1 - t) ** 2 + 0.03;
    return { i, key: hash(base + i) ** (1 / weight) };
  })
    .sort((a, b) => b.key - a.key)
    .slice(0, Math.min(count, ALONG * ACROSS));
  return (
    <div aria-hidden="true" style={FILL}>
      {slots.map(({ i }) => {
        const a = i % ALONG;
        const c = Math.floor(i / ALONG);
        const t = a / (ALONG - 1);
        const size = UNIT[Math.min(Math.floor(hash(base + 3 * i + 1) * (3 - 1.5 * t)), 2)];
        const kind = hash(base + 3 * i + 2);
        const along = snap((a + 0.3 * hash(base + 5 * i + 3)) / (ALONG + 0.5));
        const across = snap((c + 0.6 * hash(base + 5 * i + 4)) / (ACROSS + 0.5));
        const vertical = side === "top" || side === "bottom";
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              [side]: along,
              [vertical ? "left" : "top"]: across,
              width: size,
              height: size,
              boxSizing: "border-box",
              background:
                kind < 0.5 ? color(tone) : kind < 0.8 ? mix(tone, 0.4, "transparent") : undefined,
              border: kind >= 0.8 ? `2px solid ${color(line)}` : undefined,
            }}
          />
        );
      })}
    </div>
  );
}

function PixelGrid({
  tone = "accent",
  side = "left",
  cell = 40,
  cols = 6,
  rows = 8,
  seed = 1,
}: Omit<Extract<PixelScatterProps, { mode: "grid" }>, "mode">) {
  const vertical = side === "top" || side === "bottom";
  const [alongCount, acrossCount] = vertical ? [rows, cols] : [cols, rows];
  // Menipis dengan membuang sel: penuh di 40% dekat sisi rapat, lalu makin jarang; ujung jajaran
  // juga dikurangi agar tepi tidak kaku.
  const keep = (col: number, row: number) => {
    const a = { left: col, right: cols - 1 - col, top: row, bottom: rows - 1 - row }[side];
    const c = vertical ? col : row;
    const t = a / Math.max(alongCount - 1, 1);
    let p = t <= 0.4 ? 1 : 1 - ((t - 0.4) / 0.6) * 0.85;
    if (c === 0 || c === acrossCount - 1) p *= 0.6;
    return hash(seed * 7919 + row * cols + col) < p;
  };
  // Garis sel unik agar garis bersama tidak tertimpa dua kali.
  const edges = new Set<string>();
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (!keep(col, row)) continue;
      const x = col * cell;
      const y = row * cell;
      edges.add(`M${x} ${y}h${cell}`);
      edges.add(`M${x} ${y + cell}h${cell}`);
      edges.add(`M${x} ${y}v${cell}`);
      edges.add(`M${x + cell} ${y}v${cell}`);
    }
  }
  return (
    <svg
      aria-hidden="true"
      width={cols * cell}
      height={rows * cell}
      viewBox={`0 0 ${cols * cell} ${rows * cell}`}
      style={{ display: "block", overflow: "visible", color: color(tone) }}
    >
      <path
        d={[...edges].join("")}
        fill="none"
        stroke="currentColor"
        strokeOpacity={0.32}
        strokeWidth={2}
        shapeRendering="crispEdges"
      />
    </svg>
  );
}

type DotGridProps = {
  tone?: ColorToken;
  // Bagian `tone` dalam campuran dengan neutral-light (1 = token murni).
  tint?: number;
  cols?: number;
  rows?: number;
  // Diameter titik dan jarak antarpusat, px.
  dot?: number;
  pitch?: number;
};

// Pola titik di satu sudut kosong (Corporate, PANDUAN bagian 7): 4 × 6 titik 6 px, jarak 24 px.
// Ukuran dari props; tidak dipakai bersama Swoosh.
export function DotGrid({
  tone = "primary",
  tint = 0.45,
  cols = 4,
  rows = 6,
  dot = 6,
  pitch = 24,
}: DotGridProps) {
  const width = (cols - 1) * pitch + dot;
  const height = (rows - 1) * pitch + dot;
  const r = dot / 2;
  // Semua titik dalam satu path: lingkaran = dua busur setengah.
  const d = Array.from({ length: rows * cols }, (_, i) => {
    const x = (i % cols) * pitch;
    const y = Math.floor(i / cols) * pitch + r;
    return `M${x} ${y}a${r} ${r} 0 1 0 ${dot} 0a${r} ${r} 0 1 0 ${-dot} 0`;
  }).join("");
  return (
    <svg
      aria-hidden="true"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      style={{ display: "block", color: mix(tone, tint, "neutral-light") }}
    >
      <path d={d} fill="currentColor" />
    </svg>
  );
}

type SunburstProps = {
  tone: ColorToken;
  // Warna sela sinar: token kedua yang berdekatan; tanpa nilai berarti `tone` yang dipudarkan.
  alt?: ColorToken;
  // Bagian neutral-light pada versi pudar (0–1).
  fade?: number;
  // 16–24 sinar.
  rays?: number;
  // Pusat sinar dalam persen kotak induk; boleh di luar 0–100.
  x?: number;
  y?: number;
  rotate?: number;
};

// Sinar dari satu titik (Retro, PANDUAN bagian 7): irisan solid bertepi tajam, maks 1 per
// postingan; teks hanya di panel solid di atasnya.
export function Sunburst({
  tone,
  alt,
  fade = 0.25,
  rays = 20,
  x = 50,
  y = 50,
  rotate = 0,
}: SunburstProps) {
  const step = 360 / rays;
  const half = step / 2;
  const between = alt ? color(alt) : mix(tone, 1 - fade, "neutral-light");
  // Transisi 0,1° (±1 px pada jarak 600 px) hanya untuk meredam tepi bergerigi.
  const soft = 0.1;
  return (
    <div
      aria-hidden="true"
      style={{
        ...FILL,
        background: `repeating-conic-gradient(from ${rotate}deg at ${x}% ${y}%, ${color(tone)} 0deg ${half - soft}deg, ${between} ${half}deg ${step - soft}deg, ${color(tone)} ${step}deg)`,
      }}
    />
  );
}

type CheckerProps = {
  tone: ColorToken;
  alt: ColorToken;
  // Sel 48–80 px; bawaan 60 membagi rata lebar kanvas 1080 (18 sel).
  cell?: number;
  // Pita 1–2 baris selebar induk; tanpa nilai berarti bidang yang mengisi induk.
  rows?: 1 | 2;
};

// Kotak-kotak dua token (Retro `groovy`, PANDUAN bagian 7): pita di tepi atas/bawah atau bidang,
// maks 15% kanvas. Sel terpotong dibagi rata di kedua ujung.
export function Checker({ tone, alt, cell = 60, rows }: CheckerProps) {
  const pattern: CSSProperties = {
    backgroundImage: `conic-gradient(${color(tone)} 25%, ${color(alt)} 0 50%, ${color(tone)} 0 75%, ${color(alt)} 0)`,
    backgroundSize: `${cell * 2}px ${cell * 2}px`,
    backgroundPosition: "center top",
  };
  if (!rows) return <div aria-hidden="true" style={{ ...FILL, ...pattern }} />;
  return (
    <div
      aria-hidden="true"
      style={{ display: "block", width: "100%", height: rows * cell, ...pattern }}
    />
  );
}
