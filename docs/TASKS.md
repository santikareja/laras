# TASKS
Status: [ ] belum, [~] berjalan, [x] selesai, [!] terhambat, [-] dibatalkan (tulis alasan)

Penomoran: T-0xx Fase 0, T-1xx Fase 1, E-2xx sampai E-4xx epic Fase 2–4 (dirinci saat fase dimulai).

## Fase 0: Fondasi

Target: struktur monorepo sesuai ARCH 3, token DESIGN 15 terpasang, `pnpm dev` membuka jendela Tauri kosong yang mengikuti light/dark mode (PRD 11).

- [x] T-001 Audit lingkungan, flag CLI, dan konsistensi dokumen
  - Rujukan: PRD 11, ARCH 4.5, DESIGN 3
  - AC: versi tool tercatat; flag CLI di ARCH 4.5 dicocokkan dengan `--help`; dukungan generasi gambar Codex diketahui; daftar inkonsistensi dan keputusan pemilik tersedia.
  - Verifikasi: laporan Tahap A disetujui pemilik (2026-10-17); hasilnya tercatat di docs/KNOWLEDGE.md.
  - Catatan: tanpa memakai kuota (hanya `--help`, `--version`, status login, `codex features list`).

- [x] T-002 Dokumentasi kerja dan protokol sesi
  - Rujukan: CLAUDE.md, ARCH 3, ARCH 12
  - AC: repo git di branch `main`; `.gitignore` untuk Node, Rust/Tauri, macOS, `out/`; PRD, ARCHITECTURE, DESIGN di `docs/`; perbaikan inkonsistensi c-1 sampai c-19 diterapkan; STATUS, TASKS, KNOWLEDGE, SESSION_LOG dibuat; CLAUDE.md memuat Protokol Sesi; slash command `/lanjut` dan `/selesai` tersedia.
  - Verifikasi: `git log --oneline` menunjukkan commit "chore: setup dokumentasi kerja dan protokol sesi"; `grep -n "Content Studio\|ContentStudio" docs/PRD.md docs/ARCHITECTURE.md docs/DESIGN.md CLAUDE.md` kosong; `ls .claude/commands` berisi `lanjut.md` dan `selesai.md`.
  - Catatan:

- [x] T-003 Workspace root: pnpm, TypeScript, Biome, Vitest
  - Rujukan: ARCH 3, CLAUDE.md (Perintah, Kode)
  - AC: `package.json` root (private, `packageManager` pnpm 12.11.2, `engines.node` >= 22); `pnpm-workspace.yaml` (`apps/*`, `packages/*`); `tsconfig.base.json` dengan `strict: true`; `biome.json`; `.node-version` berisi 22; skrip root `lint`, `typecheck`, `test` berjalan di seluruh workspace.
  - Verifikasi: `pnpm install && pnpm lint && pnpm typecheck && pnpm test` lolos (boleh tanpa test selama belum ada paket).
  - Catatan: sebutkan alasan setiap dependency baru di ringkasan commit. Selesai 2026-10-18: TypeScript 7.0.2, Biome 2.5.15, Vitest 5.0.5, @types/node 22. `--passWithNoTests` sementara, dihapus di T-004.

- [x] T-004 Kerangka paket `shared`, `sidecar`, `templates` dan folder pendukung
  - Rujukan: ARCH 3, ARCH 1 (prinsip 2), CLAUDE.md (Struktur)
  - AC: `packages/shared` (`@laras/shared`), `packages/sidecar` (`@laras/sidecar`), `packages/templates` (`@laras/templates`), masing-masing dengan `package.json`, `tsconfig.json` yang meng-extend base, dan `src/index.ts`; subfolder sesuai ARCH 3 (`sidecar/src/{rpc,queue,pipeline,cli,prompts,render,storage,context}`, `templates/{feed,carousel,primitives,tokens}`); folder `scripts/spike/` dan `fixtures/brands/`; satu smoke test Vitest per paket.
  - Verifikasi: `pnpm typecheck && pnpm lint && pnpm test` lolos dengan 3 test; struktur folder dicocokkan dengan ARCH 3 (`find packages scripts fixtures -type d`).
  - Catatan: folder kosong ditandai `.gitkeep`; belum ada logika atau skema. Selesai 2026-10-18: paket mengekspor sumber TS langsung (`exports` → `src/index.ts`, tanpa build); `sidecar` dan `templates` bergantung pada `@laras/shared` (`workspace:*`); subfolder `templates` di root paket sesuai pohon ARCH 3.

