import type { ProjectSummary } from "@laras/shared";
import { create } from "zustand";
import type { SidecarState } from "../lib/sidecar.ts";

// Keadaan Studio (T-204): sambungan sidecar, project, dan panel yang terbuka. Di bawah lebar
// 1280 px inspector menjadi overlay (DESIGN 5), jadi awalnya tertutup.
type StudioStore = {
  sidecar: SidecarState;
  // Penyebab gagal membaca daftar project; kalimatnya disusun status bar.
  projectsError: string | null;
  projects: ProjectSummary[];
  activeProject: string | null;
  sidebarOpen: boolean;
  inspectorOpen: boolean;
  setSidecar: (state: SidecarState) => void;
  setProjectsError: (cause: string) => void;
  setProjects: (projects: ProjectSummary[]) => void;
  selectProject: (slug: string) => void;
  toggleSidebar: () => void;
  toggleInspector: () => void;
};

const WIDE = 1280;

export const useStudio = create<StudioStore>()((set) => ({
  sidecar: "starting",
  projectsError: null,
  projects: [],
  activeProject: null,
  sidebarOpen: true,
  inspectorOpen: typeof window === "undefined" || window.innerWidth >= WIDE,
  // Keadaan sidecar baru menggantikan galat lama agar status terbaru selalu terlihat.
  setSidecar: (sidecar) => set({ sidecar, projectsError: null }),
  setProjectsError: (projectsError) => set({ projectsError }),
  // Project aktif dipertahankan bila masih ada; bila tidak, project pertama.
  setProjects: (projects) =>
    set((state) => ({
      projects,
      projectsError: null,
      activeProject: projects.some((p) => p.slug === state.activeProject)
        ? state.activeProject
        : (projects[0]?.slug ?? null),
    })),
  selectProject: (activeProject) => set({ activeProject }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleInspector: () => set((state) => ({ inspectorOpen: !state.inspectorOpen })),
}));
