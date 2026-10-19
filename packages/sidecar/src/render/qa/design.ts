import type { BrandKit, DesignLimits, RenderCheck, RenderRule } from "@laras/shared";
import type { PixelStats } from "./pixels.ts";
import type { Rect } from "./rules.ts";

// Aturan desain terukur PRD 4 (T-130) sebagai fungsi murni atas data DESIGN_SCRIPT dan statistik
// piksel. Semua bertingkat saran sampai terkalibrasi (keputusan pemilik): dilaporkan, tidak
// menggagalkan render.

export type DesignText = {
  slot: string;
  size: number;
  role: "display" | "heading" | "body";
  rect: Rect;
  lines: string[];
};

export type DesignMeasurements = {
  canvas: { width: number; height: number };
  // Blok untuk perataan dan jarak tepi: grup dan slot teks, badge, logo yang berdiri sendiri.
  blocks: { name: string; rect: Rect }[];
  texts: DesignText[];
  focus: { x: number; y: number } | null;
  elements: { kind: string; name: string }[];
  photoBackground: boolean;
  // Radius bidang yang terlihat (-1 = pil) dan sudut rotasi elemen.
  radii: number[];
  angles: number[];
  excluded: Rect[];
};

export const DESIGN_RULES = [
  "alignment",
  "hierarchy",
  "typography",
  "thirds",
  "color-balance",
  "whitespace",
  "element-count",
  "consistency",
] as const satisfies readonly RenderRule[];

const PASSED: Record<(typeof DESIGN_RULES)[number], string> = {
  alignment: "Perataan memakai sumbu yang terbatas (P1)",
  hierarchy: "Hierarki ukuran huruf jelas (P2)",
  typography: "Baris teks tanpa yatim dan panjang baris wajar (P4)",
  thirds: "Titik fokus di titik potong grid 3×3 (P8)",
  "color-balance": "Proporsi warna 60-30-10 terpenuhi (P9)",
  whitespace: "Ruang kosong cukup (P10)",
  "element-count": "Jumlah elemen dalam batas (P10)",
  consistency: "Jarak tepi, radius, dan kemiringan konsisten (P11)",
};

const AXIS_TOLERANCE = 10;
// Tepi tinta huruf dan kotak elemen miring membuat jarak tepi yang sama berselisih beberapa px.
const EDGE_TOLERANCE = 12;
const BLEED = 8;
const SIZE_TOLERANCE = 2;
const PUNCTUATION = /^[.,;:!?)\]»”’%]/;

const percent = (value: number) => `${Math.round(value * 100)}%`;

function saran(
  rule: RenderRule,
  target: string,
  message: string,
  extra: Partial<RenderCheck> = {},
): RenderCheck {
  return { rule, passed: false, target, message, severity: "saran", ...extra };
}

// Kelompok nilai yang berdekatan (selisih ≤ toleransi) dihitung satu.
function clusters(values: number[], tolerance: number): number[] {
  const sorted = [...values].sort((a, b) => a - b);
  const out: number[] = [];
  for (const value of sorted) {
    const last = out[out.length - 1];
    if (last === undefined || value - last > tolerance) out.push(value);
  }
  return out;
}

// P1: jumlah sumbu perataan terkecil yang cukup untuk semua blok (tepi kiri, tengah, atau kanan
// setiap blok menempel ke salah satu sumbu).
export function alignmentAxes(blocks: { rect: Rect }[]): number {
  if (blocks.length === 0) return 0;
  const options = blocks.map(({ rect }) => [rect.left, (rect.left + rect.right) / 2, rect.right]);
  const candidates = clusters(options.flat(), 1);
  const covers = (axes: number[]) =>
    options.every((choices) =>
      choices.some((value) => axes.some((axis) => Math.abs(axis - value) <= AXIS_TOLERANCE)),
    );
  const choose = (k: number, start: number, picked: number[]): boolean => {
    if (picked.length === k) return covers(picked);
    for (let i = start; i < candidates.length; i++) {
      if (choose(k, i + 1, [...picked, candidates[i] ?? 0])) return true;
    }
    return false;
  };
  for (let k = 1; k <= Math.min(blocks.length, 4); k++) if (choose(k, 0, [])) return k;
  return Math.min(blocks.length, 5);
}

function alignmentChecks(d: DesignMeasurements, limits: DesignLimits): RenderCheck[] {
  const axes = alignmentAxes(d.blocks);
  if (axes <= limits.axes) return [];
  return [
    saran("alignment", "slide", `${axes} sumbu perataan, maksimal ${limits.axes}`, {
      measured: axes,
      threshold: limits.axes,
    }),
  ];
}

