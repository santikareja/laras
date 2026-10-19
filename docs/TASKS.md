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

- [x] T-106 Primitives template
  - Rujukan: ARCH 3 (`templates/primitives`), ARCH 6.2
  - AC: komponen `Text`, `Logo`, `Image`, `Grid`, `Badge` yang hanya memakai CSS variables brand; lint token lolos.
  - Verifikasi: test render HTML statis per komponen; `pnpm lint` lolos.
  - Catatan: Selesai 2026-10-18. Lima primitives di `packages/templates/primitives` dengan props bertipe nama token (warna, ukuran 1–6 dengan fallback ke langkah terbesar yang ada, spacing 1–8) dan `data-slot`; ringkasan perilaku di ARCH 6.2. Disetujui pemilik: dependency React 19.3 di `@laras/templates` dan enam token baru di `brandCss` (`--color-neutral-light/dark`, `--font-{heading,body}-weight[-strong]`). Test: 6 snapshot HTML, 1 test atribut kosong, 1 penjaga token (warna/font/ukuran wajib `var(--…)`), 1 test rantai ukuran; snapshot `brandCss` diperbarui. Dicek di browser bawaan dengan ketiga brand: bobot sesuai brand tanpa tebal palsu, tanpa overflow pada kanvas 1080 × 1350.

- [x] T-107 Renderer Playwright, pasca-proses sharp, dan `pnpm render:demo`
  - Rujukan: ARCH 7.1, ARCH 7.3, ADR-009, CLAUDE.md (Desain dan Template)
  - AC: `LayoutSpec` dirender ke HTML (`renderToStaticMarkup`) lalu PNG 2160 × 2700 setelah `document.fonts.ready` dan semua gambar termuat; satu browser dipakai ulang; export upload 1080 × 1350 sRGB; `pnpm render:demo` merender semua template × 3 brand ke `out/demo`.
  - Verifikasi: test memeriksa dimensi dan profil warna PNG; PNG demo dibuka dan dinilai.
  - Catatan: Chromium Playwright sudah ada di cache Mac ini (lihat KNOWLEDGE.md). Selesai 2026-10-18. `packages/sidecar/src/render/`: `layout.ts` (LayoutSpec → HTML, resolve slot dengan cek path), `renderer.ts` (satu browser, context per slide, origin `http://laras.invalid/` dengan route terisolasi, ADR-014), `postprocess.ts` (master sRGB, upload 1080 × 1350 PNG/JPG 92). Kontrak `Template`/`SlideProps`/`slot()` dan katalog kosong di `@laras/templates`; spesimen brand untuk demo. Dependency disetujui pemilik: `playwright-core` 1.60.0, `sharp`, `react`/`react-dom` di sidecar, `tsx` di root; `esbuild` tanpa skrip build. `jsx` dipindah ke `tsconfig.base.json`. Test: 4 test layout, 4 test renderer (PNG 2160 × 2700 dan upload PNG/JPG 1080 × 1350 berprofil sRGB, satu kali launch untuk dua slide, blokir origin lain dan path keluar folder). PNG demo tiga brand dibuka dan dinilai: font brand termuat, safe margin, radius, bayangan, dan logo sesuai; potongan 1:1 upload tajam tanpa halo. Thumbnail 360 px (ARCH 7.3) ditunda ke E-307. Alasan "CORS font `file://`" di rencana ternyata salah (diuji, lihat KNOWLEDGE); alasan ADR-014 adalah isolasi.

- [x] T-108 Template feed A dan B
  - Rujukan: PRD 4 (prinsip 3), PRD 5, ARCH 6.2, CLAUDE.md (Desain dan Template)
  - AC: dua template feed 4:5 dengan `meta` (id, format, slot dan batas karakter, opsi) dan komponen render; safe margin 64 px; font minimum 24 px; lint token lolos.
  - Verifikasi: `pnpm render:demo`, PNG dibuka dan dinilai (hierarki, keterbacaan, keseimbangan) untuk ketiga brand.
  - Catatan: dari T-107: kontrak `Template` di `packages/templates/src/template.ts` baru berisi `meta.id` dan `meta.format`; skema `meta` lengkap (dikirim ke Claude, jadi skema Zod di `shared`) dibuat di sini. Template baru didaftarkan di `src/catalog.ts` dan wajib punya isi contoh di `DEMO_SLIDES` (`scripts/render-demo.ts`). Belum ada gambar contoh untuk slot `image` di demo; sumbernya perlu diputuskan pemilik (unduhan atau Codex memakai kuota). Selesai 2026-10-18. Skema `TemplateMeta` dan `layoutIssues` di `shared` (validasi LayoutSpec terhadap meta ikut dibuat di sini karena dipakai demo, bukan task terpisah seperti di rencana). Template `feed-foto-teks` (opsi `tone` light/secondary) dan `feed-sorotan` (opsi `tone` dark/light; blok konten ditambatkan ke bawah setelah versi tengah terlihat mengambang). Foto contoh di `fixtures/demo-assets/` (T-101 untuk Kopi, 2 panggilan Codex disetujui pemilik untuk Seruni dan Ritme). `render:demo` merender isi "contoh" dan "maks" (setiap slot teks tepat `maxChars`, tone kebalikan) × 3 brand; 12 PNG dinilai: hierarki jelas, tanpa teks terpotong, slot di dalam safe margin 64/80 px, font ≥ 24 px (dicek juga lewat DOM). Test: 7 test `TemplateMeta`/`layoutIssues`, 13 test katalog (meta valid, setiap slot ber-`data-slot`, slot opsional, setiap nilai opsi).

