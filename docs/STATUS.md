# STATUS
Terakhir diperbarui: 2026-10-18, sesi #4

## Fase saat ini
Fase 1: Spike pipeline. Fase 0 selesai. T-101 (verifikasi generasi gambar Codex) selesai; risiko PRD 10 "Codex tidak mendukung generasi gambar" terjawab: didukung.

## Sedang dikerjakan
Tidak ada.

## Berikutnya (urut)
1. T-102 Verifikasi Claude CLI headless (memakai kuota, butuh izin, ≤ 6 panggilan).
2. T-103 Skema Zod inti.
3. T-104 Tiga brand fixture (konsep brand dan unduhan font perlu persetujuan pemilik).
4. T-105 Token brand ke CSS variables.

## Blocker
- Tidak ada.

## Menunggu keputusan pemilik
- Izin kuota untuk T-102.
- Penamaan token skala tipografi UI: DESIGN 4 mendefinisikan `--text-caption` … `--text-display` (ukuran), tetapi `tokens.css` di DESIGN 15 tidak memuatnya; prefix `--text-*` juga dipakai untuk warna (`--text-primary`) dan merupakan namespace ukuran font di Tailwind v4. Usulan: ganti nama token ukuran menjadi `--type-*` (dibutuhkan paling lambat E-201).

## Catatan untuk sesi berikutnya
- Baca docs/KNOWLEDGE.md sebelum task yang menyentuh CLI, build, atau lingkungan.
- `cargo` dan `pnpm dev` dijalankan lewat login shell (`/bin/zsh -lic '...'`) dari proses agent.
- Sesi agent tidak punya izin Screen Recording maupun Accessibility: cek HTML/CSS di browser bawaan (`http://localhost:1420`) atau dengan diagnostik WebView (cara di KNOWLEDGE); tampilan jendela native dilihat pemilik.
- Jendela masih kosong sesuai target Fase 0; isi UI dimulai di E-201.
- CLI teruji: Claude 2.1.302 dan Codex 0.163.0 di `~/.local/bin`. Cara pakai Codex untuk gambar sudah terverifikasi (ARCH 4.5, ADR-012, KNOWLEDGE).
- Dua gambar uji T-101 masih ada di `~/.codex/generated_images/` (milik folder Codex pemilik, tidak dihapus agent).
- Paket Claude terdeteksi Team; pemilik diminta memastikan kebijakan organisasi.
