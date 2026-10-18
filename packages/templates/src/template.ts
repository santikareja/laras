import type { ContentFormat } from "@laras/shared";
import type { ReactElement } from "react";

// Kontrak antara renderer dan template (ARCH 6.2). Skema meta lengkap (nama, deskripsi,
// slot dan batas karakter, opsi) menyusul bersama template pertama (T-108).

// Slot LayoutSpec setelah di-resolve renderer: aset dan logo sudah menjadi URL.
export type ResolvedSlot =
  | { type: "text"; value: string }
  | { type: "badge"; value: string }
  | { type: "image"; src: string }
  | { type: "logo"; src: string };

export type SlideProps = {
  slots: Record<string, ResolvedSlot>;
  options: Record<string, string>;
  index: number;
  total: number;
};

export type Template = {
  meta: { id: string; format: ContentFormat };
  Slide: (props: SlideProps) => ReactElement;
};

export function slot<T extends ResolvedSlot["type"]>(
  slots: Record<string, ResolvedSlot>,
  name: string,
  type: T,
): Extract<ResolvedSlot, { type: T }> {
  const value = slots[name];
  if (value?.type !== type) throw new Error(`Slot "${name}" bertipe ${type} wajib diisi`);
  return value as Extract<ResolvedSlot, { type: T }>;
}
