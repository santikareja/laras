# STATUS
Terakhir diperbarui: 2026-10-18, sesi #8

## Fase saat ini
Fase 1: Spike pipeline. Fase 0 selesai. Verifikasi CLI selesai: T-101 (generasi gambar Codex, ADR-012) dan T-102 (Claude headless dan isolasi, ADR-013). T-103 (skema Zod inti), T-104 (tiga brand fixture, skema `CopyGuide`), T-105 (token brand ke CSS), T-106 (primitives template), T-107 (renderer Playwright, sharp, `pnpm render:demo`), T-108 (template `feed-foto-teks` dan `feed-sorotan`, skema `TemplateMeta`), dan T-109 (template `feed-foto-penuh` dan `feed-kutipan`) selesai. Katalog berisi 4 template feed. Tidak ada task berikutnya yang memakai kuota sampai T-116.

## Sedang dikerjakan
Tidak ada.

## Berikutnya (urut)
1. T-110 QA deterministik.
2. T-111 Deteksi CLI (`cli/resolvePath.ts`).
3. T-112 Adapter Claude.
4. T-113 Adapter Codex dan AssetProvider.

## Blocker
- Tidak ada.

## Menunggu keputusan pemilik
- Jumlah template awal per format (PRD 12 pertanyaan 3; usulan 8 feed, 4 sistem carousel).
- Penamaan token skala tipografi UI: DESIGN 4 mendefinisikan `--text-caption` … `--text-display` (ukuran), tetapi `tokens.css` di DESIGN 15 tidak memuatnya; prefix `--text-*` juga dipakai untuk warna (`--text-primary`) dan merupakan namespace ukuran font di Tailwind v4. Usulan: ganti nama token ukuran menjadi `--type-*` (dibutuhkan paling lambat E-201).

## Catatan untuk sesi berikutnya
- Baca docs/KNOWLEDGE.md sebelum task yang menyentuh CLI, build, atau lingkungan.
- `cargo` dan `pnpm dev` dijalankan lewat login shell (`/bin/zsh -lic '...'`) dari proses agent.
- Sesi agent tidak punya izin Screen Recording maupun Accessibility: cek HTML/CSS di browser bawaan (`http://localhost:1420`) atau dengan diagnostik WebView (cara di KNOWLEDGE); tampilan jendela native dilihat pemilik.
- Jendela masih kosong sesuai target Fase 0; isi UI dimulai di E-201.
- Brand fixture: `fixtures/brands/{kopi-lembayung,seruni-skin,ritme-run-club}`; `ritme-run-club` berbahasa Inggris. Integritasnya dijaga `packages/sidecar/src/storage/brand-fixtures.test.ts`.
- Token brand: `brandCss(brand, { assetBaseUrl })` dari `@laras/templates`; kontrak variabel di tabel ARCH 6.1. Renderer T-107 menentukan `assetBaseUrl` (URL folder project berakhiran `/`); halaman `file://` di browser bawaan hanya snapshot statis, jadi pakai server `localhost` untuk cek DOM.
- Template (T-108 dst.) dibangun dari primitives `Text`, `Badge`, `Image`, `Logo`, `Grid` (ARCH 6.2); props hanya nama token, elemen slot diberi `data-slot`. Template menerima slot yang sudah di-resolve lewat `SlideProps` dan `slot()` (`packages/templates/src/template.ts`), didaftarkan di `src/catalog.ts`, punya `meta` yang lolos `TemplateMeta`, dan wajib punya isi contoh di `DEMO_COPY` (`scripts/render-demo.ts`); demo otomatis merender varian "contoh" dan "maks" (tepat `maxChars`) yang divalidasi `layoutIssues`. Foto contoh ada di `fixtures/demo-assets/<brand>/foto.jpg`.
- Renderer: `packages/sidecar/src/render/` (ARCH 7.1, ADR-014). `pnpm render:demo` merender spesimen brand + katalog × 3 brand ke `out/demo/` (~3 detik); buka PNG `-1080.png` dengan Read tool untuk menilai. Test renderer memakai Chromium 1223 di `~/Library/Caches/ms-playwright`.
- CLI teruji: Claude 2.1.302 dan Codex 0.163.0 di `~/.local/bin`. Pemanggilan keduanya sudah terverifikasi (ARCH 4.5, ADR-012, ADR-013, KNOWLEDGE); fixture di `packages/sidecar/test/fixtures/`.
- Dua gambar uji T-101 masih ada di `~/.codex/generated_images/` (milik folder Codex pemilik, tidak dihapus agent).
- Paket Claude terdeteksi Team; pemilik diminta memastikan kebijakan organisasi.
