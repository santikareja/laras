# DESIGN.md: Laras

| Item | Nilai |
|---|---|
| Versi | 0.2 (draft) |
| Berlaku untuk | UI aplikasi Laras (macOS) |
| Dokumen terkait | `PRD.md`, `ARCHITECTURE.md`, `../CLAUDE.md` |
| Lokasi token di kode | `apps/desktop/src/styles/tokens.css` |

Dokumen ini mengatur tampilan dan perilaku antarmuka aplikasi Laras. Desain postingan milik brand pengguna diatur oleh `brand.json` dan `packages/templates`, bukan oleh dokumen ini. Dua sistem itu sengaja dipisah: UI Laras harus netral supaya tidak memengaruhi cara pengguna menilai warna dan komposisi desain brand di kanvas.

---

## 1. Identitas

### Nama

**Laras.** Dalam gamelan, laras adalah sistem nada yang dipakai untuk menyetel seluruh ansambel, misalnya slendro atau pelog. Kata ini juga akar dari *selaras*. Di aplikasi ini, setiap project punya larasnya sendiri, yaitu Brand Kit, dan semua postingan disetel ke laras tersebut.

Tagline: **Konten yang selaras dengan brand-mu.**

### Logo

Logo terdiri dari lima bilah horizontal bertingkat yang diambil dari bilah saron. Susunan yang sama terbaca sebagai baris teks dalam layout, sehingga satu bentuk membawa dua makna: nada yang disetel dan tata letak yang tertata.

Konstruksi (satuan = tinggi satu bilah):

| Bilah | Panjang | Tinggi | Jarak ke bilah berikutnya |
|---|---|---|---|
| 1 | 10 | 1 | 0.5 |
| 2 | 8.5 | 1 | 0.5 |
| 3 | 7 | 1 | 0.5 |
| 4 | 5.5 | 1 | 0.5 |
| 5 | 4 | 1 | |

Semua bilah rata kiri dengan radius sudut 0.25 satuan.

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 28" fill="currentColor">
  <rect x="0" y="0"  width="40" height="4" rx="1"/>
  <rect x="0" y="6"  width="34" height="4" rx="1"/>
  <rect x="0" y="12" width="28" height="4" rx="1"/>
  <rect x="0" y="18" width="22" height="4" rx="1"/>
  <rect x="0" y="24" width="16" height="4" rx="1"/>
</svg>
```

Aturan pemakaian logo:

| Aturan | Nilai |
|---|---|
| Ruang kosong minimum di sekeliling logo | 1 tinggi bilah |
| Ukuran minimum tanda (mark) | 16 px tinggi |
| Warna di latar terang | `--accent` (`#8C6420`) atau `--text-primary` |
| Warna di latar gelap | `--accent` dark (`#D9A84E`) atau `--text-primary` dark |
| Wordmark | "laras", huruf kecil, Plus Jakarta Sans Bold, tracking -2% |
| Jarak tanda ke wordmark | 1.5 tinggi bilah |

Logo tidak boleh diberi gradient, bayangan, outline, atau diputar. Urutan dan panjang bilah tidak boleh diubah.

### Ikon aplikasi

Bentuk squircle standar macOS dengan latar `#24272A`. Lima bilah perunggu `#D9A84E` diletakkan di tengah optik, menempati 56% lebar ikon. Tanpa tekstur, kilau, atau efek 3D. Sediakan versi 16, 32, 64, 128, 256, 512, dan 1024 px; versi 16 dan 32 px memakai tiga bilah saja agar tetap terbaca.

---

## 2. Prinsip

