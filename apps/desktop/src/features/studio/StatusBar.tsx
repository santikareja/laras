import { CircleAlert, CircleCheck, type LucideIcon, TriangleAlert } from "lucide-react";
import { BilahLaras } from "../../components/bilah-laras.tsx";
import { DRY_RUN } from "../../lib/connection.ts";
import type { SidecarState } from "../../lib/sidecar.ts";
import { cn } from "../../lib/utils.ts";
import { BAR_STAGES, type BarStage, type JobView, useJob } from "../../stores/job.ts";
import { useStudio } from "../../stores/studio.ts";

// Status bar 36 px (DESIGN 5) dengan Bilah Laras dan teks status di region aria-live (DESIGN
// 10.5). Masalah sambungan sidecar didahulukan daripada keadaan job.
const STATE_TEXT: Record<SidecarState, string> = {
  starting: "Menyiapkan Laras",
  ready: "Siap",
  reconnecting: "Menyambung ulang",
  failed:
    "Proses latar Laras tidak bisa dijalankan. Pastikan Node.js terpasang, lalu buka ulang Laras.",
};

const STAGE_LABEL: Record<BarStage, string> = {
  plan: "Rencana",
  copy: "Copy",
  layout: "Layout",
  assets: "Aset",
  render: "Render",
  qa: "QA",
};

const STAGE_TEXT: Record<BarStage, string> = {
  plan: "Menyusun rencana",
  copy: "Menulis copy",
  layout: "Menyusun layout",
  assets: "Membuat aset",
  render: "Merender",
  qa: "Memeriksa QA",
};

type Tone = "biasa" | "berhasil" | "peringatan" | "bahaya";

const projectsErrorText = (cause: string) =>
  `Daftar project tidak bisa dibaca (${cause}). Buka ulang Laras; bila masih gagal, periksa logs/sidecar.log di folder data Laras.`;

function jobStatus(view: JobView): { text: string; tone: Tone } {
  const stage = view.stage ? STAGE_LABEL[view.stage] : null;
  if (view.phase !== "finished") {
    const doing = view.stage ? STAGE_TEXT[view.stage] : "Memulai";
    return {
      text: view.round > 0 ? `Revisi ${view.round}: ${doing.toLowerCase()}` : doing,
      tone: "biasa",
    };
  }
  if (view.status === "done") {
    if (view.qaPassed === null) return { text: "Desain siap", tone: "biasa" };
    return view.qaPassed
      ? { text: "Desain siap, QA lolos", tone: "berhasil" }
      : { text: "Desain siap, QA perlu dicek", tone: "peringatan" };
  }
  if (view.status === "waiting_quota") {
    return {
      text: `Kuota habis di tahap ${stage ?? "pertama"}. Pilih Buat lagi setelah kuota pulih.`,
      tone: "peringatan",
    };
  }
  if (view.status === "interrupted") {
    return {
      text: `${stage ?? "Job"} terhenti karena proses latar berhenti. Pilih Buat lagi.`,
      tone: "bahaya",
    };
  }
  const cause = (view.error ?? "penyebab tidak diketahui").replace(/[.\s]+$/, "");
  const what = view.status === "cancelled" ? "dibatalkan" : "gagal";
  return {
    text: `${stage ?? "Job"} ${what}: ${cause}. Periksa logs/sidecar.log, lalu pilih Buat lagi.`,
    tone: "bahaya",
  };
}

const TONE_CLASS: Record<Tone, string> = {
  biasa: "text-muted-foreground",
  berhasil: "text-success",
  peringatan: "text-warning",
  bahaya: "text-destructive",
};

const TONE_ICON: Record<Exclude<Tone, "biasa">, LucideIcon> = {
  berhasil: CircleCheck,
  peringatan: TriangleAlert,
  bahaya: CircleAlert,
};

// Urutan: masalah proses latar, lalu sambungan yang belum siap, lalu keadaan job.
function currentStatus(
  sidecar: SidecarState,
  projectsError: string | null,
  view: JobView | null,
): { text: string; tone: Tone } {
  if (projectsError !== null) return { text: projectsErrorText(projectsError), tone: "bahaya" };
  if (sidecar === "failed") return { text: STATE_TEXT.failed, tone: "bahaya" };
  if (sidecar !== "ready" || !view) return { text: STATE_TEXT[sidecar], tone: "biasa" };
  return jobStatus(view);
}

export function StatusBar() {
  const { sidecar, projectsError } = useStudio();
  const view = useJob((state) => state.view);
  const problem = sidecar !== "ready" || projectsError !== null;
  const status = currentStatus(sidecar, projectsError, view);
  const Icon = status.tone === "biasa" ? null : TONE_ICON[status.tone];
  return (
    <footer className="flex h-9 items-center gap-3 border-t border-border bg-card px-3">
      {view && !problem && (
        <BilahLaras
          bars={BAR_STAGES.map((stage) => ({ label: STAGE_LABEL[stage], ...view.bars[stage] }))}
        />
      )}
      {/* Satu baris: teks panjang dipotong, lengkapnya di tooltip bawaan. */}
      <p
        role="status"
        aria-live="polite"
        title={status.text}
        className={cn("flex min-w-0 items-center gap-2", TONE_CLASS[status.tone])}
      >
        {Icon && <Icon className="size-4 shrink-0" strokeWidth={1.5} aria-hidden />}
        <span className="truncate">{status.text}</span>
      </p>
      {DRY_RUN && (
        <span className="ml-auto shrink-0 text-caption text-muted-foreground">
          Mode uji tanpa Claude dan Codex
        </span>
      )}
    </footer>
  );
}