- [x] T-109 Template feed C dan D
  - Rujukan: sama dengan T-108
  - AC: dua template feed tambahan dengan komposisi berbeda dari A dan B (mis. foto penuh dan tipografi dominan).
  - Verifikasi: sama dengan T-108.
  - Catatan: jumlah template akhir mengikuti jawaban PRD 12 pertanyaan 3. Dari T-108: rencana C = foto penuh dengan teks di atasnya, D = kutipan atau pernyataan tipografis. Foto contoh Seruni berupa tempelan 3:2 (lihat `fixtures/demo-assets/README.md`), jadi template foto penuh butuh foto Seruni baru (1 panggilan Codex, perlu izin pemilik) atau sumber lain. Selesai 2026-10-18. `feed-foto-penuh` (foto 4:5, panel teks solid dengan opsi `tone` light/dark dan `position` bottom/top; disetujui pemilik) dan `feed-kutipan` (kutipan heading ukuran 5 dengan tanda kutip dekoratif primary/secondary, atribusi dengan tanda pisah dari template, opsi `tone` secondary/dark). Foto Seruni baru dari 1 panggilan Codex (disetujui pemilik) disimpan sebagai `foto-4x5.jpg`; `foto.jpg` lama tetap untuk slot 3:2 karena potongan tengah foto baru memotong wajah, dan demo memilih foto per rasio slot. Isi demo Ritme memakai panel bawah setelah panel atas terlihat menutup kepala pelari. 12 PNG dinilai (contoh dan maks × 3 brand): tanpa teks terpotong, slot di dalam safe margin, font ≥ 24 px (cek DOM; "overflow" vertikal heading hanya metrik font, lihat T-110). Glyph tanda kutip dan tanda pisah ada di keenam font; panah → tidak ada. Test katalog otomatis mencakup kedua template (8 test baru).

- [x] T-110 QA deterministik
  - Rujukan: PRD F9, ARCH 7.2
  - AC: skrip di dalam page menghasilkan `RenderReport`: kontras (termasuk teks di atas gambar), overflow, safe margin, font minimum, font dan warna dari Brand Kit, kata terlarang, aturan emoji dan hashtag.
  - Verifikasi: test Vitest + Playwright dengan fixture yang sengaja melanggar setiap aturan dan fixture yang patuh.
  - Catatan: dari T-108: `scrollHeight > clientHeight` pada heading `line-height: 1.1` selalu terpicu tanpa teks terpotong (KNOWLEDGE), jadi aturan overflow perlu toleransi berbasis metrik font. Isi "maks" di `render:demo` bisa dijadikan fixture patuh untuk semua template × brand. Selesai 2026-10-18. `packages/sidecar/src/render/qa/`: kolektor string di page, font nyata lewat CDP, sampling piksel untuk teks di atas foto (screenshot kedua tanpa teks, persentil ke-5), aturan murni di `rules.ts`, `buildRenderReport()`; `render()` kini mengembalikan `{ png, checks }`. Ditambah aturan `asset-load` (PRD F9). Keputusan pemilik: definisi overflow baru (ARCH 7.2 diperbarui) dan hashtag dilarang di gambar. Primitives menulis `data-slot-type`. Isi demo dipindah ke `scripts/demo-content.ts`; `render:demo` menjalankan QA (27 render lolos, exit 1 bila ada yang gagal). Fixture patuh pertama menemukan bug kolektor (latar badge sendiri terlewat), sudah diperbaiki dengan fixture khusus. Test: 13 unit aturan, 10 fixture Chromium (pelanggaran per aturan, teks di atas foto, badge, RenderReport), 15 fixture patuh (katalog + spesimen × 3 brand).

- [x] T-111 Deteksi CLI (`cli/resolvePath.ts`)
  - Rujukan: ARCH 4.5 (Deteksi CLI dan PATH), PRD F14, CLAUDE.md (Hal yang Mudah Salah)
  - AC: mengembalikan path, versi, dan status login `claude` dan `codex` dari PATH login shell, lalu lokasi umum ARCH 4.5, lalu path manual.
  - Verifikasi: test dengan `exec` palsu untuk kasus ditemukan, tidak ditemukan, dan belum login; dijalankan sekali di Mac ini (tanpa kuota).
  - Catatan: Selesai 2026-10-18. `resolveClis(manualPaths, deps)` di `packages/sidecar/src/cli/resolvePath.ts` dengan skema `CliStatus` baru di `shared`; penanda PATH login shell, salinan bawaan aplikasi lain dilewati, normalisasi fnm multishell, perintah status dijalankan dengan PATH login shell dan stdin ditutup. Output asli (termasuk belum login, direkam dengan folder konfigurasi kosong atas izin pemilik; data pribadi disamarkan) jadi fixture di `packages/sidecar/test/fixtures/cli/`. Ditemukan: `codex login status` menulis ke stderr; kedua perintah status keluar dengan exit 1 bila belum login. Dijalankan sekali di Mac ini dengan PATH minimal ala aplikasi GUI: kedua CLI ditemukan lewat login shell, versi 2.1.302 dan 0.163.0, sudah login. Test: 2 skema, 7 deteksi.

- [x] T-112 Adapter Claude
  - Rujukan: ARCH 4.5 (Claude adapter, Deteksi rate limit), ARCH 5.2, ARCH 10
  - AC: menjalankan Claude dengan flag hasil T-102; parsing stream-json baris per baris; validasi Zod dengan retry maksimal 2; `LimitReachedError` untuk pesan batas kuota.
  - Verifikasi: test Vitest memakai fixture T-102, tanpa memanggil CLI asli.
  - Catatan: bergantung T-102 dan T-111. Selesai 2026-10-18. `runClaude()` di `packages/sidecar/src/cli/claude.ts`: argumen persis T-102/ADR-013 (`claudeArgs`), stream dibaca baris per baris lewat `cli/stream.ts` (event diteruskan ke `onEvent`, dibaca sampai proses selesai), `--json-schema` dari skema Zod tahap, validasi ulang Zod dengan retry maksimal 2 memakai `prompts/retry-invalid-output.md`, `InvalidOutputError`, `ClaudeRunError`, dan `LimitReachedError` (`cli/limits.ts`, kebijakan disetujui pemilik). `zod` ditambahkan ke sidecar (disetujui pemilik). Test: 14 test (argumen, parsing ketiga fixture T-102, retry, error, dan batas kuota dengan fixture sintetis berlabel karena perilaku kuota habis belum teramati).

