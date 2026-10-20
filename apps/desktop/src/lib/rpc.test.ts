import { RpcErrorCode } from "@laras/shared";
import { describe, expect, it } from "vitest";
import { createRpcClient, RpcCallError } from "./rpc.ts";

// Klien tersambung ke transport palsu yang mencatat baris terkirim.
function connected() {
  const client = createRpcClient();
  const sent: { id: number; method: string; params: unknown }[] = [];
  client.connect(async (line) => {
    sent.push(JSON.parse(line));
  });
  return { client, sent };
}

describe("klien RPC UI (T-203)", () => {
  it("mencocokkan response dengan request lewat id dan memvalidasi hasil", async () => {
    const { client, sent } = connected();
    const projects = client.request("project.list");
    const hello = client.request("app.hello");
    await Promise.resolve();
    expect(sent.map((m) => m.method)).toEqual(["project.list", "app.hello"]);
    client.receive(
      JSON.stringify({
        jsonrpc: "2.0",
        id: sent[1]?.id,
        result: { version: "0.1.0", dataDir: "/x" },
      }),
    );
    client.receive(JSON.stringify({ jsonrpc: "2.0", id: sent[0]?.id, result: [] }));
    await expect(hello).resolves.toEqual({ version: "0.1.0", dataDir: "/x" });
    await expect(projects).resolves.toEqual([]);
  });

  it("mengisi default params job.start dan menolak params yang salah sebelum dikirim", async () => {
    const { client, sent } = connected();
    void client.request("job.start", { project: "kopi-lembayung", brief: "Promo" });
    await Promise.resolve();
    expect(sent[0]?.params).toMatchObject({ format: "feed-4x5", slideCount: 1, dryRun: false });
    await expect(client.request("job.start", { project: "Kopi", brief: "x" })).rejects.toThrow();
    expect(sent).toHaveLength(1);
  });

  it("mengubah error sidecar menjadi RpcCallError berkode", async () => {
    const { client, sent } = connected();
    const start = client.request("job.start", { project: "kopi-lembayung", brief: "Promo" });
    await Promise.resolve();
    client.receive(
      JSON.stringify({
        jsonrpc: "2.0",
        id: sent[0]?.id,
        error: { code: RpcErrorCode.busy, message: "Masih ada konten yang sedang dibuat" },
      }),
    );
    await expect(start).rejects.toMatchObject({ code: RpcErrorCode.busy });
    await expect(start).rejects.toBeInstanceOf(RpcCallError);
  });

  it("meneruskan notifikasi yang lolos kontrak ke pendengarnya", () => {
    const { client } = connected();
    const events: unknown[] = [];
    const off = client.on("job.event", (params) => events.push(params.event.stage));
    const event = { at: "2026-10-20T10:00:00.000Z", step: 1, stage: "plan", type: "started" };
    client.receive(
      JSON.stringify({ jsonrpc: "2.0", method: "job.event", params: { jobId: "b-v1", event } }),
    );
    client.receive(JSON.stringify({ jsonrpc: "2.0", method: "job.event", params: { jobId: 1 } }));
    off();
    client.receive(
      JSON.stringify({ jsonrpc: "2.0", method: "job.event", params: { jobId: "b-v1", event } }),
    );
    expect(events).toEqual(["plan"]);
  });

  it("menggagalkan request yang menunggu saat sidecar berhenti", async () => {
    const { client } = connected();
    const pending = client.request("app.hello");
    client.disconnect("Sidecar berhenti");
    await expect(pending).rejects.toThrow("Sidecar berhenti");
    await expect(client.request("app.hello")).rejects.toThrow("Sidecar belum tersambung");
  });
});
