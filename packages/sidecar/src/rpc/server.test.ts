import { PassThrough } from "node:stream";
import { RpcErrorCode } from "@laras/shared";
import { describe, expect, it } from "vitest";
import { RpcError, type RpcHandlers, serveRpc } from "./server.ts";

const HELLO = { version: "0.1.0", dataDir: "/Users/contoh/Library/Application Support/Laras" };

function setup(overrides: Partial<RpcHandlers> = {}) {
  const input = new PassThrough();
  const output = new PassThrough();
  const logs: string[] = [];
  const received: unknown[] = [];
  let buffer = "";
  output.on("data", (chunk: Buffer) => {
    buffer += chunk.toString();
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) received.push(JSON.parse(line));
  });
  const handlers: RpcHandlers = {
    "app.hello": async () => HELLO,
    "cli.status": async () => [],
    "project.list": async () => [],
    "job.start": async () => ({ briefId: "brief-1", jobIds: ["brief-1-v1"] }),
    ...overrides,
  };
  const server = serveRpc({ input, output, handlers, log: (line) => logs.push(line) });
  const send = (line: string) => input.write(`${line}\n`);
  // Menunggu sampai output berisi n pesan.
  const next = async (n = 1) => {
    for (let i = 0; i < 100 && received.length < n; i++) await new Promise((r) => setTimeout(r, 5));
    return received.slice(0, n);
  };
  return { server, input, send, next, logs };
}

describe("server RPC sidecar (T-202)", () => {
  it("menjawab request dengan hasil yang sudah divalidasi", async () => {
    const { send, next } = setup();
    send('{"jsonrpc":"2.0","id":1,"method":"app.hello"}');
    expect(await next()).toEqual([{ jsonrpc: "2.0", id: 1, result: HELLO }]);
  });

  it("menolak method tak dikenal, params salah, dan baris rusak dengan kode standar", async () => {
    const { send, next } = setup();
    send('{"jsonrpc":"2.0","id":1,"method":"project.hapus"}');
    send('{"jsonrpc":"2.0","id":2,"method":"job.start","params":{"project":"A B","brief":"x"}}');
    send("bukan json");
    const [unknown, invalid, broken] = await next(3);
    expect(unknown).toMatchObject({ id: 1, error: { code: RpcErrorCode.methodNotFound } });
    expect(invalid).toMatchObject({ id: 2, error: { code: RpcErrorCode.invalidParams } });
    expect(broken).toMatchObject({ id: null, error: { code: RpcErrorCode.parse } });
  });

  it("meneruskan kode RpcError dan menyembunyikan galat lain sebagai internal", async () => {
    const { send, next, logs } = setup({
      "job.start": async () => {
        throw new RpcError(RpcErrorCode.busy, "Masih ada konten yang sedang dibuat");
      },
      "project.list": async () => {
        throw new Error("disk penuh");
      },
    });
    send('{"jsonrpc":"2.0","id":1,"method":"job.start","params":{"project":"a","brief":"b"}}');
    send('{"jsonrpc":"2.0","id":2,"method":"project.list"}');
    const responses = await next(2);
    expect(responses).toContainEqual({
      jsonrpc: "2.0",
      id: 1,
      error: { code: RpcErrorCode.busy, message: "Masih ada konten yang sedang dibuat" },
    });
    expect(responses).toContainEqual({
      jsonrpc: "2.0",
      id: 2,
      error: { code: RpcErrorCode.internal, message: "disk penuh" },
    });
    expect(logs.some((line) => line.includes("project.list gagal"))).toBe(true);
  });

  it("hasil handler yang tidak sesuai kontrak menjadi galat internal", async () => {
    const { send, next } = setup({
      "app.hello": async () => ({ version: "0.1.0", dataDir: "relatif" }),
    });
    send('{"jsonrpc":"2.0","id":5,"method":"app.hello"}');
    expect(await next()).toMatchObject([{ id: 5, error: { code: RpcErrorCode.internal } }]);
  });

  it("mengirim notifikasi yang lolos kontrak dan menolak yang tidak", async () => {
    const { server, next } = setup();
    const event = {
      at: "2026-10-20T10:00:00.000Z",
      step: 1,
      stage: "plan",
      type: "started",
    } as const;
    server.notify("job.event", { jobId: "brief-1-v1", event });
    expect(await next()).toEqual([
      { jsonrpc: "2.0", method: "job.event", params: { jobId: "brief-1-v1", event } },
    ]);
    expect(() =>
      server.notify("job.finished", {
        jobId: "brief-1-v1",
        status: "done",
        slides: ["slides/1.png"],
        qaPassed: true,
        error: null,
      }),
    ).toThrow();
  });

  it("selesai saat input ditutup", async () => {
    const { server, input } = setup();
    input.end();
    await expect(server.closed).resolves.toBeUndefined();
  });
});
