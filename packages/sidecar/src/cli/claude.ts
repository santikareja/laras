import { readFileSync } from "node:fs";
import { isAbsolute } from "node:path";
import { z } from "zod";
import { LimitReachedError, limitInText } from "./limits.ts";
import { type SpawnLines, spawnLines } from "./stream.ts";

// Adapter Claude CLI (ARCH 4.5, ADR-011, ADR-013): satu tahap pipeline = satu panggilan
// `claude -p` dengan output tervalidasi skema Zod tahap, diulang maksimal 2 kali (PRD F7).

export const DEFAULT_MODEL = "claude-opus-5-5";
const MAX_RETRIES = 2;
const RETRY_PROMPT = readFileSync(
  new URL("../prompts/retry-invalid-output.md", import.meta.url),
  "utf8",
);

export type ClaudeEvent = { type: string; subtype?: string; [key: string]: unknown };
export type RateLimitInfo = { status: string; resetsAt: number | null };
export type PermissionDenial = { toolName: string; toolInput: unknown };

export type ClaudeStream = {
  result: {
    isError: boolean;
    subtype: string;
    text: string;
    structuredOutput: unknown;
    costUsd: number;
  } | null;
  rateLimit: RateLimitInfo | null;
  permissionDenials: PermissionDenial[];
};

export class ClaudeRunError extends Error {
  readonly detail: string;

  constructor(message: string, detail: string) {
    super(message);
    this.name = "ClaudeRunError";
    this.detail = detail;
  }
}

export class InvalidOutputError extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    super(`Output Claude tidak valid setelah ${MAX_RETRIES + 1} percobaan`);
    this.name = "InvalidOutputError";
    this.issues = issues;
  }
}

// Flag hasil uji T-102 (KNOWLEDGE): stream-json wajib --verbose; isolasi dari konfigurasi
// global pengguna (ADR-013); hanya tool Read; izin yang dibutuhkan langsung ditolak.
export function claudeArgs(prompt: string, model: string, jsonSchema: object): string[] {
  return [
    "-p",
    prompt,
    "--model",
    model,
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
    JSON.stringify(jsonSchema),
  ];
}

export function parseLine(line: string): ClaudeEvent | null {
  try {
    const value: unknown = JSON.parse(line);
    if (typeof value !== "object" || value === null || !("type" in value)) return null;
    return typeof value.type === "string" ? (value as ClaudeEvent) : null;
  } catch {
    return null;
  }
}

const num = (value: unknown) => (typeof value === "number" ? value : null);
const str = (value: unknown) => (typeof value === "string" ? value : "");
const record = (value: unknown): Record<string, unknown> =>
  typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};

// Ringkasan stream: event `result` (bisa diikuti event lain, mis. system/task_summary),
// rate_limit_event terakhir, dan penolakan izin untuk log job.
export function summarizeStream(events: ClaudeEvent[]): ClaudeStream {
  let result: ClaudeStream["result"] = null;
  let rateLimit: RateLimitInfo | null = null;
  const permissionDenials: PermissionDenial[] = [];
  for (const event of events) {
    if (event.type === "rate_limit_event") {
      const info = record(event.rate_limit_info);
      rateLimit = { status: str(info.status), resetsAt: num(info.resetsAt) };
    }
    if (event.type === "result") {
      result = {
        isError: event.is_error === true,
        subtype: str(event.subtype),
        text: str(event.result),
        structuredOutput: event.structured_output,
        costUsd: num(event.total_cost_usd) ?? 0,
      };
      const denials = Array.isArray(event.permission_denials) ? event.permission_denials : [];
      for (const denial of denials.map(record)) {
        permissionDenials.push({ toolName: str(denial.tool_name), toolInput: denial.tool_input });
      }
    }
  }
  return { result, rateLimit, permissionDenials };
}

export type RunClaudeOptions<T> = {
  claudePath: string;
  cwd: string;
  prompt: string;
  schema: z.ZodType<T>;
  model?: string;
  env?: Record<string, string>;
  signal?: AbortSignal;
  onEvent?: (event: ClaudeEvent) => void;
  spawn?: SpawnLines;
};

export type ClaudeRun<T> = {
  data: T;
  attempts: number;
  costUsd: number;
  rateLimit: RateLimitInfo | null;
  permissionDenials: PermissionDenial[];
};

export async function runClaude<T>(options: RunClaudeOptions<T>): Promise<ClaudeRun<T>> {
  if (!isAbsolute(options.cwd)) throw new Error("cwd Claude harus path absolut folder project");
  const jsonSchema = z.toJSONSchema(options.schema);
  const model = options.model ?? DEFAULT_MODEL;
  let prompt = options.prompt;
  let issues: string[] = [];
  let costUsd = 0;
  let rateLimit: RateLimitInfo | null = null;
  const permissionDenials: PermissionDenial[] = [];
  for (let attempt = 1; attempt <= MAX_RETRIES + 1; attempt++) {
    const stream = await invoke(options, claudeArgs(prompt, model, jsonSchema));
    costUsd += stream.result?.costUsd ?? 0;
    rateLimit = stream.rateLimit ?? rateLimit;
    permissionDenials.push(...stream.permissionDenials);
    const output = stream.result?.structuredOutput;
    const parsed = options.schema.safeParse(output);
    if (parsed.success) {
      return { data: parsed.data, attempts: attempt, costUsd, rateLimit, permissionDenials };
    }
    issues =
      output === undefined
        ? ["Hasil tidak dikirim lewat tool StructuredOutput"]
        : parsed.error.issues.map((i) => `${i.path.join(".") || "(akar)"}: ${i.message}`);
    const list = issues.map((issue) => `- ${issue}`).join("\n");
    prompt = `${options.prompt}\n\n${RETRY_PROMPT.replace("{{issues}}", list)}`;
  }
  throw new InvalidOutputError(issues);
}

// Satu panggilan CLI. Gagal = exit non-zero, tanpa event result, atau result.is_error.
// LimitReachedError hanya bila gagal DAN (status rate limit bukan "allowed" atau pesan cocok
// pola kuota); status bukan "allowed" pada panggilan yang sukses hanya dicatat.
async function invoke<T>(options: RunClaudeOptions<T>, args: string[]): Promise<ClaudeStream> {
  const events: ClaudeEvent[] = [];
  const spawn = options.spawn ?? spawnLines;
  const { exitCode, stderr } = await spawn(
    options.claudePath,
    args,
    {
      cwd: options.cwd,
      ...(options.env ? { env: options.env } : {}),
      ...(options.signal ? { signal: options.signal } : {}),
    },
    (line) => {
      const event = parseLine(line);
      if (!event) return;
      events.push(event);
      options.onEvent?.(event);
    },
  );
  const stream = summarizeStream(events);
  if (exitCode === 0 && stream.result && !stream.result.isError) return stream;
  const text = `${stream.result?.text ?? ""}\n${stderr}`.trim();
  const fromText = limitInText(text);
  const limited = stream.rateLimit !== null && stream.rateLimit.status !== "allowed";
  if (fromText || limited) {
    const resetsAt =
      fromText?.resetsAt ??
      (stream.rateLimit?.resetsAt ? new Date(stream.rateLimit.resetsAt * 1000) : null);
    throw new LimitReachedError("Batas kuota Claude tercapai", resetsAt);
  }
  throw new ClaudeRunError(`Claude gagal (exit ${exitCode ?? "dihentikan"})`, text.slice(-2000));
}