1. **Kanvas memimpin.** Chrome aplikasi memakai netral dingin dan aksen yang hemat. Desain brand di kanvas harus selalu menjadi hal paling berwarna di layar.
2. **Hanya satu elemen khas.** Bilah Laras (bagian 10.5) adalah satu-satunya elemen yang boleh menarik perhatian tanpa diminta. Elemen lain tenang.
3. **Struktur membawa informasi.** Garis, nomor, label, dan badge hanya muncul bila menyampaikan sesuatu yang dibutuhkan pengguna.
4. **Native Mac.** Ikuti light/dark mode sistem, posisi traffic lights, shortcut standar, dan pengaturan aksesibilitas macOS.
5. **Pengguna yang memutuskan.** UI tidak pernah menerapkan perubahan besar tanpa memperlihatkan hasilnya dan menyediakan jalan kembali.

---

## 3. Warna

### Token

| Token | Light | Dark | Pemakaian |
|---|---|---|---|
| `--surface-app` | `#F3F5F6` | `#1C1E20` | Latar jendela |
| `--surface-panel` | `#FFFFFF` | `#24272A` | Sidebar, inspector, dialog |
| `--surface-raised` | `#FFFFFF` | `#2C3033` | Popover, menu, toast |
| `--surface-canvas` | `#E4E8EA` | `#141618` | Area di belakang preview desain |
| `--surface-hover` | `#EBEEF0` | `#2F3336` | Hover item list dan tombol ghost |
| `--surface-selected` | `#F1E8D8` | `#3A3226` | Item terpilih di sidebar dan list |
| `--border` | `#D9DEE1` | `#34383C` | Pemisah panel dan baris |
| `--border-strong` | `#848D94` | `#6B747B` | Border input dan kontrol (kontras ≥ 3:1) |
| `--text-primary` | `#1F2326` | `#ECEFF1` | Teks utama |
| `--text-secondary` | `#5B636A` | `#A3ABB2` | Teks pendukung, ikon |
| `--text-disabled` | `#9AA2A8` | `#5F676D` | Kontrol nonaktif |
| `--accent` | `#8C6420` | `#D9A84E` | Tombol utama, fokus, Bilah Laras |
| `--accent-hover` | `#7A5619` | `#E4B866` | Hover tombol utama |
| `--accent-on` | `#FFFFFF` | `#1C1E20` | Teks dan ikon di atas aksen |
| `--success` | `#2F7D4F` | `#5BBE84` | QA lolos |
| `--warning` | `#A15C00` | `#E5A33B` | Menunggu kuota, QA perlu dicek |
| `--danger` | `#B3261E` | `#F2867E` | Gagal, hapus |
| `--danger-on` | `#FFFFFF` | `#1C1E20` | Teks dan ikon di atas `--danger` |

Kontras yang sudah dihitung: semua token teks (kecuali `--text-disabled`) dan status di atas `--surface-panel` dan `--surface-app` minimal 4.5:1. `--text-disabled` sengaja lebih rendah (sekitar 2.4–2.9:1) karena kontrol nonaktif dikecualikan WCAG 1.4.3. `--border-strong` minimal 3:1 terhadap panel dan app. Teks di atas `--accent` dan `--danger` memakai `--accent-on` dan `--danger-on` (minimal 5.3:1 di kedua mode).

### Aturan

- Aksen dipakai untuk satu tombol utama per area, ring fokus, status terpilih, dan Bilah Laras. Aksen tidak dipakai sebagai latar area yang luas.
- `--surface-canvas` selalu netral. Jangan memberi warna, pola, atau tekstur di area kanvas.
- Warna status selalu disertai ikon dan teks. Informasi tidak boleh disampaikan oleh warna saja.
- Tidak ada warna di luar token. Nilai hex langsung di komponen dianggap bug dan ditolak oleh lint.

---

## 4. Tipografi

### Font

| Peran | Font | Sumber |
|---|---|---|
| Semua teks UI | SF Pro, lewat `system-ui` | Bawaan macOS |
| Wordmark, judul halaman kosong, layar pembuka | Plus Jakarta Sans | Dibundel lokal di aplikasi (lisensi SIL OFL), tidak dimuat dari internet |
| Log job, path file, potongan perintah | SF Mono, lewat `ui-monospace` | Bawaan macOS |

