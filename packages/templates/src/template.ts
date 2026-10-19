import type { StyleChoice, SubjectInfo, TemplateMeta } from "@laras/shared";
import type { ReactElement } from "react";

// Kontrak antara renderer dan template (ARCH 6.2). Meta divalidasi skema TemplateMeta.

// Slot LayoutSpec setelah di-resolve renderer: aset dan logo sudah menjadi URL.
export type ResolvedSlot =
  | { type: "text"; value: string }
  | { type: "badge"; value: string }
  | { type: "image"; src: string; subject?: SubjectInfo }
  | { type: "logo"; src: string };

export type SlideProps = {
  slots: Record<string, ResolvedSlot>;
  options: Record<string, string>;
  index: number;
  total: number;
  // Gaya desain dengan semua opsi terisi (PRD F16, T-132); tanpa gaya berarti tampilan bawaan.
  style?: StyleChoice;
};

export type Template = {
  meta: TemplateMeta;
  Slide: (props: SlideProps) => ReactElement;
};

type SlotOf<T extends ResolvedSlot["type"]> = Extract<ResolvedSlot, { type: T }>;

export function slot<T extends ResolvedSlot["type"]>(
  slots: Record<string, ResolvedSlot>,
  name: string,
  type: T,
): SlotOf<T> {
  const value = optionalSlot(slots, name, type);
  if (!value) throw new Error(`Slot "${name}" bertipe ${type} wajib diisi`);
  return value;
}

export function optionalSlot<T extends ResolvedSlot["type"]>(
  slots: Record<string, ResolvedSlot>,
  name: string,
  type: T,
): SlotOf<T> | undefined {
  const value = slots[name];
  if (value === undefined) return undefined;
  if (value.type !== type) throw new Error(`Slot "${name}" harus bertipe ${type}`);
  return value as SlotOf<T>;
}