- [x] T-113 Adapter Codex dan AssetProvider
  - Rujukan: ARCH 4.5 (Codex adapter), ARCH 5.3, ARCH 9
  - AC: `CodexAssetProvider` menyalin gambar dari `~/.codex/generated_images/` ke folder job dengan validasi path sumber dan tujuan; `UserUploadAssetProvider` untuk foto pengguna; crop dan resize ke ukuran slot.
  - Verifikasi: test Vitest memakai fixture T-101, termasuk kasus path di luar folder yang diizinkan.
  - Catatan: bergantung T-101 dan T-111. Selesai 2026-10-18. `runCodex()` (`cli/codex.ts`, pemanggilan ADR-012), `CodexAssetProvider` dan `UserUploadAssetProvider` (`pipeline/assets.ts`) dengan validasi `thread_id`, `realpath`, folder yang diizinkan, dan id aset; prompt `prompts/asset-image.md`. Keputusan pemilik: smart crop `attention`, JPG 92 + PNG asli, prompt Inggris. Parsing baris JSON dipindah ke `cli/stream.ts` (dipakai Claude dan Codex). Smart crop dibandingkan dengan crop tengah pada ketiga foto demo (perbandingan pertama tidak sah karena `.resize()` berantai; diulang). Test: 5 adapter Codex (fixture T-101, error, kuota sintetis), 7 aset (salin dan crop, smart crop menyimpan subjek, `thread_id` jahat, symlink keluar, thread kosong, id aset, prompt, unggahan pengguna).

- [x] T-114 Prompt tahap plan, copy, layout, QA visual, revise
  - Rujukan: ARCH 5.2, ARCH 5.4, ARCH 9, PRD F7, CLAUDE.md (Prompt Agent)
  - AC: satu file `.md` per tahap di `packages/sidecar/src/prompts/`, masing-masing menyebut skema dan memberi satu contoh output valid; input pengguna dibungkus delimiter dan ditandai sebagai data.
  - Verifikasi: test statis memastikan setiap prompt memuat skema, contoh yang lolos validasi Zod, dan delimiter data.
  - Catatan: Selesai 2026-10-18. Lima prompt berbahasa Indonesia, `renderPrompt` dengan input bertipe per tahap, `brandContext`, dan skema baru `Revision` di `shared` (semuanya disetujui pemilik: konteks brand eksplisit di prompt, skema Revision, bahasa Indonesia). Contoh di setiap prompt lolos Zod; contoh layout dan revise juga lolos `layoutIssues` terhadap katalog. Prompt layout Kopi Lembayung yang dirender dengan katalog penuh sekitar 3,6 ribu token. Test: 20 test prompt, 2 test `Revision`, 1 test JSON Schema.

- [x] T-115 Pipeline engine dengan resume dan revisi
  - Rujukan: ARCH 5.1, ARCH 5.4, PRD F7
  - AC: tahap menyimpan output ke `jobs/<job-id>/<nn>-<tahap>.json`; resume dari tahap pertama yang belum punya output valid; `plan` sekali per brief dengan angle per varian; revisi maksimal 2 putaran yang masuk ulang di tahap terdampak.
  - Verifikasi: test Vitest dengan adapter palsu untuk transisi state, resume setelah gagal, dan revisi parsial.
  - Catatan: dari T-114: isi prompt lewat `renderPrompt` (input `PromptInputs`); `<catalog>` hanya meta template dengan format job; `<brand>` dari `brandContext`; `<knowledge>` dari `knowledge/business.md`; LayoutSpec divalidasi `layoutIssues` (kirim ulang seperti validasi Zod bila gagal); revise menghasilkan `Revision` lalu masuk ulang di `assets` (hanya `regenerateAssets`) atau `render`. Prompt aset dari T-113. Selesai 2026-10-18. `runBrief`/`runJob` di `pipeline/engine.ts`, aturan tahap di `pipeline/stages.ts`, skema `JobSpec`/`JobState`/`JobEvent` di `shared`. Keputusan pemilik: QA visual dilewati bila cek deterministik gagal, status di `job.json` dan event di `events.jsonl`. Detail urutan langkah di ARCH 5.1. Test: 11 test engine dengan adapter palsu (jalur lolos, revisi dari cek kode, aset dibuat ulang sesuai permintaan, batas 2 putaran, revisi dari QA visual, resume setelah gagal, `waiting_quota`, file rusak, batal, plan sekali untuk 3 varian, skema tahap) dan 2 test skema Job.