Plus Jakarta Sans dirancang oleh Tokotype untuk identitas kota Jakarta. Font ini dipakai terbatas pada momen identitas dan tidak pernah untuk teks UI biasa.

### Skala

| Token | Ukuran | Line height | Bobot | Pemakaian |
|---|---|---|---|---|
| `--text-caption` | 11 px | 14 px | 400 | Keterangan, metadata |
| `--text-label` | 12 px | 16 px | 500 | Label field, header kolom |
| `--text-body` | 13 px | 18 px | 400 | Teks default |
| `--text-body-strong` | 13 px | 18 px | 600 | Penekanan di dalam teks |
| `--text-panel-title` | 15 px | 20 px | 600 | Judul panel dan dialog |
| `--text-section` | 17 px | 22 px | 600 | Judul bagian halaman |
| `--text-page` | 22 px | 28 px | 600 | Judul halaman |
| `--text-display` | 28 px | 34 px | 700 | Judul halaman kosong (Plus Jakarta Sans) |

### Aturan

- Sentence case untuk semua teks: judul, tombol, menu, label.
- Tidak ada label huruf kapital semua, termasuk label kecil di atas judul.
- Tidak ada penekanan satu kata dengan warna atau gaya berbeda di dalam judul.
- Angka di tabel, ukuran, dan durasi memakai `font-variant-numeric: tabular-nums`.
- Panjang baris teks paragraf maksimal 72 karakter.
- Monospace hanya untuk konten yang memang teknis.

---

## 5. Spacing dan Ukuran

### Skala spacing (dasar 4 px)

| Token | Nilai |
|---|---|
| `--space-1` | 4 px |
| `--space-2` | 8 px |
| `--space-3` | 12 px |
| `--space-4` | 16 px |
| `--space-5` | 24 px |
| `--space-6` | 32 px |
| `--space-7` | 48 px |

### Ukuran tetap

| Elemen | Nilai |
|---|---|
| Jendela minimum | 1100 × 700 px |
| Toolbar | tinggi 44 px, padding kiri 80 px untuk traffic lights (`titleBarStyle: overlay`) |
| Sidebar kiri | 240 px, dapat disembunyikan |
| Inspector kanan | 320 px, dapat disembunyikan |
| Status bar bawah (Bilah Laras) | tinggi 36 px |
| Tinggi kontrol default | 28 px |
| Tinggi kontrol besar (tombol utama di brief) | 32 px |
| Target klik minimum | 24 × 24 px |

Di bawah lebar jendela 1280 px, inspector berubah menjadi panel overlay yang dibuka dengan ⌘⌥\.

---

## 6. Layout Halaman

### Studio

Halaman tempat brief ditulis, varian dibandingkan, dan revisi dilakukan.

```
┌───────────┬────────────────────────────────────┬──────────────┐
│ ● ● ●     │ Brief: Promo akhir pekan…  [Buat]  │              │
├───────────┼────────────────────────────────────┤  Inspector   │
│ Project   │                                    │  Copy        │
│ Kopi A    │      ┌──────────┐   ┌──┐┌──┐┌──┐   │  Caption     │
│ Butik B   │      │          │   │1 ││2 ││3 │   │  QA          │
│           │      │ Preview  │   └──┘└──┘└──┘   │  Versi       │
│ Konten    │      │   4:5    │                  │ ──────────── │
│ Brand Kit │      └──────────┘                  │  Revisi      │
│ Knowledge │                                    │  [ketik…]    │
│ Copy Guide│                                    │              │
│ Referensi │                                    │              │
├───────────┴────────────────────────────────────┴──────────────┤
│ ▮▮▮▮▯▯  Render slide 2 dari 5                                 │
└───────────────────────────────────────────────────────────────┘
```

