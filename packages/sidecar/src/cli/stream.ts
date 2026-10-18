import { spawn } from "node:child_process";

// Menjalankan CLI dan meneruskan stdout baris per baris (stream-json). stdin ditutup karena
// CLI bisa membaca stdin bila bukan TTY (ADR-012); AbortSignal mematikan proses.

// Event JSONL dari --json / stream-json: objek dengan field type berupa string.
export type StreamEvent = { type: string; subtype?: string; [key: string]: unknown };

export function parseEventLine(line: string): StreamEvent | null {
  try {
    const value: unknown = JSON.parse(line);
    if (typeof value !== "object" || value === null || !("type" in value)) return null;
    return typeof value.type === "string" ? (value as StreamEvent) : null;
  } catch {
    return null;
  }
}

export type SpawnOptions = { cwd: string; env?: Record<string, string>; signal?: AbortSignal };
export type LineProcess = { exitCode: number | null; stderr: string };
export type SpawnLines = (
  file: string,
  args: string[],
  options: SpawnOptions,
  onLine: (line: string) => void,
) => Promise<LineProcess>;

export const spawnLines: SpawnLines = (file, args, { cwd, env, signal }, onLine) =>
  new Promise((resolve, reject) => {
    const child = spawn(file, args, {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
      env: env ? { ...process.env, ...env } : process.env,
      ...(signal ? { signal } : {}),
    });
    let buffer = "";
    let stderr = "";
    child.stdout.setEncoding("utf8").on("data", (chunk: string) => {
      buffer += chunk;
      let newline = buffer.indexOf("\n");
      while (newline >= 0) {
        const line = buffer.slice(0, newline);
        buffer = buffer.slice(newline + 1);
        if (line.trim()) onLine(line);
        newline = buffer.indexOf("\n");
      }
    });
    child.stderr.setEncoding("utf8").on("data", (chunk: string) => {
      stderr += chunk;
    });
    child.on("error", reject);
    child.on("close", (exitCode) => {
      if (buffer.trim()) onLine(buffer);
      resolve({ exitCode, stderr });
    });
  });
