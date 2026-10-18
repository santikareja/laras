import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { describe, expect, it } from "vitest";
import { type Exec, loginShellPath, type ResolveDeps, resolveClis } from "./resolvePath.ts";

// exec palsu memakai output CLI asli (test/fixtures/cli/README.md).
const fixture = (file: string) =>
  readFileSync(new URL(`../../test/fixtures/cli/${file}`, import.meta.url), "utf8");

const HOME = "/Users/contoh";
const LOCAL_BIN = `${HOME}/.local/bin`;

type FakeOptions = {
  shellPath?: string[];
  shellNoise?: string;
  shellFails?: boolean;
  executables?: string[];
  loggedIn?: boolean;
};

function fake({
  shellPath = [LOCAL_BIN],
  shellNoise = "",
  shellFails = false,
  executables = [`${LOCAL_BIN}/claude`, `${LOCAL_BIN}/codex`],
  loggedIn = true,
}: FakeOptions = {}) {
  const calls: { file: string; args: string[]; env?: Record<string, string> }[] = [];
  const exec: Exec = async (file, args, _timeoutMs, env) => {
    calls.push({ file, args, ...(env ? { env } : {}) });
    if (file === "/bin/zsh") {
      if (shellFails) throw new Error("timeout");
      return { code: 0, stdout: `${shellNoise}__LARAS_PATH__${shellPath.join(":")}\n`, stderr: "" };
    }
    const name = basename(file);
    if (args[0] === "--version") {
      return { code: 0, stdout: fixture(`${name}-version.stdout.txt`), stderr: "" };
    }
    const state = loggedIn ? "logged-in" : "logged-out";
    if (name === "claude") {
      return {
        code: loggedIn ? 0 : 1,
        stdout: fixture(`claude-auth-status-${state}.json`),
        stderr: "",
      };
    }
    return {
      code: loggedIn ? 0 : 1,
      stdout: "",
      stderr: fixture(`codex-login-status-${state}.stderr.txt`),
    };
  };
  const deps: ResolveDeps = {
    exec,
    isExecutable: async (p) => executables.includes(p),
    home: HOME,
  };
  return { deps, calls };
}

describe("loginShellPath", () => {
  it("membaca PATH setelah penanda walau profil shell mencetak teks lain", async () => {
    const { deps } = fake({
      shellNoise: "Selamat datang!\nfnm: memakai node 22\n",
      shellPath: ["/a", "/b"],
    });
    expect(await loginShellPath(deps)).toEqual(["/a", "/b"]);
  });

  it("mengembalikan null bila shell gagal", async () => {
    expect(await loginShellPath(fake({ shellFails: true }).deps)).toBeNull();
  });
});

describe("resolveClis", () => {
  it("menemukan kedua CLI lewat PATH login shell, beserta versi dan status login", async () => {
    const { deps, calls } = fake({ shellPath: ["/opt/x/bin", LOCAL_BIN] });
    expect(await resolveClis({}, deps)).toEqual([
      {
        name: "claude",
        found: true,
        path: `${LOCAL_BIN}/claude`,
        source: "login-shell",
        version: "2.1.302",
        loggedIn: true,
        account: "claude.ai · team",
      },
      {
        name: "codex",
        found: true,
        path: `${LOCAL_BIN}/codex`,
        source: "login-shell",
        version: "0.163.0",
        loggedIn: true,
        account: "Logged in using ChatGPT",
      },
    ]);
    const versionCall = calls.find((c) => c.args[0] === "--version");
    expect(versionCall?.env).toEqual({ PATH: `/opt/x/bin:${LOCAL_BIN}` });
  });

  it("melaporkan belum login dari output CLI asli", async () => {
    const statuses = await resolveClis({}, fake({ loggedIn: false }).deps);
    expect(statuses.map((s) => s.found && [s.loggedIn, s.account])).toEqual([
      [false, null],
      [false, null],
    ]);
  });

  it("melaporkan tidak ditemukan bila tidak ada di PATH, lokasi umum, maupun path manual", async () => {
    const { deps } = fake({ shellPath: ["/opt/x/bin"], executables: [] });
    expect(await resolveClis({ claude: "/tidak/ada/claude" }, deps)).toEqual([
      { name: "claude", found: false },
      { name: "codex", found: false },
    ]);
  });

  it("memakai lokasi umum bila login shell gagal, lalu path manual", async () => {
    const { deps } = fake({
      shellFails: true,
      executables: ["/opt/homebrew/bin/claude", "/Applications/Alat/codex"],
    });
    const statuses = await resolveClis({ codex: "/Applications/Alat/codex" }, deps);
    expect(statuses.map((s) => s.found && [s.path, s.source])).toEqual([
      ["/opt/homebrew/bin/claude", "common"],
      ["/Applications/Alat/codex", "manual"],
    ]);
  });

  it("melewati salinan bawaan aplikasi lain dan menormalkan path fnm multishell", async () => {
    const bundled = `${HOME}/Library/Application Support/Claude/claude-code/2.1.0`;
    const multishell = `${HOME}/.local/state/fnm_multishells/123_456/bin`;
    const { deps } = fake({
      shellPath: [bundled, `${HOME}/.vscode/extensions/openai.chatgpt/bin`, multishell],
      executables: [
        `${bundled}/claude`,
        `${HOME}/.vscode/extensions/openai.chatgpt/bin/codex`,
        `${HOME}/.local/share/fnm/aliases/default/bin/codex`,
      ],
    });
    expect((await resolveClis({}, deps)).map((s) => s.found && s.path)).toEqual([
      false,
      `${HOME}/.local/share/fnm/aliases/default/bin/codex`,
    ]);
  });
});
