import { cn } from "../../lib/utils.ts";
import { useStudio } from "../../stores/studio.ts";

export const INSPECTOR_ID = "inspector";

// Inspector 320 px setinggi jendela (DESIGN 5, 6), dengan area seret setinggi toolbar di atasnya.
// Di bawah lebar 1280 px menjadi overlay di bawah toolbar, agar tombol panel tetap terjangkau.
// Isinya (Copy, Caption, QA, Versi, Revisi) menyusul di T-205 dan Fase 3.
export function Inspector() {
  const { inspectorOpen } = useStudio();
  return (
    <aside
      id={INSPECTOR_ID}
      aria-label="Inspector"
      inert={!inspectorOpen}
      className={cn(
        "shrink-0 overflow-hidden bg-card transition-[width] duration-(--dur-base) ease-(--ease-out) max-xl:absolute max-xl:top-11 max-xl:right-0 max-xl:bottom-0 max-xl:z-10",
        inspectorOpen ? "w-80 border-l border-border max-xl:shadow-(--shadow-float)" : "w-0",
      )}
    >
      <div data-tauri-drag-region className="h-11 w-80 max-xl:hidden" />
    </aside>
  );
}
