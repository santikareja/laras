# CLAUDE.md — Laras

Aplikasi desktop macOS (Tauri 2 + React/TypeScript) untuk membuat postingan Instagram/Facebook berkualitas desainer. Agent AI berjalan lewat Claude CLI (copy, layout, QA) dan Codex CLI (aset gambar) memakai subscription pengguna. Pemakaian pribadi, local-first, tanpa server.

Dokumen acuan (baca bagian yang relevan sebelum mengerjakan fitur, jangan baca seluruhnya setiap sesi):
- `docs/PRD.md` — apa yang dibangun, user stories, acceptance criteria
- `docs/ARCHITECTURE.md` — bagaimana dibangun, kontrak, pipeline, ADR
- `docs/DESIGN.md` — tampilan, token UI, dan penulisan UI
- `docs/TASKS.md` — backlog dan urutan kerja
- `docs/STATUS.md` — posisi project saat ini
- `docs/KNOWLEDGE.md` — fakta terverifikasi: versi tool, flag CLI, gotcha
- `docs/SESSION_LOG.md` — riwayat sesi

## Protokol Sesi (wajib)

Sumber kebenaran:
- docs/PRD.md: apa yang dibangun.
- docs/ARCHITECTURE.md: bagaimana dibangun.
- docs/DESIGN.md: tampilan dan penulisan UI.
- docs/TASKS.md: urutan kerja.
- docs/STATUS.md: posisi saat ini.
- docs/KNOWLEDGE.md: fakta terverifikasi.
Bila dua sumber bertentangan, berhenti dan tanyakan ke pemilik.

Awal sesi:
1. Baca docs/STATUS.md, lalu task terkait di docs/TASKS.md.
2. Baca hanya bagian dokumen yang dirujuk task. Baca docs/KNOWLEDGE.md bila
   task menyentuh CLI, build, atau lingkungan.
3. Sampaikan rencana singkat dan tunggu persetujuan sebelum menulis kode.

Selama sesi:
- Ubah status task menjadi [~] saat mulai dikerjakan.
- Fakta baru yang terverifikasi (flag CLI, perilaku library, gotcha) langsung
  ditulis ke docs/KNOWLEDGE.md.
- Keputusan arsitektur ditulis sebagai ADR di docs/ARCHITECTURE.md.
- Perubahan perilaku produk wajib disetujui pemilik, lalu ditulis ke docs/PRD.md.
- Pekerjaan baru yang ditemukan ditambahkan ke docs/TASKS.md sebagai task baru,
  tidak langsung dikerjakan kecuali kecil dan masih dalam cakupan task saat ini.

Akhir setiap task:
1. Jalankan verifikasi task, ditambah pnpm typecheck, pnpm lint, pnpm test
   (bila sudah tersedia). Untuk perubahan UI atau template, lihat screenshot hasilnya.
2. Tandai [x] hanya bila semua verifikasi lolos. Bila tidak, tetap [~] atau [!]
   dengan catatan penyebab.
3. Commit dengan pesan deskriptif.

Akhir sesi, atau saat konteks percakapan mulai panjang:
1. Perbarui docs/STATUS.md.
2. Tambahkan entri di docs/SESSION_LOG.md.
3. Commit: "docs: update status sesi #N".

Larangan:
- Menebak saat ragu. Tanyakan.
- Menandai task selesai tanpa verifikasi.
- Menghapus isi TASKS.md atau SESSION_LOG.md.
- Memakai kuota subscription (claude -p, codex exec, pnpm test:live, pnpm spike)
  tanpa izin pemilik.

## Struktur

- `apps/desktop/src` — React UI (fitur di `features/`, klien RPC di `lib/rpc.ts`, token UI di `styles/tokens.css`)
- `apps/desktop/src-tauri` — Tauri 2 (Rust minimal, jangan taruh logika bisnis di sini)
- `packages/shared` — skema Zod & tipe: RPC, BrandKit, LayoutSpec, Job, QA
- `packages/sidecar` — orkestrasi: queue, pipeline, adapter CLI, renderer, storage
- `packages/templates` — template JSX feed/carousel, primitives, token → CSS variables
- `scripts/spike` — skrip pipeline tanpa UI (Fase 1)
- `fixtures/brands` — 3 brand contoh untuk test dan demo
- `docs/` — dokumen acuan dan file kerja (lihat daftar di atas)
- `.claude/commands/` — slash command `/lanjut` (awal sesi) dan `/selesai` (akhir sesi)

## Perintah

