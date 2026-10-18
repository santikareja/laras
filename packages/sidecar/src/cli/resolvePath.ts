import { spawn } from "node:child_process";
import { access, constants, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, isAbsolute, join } from "node:path";
import { CliName, type CliStatus } from "@laras/shared";

// Deteksi claude dan codex (ARCH 4.5, PRD F14). Aplikasi GUI macOS tidak mewarisi PATH terminal,
// jadi urutannya: PATH login shell, lokasi umum, lalu path manual dari Pengaturan. Versi dan
// status login diperiksa tanpa kuota.

export type CommandResult = { code: number | null; stdout: string; stderr: string };
export type Exec = (
  file: string,
  args: string[],
  timeoutMs: number,
  env?: Record<string, string>,
) => Promise<CommandResult>;

export type ResolveDeps = {
  exec: Exec;
  isExecutable: (path: string) => Promise<boolean>;
  home: string;
};

const PATH_MARKER = "__LARAS_PATH__";
const SHELL_TIMEOUT_MS = 10_000;
const COMMAND_TIMEOUT_MS = 15_000;

const COMMON_DIRS = [
  "~/.local/bin",
  "/opt/homebrew/bin",
  "/usr/local/bin",
  "~/.npm-global/bin",
  "~/.bun/bin",
  "~/.local/share/fnm/aliases/default/bin",
];

// Salinan bawaan aplikasi lain: path berubah tiap update dan versinya bisa alpha (ARCH 4.5).
const BUNDLED_PARTS = [
  "/Library/Application Support/Claude/",
  "/.vscode/extensions/",
  "/.vscode-insiders/extensions/",
  "/.cursor/extensions/",
  "/.kiro/",
  "/.antigravity",
  ".app/Contents/",
];

// Folder fnm "multishell" berubah setiap shell (KNOWLEDGE), jadi diganti alias default.
const FNM_MULTISHELL = /\/fnm_multishells\/[^/]+\/bin\/[^/]+$/;
const FNM_DEFAULT_BIN = ".local/share/fnm/aliases/default/bin";

export async function resolveClis(
  manualPaths: Partial<Record<CliName, string>> = {},
  deps: ResolveDeps = defaultDeps(),
): Promise<CliStatus[]> {
  const shellPath = await loginShellPath(deps);
  const env = shellPath ? { PATH: shellPath.join(":") } : undefined;
  return Promise.all(
    CliName.options.map(async (name): Promise<CliStatus> => {
      const found = await findCli(name, shellPath ?? [], manualPaths[name], deps);
      if (!found) return { name, found: false };
      const [version, login] = await Promise.all([
        readVersion(found.path, deps, env),
        name === "claude" ? claudeLogin(found.path, deps, env) : codexLogin(found.path, deps, env),
      ]);
      return { name, found: true, ...found, version, ...login };
    }),
  );
}

// PATH dari login shell; penanda memisahkannya dari teks lain yang dicetak profil shell.
export async function loginShellPath(deps: ResolveDeps): Promise<string[] | null> {
  try {
    const script = `printf '${PATH_MARKER}%s\\n' "$PATH"`;
    const { stdout } = await deps.exec("/bin/zsh", ["-lic", script], SHELL_TIMEOUT_MS);
    const line = stdout.split("\n").find((l) => l.startsWith(PATH_MARKER));
    return line ? line.slice(PATH_MARKER.length).split(":").filter(Boolean) : null;
  } catch {
    return null;
  }
}

async function findCli(
  name: CliName,
  shellPath: string[],
  manual: string | undefined,
  deps: ResolveDeps,
): Promise<{ path: string; source: "login-shell" | "common" | "manual" } | null> {
  const expand = (dir: string) => (dir.startsWith("~/") ? join(deps.home, dir.slice(2)) : dir);
  const searches = [
    { dirs: shellPath, source: "login-shell" as const },
    { dirs: COMMON_DIRS.map(expand), source: "common" as const },
  ];
  for (const { dirs, source } of searches) {
    for (const dir of dirs) {
      const path = await usablePath(join(dir, name), deps);
      if (path) return { path, source };
    }
  }
  if (manual && isAbsolute(manual) && (await deps.isExecutable(manual))) {
    return { path: manual, source: "manual" };
  }
  return null;
}

async function usablePath(path: string, deps: ResolveDeps): Promise<string | null> {
  if (BUNDLED_PARTS.some((part) => path.includes(part))) return null;
  const stable = FNM_MULTISHELL.test(path)
    ? join(deps.home, FNM_DEFAULT_BIN, basename(path))
    : path;
  return (await deps.isExecutable(stable)) ? stable : null;
}

async function run(path: string, args: string[], deps: ResolveDeps, env?: Record<string, string>) {
  try {
    return await deps.exec(path, args, COMMAND_TIMEOUT_MS, env);
  } catch {
    return null;
  }
}

async function readVersion(path: string, deps: ResolveDeps, env?: Record<string, string>) {
  const result = await run(path, ["--version"], deps, env);
  return result?.code === 0 ? (/\d+\.\d+\.\d+[\w.+-]*/.exec(result.stdout)?.[0] ?? null) : null;
}

// `claude auth status --json`: JSON di stdout, exit 1 bila belum login (KNOWLEDGE).
type ClaudeAuth = { loggedIn?: unknown; authMethod?: unknown; subscriptionType?: unknown };

async function claudeLogin(path: string, deps: ResolveDeps, env?: Record<string, string>) {
  const result = await run(path, ["auth", "status", "--json"], deps, env);
  const status = parseObject(result?.stdout ?? "");
  if (status?.loggedIn !== true) return { loggedIn: false, account: null };
  const parts = [status.authMethod, status.subscriptionType].filter(
    (part): part is string => typeof part === "string" && part.length > 0,
  );
  return { loggedIn: true, account: parts.join(" · ") || null };
}

function parseObject(text: string): ClaudeAuth | null {
  try {
    const value: unknown = JSON.parse(text);
    return typeof value === "object" && value !== null ? value : null;
  } catch {
    return null;
  }
}

// `codex login status`: teks status di stderr, exit 1 bila belum login (KNOWLEDGE).
async function codexLogin(path: string, deps: ResolveDeps, env?: Record<string, string>) {
  const result = await run(path, ["login", "status"], deps, env);
  const line = `${result?.stderr ?? ""}\n${result?.stdout ?? ""}`
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.length > 0);
  const loggedIn = result?.code === 0 && line !== undefined && /^logged in/i.test(line);
  return { loggedIn, account: loggedIn ? (line ?? null) : null };
}

function defaultDeps(): ResolveDeps {
  return {
    home: homedir(),
    exec: runCommand,
    isExecutable: async (path) => {
      try {
        await access(path, constants.X_OK);
        return (await stat(path)).isFile();
      } catch {
        return false;
      }
    },
  };
}

// stdin ditutup: CLI bisa menunggu stdin bila bukan TTY (ADR-012).
export function runCommand(
  file: string,
  args: string[],
  timeoutMs: number,
  env?: Record<string, string>,
): Promise<CommandResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(file, args, {
      stdio: ["ignore", "pipe", "pipe"],
      env: env ? { ...process.env, ...env } : process.env,
    });
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8").on("data", (chunk: string) => {
      stdout += chunk;
    });
    child.stderr.setEncoding("utf8").on("data", (chunk: string) => {
      stderr += chunk;
    });
    const timer = setTimeout(() => child.kill("SIGKILL"), timeoutMs);
    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr });
    });
  });
}
