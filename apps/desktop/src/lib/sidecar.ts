import { homeDir } from "@tauri-apps/api/path";
import { type Child, Command } from "@tauri-apps/plugin-shell";
import type { RpcClient } from "./rpc.ts";

// Proses sidecar (ARCH 4.1, 4.4, ADR-008, T-203): path Node di-resolve lewat login shell lalu
// lokasi umum, sidecar dijalankan lewat scope shell "sidecar" (`/usr/bin/env <node> <bundel>`,
// capabilities/default.json), dan dijalankan ulang bila mati.

const MARKER = "__LARAS_NODE__";
// Folder fnm "multishell" berubah setiap shell (KNOWLEDGE), jadi diganti alias default.
const FNM_MULTISHELL = /\/fnm_multishells\/[^/]+\/bin\/node$/;
const HELLO_TIMEOUT_MS = 15_000;
const RESTART_DELAY_MS = 1_000;
const MAX_FAILED_STARTS = 3;

export type SidecarState = "starting" | "ready" | "reconnecting" | "failed";

// Kandidat path Node urut prioritas: hasil login shell (dinormalkan), lalu lokasi umum.
export function nodeCandidates(shellOutput: string | null, home: string): string[] {
  const fnmDefault = `${home.replace(/\/$/, "")}/.local/share/fnm/aliases/default/bin/node`;
  const line = shellOutput?.split("\n").find((l) => l.startsWith(MARKER));
  const found = line?.slice(MARKER.length).trim() ?? "";
  const fromShell = found.startsWith("/")
    ? FNM_MULTISHELL.test(found)
      ? fnmDefault
      : found
    : null;
  const all = [fromShell, fnmDefault, "/opt/homebrew/bin/node", "/usr/local/bin/node"];
  return [...new Set(all.filter((path): path is string => path !== null))];
}

async function resolveNode(): Promise<string[]> {
  const output = await Command.create("resolve-node")
    .execute()
    .catch(() => null);
  return nodeCandidates(output?.stdout ?? null, await homeDir());
}

// Menjalankan sidecar dengan satu kandidat Node; berhasil bila app.hello terjawab.
async function launch(node: string, client: RpcClient, onExit: () => void): Promise<Child | null> {
  const command = Command.create("sidecar", [node, __LARAS_SIDECAR__]);
  let buffer = "";
  let exited = false;
  command.stdout.on("data", (chunk) => {
    buffer += chunk;
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) client.receive(line);
  });
  command.stderr.on("data", (line) => console.debug(`[sidecar] ${line.trimEnd()}`));
  command.on("close", () => {
    exited = true;
    client.disconnect("Sidecar berhenti");
    onExit();
  });
  const child = await command.spawn();
  client.connect((line) => child.write(line));
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("app.hello tidak terjawab")), HELLO_TIMEOUT_MS),
  );
  try {
    await Promise.race([client.request("app.hello"), timeout]);
    return child;
  } catch (error) {
    console.error(`Sidecar dengan ${node} gagal`, error);
    if (!exited) await child.kill().catch(() => {});
    return null;
  }
}

export function connectSidecar(client: RpcClient, onState: (state: SidecarState) => void) {
  let child: Child | null = null;
  let stopped = false;
  let failedStarts = 0;

  async function start(state: SidecarState) {
    onState(state);
    const candidates = await resolveNode();
    let ready = false;
    for (const node of candidates) {
      // Kandidat yang gagal ikut memanggil onExit; restart hanya dari proses yang pernah siap.
      child = await launch(node, client, () => {
        if (ready && !stopped) restart();
      });
      if (child) {
        ready = true;
        failedStarts = 0;
        onState("ready");
        return;
      }
    }
    failedStarts++;
    if (failedStarts >= MAX_FAILED_STARTS) onState("failed");
    else setTimeout(() => void start("reconnecting"), RESTART_DELAY_MS);
  }

  function restart() {
    child = null;
    setTimeout(() => void start("reconnecting"), RESTART_DELAY_MS);
  }

  void start("starting");
  return {
    async stop() {
      stopped = true;
      await child?.kill();
    },
  };
}
