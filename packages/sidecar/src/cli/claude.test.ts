import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import {
  ClaudeRunError,
  claudeArgs,
  InvalidOutputError,
  runClaude,
  summarizeStream,
} from "./claude.ts";
import { LimitReachedError, limitInText } from "./limits.ts";
import { parseEventLine, type SpawnLines } from "./stream.ts";

// Fixture asli T-102 (test/fixtures/claude/README.md).
const fixture = (file: string) =>
  readFileSync(new URL(`../../test/fixtures/claude/${file}`, import.meta.url), "utf8");
const lines = (file: string) => fixture(file).trim().split("\n");

const Headline = z.strictObject({ headline: z.string(), word_count: z.int() });
const CWD = "/Users/contoh/Laras/projects/kopi";

// spawn palsu: setiap panggilan memutar daftar baris dan exit code berikutnya.
function fakeSpawn(runs: { lines: string[]; exitCode?: number; stderr?: string }[]) {
  const calls: { file: string; args: string[]; cwd: string }[] = [];
  const spawn: SpawnLines = async (file, args, options, onLine) => {
    calls.push({ file, args, cwd: options.cwd });
    const run = runs[Math.min(calls.length - 1, runs.length - 1)];
    for (const line of run?.lines ?? []) onLine(line);
    return { exitCode: run?.exitCode ?? 0, stderr: run?.stderr ?? "" };
  };
  return { spawn, calls };
}

// Mengganti structured_output pada event result fixture JSON Schema.
const withOutput = (output: unknown) =>
  lines("print-json-schema.jsonl").map((line) => {
    const event = JSON.parse(line);
    if (event.type !== "result") return line;
    const { structured_output: _, ...rest } = event;
    return JSON.stringify(output === undefined ? rest : { ...rest, structured_output: output });
  });

const options = (spawn: SpawnLines) => ({
  claudePath: "/Users/contoh/.local/bin/claude",
  cwd: CWD,
  prompt: "Tulis satu headline.",
  schema: Headline,
  spawn,
});

describe("claudeArgs", () => {
  it("memakai flag hasil T-102 dan isolasi ADR-013", () => {
    expect(claudeArgs("Halo", "claude-opus-5-5", { type: "object" })).toEqual([
      "-p",
      "Halo",
      "--model",
      "claude-opus-5-5",
      "--output-format",
      "stream-json",
      "--verbose",
      "--tools",
      "Read",
      "--permission-prompts",
      "none",
      "--no-session-persistence",
      "--setting-sources",
      "project",
      "--strict-mcp-config",
      "--disable-slash-commands",
      "--json-schema",
      '{"type":"object"}',
    ]);
  });
});

describe("parsing stream-json", () => {
  it("meringkas result, structured_output, dan rate_limit_event dari fixture JSON Schema", () => {
    const events = lines("print-json-schema.jsonl").map(parseEventLine);
    expect(events.every((event) => event !== null)).toBe(true);
    const stream = summarizeStream(events.flatMap((e) => (e ? [e] : [])));
    expect(stream.result).toMatchObject({
      isError: false,
      subtype: "success",
      structuredOutput: { headline: "Pagi Cerah Berawal dari Secangkir Kopi", word_count: 6 },
    });
    expect(stream.result?.costUsd).toBeGreaterThan(0);
    expect(stream.rateLimit).toMatchObject({ status: "allowed" });
    expect(stream.rateLimit?.resetsAt).toBeTypeOf("number");
  });

  it("mencatat penolakan izin dan tetap membaca event sesudah result", () => {
    const events = lines("print-permission-denied.jsonl").flatMap((l) => parseEventLine(l) ?? []);
    expect(events.at(-1)?.type).toBe("system");
    const stream = summarizeStream(events);
    expect(stream.permissionDenials).toEqual([
      { toolName: "Read", toolInput: expect.objectContaining({ file_path: "/etc/hosts" }) },
    ]);
  });

  it("mengabaikan baris yang bukan event JSON", () => {
    expect(parseEventLine("Peringatan: bukan JSON")).toBeNull();
    expect(parseEventLine('{"tanpa":"type"}')).toBeNull();
  });
});

