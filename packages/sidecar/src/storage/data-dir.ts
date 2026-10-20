import { existsSync } from "node:fs";
import { cp, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { BrandKit, type ProjectSummary, Slug } from "@laras/shared";

// Folder data Laras (ARCH 8.1, ADR-009), dibuat sidecar saat mulai.
export const DEFAULT_DATA_DIR = join(homedir(), "Library/Application Support/Laras");

// Penanda bahwa brand contoh sudah pernah disalin, agar project contoh yang dihapus pengguna tidak
// muncul lagi (keputusan pemilik E-201: fixture disalin sekali).
const SEEDED = ".contoh-disalin";

export const projectsDir = (dataDir: string) => join(dataDir, "projects");

// Membuat folder data dan menyalin brand fixture sekali sebagai project walking skeleton.
export async function prepareDataDir(dataDir: string, fixtureBrandsDir: string): Promise<void> {
  const projects = projectsDir(dataDir);
  await mkdir(projects, { recursive: true });
  await mkdir(join(dataDir, "logs"), { recursive: true });
  if (existsSync(join(projects, SEEDED))) return;
  for (const entry of await readdir(fixtureBrandsDir, { withFileTypes: true })) {
    const target = join(projects, entry.name);
    if (!entry.isDirectory() || existsSync(target)) continue;
    await cp(join(fixtureBrandsDir, entry.name), target, { recursive: true });
  }
  await writeFile(join(projects, SEEDED), `${new Date().toISOString()}\n`);
}

// Folder project dari slug, atau null bila slug tidak sah atau project tidak ada.
export function projectPath(dataDir: string, slug: string): string | null {
  if (!Slug.safeParse(slug).success) return null;
  const dir = join(projectsDir(dataDir), slug);
  return existsSync(join(dir, "brand.json")) ? dir : null;
}

// Nama project dari judul pertama knowledge/business.md; Brand Kit belum punya field nama (E-301).
async function projectName(dir: string, slug: string): Promise<string> {
  const business = await readFile(join(dir, "knowledge/business.md"), "utf8").catch(() => "");
  return business.match(/^#\s+(.+)$/m)?.[1]?.trim() || slug;
}

export async function listProjects(dataDir: string): Promise<ProjectSummary[]> {
  const entries = await readdir(projectsDir(dataDir), { withFileTypes: true });
  const slugs = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name);
  const projects: ProjectSummary[] = [];
  for (const slug of slugs.sort()) {
    const dir = projectPath(dataDir, slug);
    if (!dir) continue;
    const brand = BrandKit.parse(JSON.parse(await readFile(join(dir, "brand.json"), "utf8")));
    projects.push({ slug, name: await projectName(dir, slug), primaryColor: brand.colors.primary });
  }
  return projects;
}