- [x] T-005 Prasyarat Rust dan Tauri terpasang
  - Rujukan: ARCH 11, ADR-001, KNOWLEDGE (Lingkungan)
  - AC: Rust stable terpasang lewat rustup; target `aarch64-apple-darwin` tersedia; versi tercatat di KNOWLEDGE.md.
  - Verifikasi: `rustc --version`, `cargo --version`, `rustup target list --installed`.
  - Catatan: instalasi dilakukan pemilik (keputusan Q1 Tahap A). Blocker untuk T-007. Selesai 2026-10-18: rustc dan cargo 1.99.1, target `aarch64-apple-darwin` terpasang.

- [x] T-006 Aplikasi `apps/desktop`: Vite + React + TypeScript
  - Rujukan: ARCH 3, ARCH 4.2
  - AC: `apps/desktop` (`@laras/desktop`) dengan Vite, React, TypeScript strict; struktur `src/{app,features,components,lib,stores,styles}`; halaman kosong tanpa teks contoh bawaan Vite.
  - Verifikasi: `pnpm --filter @laras/desktop build` sukses; `pnpm typecheck && pnpm lint && pnpm test` lolos.
  - Catatan: belum memakai Tailwind dan shadcn/ui (T-008 dan Fase 2). Selesai 2026-10-18: Vite 8.3.4, React 19.3.1, @vitejs/plugin-react 6.1.2; tsconfig terpisah untuk kode UI (DOM) dan `vite.config.ts` (Node).

- [x] T-007 Shell Tauri 2 untuk `apps/desktop`
  - Rujukan: ARCH 4.1, ADR-001, ADR-009, DESIGN 5 (Ukuran tetap), DESIGN 2 (prinsip 4)
  - AC: `apps/desktop/src-tauri` dengan identifier `id.laras.desktop`, productName "Laras"; jendela minimum 1100 × 700, title bar overlay dengan judul tersembunyi, tema mengikuti sistem; Rust hanya konfigurasi (tanpa command bisnis); capability minimal tanpa plugin shell; skrip root `pnpm dev` menjalankan `tauri dev`.
  - Verifikasi: `pnpm dev` membuka jendela Laras (screenshot); `cargo check` di `src-tauri` lolos; `pnpm typecheck && pnpm lint && pnpm test` lolos.
  - Catatan: bergantung T-005 dan T-006. Nilai `titleBarStyle` di Tauri 2 ditulis "Overlay"; cek dokumentasi Tauri dan catat di KNOWLEDGE.md. Status 2026-10-18: `cargo check` dan pemeriksaan JS lolos; `pnpm dev` menjalankan proses `laras` dengan jendela 1280 × 800 (dicek lewat CGWindowList). Screenshot tidak bisa diambil karena sesi agent tidak punya izin Screen Recording. Selesai 2026-10-18: pemilik mengonfirmasi secara visual title bar tanpa judul dengan traffic lights, jendela bisa digeser lewat area atas, dan tidak bisa diperkecil di bawah 1100 × 700; diagnostik WebView memastikan halaman berjalan di WebView Tauri (React ter-mount, latar `#F3F5F6`, tanpa error JS). Ditambahkan area seret 44 px + izin `core:window:allow-start-dragging` karena title bar Overlay menutup area seret bawaan. Ikon masih ikon bawaan Tauri (diganti di E-402).

