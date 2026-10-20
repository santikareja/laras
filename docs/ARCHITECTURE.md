# ARCHITECTURE — Laras

| Item | Nilai |
|---|---|
| Versi dokumen | 0.2 (draft) |
| Dokumen terkait | `PRD.md`, `DESIGN.md`, `KNOWLEDGE.md`, `../CLAUDE.md` |

Dokumen ini menjelaskan bagaimana Laras dibangun. Untuk *apa* yang dibangun dan *mengapa*, lihat `PRD.md`. Untuk tampilan dan penulisan UI, lihat `DESIGN.md`.

> **Catatan verifikasi:** flag dan perilaku Claude CLI serta Codex CLI dapat berubah antar versi. Versi CLI yang teruji, flag yang terverifikasi, dan perilaku yang belum terverifikasi dicatat di `docs/KNOWLEDGE.md`. Setelah CLI diperbarui, cek ulang dengan `--help` sebelum mengubah pemanggilan.

---

## 1. Prinsip Arsitektur

1. **Local-first.** Tidak ada server. Semua data di Mac pengguna.
2. **Kontrak dulu.** Semua data yang melintasi batas proses (UI ↔ sidecar ↔ CLI) didefinisikan sebagai skema Zod di `packages/shared`.
3. **Rust seminimal mungkin.** Hampir semua logika ditulis dalam TypeScript. Rust di Tauri hanya untuk konfigurasi dan hal yang memang wajib native.
4. **CLI di balik adapter.** Kode lain tidak boleh memanggil `claude` atau `codex` secara langsung, hanya lewat adapter, agar perubahan CLI cukup diperbaiki di satu tempat.
5. **Setiap tahap bisa dilanjutkan.** Output setiap tahap pipeline disimpan ke disk, sehingga job bisa diulang dari tahap mana pun.
6. **Desain deterministik di atas AI.** AI memilih dan mengisi; kode yang menjamin aturan (token brand, QA deterministik, render).

---

## 2. Gambaran Sistem

```
┌──────────────────────────────────────────────────────────────┐
│                         Laras (.app)                         │
│                                                              │
│  ┌──────────────────────┐        ┌────────────────────────┐  │
│  │   UI (React + TS)    │        │   Tauri 2 core (Rust)  │  │
│  │   WebView macOS      │◀──────▶│   window, menu, fs     │  │
│  └──────────┬───────────┘        │   scope, shell plugin  │  │
│             │ JSON-RPC (stdio)   └────────────────────────┘  │
│             ▼                                                │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              Sidecar (Node.js + TypeScript)            │  │
│  │                                                        │  │
│  │  RPC server ─▶ Job queue ─▶ Pipeline engine            │  │
│  │                               │                        │  │
│  │      ┌────────────┬───────────┼────────────┬────────┐  │  │
│  │      ▼            ▼           ▼            ▼        ▼  │  │
│  │  Claude       Codex      Template      Renderer  Storage│  │
│  │  adapter      adapter    engine (JSX)  (Playwright      │  │
│  │                                         + sharp) SQLite │  │
│  └──────┬────────────┬─────────────────────────────────────┘  │
└─────────┼────────────┼───────────────────────────────────────┘
          ▼            ▼
     `claude` CLI   `codex` CLI      (terinstal & login di Mac)
```

---

## 3. Struktur Monorepo

```
laras/
├── apps/
│   └── desktop/
│       ├── src/                  # React UI
│       │   ├── app/              # routing & layout halaman
│       │   ├── features/         # per fitur: projects, brand-kit, editor, library, ...
│       │   ├── components/       # komponen UI bersama (shadcn/ui)
│       │   ├── lib/rpc.ts        # klien JSON-RPC ke sidecar
│       │   ├── stores/           # Zustand stores
│       │   └── styles/           # tokens.css (DESIGN.md bagian 15)
│       └── src-tauri/            # Tauri 2 (Rust, minimal)
├── packages/
│   ├── shared/                   # skema Zod + tipe: RPC, BrandKit, LayoutSpec, Job, QA
│   ├── sidecar/
│   │   └── src/
│   │       ├── rpc/              # server JSON-RPC via stdio
│   │       ├── queue/            # antrean & penjadwalan job
│   │       ├── pipeline/         # tahap: plan, copy, layout, assets, render, qa, revise
│   │       ├── cli/              # adapter claude & codex + deteksi PATH
│   │       ├── prompts/          # prompt per tahap (file .md dengan placeholder)
│   │       ├── render/           # Playwright, QA deterministik, sharp
│   │       ├── storage/          # Drizzle + SQLite, akses folder project
│   │       └── context/          # generator CLAUDE.md/AGENTS.md per project
│   └── templates/
│       ├── feed/                 # template feed 4:5 (komponen JSX)
│       ├── carousel/             # sistem carousel 4:5
│       ├── primitives/           # komponen dasar: Text, Logo, Image, Grid, Badge
│       ├── styles/               # gaya desain: <id>/PANDUAN.md + style.ts (PRD F16)
│       └── tokens/               # brand.json → CSS variables
├── scripts/
│   ├── spike/                    # skrip Fase 1 (pipeline tanpa UI)
│   └── render-demo.ts            # render template contoh untuk dicek visual
├── fixtures/brands/              # 3 brand contoh untuk test & demo
├── docs/                         # PRD, ARCHITECTURE, DESIGN, STATUS, TASKS, KNOWLEDGE, SESSION_LOG
├── .claude/commands/             # slash command /lanjut dan /selesai
└── CLAUDE.md
```

Package manager: **pnpm workspaces**, scope paket `@laras/*`. Lint dan format: **Biome**. Test: **Vitest** dan **Playwright Test**.

---

## 4. Komponen

### 4.1 Desktop shell — Tauri 2

- Mengelola jendela, menu, dialog file, dan izin akses file system.
- Identifier aplikasi: `id.laras.desktop` (ADR-009).
- Menjalankan sidecar lewat `@tauri-apps/plugin-shell` dengan scope yang dibatasi (hanya path absolut `node` hasil resolusi ADR-008, dengan argumen ke file sidecar).
- Tidak berisi logika bisnis.

### 4.2 UI — React + TypeScript + Vite

- **Styling:** Tailwind CSS v4 (konfigurasi `@theme` di CSS, ADR-010) + shadcn/ui, ikon Lucide. Token UI di `apps/desktop/src/styles/tokens.css`, dipetakan ke Tailwind dan shadcn/ui sesuai `DESIGN.md` bagian 15.
- **Font:** teks UI memakai font sistem; Plus Jakarta Sans dibundel lokal untuk momen identitas (`DESIGN.md` bagian 4).
- **State lokal:** Zustand (project aktif, konten yang dibuka, status panel).
- **Data dari sidecar:** TanStack Query untuk request/response; event job di-push ke store.
- **Halaman utama:**
  - Daftar project
  - Workspace project: item sidebar Konten, Brand Kit, Knowledge, Copy Guide, Referensi (`DESIGN.md` bagian 6)
  - Studio: brief, grid varian, preview, chat revisi, editor teks, riwayat versi
  - Library
  - Pengaturan: path CLI, konkurensi, ambang QA
- **Preview desain:** HTML hasil template ditampilkan di `<iframe>` dengan skala yang sesuai, sehingga yang dilihat pengguna identik dengan yang dirender Playwright. PNG dipakai untuk thumbnail dan export.

### 4.3 Komunikasi UI ↔ Sidecar

- Protokol: **JSON-RPC 2.0 lewat stdin/stdout**, satu pesan JSON per baris (NDJSON).
- Request dari UI: misalnya `project.create`, `brandKit.update`, `job.start`, `job.resume`, `content.revise`, `export.run`.
- Notifikasi dari sidecar: `job.event` (perubahan tahap, log progres, hasil parsial), `cli.status`.
- Semua method dan payload didefinisikan di `packages/shared/src/rpc.ts` dan divalidasi di kedua sisi.
- Log sidecar ditulis ke **stderr dan file log**, tidak pernah ke stdout (stdout khusus RPC).
- Bila proses sidecar mati, UI menampilkan status "Menyambung ulang", menjalankan ulang sidecar, lalu job yang berjalan ditandai `interrupted` dan dapat dilanjutkan.