- [x] T-116 Skrip `pnpm spike`
  - Rujukan: PRD 11 (Fase 1), CLAUDE.md (Perintah)
  - AC: `pnpm spike -- --brand <slug> --brief "<teks>"` menjalankan pipeline penuh dan menulis PNG, laporan QA, dan durasi per tahap ke `out/spike/`.
  - Verifikasi: satu kali jalan dengan brand fixture, hasil dibuka dan dinilai.
  - Catatan: MEMAKAI KUOTA. Minta izin pemilik sebelum menjalankan. Dari T-115: skrip merangkai `PipelineDeps` nyata: `claude` = `runClaude` (path dari `resolveClis`, cwd folder project), `assetsFor` = gabungan `UserUploadAssetProvider` dan `CodexAssetProvider`, `render` = `renderLayoutHtml` + `createRenderer` + `toMaster`; durasi per tahap dibaca dari `events.jsonl`. Folder project brand fixture di repo tidak boleh dipakai langsung sebagai folder kerja (job menulis ke `jobs/`); salin ke `out/spike/`. Status 2026-10-18: skrip `scripts/spike/` selesai dan dry-run lolos (tanpa kuota; 14 langkah termasuk 2 putaran revisi, laporan dan PNG tertulis; jadi test `scripts/spike/spike.test.ts`). Batas panggilan default Claude 12 dan Codex 3. Jalan sungguhan pertama (izin pemilik) gagal di `plan` dalam 1,7 detik: Claude CLI menolak `--json-schema` draft 2020-12 sebelum request (hampir pasti tanpa kuota; lihat KNOWLEDGE). Diperbaiki dengan target draft-07, detail stderr kini ikut dicatat di `job.json`. Jalan ulang (izin pemilik) selesai 2026-10-18: Kopi Lembayung, 1 varian, brief "Ajak pekerja di sekitar kedai mampir pagi untuk kopi susu gula aren sebelum mulai kerja."; semua tahap tanpa revisi dalam 96,9 s (plan 7,7 s, copy 7,7 s, layout 9,3 s, aset Codex 53,8 s, render 1,3 s, QA visual 16,7 s); Claude 4 panggilan tanpa retry (estimasi biaya CLI $0,52), Codex 1. Template `feed-foto-penuh`; QA kode lolos, QA visual 8/8/9/8/8. PNG dibuka dan dinilai: foto sesuai aturan brand tanpa teks, fakta dari knowledge benar; kelemahan dicatat di T-117.

- [x] T-118 Perbaikan temuan spike pertama (sebelum T-117)
  - Rujukan: catatan T-116 dan T-117, PRD F9, ARCH 5.4, ARCH 6.2
  - AC: prompt copy, layout, dan revise melarang informasi yang sama di dua slot; logo panel `feed-foto-penuh` setinggi langkah spacing 6; `QaFix` punya `severity` (`wajib`/`saran`) dan QA hanya lolos bila tidak ada perbaikan wajib (cek kode yang gagal selalu wajib).
  - Verifikasi: test prompt, skema, dan engine; `pnpm render:demo` lolos QA dan PNG dinilai; dry-run spike lolos; tanpa kuota.
  - Catatan: disetujui pemilik 2026-10-18 (kebijakan wajib/saran, pengulangan cukup lewat prompt). Selesai: 257 test lolos; `pnpm render:demo` 27/27 lolos QA, logo `feed-foto-penuh` dinilai seimbang di 3 brand (contoh dan maks); dry-run spike lolos. Efek prompt dan severity pada model asli baru terlihat di T-117.

- [!] T-117 Evaluasi spike (gerbang go/no-go)
  - Rujukan: PRD 11 (Fase 1), PRD 10 (risiko kualitas), PRD 12 pertanyaan 5
  - AC: 3 brand × 3 brief dijalankan; pemilik menilai kelayakan publikasi; skor QA visual, durasi, dan jumlah retry tercatat; ambang QA dikalibrasi; keputusan go/no-go tertulis.
  - Verifikasi: tabel hasil 9 percobaan di KNOWLEDGE.md; ≥ 6 dari 9 layak publikasi menurut pemilik.
  - Catatan: MEMAKAI KUOTA BESAR. Jadwalkan bersama pemilik. Temuan jalan spike pertama (T-116) untuk kalibrasi: (1) QA visual lolos (rata-rata 8,2) padahal menulis 3 perbaikan nyata (jam buka disebut dua kali, "sebelum kerja" di headline dan CTA, logo kecil) yang tidak diterapkan; pertimbangkan ambang lebih ketat atau satu putaran revisi bila ada fixes. (2) Logo di panel `feed-foto-penuh` (tinggi langkah 5 = 48 px) dinilai terlalu kecil; kandidat perbaikan template. (3) Prompt copy perlu larangan mengulang informasi yang sama antar slot (badge, body, CTA). Ketiganya ditangani T-118; T-117 memeriksa efeknya pada model asli.
  - Hasil 2026-10-19: 9 percobaan dijalankan (izin pemilik; Claude 61, Codex 15, retry 0, ±30 menit). R3 gagal teknis di render putaran 1 (bug varian logo, lihat T-119). QA lolos 5/9, layak menurut pemilik **0/9** ("terlalu generik, kaku dan AI slop"). Keputusan: NO-GO. Tabel, kalibrasi, dan temuan di KNOWLEDGE "Evaluasi spike T-117". Status [!] karena verifikasi ≥ 6/9 tidak tercapai; arah perbaikan menunggu pemilik (T-120).

- [x] T-119 Validasi varian logo terhadap Brand Kit sebelum render
  - Rujukan: KNOWLEDGE "Evaluasi spike T-117", ARCH 5.4
  - AC: layout dan revisi yang memakai varian logo yang tidak ada di Brand Kit ditolak saat validasi tahap (masuk retry validasi), dan prompt layout serta revise menyebut varian yang tersedia.
  - Verifikasi: test validasi tahap dan engine; dry-run spike lolos; tanpa kuota.
  - Selesai 2026-10-19: `logoVariants` dan `logoIssues` di `shared`; `layoutSchema` dan `revisionSchema` menerima konteks (katalog, jumlah slide, logo Brand Kit) dan menolak varian tanpa file dengan pesan yang menyebut varian tersedia; engine meneruskan logo di empat titik (tanya dan resume); `brandContext` menulis "Varian logo tersedia", aturan logo di prompt layout dan revise disesuaikan. Test: skema layout dan revise, revisi dengan `onLight` ditolak sebelum render, file layout lama dengan varian tanpa file diulang saat resume, prompt. 289 test lolos, dry-run spike lolos, tanpa kuota.

