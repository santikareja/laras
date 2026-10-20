import type { JobEvent, JobFinishedParams } from "@laras/shared";
import { describe, expect, it } from "vitest";
import {
  applyJobEvent,
  applyJobFinished,
  BAR_STAGES,
  failJobStart,
  interruptJob,
  type JobView,
  newJobView,
} from "./job.ts";

const JOB = "brief-1-v1";
const at = "2026-10-21T10:00:00.000Z";

function run(view: JobView, events: [JobEvent["stage"], JobEvent["type"]][]): JobView {
  return events.reduce(
    (current, [stage, type], i) =>
      applyJobEvent(current, {
        jobId: JOB,
        event: {
          at,
          step: i + 1,
          stage,
          type,
          ...(type === "completed" ? { durationMs: 1200 } : {}),
        },
      }),
    view,
  );
}

const states = (view: JobView) => BAR_STAGES.map((stage) => view.bars[stage].state);

describe("store job Bilah Laras (T-205)", () => {
  it("menandai bilah berjalan lalu selesai dengan durasinya", () => {
    const view = run(newJobView("kopi-lembayung", "Promo"), [
      ["plan", "started"],
      ["plan", "completed"],
      ["copy", "started"],
    ]);
    expect(states(view)).toEqual(["done", "running", "waiting", "waiting", "waiting", "waiting"]);
    expect(view.bars.plan.durationMs).toBe(1200);
    expect(view).toMatchObject({ jobId: JOB, phase: "running", stage: "copy", round: 0 });
  });

  it("revisi mengembalikan Layout sampai QA ke menunggu dan menaikkan putaran", () => {
    const first: [JobEvent["stage"], JobEvent["type"]][] = BAR_STAGES.flatMap((stage) => [
      [stage, "started"],
      [stage, "completed"],
    ]);
    const view = run(newJobView("kopi-lembayung", "Promo"), [...first, ["revise", "started"]]);
    expect(states(view)).toEqual(["done", "done", "running", "waiting", "waiting", "waiting"]);
    expect(view.round).toBe(1);
  });

  it("gagal menandai bilah tahapnya dan menyimpan pesannya", () => {
    const view = applyJobEvent(run(newJobView("a", "b"), [["assets", "started"]]), {
      jobId: JOB,
      event: { at, step: 4, stage: "assets", type: "failed", message: "codex belum login" },
    });
    expect(view.bars.assets.state).toBe("failed");
    expect(view.error).toBe("codex belum login");
  });

  it("job.finished membawa PNG, hasil QA, dan menandai bilah yang menunggu kuota", () => {
    const running = run(newJobView("a", "b"), [["render", "started"]]);
    const finished: JobFinishedParams = {
      jobId: JOB,
      status: "done",
      slides: ["/x/slides/09-1.png"],
      qaPassed: false,
      error: null,
    };
    expect(applyJobFinished(running, finished)).toMatchObject({
      phase: "finished",
      status: "done",
      slides: ["/x/slides/09-1.png"],
      qaPassed: false,
    });
    const quota = applyJobFinished(running, { ...finished, status: "waiting_quota", slides: [] });
    expect(quota.bars.render.state).toBe("quota");
  });

  it("mengabaikan event job lain dan mencatat kegagalan job.start", () => {
    const view = run(newJobView("a", "b"), [["plan", "started"]]);
    const other = applyJobEvent(view, {
      jobId: "brief-2-v1",
      event: { at, step: 2, stage: "copy", type: "started" },
    });
    expect(other).toBe(view);
    expect(failJobStart(newJobView("a", "b"), "Masih ada konten yang sedang dibuat")).toMatchObject(
      { phase: "finished", status: "failed", error: "Masih ada konten yang sedang dibuat" },
    );
  });

  it("sidecar yang berhenti menghentikan job berjalan tetapi tidak mengubah job selesai", () => {
    const running = run(newJobView("a", "b"), [["layout", "started"]]);
    const stopped = interruptJob(running);
    expect(stopped).toMatchObject({ phase: "finished", status: "interrupted" });
    expect(stopped.bars.layout.state).toBe("failed");
    const done = applyJobFinished(running, {
      jobId: JOB,
      status: "done",
      slides: [],
      qaPassed: true,
      error: null,
    });
    expect(interruptJob(done)).toBe(done);
  });
});
