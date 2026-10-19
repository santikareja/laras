// Pola noise deterministik untuk tekstur (grain, kertas, tinta aus, fotokopi): SVG feTurbulence
// dengan seed tetap sebagai data URI, dipakai sebagai mask di atas bidang warna token. Tanpa nilai
// warna; warnanya selalu dari token di elemen yang dimask.

type NoiseOptions = {
  // Kerapatan butir: ~0,9 untuk grain halus, ~0,02 untuk bercak kertas.
  frequency: number;
  octaves?: number;
  seed?: number;
  // Bagian piksel yang terlihat (0–1); noise diambangkan agar butir bertepi tajam.
  coverage: number;
  // Ukuran ubin dalam px kanvas.
  tile?: number;
};

const STRETCH = 4;

export function noiseMask({
  frequency,
  octaves = 2,
  seed = 7,
  coverage,
  tile = 360,
}: NoiseOptions): string {
  const steps = 50;
  const visible = Math.round(Math.min(Math.max(coverage, 0), 1) * steps);
  const table = Array.from({ length: steps }, (_, i) => (i >= steps - visible ? 1 : 0)).join(" ");
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='${tile}' height='${tile}'>` +
    `<filter id='n' x='0' y='0' width='100%' height='100%'>` +
    `<feTurbulence type='fractalNoise' baseFrequency='${frequency}' numOctaves='${octaves}' seed='${seed}' stitchTiles='stitch'/>` +
    `<feColorMatrix type='luminanceToAlpha'/>` +
    // Noise fractal mengumpul di sekitar 0,5: direntangkan dulu agar ambang mendekati `coverage`.
    `<feComponentTransfer><feFuncA type='linear' slope='${STRETCH}' intercept='${(1 - STRETCH) / 2}'/></feComponentTransfer>` +
    `<feComponentTransfer><feFuncA type='discrete' tableValues='${table}'/></feComponentTransfer>` +
    `</filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
