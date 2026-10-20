import { useEffect } from "react";
import { useStudio } from "../../stores/studio.ts";
import { INSPECTOR_ID, Inspector } from "./Inspector.tsx";
import { Preview } from "./Preview.tsx";
import { SIDEBAR_ID, Sidebar } from "./Sidebar.tsx";
import { StatusBar } from "./StatusBar.tsx";
import { INSPECTOR_TOGGLE_ID, SIDEBAR_TOGGLE_ID, Toolbar } from "./Toolbar.tsx";

// Layout Studio (DESIGN 6): toolbar di atas sidebar dan kanvas, inspector setinggi jendela di
// kanan, status bar di bawah. ⌘\ menampilkan atau menyembunyikan sidebar, ⌘⌥\ inspector
// (DESIGN 13).
export function StudioLayout() {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const plain = !event.shiftKey && !event.ctrlKey && !event.repeat;
      if (!event.metaKey || !plain || event.code !== "Backslash") return;
      event.preventDefault();
      const studio = useStudio.getState();
      const [panel, toggle, open] = event.altKey
        ? [INSPECTOR_ID, INSPECTOR_TOGGLE_ID, studio.inspectorOpen]
        : [SIDEBAR_ID, SIDEBAR_TOGGLE_ID, studio.sidebarOpen];
      // Panel yang ditutup menjadi inert: fokus di dalamnya dipindah ke tombol panelnya.
      if (open && document.getElementById(panel)?.contains(document.activeElement)) {
        document.getElementById(toggle)?.focus();
      }
      if (event.altKey) studio.toggleInspector();
      else studio.toggleSidebar();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex h-full flex-col">
      <div className="relative flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
          <Toolbar />
          <div className="flex min-h-0 flex-1">
            <Sidebar />
            {/* Kanvas selalu netral (DESIGN 3). */}
            <main aria-label="Kanvas" className="min-w-0 flex-1 bg-canvas">
              <Preview />
            </main>
          </div>
        </div>
        <Inspector />
      </div>
      <StatusBar />
    </div>
  );
}
