# STATUS
Terakhir diperbarui: 2026-10-19, sesi #8

## Fase saat ini
Fase 1: Spike pipeline. Fase 0 selesai. Verifikasi CLI selesai: T-101 (generasi gambar Codex, ADR-012) dan T-102 (Claude headless dan isolasi, ADR-013). T-103 (skema Zod inti), T-104 (tiga brand fixture, skema `CopyGuide`), T-105 (token brand ke CSS), T-106 (primitives template), T-107 (renderer Playwright, sharp, `pnpm render:demo`), T-108 (template `feed-foto-teks` dan `feed-sorotan`, skema `TemplateMeta`), T-109 (template `feed-foto-penuh` dan `feed-kutipan`), T-110 (QA deterministik di renderer), T-111 (deteksi CLI, skema `CliStatus`), T-112 (adapter Claude), T-113 (adapter Codex dan AssetProvider), T-114 (prompt tahap, skema `Revision`), T-115 (pipeline engine), T-116 (`pnpm spike`; satu jalan sungguhan Kopi Lembayung lolos QA dalam 97 detik dengan 4 panggilan Claude dan 1 Codex), dan T-118 (perbaikan temuan spike: perbaikan QA bertingkat `wajib`/`saran`, larangan pengulangan informasi di prompt, logo `feed-foto-penuh` lebih besar) selesai. Katalog berisi 4 template feed. T-117 (evaluasi spike, 9 percobaan) selesai dijalankan dengan keputusan **NO-GO**: 0 dari 9 layak menurut pemilik ("terlalu generik, kaku dan AI slop"), walau QA meloloskan 5. Fase 2 belum dimulai; Fase 1 berlanjut dengan perbaikan kualitas desain: standar K1–K8 di PRD 4 (dari 59 referensi pemilik) dan arketipe komposisi parametrik (ADR-015), dipecah menjadi T-121 sampai T-127. T-121 selesai: Codex menghasilkan subjek cut-out beralpha dan gambar konsep sesuai komposisi yang diminta.

## Sedang dikerjakan
Tidak ada. T-122 selesai: empat arketipe prototipe disetujui pemilik setelah revisi v4 sesuai aturan desain P8–P11. T-119 selesai: varian logo divalidasi terhadap Brand Kit di skema tahap layout dan revise.
T-123 selesai: arketipe ada di `packages/templates/feed/` (daftar `archetypes`, belum katalog Claude), cut-out dianalisis (`pipeline/cutout.ts`), dan renderer memaskan kata raksasa ke lebar kotaknya. `pnpm render:demo` kini juga merender arketipe.
T-128 [~] menunggu tinjauan pemilik: panduan tujuh gaya tahap 1 di `packages/templates/styles/<id>/PANDUAN.md` dan definisi mesin `style.ts` (skema `StyleMeta`, `styleFit` di `shared`); verifikasi kode lolos. Empat pertanyaan pemilik dicatat di T-128 (TASKS).

## Berikutnya (urut)
1. Tinjauan pemilik atas panduan T-128, lalu T-132 render gaya dan thumbnail (termasuk perangkat grafis `perlu-dibuat` di `style.ts`).
2. T-130 QA desain terukur, T-131 pipeline dengan arketipe, T-133 gaya di pipeline.
3. T-124 sampai T-126 (aturan brand terstruktur dan perangkat grafis Brand Kit, ide besar dan art direction, rubric QA visual K1–K8 dan P1–P11).
4. T-129 gaya tahap 2, lalu T-127 evaluasi ulang spike (memakai kuota besar; izin pemilik).

## Blocker
- Tidak ada.

## Menunggu keputusan pemilik
- Jumlah template awal per format (PRD 12 pertanyaan 3; usulan 8 feed, 4 sistem carousel).
- Tinjauan panduan gaya T-128 dan empat pertanyaannya (gradient pada blur dan glow, tint `color-mix`, font aksen ketiga, kecocokan Kopi untuk Cyberpunk).
- Penamaan token skala tipografi UI: DESIGN 4 mendefinisikan `--text-caption` … `--text-display` (ukuran), tetapi `tokens.css` di DESIGN 15 tidak memuatnya; prefix `--text-*` juga dipakai untuk warna (`--text-primary`) dan merupakan namespace ukuran font di Tailwind v4. Usulan: ganti nama token ukuran menjadi `--type-*` (dibutuhkan paling lambat E-201).

