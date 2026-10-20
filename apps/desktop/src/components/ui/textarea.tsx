import type { ComponentProps } from "react";
import { cn } from "../../lib/utils.ts";

// Input teks DESIGN 10.2: tinggi 28 px untuk satu baris, border --border-strong, radius kontrol,
// padding horizontal 8 px; saat fokus border menjadi aksen ditambah ring fokus global.
export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "block min-h-7 w-full resize-none rounded-md border border-input bg-card px-2 py-1 text-body text-foreground placeholder:text-muted-foreground focus-visible:border-primary disabled:text-disabled",
        className,
      )}
      {...props}
    />
  );
}
