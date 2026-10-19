import type { BrandKit, StyleChoice } from "@laras/shared";
import type { ReactElement } from "react";
import type { ImageTreatment } from "../primitives/Photo.tsx";

// Kontrak lapisan gaya (PRD F16, T-132). Gaya mengubah bahasa visual tanpa mengubah susunan
// arketipe: variabel CSS, lapisan latar, lapisan atas, dan perlakuan foto. Tanpa gaya, arketipe
// dirender persis seperti sebelumnya.

export type StyleLayerProps = { style: StyleChoice };

export type Variable = [name: string, value: string];

export type StyleRender = {
  // Variabel CSS khas gaya; Brand Kit menang (bagian 12 panduan gaya).
  variables: (brand: BrandKit, choice: StyleChoice) => Variable[];
  // Di atas bidang latar, di bawah subjek dan teks: tekstur kertas, garis grid, swoosh.
  Backdrop?: (props: StyleLayerProps) => ReactElement | null;
  // Lapisan teratas tanpa teks penting: scanline, grain, bingkai HUD.
  Overlay?: (props: StyleLayerProps) => ReactElement | null;
  // Perlakuan foto dan cut-out utama.
  treatment: (choice: StyleChoice) => ImageTreatment;
};
