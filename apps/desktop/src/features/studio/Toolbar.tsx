import { PanelLeft, PanelRight } from "lucide-react";
import { Button } from "../../components/ui/button.tsx";
import { Tooltip } from "../../components/ui/tooltip.tsx";
import { useStudio } from "../../stores/studio.ts";
import { BriefBar } from "./BriefBar.tsx";

export const SIDEBAR_TOGGLE_ID = "tombol-sidebar";
export const INSPECTOR_TOGGLE_ID = "tombol-inspector";

// Toolbar 44 px di atas sidebar dan kanvas (DESIGN 5, 6): area seret karena title bar memakai
// gaya Overlay, dengan 80 px kiri untuk traffic lights. Label tombol panel menyebut aksinya, jadi
// tanpa aria-pressed agar keadaan tidak dibacakan dua kali.
export function Toolbar() {
  const { sidebarOpen, inspectorOpen, toggleSidebar, toggleInspector } = useStudio();
  const sidebarLabel = sidebarOpen ? "Sembunyikan sidebar" : "Tampilkan sidebar";
  const inspectorLabel = inspectorOpen ? "Sembunyikan inspector" : "Tampilkan inspector";
  return (
    <header
      data-tauri-drag-region
      className="flex h-11 items-center gap-1 border-b border-border bg-card pr-2 pl-20"
    >
      <Tooltip label={sidebarLabel} shortcut="⌘\">
        <Button
          id={SIDEBAR_TOGGLE_ID}
          variant="ghost"
          size="ikon"
          aria-label={sidebarLabel}
          onClick={toggleSidebar}
        >
          <PanelLeft strokeWidth={1.5} />
        </Button>
      </Tooltip>
      <div className="ml-2 flex min-w-0 flex-1">
        <BriefBar />
        <div data-tauri-drag-region className="h-full min-w-6 flex-1" />
      </div>
      <Tooltip label={inspectorLabel} shortcut="⌘⌥\">
        <Button
          id={INSPECTOR_TOGGLE_ID}
          variant="ghost"
          size="ikon"
          aria-label={inspectorLabel}
          onClick={toggleInspector}
        >
          <PanelRight strokeWidth={1.5} />
        </Button>
      </Tooltip>
    </header>
  );
}
