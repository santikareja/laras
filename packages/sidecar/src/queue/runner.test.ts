import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { JobStartParams, RpcErrorCode } from "@laras/shared";
import { afterAll, describe, expect, it } from "vitest";
import { RpcError } from "../rpc/server.ts";
import { prepareDataDir } from "../storage/data-dir.ts";
import { createJobRunner } from "./runner.ts";

const FIXTURES = new URL("../../../../fixtures/", import.meta.url).pathname;
const tmp = mkdtempSync(join(tmpdir(), "laras-runner-"));
afterAll(() => rmSync(tmp, { recursive: true, force: true }));

type Sent = { name: string; params: Record<string, unknown> };

describe("runner job walking skeleton (T-202)", () => {
  it("dry-run mengirim event setiap tahap lalu job.finished dengan PNG", {
    timeout: 60_000,
  }, async () => {
    await prepareDataDir(tmp, join(FIXTURES, "brands"));
    const sent: Sent[] = [];
    const runner = createJobRunner({
      dataDir: tmp,
      demoAssetsDir: join(FIXTURES, "demo-assets"),
      notify: (name, params) => sent.push({ name, params }),
      log: () => {},
      now: () => new Date("2026-10-20T10:00:00.123Z"),
    });
    const params = JobStartParams.parse({
      project: "kopi-lembayung",
      brief: "Ajak pekerja mampir pagi untuk kopi susu gula aren.",
      dryRun: true,
    });
    expect(runner.start(params)).toEqual({
      briefId: "brief-20261020100000123",
      jobIds: ["brief-20261020100000123-v1"],
    });
    expect(() => runner.start(params)).toThrow(
      expect.objectContaining({ code: RpcErrorCode.busy }),
    );
    await runner.idle();

    const completed = sent
      .filter((s) => s.name === "job.event")
      .map((s) => s.params.event as { stage: string; type: string })
      .filter((event) => event.type === "completed")
      .map((event) => event.stage);
    expect(completed).toEqual([
      "plan",
      "copy",
      "layout",
      "assets",
      "render",
      "qa",
      "revise",
      "assets",
      "render",
      "qa",
    ]);
    const finished = sent.filter((s) => s.name === "job.finished");
    expect(finished).toHaveLength(1);
    expect(finished[0]?.params).toMatchObject({
      jobId: "brief-20261020100000123-v1",
      status: "done",
    });
    const slides = finished[0]?.params.slides as string[];
    expect(slides).toHaveLength(1);
    expect(slides.every((file) => existsSync(file))).toBe(true);
  });

  it("menolak project yang tidak ada", () => {
    const runner = createJobRunner({
      dataDir: tmp,
      demoAssetsDir: join(FIXTURES, "demo-assets"),
      notify: () => {},
      log: () => {},
    });
    const params = JobStartParams.parse({ project: "tidak-ada", brief: "x", dryRun: true });
    expect(() => runner.start(params)).toThrow(RpcError);
  });
});