- Sidebar workspace project berisi Konten, Brand Kit, Knowledge, Copy Guide, dan Referensi.
- Preview utama berada di tengah kanvas dengan ukuran sebesar mungkin tanpa melebihi 100% skala asli.
- Thumbnail varian di sebelah kanan preview, tersusun vertikal bila jendela sempit.
- Carousel menampilkan strip slide horizontal di bawah preview. Slide aktif ditandai garis aksen 2 px.
- Revisi via chat berada di bagian bawah inspector. Pesan ditampilkan sebagai daftar biasa (nama pengirim dan teks), bukan gelembung chat.

### Daftar project

Grid kartu project berisi nama, tanda warna primer brand, dan tanggal konten terakhir. Kartu project adalah satu-satunya tempat warna brand muncul di luar kanvas.

### Brand Kit

Dua kolom. Form di kiri (logo, warna, tipografi, bentuk, aturan), preview hidup di kanan yang menampilkan contoh judul, paragraf, tombol CTA, dan palet memakai token brand. Preview diperbarui setiap kali field berubah.

### Library

Grid thumbnail 4:5 dengan filter status di toolbar dan kolom pencarian. Klik thumbnail membuka konten di Studio.

### Perataan

Semua konten rata kiri. Pengecualian: halaman kosong dan dialog konfirmasi pendek rata tengah.

---

## 7. Bentuk dan Kedalaman

| Token | Nilai | Pemakaian |
|---|---|---|
| `--radius-control` | 6 px | Tombol, input, select, badge |
| `--radius-float` | 10 px | Popover, menu, dialog, toast |
| `--radius-card` | 8 px | Kartu project, thumbnail library |
| Preview desain | 0 px | Tepi postingan harus terlihat apa adanya |
| `--shadow-float` | `0 8px 24px rgba(16, 18, 20, 0.16), 0 1px 2px rgba(16, 18, 20, 0.08)` | Hanya elemen yang mengambang |

Panel, sidebar, dan inspector dipisahkan dengan garis `--border` 1 px tanpa bayangan. Preview desain di kanvas memakai bayangan `--shadow-float` agar terpisah dari latar kanvas.

---

## 8. Ikon

- Library: Lucide (sudah ada di stack).
- Ukuran 16 px di toolbar, list, dan tombol. 20 px di halaman kosong.
- Stroke 1.5 px, warna `--text-secondary`. Ikon di tombol utama memakai `--accent-on`.
- Ikon tanpa label wajib punya tooltip dan `aria-label`.
- Tidak ada emoji di UI.

---

## 9. Gerak

| Token | Nilai |
|---|---|
| `--dur-fast` | 120 ms |
| `--dur-base` | 180 ms |
| `--dur-slow` | 240 ms |
| `--dur-pulse` | 1200 ms |
| `--ease-out` | `cubic-bezier(0.2, 0, 0, 1)` |
| `--ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` |

Gerak yang diizinkan:

| Situasi | Gerak |
|---|---|
| Panel sidebar dan inspector dibuka atau ditutup | Geser lebar, `--dur-base`, `--ease-out` |
| Dialog dan popover muncul | Opacity dan skala 0.98 ke 1, `--dur-fast` |
| Varian dipilih | Garis aksen muncul, `--dur-fast` |
| Toast | Masuk dari bawah 8 px, `--dur-base`; hilang otomatis setelah 4 detik |
| Bilah Laras aktif | Denyut opacity 0.45 ke 1, `--dur-pulse`, `--ease-in-out`, berulang |

Tidak ada animasi masuk saat halaman dimuat, efek hover yang bergerak, atau parallax. Bila *Reduce Motion* aktif di macOS, semua gerak diganti perubahan instan dan Bilah Laras aktif ditampilkan solid tanpa denyut. Animasi berulang seperti denyut Bilah Laras wajib dimatikan dengan `animation: none` di bawah `prefers-reduced-motion: reduce`, tidak cukup mengandalkan durasi 0.

---

## 10. Komponen

### 10.1 Tombol

| Varian | Latar | Teks | Border | Pemakaian |
|---|---|---|---|---|
| Utama | `--accent` | `--accent-on` | | Satu per area: Buat, Ekspor, Simpan |
| Sekunder | `--surface-panel` | `--text-primary` | `--border-strong` | Aksi pendamping |
| Ghost | transparan | `--text-primary` | | Aksi toolbar, aksi di dalam list |
| Bahaya | `--danger` | `--danger-on` | | Hanya di dialog konfirmasi hapus |