```bash
pnpm install
pnpm dev            # jalankan aplikasi (Vite + Tauri + sidecar watch)
pnpm test           # unit test (Vitest), tanpa memanggil CLI asli
pnpm test:visual    # visual regression template (Playwright Test)
pnpm test:live      # test yang memanggil CLI asli — MEMAKAI KUOTA, jalankan hanya bila diminta
pnpm lint           # Biome + lint token template
pnpm typecheck
pnpm render:demo    # render semua template × brand fixture ke ./out/demo
pnpm spike -- --brand <slug> --brief "<teks>"   # pipeline penuh tanpa UI
```

Verifikasi sebelum menandai task selesai: lihat Protokol Sesi, bagian "Akhir setiap task".

## Aturan Wajib

### Arsitektur
- Semua data yang melintasi UI ↔ sidecar ↔ CLI harus didefinisikan dulu di `packages/shared` (skema Zod), baru dipakai di kedua sisi.
- Jangan memanggil `claude` atau `codex` di luar `packages/sidecar/src/cli/`. Semua lewat adapter.
- stdout sidecar khusus JSON-RPC. Log ke stderr atau file log, jangan `console.log` ke stdout.
- Setiap tahap pipeline menyimpan output ke folder job agar bisa di-resume. Jangan buat tahap yang hanya menyimpan hasil di memori.
- Path dari output AI wajib divalidasi berada di dalam folder job sebelum dibaca/ditulis.

### Desain dan Template (anti AI-slop)
- Teks di gambar SELALU dirender HTML/CSS. Jangan pernah meminta model gambar membuat teks, huruf, logo, atau watermark.
- Template hanya boleh memakai CSS variables dari token (`--color-*`, `--font-*`, `--space-*`). Tanpa warna/font hard-coded.
- Setiap template wajib mengekspor `meta` (id, format, slot + batas karakter, opsi) dan komponen render.
- Ukuran dasar 1080 × 1350 (4:5), render `deviceScaleFactor: 2`. Safe margin default 64 px. Font minimum 24 px.
- Setelah membuat atau mengubah template: jalankan `pnpm render:demo`, buka PNG hasilnya dengan Read tool, dan periksa sendiri hierarki, keterbacaan, dan keseimbangan sebelum melapor selesai.

### Prompt Agent
- Prompt runtime disimpan sebagai file `.md` di `packages/sidecar/src/prompts/`, bukan string panjang di kode.
- Setiap prompt yang mengharapkan JSON harus menyebutkan skemanya dan memberi satu contoh output valid.
- Input pengguna (brief, knowledge) selalu dibungkus delimiter dan ditandai sebagai data, bukan instruksi.

### Kode
- TypeScript strict. Hindari `any`; gunakan tipe dari skema Zod (`z.infer`).
- Komponen UI memakai shadcn/ui dan Tailwind v4. Tampilan dan teks UI mengikuti `docs/DESIGN.md` (token dan pemetaan bagian 15, nama aksi bagian 11, checklist bagian 16). Teks UI dalam Bahasa Indonesia.
- Fungsi kecil dan fokus. Satu fitur per folder di `features/`.
- Tambahkan test untuk logika pipeline, parsing CLI, dan QA deterministik setiap kali mengubahnya.
- Jangan menambah dependency baru tanpa menyebutkan alasannya di ringkasan perubahan.

## Hal yang Mudah Salah

- Aplikasi GUI macOS tidak mewarisi PATH terminal. Deteksi CLI lewat `cli/resolvePath.ts`, jangan asumsikan `claude` ada di PATH proses. Hal yang sama berlaku untuk `node` saat menjalankan sidecar (ADR-008).
- Flag Claude CLI dan Codex CLI dapat berubah. Cek `docs/KNOWLEDGE.md` dan `--help` sebelum mengubah pemanggilan.
- Renderer harus menunggu `document.fonts.ready` dan semua gambar termuat sebelum screenshot.
- `CLAUDE.md` dan `AGENTS.md` di dalam folder project brand dibuat otomatis oleh `sidecar/src/context/`. Jangan edit manual, dan jangan bingung dengan file `CLAUDE.md` ini (milik repo).
- Kuota subscription dipakai bersama antara pengembangan dan runtime (lihat Larangan di Protokol Sesi).

## Cara Bekerja

Pelengkap Protokol Sesi:
1. Kerjakan sebagai irisan vertikal: skema di `shared` → sidecar → UI → test.
2. Commit kecil dan sering dengan pesan deskriptif bergaya conventional commit (`feat(brand-kit): ...`, `fix(renderer): ...`, `docs: ...`, `chore: ...`).
