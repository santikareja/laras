import { describe, expect, it } from "vitest";
import { nodeCandidates } from "./sidecar.ts";

const HOME = "/Users/contoh";
const FNM = `${HOME}/.local/share/fnm/aliases/default/bin/node`;

describe("resolusi Node untuk sidecar (ADR-008, T-203)", () => {
  it("mengganti path fnm multishell dengan alias default", () => {
    const output = `profil berisik\n__LARAS_NODE__${HOME}/.local/state/fnm_multishells/123_456/bin/node\n`;
    expect(nodeCandidates(output, `${HOME}/`)).toEqual([
      FNM,
      "/opt/homebrew/bin/node",
      "/usr/local/bin/node",
    ]);
  });

  it("mendahulukan path login shell lain dan memakai lokasi umum bila shell gagal", () => {
    expect(nodeCandidates("__LARAS_NODE__/opt/homebrew/bin/node\n", HOME)).toEqual([
      "/opt/homebrew/bin/node",
      FNM,
      "/usr/local/bin/node",
    ]);
    expect(nodeCandidates(null, HOME)).toEqual([
      FNM,
      "/opt/homebrew/bin/node",
      "/usr/local/bin/node",
    ]);
    expect(nodeCandidates("__LARAS_NODE__\n", HOME)[0]).toBe(FNM);
  });
});
