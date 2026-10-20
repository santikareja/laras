import { describe, expect, it } from "vitest";
import {
  isRpcMethod,
  isRpcNotification,
  JobFinishedParams,
  JobStartParams,
  RPC_METHODS,
  RpcErrorCode,
  readRpcLine,
  writeRpcLine,
} from "./rpc.ts";
import { issuesOf } from "./test-utils.ts";

describe("pesan JSON-RPC (T-201)", () => {
  it("membedakan request, notifikasi, dan response", () => {
    expect(readRpcLine('{"jsonrpc":"2.0","id":1,"method":"app.hello"}')).toEqual({
      kind: "request",
      message: { jsonrpc: "2.0", id: 1, method: "app.hello" },
    });
    expect(readRpcLine('{"jsonrpc":"2.0","method":"job.event","params":{}}').kind).toBe(
      "notification",
    );
    expect(readRpcLine('{"jsonrpc":"2.0","id":"a","result":null}')).toEqual({
      kind: "response",
      message: { jsonrpc: "2.0", id: "a", result: null },
    });
    const failure = readRpcLine(
      '{"jsonrpc":"2.0","id":null,"error":{"code":-32700,"message":"rusak"}}',
    );
    expect(failure.kind).toBe("response");
  });

  it("mengubah baris rusak menjadi error yang bisa dikirim balik", () => {
    expect(readRpcLine("{bukan json")).toEqual({
      kind: "invalid",
      id: null,
      error: { code: RpcErrorCode.parse, message: "Pesan bukan JSON yang valid" },
    });
    const noVersion = readRpcLine('{"id":7,"method":"app.hello"}');
    expect(noVersion).toMatchObject({
      kind: "invalid",
      id: 7,
      error: { code: RpcErrorCode.invalidRequest },
    });
    expect(readRpcLine("[1,2]")).toMatchObject({ kind: "invalid", id: null });
    expect(readRpcLine('{"jsonrpc":"2.0","id":3}')).toMatchObject({
      kind: "invalid",
      id: 3,
      error: { message: "Pesan tidak punya method, result, atau error" },
    });
  });

  it("menulis satu pesan sebagai tepat satu baris yang bisa dibaca ulang", () => {
    const message = {
      jsonrpc: "2.0" as const,
      method: "job.event",
      params: { teks: "baris satu\nbaris dua" },
    };
    const line = writeRpcLine(message);
    expect(line.endsWith("\n")).toBe(true);
    expect(line.slice(0, -1)).not.toContain("\n");
    expect(readRpcLine(line.trim())).toEqual({ kind: "notification", message });
  });
});

describe("method dan notifikasi (T-201)", () => {
  it("mengenali nama method dan notifikasi yang terdaftar", () => {
    expect(isRpcMethod("job.start")).toBe(true);
    expect(isRpcMethod("toString")).toBe(false);
    expect(isRpcNotification("job.finished")).toBe(true);
    expect(isRpcNotification("job.start")).toBe(false);
  });

  it("method tanpa params menerima objek kosong dan menolak field lain", () => {
    expect(RPC_METHODS["app.hello"].params.safeParse({}).success).toBe(true);
    expect(RPC_METHODS["project.list"].params.safeParse({ x: 1 }).success).toBe(false);
  });

  it("job.start mengisi default feed satu slide tanpa dry-run", () => {
    expect(JobStartParams.parse({ project: "kopi-lembayung", brief: "Promo akhir pekan" })).toEqual(
      {
        project: "kopi-lembayung",
        brief: "Promo akhir pekan",
        format: "feed-4x5",
        slideCount: 1,
        variantCount: 1,
        dryRun: false,
      },
    );
  });

  it("job.start menolak brief kosong dan jumlah slide yang tidak cocok format", () => {
    expect(issuesOf(JobStartParams, { project: "kopi-lembayung", brief: "  " })).not.toEqual([]);
    expect(
      issuesOf(JobStartParams, { project: "kopi-lembayung", brief: "Promo", slideCount: 3 }),
    ).toContain("Format feed-4x5 harus berisi tepat 1 slide");
  });

  it("job.finished hanya menerima path PNG absolut", () => {
    const finished = {
      jobId: "brief-1-v1",
      status: "done",
      slides: ["/Users/contoh/Library/Application Support/Laras/projects/a/jobs/b/slides/1.png"],
      qaPassed: true,
      error: null,
    };
    expect(issuesOf(JobFinishedParams, finished)).toEqual([]);
    expect(issuesOf(JobFinishedParams, { ...finished, slides: ["slides/1.png"] })).toContain(
      "Path harus absolut",
    );
  });
});
