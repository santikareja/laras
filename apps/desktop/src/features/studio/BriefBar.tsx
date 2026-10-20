import { type FormEvent, type KeyboardEvent, useState } from "react";
import { Button } from "../../components/ui/button.tsx";
import { Textarea } from "../../components/ui/textarea.tsx";
import { Tooltip } from "../../components/ui/tooltip.tsx";
import { client, DRY_RUN } from "../../lib/connection.ts";
import { cn } from "../../lib/utils.ts";
import { isJobBusy, useJob } from "../../stores/job.ts";
import { useStudio } from "../../stores/studio.ts";

export const BRIEF_ID = "brief";
const MAX_LINES = 4;

// Tinggi textarea mengikuti isinya, satu sampai empat baris (DESIGN 10.2); lebih dari itu bergulir.
function fitHeight(field: HTMLTextAreaElement): boolean {
  field.style.height = "auto";
  const style = getComputedStyle(field);
  const borders = field.offsetHeight - field.clientHeight;
  const padding = Number.parseFloat(style.paddingTop) + Number.parseFloat(style.paddingBottom);
  const line = Number.parseFloat(style.lineHeight);
  const height = Math.min(field.scrollHeight, line * MAX_LINES + padding) + borders;
  field.style.height = `${height}px`;
  return field.scrollHeight > line + padding + 1;
}

// Kolom brief dan tombol Buat di toolbar (DESIGN 6, 10.2). Toolbar tetap 44 px, jadi brief lebih
// dari satu baris tumbuh ke bawah sebagai lapisan di atas kanvas selama difokus. ⌘↵ menjalankan
// Buat (DESIGN 13).
export function BriefBar() {
  const [brief, setBrief] = useState("");
  const [expanded, setExpanded] = useState(false);
  const { activeProject, sidecar } = useStudio();
  const busy = useJob((state) => isJobBusy(state.view));
  const text = brief.trim();
  const ready = text !== "" && activeProject !== null && sidecar === "ready" && !busy;

  async function buat(event?: FormEvent) {
    event?.preventDefault();
    if (!ready || activeProject === null) return;
    const job = useJob.getState();
    job.start(activeProject, text);
    try {
      const result = await client.request("job.start", {
        project: activeProject,
        brief: text,
        dryRun: DRY_RUN,
      });
      const [jobId] = result.jobIds;
      if (jobId) job.started(jobId);
    } catch (error) {
      job.failStart(error instanceof Error ? error.message : String(error));
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.metaKey && event.key === "Enter") void buat(event);
  }

  return (
    <form onSubmit={buat} className="flex w-full min-w-0 max-w-2xl items-center gap-2">
      <label htmlFor={BRIEF_ID} className="shrink-0 text-label text-muted-foreground">
        Brief
      </label>
      <div className="relative h-7 min-w-0 flex-1">
        <Textarea
          id={BRIEF_ID}
          rows={1}
          value={brief}
          placeholder="Tulis brief, misalnya promo akhir pekan"
          onChange={(event) => {
            setBrief(event.target.value);
            setExpanded(fitHeight(event.target));
          }}
          onKeyDown={onKeyDown}
          onFocus={(event) => setExpanded(fitHeight(event.target))}
          onBlur={(event) => {
            // Di luar fokus brief kembali satu baris agar tidak menutupi kanvas.
            event.target.style.height = "";
            event.target.scrollTop = 0;
            setExpanded(false);
          }}
          className={cn(
            "absolute inset-x-0 top-0 z-20 overflow-y-hidden",
            expanded && "overflow-y-auto bg-popover shadow-(--shadow-float)",
          )}
        />
      </div>
      <Tooltip label="Buat desain dari brief" shortcut="⌘↵">
        <Button type="submit" variant="utama" size="besar" disabled={!ready}>
          Buat
        </Button>
      </Tooltip>
    </form>
  );
}
