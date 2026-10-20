import {
  isRpcNotification,
  RPC_METHODS,
  RPC_NOTIFICATIONS,
  RpcErrorCode,
  type RpcMethod,
  type RpcNotificationName,
  type RpcNotificationParams,
  type RpcParamsInput,
  type RpcResult,
  readRpcLine,
  writeRpcLine,
} from "@laras/shared";

// Klien JSON-RPC UI (ARCH 4.3, T-203): request dicocokkan dengan response lewat id, params, hasil,
// dan notifikasi divalidasi skema shared. Transport (proses sidecar) dipasang terpisah lewat
// `connect`, sehingga klien bisa dites tanpa Tauri.

export class RpcCallError extends Error {
  constructor(
    readonly code: number,
    message: string,
  ) {
    super(message);
  }
}

type Pending = { resolve: (value: unknown) => void; reject: (error: Error) => void };
type Listener = (params: unknown) => void;

export type RpcClient = ReturnType<typeof createRpcClient>;

export function createRpcClient() {
  let nextId = 1;
  let write: ((line: string) => Promise<void>) | null = null;
  const pending = new Map<number, Pending>();
  const listeners = new Map<RpcNotificationName, Set<Listener>>();

  return {
    // Memasang transport baru (setelah sidecar siap atau dijalankan ulang).
    connect(writer: (line: string) => Promise<void>) {
      write = writer;
    },

    // Sidecar berhenti: request yang menunggu digagalkan agar UI tidak menggantung.
    disconnect(reason: string) {
      write = null;
      for (const entry of pending.values()) {
        entry.reject(new RpcCallError(RpcErrorCode.internal, reason));
      }
      pending.clear();
    },

    async request<M extends RpcMethod>(
      method: M,
      params?: RpcParamsInput<M>,
    ): Promise<RpcResult<M>> {
      if (!write) throw new RpcCallError(RpcErrorCode.internal, "Sidecar belum tersambung");
      const definition = RPC_METHODS[method];
      const id = nextId++;
      const response = new Promise<unknown>((resolve, reject) => {
        pending.set(id, { resolve, reject });
      });
      const line = writeRpcLine({
        jsonrpc: "2.0",
        id,
        method,
        params: definition.params.parse(params ?? {}),
      });
      await write(line).catch((error: unknown) => {
        pending.delete(id);
        throw error;
      });
      return definition.result.parse(await response) as RpcResult<M>;
    },

    on<N extends RpcNotificationName>(
      name: N,
      listener: (params: RpcNotificationParams<N>) => void,
    ): () => void {
      const set = listeners.get(name) ?? new Set<Listener>();
      listeners.set(name, set);
      const wrapped: Listener = (params) => listener(params as RpcNotificationParams<N>);
      set.add(wrapped);
      return () => set.delete(wrapped);
    },

    // Satu baris dari stdout sidecar.
    receive(line: string) {
      if (line.trim() === "") return;
      const message = readRpcLine(line);
      if (message.kind === "response") {
        const id = message.message.id;
        const entry = typeof id === "number" ? pending.get(id) : undefined;
        if (!entry || typeof id !== "number") return;
        pending.delete(id);
        if ("error" in message.message) {
          const { code, message: text } = message.message.error;
          entry.reject(new RpcCallError(code, text));
        } else {
          entry.resolve(message.message.result);
        }
        return;
      }
      if (message.kind === "notification") {
        const { method, params } = message.message;
        if (!isRpcNotification(method)) return;
        const parsed = RPC_NOTIFICATIONS[method].safeParse(params);
        if (!parsed.success) {
          console.error(`Notifikasi ${method} tidak sesuai kontrak`, parsed.error);
          return;
        }
        for (const listener of listeners.get(method) ?? []) listener(parsed.data);
        return;
      }
      console.error("Pesan sidecar diabaikan", message);
    },
  };
}