### 4.4 Sidecar — Node.js + TypeScript

- Runtime: **Node.js LTS yang terinstal di Mac pengguna** untuk MVP (lihat ADR-004).
- Menemukan Node (ADR-008): aplikasi GUI tidak mewarisi PATH terminal, jadi `node` tidak bisa dipanggil dengan nama saja. Sebelum sidecar dijalankan, path absolut Node di-resolve lewat login shell (`/bin/zsh -lic 'command -v node'`), dengan fallback `~/.local/share/fnm/aliases/default/bin/node`, `/opt/homebrew/bin/node`, dan `/usr/local/bin/node`. Hasilnya disimpan di pengaturan dan bisa diubah manual. Path fnm "multishell" tidak dipakai karena berubah setiap shell.
- Bundling: kode TypeScript dibundel menjadi satu file JS (tsup) yang disertakan sebagai resource aplikasi.
- Tanggung jawab: antrean job, pipeline, adapter CLI, template engine, renderer, QA, storage.

### 4.5 Adapter CLI

#### Deteksi CLI dan PATH

Aplikasi GUI macOS tidak mewarisi PATH dari terminal. Saat start, sidecar:

1. Membaca PATH dari login shell: `/bin/zsh -lic` yang mencetak `$PATH` diawali penanda `__LARAS_PATH__`, karena profil shell bisa mencetak teks lain ke stdout. Timeout 10 detik; bila gagal, langsung ke langkah 2 tanpa PATH shell.
2. Mencari `claude` dan `codex` di PATH tersebut, lalu di lokasi umum (`~/.local/bin` — lokasi installer resmi Claude dan Codex, `/opt/homebrew/bin`, `/usr/local/bin`, `~/.npm-global/bin`, `~/.bun/bin`, `~/.local/share/fnm/aliases/default/bin`). Path di folder fnm "multishell" diganti padanannya di alias `default`.
3. Memakai path manual dari Pengaturan bila deteksi otomatis gagal (PRD F14).
4. Memeriksa versi (`--version`) dan status login (`claude auth status --json`, `codex login status`; keduanya tanpa kuota, stdin ditutup, PATH dari login shell agar CLI berbasis skrip Node tetap jalan), lalu mengirim `cli.status` (skema `CliStatus` di `shared`) ke UI.

Salinan CLI bawaan Claude desktop app atau ekstensi editor (VS Code, Cursor, Kiro, Antigravity) sengaja dilewati walau ada di PATH, karena path-nya berubah setiap update dan versinya bisa alpha. Implementasi: `packages/sidecar/src/cli/resolvePath.ts` (`resolveClis`).

#### Claude adapter

Pemanggilan dasar (diuji di T-102 dengan Claude Code 2.1.302, lihat `KNOWLEDGE.md`):

```bash
claude -p "<prompt>" \
  --model claude-opus-5-5 \
  --output-format stream-json --verbose \
  --tools "Read" \
  --permission-prompts none \
  --no-session-persistence \
  --setting-sources project --strict-mcp-config --disable-slash-commands \
  --json-schema '<JSON Schema tahap>'
# cwd = folder project (ADR-011), stdin ditutup
```

- Prompt disusun dari file di `packages/sidecar/src/prompts/` (`plan`, `copy`, `layout`, `qa-visual`, `revise`, berbahasa Indonesia) lewat `renderPrompt(tahap, input)`: `{{schema}}` diisi JSON Schema dari Zod, data pengguna dan output AI sebelumnya ditaruh di blok `<tag>` yang ditandai sebagai data, dan tag penutup di dalam data dibuang. Konteks brand dikirim eksplisit di blok `<brand>` (`brandContext`: bahasa, tone, CTA, kata terlarang, emoji, hashtag, aturan desain, contoh copy) dan knowledge di `<knowledge>`, sehingga prompt tidak bergantung pada `CLAUDE.md` project.
- Proses dijalankan dengan `cwd` di folder project (ADR-011), sehingga `CLAUDE.md` project (konteks brand) otomatis terbaca dan `Read` menjangkau `references/` serta `jobs/<job-id>/`. Output tahap ditulis oleh sidecar, bukan oleh Claude.
- `--output-format stream-json` wajib disertai `--verbose`; tanpa itu CLI langsung keluar dengan error.
- Tool dibatasi dengan `--tools` (membatasi tool yang tersedia). `--allowedTools` hanya menyetujui tool secara otomatis dan tidak membatasi, jadi tidak dipakai untuk tujuan ini. Tahap yang butuh melihat gambar (QA visual) memakai `Read` pada file PNG di folder job.
- `--permission-prompts none`: aksi yang butuh izin (misalnya `Read` di luar cwd) langsung ditolak tanpa menggantung. Penolakan tercatat di `result.permission_denials`; adapter mencatatnya ke log job.
- Isolasi dari konfigurasi global pengguna (ADR-013): `--setting-sources project --strict-mcp-config --disable-slash-commands` mematikan hook, plugin, server MCP, skill, dan `~/.claude/CLAUDE.md` global, sambil tetap membaca `CLAUDE.md` project dan memakai login subscription. `--bare` dan `--safe-mode` tidak dipakai (lihat `KNOWLEDGE.md`).
- Validasi dua lapis: `--json-schema` (dari skema Zod tahap, dikonversi ke JSON Schema) membuat CLI memvalidasi output lewat tool `StructuredOutput`; adapter mengambil `result.structured_output`, lalu memvalidasinya lagi dengan Zod. Bila tidak valid atau tidak ada, adapter mengirim ulang prompt asli ditambah daftar masalah validasi (`prompts/retry-invalid-output.md`), maksimal 2 kali, lalu melempar `InvalidOutputError`. Panggilan yang gagal karena hal lain melempar `ClaudeRunError` (dengan potongan stderr).
- Event stream di-parse baris per baris dan diteruskan ke UI sebagai progres (urutan event di `KNOWLEDGE.md`). Stream dibaca sampai proses selesai, karena event lain bisa muncul sesudah `result`.
- Implementasi: `runClaude()` di `packages/sidecar/src/cli/claude.ts`, proses lewat `cli/stream.ts` (stdin ditutup, bisa dibatalkan dengan `AbortSignal`).

#### Codex adapter (aset gambar)

Pemanggilan dasar (diuji di T-101 dengan Codex 0.163.0, lihat `KNOWLEDGE.md`):

```bash
codex exec "<prompt aset>" \
  --cd <folder project> \
  --sandbox read-only \
  --skip-git-repo-check \
  --json \
  --ephemeral \
  --ignore-user-config
# stdin ditutup (ADR-012)
```

