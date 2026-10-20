import type { ProjectSummary } from "@laras/shared";
import { useEffect, useState } from "react";
import { createRpcClient } from "../lib/rpc.ts";
import { connectSidecar, type SidecarState } from "../lib/sidecar.ts";

// Sementara (T-203): status sambungan sidecar dan daftar project, untuk membuktikan UI ↔ sidecar.
// Layout Studio menggantikannya di T-204 dan T-205.
const client = createRpcClient();
let connection: ReturnType<typeof connectSidecar> | null = null;

const STATE_TEXT: Record<SidecarState, string> = {
  starting: "Menyiapkan Laras",
  ready: "Siap",
  reconnecting: "Menyambung ulang",
  failed:
    "Proses latar Laras tidak bisa dijalankan. Pastikan Node.js terpasang, lalu buka ulang Laras.",
};

// Area seret setinggi toolbar (DESIGN 5) karena title bar memakai gaya Overlay.
export function App() {
  const [state, setState] = useState<SidecarState>("starting");
  const [projects, setProjects] = useState<ProjectSummary[]>([]);

  useEffect(() => {
    connection ??= connectSidecar(client, (next) => {
      setState(next);
      if (next === "ready") void client.request("project.list").then(setProjects);
    });
  }, []);

  return (
    <>
      <div data-tauri-drag-region className="h-11" />
      <main className="px-5" aria-live="polite">
        <p>{STATE_TEXT[state]}</p>
        <ul>
          {projects.map((project) => (
            <li key={project.slug}>{project.name}</li>
          ))}
        </ul>
      </main>
    </>
  );
}

// HMR: proses sidecar lama dihentikan agar tidak menumpuk saat modul dimuat ulang.
import.meta.hot?.dispose(() => {
  void connection?.stop();
  connection = null;
});
