import { cn } from "../lib/utils.ts";
import { Tooltip } from "./ui/tooltip.tsx";

// Bilah Laras (DESIGN 10.5): satu bilah per tahap pipeline, satu-satunya elemen khas aplikasi.
// Ukuran status bar 20 × 4 px berjarak 4 px; ukuran kartu varian menyusul bersama E-303.

export type BilahState = "waiting" | "running" | "done" | "failed" | "quota";
export type Bilah = { label: string; state: BilahState; durationMs?: number };

const STATE_LABEL: Record<BilahState, string> = {
  waiting: "menunggu",
  running: "sedang berjalan",
  done: "selesai",
  failed: "gagal",
  quota: "menunggu kuota",
};

const STATE_CLASS: Record<BilahState, string> = {
  waiting: "bg-border",
  running: "animate-denyut bg-primary motion-reduce:animate-none",
  done: "bg-primary",
  failed: "bg-destructive",
  quota: "bg-warning",
};

const seconds = (ms: number) =>
  `${(ms / 1000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} detik`;

export function BilahLaras({ bars }: { bars: Bilah[] }) {
  return (
    <ul className="flex shrink-0 items-center gap-1" aria-label="Progres">
      {bars.map((bar) => (
        <li key={bar.label} className="flex">
          <Tooltip
            label={
              bar.durationMs === undefined ? bar.label : `${bar.label}, ${seconds(bar.durationMs)}`
            }
          >
            <span
              role="img"
              aria-label={`${bar.label}, ${STATE_LABEL[bar.state]}`}
              className={cn("h-1 w-5 rounded-xs", STATE_CLASS[bar.state])}
            />
          </Tooltip>
        </li>
      ))}
    </ul>
  );
}
