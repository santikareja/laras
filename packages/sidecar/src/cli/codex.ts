import { isAbsolute } from "node:path";
import { LimitReachedError, limitInText } from "./limits.ts";
import { parseEventLine, type SpawnLines, type StreamEvent, spawnLines } from "./stream.ts";

// Adapter Codex CLI untuk aset gambar (ARCH 4.5, ADR-012): cwd folder project (AGENTS.md
// project terbaca), sandbox read-only, stdin ditutup. Gambar ditulis Codex ke
// $CODEX_HOME/generated_images/<thread_id>/; thread_id dibaca dari event thread.started.

export class CodexRunError extends Error {
  readonly detail: string;

  constructor(message: string, detail: string) {
    super(message);
    this.name = "CodexRunError";
    this.detail = detail;
  }
}

export type CodexRun = {
  threadId: string;
  usage: Record<string, number>;
  messages: string[];
};

export type RunCodexOptions = {
  codexPath: string;
  cwd: string;
  prompt: string;
  env?: Record<string, string>;
  signal?: AbortSignal;
  onEvent?: (event: StreamEvent) => void;
  spawn?: SpawnLines;
};

export function codexArgs(cwd: string, prompt: string): string[] {
  return [
    "exec",
    "--cd",
    cwd,
    "--sandbox",
    "read-only",
    "--skip-git-repo-check",
    "--json",
    "--ephemeral",
    "--ignore-user-config",
    prompt,
  ];
}

const record = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};

export async function runCodex(options: RunCodexOptions): Promise<CodexRun> {
  if (!isAbsolute(options.cwd)) throw new Error("cwd Codex harus path absolut folder project");
  let threadId: string | null = null;
  const usage: Record<string, number> = {};
  const messages: string[] = [];
  const errors: string[] = [];
  const spawn = options.spawn ?? spawnLines;
  const { exitCode, stderr } = await spawn(
    options.codexPath,
    codexArgs(options.cwd, options.prompt),
    {
      cwd: options.cwd,
      ...(options.env ? { env: options.env } : {}),
      ...(options.signal ? { signal: options.signal } : {}),
    },
    (line) => {
      const event = parseEventLine(line);
      if (!event) return;
      options.onEvent?.(event);
      if (event.type === "thread.started" && typeof event.thread_id === "string") {
        threadId = event.thread_id;
      }
      if (event.type === "turn.completed") {
        for (const [key, value] of Object.entries(record(event.usage))) {
          if (typeof value === "number") usage[key] = value;
        }
      }
      const item = record(event.item);
      if (item.type === "agent_message" && typeof item.text === "string") messages.push(item.text);
      // Bentuk event error Codex belum terverifikasi; disimpan utuh untuk pesan dan deteksi kuota.
      if (event.type === "error" || event.type.endsWith(".failed"))
        errors.push(JSON.stringify(event));
    },
  );
  if (exitCode === 0 && threadId !== null && errors.length === 0) {
    return { threadId, usage, messages };
  }
  const text = [...errors, ...messages, stderr].join("\n").trim();
  const limit = limitInText(text);
  if (limit) throw new LimitReachedError("Batas kuota Codex tercapai", limit.resetsAt);
  throw new CodexRunError(`Codex gagal (exit ${exitCode ?? "dihentikan"})`, text.slice(-2000));
}