- Gambar dibuat oleh tool bawaan Codex `image_gen` (fitur `image_generation`, memakai login ChatGPT, tanpa `OPENAI_API_KEY`). Tidak ada flag khusus: prompt yang meminta gambar. Mode cadangan Codex yang memakai API key tidak dipakai.
- cwd adalah folder project (ADR-012). Tanpa repo git, Codex hanya membaca `AGENTS.md` di cwd, jadi dari folder job `AGENTS.md` project tidak terbaca. Sandbox `read-only` cukup karena file gambar ditulis Codex ke `CODEX_HOME`, bukan oleh agent ke workspace.
- `--skip-git-repo-check` wajib karena folder project bukan repo git. `--ignore-user-config` dan `--ephemeral` menjaga job dari konfigurasi global pengguna dan riwayat sesi. stdin wajib ditutup: bila stdin bukan TTY, `codex exec` membacanya sebagai tambahan prompt.
- Prompt aset selalu menyertakan: deskripsi visual, palet brand, gaya dari referensi, rasio target, serta larangan eksplisit **tanpa teks, huruf, logo, atau watermark**. Gambar referensi dapat dilampirkan dengan `-i <file>`.
- `image_gen` tidak menerima path tujuan; hasilnya tersimpan di `~/.codex/generated_images/<thread_id>/exec-<uuid>.png`, dengan `<thread_id>` dari event `thread.started` di stream `--json` (stream ini tidak memuat event khusus gambar). Adapter mencari file di folder itu, memvalidasi path-nya berada di dalam `generated_images/<thread_id>/`, lalu menyalinnya ke `jobs/<job-id>/assets/`.
- Ukuran tidak bisa diatur di mode bawaan; rasio diminta lewat prompt. Permintaan 4:5 menghasilkan 1122 × 1402 px, lalu renderer (sharp) melakukan resize dan crop ke ukuran slot.
- Adapter memastikan file gambar benar-benar tersalin ke folder job; bila tidak, tahap dianggap gagal.
- Implementasi: `runCodex()` di `packages/sidecar/src/cli/codex.ts` (stream `--json` lewat `cli/stream.ts`; exit non-zero menjadi `CodexRunError` atau `LimitReachedError` bila pesan cocok pola kuota). Prompt aset `prompts/asset-image.md` berbahasa Inggris seperti prompt yang terbukti di T-101/T-108/T-109; deskripsi dari tahap layout dibungkus `<description>` sebagai data.
- Satu panggilan menghasilkan satu gambar dalam sekitar 45 detik dan memakai puluhan ribu token input; jumlah aset per job perlu dibatasi demi kuota.
- Bila generasi gambar via Codex tidak tersedia, adapter aset dapat diganti dengan sumber lain (foto pengguna, library lokal) tanpa mengubah pipeline (lihat `AssetProvider` di 5.3).

#### Deteksi rate limit

- Claude CLI mengirim `rate_limit_event` di stream (`rate_limit_info.status`, `resetsAt`, `unifiedWindows.<jendela>.utilization`). Adapter memakainya sebagai sinyal utama dan untuk jam lanjut otomatis; nilai `status` selain `allowed` belum terverifikasi (lihat `KNOWLEDGE.md`).
- Untuk Codex, dan sebagai cadangan untuk Claude, adapter mengenali pola pesan batas kuota dan kode exit tertentu (pola dicatat di `cli/limits.ts` dan diperbarui bila berubah).
- Claude: `LimitReachedError` hanya dilempar bila panggilan gagal DAN (status `rate_limit_event` terakhir bukan `allowed` ATAU pesan cocok pola kuota). Status bukan `allowed` pada panggilan yang sukses hanya dicatat, agar pekerjaan yang ternyata jalan tidak dibatalkan. `resetsAt` diambil dari pesan atau `rate_limit_info.resetsAt`.
- Hasilnya `LimitReachedError`, yang membuat queue menjeda job dengan status `waiting_quota` dan mencoba lagi dengan backoff (5 menit, 15 menit, 60 menit) atau menunggu pengguna menekan "Lanjutkan".

---

## 5. Pipeline Generasi

### 5.1 State machine job

```
queued → plan → copy → layout → assets → render → qa ─┬─▶ done
                  ▲       ▲        ▲                  │
                  └───────┴────────┴── revise ◀───────┘ (maks 1 putaran)

Status khusus: waiting_quota · interrupted · failed · cancelled
```

- Satu job = satu varian. Tahap `plan` dijalankan sekali per brief dan menghasilkan satu `ContentPlan` berisi N angle berbeda (satu per varian); setiap job memakai angle-nya sendiri. Varian jadi berbeda secara bermakna (PRD F7) tanpa memanggil Claude N kali untuk `plan`.
- `revise` masuk ulang di tahap paling awal yang terdampak daftar perbaikan (`copy`, `layout`, atau `assets`), lalu tahap sesudahnya sampai `qa` dijalankan lagi.
- Setiap tahap menulis output ke `jobs/<job-id>/<nn>-<tahap>.json` dan mencatat event ke tabel `job_events`. Sebelum database ada, event ditulis ke `jobs/<job-id>/events.jsonl` (mulai, selesai, gagal, durasi, biaya) dan status ke `jobs/<job-id>/job.json` (skema `JobState`).
- Nomor langkah naik terus, termasuk putaran revisi: `01-plan`, `02-copy`, `03-layout`, `04-assets`, `05-render`, `06-qa`, lalu putaran revisi `revise`, `assets`, `render`, `qa` (`07`–`10`; sebelum T-137 ada putaran kedua `11`–`14`). Revise menghasilkan `Revision` (copy dan layout sekaligus), jadi putaran revisi masuk ulang di `assets`: hanya `regenerateAssets` dan aset baru yang dibuat, sisanya dipakai ulang. PNG dan HTML slide disimpan di `jobs/<job-id>/slides/<nn>-<i>.png`.
- `job.resume` memulai dari tahap pertama yang belum punya output valid (lolos skema tahap; aset dan PNG yang dirujuk harus ada). Begitu satu langkah dijalankan ulang, file langkah sesudahnya dianggap basi. File ditulis atomik (tulis sementara lalu rename).
- `LimitReachedError` menghentikan job dengan status `waiting_quota` (dan `resumeAt` bila diketahui); pembatalan menjadi `cancelled`; error lain menjadi `failed`. `runBrief` menjalankan job varian berurutan dan berhenti di `waiting_quota` atau `cancelled`.
- Implementasi: `packages/sidecar/src/pipeline/engine.ts` (`runBrief`, `runJob`) dan `stages.ts` (skema tahap yang diperketat konteks job, QA, pemetaan perbaikan). Skema tahap layout dan revise memeriksa template, slot, opsi, jumlah slide, dan varian logo yang benar-benar ada di Brand Kit (`logoIssues` di `shared`, T-119), sehingga output yang salah masuk retry validasi atau diulang saat resume, bukan gagal di renderer.

### 5.2 Tahap dan kontraknya

| Tahap | Pelaksana | Input | Output (skema di `shared`) |
|---|---|---|---|
| plan | Claude | brief, knowledge, referensi, jumlah varian, konteks gaya | `ContentPlan`: pesan utama, audiens, `setting` (lokasi dan orang, bahasa Inggris), struktur slide, satu angle per varian dengan `visual` (ide, gambar, jenis `cutout`/`photo`/`concept`) |
| copy | Claude | ContentPlan, copy guide | `CopyDraft`: teks per slot per slide, caption, hashtag |
| layout | Claude | CopyDraft, katalog arketipe (arketipe gaya job lebih dulu), brand tokens, konteks gaya, arketipe varian lain dari brief yang sama | `LayoutSpec`: templateId, slot terisi, opsi template, `styleOptions` bila ada gaya, kebutuhan aset (foto atau cut-out) |
| assets | Codex / pengguna | kebutuhan aset, brand, gaya, `setting` plan, aturan foto brand | `AssetManifest`: path file, ukuran, sumber |
| render | Kode | LayoutSpec, AssetManifest, tokens | HTML per slide, PNG master, `RenderReport` |
| qa | Kode + Claude | PNG, RenderReport, brand, copy guide | `QaReport`: hasil cek deterministik, skor visual, daftar perbaikan |
| revise | Claude | QaReport, LayoutSpec, CopyDraft | `Revision`: `copy` dan `layout` utuh dengan hanya bagian yang diminta berubah, `regenerateAssets`, `summary` |

### 5.3 Abstraksi penting

```ts
// packages/shared — ringkasan, bukan kode final
interface LayoutSpec {
  templateId: string;          // harus ada di katalog template
  format: "feed-4x5" | "carousel-4x5";
  slides: Array<{
    slots: Record<string, SlotValue>;   // teks, gambar, logo, badge
    options: Record<string, string>;    // varian template yang diizinkan, mis. "align": "left"
  }>;
}

interface AssetProvider {
  generate(req: AssetRequest, ctx: JobContext): Promise<AssetResult>;
}
// Implementasi: CodexAssetProvider, UserUploadAssetProvider, LocalLibraryAssetProvider
```