- [x] T-120 Arah ulang kualitas desain setelah NO-GO
  - Rujukan: KNOWLEDGE "Evaluasi spike T-117", PRD 4 (anti AI-slop), PRD 10, DESIGN
  - AC: standar "kelas dunia" pemilik ditulis konkret (referensi dan kriteria), lalu dipecah menjadi task template, art direction foto, dan rubric QA visual sebelum evaluasi ulang.
  - Catatan: masukan pemilik 2026-10-19: masalah utama adalah struktur yang selalu sama (foto + kartu teks, urutan badge–headline–body–CTA di setiap postingan); foto, tipografi, dan jumlah teks tidak dipilih sebagai masalah utama. Pemilik akan mengirim 5–10 referensi kelas dunia; kriteria konkret diturunkan dari referensi itu sebelum rencana disusun. Kandidat dari temuan T-117: QA visual membuka file logo, deskripsi foto membawa lokasi dan audiens brand, celah kosong `feed-foto-teks`, larangan fakta karangan di `qa-visual.md`, revisi karena skor saja.
  - Hasil 2026-10-19: pemilik mengirim 59 referensi (lokasi di KNOWLEDGE); kriteria K1–K8 diturunkan, disetujui, dan ditulis di PRD 4 (prinsip 7; prinsip 3 diubah ke arketipe komposisi). Pendekatan arketipe parametrik dicatat sebagai ADR-015. Dipecah menjadi T-121 sampai T-127; urutan sesuai pilihan pemilik: verifikasi Codex dulu.

- [x] T-121 Verifikasi Codex: subjek cut-out transparan dan gambar konsep
  - Rujukan: PRD 4 (K1, K3, K4), KNOWLEDGE Codex CLI ("Belum diuji": background transparan), ADR-012
  - AC: diketahui apakah `image_gen` bawaan menghasilkan PNG dengan alpha untuk objek dan orang, seberapa bersih tepinya di atas bidang warna, dan apakah gambar konsep satu objek dengan ruang kosong untuk tipografi bisa diminta lewat prompt.
  - Verifikasi: fakta (ukuran, alpha, durasi, token) dan penilaian tepi ditulis di KNOWLEDGE; gambar dibuka dan dinilai.
  - Catatan: MEMAKAI KUOTA Codex. Minta izin pemilik dengan jumlah panggilan sebelum menjalankan.
  - Hasil 2026-10-19 (izin pemilik, tepat 3 panggilan Codex, 0 Claude): PNG beralpha untuk objek dan orang dengan tepi bersih (alpha subjek 253 perlu dinormalisasi), gambar konsep mengikuti ruang kosong yang diminta. Library penghapus latar tidak diperlukan. Rincian di KNOWLEDGE Codex CLI; gambar di `out/t121/` untuk prototipe T-122.

