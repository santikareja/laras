import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { CodexRunError, codexArgs, runCodex } from "./codex.ts";
import { LimitReachedError } from "./limits.ts";
import type { SpawnLines } from "./stream.ts";

// Fixture asli T-101 (test/fixtures/codex/README.md).
const lines = (file: string) =>
  readFileSync(new URL(`../../test/fixtures/codex/${file}`, import.meta.url), "utf8")
    .trim()
    .split("\n");

const CWD = "/Users/contoh/Laras/projects/kopi";

const fakeSpawn = (output: string[], exitCode = 0, stderr = ""): SpawnLines =>
  vi.fn(async (_file, _args, _options, onLine) => {
    for (const line of output) onLine(line);
    return { exitCode, stderr };
  });

const options = (spawn: SpawnLines) => ({
  codexPath: "/Users/contoh/.local/bin/codex",
  cwd: CWD,
  prompt: "Satu foto",
  spawn,
});

describe("codexArgs", () => {
  it("memakai pemanggilan ADR-012", () => {
    expect(codexArgs(CWD, "Satu foto")).toEqual([
      "exec",
      "--cd",
      CWD,
      "--sandbox",
      "read-only",
      "--skip-git-repo-check",
      "--json",
      "--ephemeral",
      "--ignore-user-config",
      "Satu foto",
    ]);
  });
});

describe("runCodex", () => {
  it("membaca thread_id, usage, dan pesan agent dari fixture T-101", async () => {
    const spawn = fakeSpawn(lines("exec-image-cwd-project.jsonl"));
    const onEvent = vi.fn();
    const run = await runCodex({ ...options(spawn), onEvent });
    expect(run.threadId).toBe("01a14b2f-a6f3-7240-a36c-c0ba84bd6587");
    expect(run.usage).toMatchObject({ input_tokens: 79186, cached_input_tokens: 54784 });
    expect(run.messages.at(-1)).toContain("AGENTS-OK");
    expect(onEvent).toHaveBeenCalledTimes(5);
    expect(spawn).toHaveBeenCalledWith(
      "/Users/contoh/.local/bin/codex",
      codexArgs(CWD, "Satu foto"),
      { cwd: CWD },
      expect.any(Function),
    );
  });

  it("melempar CodexRunError bila exit non-zero atau tanpa thread.started", async () => {
    const failed = runCodex(options(fakeSpawn([], 1, "Not logged in\n")));
    await expect(failed).rejects.toBeInstanceOf(CodexRunError);
    await expect(failed).rejects.toMatchObject({ detail: "Not logged in" });
    const noThread = runCodex(options(fakeSpawn(lines("exec-image-cwd-project.jsonl").slice(1))));
    await expect(noThread).rejects.toBeInstanceOf(CodexRunError);
  });

  // SINTETIS: perilaku Codex saat kuota habis belum teramati (KNOWLEDGE).
  it("pesan batas kuota menjadi LimitReachedError (sintetis)", async () => {
    const error = JSON.stringify({ type: "error", message: "You've hit your usage limit." });
    const spawn = fakeSpawn([lines("exec-image-cwd-project.jsonl")[0] ?? "", error], 1);
    await expect(runCodex(options(spawn))).rejects.toBeInstanceOf(LimitReachedError);
  });

  it("menolak cwd relatif", async () => {
    await expect(runCodex({ ...options(fakeSpawn([])), cwd: "kopi" })).rejects.toThrow(
      "cwd Codex harus path absolut",
    );
  });
});
