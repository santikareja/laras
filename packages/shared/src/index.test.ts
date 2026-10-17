import { describe, expect, it } from "vitest";

describe("@laras/shared", () => {
  it("dapat diimpor", async () => {
    const mod = await import("./index");
    expect(mod).toBeTypeOf("object");
  });
});
