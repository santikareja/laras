import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import type { ComponentProps, ReactElement } from "react";
import { cn } from "../../lib/utils.ts";

// Tooltip untuk tombol berikon (DESIGN 8) dan shortcut (DESIGN 13). Mengambang di atas
// `--surface-raised` dengan bayangan float, tanpa animasi masuk.
const DELAY_MS = 500;

export function TooltipProvider(props: ComponentProps<typeof TooltipPrimitive.Provider>) {
  return <TooltipPrimitive.Provider delayDuration={DELAY_MS} {...props} />;
}

export function TooltipContent({
  className,
  sideOffset = 4,
  ...props
}: ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          "z-50 rounded-md bg-popover px-2 py-1 text-caption text-popover-foreground shadow-(--shadow-float)",
          className,
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
}

// Satu kontrol dengan tooltip-nya; `label` juga menjadi nama kontrol bagi VoiceOver lewat
// aria-label yang dipasang pemanggil.
export function Tooltip({
  label,
  shortcut,
  children,
}: {
  label: string;
  shortcut?: string;
  children: ReactElement;
}) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipContent>
        {label}
        {shortcut && <span className="ml-2 text-muted-foreground">{shortcut}</span>}
      </TooltipContent>
    </TooltipPrimitive.Root>
  );
}