Tinggi 28 px (default) atau 32 px (besar). Padding horizontal 12 px, jarak ikon ke teks 6 px. Label tombol berupa kata kerja yang menyebut hasilnya, tanpa tanda panah di belakang.

### 10.2 Input

Tinggi 28 px, border `--border-strong`, radius `--radius-control`, padding horizontal 8 px. Saat fokus, border berganti `--accent` ditambah ring fokus. Pesan error muncul di bawah field dengan `--danger` dan ikon.

Field brief adalah textarea yang tumbuh otomatis dari 1 sampai 4 baris, dengan tombol "Buat" di kanannya.

### 10.3 Kartu varian

Thumbnail 4:5 dengan radius 0. Di sudut kanan bawah ada badge QA kecil: ikon centang dan teks "Lolos" (`--success`), atau ikon peringatan dan teks "Perlu dicek" (`--warning`). Varian terpilih diberi garis luar `--accent` 2 px. Nomor varian (1, 2, 3) tampil karena memang dipakai untuk shortcut ⌘1 sampai ⌘4.

### 10.4 Item sidebar

Tinggi 28 px, padding kiri 12 px, ikon 16 px. Hover memakai `--surface-hover`, terpilih memakai `--surface-selected` dan teks `--text-primary` bobot 500.

### 10.5 Bilah Laras

Indikator progres agent dan satu-satunya elemen khas aplikasi.

Struktur: enam bilah untuk enam tahap pipeline, diikuti teks status.

| Tahap | Label |
|---|---|
| 1 | Rencana |
| 2 | Copy |
| 3 | Layout |
| 4 | Aset |
| 5 | Render |
| 6 | QA |

Ukuran:

| Konteks | Bilah | Jarak | Radius |
|---|---|---|---|
| Status bar | 20 × 4 px | 4 px | 2 px |
| Kartu varian (saat sedang dibuat) | 12 × 3 px | 3 px | 1.5 px |

State:

| State | Tampilan |
|---|---|
| Menunggu | Isi `--border` |
| Berjalan | Isi `--accent` dengan denyut (bagian 9) |
| Selesai | Isi `--accent` solid |
| Dilewati (misalnya tidak butuh aset) | Outline putus-putus `--border-strong` |
| Gagal | Isi `--danger`, teks status menjelaskan error dan tombol "Ulangi dari sini" |
| Menunggu kuota | Bilah yang tertahan berisi `--warning`, teks "Menunggu kuota. Dilanjutkan otomatis pukul 14.20" |

Saat QA memicu revisi, bilah dari tahap tempat revisi masuk ulang (Copy, Layout, atau Aset; lihat ARCHITECTURE 5.1) sampai QA kembali ke state Menunggu lalu berjalan lagi, dan teks status menulis "Revisi 1 dari 2: memperbaiki kontras CTA".

Hover pada satu bilah menampilkan tooltip berisi nama tahap dan durasinya. Klik membuka log tahap tersebut di inspector.

Aksesibilitas: teks status berada di region `aria-live="polite"`. Setiap bilah punya `aria-label`, misalnya "Render, sedang berjalan".

### 10.6 Toast

Muncul di kanan bawah di atas status bar. Isi: ikon status, satu kalimat, dan maksimal satu aksi ("Buka folder", "Urungkan"). Toast error tidak hilang otomatis.

### 10.7 Dialog

Lebar 440 px. Judul `--text-panel-title`, isi maksimal tiga kalimat, tombol di kanan bawah dengan aksi utama paling kanan. Esc menutup dialog, ↵ menjalankan aksi utama kecuali pada dialog hapus.

### 10.8 Halaman kosong

Ikon 20 px, judul `--text-display` (Plus Jakarta Sans), satu kalimat penjelasan, satu tombol utama. Rata tengah di area konten.