function hierarchyChecks(d: DesignMeasurements, limits: DesignLimits): RenderCheck[] {
  const sizes = d.texts.map((t) => t.size);
  if (sizes.length === 0) return [];
  const distinct = clusters(sizes, SIZE_TOLERANCE);
  const out: RenderCheck[] = [];
  if (distinct.length > limits.fontSizes) {
    out.push(
      saran("hierarchy", "slide", `${distinct.length} ukuran huruf, maksimal ${limits.fontSizes}`, {
        measured: distinct.length,
        threshold: limits.fontSizes,
      }),
    );
  }
  const largest = distinct[distinct.length - 1] ?? 0;
  const smallest = distinct[0] ?? 0;
  const second = distinct[distinct.length - 2];
  const ratio = smallest > 0 ? largest / smallest : 0;
  if (distinct.length > 1 && ratio < limits.headlineRatio) {
    out.push(
      saran(
        "hierarchy",
        "slide",
        `Teks terbesar ${ratio.toFixed(2)}× teks terkecil, minimal ${limits.headlineRatio}×`,
        { measured: Number(ratio.toFixed(2)), threshold: limits.headlineRatio },
      ),
    );
  }
  if (second !== undefined && second > largest * limits.secondaryRatio) {
    out.push(
      saran(
        "hierarchy",
        "slide",
        `Ukuran kedua ${Math.round(second)} px lebih dari ${percent(limits.secondaryRatio)} ukuran dominan ${Math.round(largest)} px`,
        { measured: Number((second / largest).toFixed(2)), threshold: limits.secondaryRatio },
      ),
    );
  }
  return out;
}

function typographyChecks(d: DesignMeasurements, limits: DesignLimits): RenderCheck[] {
  return d.texts.flatMap((text) => {
    if (text.role === "display" || text.lines.length < 2) return [];
    const out: RenderCheck[] = [];
    const last = text.lines[text.lines.length - 1] ?? "";
    if (last.split(" ").filter(Boolean).length < 2) {
      out.push(saran("typography", text.slot, `Baris yatim: "${last}" sendirian di baris akhir`));
    }
    for (const line of text.lines.slice(1)) {
      if (PUNCTUATION.test(line)) {
        out.push(saran("typography", text.slot, `Tanda baca terpisah dari katanya: "${line}"`));
      }
    }
    if (text.role === "body") {
      text.lines.forEach((line, index) => {
        const isLast = index === text.lines.length - 1;
        if (line.length > limits.bodyLineMax || (!isLast && line.length < limits.bodyLineMin)) {
          out.push(
            saran(
              "typography",
              text.slot,
              `Baris body ${line.length} karakter, seharusnya ${limits.bodyLineMin}–${limits.bodyLineMax}`,
              { measured: line.length },
            ),
          );
        }
      });
    }
    return out;
  });
}

// Titik potong grid 3×3 (pecahan kanvas), ditambah sumbu tengah bila gaya mengizinkan.
function thirdsPoints(limits: DesignLimits): [number, number][] {
  const xs = limits.centerAxis ? [1 / 3, 1 / 2, 2 / 3] : [1 / 3, 2 / 3];
  return xs.flatMap((x) => [1 / 3, 2 / 3].map((y): [number, number] => [x, y]));
}

function thirdsChecks(d: DesignMeasurements, limits: DesignLimits): RenderCheck[] {
  const { width, height } = d.canvas;
  const points = thirdsPoints(limits);
  const out: RenderCheck[] = [];
  if (d.focus) {
    const fx = d.focus.x / width;
    const fy = d.focus.y / height;
    const off = Math.min(...points.map(([x, y]) => Math.max(Math.abs(fx - x), Math.abs(fy - y))));
    if (off > limits.thirdsTolerance) {
      out.push(
        saran(
          "thirds",
          "fokus subjek",
          `Fokus subjek di (${percent(fx)}, ${percent(fy)}), ${percent(off)} dari titik potong terdekat, maksimal ${percent(limits.thirdsTolerance)}`,
          { measured: Number(off.toFixed(3)), threshold: limits.thirdsTolerance },
        ),
      );
    }
  }
  const main = [...d.texts].sort((a, b) => b.size - a.size)[0];
  if (main) {
    const r = main.rect;
    const off = Math.min(
      ...points.map(([x, y]) => {
        const px = x * width;
        const py = y * height;
        const dx = Math.max(r.left - px, 0, px - r.right) / width;
        const dy = Math.max(r.top - py, 0, py - r.bottom) / height;
        return Math.max(dx, dy);
      }),
    );
    if (off > limits.thirdsTolerance) {
      out.push(
        saran(
          "thirds",
          main.slot,
          `Kata utama ${percent(off)} dari titik potong terdekat, maksimal ${percent(limits.thirdsTolerance)}`,
          { measured: Number(off.toFixed(3)), threshold: limits.thirdsTolerance },
        ),
      );
    }
  }
  return out;
}

// Warna dominan: token terbanyak, atau foto bila latar foto penuh.
function dominantOf(d: DesignMeasurements, px: PixelStats) {
  const [hex, share] = Object.entries(px.tokens).sort((a, b) => b[1] - a[1])[0] ?? ["", 0];
  if (d.photoBackground && px.image > share) return { hex: null, share: px.image };
  return { hex, share };
}

