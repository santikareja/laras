import * as shared from "@laras/shared";
import { describe, expect, it } from "vitest";

describe("@laras/sidecar", () => {
  it("dapat diimpor dan menautkan @laras/shared", async () => {
    const mod = await import("./index");
    expect(mod).toBeTypeOf("object");
    expect(shared).toBeTypeOf("object");
  });
});