- [x] T-122 Prototipe 4 arketipe komposisi dan perangkat grafis dasar
  - Rujukan: PRD 4 (K1–K8), ADR-015, hasil T-121
  - AC: 4 arketipe (tipografi raksasa yang menimpa foto, bidang warna dengan subjek dan kata bersorot, iklan minimal satu objek, kolase diagonal) dirender untuk 3 brand dengan aset demo atau hasil T-121; pemilik menilai arahnya sebelum sistem penuh dibangun.
  - Verifikasi: `pnpm render:demo` lolos QA kode; PNG dinilai agent dan pemilik.
  - Catatan 2026-10-19: atas izin pemilik, 1 panggilan Codex tambahan untuk cut-out Seruni. Dikerjakan: aset T-121 dan cut-out Seruni di `fixtures/demo-assets/`, primitives `Display`, `Highlight` (prop `highlight` di `Text`), `Scribble`, `Sticker`, `Frame`, empat arketipe di `packages/templates/prototype/` (di luar katalog), `pnpm render:prototype`, dan test QA prototipe. Pesan sama dengan T-117 K2/S1/R1 untuk pembanding. 12 render lolos QA kode; 279 test lolos. Menunggu penilaian pemilik.
  - Penilaian pemilik 2026-10-19: A2 "sudah lumayan, tetapi masih belum sesuai dengan design rules" (aturan brand dan prinsip desain umum). Prototipe melanggar aturan brand: logo Kopi tidak di kanan bawah, kantong Kopi di latar terang polos, Seruni lebih dari dua elemen visual utama, angka Ritme ditulis kecil. Prinsip desain umum P1–P7 disetujui dan ditulis di PRD 4; keempat arketipe direvisi agar patuh aturan brand dan P1–P7 sebelum dinilai ulang. Pemilik juga meminta fitur gaya desain (PRD F16, T-128, T-129).
  - Revisi 2026-10-19 (tanpa kuota): posisi logo, sisi subjek, perataan, panah, coretan, dan bidang menjadi parameter arketipe; isi per brand mematuhi aturan brand (logo Kopi kanan bawah di keempat arketipe dan tanpa latar terang polos, Seruni maksimal dua elemen visual utama, angka Ritme selalu besar) dan P1–P7 (`Text` mendapat `measure` dan `balance` untuk P4). QA kode menangkap headline Ritme yang menimpa subjek (kontras 1:1) sebelum diperbaiki; tiga tabrakan teks dan subjek (P6) diperbaiki setelah dicek visual. 12 render lolos QA kode, 280 test lolos. Menunggu penilaian ulang pemilik.
  - Penilaian pemilik atas revisi: A1 dan A3 diterima; A2 dan A4 masih perlu revisi (tipografi, komposisi, foto dan aset, masih terasa generik). Revisi v3 (izin pemilik, 3 panggilan Codex untuk cut-out yang berinteraksi): perangkat grafis baru (tepi sobek dan duotone di `Frame`, `Tape`, kilau, lingkaran coretan yang mengisi kotak, tumpukan kata di `Display`, CTA tombol); A2 dengan lengkung, headline tiga tingkat (pembuka bersorot, frasa utama bertumpuk, penutup), subjek menimpa frasa, fakta ditempel ke subjek; A4 dengan bingkai duotone bertepi sobek dan selotip, subjek keluar bingkai, fakta dilingkari coretan. Aturan brand tetap dipatuhi (Seruni tanpa duotone karena aturan tekstur kulit asli). 12 render lolos QA kode, 282 test lolos. Menunggu penilaian pemilik.
  - Penilaian pemilik atas v3: A2 dan A4 masih perlu revisi; pemilik menekankan aturan hierarki visual, rule of thirds, 60-30-10, ruang kosong, dan konsistensi. Audit terukur: v3 terlalu ramai (A4 9–11 elemen), aksen dan warna kedua terlalu besar (A2 Kopi aksen 19%, A2 Ritme 50/36, A4 Kopi terpecah ke enam warna), sementara referensi terbaik dan A1/A3 punya warna dominan 58–75%. Cara ukur 60-30-10: render diperkecil, setiap piksel dipetakan ke token warna brand terdekat (jarak RGB ≤ 40, selain itu dihitung gambar). Aturan P2 diperketat dan P8–P11 ditulis di PRD 4 (disetujui pemilik). Revisi v4: kurangi elemen, aksen hanya untuk CTA dan sorotan, fokus di titik potong grid 3×3, satu keluarga dekorasi.
  - Hasil v4 2026-10-19 (tanpa kuota): A2 lima elemen (lengkung warna kedua, subjek, blok teks tiga tingkat, CTA aksen, logo), letak blok teks atas atau bawah menjadi parameter agar berseberangan diagonal dengan titik fokus subjek; A4 lima elemen (bingkai bertepi sobek dengan selotip, pita warna kedua, subjek, CTA, logo; body hanya bila tanpa subjek), kilau, lingkaran, dan stiker dihapus. Proporsi warna terukur: A2 67/31/2, 69/26/4, 63/34/2; A4 59/34/2, 65/31/4, 67/27/1 (dominan / warna kedua dan gambar / aksen) sehingga semua memenuhi P9. Titik fokus dicek dengan grid 3×3. 12 render lolos QA kode, 282 test lolos. Menunggu penilaian pemilik.
  - Selesai 2026-10-19: pemilik menyatakan A2 dan A4 v4 sudah sesuai (A1 dan A3 diterima sebelumnya). Pelajaran untuk T-123: penempatan dan ukuran masih diatur manual per brand lewat parameter (sisi subjek, letak teks, tinggi lengkung, lebar huruf); sistem arketipe perlu menghitungnya dari kotak alpha subjek dan ukuran teks terukur, lalu memeriksa P8–P11 secara otomatis.

- [x] T-123 Fondasi sistem arketipe parametrik
  - Rujukan: ADR-015, ARCH 6.2, ARCH 7.1, catatan T-122
  - AC: aset cut-out dianalisis (normalisasi alpha, kotak alpha, titik fokus) dan datanya ada di `AssetManifest` serta slot gambar yang di-resolve; slot gambar bisa menandai `cutout` dan `layoutIssues` memeriksa jenis aset (`AssetRequest.kind`); renderer menjalankan langkah fit-to-width terukur sebelum QA dan screenshot; keempat arketipe yang disetujui di T-122 pindah ke `packages/templates/feed/` dengan meta final, letak teks dihitung dari titik fokus subjek, dan tanpa parameter lebar huruf manual; `render:demo` merender arketipe × 3 brand (`render:prototype` digabung).
  - Verifikasi: test skema, analisis cut-out (dikalibrasi pada 6 cut-out fixture), fit-to-width, dan QA demo; `render:demo` lolos QA dan render arketipe setara atau lebih baik dari v4 yang disetujui; dry-run spike lolos; tanpa kuota.
  - Catatan: dipecah 2026-10-19 atas persetujuan pemilik menjadi T-123 (fondasi), T-130 (QA desain terukur), dan T-131 (pipeline dengan arketipe). Katalog Claude belum diganti di task ini.
  - Selesai 2026-10-19 (tanpa kuota): `SubjectInfo` di `AssetManifest`, `AssetKind` dan slot `cutout` dengan pemeriksaan di `layoutIssues`; `normalizeCutout` dan `analyzeCutout` (`pipeline/cutout.ts`, jenis subjek orang atau objek, galat fokus ≤ 0,08 pada 6 fixture); langkah fit-to-width di renderer (`render/fit.ts`); arketipe di `packages/templates/feed/` dengan letak teks dihitung dari fokus subjek dan tanpa parameter lebar huruf; A3 dipecah menjadi `feed-satu-objek` (cut-out) dan `feed-foto-konsep` (foto penuh) karena jenis asetnya berbeda; `render:demo` merender 13 kombinasi arketipe × brand (foto konsep baru ada untuk Seruni; Seruni satu objek adalah kombinasi baru) dan `render:prototype` dihapus. Render arketipe setara v4 yang disetujui; lebar blok teks A2 diturunkan dari 48% ke 44% karena frasa utama yang dipaskan penuh menyentuh lengan pelari Ritme (tertangkap QA kontras). 311 test lolos, dry-run spike lolos.