Kode di `packages/sidecar/src/pipeline/assets.ts` (`LocalLibraryAssetProvider` menunggu PRD 12 pertanyaan 4). Setiap aset menjadi `jobs/<id>/assets/<asset-id>.jpg` (JPG 92 sRGB) yang dipotong ke `aspectRatio` permintaan tanpa memperbesar, dengan smart crop sharp `attention` dan orientasi EXIF diterapkan. Gambar Codex asli disimpan sebagai `<asset-id>.original.png` agar revisi ke rasio lain cukup dipotong ulang. Aset `kind: "cutout"` (wajib membawa `subject`: `person` atau `object`) tidak dipotong: `storeAsset` menolaknya dengan pesan jelas bila kurang dari 5% pikselnya transparan (job gagal, tanpa panggilan ulang otomatis), lalu menormalkan alpha ke `<asset-id>.webp` dan menganalisis kotak alpha serta titik fokusnya (`analyzeCutout`). Prompt Codex untuk cut-out ada di `prompts/asset-cutout.md`, untuk foto di `prompts/asset-image.md`. Sumber divalidasi: `thread_id` berformat UUID dan file (setelah `realpath`) di dalam `generated_images/<thread_id>/`; foto pengguna hanya dari folder yang diizinkan dan harus PNG/JPG/WebP.

### 5.4 Strategi revisi

- QA menghasilkan daftar perbaikan yang terarah (misalnya "headline terlalu panjang, maks 6 kata", "kontras CTA kurang").
- Revisi hanya mengubah bagian yang disebut; aset gambar tidak dibuat ulang kecuali masalahnya memang di aset. Ini menghemat kuota.
- Revisi dari chat pengguna memakai jalur yang sama, dengan instruksi pengguna sebagai daftar perbaikan.
- QA visual hanya dijalankan bila semua cek deterministik lolos (hemat kuota); bila tidak, `QaReport.visual` bernilai null dan perbaikan berasal dari cek yang gagal: kontras, warna, font, ukuran font, dan safe margin ke `layout`; overflow, kata terlarang, dan emoji/hashtag ke `copy`; aset rusak ke `assets`. Setiap perbaikan punya `severity`: cek kode yang gagal selalu `wajib`; QA visual memberi `wajib` untuk masalah yang membuat postingan belum layak terbit dan `saran` untuk selera. QA lolos bila cek deterministik lolos, skor `idea` ≥ 7 dan rata-rata delapan aspek ≥ 6 (`VISUAL_PASS`, kalibrasi T-137), dan tidak ada perbaikan wajib (PRD F9). Prompt QA visual menerima knowledge, pratinjau logo PNG (`pipeline/logo-preview.ts`, `jobs/<id>/qa/logo-<varian>.png`), gambar `references/` project, dan ringkasan cek kode (saran desain dan aturan brand). Revisi otomatis hanya menerima perbaikan wajib bila ada (saran tidak ikut agar revisi tetap terarah); bila QA gagal karena skor tanpa perbaikan wajib, semua perbaikan dikirim. Revisi maksimal 1 putaran (`MAX_ROUNDS`). Hasil akhir job adalah putaran terbaik (`bestQa`: lolos, cek kode lolos, tanpa perbaikan wajib, skor `idea`, rata-rata, lalu putaran terbaru), dan `JobResult.qa.round` menunjuk render yang dipakai (`stepOf`). Bila masih gagal, job tetap `done` dengan `QaReport` gagal agar UI memberi peringatan. `regenerateAssets` hanya sah bila perbaikan yang dikirim ke revisi memuat target `assets` (`revisionSchema(context, allowRegenerate)`), sehingga revisi komposisi tidak membuat ulang foto (ADR-017).

---

## 6. Sistem Template dan Design Token

### 6.1 Design token

`brand.json` per project (divalidasi skema `BrandKit`):

```json
{
  "colors": {
    "primary": "#0F3D3E", "secondary": "#E2DCC8", "accent": "#F2A541",
    "neutral": { "50": "#FAFAF7", "900": "#111111" }
  },
  "typography": {
    "heading": { "family": "Brand Display", "file": "fonts/BrandDisplay-Bold.woff2", "weights": [700] },
    "body":    { "family": "Brand Sans",    "file": "fonts/BrandSans-Regular.woff2", "weights": [400, 600] },
    "scale":   [24, 32, 44, 60, 84, 112]
  },
  "shape": { "radius": 0, "stroke": 2, "shadow": "none" },
  "spacing": { "unit": 8, "safeMargin": 64 },
  "logo": { "primary": "logo/primary.svg", "onDark": "logo/on-dark.svg" },
  "rules": ["Tanpa gradient", "Logo selalu kanan bawah"]
}
```

Token diubah oleh `brandCss(brand, { assetBaseUrl })` (`packages/templates/tokens`) menjadi `@font-face` untuk font heading dan body, ditambah CSS variables di `:root` yang disuntikkan ke setiap template. Nama variabel berikut adalah kontrak antara token dan template:

| Variabel | Sumber di `brand.json` | Nilai |
|---|---|---|
| `--color-primary`, `--color-secondary`, `--color-accent` | `colors` | hex apa adanya |
| `--color-neutral-<kunci>` | `colors.neutral` | satu variabel per kunci, mis. `--color-neutral-50` |
| `--color-neutral-light`, `--color-neutral-dark` | `colors.neutral` | alias ke kunci netral terendah dan tertinggi; template memakai alias ini, bukan kunci |
| `--font-heading`, `--font-body` | `typography.heading/body.family` | nama family tanpa font cadangan, agar fallback tertangkap QA (7.2) |
| `--font-accent`, `--font-accent-weight`, `--font-accent-weight-strong` | `typography.accent` (opsional, T-134) | family dan bobot font aksen; tanpa font aksen nilainya dari font body |
| `--font-heading-weight`, `--font-heading-weight-strong`, `--font-body-weight`, `--font-body-weight-strong` | `typography.heading/body.weights` | bobot terkecil dan terbesar yang diizinkan |
| `--font-size-1` … `--font-size-N` | `typography.scale` | px, urut dari terkecil |
| `--space-1` … `--space-8` | `spacing.unit` | unit × 1, 2, 3, 4, 6, 8, 12, 16 (8–128 px bila unit 8) |
| `--space-safe` | `spacing.safeMargin` | px |
| `--shape-radius`, `--shape-stroke` | `shape.radius`, `shape.stroke` | px |
| `--shape-shadow` | `shape.shadow` (`none` atau `soft`) | `none`, atau untuk `soft`: `0 8px 24px` dengan warna netral tergelap 16% |
| `--device-highlight-bg`, `--device-highlight-text`, `--device-highlight-tilt`, `--device-sticker-rotate`, `--device-scribble-<bentuk>`, `--device-tape` | `devices` (opsional, T-124) | warna dan kemiringan sorot, rotasi stiker, coretan dan selotip yang boleh tampil (`block`/`none`); tanpa `devices` sama dengan bawaan primitives (sorot aksen −2°, stiker tegak, semua coretan dan selotip). Primitives memakainya bila arketipe tidak memberi nilai sendiri |

`@font-face` memakai `url()` hasil resolve `file` terhadap `assetBaseUrl` (URL folder project berakhiran `/`, ditentukan renderer atau preview), `font-weight` berupa rentang bobot yang diizinkan (mis. `400 600`), dan `font-display: block`. File font yang hasil resolve-nya keluar dari folder project ditolak.

### 6.2 Template

- Template adalah **komponen React (JSX)** di `packages/templates`, di-render ke HTML statis dengan `renderToStaticMarkup`.
- Setiap template mengekspor:
  - `meta` (skema `TemplateMeta` di `shared`): id, nama, format, deskripsi kapan dipakai, daftar slot (nama, tipe, wajib atau tidak, deskripsi isi, `maxChars` untuk teks dan badge, `aspectRatio` untuk gambar), dan opsi yang diizinkan (nilai dan default). Nama slot teks mengikuti field `CopySlide` (`headline`, `subheadline`, `body`, `cta`) bila maknanya sama.
  - komponen render `Slide` yang menerima slot yang sudah di-resolve (`SlideProps`).