- [x] T-008 Token UI DESIGN 15, Tailwind v4, dan light/dark mode
  - Rujukan: DESIGN 3, DESIGN 4, DESIGN 15, ADR-010
  - AC: `apps/desktop/src/styles/tokens.css` identik dengan DESIGN 15; Tailwind v4 terpasang dengan `@theme inline` sesuai tabel pemetaan DESIGN 15; `body` memakai `--surface-app`, `--text-primary`, `--font-ui`; tampilan mengikuti light/dark mode macOS.
  - Verifikasi: screenshot jendela di light dan dark mode; warna latar terukur `#F3F5F6` (light) dan `#1C1E20` (dark); `pnpm typecheck && pnpm lint && pnpm test` lolos.
  - Catatan: shadcn/ui, Lucide, dan Plus Jakarta Sans dipasang di Fase 2 (E-201). Status 2026-10-18: `tokens.css` identik byte-per-byte dengan DESIGN 15 (formatter Biome dimatikan khusus file ini); `@theme inline` memuat 19 pemetaan warna dan 3 radius sesuai tabel DESIGN 15; di browser bawaan terukur latar `#F3F5F6`/teks `#1F2326` (light) dan `#1C1E20`/`#ECEFF1` (dark); pemeriksa independen: 5/5 lolos. Selesai 2026-10-18: di WebView Tauri terukur light `#F3F5F6`/`#1F2326` (diagnostik); pemilik mengonfirmasi secara visual bahwa latar jendela native menjadi gelap saat Appearance Dark. Catatan jujur: diagnostik tidak merekam peralihan langsung ke Dark (kemungkinan JS WebView diperlambat saat System Settings di depan; lihat KNOWLEDGE), jadi warna dark di jendela native tidak terukur, hanya terlihat.

- [x] T-009 Lint token warna
  - Rujukan: DESIGN 3 (Aturan), DESIGN 15, ARCH 6.2, CLAUDE.md (Desain dan Template)
  - AC: `pnpm lint` gagal bila ada literal warna (hex, `rgb()`, `hsl()`, `oklch()`) atau kelas warna bawaan Tailwind (mis. `bg-blue-500`) di `apps/desktop/src` (kecuali `styles/tokens.css`) dan `packages/templates` (kecuali `tokens/`); pesan error menyebut file, baris, dan token pengganti.
  - Verifikasi: test Vitest dengan fixture yang melanggar dan yang patuh; `pnpm lint` lolos di repo.
  - Catatan: Selesai 2026-10-18: `scripts/lint-tokens.ts` (tanpa dependency baru, dijalankan Node 22 dengan type stripping), 10 test; `pnpm lint` = Biome + lint token. Bila hex sama dengan nilai token DESIGN, pesan menyebut nama tokennya. Uji tanam: file berisi `bg-blue-500` dan `#1F2326` membuat `pnpm lint` exit 1 dengan saran `var(--text-primary)`. Batas: nama warna CSS (`red`, `white`) tidak diperiksa.

- [x] T-010 Gerbang Fase 0
  - Rujukan: PRD 11 (Fase 0), DESIGN 16
  - AC: dari clone bersih, `pnpm install` lalu `pnpm dev` membuka jendela kosong yang mengikuti light/dark mode; struktur sesuai ARCH 3; STATUS.md menyatakan Fase 0 selesai.
  - Verifikasi: `git clone` ke folder sementara, jalankan `pnpm install && pnpm typecheck && pnpm lint && pnpm test && pnpm dev`; screenshot light dan dark dilihat.
  - Catatan: Status 2026-10-18: dari clone bersih, `pnpm install --frozen-lockfile`, typecheck, lint, test (4 file, 13 test), build desktop, dan `cargo check` lolos; struktur folder sesuai ARCH 3 (kecuali `scripts/render-demo.ts` dan `lib/rpc.ts`, yang dibuat di T-107 dan E-201). `pnpm dev` dari clone tidak dijalankan karena port 1420 dipakai instance yang sama dari repo. Selesai 2026-10-18: pemilik melihat jendela terbuka, title bar, geser, ukuran minimum, dan light/dark (lihat T-007, T-008). Fase 0 selesai.

## Fase 1: Spike pipeline

Target: skrip tanpa UI brief → copy → layout → aset → render → QA. Gerbang: 3 brand × 3 brief menghasilkan PNG yang menurut pemilik layak publikasi pada ≥ 6 dari 9 percobaan (PRD 11).

