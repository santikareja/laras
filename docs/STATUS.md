# STATUS
Terakhir diperbarui: 2026-10-18, sesi #6

## Fase saat ini
Fase 1: Spike pipeline. Fase 0 selesai. Verifikasi CLI selesai: T-101 (generasi gambar Codex, ADR-012) dan T-102 (Claude headless dan isolasi, ADR-013). T-103 (skema Zod inti) selesai. Tidak ada task berikutnya yang memakai kuota sampai T-116.

## Sedang dikerjakan
Tidak ada.

## Berikutnya (urut)
1. T-104 Tiga brand fixture (konsep brand dan unduhan font perlu persetujuan pemilik).
2. T-105 Token brand ke CSS variables.
3. T-106 Primitives template.
4. T-107 Renderer Playwright, sharp, dan `pnpm render:demo`.

## Blocker
- Tidak ada.

## Menunggu keputusan pemilik
- T-104: persetujuan tiga konsep brand fiktif dan izin mengunduh font berlisensi terbuka (diusulkan di awal T-104).
- Penamaan token skala tipografi UI: DESIGN 4 mendefinisikan `--text-caption` … `--text-display` (ukuran), tetapi `tokens.css` di DESIGN 15 tidak memuatnya; prefix `--text-*` juga dipakai untuk warna (`--text-primary`) dan merupakan namespace ukuran font di Tailwind v4. Usulan: ganti nama token ukuran menjadi `--type-*` (dibutuhkan paling lambat E-201).

## Catatan untuk sesi berikutnya
- Baca docs/KNOWLEDGE.md sebelum task yang menyentuh CLI, build, atau lingkungan.
- `cargo` dan `pnpm dev` dijalankan lewat login shell (`/bin/zsh -lic '...'`) dari proses agent.
- Sesi agent tidak punya izin Screen Recording maupun Accessibility: cek HTML/CSS di browser bawaan (`http://localhost:1420`) atau dengan diagnostik WebView (cara di KNOWLEDGE); tampilan jendela native dilihat pemilik.
- Jendela masih kosong sesuai target Fase 0; isi UI dimulai di E-201.
- CLI teruji: Claude 2.1.302 dan Codex 0.163.0 di `~/.local/bin`. Pemanggilan keduanya sudah terverifikasi (ARCH 4.5, ADR-012, ADR-013, KNOWLEDGE); fixture di `packages/sidecar/test/fixtures/`.
- Dua gambar uji T-101 masih ada di `~/.codex/generated_images/` (milik folder Codex pemilik, tidak dihapus agent).
- Paket Claude terdeteksi Team; pemilik diminta memastikan kebijakan organisasi.
