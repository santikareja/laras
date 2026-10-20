import { useEffect } from "react";
import { TooltipProvider } from "../components/ui/tooltip.tsx";
import { StudioLayout } from "../features/studio/StudioLayout.tsx";
import { startConnection, stopConnection } from "../lib/connection.ts";

export function App() {
  useEffect(() => startConnection(), []);

  return (
    <TooltipProvider>
      <StudioLayout />
    </TooltipProvider>
  );
}

// HMR: proses sidecar lama dihentikan agar tidak menumpuk saat modul dimuat ulang.
import.meta.hot?.dispose(stopConnection);
