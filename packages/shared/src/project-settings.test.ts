import { describe, expect, it } from "vitest";
import { ProjectSettings } from "./project-settings.ts";
import { issuesOf } from "./test-utils.ts";

describe("ProjectSettings (T-133)", () => {
  it("gaya default project atau tanpa gaya", () => {
    expect(issuesOf(ProjectSettings, { style: { id: "minimalism", variant: "produk" } })).toEqual(
      [],
    );
    expect(issuesOf(ProjectSettings, { style: null })).toEqual([]);
  });

  it("menolak kunci tak dikenal dan opsi gaya di tingkat project", () => {
    expect(issuesOf(ProjectSettings, { style: null, tema: "gelap" })).not.toEqual([]);
    expect(
      issuesOf(ProjectSettings, { style: { id: "cyberpunk", variant: "neon-gelap", options: {} } }),
    ).not.toEqual([]);
  });
});