- `layoutIssues(spec, meta)` di `shared` memeriksa `LayoutSpec` terhadap meta: slot wajib, tipe, batas karakter, rasio aset, dan opsi. Dipakai `render:demo` dan nanti tahap layout.
- Katalog: `packages/templates/src/catalog.ts` berisi arketipe (`archetypes`). Empat template feed awal (`feed-foto-teks`, `feed-sorotan`, `feed-foto-penuh`, `feed-kutipan`) dipensiunkan di T-131. Spesimen brand bukan bagian katalog.
- Template hanya boleh memakai CSS variables dari token, tidak boleh nilai warna atau font hard-coded (dicek oleh lint khusus).
- Teks, badge, gambar, logo, dan grid dibangun dari primitives `Text`, `Badge`, `Image`, `Logo`, `Grid` (`packages/templates/primitives`). Props-nya hanya menerima nama token (warna, langkah ukuran 1–6, langkah spacing 1–8), jadi template tidak bisa memberi nilai mentah. Setiap elemen slot diberi `data-slot` agar QA (7.2) dan editor manual (PRD F11) bisa memetakannya kembali ke `LayoutSpec`. `Text` mengunci bobot dari token dengan `font-synthesis: none` dan tidak pernah memotong teks; `Image` dan `Logo` menerima URL yang sudah di-resolve. Penempatan elemen di dalam `Grid` diatur template.
- Katalog template (`meta` semua template) dikirim ke Claude di tahap `layout`, sehingga Claude memilih dari opsi yang sudah dikurasi. Engine juga mengirim arketipe yang sudah dipakai varian lain dari brief yang sama (`<used-templates>`, dibaca dari `03-layout.json` varian sebelumnya) agar varian tidak memakai komposisi yang sama (PRD 4 K6).
- **Arketipe komposisi (ADR-015, T-123):** `feed-kata-raksasa`, `feed-bidang-warna`, `feed-satu-objek`, `feed-foto-konsep`, dan `feed-kolase-diagonal` di `packages/templates/feed/`, didaftarkan di `src/archetypes.ts` dan menjadi katalog Claude sejak T-131. Parameter berupa enum di `options` (warna bidang, sisi subjek, posisi logo sesuai aturan brand, dan sejenisnya). Geometri dihitung sendiri: `src/geometry.ts` menghitung titik fokus subjek di kanvas (`containedFocus`) sehingga teks diletakkan berseberangan diagonal (PRD 4 P8), dan kata raksasa dipaskan renderer (7.1). Sejak T-131 `thirdsPlacement` menggeser subjek berfokus asimetris agar titik fokusnya mendekati titik sepertiga sisinya: horizontal hanya menjauhi teks dan maksimal 12% lebar, vertikal maksimal 8% tinggi; subjek yang terpotong di bawah hanya boleh turun dan tidak diperbesar, agar tidak mendorong subjek ke kolom teks (P6 di atas P8). Arketipe terpusat ditandai `data-qa-composition="center"`. Slot gambar bertanda `cutout: true` membutuhkan aset `kind: "cutout"` yang membawa `subject` (kotak alpha dan titik fokus).
- Perangkat grafis tambahan sejak T-122: `Display` (kata raksasa, bertumpuk, bertanda `data-fit`), sorot di `Text` (`highlight`), `measure` dan `balance` di `Text` (PRD 4 P4), `Sticker`, `Scribble`, `Frame` (tepi sobek dan duotone), dan `Tape`. Semuanya hanya menerima nama token.
- **Gaya desain (PRD F16, T-128):** `packages/templates/styles/<id>/` berisi `PANDUAN.md` (panduan lengkap 14 bagian untuk generate desain) dan `style.ts` yang lolos skema `StyleMeta` di `shared`: varian, arketipe yang dipakai dan yang direncanakan, kategori tipografi, peran token warna (60-30-10), bentuk, perangkat grafis (`ada` atau `perlu-dibuat`), arahan foto dan frasa prompt gambar, aturan P1–P11 yang dilonggarkan atau diperketat (P7 tidak boleh dilonggarkan), dan cek kecocokan Brand Kit. `styleFit(style, brand)` memberi `cocok` atau `kurang-cocok` beserta alasan dari cek warna (gelap, terang, jenuh), sudut (≥ 16 px membulat, ≤ 8 px siku), dan bayangan lembut. Daftar gaya: `styles` di `styles/index.ts`.
- **Gaya di pipeline (ADR-016, T-133):** gaya brief (`JobSpec.style`, default dari `project.json`) mengalir ke semua tahap: konteks `<style>` di prompt Claude, arahan gambar di prompt Codex, katalog dengan arketipe gaya lebih dulu, `styleOptions` di layout dan revise (divalidasi `styleChoiceIssues`), render dengan `StyleChoice` (`{ ...JobSpec.style, options: styleOptions }`), dan ambang QA `designLimits(gaya, varian)`. Tanpa gaya, prompt menyebut "Tanpa gaya" dan `styleOptions` harus kosong.
- **Lapisan gaya (T-132):** `renderLayoutHtml` menerima `style` (`StyleChoice` di `shared`: gaya, varian, opsi enum di `StyleMeta.options`), memvalidasi dan mengisi default (`resolveStyleChoice`), menambah variabel CSS gaya (`styleCss`: kapital dan tracking heading, `--radius-pill` hanya bila radius brand ≥ 16 px, override seperti safe margin 80 px Retro iklan cetak), lalu meneruskan `style` ke `SlideProps`. Setiap gaya punya `styles/<id>/render.tsx` (`StyleRender`): `Backdrop` (di atas bidang latar, di bawah subjek), `Overlay` (lapisan atas dan label dari slot opsional `label`), `treatment` (perlakuan foto `Photo`: mono, fotokopi, halftone, duotone, hangat, tint, neon), `effect` (efek teks untuk kata raksasa dan headline besar), dan `Specimen`. Arketipe memberi lapisan konteks: sudut kosong untuk label, `surface` (terang, gelap, foto), `subjectSide`, dan `floor`. Tanpa gaya, arketipe dirender identik dengan sebelumnya (dibuktikan perbandingan piksel `render:demo`). Brand Kit menang: radius, bayangan, dan aturan brand menentukan opsi (mis. glow padat untuk brand tanpa gradient).
- **Perangkat grafis gaya (T-132)** di `primitives/`: `Texture.tsx`, `Lines.tsx`, `Labels.tsx`, `Shapes.tsx`, `Effects.tsx` (efek teks `effect` di `Display` dan `Text`), `Icons.tsx` (set ikon garis milik Laras, tanpa dependency), `Buttons.tsx`, `Cards.tsx`, `Glass.tsx`, `DeviceMockup.tsx`, `PhotoCells.tsx`, `Photo.tsx`, `noise.ts`. Arketipe baru dari panduan: `feed-panel-info` (Corporate) dan `feed-kartu-kaca` (Glassmorphism).
- Template carousel didefinisikan sebagai **sistem**: kumpulan tipe slide (hook, isi, daftar, kutipan, CTA) yang berbagi grid dan elemen berulang.

### 6.3 Mode template kustom (setelah MVP)

Claude dapat diminta merancang template baru dalam alur terpisah, ditinjau pengguna, lalu disimpan ke folder `templates/` milik project. Template kustom tetap wajib lolos lint token.

---

## 7. Renderer dan QA Deterministik

### 7.1 Render