## Catatan untuk sesi berikutnya
- Baca docs/KNOWLEDGE.md sebelum task yang menyentuh CLI, build, atau lingkungan.
- `cargo` dan `pnpm dev` dijalankan lewat login shell (`/bin/zsh -lic '...'`) dari proses agent.
- Sesi agent tidak punya izin Screen Recording maupun Accessibility: cek HTML/CSS di browser bawaan (`http://localhost:1420`) atau dengan diagnostik WebView (cara di KNOWLEDGE); tampilan jendela native dilihat pemilik.
- Jendela masih kosong sesuai target Fase 0; isi UI dimulai di E-201.
- Brand fixture: `fixtures/brands/{kopi-lembayung,seruni-skin,ritme-run-club}`; `ritme-run-club` berbahasa Inggris. Integritasnya dijaga `packages/sidecar/src/storage/brand-fixtures.test.ts`.
- Token brand: `brandCss(brand, { assetBaseUrl })` dari `@laras/templates`; kontrak variabel di tabel ARCH 6.1. Renderer T-107 menentukan `assetBaseUrl` (URL folder project berakhiran `/`); halaman `file://` di browser bawaan hanya snapshot statis, jadi pakai server `localhost` untuk cek DOM.
- Template (T-108 dst.) dibangun dari primitives `Text`, `Badge`, `Image`, `Logo`, `Grid` (ARCH 6.2); props hanya nama token, elemen slot diberi `data-slot`. Template menerima slot yang sudah di-resolve lewat `SlideProps` dan `slot()` (`packages/templates/src/template.ts`), didaftarkan di `src/catalog.ts`, punya `meta` yang lolos `TemplateMeta`, dan wajib punya isi contoh di `DEMO_COPY` (`scripts/demo-content.ts`); demo otomatis merender varian "contoh" dan "maks" (tepat `maxChars`) yang divalidasi `layoutIssues`. Foto contoh ada di `fixtures/demo-assets/<brand>/` (`foto.jpg`, atau `foto-<rasio>.jpg` bila ada).
- Renderer: `packages/sidecar/src/render/` (ARCH 7.1, ADR-014). `render(html, folders, { brand, copyGuide })` mengembalikan `{ png, checks }` dengan QA deterministik (ARCH 7.2). `pnpm render:demo` merender spesimen + katalog × 3 brand ke `out/demo/` (~16 detik), mencetak hasil QA per PNG, dan keluar dengan kode 1 bila ada cek gagal; buka PNG `-1080.png` dengan Read tool untuk menilai. Test memakai Chromium 1223 di `~/Library/Caches/ms-playwright`; `pnpm test` kini ~12,5 detik.
- Skrip yang dijalankan di page (`page.evaluate`) ditulis sebagai string, bukan fungsi: tsx menyisipkan `__name` yang tidak ada di page (KNOWLEDGE).
- CLI teruji: Claude 2.1.302 dan Codex 0.163.0 di `~/.local/bin`. Pemanggilan keduanya sudah terverifikasi (ARCH 4.5, ADR-012, ADR-013, KNOWLEDGE); fixture di `packages/sidecar/test/fixtures/`. Deteksi path, versi, dan login: `resolveClis()` di `packages/sidecar/src/cli/resolvePath.ts` (dipakai adapter T-112/T-113 untuk path absolut CLI). Adapter Claude: `runClaude()` di `packages/sidecar/src/cli/claude.ts` (retry validasi, `LimitReachedError` di `cli/limits.ts`; pola kuota belum terverifikasi). Adapter Codex `runCodex()` (`cli/codex.ts`) dan `CodexAssetProvider`/`UserUploadAssetProvider` (`pipeline/assets.ts`, smart crop `attention`, JPG + PNG asli). Prompt aset `prompts/asset-image.md` belum diuji dengan Codex sungguhan; pertama kali di T-116. Prompt tahap Claude (`prompts/*.md`, `renderPrompt`, `brandContext`) membawa konteks brand dan knowledge sendiri; generator `CLAUDE.md` project belum ada (cakupan E-302). Pipeline: `runBrief`/`runJob` di `packages/sidecar/src/pipeline/engine.ts` (ARCH 5.1, 5.4); cara merangkainya untuk spike ada di catatan T-116 di TASKS. `codex login status` menulis ke stderr; status belum login keluar dengan exit 1.
- Dua gambar uji T-101 masih ada di `~/.codex/generated_images/` (milik folder Codex pemilik, tidak dihapus agent).
- Paket Claude terdeteksi Team; pemilik diminta memastikan kebijakan organisasi.
