import { z } from "zod";
import { CliStatus } from "./cli-status.ts";
import { ContentFormat, HexColor, NonEmptyText, Slug, slideCountError } from "./common.ts";
import { JobEvent, JobStatus } from "./job.ts";

// Kontrak UI ↔ sidecar (ARCH 4.3, ADR-005, T-201): JSON-RPC 2.0 lewat stdin/stdout, satu pesan
// JSON per baris. Method, notifikasi, dan payload didefinisikan di sini dan divalidasi di kedua sisi.

export const RpcId = z.union([z.int().min(0), z.string().min(1)]);
export type RpcId = z.infer<typeof RpcId>;

const jsonrpc = z.literal("2.0");

export const RpcRequest = z.strictObject({
  jsonrpc,
  id: RpcId,
  method: z.string().min(1),
  params: z.unknown().optional(),
});
export type RpcRequest = z.infer<typeof RpcRequest>;

export const RpcNotification = z.strictObject({
  jsonrpc,
  method: z.string().min(1),
  params: z.unknown().optional(),
});
export type RpcNotification = z.infer<typeof RpcNotification>;

export const RpcErrorObject = z.strictObject({
  code: z.int(),
  message: z.string().min(1),
  data: z.unknown().optional(),
});
export type RpcErrorObject = z.infer<typeof RpcErrorObject>;

export const RpcSuccess = z.strictObject({ jsonrpc, id: RpcId, result: z.unknown() });
export const RpcFailure = z.strictObject({ jsonrpc, id: RpcId.nullable(), error: RpcErrorObject });
export type RpcResponse = z.infer<typeof RpcSuccess> | z.infer<typeof RpcFailure>;

// Kode standar JSON-RPC 2.0, ditambah kode aplikasi di rentang -32000 sampai -32099.
export const RpcErrorCode = {
  parse: -32700,
  invalidRequest: -32600,
  methodNotFound: -32601,
  invalidParams: -32602,
  internal: -32603,
  // Walking skeleton menjalankan satu brief sekaligus (T-202).
  busy: -32001,
  projectNotFound: -32002,
} as const;

const AbsolutePath = z.string().startsWith("/", "Path harus absolut");

export const AppHello = z.strictObject({
  version: NonEmptyText,
  // Folder data Laras (ARCH 8.1); UI membatasi asset protocol ke folder ini.
  dataDir: AbsolutePath,
});
export type AppHello = z.infer<typeof AppHello>;

export const ProjectSummary = z.strictObject({
  slug: Slug,
  name: NonEmptyText,
  primaryColor: HexColor,
});
export type ProjectSummary = z.infer<typeof ProjectSummary>;

export const JobStartParams = z
  .strictObject({
    project: Slug,
    brief: NonEmptyText,
    format: ContentFormat.default("feed-4x5"),
    slideCount: z.int().min(1).max(20).default(1),
    variantCount: z.int().min(1).max(4).default(1),
    // Tanpa kuota: jawaban contoh menggantikan Claude dan Codex, untuk menguji UI (T-202).
    dryRun: z.boolean().default(false),
  })
  .superRefine((params, ctx) => {
    const countError = slideCountError(params.format, params.slideCount);
    if (countError) ctx.addIssue({ code: "custom", path: ["slideCount"], message: countError });
  });
export type JobStartParams = z.infer<typeof JobStartParams>;

export const JobStartResult = z.strictObject({ briefId: Slug, jobIds: z.array(Slug).min(1) });
export type JobStartResult = z.infer<typeof JobStartResult>;

export const JobEventParams = z.strictObject({ jobId: Slug, event: JobEvent });
export type JobEventParams = z.infer<typeof JobEventParams>;

export const JobFinishedParams = z.strictObject({
  jobId: Slug,
  status: JobStatus,
  // PNG slide hasil akhir job (putaran terbaik), urut slide.
  slides: z.array(AbsolutePath),
  qaPassed: z.boolean().nullable(),
  error: z.string().min(1).nullable(),
});
export type JobFinishedParams = z.infer<typeof JobFinishedParams>;

const NoParams = z.strictObject({});

// Request dari UI ke sidecar. Params yang tidak dikirim dibaca sebagai {}.
export const RPC_METHODS = {
  "app.hello": { params: NoParams, result: AppHello },
  "cli.status": { params: NoParams, result: z.array(CliStatus) },
  "project.list": { params: NoParams, result: z.array(ProjectSummary) },
  "job.start": { params: JobStartParams, result: JobStartResult },
} as const;
export type RpcMethod = keyof typeof RPC_METHODS;
export type RpcParamsInput<M extends RpcMethod> = z.input<(typeof RPC_METHODS)[M]["params"]>;
export type RpcParams<M extends RpcMethod> = z.output<(typeof RPC_METHODS)[M]["params"]>;
export type RpcResult<M extends RpcMethod> = z.output<(typeof RPC_METHODS)[M]["result"]>;

// Notifikasi dari sidecar ke UI.
export const RPC_NOTIFICATIONS = {
  "job.event": JobEventParams,
  "job.finished": JobFinishedParams,
} as const;
export type RpcNotificationName = keyof typeof RPC_NOTIFICATIONS;
export type RpcNotificationParams<N extends RpcNotificationName> = z.output<
  (typeof RPC_NOTIFICATIONS)[N]
>;

export const isRpcMethod = (name: string): name is RpcMethod => Object.hasOwn(RPC_METHODS, name);
export const isRpcNotification = (name: string): name is RpcNotificationName =>
  Object.hasOwn(RPC_NOTIFICATIONS, name);

export type RpcMessage =
  | { kind: "request"; message: RpcRequest }
  | { kind: "notification"; message: RpcNotification }
  | { kind: "response"; message: RpcResponse }
  | { kind: "invalid"; id: RpcId | null; error: RpcErrorObject };

const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

// Satu baris stdin/stdout menjadi pesan bertipe; baris rusak menjadi error JSON-RPC yang bisa
// dikirim balik apa adanya.
export function readRpcLine(line: string): RpcMessage {
  let value: unknown;
  try {
    value = JSON.parse(line);
  } catch {
    return {
      kind: "invalid",
      id: null,
      error: { code: RpcErrorCode.parse, message: "Pesan bukan JSON yang valid" },
    };
  }
  const id = record(value) ? RpcId.safeParse(value.id) : null;
  const invalid = (message: string): RpcMessage => ({
    kind: "invalid",
    id: id?.success ? id.data : null,
    error: { code: RpcErrorCode.invalidRequest, message },
  });
  if (!record(value)) return invalid("Pesan harus berupa objek JSON-RPC");
  const issues = (error: z.ZodError) => invalid(error.issues.map((i) => i.message).join("; "));
  if ("method" in value) {
    if ("id" in value) {
      const request = RpcRequest.safeParse(value);
      return request.success ? { kind: "request", message: request.data } : issues(request.error);
    }
    const notification = RpcNotification.safeParse(value);
    return notification.success
      ? { kind: "notification", message: notification.data }
      : issues(notification.error);
  }
  const response =
    "result" in value
      ? RpcSuccess.safeParse(value)
      : "error" in value
        ? RpcFailure.safeParse(value)
        : null;
  if (!response) return invalid("Pesan tidak punya method, result, atau error");
  return response.success ? { kind: "response", message: response.data } : issues(response.error);
}

// JSON.stringify meloloskan baris baru di dalam string, jadi satu pesan selalu satu baris.
export function writeRpcLine(message: RpcRequest | RpcNotification | RpcResponse): string {
  return `${JSON.stringify(message)}\n`;
}