---

## 11. Penulisan UI

### Suara

Lugas dan tenang, seperti rekan kerja yang paham pekerjaannya. Bahasa Indonesia baku yang santai, memakai sapaan "kamu" hanya bila perlu dan tidak pernah "Anda" bercampur "kamu" di layar yang sama. Kalimat aktif dan pendek.

### Nama aksi (dipakai konsisten di seluruh alur)

| Aksi | Tombol | Konfirmasi atau toast |
|---|---|---|
| Membuat varian dari brief | Buat | "3 varian dibuat" |
| Merevisi lewat chat | Kirim revisi | "Versi 4 disimpan" |
| Mengekspor | Ekspor | "Diekspor ke Unduhan/kopi-a" |
| Memeriksa status CLI | Periksa ulang | "Claude CLI dan Codex CLI siap" |
| Melanjutkan job yang tertahan | Lanjutkan | "Job dilanjutkan dari tahap Render" |
| Mengulang tahap gagal | Ulangi dari sini | |
| Memulihkan versi lama | Pulihkan versi ini | "Versi 2 dipulihkan sebagai versi 5" |

### Pesan error

Rumus: apa yang terjadi, lalu cara memperbaikinya. Tanpa permintaan maaf, tanpa "Ups".

| Hindari | Gunakan |
|---|---|
| "Ups! Terjadi kesalahan." | "Codex CLI belum login. Jalankan `codex login` di Terminal, lalu pilih Periksa ulang." |
| "Gagal memuat font." | "Font BrandDisplay-Bold.woff2 tidak bisa dibaca. Unggah ulang file font di Brand Kit." |
| "Kuota habis, coba lagi nanti." | "Kuota Claude habis. Job dijeda dan dilanjutkan otomatis pukul 14.20." |

### Halaman kosong

Ajak bertindak dengan menyebut langkah berikutnya.

| Halaman | Judul | Penjelasan | Tombol |
|---|---|---|---|
| Daftar project | Belum ada project | Satu project untuk satu brand atau akun media sosial. | Buat project |
| Konten | Belum ada konten di Kopi A | Tulis brief pertama untuk membuat tiga varian. | Tulis brief |
| Referensi | Belum ada referensi visual | Unggah postingan yang kamu suka supaya agent memahami selera brand ini. | Unggah gambar |

### Kata yang tidak dipakai di UI

"Ajaib", "canggih", "revolusioner", "mulus", "solusi", "maksimalkan", "tingkatkan produktivitas", "dengan mudah", "hanya dalam beberapa klik", "Ups", dan tanda seru di teks biasa.

---

## 12. Aksesibilitas

- Kontras teks minimal 4.5:1, kontrol dan ikon fungsional minimal 3:1.
- Ring fokus: 2 px `--accent` dengan offset 2 px, selalu terlihat saat navigasi keyboard (`:focus-visible`).
- Semua aksi utama bisa dijalankan dengan keyboard.
- Semua kontrol punya label yang terbaca VoiceOver.
- Ikuti pengaturan macOS: light/dark mode, *Reduce Motion*, dan *Increase Contrast* (saat aktif, `--border` memakai nilai `--border-strong`).
- Target klik minimal 24 × 24 px.

---

## 13. Shortcut

| Shortcut | Aksi |
|---|---|
| ⌘N | Project baru |
| ⌘↵ | Buat varian dari brief |
| ⌘E | Ekspor |
| ⌘K | Command palette |
| ⌘1 sampai ⌘4 | Pilih varian |
| ⌘Z / ⇧⌘Z | Urungkan / ulangi (standar macOS, termasuk saat mengedit teks) |
| ⌘[ / ⌘] | Versi sebelumnya / berikutnya |
| ⌘\ | Tampilkan atau sembunyikan sidebar |
| ⌘⌥\ | Tampilkan atau sembunyikan inspector |
| ⌘, | Pengaturan |