- **Playwright + Chromium** (`playwright-core` dipin 1.60.0 = Chromium 148, revisi 1223), viewport 1080 × 1350, `deviceScaleFactor: 2` → master 2160 × 2700. Kode di `packages/sidecar/src/render/`.
- `LayoutSpec` → HTML: slot gambar di-resolve ke `/job/<path>` dari `AssetManifest`, logo ke `/project/<path>` dari Brand Kit (path dicek tetap di bawah folder), lalu `Template.Slide` dirender dengan `renderToStaticMarkup` dan dibungkus dokumen berisi `brandCss`.
- Halaman dimuat dari origin `http://laras.invalid/` yang hanya dilayani route Playwright (ADR-014): `/slide.html` dari memori, `/project/…` dan `/job/…` dari disk (hanya font dan gambar, path dicek tetap di dalam folder), request lain diblokir termasuk internet.
- Font dimuat lewat `@font-face` dari file lokal project. Renderer menunggu `load`, `document.fonts.ready`, dan semua `<img>` selesai di-decode sebelum screenshot.
- **Stiker miring di safe margin (T-124):** sesudah fit-to-width, `ROTATION_SCRIPT` (`render/fit.ts`) menggeser elemen `data-rotate-safe` (stiker) ke dalam sejauh kotak miringnya melewati safe margin, hanya bila kotak tegaknya di dalam safe margin; pelanggaran tata letak sungguhan tetap tertangkap QA.
- **Fit-to-width (T-123):** sebelum kolektor QA dan screenshot, `render/fit.ts` mengukur lebar teks sebenarnya (`Range`) setiap elemen `data-fit` dan menskalakan `font-size` agar pas dengan lebar kotaknya, dibatasi `data-fit-max` (ekspresi CSS yang dihitung di samping elemen agar variabel induk ikut terbaca). Ini menggantikan perkiraan lebar huruf per font.
- Satu browser instance dipakai ulang; setiap slide dirender di context dan page baru.
- Browser: saat ini cache Playwright bawaan (`~/Library/Caches/ms-playwright`). Unduhan Chromium ke `~/Library/Application Support/Laras/browsers` saat pertama kali dipakai menjadi bagian E-403. Fallback: Google Chrome yang terinstal (`channel: "chrome"`).
- `pnpm render:demo` (lewat `tsx`, karena template berupa JSX) merender spesimen brand dan semua template × 3 brand fixture ke `out/demo/`.
- `pnpm render:styles` merender setiap pola khas gaya (`scripts/style-cases/<id>.ts`, T-134) × 3 brand fixture (PNG 1080 dan thumbnail 360 px dari `toThumbnail`), spesimen perangkat per gaya, lembar ringkasan per brand dengan tanda "kurang cocok" (`styleFit`), dan `index.json` ke `out/styles/`; QA dijalankan dan keluar dengan kode 1 bila gagal. `pnpm render:styles -- <id gaya>` hanya merender gaya itu.

### 7.2 QA deterministik (dijalankan di dalam page sebelum screenshot)

Kode di `packages/sidecar/src/render/qa/`. Renderer menjalankan kolektor di page (string, bukan fungsi, karena tsx/esbuild menyisipkan helper `__name` yang tidak ada di page), membaca font yang benar-benar dipakai lewat CDP, lalu menilai aturan sebagai fungsi murni di Node (`rules.ts`) dan menghasilkan `RenderCheck` per slide; `buildRenderReport()` menyusun `RenderReport`. Elemen teks = elemen dengan node teks langsung; elemen penting = `[data-slot]` dengan `data-slot-type` selain `image` (ditulis primitives). Setiap pelanggaran menjadi satu cek gagal; aturan tanpa pelanggaran menghasilkan satu cek lolos. Aturan brand terstruktur (`BrandKit.constraints`, T-124, `qa/brand.ts`) bertingkat wajib: `brand-logo-position` (pusat slot logo di kuadran wajib), `brand-gradient` (gradient CSS yang tampak di latar, mask, atau border; pola bertanda `data-qa-gradient="pattern"`, gradient berulang, dan gradient satu warna tidak dihitung), dan `brand-visuals` (gambar, foto latar, dan bentuk ≤ batas brand). Lembar spesimen perangkat dilewati (`QaContext.brandRules: false`).

- **Kontras** ≥ 4.5:1, atau ≥ 3:1 untuk teks ≥ 32 px (PRD F9). Latar efektif dicari dengan `elementsFromPoint` di beberapa titik tiap baris: mulai dari elemen teks itu sendiri, elemen pertama yang berupa gambar atau berlatar opaque. Bila teks berada di atas gambar (atau latar transparan sebagian), renderer mengambil screenshot kedua dengan teks disembunyikan dan menghitung kontras terhadap piksel latar di area baris teks; nilai yang dinilai adalah persentil ke-5 (95% piksel latar memenuhi rasio itu). Untuk teks di atas foto, screenshot penanda (teks magenta murni, `MARK_TEXT_CSS`) membatasi sampel ke piksel huruf yang terlihat, sehingga huruf yang tertutup subjek di depannya (kata raksasa di latar adegan) tidak dinilai (T-141).
- **Teks di atas area foto yang ramai (T-141, wajib):** untuk teks yang langsung berada di atas foto atau cut-out (latar `IMG` di `elementsFromPoint`, ditandai `photo`), setiap baris dibagi petak persegi setinggi barisnya pada screenshot latar tanpa teks (huruf dan dekorasi teks disembunyikan), dan nilai teks adalah simpangan baku luma sRGB petak paling ramai (`sampleBusy`). Gagal bila > 13 (`BUSY_LIMIT`, `QaContext.busyLimit` untuk kalibrasi). Kata raksasa (≥ 180 px) dan teks di atas bentuk SVG atau panel tembus pandang dikecualikan. Perbaikannya bertarget `assets` (foto dibuat ulang dengan area polos) atau layout.
- **Overflow:** gagal bila teks lebih lebar dari kotaknya (`scrollWidth > clientWidth`), baris teks (`Range.getClientRects`) keluar dari kanvas, atau kotak dua elemen penting saling bertabrakan. `scrollHeight` tidak dipakai karena heading dengan `line-height` < ascent + descent selalu "overflow" tanpa terpotong (KNOWLEDGE).
- **Safe margin:** kotak elemen penting berjarak ≥ `spacing.safeMargin` brand dari setiap tepi.
- **Ukuran font** semua teks ≥ 24 px.
- **Font Brand Kit:** CDP `CSS.getPlatformFontsForNode` per elemen teks; glyph dari font non-`@font-face` berarti font cadangan (kecuali font emoji sistem untuk glyph emoji). Family pertama di computed `font-family` harus font heading atau body, dan bobotnya termasuk yang diizinkan peran itu.
- **Warna Brand Kit:** warna teks, latar, dan border (bila tebal > 0) persis salah satu warna palet; yang transparan dan bayangan diabaikan.
- **Kata terlarang** `forbiddenWords` (tanpa beda huruf besar/kecil, batas kata Unicode), **emoji** per slide ≤ `emoji.max` copy guide (0 bila tidak diizinkan), dan **hashtag** tidak boleh di gambar (tempatnya di caption).
- **Aset:** gambar dengan `naturalWidth` 0 atau `@font-face` berstatus `error`.

`pnpm render:demo` ikut menjalankan QA dan keluar dengan kode 1 bila ada cek gagal; isi demo seluruh katalog × 3 brand juga menjadi fixture patuh di `scripts/demo-qa.test.ts`.

**Aturan desain terukur (T-130, PRD 4 P1, P2, P4, P8–P11).** Setiap `RenderCheck` punya `severity`: `wajib` (bawaan, aturan di atas) atau `saran`. Aturan desain bertingkat saran sampai terkalibrasi: dilaporkan di `RenderReport` dan skrip render, tetapi tidak menggagalkan render, revisi otomatis, atau gerbang QA visual (`isBlocking` di `shared`). Ambangnya `DesignLimits` (angka PRD 4), ditimpa `StyleMeta.limits` dan `variantLimits` gaya (`designLimits`), dikirim lewat `QaContext.design`.
- Data ukur dari `qa/design-collect.ts` di page: blok untuk perataan dan jarak tepi (grup dan slot teks, badge, logo yang berdiri sendiri; teks diukur dari tintanya, tombol berlatar dari kotaknya), ukuran dan baris setiap slot teks, titik fokus subjek (`data-qa-focus` di `Image`, dihitung dengan object-fit), elemen yang dihitung, radius bidang, dan sudut rotasi.
- Penanda di arketipe dan primitives: `data-qa-element="group"` (dihitung satu, slot di dalamnya tidak), `shape` (bentuk yang dihitung), `background` (foto latar penuh: ruang kosong P10 tidak diukur dan foto boleh menjadi warna dominan P9), `decor` (tekstur, garis, bingkai: tidak dihitung). `data-qa-composition="center"` di arketipe terpusat melewati P8.
- Statistik piksel `qa/pixels.ts`: render diperkecil ke 216 × 270, setiap piksel dipetakan ke warna palet terdekat (jarak RGB ≤ 40, selain itu gambar); ruang kosong = piksel warna dominan di luar kotak teks dan logo.
- Lapisan dekoratif harus `pointer-events: none` agar tidak terbaca sebagai latar teks; bentuk SVG di belakang teks (bukan kotak `<svg>`-nya) membuat kontras diukur dari piksel.

