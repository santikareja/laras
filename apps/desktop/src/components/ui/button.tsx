import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "../../lib/utils.ts";

// Tombol DESIGN 10.1: utama satu per area, sekunder, ghost untuk toolbar dan list, bahaya hanya di
// dialog hapus. Tinggi 28 px (bawaan) atau 32 px (besar), padding 12 px, ikon 16 px berjarak 6 px.
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-md px-3 text-body whitespace-nowrap transition-colors duration-(--dur-fast) ease-(--ease-out) disabled:pointer-events-none disabled:text-disabled [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        utama: "bg-primary text-primary-foreground hover:bg-primary-hover",
        sekunder: "border border-input bg-secondary text-secondary-foreground hover:bg-muted",
        ghost: "text-foreground hover:bg-accent [&_svg]:text-muted-foreground",
        bahaya: "bg-destructive text-destructive-foreground",
      },
      size: {
        bawaan: "h-7",
        besar: "h-8",
        // Tombol ikon tanpa teks: wajib punya aria-label dan tooltip (DESIGN 8).
        ikon: "size-7 px-0",
      },
    },
    defaultVariants: { variant: "sekunder", size: "bawaan" },
  },
);

export function Button({
  className,
  variant,
  size,
  type = "button",
  ...props
}: ComponentProps<"button"> & VariantProps<typeof buttonVariants>) {
  return (
    <button type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  );
}
