import { convertFileSrc } from "@tauri-apps/api/core";
import { PenLine } from "lucide-react";
import { EmptyState } from "../../components/empty-state.tsx";
import { Button } from "../../components/ui/button.tsx";
import { useJob } from "../../stores/job.ts";
import { useStudio } from "../../stores/studio.ts";
import { BRIEF_ID } from "./BriefBar.tsx";

// Isi kanvas (DESIGN 6, 10.8): halaman kosong sebelum ada hasil, kosong selama job berjalan
// (progres di Bilah Laras), lalu PNG hasil. PNG master berukuran 2×, jadi dideklarasikan `2x`
// agar tampil paling besar 100% skala asli; radius 0 dan bayangan float (DESIGN 7).
export function Preview() {
  const { projects, activeProject } = useStudio();
  const view = useJob((state) => state.view);
  const result = view?.project === activeProject ? view : null;
  const slide = result?.slides[0];
  if (result && slide) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <img
          srcSet={`${convertFileSrc(slide)} 2x`}
          alt={`Desain dari brief: ${result.brief}`}
          className="h-auto max-h-full w-auto max-w-full shadow-(--shadow-float)"
        />
      </div>
    );
  }
  const project = projects.find((p) => p.slug === activeProject);
  if (!project || (result && result.phase !== "finished")) return null;
  return (
    <EmptyState
      icon={PenLine}
      title={`Belum ada konten di ${project.name}`}
      action={
        <Button
          variant="utama"
          size="besar"
          onClick={() => document.getElementById(BRIEF_ID)?.focus()}
        >
          Tulis brief
        </Button>
      }
    >
      Tulis brief pertama untuk membuat desain.
    </EmptyState>
  );
}