- [ ] T-130 QA desain terukur
  - Rujukan: PRD 4 (P1, P2, P4, P8–P11), ARCH 7.2, catatan T-122
  - AC: aturan QA kode baru untuk sumbu perataan (P1), hierarki dan jumlah ukuran huruf (P2), baris yatim dan panjang baris (P4), titik fokus terhadap grid 3×3 memakai titik fokus subjek dan kotak kata utama (P8), proporsi warna dari piksel render terhadap Brand Kit (P9), ruang kosong dan jumlah elemen (P10), serta jarak tepi, radius, dan kemiringan yang konsisten (P11); elemen non-slot ditandai agar bisa dihitung; kedua belas render arketipe yang disetujui lolos semua aturan.
  - Catatan: keputusan pemilik 2026-10-19: aturan baru awalnya bertingkat saran (tidak menggagalkan QA) sampai terkalibrasi, lalu dinaikkan menjadi wajib.

- [ ] T-131 Pipeline dengan arketipe
  - Rujukan: ADR-015, PRD F7, ARCH 5, T-121 (cut-out Codex)
  - AC: katalog Claude berisi arketipe; empat template lama dipensiunkan (keputusan pemilik 2026-10-19); prompt dan contoh layout serta revise diperbarui; tahap layout meminta aset `cutout` bila slot membutuhkannya; prompt Codex untuk cut-out transparan; `CodexAssetProvider` menjaga alpha, menganalisis cut-out, dan tidak memotongnya; dry-run spike lolos.
  - Catatan: uji Codex sungguhan hanya dengan izin pemilik.

- [ ] T-124 Perangkat grafis dan peran font tambahan di Brand Kit
  - Rujukan: PRD 4 (K2, K5), PRD F2, ARCH 6.1
  - AC: Brand Kit dan token memuat perangkat grafis brand (gaya sorot, coretan, stiker) dan peran font aksen opsional; fixture tiga brand diperbarui.
  - Tambahan dari T-122: aturan brand yang bisa ditegakkan kode dibuat terstruktur (mis. posisi logo, batas elemen visual utama, angka ditulis besar, larangan gradient, larangan latar polos), sementara aturan teks bebas tetap untuk Claude dan QA visual.

- [ ] T-125 Ide besar di tahap plan dan art direction aset
  - Rujukan: PRD 4 (K1, K4, K7), temuan T-117 (lokasi brand)
  - AC: plan menghasilkan konsep visual per varian; prompt aset meminta foto konsep, subjek cut-out bila arketipe membutuhkannya, dan lokasi serta audiens dari knowledge.

- [ ] T-126 Rubric QA visual K1–K8 dan perbaikan QA dari T-117
  - Rujukan: PRD 4, PRD F9, temuan T-117
  - AC: skor QA visual mengikuti K1–K8 dengan contoh referensi; QA membuka file logo brand; larangan menyarankan fakta di luar knowledge; kebijakan revisi bila skor rendah tanpa perbaikan wajib diputuskan pemilik.
  - Tambahan dari T-122: QA visual juga menilai kepatuhan aturan brand, P1–P7, dan kesesuaian dengan gaya desain yang dipilih (PRD F16).

