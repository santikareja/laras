// `pnpm spike -- --brand <slug> --brief "<teks>" [--variants N] [--template <id>] [--dry-run]
//  [--max-claude N] [--max-codex N] [--model <model>]`. MEMAKAI KUOTA kecuali --dry-run.
import { parseArgs } from "node:util";
import { spike } from "./spike.ts";

const argv = process.argv.slice(2);
const { values } = parseArgs({
  args: argv[0] === "--" ? argv.slice(1) : argv,
  options: {
    brand: { type: "string" },
    brief: { type: "string" },
    variants: { type: "string", default: "1" },
    template: { type: "string" },
    "dry-run": { type: "boolean", default: false },
    "max-claude": { type: "string", default: "12" },
    "max-codex": { type: "string", default: "3" },
    model: { type: "string" },
  },
});

if (!values.brand || !values.brief) {
  console.error('Pakai: pnpm spike -- --brand <slug> --brief "<teks>" [--variants N] [--dry-run]');
  process.exit(2);
}

const controller = new AbortController();
process.on("SIGINT", () => controller.abort());

const report = await spike({
  brand: values.brand,
  brief: values.brief,
  variants: Number(values.variants),
  template: values.template ?? null,
  dryRun: values["dry-run"],
  maxClaude: Number(values["max-claude"]),
  maxCodex: Number(values["max-codex"]),
  ...(values.model ? { model: values.model } : {}),
  signal: controller.signal,
});
if (report.jobs.some((job) => job.status !== "done")) process.exitCode = 1;