Shortcut ditampilkan di tooltip dan di menu bar aplikasi.

---

## 14. Larangan

Pola berikut membuat UI terlihat seperti template generik dan tidak boleh dipakai di Laras:

| Larangan | Alasan |
|---|---|
| Gradient sebagai dekorasi | Menambah noise dan bersaing dengan warna desain di kanvas |
| Efek kaca (blur tembus pandang) di panel | Membuat warna di belakang panel memengaruhi penilaian warna |
| Konten dipotong menjadi kartu identik dengan radius dan bayangan yang sama | Menghapus hierarki |
| Label kecil huruf kapital di atas setiap judul | Hiasan tanpa informasi |
| Satu kata di judul diberi warna atau miring berbeda | Kebiasaan template, bukan keputusan |
| Tanda panah di belakang teks tombol atau link | Tidak menambah makna |
| Metadata yang disambung titik tengah ("A · B · C") | Sulit dibaca, gunakan kolom atau baris terpisah |
| Monospace untuk label kecil yang bukan data teknis | Kesan "teknis" yang dibuat-buat |
| Latar krem dengan aksen terakota, atau latar hitam dengan satu aksen neon | Dua arah visual paling umum pada desain buatan AI |
| Animasi masuk di setiap bagian, hover yang bergerak di setiap kartu | Gerak tanpa alasan |
| Ilustrasi atau maskot di halaman kosong | Mengalihkan dari aksi berikutnya |
| Emoji di teks UI | Tidak sesuai suara Laras |

---

## 15. Token di Kode

`apps/desktop/src/styles/tokens.css`:

```css
:root {
  color-scheme: light dark;

  --surface-app: #F3F5F6;
  --surface-panel: #FFFFFF;
  --surface-raised: #FFFFFF;
  --surface-canvas: #E4E8EA;
  --surface-hover: #EBEEF0;
  --surface-selected: #F1E8D8;
  --border: #D9DEE1;
  --border-strong: #848D94;
  --text-primary: #1F2326;
  --text-secondary: #5B636A;
  --text-disabled: #9AA2A8;
  --accent: #8C6420;
  --accent-hover: #7A5619;
  --accent-on: #FFFFFF;
  --success: #2F7D4F;
  --warning: #A15C00;
  --danger: #B3261E;
  --danger-on: #FFFFFF;

  --font-ui: system-ui, -apple-system, "SF Pro Text", sans-serif;
  --font-brand: "Plus Jakarta Sans", system-ui, sans-serif;
  --font-mono: ui-monospace, "SF Mono", Menlo, monospace;

  --space-1: 4px;  --space-2: 8px;  --space-3: 12px; --space-4: 16px;
  --space-5: 24px; --space-6: 32px; --space-7: 48px;

  --radius-control: 6px;
  --radius-card: 8px;
  --radius-float: 10px;
  --shadow-float: 0 8px 24px rgba(16, 18, 20, 0.16), 0 1px 2px rgba(16, 18, 20, 0.08);

  --dur-fast: 120ms;
  --dur-base: 180ms;
  --dur-slow: 240ms;
  --dur-pulse: 1200ms;
  --ease-out: cubic-bezier(0.2, 0, 0, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
}

@media (prefers-color-scheme: dark) {
  :root {
    --surface-app: #1C1E20;
    --surface-panel: #24272A;
    --surface-raised: #2C3033;
    --surface-canvas: #141618;
    --surface-hover: #2F3336;
    --surface-selected: #3A3226;
    --border: #34383C;
    --border-strong: #6B747B;
    --text-primary: #ECEFF1;
    --text-secondary: #A3ABB2;
    --text-disabled: #5F676D;
    --accent: #D9A84E;
    --accent-hover: #E4B866;
    --accent-on: #1C1E20;
    --success: #5BBE84;
    --warning: #E5A33B;
    --danger: #F2867E;
    --danger-on: #1C1E20;
    --shadow-float: 0 8px 24px rgba(0, 0, 0, 0.45), 0 1px 2px rgba(0, 0, 0, 0.3);
  }
}

@media (prefers-contrast: more) {
  :root { --border: var(--border-strong); }
}

@media (prefers-reduced-motion: reduce) {
  :root { --dur-fast: 0ms; --dur-base: 0ms; --dur-slow: 0ms; --dur-pulse: 0ms; }
}
```

