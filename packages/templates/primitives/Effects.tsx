import type { CSSProperties, ReactElement, ReactNode } from "react";
import { noiseMask } from "./noise.ts";
import { type ColorToken, color } from "./vars.ts";

// Efek teks dan cahaya (T-132): glow neon dan glitch (Cyberpunk bagian 6–7), tinta aus
// (Brutalisme), registrasi meleset dan huruf retro (Vintage/Retro bagian 5 dan 7). Efek teks
// dipakai lewat opsi `effect` di Display dan Text. Salinan dekoratif memakai markup teks yang
// sama (data-fit ikut dipaskan renderer ke ukuran yang sama), aria-hidden, tanpa data-slot,
// dan pointer-events: none sehingga QA kontras hanya mengukur teks asli.

export type GlowMode = "soft" | "solid";

export type TextEffect =
  // Neon: soft = text-shadow dua lapis; solid = garis kedua tanpa blur (brand tanpa gradient).
  // Hanya teks ≥ 60 px.
  | { kind: "glow"; color: ColorToken; mode?: GlowMode }
  // Glitch satu kata display ≥ 84 px: iris geser, pemisahan kanal (latar gelap), atau gema.
  | { kind: "glitch"; mode: "slice"; bands?: 1 | 2 }
  | { kind: "glitch"; mode: "split"; colors: [ColorToken, ColorToken] }
  | { kind: "glitch"; mode: "echo"; color: ColorToken }
  // Tinta aus: bintik menghapus ≤ 12% luas huruf (light ±8%, medium ±9%, heavy ±11%). Hanya
  // Display ≥ 120 px.
  | { kind: "ink-wear"; wear?: keyof typeof WEAR; seed?: number }
  // Salinan token kedua digeser ke kanan bawah dengan multiply; headline ≥ 84 px.
  | { kind: "misregister"; color: ColorToken }
  // Outline dan bayangan offset keras tanpa blur (groovy); headline ≥ 84 px.
  | { kind: "retro"; outline: ColorToken; shadow: ColorToken };

// Satu lapisan teks yang dirender ulang Display atau Text: teks asli (copy false) atau salinan
// dekoratif. `style` dipasang di elemen teks yang dipaskan (per baris pada Display bertumpuk).
export type TextLayer = { copy: boolean; color?: ColorToken; style?: CSSProperties };

type CopyLayer = TextLayer & { blend?: "screen" | "multiply" };

// Cakupan noiseMask per tingkat aus. Diukur di tiga brand fixture (Display "AUS", frekuensi
// 0,06): luas huruf yang terhapus 6,9–8,7%, 8,1–10,1%, dan 9,5–11,6%.
const WEAR = { light: 0.02, medium: 0.04, heavy: 0.08 } as const;

type Plan = { original: TextLayer; behind?: CopyLayer[]; above?: CopyLayer[]; defs?: ReactElement };

const fade = (tone: ColorToken, percent: number) =>
  `color-mix(in srgb, ${color(tone)} ${percent}%, transparent)`;

// Glyph meluber di atas dan bawah kotak baris (line-height 0,9); clip dan filter diperluas.
const OVER = { x: -10, y: -50 };

// Pita iris glitch dalam persen tinggi kotak baris, sekitar 15–35% tinggi huruf kapital. Tengah
// baris tidak diiris agar titik ukur kontras QA tetap mengenai teks asli.
const SLICES = [
  { top: 24, bottom: 39, shift: "max(0.07em, 4px)" },
  { top: 59, bottom: 74, shift: "min(-0.05em, -4px)" },
];

const band = (top: number, bottom: number) =>
  `polygon(${OVER.x}% ${top}%, ${100 - OVER.x}% ${top}%, ${100 - OVER.x}% ${bottom}%, ${OVER.x}% ${bottom}%)`;

// Teks asli tanpa pita: satu poligon dengan celah (tepi kiri dilalui bolak-balik). Celah 0,5 px
// lebih sempit dari pita agar tepi antialias keduanya tidak meninggalkan garis tipis.
function withoutBands(bands: typeof SLICES): string {
  const [l, r] = [`${OVER.x}%`, `${100 - OVER.x}%`];
  const cuts = bands.flatMap(({ top, bottom }) => {
    const [upper, lower] = [`calc(${top}% + 0.5px)`, `calc(${bottom}% - 0.5px)`];
    return [`${r} ${upper}`, `${l} ${upper}`, `${l} ${lower}`, `${r} ${lower}`];
  });
  return `polygon(${l} ${OVER.y}%, ${r} ${OVER.y}%, ${cuts.join(", ")}, ${r} ${100 - OVER.y}%, ${l} ${100 - OVER.y}%)`;
}