### 7.3 Pasca-proses (sharp)

- Konversi ke profil warna sRGB.
- Export upload: resize 2160 → 1080 px (Lanczos) dengan sharpening ringan; PNG atau JPG kualitas 92.
- Thumbnail 360 px untuk library.

---

## 8. Penyimpanan

### 8.1 Lokasi

Folder data ditentukan oleh sidecar (ADR-009), terpisah dari folder data WebView yang dikelola Tauri berdasarkan identifier `id.laras.desktop`.

```
~/Library/Application Support/Laras/
├── app.db                         # SQLite (metadata, index, riwayat)
├── logs/
├── browsers/                      # Chromium Playwright
└── projects/
    └── <project-slug>/
        ├── CLAUDE.md              # dibuat otomatis dari brand + knowledge (jangan edit manual)
        ├── AGENTS.md              # konteks gaya visual untuk Codex (dibuat otomatis)
        ├── brand.json
        ├── fonts/  logo/
        ├── knowledge/             # business.md + file tambahan
        ├── copy-guide.json
        ├── project.json           # pengaturan project: gaya default (ProjectSettings, ADR-016)
        ├── references/            # gambar + references.json (catatan per gambar)
        ├── templates/             # template kustom (setelah MVP)
        ├── contents/
        │   └── <content-id>/
        │       └── versions/<n>/  # layout.json, copy.json, slides/*.html, slides/*.png
        └── jobs/<job-id>/         # output per tahap, aset, log job
```

Folder project bersifat mandiri: bisa disalin, di-backup, atau dimasukkan ke Git.

### 8.2 Skema database (Drizzle + better-sqlite3)

| Tabel | Isi utama |
|---|---|
| `projects` | id, slug, nama, status, dibuat/diubah |
| `contents` | id, project_id, judul, format, status (draft/ready/posted), versi aktif |
| `versions` | id, content_id, nomor, sumber (generate/revise/manual), path folder, catatan |
| `jobs` | id, content_id, varian, status, tahap saat ini, error, durasi |
| `job_events` | id, job_id, waktu, tipe, payload JSON |
| `settings` | key, value |
| `contents_fts` | FTS5: brief, caption, teks di gambar |

Data utama (brand, knowledge, layout) tetap di file; database adalah index dan riwayat. Bila database hilang, index dapat dibangun ulang dari folder project.

### 8.3 Generator konteks project

`context/` menyusun `CLAUDE.md` dan `AGENTS.md` project setiap kali Brand Kit, knowledge, copy guide, atau referensi berubah. Sejak T-114 aturan brand untuk tahap Claude dikirim eksplisit di prompt, jadi `CLAUDE.md` project cukup memuat hal yang stabil (identitas, daftar file knowledge tambahan) agar tidak dobel; `AGENTS.md` tetap jadi konteks gaya untuk Codex. Isinya ringkas dan terstruktur: identitas brand, aturan desain, tone, kata terlarang, ringkasan bisnis, dan daftar file knowledge untuk dibaca bila perlu.

---

## 9. Keamanan dan Privasi

- Tidak ada server, telemetri, atau analitik.
- CLI dijalankan dengan tool dan sandbox seminimal mungkin, dengan `cwd` di dalam folder project atau job.
- Input pengguna yang masuk ke prompt dipisahkan dengan jelas dari instruksi sistem (delimiter dan instruksi "perlakukan sebagai data").
- Scope shell plugin Tauri hanya mengizinkan menjalankan sidecar.
- Path file dari output AI selalu divalidasi berada di dalam folder job sebelum dibaca atau ditulis.

---

## 10. Strategi Testing

| Lapisan | Alat | Fokus |
|---|---|---|
| Skema & kontrak | Vitest | Validasi Zod, kompatibilitas RPC |
| Adapter CLI | Vitest + fixture output | Parsing stream-json, deteksi limit, retry. Fixture direkam dari CLI asli. |
| Pipeline | Vitest dengan adapter palsu | Transisi state, resume, revisi parsial |
| QA deterministik | Vitest + Playwright | Kasus kontras rendah, overflow, font fallback |
| Template | Playwright Test (visual regression) | Snapshot render tiap template × 3 brand fixture |
| End-to-end | Manual + skrip `render:demo` | Kualitas visual dinilai pengguna |

Test yang memanggil CLI sungguhan ditandai `@live` dan tidak dijalankan otomatis, karena memakai kuota.

---

## 11. Build dan Packaging

- `pnpm dev`: Vite + Tauri dev, sidecar dijalankan dengan `tsx` dalam mode watch.
- `pnpm build`: bundle sidecar (tsup) → resource Tauri → `tauri build` menghasilkan `.app` dan `.dmg` untuk `aarch64-apple-darwin`.
- Code signing dan notarization: tidak diperlukan untuk pemakaian pribadi. Saat pertama dibuka, gunakan klik kanan → Open untuk melewati Gatekeeper.
- Prasyarat di Mac: Node.js LTS, Claude CLI (login), Codex CLI (login).

---

## 12. Architecture Decision Records (ringkas)

