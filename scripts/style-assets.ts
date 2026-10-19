// Aset demo khusus gaya (T-134): subjek dan foto yang membawa konsep gaya, dibuat Codex lewat
// CodexAssetProvider (prompt asset-cutout.md / asset-image.md). Tanpa --live hanya mencetak prompt.
// MEMAKAI KUOTA dengan --live: jalankan hanya dengan izin pemilik. Hasil ditulis ke
// out/style-assets/<brand>/assets/; salin ke fixtures/demo-assets/<brand>/ setelah dinilai.
import { mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { AssetRequest } from "../packages/shared/src/index.ts";
import { resolveClis } from "../packages/sidecar/src/cli/resolvePath.ts";
import { assetPrompt, CodexAssetProvider } from "../packages/sidecar/src/pipeline/assets.ts";
import { type BRANDS, demoBrand } from "./demo-content.ts";

type Brand = (typeof BRANDS)[number];
type StyleAsset = { brand: Brand; request: AssetRequest };

const cutout = (
  brand: Brand,
  id: string,
  subject: "person" | "object",
  description: string,
): StyleAsset => ({
  brand,
  request: { id, description, aspectRatio: "4:5", kind: "cutout", subject },
});
const photo = (brand: Brand, id: string, description: string): StyleAsset => ({
  brand,
  request: { id, description, aspectRatio: "4:5", kind: "photo" },
});

// Daftar disetujui pemilik 2026-10-19 (TASKS T-134).
export const STYLE_ASSETS: StyleAsset[] = [
  cutout(
    "kopi-lembayung",
    "corporate",
    "person",
    "A friendly coffee roaster in his thirties wearing a deep teal canvas apron over a cream shirt, sitting casually on a wooden stool, holding a kraft paper coffee bag on his knee, looking toward the upper left with a confident smile. Full body, three-quarter angle, natural daylight.",
  ),
  cutout(
    "seruni-skin",
    "corporate",
    "person",
    "A female dermatologist in her thirties with real, unretouched skin texture, wearing a navy medical tunic, sitting on the edge of a low white cube, holding a tablet with a blank screen at chest height, smiling toward the upper left. Full body, soft natural light.",
  ),
  cutout(
    "ritme-run-club",
    "corporate",
    "person",
    "A running coach in his late twenties in a cobalt blue running vest and black shorts, striding forward, holding a smartphone with a blank screen and pointing ahead with the other hand, energetic expression. Full body, early morning light.",
  ),
  cutout(
    "kopi-lembayung",
    "cyberpunk",
    "object",
    "A large single roasted coffee bean sculpture of polished dark metal standing upright like a monument on a short dark stone pedestal, a few small beans breaking off its edge and dissolving into small square fragments drifting right. Thin amber rim light from the left, teal rim light from the right.",
  ),
  cutout(
    "seruni-skin",
    "cyberpunk",
    "person",
    "A woman in her late twenties with real, unretouched skin texture, shoulders up, sleek navy high-collar jacket, a thin transparent visor across her eyes, calm confident gaze at the camera. Soft coral rim light on one side of the face, cool navy-blue rim light on the other.",
  ),
  cutout(
    "ritme-run-club",
    "cyberpunk",
    "person",
    "A sprinter in a cobalt blue running vest mid-stride from a low angle with one knee high, sweat visible, electric blue rim light from behind and red-orange rim light from the front side. Full body.",
  ),
  cutout(
    "kopi-lembayung",
    "retro",
    "person",
    "A man in a 1970s outfit, cream knit polo and brown flared trousers, leaping mid-air with legs bent, holding a kraft coffee bag high in one hand, joyful. Full body, 1970s magazine-ad photography with warm film grain.",
  ),
  photo(
    "seruni-skin",
    "retro",
    "A woman in her thirties with real skin texture, chin resting on her hand, looking out of a window, soft warm afternoon light, 1970s editorial portrait with natural film grain, muted navy and peach tones, plain light wall with empty space in the upper half.",
  ),
  cutout(
    "ritme-run-club",
    "retro",
    "person",
    "A runner in a cobalt blue singlet and red-orange shorts mid-leap with legs split wide as if jumping over an obstacle, arms spread, joyful, low angle, 1970s sports photography with warm film grain.",
  ),
];

async function main() {
  const args = process.argv.slice(2);
  const live = args.includes("--live");
  const only = args.filter((a) => !a.startsWith("--"));
  const selected = STYLE_ASSETS.filter(
    ({ brand, request }) => only.length === 0 || only.includes(`${brand}/${request.id}`),
  );
  let codexPath: string | undefined;
  if (live) {
    const codex = (await resolveClis()).find((s) => s.name === "codex");
    if (!codex?.found || !codex.loggedIn) throw new Error("codex tidak ditemukan atau belum login");
    codexPath = codex.path;
  }
  for (const { brand, request } of selected) {
    const { qa } = demoBrand(brand);
    if (!codexPath) {
      console.log(`--- ${brand}/${request.id}\n${await assetPrompt(request, qa.brand)}\n`);
      continue;
    }
    // cwd Codex: folder kosong (sama dengan T-121), bukan folder brand fixture.
    const jobDir = resolve("out/style-assets", brand);
    const projectDir = join(jobDir, "project");
    await mkdir(projectDir, { recursive: true });
    const started = Date.now();
    try {
      const entry = await new CodexAssetProvider({ codexPath }).generate(request, {
        projectDir,
        jobDir,
        brand: qa.brand,
      });
      const seconds = ((Date.now() - started) / 1000).toFixed(1);
      console.log(`${brand}/${request.id} selesai (${seconds} s): ${JSON.stringify(entry)}`);
    } catch (error) {
      console.log(`${brand}/${request.id} GAGAL: ${(error as Error).message}`);
    }
  }
}

await main();
