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
                  └───────┴────────┴── revise ◀───────┘ (maks 2 putaran)

Status khusus: waiting_quota · interrupted · failed · cancelled
```

- Satu job = satu varian. Tahap `plan` dijalankan sekali per brief dan menghasilkan satu `ContentPlan` berisi N angle berbeda (satu per varian); setiap job memakai angle-nya sendiri. Varian jadi berbeda secara bermakna (PRD F7) tanpa memanggil Claude N kali untuk `plan`.
- `revise` masuk ulang di tahap paling awal yang terdampak daftar perbaikan (`copy`, `layout`, atau `assets`), lalu tahap sesudahnya sampai `qa` dijalankan lagi.
- Setiap tahap menulis output ke `jobs/<job-id>/<nn>-<tahap>.json` dan mencatat event ke tabel `job_events`.
- `job.resume` memulai dari tahap pertama yang belum punya output valid.

### 5.2 Tahap dan kontraknya

| Tahap | Pelaksana | Input | Output (skema di `shared`) |
|---|---|---|---|
| plan | Claude | brief, knowledge, referensi, jumlah varian | `ContentPlan`: pesan utama, audiens, struktur slide, satu angle per varian |
| copy | Claude | ContentPlan, copy guide | `CopyDraft`: teks per slot per slide, caption, hashtag |
| layout | Claude | CopyDraft, katalog template, brand tokens | `LayoutSpec`: templateId, slot terisi, opsi template, kebutuhan aset |
| assets | Codex / pengguna | kebutuhan aset, brand, referensi | `AssetManifest`: path file, ukuran, sumber |
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

Kode di `packages/sidecar/src/pipeline/assets.ts` (`LocalLibraryAssetProvider` menunggu PRD 12 pertanyaan 4). Setiap aset menjadi `jobs/<id>/assets/<asset-id>.jpg` (JPG 92 sRGB) yang dipotong ke `aspectRatio` permintaan tanpa memperbesar, dengan smart crop sharp `attention` dan orientasi EXIF diterapkan. Gambar Codex asli disimpan sebagai `<asset-id>.original.png` agar revisi ke rasio lain cukup dipotong ulang. Sumber divalidasi: `thread_id` berformat UUID dan file (setelah `realpath`) di dalam `generated_images/<thread_id>/`; foto pengguna hanya dari folder yang diizinkan dan harus PNG/JPG/WebP.

### 5.4 Strategi revisi

- QA menghasilkan daftar perbaikan yang terarah (misalnya "headline terlalu panjang, maks 6 kata", "kontras CTA kurang").
- Revisi hanya mengubah bagian yang disebut; aset gambar tidak dibuat ulang kecuali masalahnya memang di aset. Ini menghemat kuota.
- Revisi dari chat pengguna memakai jalur yang sama, dengan instruksi pengguna sebagai daftar perbaikan.

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
| `--font-heading-weight`, `--font-heading-weight-strong`, `--font-body-weight`, `--font-body-weight-strong` | `typography.heading/body.weights` | bobot terkecil dan terbesar yang diizinkan |
| `--font-size-1` … `--font-size-N` | `typography.scale` | px, urut dari terkecil |
| `--space-1` … `--space-8` | `spacing.unit` | unit × 1, 2, 3, 4, 6, 8, 12, 16 (8–128 px bila unit 8) |
| `--space-safe` | `spacing.safeMargin` | px |
| `--shape-radius`, `--shape-stroke` | `shape.radius`, `shape.stroke` | px |
| `--shape-shadow` | `shape.shadow` (`none` atau `soft`) | `none`, atau untuk `soft`: `0 8px 24px` dengan warna netral tergelap 16% |

`@font-face` memakai `url()` hasil resolve `file` terhadap `assetBaseUrl` (URL folder project berakhiran `/`, ditentukan renderer atau preview), `font-weight` berupa rentang bobot yang diizinkan (mis. `400 600`), dan `font-display: block`. File font yang hasil resolve-nya keluar dari folder project ditolak.

### 6.2 Template

- Template adalah **komponen React (JSX)** di `packages/templates`, di-render ke HTML statis dengan `renderToStaticMarkup`.
- Setiap template mengekspor:
  - `meta` (skema `TemplateMeta` di `shared`): id, nama, format, deskripsi kapan dipakai, daftar slot (nama, tipe, wajib atau tidak, deskripsi isi, `maxChars` untuk teks dan badge, `aspectRatio` untuk gambar), dan opsi yang diizinkan (nilai dan default). Nama slot teks mengikuti field `CopySlide` (`headline`, `subheadline`, `body`, `cta`) bila maknanya sama.
  - komponen render `Slide` yang menerima slot yang sudah di-resolve (`SlideProps`).
- `layoutIssues(spec, meta)` di `shared` memeriksa `LayoutSpec` terhadap meta: slot wajib, tipe, batas karakter, rasio aset, dan opsi. Dipakai `render:demo` dan nanti tahap layout.
- Katalog: `packages/templates/src/catalog.ts`. Template feed: `feed-foto-teks` (foto 3:2 full-bleed di atas, teks di bawah), `feed-sorotan` (angka atau kata sorotan di atas warna brand, tanpa foto), `feed-foto-penuh` (foto 4:5 menutup kanvas, teks di panel solid atas atau bawah; panel solid dipilih agar kontras tidak bergantung foto dan tanpa gradient), dan `feed-kutipan` (kutipan atau pernyataan besar dengan tanda kutip dekoratif). Spesimen brand bukan bagian katalog.
- Template hanya boleh memakai CSS variables dari token, tidak boleh nilai warna atau font hard-coded (dicek oleh lint khusus).
- Teks, badge, gambar, logo, dan grid dibangun dari primitives `Text`, `Badge`, `Image`, `Logo`, `Grid` (`packages/templates/primitives`). Props-nya hanya menerima nama token (warna, langkah ukuran 1–6, langkah spacing 1–8), jadi template tidak bisa memberi nilai mentah. Setiap elemen slot diberi `data-slot` agar QA (7.2) dan editor manual (PRD F11) bisa memetakannya kembali ke `LayoutSpec`. `Text` mengunci bobot dari token dengan `font-synthesis: none` dan tidak pernah memotong teks; `Image` dan `Logo` menerima URL yang sudah di-resolve. Penempatan elemen di dalam `Grid` diatur template.
- Katalog template (`meta` semua template) dikirim ke Claude di tahap `layout`, sehingga Claude memilih dari opsi yang sudah dikurasi.
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
- Satu browser instance dipakai ulang; setiap slide dirender di context dan page baru.
- Browser: saat ini cache Playwright bawaan (`~/Library/Caches/ms-playwright`). Unduhan Chromium ke `~/Library/Application Support/Laras/browsers` saat pertama kali dipakai menjadi bagian E-403. Fallback: Google Chrome yang terinstal (`channel: "chrome"`).
- `pnpm render:demo` (lewat `tsx`, karena template berupa JSX) merender spesimen brand dan semua template × 3 brand fixture ke `out/demo/`.

### 7.2 QA deterministik (dijalankan di dalam page sebelum screenshot)

Kode di `packages/sidecar/src/render/qa/`. Renderer menjalankan kolektor di page (string, bukan fungsi, karena tsx/esbuild menyisipkan helper `__name` yang tidak ada di page), membaca font yang benar-benar dipakai lewat CDP, lalu menilai aturan sebagai fungsi murni di Node (`rules.ts`) dan menghasilkan `RenderCheck` per slide; `buildRenderReport()` menyusun `RenderReport`. Elemen teks = elemen dengan node teks langsung; elemen penting = `[data-slot]` dengan `data-slot-type` selain `image` (ditulis primitives). Setiap pelanggaran menjadi satu cek gagal; aturan tanpa pelanggaran menghasilkan satu cek lolos.

- **Kontras** ≥ 4.5:1, atau ≥ 3:1 untuk teks ≥ 32 px (PRD F9). Latar efektif dicari dengan `elementsFromPoint` di beberapa titik tiap baris: mulai dari elemen teks itu sendiri, elemen pertama yang berupa gambar atau berlatar opaque. Bila teks berada di atas gambar (atau latar transparan sebagian), renderer mengambil screenshot kedua dengan teks disembunyikan dan menghitung kontras terhadap piksel latar di area baris teks; nilai yang dinilai adalah persentil ke-5 (95% piksel latar memenuhi rasio itu).
- **Overflow:** gagal bila teks lebih lebar dari kotaknya (`scrollWidth > clientWidth`), baris teks (`Range.getClientRects`) keluar dari kanvas, atau kotak dua elemen penting saling bertabrakan. `scrollHeight` tidak dipakai karena heading dengan `line-height` < ascent + descent selalu "overflow" tanpa terpotong (KNOWLEDGE).
- **Safe margin:** kotak elemen penting berjarak ≥ `spacing.safeMargin` brand dari setiap tepi.
- **Ukuran font** semua teks ≥ 24 px.
- **Font Brand Kit:** CDP `CSS.getPlatformFontsForNode` per elemen teks; glyph dari font non-`@font-face` berarti font cadangan (kecuali font emoji sistem untuk glyph emoji). Family pertama di computed `font-family` harus font heading atau body, dan bobotnya termasuk yang diizinkan peran itu.
- **Warna Brand Kit:** warna teks, latar, dan border (bila tebal > 0) persis salah satu warna palet; yang transparan dan bayangan diabaikan.
- **Kata terlarang** `forbiddenWords` (tanpa beda huruf besar/kecil, batas kata Unicode), **emoji** per slide ≤ `emoji.max` copy guide (0 bila tidak diizinkan), dan **hashtag** tidak boleh di gambar (tempatnya di caption).
- **Aset:** gambar dengan `naturalWidth` 0 atau `@font-face` berstatus `error`.

`pnpm render:demo` ikut menjalankan QA dan keluar dengan kode 1 bila ada cek gagal; isi demo seluruh katalog × 3 brand juga menjadi fixture patuh di `scripts/demo-qa.test.ts`.

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

> Catatan: rekomendasi awal memakai Bun `--compile` untuk sidecar diganti dengan ADR-004 karena alasan di atas.
