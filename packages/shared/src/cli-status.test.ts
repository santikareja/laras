import { describe, expect, it } from "vitest";
import { CliStatus } from "./cli-status.ts";
import { issuesOf } from "./test-utils.ts";

describe("CliStatus", () => {
  it("menerima CLI yang ditemukan dan yang tidak ditemukan", () => {
    const found = {
      name: "claude",
      found: true,
      path: "/Users/contoh/.local/bin/claude",
      source: "login-shell",
      version: "2.1.302",
      loggedIn: true,
      account: "claude.ai · team",
    };
    expect(issuesOf(CliStatus, found)).toEqual([]);
    expect(issuesOf(CliStatus, { name: "codex", found: false })).toEqual([]);
  });

  it("menolak path relatif dan field yang tidak sesuai status", () => {
    const relative = {
      name: "codex",
      found: true,
      path: "codex",
      source: "manual",
      version: null,
      loggedIn: false,
      account: null,
    };
    expect(issuesOf(CliStatus, relative)).toContain("Path CLI harus absolut");
    expect(CliStatus.safeParse({ name: "codex", found: false, path: "/x" }).success).toBe(false);
  });
});