// Glow padat: garis kedua sejajar 6 px di luar tepi, tebal 3 px, opasitas 40% (bagian 7).
const RING = { gap: 6, width: 3, opacity: 0.4 };
const ringId = (tone: ColorToken) => `laras-glow-padat-${tone}`;

// Kontur pada jarak d di luar tepi dari alpha yang diburamkan (σ = 5 px): di tepi lurus alpha
// buram pada jarak d bernilai Φ(−d/σ), yaitu Φ(−9/5) = 0,0359 untuk tepi luar garis dan
// Φ(−6/5) = 0,1151 untuk tepi dalam. Ambang berkemiringan tajam menghasilkan kontur membulat
// (dilasi feMorphology bersudut kotak). Hitung ulang kedua nilai bila RING diubah.
const SIGMA = 5;
const SLOPE = 60;
const LEVEL = { outer: 0.0359, inner: 0.1151 };
const intercept = (level: number) => Math.round((0.5 - SLOPE * level) * 1e4) / 1e4;

// Filter SVG garis kedua: kontur (gap + tebal) dikurangi kontur gap, diwarnai token.
// Definisi dengan id yang sama boleh berulang di dokumen (isinya identik).
function RingFilter({ tone }: { tone: ColorToken }) {
  return (
    <svg aria-hidden="true" width="0" height="0" style={{ position: "absolute" }}>
      <filter
        id={ringId(tone)}
        x="-20%"
        y={`${OVER.y}%`}
        width="140%"
        height={`${100 - 2 * OVER.y}%`}
        colorInterpolationFilters="sRGB"
      >
        <feGaussianBlur in="SourceAlpha" stdDeviation={SIGMA} result="buram" />
        <feComponentTransfer in="buram" result="luar">
          <feFuncA type="linear" slope={SLOPE} intercept={intercept(LEVEL.outer)} />
        </feComponentTransfer>
        <feComponentTransfer in="buram" result="dalam">
          <feFuncA type="linear" slope={SLOPE} intercept={intercept(LEVEL.inner)} />
        </feComponentTransfer>
        <feComposite in="luar" in2="dalam" operator="out" result="cincin" />
        <feFlood style={{ floodColor: color(tone), floodOpacity: RING.opacity }} />
        <feComposite in2="cincin" operator="in" result="garis" />
        <feMerge>
          <feMergeNode in="garis" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </svg>
  );
}

function planOf(effect: TextEffect): Plan {
  switch (effect.kind) {
    case "glow":
      return effect.mode === "solid"
        ? {
            original: { copy: false, style: { filter: `url(#${ringId(effect.color)})` } },
            defs: <RingFilter tone={effect.color} />,
          }
        : {
            original: {
              copy: false,
              style: {
                textShadow: `0 0 0.04em ${fade(effect.color, 80)}, 0 0 0.15em ${fade(effect.color, 40)}`,
              },
            },
          };
    case "glitch": {
      if (effect.mode === "split")
        return {
          original: { copy: false },
          behind: effect.colors.map((tone, i) => ({
            copy: true,
            color: tone,
            blend: "screen",
            style: { transform: `translateX(${i ? 0.03 : -0.03}em)` },
          })),
        };
      if (effect.mode === "echo")
        return {
          original: { copy: false },
          behind: [
            { copy: true, color: effect.color, style: { transform: "translate(0.06em, 0.06em)" } },
          ],
        };
      const bands = SLICES.slice(0, effect.bands ?? 1);
      return {
        original: { copy: false, style: { clipPath: withoutBands(bands) } },
        above: bands.map(({ top, bottom, shift }) => ({
          copy: true,
          style: { clipPath: band(top, bottom), transform: `translateX(${shift})` },
        })),
      };
    }
    case "ink-wear": {
      // Lapisan penuh dikurangi bintik noise (mask-composite exclude): huruf tampil kecuali bintik.
      const solid = `linear-gradient(${color("neutral-dark")}, ${color("neutral-dark")})`;
      const specks = noiseMask({
        frequency: 0.06,
        octaves: 3,
        seed: effect.seed ?? 11,
        coverage: WEAR[effect.wear ?? "light"],
        tile: 480,
      });
      return {
        original: {
          copy: false,
          style: {
            maskImage: `${solid}, ${specks}`,
            maskComposite: "exclude",
            maskClip: "no-clip",
          },
        },
      };
    }
    case "misregister":
      return {
        original: { copy: false },
        above: [
          {
            copy: true,
            color: effect.color,
            blend: "multiply",
            style: { transform: "translate(4px, 4px)" },
          },
        ],
      };
    case "retro": {
      // Outline 5% ukuran huruf di luar glyph (stroke 0,1 em, isi di atasnya); bayangan 7%.
      const outline = {
        WebkitTextStroke: `0.1em ${color(effect.outline)}`,
        paintOrder: "stroke fill",
      } satisfies CSSProperties;
      return {
        original: { copy: false, style: outline },
        behind: [
          {
            copy: true,
            color: effect.shadow,
            style: { ...outline, transform: "translate(0.07em, 0.07em)" },
          },
        ],
      };
    }
  }
}

