import { Folder, LayoutGrid, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../../lib/utils.ts";
import { useStudio } from "../../stores/studio.ts";

// Item sidebar DESIGN 10.4: tinggi 28 px, padding kiri 12 px, ikon 16 px; hover memakai
// --surface-hover, terpilih memakai --surface-selected dengan bobot 500.
function SidebarItem({
  icon: Icon,
  selected,
  onSelect,
  children,
}: {
  icon: LucideIcon;
  selected: boolean;
  onSelect?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-current={selected ? "true" : undefined}
      onClick={onSelect}
      className={cn(
        "flex h-7 w-full items-center gap-2 rounded-md pr-2 pl-3 text-left text-body text-foreground transition-colors duration-(--dur-fast) ease-(--ease-out) hover:bg-accent",
        selected && "bg-selected font-medium hover:bg-selected",
      )}
    >
      <Icon className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.5} aria-hidden />
      <span className="truncate">{children}</span>
    </button>
  );
}

export const SIDEBAR_ID = "sidebar";

// Sidebar 240 px (DESIGN 5, 6): daftar project lalu bagian workspace. Brand Kit, Knowledge,
// Copy Guide, dan Referensi ditambahkan bersama epic-nya (E-301, E-302).
export function Sidebar() {
  const { sidebarOpen, projects, activeProject, selectProject } = useStudio();
  return (
    <nav
      id={SIDEBAR_ID}
      aria-label="Project"
      inert={!sidebarOpen}
      className={cn(
        "shrink-0 overflow-hidden bg-card transition-[width] duration-(--dur-base) ease-(--ease-out)",
        sidebarOpen ? "w-60 border-r border-border" : "w-0",
      )}
    >
      <div className="flex w-60 flex-col gap-4 p-2">
        <section>
          <h2 className="px-3 pt-2 pb-1 text-label text-muted-foreground">Project</h2>
          <ul>
            {projects.map((project) => (
              <li key={project.slug}>
                <SidebarItem
                  icon={Folder}
                  selected={project.slug === activeProject}
                  onSelect={() => selectProject(project.slug)}
                >
                  {project.name}
                </SidebarItem>
              </li>
            ))}
          </ul>
        </section>
        {activeProject && (
          <ul>
            <li>
              <SidebarItem icon={LayoutGrid} selected>
                Konten
              </SidebarItem>
            </li>
          </ul>
        )}
      </div>
    </nav>
  );
}