function colorChecks(
  d: DesignMeasurements,
  px: PixelStats,
  limits: DesignLimits,
  brand: BrandKit,
): RenderCheck[] {
  const dominant = dominantOf(d, px);
  const accentHex = brand.colors.accent.toLowerCase();
  const accent = dominant.hex === accentHex ? 0 : (px.tokens[accentHex] ?? 0);
  const second = Math.max(0, 1 - dominant.share - accent);
  const out: RenderCheck[] = [];
  const measured = (value: number) => Number(value.toFixed(3));
  if (dominant.share < limits.dominantMin) {
    out.push(
      saran(
        "color-balance",
        "slide",
        `Warna dominan ${percent(dominant.share)}, minimal ${percent(limits.dominantMin)}`,
        { measured: measured(dominant.share), threshold: limits.dominantMin },
      ),
    );
  }
  if (second < limits.secondMin || second > limits.secondMax) {
    out.push(
      saran(
        "color-balance",
        "slide",
        `Warna kedua dan gambar ${percent(second)}, seharusnya ${percent(limits.secondMin)}–${percent(limits.secondMax)}`,
        { measured: measured(second) },
      ),
    );
  }
  if (accent > limits.accentMax) {
    out.push(
      saran(
        "color-balance",
        "slide",
        `Aksen ${percent(accent)}, maksimal ${percent(limits.accentMax)}`,
        { measured: measured(accent), threshold: limits.accentMax },
      ),
    );
  }
  return out;
}

function whitespaceChecks(
  d: DesignMeasurements,
  px: PixelStats,
  limits: DesignLimits,
): RenderCheck[] {
  // Latar foto penuh: ruang kosong tidak diukur (keputusan pemilik T-130).
  if (d.photoBackground) return [];
  const dominant = dominantOf(d, px);
  const empty = dominant.hex ? (px.outside[dominant.hex] ?? 0) : 0;
  if (empty >= limits.emptyMin) return [];
  return [
    saran(
      "whitespace",
      "slide",
      `Ruang kosong ${percent(empty)}, minimal ${percent(limits.emptyMin)}`,
      { measured: Number(empty.toFixed(3)), threshold: limits.emptyMin },
    ),
  ];
}

function elementChecks(d: DesignMeasurements, limits: DesignLimits): RenderCheck[] {
  const count = d.elements.length;
  if (count <= limits.elementsMax) return [];
  return [
    saran(
      "element-count",
      "slide",
      `${count} elemen (${d.elements.map((e) => e.name).join(", ")}), maksimal ${limits.elementsMax}`,
      { measured: count, threshold: limits.elementsMax },
    ),
  ];
}

function consistencyChecks(d: DesignMeasurements, limits: DesignLimits): RenderCheck[] {
  const { width, height } = d.canvas;
  // Elemen tepi: 8–108 px dari tepi kanvas. Yang menempel (bleed) dan isi panel yang jauh di
  // dalam bukan jarak tepi.
  const near = width * 0.1;
  const edges = d.blocks
    .map(({ rect }) => Math.min(rect.left, rect.top, width - rect.right, height - rect.bottom))
    .filter((distance) => distance >= BLEED && distance < near);
  const edgeValues = clusters(edges, EDGE_TOLERANCE);
  const radii = clusters(d.radii, 1);
  const angles = clusters(
    d.angles.map(Math.abs).filter((a) => a !== 90 && a !== 180),
    1,
  );
  const out: RenderCheck[] = [];
  if (edgeValues.length > limits.edges) {
    out.push(
      saran(
        "consistency",
        "jarak tepi",
        `${edgeValues.length} jarak tepi (${edgeValues.map(Math.round).join(", ")} px), maksimal ${limits.edges}`,
        { measured: edgeValues.length, threshold: limits.edges },
      ),
    );
  }
  if (radii.length > limits.radii) {
    const label = radii.map((r) => (r < 0 ? "pil" : `${r} px`)).join(", ");
    out.push(
      saran(
        "consistency",
        "radius",
        `${radii.length} radius (${label}), maksimal ${limits.radii}`,
        {
          measured: radii.length,
          threshold: limits.radii,
        },
      ),
    );
  }
  if (angles.length > limits.angles) {
    out.push(
      saran(
        "consistency",
        "kemiringan",
        `${angles.length} sudut kemiringan (${angles.join("°, ")}°), maksimal ${limits.angles}`,
        { measured: angles.length, threshold: limits.angles },
      ),
    );
  }
  return out;
}

// Semua aturan desain; aturan tanpa pelanggaran menghasilkan satu cek lolos bertingkat saran.
export function designChecks(
  d: DesignMeasurements,
  px: PixelStats,
  limits: DesignLimits,
  brand: BrandKit,
): RenderCheck[] {
  const failures = [
    ...alignmentChecks(d, limits),
    ...hierarchyChecks(d, limits),
    ...typographyChecks(d, limits),
    ...thirdsChecks(d, limits),
    ...colorChecks(d, px, limits, brand),
    ...whitespaceChecks(d, px, limits),
    ...elementChecks(d, limits),
    ...consistencyChecks(d, limits),
  ];
  const passed = DESIGN_RULES.filter((rule) => !failures.some((c) => c.rule === rule)).map(
    (rule): RenderCheck => ({ rule, passed: true, message: PASSED[rule], severity: "saran" }),
  );
  return [...failures, ...passed];
}