type TextEffectFrameProps = {
  effect: TextEffect;
  // Gaya kotak pembungkus agar ukurannya sama dengan elemen teks aslinya (mis. lebar penuh).
  frame?: CSSProperties;
  render: (layer: TextLayer) => ReactElement;
};

// Pembungkus efek teks: salinan di belakang, teks asli, lalu salinan di depan. Urutan lukis
// mengikuti urutan dokumen (semuanya berposisi), sehingga mode campur salinan mengenai latar.
export function TextEffectFrame({ effect, frame, render }: TextEffectFrameProps) {
  const { original, behind = [], above = [], defs } = planOf(effect);
  if (behind.length === 0 && above.length === 0)
    return (
      <>
        {defs}
        {render(original)}
      </>
    );
  const copy = (layer: CopyLayer, key: string) => (
    <div
      key={key}
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, pointerEvents: "none", mixBlendMode: layer.blend }}
    >
      {render(layer)}
    </div>
  );
  return (
    <div style={{ position: "relative", ...frame }}>
      {behind.map((layer, i) => copy(layer, `belakang-${i}`))}
      <div style={{ position: "relative" }}>{render(original)}</div>
      {above.map((layer, i) => copy(layer, `depan-${i}`))}
    </div>
  );
}

type GlowProps = {
  color: ColorToken;
  mode?: GlowMode;
  children: ReactNode;
};

// Halo neon di sekitar subjek cut-out atau bentuk (Cyberpunk bagian 7), mengikuti alpha isinya:
// soft = drop-shadow blur 28 px opasitas 60%; solid = garis kedua tanpa blur. Mengisi kotak induk.
// Untuk teks pakai opsi `effect` glow di Display atau Text (ukuran glow relatif huruf).
export function Glow({ color: tone, mode = "soft", children }: GlowProps) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        filter:
          mode === "soft" ? `drop-shadow(0 0 28px ${fade(tone, 60)})` : `url(#${ringId(tone)})`,
      }}
    >
      {mode === "solid" && <RingFilter tone={tone} />}
      {children}
    </div>
  );
}

type NeonRailProps = {
  color: ColorToken;
  mode?: GlowMode;
  // Tebal garis 2–6 px.
  thickness?: number;
  // Panjang 40–100% lebar kotak induk.
  length?: number;
};

// Rel neon (bagian dari Glow, Cyberpunk bagian 7): garis mendatar token jenuh dengan glow, untuk
// panggung produk, pemisah, dan kesinambungan carousel. Mode solid: garis sejajar 6 px di kedua sisi.
export function NeonRail({
  color: tone,
  mode = "soft",
  thickness = 4,
  length = 100,
}: NeonRailProps) {
  const line = Math.min(Math.max(thickness, 2), 6);
  const apart = line + RING.gap;
  return (
    <div
      aria-hidden="true"
      style={{
        width: `${Math.min(Math.max(length, 40), 100)}%`,
        height: `${line}px`,
        background: color(tone),
        boxShadow:
          mode === "soft"
            ? `0 0 12px ${fade(tone, 60)}`
            : `0 -${apart}px 0 ${fade(tone, 40)}, 0 ${apart}px 0 ${fade(tone, 40)}`,
      }}
    />
  );
}