- [x] T-128 Panduan gaya tahap 1 (tujuh gaya)
  - Rujukan: PRD F16, US-17, PRD 4, ADR-015; referensi pemilik di `~/Downloads/instagram reference design/<gaya>/` (tidak di-commit)
  - AC: folder `packages/templates/styles/<id>/` untuk brutalism, corporate-clean, cyberpunk, flat-design, minimalism, glassmorphism-neumorphism, dan retro-vintage; masing-masing `PANDUAN.md` lengkap (asal-usul, kapan cocok, ciri visual, komposisi termasuk aturan P1–P11 yang tetap wajib dan yang dilonggarkan, tipografi, warna, perangkat grafis, foto dan frasa prompt gambar, minimal lima pola layout untuk jenis konten berbeda, carousel, do dan don't, kecocokan Brand Kit, checklist QA, referensi dengan sumber) dan `style.ts` yang lolos skema `StyleMeta` di `shared`.
  - Verifikasi: test skema dan definisi gaya; panduan ditinjau agent dan pemilik; tanpa kuota CLI (riset lewat browsing).
  - Catatan: keputusan pemilik 2026-10-19: tujuh gaya dari folder referensi, Glassmorphism dan Neumorphism satu gaya dua varian, lokasi `packages/templates/styles`, urutan T-128 → T-132 → T-130 → T-131 → T-133.
  - Hasil (2026-10-19, disetujui pemilik): tujuh `PANDUAN.md` (376–434 baris, 14 bagian seragam, 6–7 pola layout feed per gaya, referensi bersumber) ditulis dari folder referensi pemilik dan riset web, lalu ditinjau agent. Skema `StyleMeta` dan `styleFit()` di `packages/shared/src/style-meta.ts`; tujuh `style.ts` dan daftar `styles` diekspor dari `@laras/templates`. Test memeriksa skema, arketipe yang dirujuk ada, judul panduan sama dengan `name`, urutan 14 bagian, minimal lima pola, dan ada URL. Kecocokan fixture: Seruni kurang cocok untuk Brutalisme, Cyberpunk, Flat, dan Vintage/Retro (tanpa warna jenuh; Brutalisme juga karena sudut 24 px); Kopi dan Ritme kurang cocok untuk Glassmorphism/Neumorphism (sudut di bawah 16 px, tanpa bayangan lembut). typecheck, lint, 324 test lolos; tanpa kuota.
  - Perangkat grafis yang belum ada dicatat per gaya sebagai `perlu-dibuat` (cakupan T-132); arketipe baru usulan panduan dicatat di `plannedArchetypes` (mis. `feed-poster-grid`, `feed-panel-info`, `feed-panggung-neon`, `feed-kartu-kaca`, `feed-iklan-cetak`).
  - Pertanyaan untuk pemilik: (1) blur kaca dianggap material, bukan gradient, sedangkan kolam cahaya neon yang berpendar dianggap gradient (`gradient: subtle`) sehingga tidak dipakai pada brand yang melarang gradient; (2) Flat Design ingin tint warna lewat `color-mix` dari token; (3) Brutalisme, Cyberpunk, dan Vintage/Retro mengandalkan font aksen ketiga (T-124) untuk label; (4) cek mesin menilai Kopi cocok untuk Cyberpunk dari warnanya, padahal panduan menilainya kurang cocok karena heading serif, aturan "Tanpa gradient", dan foto produk wajib cahaya alami; aturan brand berbentuk teks bebas baru bisa dicek mesin setelah T-124.
  - Keputusan pemilik 2026-10-19: panduan disetujui dan keempat usulan diterima: (1) blur kaca adalah material, kolam cahaya neon adalah gradient; (2) tint turunan token lewat `color-mix` antara dua token brand boleh untuk pola tone-on-tone; (3) label Brutalisme, Cyberpunk, dan Vintage/Retro memakai font aksen ketiga dari T-124; (4) `styleFit` tetap hanya mengecek data terukur, aturan brand teks bebas menyusul T-124.

- [~] T-132 Render gaya dan thumbnail (tujuh gaya)
  - Rujukan: T-128, PRD F16, ADR-015, ARCH 6.2
  - AC: lapisan gaya di renderer dan perangkat grafis baru yang dibutuhkan panduan (mis. halftone, grain, glow neon, kaca buram, garis grid); `pnpm render:styles` menghasilkan thumbnail setiap gaya × 3 brand fixture dengan tanda "kurang cocok" bila Brand Kit bertentangan; pemilik menilai thumbnail.
  - Keputusan pemilik 2026-10-19: semua perangkat grafis berstatus `perlu-dibuat` di ketujuh `style.ts` dibuat di task ini; satu thumbnail per gaya (varian paling khas) × 3 brand; pola khas: Brutalisme `feed-kolase-diagonal`, Corporate Clean `feed-panel-info` (baru), Cyberpunk `feed-satu-objek`, Flat `feed-bidang-warna`, Minimalism `feed-satu-objek`, Glassmorphism `feed-kartu-kaca` (baru), Vintage/Retro `feed-kata-raksasa`; pola bertepi tajam (halftone, scanline, grain) boleh pada brand "Tanpa gradient".
  - Rencana: pilihan gaya `StyleChoice` dan opsi gaya di `shared`; lapisan gaya (variabel CSS turunan gaya dan Brand Kit mengikuti bagian 12 panduan) yang tidak mengubah render tanpa gaya; perangkat grafis di `primitives`; renderer menerima gaya; cek warna Brand Kit menerima tint campuran dua token pada latar dan border; spesimen perangkat per gaya; `pnpm render:styles` (21 render, thumbnail 360 px, lembar ringkasan dengan tanda "kurang cocok"); tanpa kuota dan tanpa dependency baru.

- [ ] T-134 Arketipe baru dari panduan gaya
  - Rujukan: T-128 (`plannedArchetypes` di setiap `style.ts`), T-132, ADR-015
  - AC: arketipe usulan panduan selain `feed-panel-info` dan `feed-kartu-kaca` (mis. `feed-poster-grid`, `feed-indeks`, `feed-panel-hud`, `feed-panel-lengkung`, `feed-minimal-tipografi`, `feed-iklan-cetak`) dibuat dari perangkat T-132, dengan isi demo untuk tiga brand dan QA lolos; pemilik menilai hasilnya.
  - Catatan: ditemukan saat merencanakan T-132 (keputusan pemilik 2026-10-19: perangkat di T-132, arketipe lain menyusul).

- [ ] T-133 Gaya desain di pipeline
  - Rujukan: PRD F16, US-17, T-128, T-131
  - AC: gaya default project dan pilihan per brief; panduan gaya masuk prompt copy, layout, aset, dan QA visual; tanda "kurang cocok" untuk brand; dry-run spike per gaya.

- [ ] T-129 Gaya desain tahap 2 (enam belas gaya)
  - Rujukan: PRD F16, T-128, T-132
  - AC: enam belas gaya tahap 2 ditambahkan dengan pola T-128 dan T-132, masing-masing dengan panduan dan thumbnail.

- [ ] T-127 Evaluasi ulang spike
  - Rujukan: PRD 11 (Fase 1), KNOWLEDGE "Evaluasi spike T-117"
  - AC: brief yang sama dengan T-117 dijalankan ulang; pemilik menilai; keputusan go/no-go tertulis.
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
  - Cakupan awal (ditemukan di T-114): generator konteks `CLAUDE.md` dan `AGENTS.md` project (ARCH 8.3) belum punya task; prompt tahap Claude sudah membawa konteks brand sendiri, jadi generator ini terutama untuk `AGENTS.md` Codex dan daftar file knowledge.
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
  - Cakupan awal (ditemukan di T-107): unduh Chromium revisi yang cocok dengan `playwright-core` terpin ke `~/Library/Application Support/Laras/browsers` saat pertama dipakai (`PLAYWRIGHT_BROWSERS_PATH`, ARCH 7.1) dengan izin pengguna, fallback Chrome terinstal; saat ini renderer memakai cache Playwright bawaan. Bundel sidecar (tsup) juga perlu JSX otomatis (lihat KNOWLEDGE soal tsx).
- [ ] E-404 Mengukur kriteria sukses PRD 3
