import type { JobEventParams, JobFinishedParams, JobStage, JobStatus } from "@laras/shared";
import { create } from "zustand";

// Keadaan job yang sedang dilihat di Studio (T-205): satu brief, satu varian. Event sidecar
// diterapkan lewat reducer murni agar bisa dites tanpa UI.

export const BAR_STAGES = ["plan", "copy", "layout", "assets", "render", "qa"] as const;
export type BarStage = (typeof BAR_STAGES)[number];
export type BarState = "waiting" | "running" | "done" | "failed" | "quota";
export type Bar = { state: BarState; durationMs?: number };

export type JobView = {
  project: string;
  brief: string;
  jobId: string | null;
  // Menunggu jawaban job.start, berjalan, selesai, atau gagal.
  phase: "starting" | "running" | "finished";
  bars: Record<BarStage, Bar>;
  // Tahap terakhir yang dimulai, dan putaran revisi yang sedang berjalan (0 = belum revisi).
  stage: BarStage | null;
  round: number;
  status: JobStatus | null;
  error: string | null;
  slides: string[];
  qaPassed: boolean | null;
};

const waitingBars = (): Record<BarStage, Bar> => ({
  plan: { state: "waiting" },
  copy: { state: "waiting" },
  layout: { state: "waiting" },
  assets: { state: "waiting" },
  render: { state: "waiting" },
  qa: { state: "waiting" },
});

export function newJobView(project: string, brief: string): JobView {
  return {
    project,
    brief,
    jobId: null,
    phase: "starting",
    bars: waitingBars(),
    stage: null,
    round: 0,
    status: null,
    error: null,
    slides: [],
    qaPassed: null,
  };
}

// Revisi masuk ulang di tahap Layout (revisi menulis ulang layout dan copy), jadi Layout sampai QA
// kembali menunggu (DESIGN 10.5).
const barOf = (stage: JobStage): BarStage => (stage === "revise" ? "layout" : stage);

export function applyJobEvent(view: JobView, { jobId, event }: JobEventParams): JobView {
  if (view.jobId !== null && view.jobId !== jobId) return view;
  const bar = barOf(event.stage);
  const bars = { ...view.bars };
  let round = view.round;
  if (event.type === "started") {
    if (event.stage === "revise") {
      round += 1;
      for (const stage of BAR_STAGES.slice(BAR_STAGES.indexOf("layout"))) {
        bars[stage] = { state: "waiting" };
      }
    }
    bars[bar] = { state: "running" };
    return { ...view, jobId, phase: "running", bars, stage: bar, round };
  }
  if (event.type === "completed") {
    bars[bar] = {
      state: "done",
      ...(event.durationMs === undefined ? {} : { durationMs: event.durationMs }),
    };
    return { ...view, jobId, phase: "running", bars };
  }
  bars[bar] = { state: "failed" };
  return { ...view, jobId, bars, stage: bar, error: event.message ?? view.error };
}

export function applyJobFinished(view: JobView, params: JobFinishedParams): JobView {
  if (view.jobId !== null && view.jobId !== params.jobId) return view;
  const bars = { ...view.bars };
  if (view.stage && params.status === "waiting_quota") bars[view.stage] = { state: "quota" };
  if (view.stage && params.status === "failed" && bars[view.stage].state !== "done") {
    bars[view.stage] = { state: "failed" };
  }
  return {
    ...view,
    jobId: params.jobId,
    phase: "finished",
    bars,
    status: params.status,
    error: params.error ?? view.error,
    slides: params.slides,
    qaPassed: params.qaPassed,
  };
}

// Gagal sebelum job berjalan (job.start ditolak).
export function failJobStart(view: JobView, error: string): JobView {
  return { ...view, phase: "finished", status: "failed", error };
}

// Sidecar berhenti saat job berjalan: job tidak akan mengirim event lagi, jadi ditandai terhenti
// (ARCH 4.3) agar Buat bisa dipakai lagi. Job yang sudah selesai tidak berubah.
export function interruptJob(view: JobView): JobView {
  if (view.phase === "finished") return view;
  const bars = { ...view.bars };
  if (view.stage) bars[view.stage] = { state: "failed" };
  return { ...view, phase: "finished", bars, status: "interrupted", error: null };
}

type JobStore = {
  view: JobView | null;
  start: (project: string, brief: string) => void;
  started: (jobId: string) => void;
  event: (params: JobEventParams) => void;
  finished: (params: JobFinishedParams) => void;
  failStart: (error: string) => void;
  interrupt: () => void;
};

export const useJob = create<JobStore>()((set) => ({
  view: null,
  start: (project, brief) => set({ view: newJobView(project, brief) }),
  started: (jobId) => set(({ view }) => ({ view: view && { ...view, jobId } })),
  event: (params) => set(({ view }) => ({ view: view && applyJobEvent(view, params) })),
  finished: (params) => set(({ view }) => ({ view: view && applyJobFinished(view, params) })),
  failStart: (error) => set(({ view }) => ({ view: view && failJobStart(view, error) })),
  interrupt: () => set(({ view }) => ({ view: view && interruptJob(view) })),
}));

export const isJobBusy = (view: JobView | null) => view !== null && view.phase !== "finished";
