import { useJob } from "../stores/job.ts";
import { useStudio } from "../stores/studio.ts";
import { createRpcClient } from "./rpc.ts";
import { connectSidecar } from "./sidecar.ts";

// Satu sambungan sidecar untuk seluruh aplikasi (T-203, dipindah dari App.tsx di T-205):
// keadaannya ke store Studio, event job ke store job.
export const client = createRpcClient();

// `pnpm dev` dengan VITE_LARAS_DRY_RUN=1: job memakai jawaban contoh, tanpa Claude dan Codex.
export const DRY_RUN = import.meta.env.VITE_LARAS_DRY_RUN === "1";

let connection: ReturnType<typeof connectSidecar> | null = null;
let unsubscribe: (() => void) | null = null;

export function startConnection() {
  if (connection) return;
  const offEvent = client.on("job.event", (params) => useJob.getState().event(params));
  const offFinished = client.on("job.finished", (params) => useJob.getState().finished(params));
  unsubscribe = () => {
    offEvent();
    offFinished();
  };
  connection = connectSidecar(client, (state) => {
    const studio = useStudio.getState();
    studio.setSidecar(state);
    if (state !== "ready") {
      useJob.getState().interrupt();
      return;
    }
    client
      .request("project.list")
      .then(studio.setProjects)
      .catch((error: unknown) => {
        studio.setProjectsError(error instanceof Error ? error.message : String(error));
      });
  });
}

// HMR: proses sidecar lama dihentikan agar tidak menumpuk saat modul dimuat ulang.
export function stopConnection() {
  unsubscribe?.();
  void connection?.stop();
  unsubscribe = null;
  connection = null;
}
