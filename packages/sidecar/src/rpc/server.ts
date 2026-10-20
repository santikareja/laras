import { createInterface } from "node:readline";
import type { Readable, Writable } from "node:stream";
import {
  isRpcMethod,
  RPC_METHODS,
  RPC_NOTIFICATIONS,
  RpcErrorCode,
  type RpcErrorObject,
  type RpcId,
  type RpcMethod,
  type RpcNotification,
  type RpcNotificationName,
  type RpcNotificationParams,
  type RpcParams,
  type RpcResponse,
  type RpcResult,
  readRpcLine,
  writeRpcLine,
} from "@laras/shared";

// Server JSON-RPC sidecar (ARCH 4.3, T-202): satu pesan per baris di input, response dan notifikasi
// ke output. Output khusus RPC; semua log lewat `log`.

// Kegagalan yang diketahui handler (mis. busy), dikirim ke UI dengan kodenya sendiri.
export class RpcError extends Error {
  constructor(
    readonly code: number,
    message: string,
  ) {
    super(message);
  }
}

export type RpcHandlers = {
  [M in RpcMethod]: (params: RpcParams<M>) => Promise<RpcResult<M>>;
};

export type RpcServer = {
  notify<N extends RpcNotificationName>(name: N, params: RpcNotificationParams<N>): void;
  // Selesai saat input ditutup (UI keluar atau sidecar dihentikan).
  closed: Promise<void>;
};

export function serveRpc(options: {
  input: Readable;
  output: Writable;
  handlers: RpcHandlers;
  log: (line: string) => void;
}): RpcServer {
  const { input, output, handlers, log } = options;
  const send = (message: RpcResponse | RpcNotification) => output.write(writeRpcLine(message));
  const fail = (id: RpcId | null, error: RpcErrorObject) => send({ jsonrpc: "2.0", id, error });

  async function invoke<M extends RpcMethod>(id: RpcId, method: M, raw: unknown) {
    const definition = RPC_METHODS[method];
    const params = definition.params.safeParse(raw ?? {});
    if (!params.success) {
      const message = params.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`);
      return fail(id, { code: RpcErrorCode.invalidParams, message: message.join("; ") });
    }
    try {
      const result = await handlers[method](params.data as RpcParams<M>);
      send({ jsonrpc: "2.0", id, result: definition.result.parse(result) });
    } catch (error) {
      if (error instanceof RpcError) return fail(id, { code: error.code, message: error.message });
      log(`Method ${method} gagal: ${error instanceof Error ? error.stack : String(error)}`);
      const message = error instanceof Error ? error.message : String(error);
      fail(id, { code: RpcErrorCode.internal, message: message || "Galat internal" });
    }
  }

  const lines = createInterface({ input, crlfDelay: Number.POSITIVE_INFINITY });
  lines.on("line", (line) => {
    if (line.trim() === "") return;
    const message = readRpcLine(line);
    if (message.kind === "invalid") return void fail(message.id, message.error);
    if (message.kind !== "request") return log(`Pesan ${message.kind} dari UI diabaikan`);
    const { id, method, params } = message.message;
    if (!isRpcMethod(method)) {
      return void fail(id, {
        code: RpcErrorCode.methodNotFound,
        message: `Method tidak dikenal: ${method}`,
      });
    }
    void invoke(id, method, params);
  });

  return {
    notify(name, params) {
      send({ jsonrpc: "2.0", method: name, params: RPC_NOTIFICATIONS[name].parse(params) });
    },
    closed: new Promise((resolve) => lines.once("close", () => resolve())),
  };
}
