import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import { listProjects, prepareDataDir, projectPath, projectsDir } from "./data-dir.ts";

const FIXTURE_BRANDS = new URL("../../../../fixtures/brands/", import.meta.url).pathname;
const tmp = mkdtempSync(join(tmpdir(), "laras-data-"));
afterAll(() => rmSync(tmp, { recursive: true, force: true }));

describe("folder data (T-202)", () => {
  it("menyalin brand fixture sekali dan tidak memunculkan lagi project yang dihapus", async () => {
    const dataDir = join(tmp, "sekali");
    await prepareDataDir(dataDir, FIXTURE_BRANDS);
    expect(existsSync(join(dataDir, "logs"))).toBe(true);
    const slugs = (await listProjects(dataDir)).map((project) => project.slug);
    expect(slugs).toEqual(["kopi-lembayung", "ritme-run-club", "seruni-skin"]);
    rmSync(join(projectsDir(dataDir), "ritme-run-club"), { recursive: true });
    await prepareDataDir(dataDir, FIXTURE_BRANDS);
    expect((await listProjects(dataDir)).map((project) => project.slug)).toEqual([
      "kopi-lembayung",
      "seruni-skin",
    ]);
  });

  it("memberi nama dari judul knowledge dan warna primer Brand Kit", async () => {
    const dataDir = join(tmp, "nama");
    await prepareDataDir(dataDir, FIXTURE_BRANDS);
    const [kopi] = await listProjects(dataDir);
    expect(kopi).toEqual({
      slug: "kopi-lembayung",
      name: "Kopi Lembayung",
      primaryColor: "#0F3D3E",
    });
  });

  it("hanya membuka folder project yang sah dan ada", async () => {
    const dataDir = join(tmp, "path");
    await prepareDataDir(dataDir, FIXTURE_BRANDS);
    expect(projectPath(dataDir, "kopi-lembayung")).toBe(
      join(projectsDir(dataDir), "kopi-lembayung"),
    );
    expect(projectPath(dataDir, "../kopi-lembayung")).toBeNull();
    expect(projectPath(dataDir, "tidak-ada")).toBeNull();
  });
});