- [x] T-101 Verifikasi generasi gambar Codex
  - Rujukan: PRD 10 (risiko Codex), ARCH 4.5 (Codex adapter), KNOWLEDGE (Codex CLI)
  - AC: satu gambar tanpa teks dibuat lewat `codex exec` di folder non-git dengan flag ARCH 4.5; diketahui lokasi file di `~/.codex/generated_images/`, event `--json` yang memuat path-nya, perilaku rasio 4:5 lewat prompt, apakah `AGENTS.md` di folder induk terbaca, efek `--ignore-user-config`, dan durasi per gambar; event `--json` disimpan sebagai fixture.
  - Verifikasi: temuan tertulis di KNOWLEDGE.md; fixture ada di `packages/sidecar/test/fixtures/codex/`.
  - Catatan: MEMAKAI KUOTA. Minta izin pemilik dan sebutkan jumlah panggilan sebelum mulai (target ≤ 3). Selesai 2026-10-18 dengan 2 dari 3 panggilan yang diizinkan: gambar ada di `~/.codex/generated_images/<thread_id>/` (tidak ada event gambar di `--json`); 4:5 menghasilkan 1122 × 1402; `AGENTS.md` hanya terbaca dari cwd; sandbox `read-only` cukup; sekitar 45 detik per gambar. ARCH 4.5 dan ADR-012 disesuaikan.

- [x] T-102 Verifikasi perilaku Claude CLI headless
  - Rujukan: ARCH 4.5 (Claude adapter), ADR-011, KNOWLEDGE (Claude CLI)
  - AC: diketahui apakah `--output-format stream-json` wajib `--verbose`; `--tools "Read"` benar membatasi tool; `--permission-prompts none` tidak menggantung; perilaku `--json-schema`; kombinasi `--setting-sources`, `--strict-mcp-config`, `--disable-slash-commands`, `--restricted` yang mematikan hook, plugin, MCP, dan `~/.claude/CLAUDE.md` global sambil tetap membaca `CLAUDE.md` project dan login subscription; contoh output stream-json disimpan sebagai fixture.
  - Verifikasi: temuan tertulis di KNOWLEDGE.md; fixture ada di `packages/sidecar/test/fixtures/claude/`.
  - Catatan: MEMAKAI KUOTA. Minta izin pemilik dan sebutkan jumlah panggilan sebelum mulai (target ≤ 6, prompt sangat pendek). Selesai 2026-10-18 dengan 4 dari 6 pemanggilan (satu ditolak sebelum request): stream-json wajib `--verbose`; isolasi `--setting-sources project --strict-mcp-config --disable-slash-commands` terbukti; `--tools Read` membatasi; `--permission-prompts none` menolak tanpa menggantung; `--json-schema` memberi `result.structured_output`; `rate_limit_event` tersedia. ARCH 4.5 dan ADR-013 disesuaikan; `--restricted` tidak diuji karena tidak dibutuhkan.

- [x] T-103 Skema Zod inti di `packages/shared`
  - Rujukan: ARCH 5.2, ARCH 5.3, ARCH 6.1, PRD F2
  - AC: skema `BrandKit`, `ContentPlan` (satu angle per varian), `CopyDraft`, `LayoutSpec`, `AssetManifest`, `RenderReport`, `QaReport` beserta tipe `z.infer`; contoh `brand.json` di ARCH 6.1 lolos validasi.
  - Verifikasi: test Vitest untuk contoh valid dan tidak valid per skema; `pnpm typecheck && pnpm lint && pnpm test` lolos.
  - Catatan: Selesai 2026-10-18 (rencana dan 4 keputusan desain disetujui pemilik): Zod 4.6.7; skema `common`, `BrandKit`, `ContentPlan`, `CopyDraft`, `LayoutSpec`, `AssetManifest`, `RenderReport`, `VisualQa`, `QaReport`, semuanya objek strict; aturan deterministik (jumlah slide per format, skala tipografi ≥ 24 px dan naik, slot gambar merujuk `assetRequests`, path relatif tanpa `..`); 45 test di `packages/shared` termasuk contoh `brand.json` yang dibaca langsung dari ARCH 6.1 dan konversi `z.toJSONSchema`. Test `shared` memakai `tsconfig.test.json` (dengan tipe Node) agar sumber `shared` tetap bebas API Node.

