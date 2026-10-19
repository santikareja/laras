import type { BrandKit, StyleChoice } from "@laras/shared";
import type { ReactElement } from "react";
import type { ImageTreatment } from "../primitives/Photo.tsx";

// Kontrak lapisan gaya (PRD F16, T-132). Gaya mengubah bahasa visual tanpa mengubah susunan
// arketipe: variabel CSS, lapisan latar, lapisan atas, dan perlakuan foto. Tanpa gaya, arketipe
// dirender persis seperti sebelumnya.

export type Corner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

// Label kecil dari copy (slot opsional `label` arketipe) dan sudut kosong yang disediakan
// arketipe untuknya; gaya yang memakai label (mis. label teknis, label HUD) meletakkannya di sana.
export type StyleLayerProps = { style: StyleChoice; label?: string | undefined; corner?: Corner };

export type SpecimenProps = { style: StyleChoice; subject: string; photo: string; logo: string };

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
  // Isi spesimen perangkat grafis gaya ini (styles/specimen.tsx).
  Specimen?: (props: SpecimenProps) => ReactElement;
};
