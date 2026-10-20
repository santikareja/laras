import { useEffect } from "react";
import { TooltipProvider } from "../components/ui/tooltip.tsx";
import { StudioLayout } from "../features/studio/StudioLayout.tsx";
import { createRpcClient } from "../lib/rpc.ts";
import { connectSidecar } from "../lib/sidecar.ts";
import { useStudio } from "../stores/studio.ts";

// Satu sambungan sidecar untuk seluruh aplikasi (T-203); keadaannya disimpan di store Studio.
const client = createRpcClient();
let connection: ReturnType<typeof connectSidecar> | null = null;

export function App() {
  useEffect(() => {
    connection ??= connectSidecar(client, (state) => {
      const studio = useStudio.getState();
      studio.setSidecar(state);
      if (state !== "ready") return;
      client
        .request("project.list")
        .then(studio.setProjects)
        .catch((error: unknown) => {
          studio.setProjectsError(error instanceof Error ? error.message : String(error));
        });
    });
  }, []);

  return (
    <TooltipProvider>
      <StudioLayout />
    </TooltipProvider>
  );
}

// HMR: proses sidecar lama dihentikan agar tidak menumpuk saat modul dimuat ulang.
import.meta.hot?.dispose(() => {
  void connection?.stop();
  connection = null;
});