- [x] T-104 Tiga brand fixture
  - Rujukan: PRD F2–F5, ARCH 6.1, ARCH 8.1
  - AC: tiga folder di `fixtures/brands/` dengan karakter visual berbeda, masing-masing berisi `brand.json` valid, font lokal berlisensi terbuka, logo SVG, `knowledge/business.md`, dan `copy-guide.json`.
  - Verifikasi: test memvalidasi ketiga `brand.json` dengan skema `BrandKit`; font terbaca dan memuat glyph Latin dasar.
  - Catatan: brand fiktif. Usulkan tiga konsep brand ke pemilik sebelum membuat. Unduhan font butuh izin pemilik. Selesai 2026-10-18 (konsep, unduhan 12 file, skema `CopyGuide`, dan bahasa disetujui pemilik): `kopi-lembayung` (Fraunces + Inter, id), `seruni-skin` (Cormorant Garamond + Manrope, id), `ritme-run-club` (Anton + Archivo, en); font WOFF2 subset Latin dari Fontsource 5.3.0 beserta lisensi OFL; logo SVG geometris dengan `<title>`; skema baru `CopyGuide` di `shared`; pembaca glyph font `packages/sidecar/src/storage/fonts.ts` (WOFF2/TTF/OTF, tanpa dependency baru). Test: 6 test `CopyGuide`, 9 test pembaca font, 13 test integritas fixture.

- [x] T-105 Token brand ke CSS variables
  - Rujukan: ARCH 6.1, ARCH 6.2, CLAUDE.md (Desain dan Template)
  - AC: fungsi di `packages/templates/tokens` mengubah `BrandKit` menjadi CSS variables (`--color-*`, `--font-heading`, `--font-body`, `--space-*`) dan `@font-face` dari file lokal.
  - Verifikasi: test snapshot CSS untuk ketiga brand fixture; `pnpm typecheck && pnpm lint && pnpm test` lolos.
  - Catatan: Selesai 2026-10-18. `brandCss(brand, { assetBaseUrl })` menghasilkan `@font-face` (rentang bobot, `font-display: block`, format dari ekstensi) dan `:root` dengan kontrak variabel di ARCH 6.1. Keputusan pemilik: spacing terkurasi `--space-1`…`--space-8` + `--space-safe`; `shape.shadow` jadi enum `none | soft` (PRD F2 diperbarui); `--font-size-*` dan namespace baru `--shape-*` ikut T-105. Path font dicek dari hasil resolve URL (`%2e%2e`). `packages/templates` memakai lib `dom` dan `tsconfig.test.json`. Test: 3 snapshot, 3 URL font ke file fixture, 4 test escape/format/path, 1 test enum bayangan. Dicek juga di browser bawaan: keenam font termuat dan bayangan `soft` valid.

- [ ] T-106 Primitives template
  - Rujukan: ARCH 3 (`templates/primitives`), ARCH 6.2
  - AC: komponen `Text`, `Logo`, `Image`, `Grid`, `Badge` yang hanya memakai CSS variables brand; lint token lolos.
  - Verifikasi: test render HTML statis per komponen; `pnpm lint` lolos.
  - Catatan:

- [ ] T-107 Renderer Playwright, pasca-proses sharp, dan `pnpm render:demo`
  - Rujukan: ARCH 7.1, ARCH 7.3, ADR-009, CLAUDE.md (Desain dan Template)
  - AC: `LayoutSpec` dirender ke HTML (`renderToStaticMarkup`) lalu PNG 2160 × 2700 setelah `document.fonts.ready` dan semua gambar termuat; satu browser dipakai ulang; export upload 1080 × 1350 sRGB; `pnpm render:demo` merender semua template × 3 brand ke `out/demo`.
  - Verifikasi: test memeriksa dimensi dan profil warna PNG; PNG demo dibuka dan dinilai.
  - Catatan: Chromium Playwright sudah ada di cache Mac ini (lihat KNOWLEDGE.md).