### Tailwind v4 dan shadcn/ui

Tailwind v4 dikonfigurasi di CSS, tanpa `tailwind.config.ts` (ARCHITECTURE ADR-010). File CSS utama mengimpor `tokens.css`, lalu memetakan nama warna dan radius Tailwind ke token di atas dengan `@theme inline`. Blok variabel bawaan shadcn/ui (`--background`, `--primary`, dan seterusnya di `:root`) tidak dipakai; satu-satunya sumber nilai adalah `tokens.css`.

Nama `accent` di shadcn/ui berarti latar hover menu dan tombol ghost, bukan warna aksi utama. Karena itu warna aksen Laras dipetakan ke `primary`, dan `accent` milik shadcn dipetakan ke `--surface-hover`. Di kelas Tailwind, aksen Laras dipakai lewat `primary` (misalnya `bg-primary`), bukan `bg-accent`.

| Nama warna Tailwind/shadcn | Token |
|---|---|
| `background` | `--surface-app` |
| `foreground` | `--text-primary` |
| `card` / `card-foreground` | `--surface-panel` / `--text-primary` |
| `popover` / `popover-foreground` | `--surface-raised` / `--text-primary` |
| `primary` / `primary-foreground` | `--accent` / `--accent-on` |
| `secondary` / `secondary-foreground` | `--surface-panel` / `--text-primary` |
| `muted` / `muted-foreground` | `--surface-hover` / `--text-secondary` |
| `accent` / `accent-foreground` | `--surface-hover` / `--text-primary` |
| `destructive` / `destructive-foreground` | `--danger` / `--danger-on` |
| `border` | `--border` |
| `input` | `--border-strong` |
| `ring` | `--accent` |

Radius: `--radius-md` → `--radius-control`, `--radius-lg` → `--radius-card`, `--radius-xl` → `--radius-float`. Komponen shadcn/ui disesuaikan agar memakai kelas radius sesuai bagian 7 (kontrol `rounded-md`, kartu `rounded-lg`, popover, menu, dialog, dan toast `rounded-xl`).

Spacing: skala dasar Tailwind v4 sudah 4 px, jadi `--space-1` sampai `--space-7` setara kelas `1, 2, 3, 4, 6, 8, 12`. Jangan memakai nilai di luar skala itu.

Komponen tidak boleh memakai kelas warna bawaan Tailwind seperti `bg-blue-500`.

### Isolasi dari token brand

Token di bagian ini hanya berlaku di jendela aplikasi. Template postingan memakai token brand (`--color-*`, `--font-*`, `--space-*`, `--shape-*`; lihat ARCHITECTURE 6.1) dan selalu dirender di `<iframe>` (preview) atau page Playwright terpisah, sehingga nama yang sama seperti `--space-1` tidak saling menimpa. `--font-brand` di sini berarti font identitas Laras (Plus Jakarta Sans), bukan font brand pengguna.

---

## 16. Checklist Review UI

Jalankan sebelum menyatakan perubahan UI selesai:

- [ ] Semua warna, radius, spacing, dan durasi berasal dari token.
- [ ] Tampilan sudah dicek di light mode dan dark mode.
- [ ] Hanya ada satu tombol utama per area.
- [ ] Semua aksi bisa dijalankan dengan keyboard dan ring fokus terlihat.
- [ ] Teks memakai sentence case dan nama aksi sesuai tabel di bagian 11.
- [ ] Pesan error menyebut penyebab dan cara memperbaikinya.
- [ ] Tidak ada pola dari bagian 14.
- [ ] Screenshot halaman sudah dilihat dan dinilai sebelum dilaporkan selesai.
