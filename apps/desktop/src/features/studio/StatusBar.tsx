import { CircleAlert } from "lucide-react";
import type { SidecarState } from "../../lib/sidecar.ts";
import { cn } from "../../lib/utils.ts";
import { useStudio } from "../../stores/studio.ts";

// Status bar 36 px (DESIGN 5), tempat Bilah Laras di T-205. Saat ini hanya keadaan proses latar,
// di region aria-live (DESIGN 10.5).
const STATE_TEXT: Record<SidecarState, string> = {
  starting: "Menyiapkan Laras",
  ready: "Siap",
  reconnecting: "Menyambung ulang",
  failed:
    "Proses latar Laras tidak bisa dijalankan. Pastikan Node.js terpasang, lalu buka ulang Laras.",
};

const projectsErrorText = (cause: string) =>
  `Daftar project tidak bisa dibaca (${cause}). Buka ulang Laras; bila masih gagal, periksa logs/sidecar.log di folder data Laras.`;

export function StatusBar() {
  const { sidecar, projectsError } = useStudio();
  const failed = sidecar === "failed" || projectsError !== null;
  const text = projectsError === null ? STATE_TEXT[sidecar] : projectsErrorText(projectsError);
  return (
    <footer className="flex h-9 items-center border-t border-border bg-card px-3">
      {/* Satu baris: teks panjang dipotong, lengkapnya di tooltip bawaan. */}
      <p
        role="status"
        aria-live="polite"
        title={text}
        className={cn(
          "flex min-w-0 items-center gap-2",
          failed ? "text-destructive" : "text-muted-foreground",
        )}
      >
        {failed && <CircleAlert className="size-4 shrink-0" strokeWidth={1.5} aria-hidden />}
        <span className="truncate">{text}</span>
      </p>
    </footer>
  );
}
