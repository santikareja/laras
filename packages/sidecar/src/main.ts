import { appendFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import sidecarPackage from "../package.json" with { type: "json" };
import { resolveClis } from "./cli/resolvePath.ts";
import { createJobRunner } from "./queue/runner.ts";
import { serveRpc } from "./rpc/server.ts";
import { DEFAULT_DATA_DIR, listProjects, prepareDataDir } from "./storage/data-dir.ts";

// Titik masuk sidecar (ARCH 4.3, 4.4, T-202): server RPC di stdin/stdout. stdout khusus RPC, jadi
// console dialihkan ke stderr sebelum server mulai. Lokasi bisa diganti lewat env (LARAS_DATA_DIR,
// LARAS_FIXTURES_DIR) untuk uji dan bundel aplikasi (T-203).

console.log = console.info = console.debug = console.error;

const dataDir = process.env.LARAS_DATA_DIR ?? DEFAULT_DATA_DIR;
const fixturesDir =
  process.env.LARAS_FIXTURES_DIR ?? fileURLToPath(new URL("../../../fixtures/", import.meta.url));

await prepareDataDir(dataDir, join(fixturesDir, "brands"));
const logFile = join(dataDir, "logs", "sidecar.log");
const log = (line: string) => {
  const stamped = `${new Date().toISOString()} ${line}\n`;
  process.stderr.write(stamped);
  appendFileSync(logFile, stamped);
};

let notify: ReturnType<typeof serveRpc>["notify"] = () => {};
const runner = createJobRunner({
  dataDir,
  demoAssetsDir: join(fixturesDir, "demo-assets"),
  notify: (name, params) => notify(name, params),
  log,
});
const server = serveRpc({
  input: process.stdin,
  output: process.stdout,
  log,
  handlers: {
    "app.hello": async () => ({ version: sidecarPackage.version, dataDir }),
    "cli.status": async () => resolveClis(),
    "project.list": async () => listProjects(dataDir),
    "job.start": async (params) => runner.start(params),
  },
});
notify = server.notify;
// UI sudah tidak membaca stdout: tidak ada gunanya terus bekerja.
process.stdout.on("error", () => process.exit(0));
log(`Sidecar ${sidecarPackage.version} siap, folder data ${dataDir}`);
await server.closed;
await runner.idle();
log("Input ditutup, sidecar berhenti");
