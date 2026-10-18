import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { spike } from "./spike.ts";

// Dry-run spike (tanpa kuota): seluruh rangkaian kecuali panggilan CLI asli.
const outDir = mkdtempSync(join(tmpdir(), "laras-spike-"));
afterAll(() => rmSync(outDir, { recursive: true, force: true }));

describe("spike --dry-run", () => {
  it("menjalankan pipeline penuh, dua putaran revisi, dan menulis laporan serta PNG", {
    timeout: 60_000,
  }, async () => {
    const lines: string[] = [];
    const report = await spike({
      brand: "kopi-lembayung",
      brief: "Ajak pekerja mampir pagi untuk kopi susu gula aren.",
      variants: 1,
      template: null,
      dryRun: true,
      maxClaude: 12,
      maxCodex: 3,
      outDir,
      log: (line) => lines.push(line),
    });
    expect(report.calls).toEqual({ claude: 8, codex: 3 });
    const [job] = report.jobs;
    expect(job).toMatchObject({ status: "done", round: 2, qaPassed: false, failures: [] });
    expect(job?.steps.map((s) => s.stage)).toEqual([
      "plan",
      "copy",
      "layout",
      "assets",
      "render",
      "qa",
      "revise",
      "assets",
      "render",
      "qa",
      "revise",
      "assets",
      "render",
      "qa",
    ]);
    const runDir = join(outDir, "kopi-lembayung", "runs", report.briefId);
    for (const file of ["laporan.md", "laporan.json", ...(job?.pngs ?? [])]) {
      expect(existsSync(join(runDir, file)), file).toBe(true);
    }
    expect(lines.at(-1)).toContain("laporan.md");
  });
});
