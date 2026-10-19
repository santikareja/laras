import type { BrandKit, StyleChoice } from "@laras/shared";
import type { ReactElement } from "react";
import type { TextEffect } from "../primitives/Effects.tsx";
import type { ImageTreatment } from "../primitives/Photo.tsx";

// Kontrak lapisan gaya (PRD F16, T-132). Gaya mengubah bahasa visual tanpa mengubah susunan
// arketipe: variabel CSS, lapisan latar, lapisan atas, dan perlakuan foto. Tanpa gaya, arketipe
// dirender persis seperti sebelumnya.

export type Corner = "top-left" | "top-right" | "bottom-left" | "bottom-right";

// Label kecil dari copy (slot opsional `label` arketipe) dan sudut kosong yang disediakan
// arketipe untuknya; gaya yang memakai label (mis. label teknis, label HUD) meletakkannya di sana.
// `floor`: jarak dasar subjek dari bawah kanvas (CSS), untuk gaya yang menggambar lantai
// (rel neon, garis rambut) di arketipe yang punya lantai.
// `surface`: latar arketipe di sudut label (terang, gelap, atau foto), agar label terbaca.
export type StyleLayerProps = {
  style: StyleChoice;
  label?: string | undefined;
  corner?: Corner;
  floor?: string;
  surface?: Surface;
  // Sisi subjek utama, agar bentuk gaya (mis. swoosh Flat) berada di belakang subjek, bukan teks.
  subjectSide?: "left" | "right";
};

export type Surface = "light" | "dark" | "photo";

// Peran teks yang boleh diberi efek gaya: kata raksasa (Display) dan headline besar (≥ 60 px).
export type EffectRole = "display" | "headline";

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
  // Efek teks gaya (glow, tinta aus, retro), mis. glow neon Cyberpunk pada headline.
  effect?: (choice: StyleChoice, role: EffectRole) => TextEffect | undefined;
  // Isi spesimen perangkat grafis gaya ini (styles/specimen.tsx).
  Specimen?: (props: SpecimenProps) => ReactElement;
};
