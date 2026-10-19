import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { QaReport } from "../../packages/shared/src/index.ts";
import { styles } from "../../packages/templates/src/index.ts";
import { stylePatterns } from "../style-cases/index.ts";
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
    expect(report.retries).toBe(0);
    const [job] = report.jobs;
    expect(job).toMatchObject({
      status: "done",
      round: 2,
      templateId: "feed-bidang-warna",
      qaPassed: false,
      failures: [],
    });
    expect(job?.fixes.map((f) => f.severity)).toEqual(["wajib", "saran"]);
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

// AC T-133: dry-run per gaya. Layout dari pola demo pertama gaya, render dengan lapisan dan ambang
// gaya; render pertama lolos semua cek wajib.
describe("spike --dry-run per gaya (T-133)", () => {
  it.each(styles.map((style) => [style.id, style] as const))(
    "%s",
    { timeout: 60_000 },
    async (id, style) => {
      const variant = style.variants[0]?.id ?? "";
      const report = await spike({
        brand: "kopi-lembayung",
        brief: "Kenalkan biji kopi sangrai 200 g.",
        variants: 1,
        template: null,
        style: { id, variant },
        dryRun: true,
        maxClaude: 12,
        maxCodex: 3,
        outDir,
        log: () => {},
      });
      expect(report.style).toEqual({ id, variant });
      expect(report.styleFit?.fit).toMatch(/^(cocok|kurang-cocok)$/);
      const [job] = report.jobs;
      expect(job?.status).toBe("done");
      const dir = join(outDir, "kopi-lembayung", "project", "jobs", `${report.briefId}-v1`);
      const layout = JSON.parse(readFileSync(join(dir, "03-layout.json"), "utf8"));
      expect(layout.templateId).toBe(stylePatterns(id)[0]?.cases["kopi-lembayung"].archetype);
      const firstQa = QaReport.parse(JSON.parse(readFileSync(join(dir, "06-qa.json"), "utf8")));
      expect(firstQa.deterministic.failures).toEqual([]);
    },
  );
});
