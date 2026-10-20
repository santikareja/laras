import { type ClassValue, clsx } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Peran tipografi DESIGN 4 (text-caption … text-display) didaftarkan sebagai ukuran font, agar
// tailwind-merge tidak membuangnya bersama kelas warna teks seperti text-foreground.
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: [
        "caption",
        "label",
        "body",
        "body-strong",
        "panel-title",
        "section",
        "page",
        "display",
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