describe("runClaude", () => {
  it("menjalankan Claude di folder project, meneruskan event, dan memvalidasi output", async () => {
    const { spawn, calls } = fakeSpawn([{ lines: lines("print-json-schema.jsonl") }]);
    const onEvent = vi.fn();
    const run = await runClaude({ ...options(spawn), onEvent });
    expect(run.data).toEqual({ headline: "Pagi Cerah Berawal dari Secangkir Kopi", word_count: 6 });
    expect(run.attempts).toBe(1);
    expect(onEvent).toHaveBeenCalledTimes(lines("print-json-schema.jsonl").length);
    expect(calls[0]?.cwd).toBe(CWD);
    const schemaArg = calls[0]?.args[calls[0].args.indexOf("--json-schema") + 1] ?? "";
    expect(JSON.parse(schemaArg)).toMatchObject({
      $schema: "http://json-schema.org/draft-07/schema#",
      type: "object",
      required: ["headline", "word_count"],
    });
  });

  it("mengulang dengan daftar masalah validasi lalu berhasil di percobaan kedua", async () => {
    const { spawn, calls } = fakeSpawn([
      { lines: withOutput({ headline: 5, word_count: 6 }) },
      { lines: lines("print-json-schema.jsonl") },
    ]);
    const run = await runClaude(options(spawn));
    expect(run.attempts).toBe(2);
    const retryPrompt = calls[1]?.args[1] ?? "";
    expect(retryPrompt).toMatch(/^Tulis satu headline\.\n\nOutput sebelumnya tidak lolos validasi/);
    expect(retryPrompt).toContain("- headline: ");
  });

  it("gagal dengan InvalidOutputError setelah 3 percobaan, termasuk tanpa StructuredOutput", async () => {
    const { spawn, calls } = fakeSpawn([{ lines: withOutput(undefined) }]);
    const error = await runClaude(options(spawn)).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(InvalidOutputError);
    expect((error as InvalidOutputError).issues).toEqual([
      "Hasil tidak dikirim lewat tool StructuredOutput",
    ]);
    expect(calls).toHaveLength(3);
  });

  it("melempar ClaudeRunError dengan stderr bila CLI keluar tanpa result", async () => {
    const stderr = fixture("stream-json-without-verbose.stderr.txt");
    const { spawn } = fakeSpawn([{ lines: [], exitCode: 1, stderr }]);
    const error = await runClaude(options(spawn)).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ClaudeRunError);
    expect((error as ClaudeRunError).detail).toContain("requires --verbose");
  });

  it("menolak cwd relatif", async () => {
    const { spawn } = fakeSpawn([]);
    await expect(runClaude({ ...options(spawn), cwd: "projects/kopi" })).rejects.toThrow(
      "cwd Claude harus path absolut",
    );
  });
});

// Fixture SINTETIS: status rate limit selain "allowed" dan pesan kuota habis belum pernah
// teramati pada CLI asli (KNOWLEDGE). Bentuk event mengikuti fixture T-102.
describe("batas kuota (sintetis)", () => {
  const rateLimit = (status: string) =>
    JSON.stringify({ type: "rate_limit_event", rate_limit_info: { status, resetsAt: 1760000000 } });
  const failedResult = (text: string) =>
    JSON.stringify({ type: "result", subtype: "success", is_error: true, result: text });

  it("panggilan gagal dengan status bukan allowed menjadi LimitReachedError", async () => {
    const { spawn } = fakeSpawn([
      { lines: [rateLimit("rejected"), failedResult("API Error")], exitCode: 1 },
    ]);
    const error = await runClaude(options(spawn)).catch((e: unknown) => e);
    expect(error).toBeInstanceOf(LimitReachedError);
    expect((error as LimitReachedError).resetsAt).toEqual(new Date(1760000000 * 1000));
  });

  it("pesan kuota di result menjadi LimitReachedError walau status allowed", async () => {
    const message = "Claude AI usage limit reached|1760003600";
    const { spawn } = fakeSpawn([
      { lines: [rateLimit("allowed"), failedResult(message)], exitCode: 1 },
    ]);
    const error = await runClaude(options(spawn)).catch((e: unknown) => e);
    expect((error as LimitReachedError).resetsAt).toEqual(new Date(1760003600 * 1000));
  });

  it("status bukan allowed pada panggilan sukses hanya dicatat", async () => {
    const { spawn } = fakeSpawn([
      {
        lines: [
          rateLimit("allowed_warning"),
          ...lines("print-json-schema.jsonl").filter((l) => !l.includes("rate_limit_event")),
        ],
      },
    ]);
    const run = await runClaude(options(spawn));
    expect(run.rateLimit?.status).toBe("allowed_warning");
  });

  it("kegagalan lain dengan status allowed tetap ClaudeRunError", async () => {
    const { spawn } = fakeSpawn([
      { lines: [rateLimit("allowed"), failedResult("Overloaded")], exitCode: 1 },
    ]);
    await expect(runClaude(options(spawn))).rejects.toBeInstanceOf(ClaudeRunError);
  });

  it("limitInText mengenali pola pesan kuota", () => {
    expect(limitInText("You've hit your usage limit")).toEqual({ resetsAt: null });
    expect(limitInText("Rate limit exceeded, try later")).toEqual({ resetsAt: null });
    expect(limitInText("Overloaded")).toBeNull();
  });
});