- [ ] T-108 Template feed A dan B
  - Rujukan: PRD 4 (prinsip 3), PRD 5, ARCH 6.2, CLAUDE.md (Desain dan Template)
  - AC: dua template feed 4:5 dengan `meta` (id, format, slot dan batas karakter, opsi) dan komponen render; safe margin 64 px; font minimum 24 px; lint token lolos.
  - Verifikasi: `pnpm render:demo`, PNG dibuka dan dinilai (hierarki, keterbacaan, keseimbangan) untuk ketiga brand.
  - Catatan:

- [ ] T-109 Template feed C dan D
  - Rujukan: sama dengan T-108
  - AC: dua template feed tambahan dengan komposisi berbeda dari A dan B (mis. foto penuh dan tipografi dominan).
  - Verifikasi: sama dengan T-108.
  - Catatan: jumlah template akhir mengikuti jawaban PRD 12 pertanyaan 3.

- [ ] T-110 QA deterministik
  - Rujukan: PRD F9, ARCH 7.2
  - AC: skrip di dalam page menghasilkan `RenderReport`: kontras (termasuk teks di atas gambar), overflow, safe margin, font minimum, font dan warna dari Brand Kit, kata terlarang, aturan emoji dan hashtag.
  - Verifikasi: test Vitest + Playwright dengan fixture yang sengaja melanggar setiap aturan dan fixture yang patuh.
  - Catatan:

- [ ] T-111 Deteksi CLI (`cli/resolvePath.ts`)
  - Rujukan: ARCH 4.5 (Deteksi CLI dan PATH), PRD F14, CLAUDE.md (Hal yang Mudah Salah)
  - AC: mengembalikan path, versi, dan status login `claude` dan `codex` dari PATH login shell, lalu lokasi umum ARCH 4.5, lalu path manual.
  - Verifikasi: test dengan `exec` palsu untuk kasus ditemukan, tidak ditemukan, dan belum login; dijalankan sekali di Mac ini (tanpa kuota).
  - Catatan:

- [ ] T-112 Adapter Claude
  - Rujukan: ARCH 4.5 (Claude adapter, Deteksi rate limit), ARCH 5.2, ARCH 10
  - AC: menjalankan Claude dengan flag hasil T-102; parsing stream-json baris per baris; validasi Zod dengan retry maksimal 2; `LimitReachedError` untuk pesan batas kuota.
  - Verifikasi: test Vitest memakai fixture T-102, tanpa memanggil CLI asli.
  - Catatan: bergantung T-102 dan T-111.

- [ ] T-113 Adapter Codex dan AssetProvider
  - Rujukan: ARCH 4.5 (Codex adapter), ARCH 5.3, ARCH 9
  - AC: `CodexAssetProvider` menyalin gambar dari `~/.codex/generated_images/` ke folder job dengan validasi path sumber dan tujuan; `UserUploadAssetProvider` untuk foto pengguna; crop dan resize ke ukuran slot.
  - Verifikasi: test Vitest memakai fixture T-101, termasuk kasus path di luar folder yang diizinkan.
  - Catatan: bergantung T-101 dan T-111.

- [ ] T-114 Prompt tahap plan, copy, layout, QA visual, revise
  - Rujukan: ARCH 5.2, ARCH 5.4, ARCH 9, PRD F7, CLAUDE.md (Prompt Agent)
  - AC: satu file `.md` per tahap di `packages/sidecar/src/prompts/`, masing-masing menyebut skema dan memberi satu contoh output valid; input pengguna dibungkus delimiter dan ditandai sebagai data.
  - Verifikasi: test statis memastikan setiap prompt memuat skema, contoh yang lolos validasi Zod, dan delimiter data.
  - Catatan:

