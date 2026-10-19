import type { BrandKit, StyleChoice, StyleMeta } from "@laras/shared";
import type { ImageTreatment } from "../primitives/Photo.tsx";
import type { StyleLayerProps, StyleRender, Variable } from "../src/style.ts";
import { brutalismRender } from "./brutalism/render.tsx";
import { corporateCleanRender } from "./corporate-clean/render.tsx";
import { cyberpunkRender } from "./cyberpunk/render.tsx";
import { flatDesignRender } from "./flat-design/render.tsx";
import { glassmorphismNeumorphismRender } from "./glassmorphism-neumorphism/render.tsx";
import { minimalismRender } from "./minimalism/render.tsx";
import { retroVintageRender } from "./retro-vintage/render.tsx";

// Lapisan gaya yang dipakai arketipe dan renderer (T-132). Tanpa gaya semua fungsi di sini tidak
// menghasilkan apa pun, sehingga render arketipe tetap seperti sebelumnya.

const RENDERS: Record<string, StyleRender> = {
  brutalism: brutalismRender,
  "corporate-clean": corporateCleanRender,
  cyberpunk: cyberpunkRender,
  "flat-design": flatDesignRender,
  minimalism: minimalismRender,
  "glassmorphism-neumorphism": glassmorphismNeumorphismRender,
  "retro-vintage": retroVintageRender,
};

export function styleRender(id: string): StyleRender {
  const render = RENDERS[id];
  if (!render) throw new Error(`Gaya "${id}" tidak punya lapisan render`);
  return render;
}

const TRACKING = { tight: "-0.01em", normal: "0em", wide: "0.06em" } as const;

// Variabel CSS gaya untuk dokumen slide. Brand Kit menang: radius dan bayangan tetap dari token
// brand; pil hanya bila radius brand ≥ 16 px (P11 di panduan Corporate, Flat, Glassmorphism).
export function styleCss(meta: StyleMeta, choice: StyleChoice, brand: BrandKit): string {
  const base: Variable[] = [
    ["--style-heading-transform", meta.typography.headingCase === "upper" ? "uppercase" : "none"],
    ["--style-heading-tracking", TRACKING[meta.typography.tracking]],
    ["--radius-pill", brand.shape.radius >= 16 ? "999px" : "var(--shape-radius)"],
  ];
  const variables = [...base, ...styleRender(choice.id).variables(brand, choice)];
  return `:root {\n${variables.map(([name, value]) => `  ${name}: ${value};`).join("\n")}\n}`;
}

type LayerProps = Omit<StyleLayerProps, "style"> & { style?: StyleChoice | undefined };

// Lapisan gaya di atas bidang latar arketipe (di bawah subjek dan teks).
export function StyleBackdrop({ style, ...rest }: LayerProps) {
  if (!style) return null;
  const { Backdrop } = styleRender(style.id);
  return Backdrop ? <Backdrop style={style} {...rest} /> : null;
}

// Lapisan gaya teratas, tanpa teks penting kecuali label dari copy.
export function StyleOverlay({ style, ...rest }: LayerProps) {
  if (!style) return null;
  const { Overlay } = styleRender(style.id);
  return Overlay ? <Overlay style={style} {...rest} /> : null;
}

export function styleTreatment(style: StyleChoice | undefined): ImageTreatment {
  return style ? styleRender(style.id).treatment(style) : { kind: "natural" };
}
