// Akses ke CSS variables brand (kontrak ARCH 6.1). Primitives hanya memakai fungsi ini,
// sehingga template tidak pernah memberi warna, font, atau ukuran mentah.

export type ColorToken = "primary" | "secondary" | "accent" | "neutral-light" | "neutral-dark";
export type FontRole = "heading" | "body";
export type FontSizeStep = 1 | 2 | 3 | 4 | 5 | 6;
export type SpaceStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export const color = (token: ColorToken) => `var(--color-${token})`;
export const space = (step: SpaceStep) => `var(--space-${step})`;
export const fontFamily = (role: FontRole) => `var(--font-${role})`;
export const fontWeight = (role: FontRole, strong: boolean) =>
  `var(--font-${role}-weight${strong ? "-strong" : ""})`;

// Skala brand boleh kurang dari 6 langkah: ukuran yang tidak ada jatuh ke langkah di bawahnya.
export function fontSize(step: FontSizeStep): string {
  let value = "var(--font-size-1)";
  for (let i = 2; i <= step; i++) value = `var(--font-size-${i}, ${value})`;
  return value;
}