- [ ] T-115 Pipeline engine dengan resume dan revisi
  - Rujukan: ARCH 5.1, ARCH 5.4, PRD F7
  - AC: tahap menyimpan output ke `jobs/<job-id>/<nn>-<tahap>.json`; resume dari tahap pertama yang belum punya output valid; `plan` sekali per brief dengan angle per varian; revisi maksimal 2 putaran yang masuk ulang di tahap terdampak.
  - Verifikasi: test Vitest dengan adapter palsu untuk transisi state, resume setelah gagal, dan revisi parsial.
  - Catatan:

- [ ] T-116 Skrip `pnpm spike`
  - Rujukan: PRD 11 (Fase 1), CLAUDE.md (Perintah)
  - AC: `pnpm spike -- --brand <slug> --brief "<teks>"` menjalankan pipeline penuh dan menulis PNG, laporan QA, dan durasi per tahap ke `out/spike/`.
  - Verifikasi: satu kali jalan dengan brand fixture, hasil dibuka dan dinilai.
  - Catatan: MEMAKAI KUOTA. Minta izin pemilik sebelum menjalankan.

- [ ] T-117 Evaluasi spike (gerbang go/no-go)
  - Rujukan: PRD 11 (Fase 1), PRD 10 (risiko kualitas), PRD 12 pertanyaan 5
  - AC: 3 brand × 3 brief dijalankan; pemilik menilai kelayakan publikasi; skor QA visual, durasi, dan jumlah retry tercatat; ambang QA dikalibrasi; keputusan go/no-go tertulis.
  - Verifikasi: tabel hasil 9 percobaan di KNOWLEDGE.md; ≥ 6 dari 9 layak publikasi menurut pemilik.
  - Catatan: MEMAKAI KUOTA BESAR. Jadwalkan bersama pemilik.

## Fase 2: Walking skeleton (epic)

- [ ] E-201 Tauri + UI minimal + sidecar + satu tombol Buat
  - Rujukan: PRD 11 (Fase 2), ARCH 4.1–4.4, ADR-004, ADR-005, ADR-008, DESIGN 6, DESIGN 10.5, DESIGN 15
  - AC: menekan Buat di UI menghasilkan PNG dengan progres real-time di Bilah Laras.
  - Cakupan awal: resolusi path Node (ADR-008), plugin shell dengan scope sempit, server dan klien JSON-RPC stdio, shadcn/ui dan Lucide sesuai pemetaan DESIGN 15, Plus Jakarta Sans dibundel, kerangka layout Studio, Bilah Laras, CSP Tauri (saat ini `csp: null` dari `tauri init`), posisi traffic lights terhadap toolbar 44 px (`trafficLightPosition`), token skala tipografi UI (DESIGN 4 belum ada di `tokens.css` DESIGN 15; menunggu keputusan pemilik soal penamaan, lihat STATUS).

## Fase 3: Irisan vertikal (epic)

Urutan mengikuti PRD 11. Setiap epic dipecah menjadi task saat dimulai.

- [ ] E-301 Project dan Brand Kit (PRD US-01, US-02, F1, F2; DESIGN 6)
- [ ] E-302 Knowledge dan Copy Guide (PRD US-03, US-04, F3, F4)
- [ ] E-303 Brief dan varian (PRD US-10, US-11, US-12, US-13, F6, F7)
- [ ] E-304 Revisi lewat chat (PRD US-20, F10)
- [ ] E-305 QA di UI (PRD F9; DESIGN 10.3)
- [ ] E-306 Editor teks dan versi (PRD US-21, US-22, F11, F12). Termasuk merancang layout perbandingan dua versi di DESIGN, yang belum ada.
- [ ] E-307 Library dan export (PRD US-30, US-31, US-32, F13)
- [ ] E-308 Carousel (PRD US-14, F8)

## Fase 4: Polish (epic)

- [ ] E-401 Penanganan error dan rate limit di UI (PRD US-41, US-42, F15; DESIGN 11)
- [ ] E-402 Detail UX, ikon aplikasi, dan checklist DESIGN 16 di semua halaman (DESIGN 1, DESIGN 16)
- [ ] E-403 Build `.dmg` (ARCH 11)
- [ ] E-404 Mengukur kriteria sukses PRD 3