| ID | Keputusan | Alasan | Alternatif yang ditolak |
|---|---|---|---|
| ADR-001 | Tauri 2 sebagai shell | Ringan, WebView native, sidecar & scope izin bawaan | Electron (lebih berat; dipertimbangkan bila integrasi Rust menghambat) |
| ADR-002 | Teks dirender HTML/CSS, model gambar hanya untuk aset | Teks presisi, brand konsisten, bebas AI-slop | Seluruh postingan dari model gambar |
| ADR-003 | Template JSX terkurasi + LayoutSpec, bukan HTML bebas dari AI | Konsistensi dan kontrol kualitas | AI menulis HTML bebas per postingan (disimpan untuk mode template kustom) |
| ADR-004 | Sidecar memakai Node.js terinstal untuk MVP | Playwright dan sharp memakai binary/native module yang rawan bermasalah saat dikompilasi menjadi satu executable; pemakaian pribadi membuat ketergantungan Node dapat diterima | Bun `--compile` atau Node SEA (dievaluasi ulang bila suatu saat perlu distribusi) |
| ADR-005 | JSON-RPC lewat stdio | Tanpa port terbuka, sederhana, mudah di-test | HTTP server lokal + WebSocket |
| ADR-006 | File sebagai sumber kebenaran, SQLite sebagai index | Project portabel dan bisa di-backup/Git | Semua data di database |
| ADR-007 | Memanggil CLI resmi, bukan Agent SDK dengan login subscription | Jalur paling jelas untuk penggunaan pribadi dengan subscription | Agent SDK + login subscription |
| ADR-008 | Path absolut `node` di-resolve sebelum sidecar dijalankan (login shell, lalu fallback lokasi umum), disimpan di pengaturan | Aplikasi GUI macOS hanya mendapat PATH minimal, sehingga `node` tidak ditemukan dengan nama saja; deteksi PATH di dalam sidecar tidak bisa dipakai untuk menjalankan sidecar itu sendiri | Memanggil `node` lewat PATH; membundel Node (ditunda, lihat ADR-004) |
| ADR-009 | Identifier `id.laras.desktop`; data aplikasi di `~/Library/Application Support/Laras/` ditentukan sidecar | Nama folder mudah dikenali untuk backup dan Git; identifier sulit diubah setelah data WebView terbentuk | Folder data mengikuti nama identifier |
| ADR-010 | Tailwind CSS v4 dengan konfigurasi `@theme` di CSS | Versi default shadcn/ui saat ini; token cukup didefinisikan sekali di CSS | Tailwind v3 dengan `tailwind.config.ts` |
| ADR-011 | Claude CLI dijalankan dengan cwd di folder project | `CLAUDE.md` project terbaca langsung, `Read` menjangkau referensi dan folder job tanpa `--add-dir`, output tahap tetap ditulis sidecar | cwd di folder job + `--add-dir` ke folder project |
| ADR-012 | Codex dijalankan dengan cwd di folder project, sandbox `read-only`, stdin ditutup; gambar diambil dari `~/.codex/generated_images/<thread_id>/` | Uji T-101: tanpa repo git hanya `AGENTS.md` di cwd yang terbaca; `image_gen` menulis ke `CODEX_HOME` sehingga agent tidak perlu izin tulis; `thread_id` di event pertama menunjuk folder gambar secara deterministik | cwd di `jobs/<job-id>/assets` dengan sandbox `workspace-write` dan isi `AGENTS.md` disisipkan ke prompt |
| ADR-013 | Claude CLI dijalankan dengan `--setting-sources project --strict-mcp-config --disable-slash-commands` dan `--json-schema` per tahap | Uji T-102: kombinasi ini mematikan hook, plugin, MCP, skill, dan `CLAUDE.md` global pengguna tanpa kehilangan `CLAUDE.md` project dan login subscription; `--json-schema` memberi objek tervalidasi di `result.structured_output` | `--bare` (memaksa API key), `--safe-mode` (mematikan `CLAUDE.md` project), `--restricted` (tidak dibutuhkan) |
| ADR-014 | Renderer memuat slide dari origin `http://laras.invalid/` yang hanya dilayani route Playwright (font dan gambar dari folder project dan job, request lain diblokir); `playwright-core` dipin ke versi yang cocok dengan Chromium terpasang | HTML berisi teks dari AI tidak bisa memuat sumber internet atau file di luar folder project dan job; URL aset sama di semua mesin; pin versi mencegah unduhan browser tak terduga (T-107) | `file://` atau `page.setContent` dengan URL `file://` (uji T-107: font dan gambar dari path mana pun di disk ikut termuat); server HTTP lokal (membuka port) |
| ADR-015 | Layout dari arketipe komposisi parametrik. Parameter berupa enum terkurasi di `options` meta (dipilih Claude, divalidasi `layoutIssues`); geometri dihitung sistem, bukan Claude: renderer memaskan kata raksasa ke lebar kotaknya (`data-fit`), dan arketipe menempatkan teks berseberangan diagonal dengan titik fokus subjek cut-out (`SubjectInfo` di `AssetManifest`, hasil `analyzeCutout`). Slot gambar menandai `cutout`, dicocokkan dengan `AssetRequest.kind` (T-123) | Gerbang Fase 1 NO-GO (T-117): 0 dari 9 layak karena struktur selalu sama; referensi pemilik menuntut komposisi yang berganti dalam satu sistem (PRD 4 K6) tetapi hasil tetap harus bisa diperiksa QA (keputusan pemilik, T-120). Enum menjaga pilihan tetap dikurasi; geometri terukur menghindari parameter manual per brand yang dibutuhkan prototipe T-122 | Template tetap yang lebih banyak (variasi terbatas pada jumlah template); Claude menyusun lapisan bebas dari primitives (risiko tabrakan dan keterbacaan terbesar); Claude memberi angka posisi dan ukuran (tidak terukur terhadap font dan aset sebenarnya) |
| ADR-016 | Gaya desain di pipeline (T-133): gaya default di `project.json` folder project (`ProjectSettings`), gaya terpilih ikut di `JobSpec.style`; setiap tahap Claude menerima blok data `<style>` berisi ringkasan `style.ts` dan bagian `PANDUAN.md` yang relevan per tahap (`prompts/style-context.ts`: plan 2–3, copy 5 dan 11, layout 9, 11, 12, QA visual 11 dan 13, revise 9, 11, 13; contoh brand fixture dibuang), prompt gambar Codex menerima `promptHints` dan `avoid`; katalog diurutkan dengan arketipe gaya lebih dulu tetapi tetap utuh; `LayoutSpec.styleOptions` dipilih Claude dan divalidasi enum gaya; render memakai lapisan dan ambang QA gaya | Panduan utuh 37–56 KB (10–15 ribu token) per tahap terlalu mahal; ringkasan per tahap 1,6–4,2 ribu token. File di folder project menjaga local-first dan bisa dibaca database Fase 2. Gaya di `JobSpec` membuat job bisa dilanjutkan dengan gaya yang sama walau default project berubah (keputusan pemilik 2026-10-19) | Panduan utuh di setiap prompt (mahal); gaya di `brand.json` (mencampur identitas brand dengan pilihan desain); katalog hanya arketipe gaya (lebih murah, ditolak pemilik agar Claude tetap bebas); opsi gaya otomatis dari aturan brand (lebih sedikit variasi) |
| ADR-017 | Kalibrasi QA dan revisi (T-137): lolos = cek kode lolos, `idea` ≥ 7, rata-rata ≥ 6, tanpa perbaikan wajib; revisi maksimal 1 putaran; hasil akhir = putaran terbaik; gambar dibuat ulang hanya untuk perbaikan bertarget `assets` | Di T-127 QA meloloskan 0/9 sementara pemilik menerima 6/9 (lalu 7/9 secara buta); skor `idea` tidak berubah saat dinilai ulang dan paling sejalan dengan pemilik, rata-rata bergeser ±0,4, jumlah perbaikan wajib berubah di 4/9. Putaran kedua tidak memperbaiki hasil dan membuat 8/9 percobaan melewati 5 menit. Replay T-127: 48 panggilan Claude (dari 71), semua ≤ 5 menit, keputusan lolos cocok 8/9 dengan penilaian buta pemilik | Ambang lama (lolos 0/9); dua putaran dengan putaran terbaik (±54 panggilan, 3 percobaan > 5 menit); revisi hanya untuk perbaikan wajib (pemilik memilih skor tetap memicu revisi); visual wajib tidak menghalangi lolos (menangkap cacat nyata seperti CTA hilang dan tangan ganda) |
| ADR-018 | Gabungan arketipe dan art direction gambar (T-141, arah pemilik setelah spike T-140): setiap slot gambar arketipe punya kontrak `composition` (kalimat dasar dan per nilai satu opsi, `slotComposition`) yang dirangkai engine dari opsi layout dan dikirim ke prompt Codex; prompt layout menulis deskripsi aset sebagai brief art director berbahasa Inggris; empat arketipe bidang warna menerima slot opsional `adegan` (foto pelat latar tanpa subjek) yang menggantikan bidang warna sementara kata raksasa, perangkat, dan cut-out tetap dari arketipe; cek wajib `busy-background` menolak teks yang menimpa area foto ramai | Spike T-140: foto dari model gambar lebih natural (pemilik menerima K1, S2, S3), tetapi tipografi polos tanpa perangkat terasa kurang dan teks kerap menimpa objek; arketipe T-127 kuat di tipografi dan interlock. Kontrak di meta menjaga komposisi tetap dikurasi (ADR-015) sementara gambar dibuat untuk letak teks yang pasti. Kalibrasi cek keramaian pada render T-127 dan T-140: area yang diterima pemilik ≤ 9, teks yang ditandai menimpa objek ≥ 15 | Latar penuh dari model gambar untuk semua postingan (tipografi lemah, lapisan B tidak sejajar piksel); hanya brief tanpa latar adegan (peran gambar tetap kecil); latar adegan sebagai opsi `latar` terpisah dari slot (bisa bertentangan dengan isi slot); simpangan baku seluruh kotak baris (menenggelamkan tumpang tindih kecil) atau energi tepi (tidak memisahkan kasus pemilik) |

> Catatan: rekomendasi awal memakai Bun `--compile` untuk sidecar diganti dengan ADR-004 karena alasan di atas.
