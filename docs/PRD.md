# PRD — Laras

| Item | Nilai |
|---|---|
| Versi dokumen | 0.2 (draft) |
| Status | Disusun sebelum Fase 0 dimulai |
| Pemilik | Pemilik produk (pengguna tunggal) |
| Platform | macOS 14+ (Apple Silicon diutamakan) |
| Dokumen terkait | `ARCHITECTURE.md`, `DESIGN.md`, `../CLAUDE.md` |

---

## 1. Ringkasan

Laras adalah aplikasi desktop macOS untuk membuat postingan media sosial (Instagram dan Facebook) berkualitas setara desainer grafis profesional. Aplikasi ini menjalankan agent AI melalui **Claude CLI** (model Opus 5.5) dan **Codex CLI** (generasi gambar) memakai subscription milik pengguna sendiri.

Setiap brand atau akun media sosial dikelola sebagai **project** terpisah yang memiliki knowledge sendiri: brand guideline, informasi bisnis, panduan copywriting, dan referensi visual. Knowledge ini menjadi acuan wajib bagi semua agent.

### Problem statement

Membuat konten media sosial berkualitas tinggi untuk beberapa brand sekaligus membutuhkan waktu lama dan keahlian desain. Tool AI yang ada cenderung menghasilkan desain generik ("AI-slop"): teks di gambar berantakan, warna dan font tidak sesuai brand, dan gaya tidak konsisten antar postingan.

### Solusi inti

Memisahkan pekerjaan sesuai kekuatan masing-masing alat:

- **Claude** sebagai copywriter, art director, dan quality reviewer.
- **Codex (model gambar)** hanya untuk aset visual tanpa teks (foto, ilustrasi, background).
- **Renderer HTML/CSS (Playwright)** untuk tipografi, layout, dan elemen brand yang presisi.
- **Loop QA** otomatis yang memeriksa hasil render sebelum ditampilkan ke pengguna.

---

## 2. Pengguna dan Konteks

**Pengguna:** satu orang (pemilik aplikasi) yang mengelola lebih dari satu akun media sosial.

**Konteks penggunaan:**

- Aplikasi dipakai **pribadi**, di Mac milik pengguna, dengan subscription Claude dan ChatGPT/Codex milik pengguna.
- Tidak ada akun pengguna, login aplikasi, server, atau distribusi ke pihak lain.
- Semua data disimpan lokal.
- Claude CLI dan Codex CLI sudah terinstal dan sudah login di Mac pengguna.

**Batasan yang harus dihormati:**

- Kuota subscription terbatas (rate limit), dan kuota yang sama juga dipakai saat mengembangkan aplikasi dengan Claude Code.
- Aplikasi tidak boleh dirancang untuk dipakai orang lain dengan login subscription mereka. Bila suatu hari ingin didistribusikan, integrasi AI harus diganti ke API key (lihat bagian Risiko).

---

## 3. Tujuan dan Kriteria Sukses

### Tujuan

1. Menghasilkan postingan yang layak publikasi dengan intervensi manual seminimal mungkin.
2. Menjaga konsistensi brand di setiap project.
3. Mempercepat produksi konten untuk beberapa akun sekaligus.

### Kriteria sukses (diukur setelah MVP selesai)

| Metrik | Target |
|---|---|
| Postingan yang siap publikasi tanpa edit besar (dari varian terbaik) | ≥ 70% |
| Waktu dari brief sampai PNG final (feed tunggal) | ≤ 5 menit |
| Waktu dari brief sampai PNG final (carousel 5 slide) | ≤ 12 menit |
| Kesalahan ejaan atau teks rusak di dalam gambar | 0 (karena teks dirender HTML) |
| Hasil yang lolos checklist QA deterministik (kontras, overflow, margin aman) | 100% sebelum ditampilkan |
| Penggunaan font dan warna di luar Brand Kit | 0 |
| Resolusi master export | 2160 × 2700 px (4:5 @2x) |

Cara ukur: aplikasi mencatat setiap job (durasi, jumlah revisi, varian yang dipilih, apakah pengguna mengedit manual) di database lokal, sehingga metrik di atas bisa dihitung.

---

## 4. Prinsip Produk (Anti AI-Slop)

Prinsip ini mengikat semua keputusan desain dan implementasi.

1. **Teks tidak pernah dibuat oleh model gambar.** Semua headline, body, CTA, harga, dan logo dirender lewat HTML/CSS dengan font asli brand.
2. **Brand Kit adalah hukum.** Agent hanya boleh memakai warna, font, dan aturan dari Brand Kit project. Pelanggaran dianggap bug.
3. **Komposisi dikurasi, bukan diimprovisasi.** Layout berasal dari arketipe komposisi yang dirancang dengan grid dan hierarki yang jelas. Agent memilih arketipe dan parameternya (posisi, rotasi, skala, urutan lapisan, perangkat grafis) sehingga struktur berganti antar postingan, tetapi tidak menggambar dari nol (ADR-015).
4. **Selalu diperiksa sebelum ditampilkan.** Setiap render melewati QA deterministik (kode) dan QA visual (Claude melihat gambar).
5. **Pengguna memegang keputusan akhir.** Selalu ada beberapa varian, revisi via chat, dan editor manual.
6. **Transparan.** Pengguna selalu melihat agent sedang mengerjakan apa.
7. **Standar visual kelas dunia, bukan sekadar rapi.** Hasil dinilai dengan kriteria berikut, diturunkan dari referensi pemilik setelah gerbang Fase 1 gagal (T-117, T-120):
   - K1. Satu ide besar per postingan: metafora visual atau momen yang langsung membawa pesan, bukan foto suasana ditambah teks penjelas.
   - K2. Tipografi sebagai elemen visual utama: headline besar, kontras skala yang tegas, dan campuran gaya huruf dari Brand Kit.
   - K3. Teks dan gambar saling mengunci: teks di belakang subjek, subjek menimpa huruf, atau teks mengikuti bidang dan perspektif foto, bukan teks di kotak terpisah.
   - K4. Subjek terpisah (cut-out) di atas bidang warna brand bila cocok, bukan selalu foto penuh dengan panel.
   - K5. Perangkat grafis khas brand yang berulang, misalnya blok sorot di balik kata, coretan tangan, panah, stiker, atau sobekan kertas.
   - K6. Komposisi berganti antar postingan dalam satu sistem: posisi, orientasi, dan hierarki berubah; palet, tipografi, dan perangkat grafis tetap.
   - K7. Teks hemat: satu pesan utama, teks pendukung kecil, CTA berupa baris atau chip kecil.
   - K8. Elemen informasi visual bila relevan, misalnya pin lokasi dengan waktu tempuh, chip fitur, kartu rating, atau mockup ponsel.
8. **Aturan brand dan prinsip desain umum wajib dipatuhi setiap komposisi.** Aturan di Brand Kit (misalnya posisi logo, batas elemen visual, larangan gradient) berlaku di semua arketipe dan gaya. Prinsip desain umum (disetujui pemilik, T-122):
   - P1. Grid dan perataan: semua blok menempel ke grid 12 kolom di dalam safe margin, maksimal dua sumbu perataan per postingan.
   - P2. Hierarki: tepat satu elemen dominan, elemen tingkat kedua maksimal setengah ukurannya, maksimal tiga ukuran huruf, headline minimal dua kali ukuran body; urutan baca fokus → headline → CTA.
   - P3. Kedekatan dan ritme: elemen yang berhubungan dikelompokkan dengan jarak token yang sama, tanpa celah kosong mati di antara grup.
   - P4. Tipografi: maksimal dua keluarga huruf, tanpa baris yatim (baris terakhir minimal dua kata), baris body 30–45 karakter, tanda baca tidak terpisah dari katanya.
   - P5. Anggaran elemen visual: maksimal tiga elemen visual utama, atau batas brand bila lebih ketat; jumlah total elemen dibatasi P10.
   - P6. Keseimbangan: berat visual seimbang, subjek dan teks tidak saling menutup bagian penting.
   - P7. Kontras dan keterbacaan sesuai QA deterministik (F9).
   - P8. Rule of thirds: titik fokus utama (wajah, produk, atau kata utama) berada dalam ±8% dari salah satu titik potong grid 3×3; elemen kedua di titik seberang secara diagonal.
   - P9. 60-30-10, diukur dari piksel render yang dipetakan ke warna Brand Kit: warna dominan ≥ 55%, warna kedua beserta gambar 20–35%, aksen ≤ 12%. Aksen hanya untuk CTA dan sorotan, tidak untuk bidang besar.
   - P10. Ruang kosong: minimal 35% kanvas kosong (warna dominan tanpa elemen), maksimal lima elemen per postingan termasuk logo dan CTA.
   - P11. Konsistensi: satu jarak tepi, satu radius, satu gaya tombol atau stiker, satu keluarga dekorasi, dan satu sudut kemiringan per postingan.

   P2 dan P8–P11 diturunkan dari aturan desain pemilik (2026-10-19: hierarki visual, rule of thirds, 60-30-10, ruang kosong, konsistensi). Referensi yang paling memenuhi aturan ini (nomor 11, 13, 18, 20, 38, 40, 50, 51, 52, 56) menjadi standar default; gaya padat ala kolase disimpan untuk gaya Scrapbook/Digital Collage (F16).

---

## 5. Cakupan MVP

### Format konten

| Format | Ukuran dasar (CSS px) | Master export | Export upload |
|---|---|---|---|
| Feed 4:5 (Instagram & Facebook) | 1080 × 1350 | 2160 × 2700 PNG | 1080 × 1350 PNG/JPG |
| Carousel 4:5 | 1080 × 1350 per slide | 2160 × 2700 per slide | 1080 × 1350 per slide |

- Carousel default 2–10 slide (Instagram mendukung hingga 20; batas atas dapat dikonfigurasi).
- Export upload berukuran 1080 px lebar karena itulah resolusi tampilan Instagram. Mengunggah ukuran pas mengurangi kompresi ulang oleh platform.

### Di luar cakupan MVP

Story/Reels 9:16, format 1:1, video, auto-posting, dan analitik (lihat bagian 9).

---

## 6. User Stories

Prioritas: **P0** wajib untuk MVP, **P1** sangat diinginkan (masuk MVP bila waktu cukup), **P2** setelah MVP.

### Project dan Knowledge

| ID | Prioritas | User story |
|---|---|---|
| US-01 | P0 | Sebagai pengguna, saya ingin membuat, mengganti nama, mengarsipkan, dan berpindah antar project, agar setiap brand terkelola terpisah. |
| US-02 | P0 | Sebagai pengguna, saya ingin mengisi Brand Kit (logo, warna, font, spacing, aturan dan larangan desain), agar semua desain mengikuti identitas brand. |
| US-03 | P0 | Sebagai pengguna, saya ingin menulis knowledge bisnis (produk, harga, audiens, USP, kompetitor, FAQ), agar copy akurat dan relevan. |
| US-04 | P0 | Sebagai pengguna, saya ingin menulis panduan copywriting (tone of voice, contoh benar/salah, kata terlarang, gaya CTA, aturan emoji dan hashtag), agar copy terdengar seperti brand. |
| US-05 | P0 | Sebagai pengguna, saya ingin mengunggah referensi visual dan memberi catatan singkat per gambar, agar agent memahami selera desain brand. |
| US-06 | P1 | Sebagai pengguna, saya ingin menduplikasi project sebagai titik awal brand baru. |

### Pembuatan Konten

| ID | Prioritas | User story |
|---|---|---|
| US-10 | P0 | Sebagai pengguna, saya ingin menulis brief singkat (satu sampai beberapa kalimat) dan memilih format (feed atau carousel), lalu menekan Buat. |
| US-11 | P0 | Sebagai pengguna, saya ingin menerima 3 varian (dapat diatur 1–4) dari satu brief, agar bisa memilih yang terbaik. |
| US-12 | P0 | Sebagai pengguna, saya ingin melihat progres setiap tahap agent secara real-time. |
| US-13 | P0 | Sebagai pengguna, saya ingin mendapatkan caption lengkap (dengan hashtag dan CTA) yang terpisah dari teks di gambar. |
| US-14 | P0 | Sebagai pengguna, saya ingin membuat carousel dengan alur cerita antar slide yang konsisten secara visual. |
| US-15 | P1 | Sebagai pengguna, saya ingin melampirkan foto milik sendiri (misalnya foto produk) untuk dipakai di desain, bukan gambar buatan AI. |
| US-16 | P1 | Sebagai pengguna, saya ingin memilih template tertentu secara manual, atau menyerahkan pilihan ke agent. |
| US-17 | P1 | Sebagai pengguna, saya ingin memilih gaya desain (misalnya Gaya Swiss, Bauhaus, Pop Art) sebagai default project dan menggantinya per brief, setelah melihat contoh setiap gaya yang memakai brand saya. |

### Revisi dan Editing

| ID | Prioritas | User story |
|---|---|---|
| US-20 | P0 | Sebagai pengguna, saya ingin merevisi desain lewat chat (misalnya "headline lebih besar", "ganti foto jadi outdoor"). |
| US-21 | P0 | Sebagai pengguna, saya ingin mengedit teks di desain secara langsung tanpa memanggil agent. |
| US-22 | P0 | Sebagai pengguna, saya ingin kembali ke versi sebelumnya kapan saja. |
| US-23 | P1 | Sebagai pengguna, saya ingin menggeser posisi dan mengganti gambar secara manual. |
| US-24 | P1 | Sebagai pengguna, saya ingin me-regenerate satu bagian saja (copy saja, aset gambar saja, atau satu slide saja). |

### Output dan Library

| ID | Prioritas | User story |
|---|---|---|
| US-30 | P0 | Sebagai pengguna, saya ingin mengekspor postingan sebagai PNG master dan PNG/JPG siap unggah. |
| US-31 | P0 | Sebagai pengguna, saya ingin mengekspor carousel sekaligus dalam satu folder dengan nama file berurutan. |
| US-32 | P0 | Sebagai pengguna, saya ingin melihat dan mencari semua konten dalam satu project. |
| US-33 | P1 | Sebagai pengguna, saya ingin menyalin caption dengan satu klik. |
| US-34 | P1 | Sebagai pengguna, saya ingin menandai status konten (draft, siap, sudah diposting). |

### Sistem

| ID | Prioritas | User story |
|---|---|---|
| US-40 | P0 | Sebagai pengguna, saya ingin aplikasi mendeteksi apakah Claude CLI dan Codex CLI terinstal dan sudah login, dengan petunjuk yang jelas bila belum. |
| US-41 | P0 | Sebagai pengguna, saya ingin diberi tahu dengan jelas saat kuota subscription habis, dan job otomatis dilanjutkan atau bisa dilanjutkan nanti. |
| US-42 | P0 | Sebagai pengguna, saya ingin job yang gagal bisa diulang tanpa kehilangan hasil tahap sebelumnya. |
| US-43 | P1 | Sebagai pengguna, saya ingin melihat log detail sebuah job untuk keperluan debugging. |

---

## 7. Kebutuhan Fungsional

Setiap modul mencantumkan kriteria penerimaan (acceptance criteria, AC) yang harus terpenuhi.

### F1. Manajemen Project

- Project disimpan sebagai folder di `~/Library/Application Support/Laras/projects/<slug>/` plus metadata di database.
- AC: membuat project baru menghasilkan struktur folder standar dan file konteks agent (`CLAUDE.md`, `AGENTS.md`) yang otomatis dibuat dari Brand Kit dan knowledge.
- AC: berpindah project tidak pernah mencampur knowledge, template, atau konten.

### F2. Brand Kit

Isi minimum:

- Logo: varian utama, varian terang, varian gelap, ikon (SVG atau PNG transparan).
- Warna: primer, sekunder, aksen, netral (terang dan gelap), dengan aturan pemakaian.
- Tipografi: font heading dan body (file font lokal: OTF/TTF/WOFF2), bobot yang diizinkan, skala ukuran.
- Bentuk: radius sudut, gaya garis, gaya bayangan: tanpa bayangan (`none`) atau bayangan lembut (`soft`).
- Aturan dan larangan desain dalam teks bebas (misalnya "jangan pakai gradient", "logo selalu kanan bawah").

AC:
- Brand Kit disimpan sebagai design token (`brand.json`) dan dapat diubah lewat form di UI.
- Font yang diunggah divalidasi (bisa dibaca dan memuat glyph Latin dasar).
- Preview langsung: contoh tipografi dan palet tampil saat Brand Kit diedit.

### F3. Knowledge Bisnis

- Editor markdown untuk `knowledge/business.md` dan file tambahan bebas.
- AC: semua file knowledge otomatis tercantum di konteks agent tanpa langkah manual.

### F4. Panduan Copywriting

- Editor terstruktur: tone of voice, contoh copy benar dan salah, kata terlarang, gaya CTA, aturan emoji, aturan hashtag, bahasa default.
- AC: agent QA memeriksa copy terhadap kata terlarang dan aturan emoji/hashtag secara deterministik (kode), bukan hanya lewat penilaian AI.

### F5. Referensi Visual

- Unggah gambar plus catatan per gambar ("suka komposisinya", "warna terlalu ramai").
- AC: maksimal 20 referensi aktif per project agar konteks agent tetap fokus.

### F6. Brief

- Input: teks brief, format (feed atau carousel), jumlah slide (carousel), jumlah varian, template (opsional), aset milik pengguna (opsional).
- AC: brief kosong atau terlalu pendek (< 5 kata) memunculkan saran perbaikan sebelum job dimulai.

### F7. Pipeline Generasi

Urutan tahap per varian:

1. **Plan:** menafsirkan brief menjadi pesan utama, angle, dan struktur slide.
2. **Copy:** menulis teks di gambar (headline, sub, body, CTA) dan caption.
3. **Layout:** memilih template dan mengisi slot-nya menjadi Layout Spec (JSON).
4. **Assets:** membuat aset gambar via Codex bila dibutuhkan, atau memakai aset milik pengguna.
5. **Render:** menghasilkan PNG lewat Playwright.
6. **QA:** pemeriksaan deterministik dan visual.
7. **Revise:** perbaikan otomatis bila QA gagal (maksimal 2 putaran), lalu render ulang.

AC:
- Setiap tahap menyimpan output-nya, sehingga kegagalan di tahap N bisa diulang mulai dari tahap N.
- Output Claude yang tidak valid secara skema diulang maksimal 2 kali sebelum job ditandai gagal.
- Varian berbeda harus berbeda secara bermakna (angle, template, atau komposisi), bukan sekadar beda warna.

### F8. Carousel

- AC: semua slide memakai sistem visual yang sama (grid, font, warna, posisi elemen berulang seperti nomor slide atau logo).
- AC: slide pertama berfungsi sebagai hook, slide terakhir memuat CTA (kecuali brief meminta lain).
- AC: teks tidak boleh terpotong di tepi antar slide kecuali sebagai efek desain yang disengaja di template.

### F9. Agent QA

**QA deterministik (kode, wajib lolos):**
- Rasio kontras teks terhadap latar ≥ 4.5:1 (teks body) dan ≥ 3:1 (teks besar ≥ 32 px).
- Tidak ada teks yang overflow atau terpotong.
- Semua elemen penting berada di dalam safe margin (default 64 px dari tepi pada ukuran dasar).
- Ukuran font minimum 24 px pada ukuran dasar 1080 px.
- Hanya font dan warna dari Brand Kit yang dipakai.
- Tidak ada kata terlarang dari panduan copywriting.
- Semua font dan gambar termuat sempurna (tidak ada fallback font atau gambar rusak).

**QA visual (Claude melihat PNG):**
- Penilaian hierarki, keseimbangan komposisi, keterbacaan, kesesuaian dengan referensi, dan kesan "profesional vs generik".
- Output berupa skor 1–10 per aspek plus daftar perbaikan konkret. Setiap perbaikan bertingkat `wajib` (postingan belum layak terbit, misalnya informasi berulang, fakta keliru, teks sulit dibaca, logo tidak terlihat) atau `saran` (peningkatan selera).
- Ambang lolos default: skor rata-rata ≥ 8, tidak ada aspek < 7, dan tidak ada perbaikan wajib. Saran tetap disimpan di laporan QA.

AC: varian yang gagal QA setelah 2 putaran revisi tetap ditampilkan, dengan label peringatan dan daftar masalahnya.

### F10. Revisi via Chat

- Panel chat per konten. Instruksi diterapkan ke versi yang sedang dibuka dan menghasilkan versi baru.
- AC: revisi hanya mengubah bagian yang diminta. Misalnya, permintaan mengubah headline tidak boleh mengubah aset gambar.

### F11. Editor Manual

- P0: edit teks langsung di preview.
- P1: geser posisi elemen, ganti gambar, ubah ukuran teks dalam batas skala tipografi brand.
- AC: perubahan manual menghasilkan versi baru dan tetap melewati QA deterministik.

### F12. Versi

- Setiap generasi, revisi, dan edit manual menghasilkan versi baru yang tidak menimpa versi lama.
- AC: pengguna bisa membandingkan dua versi berdampingan dan memulihkan versi mana pun.

### F13. Library dan Export

- Grid semua konten per project, dengan filter status dan pencarian (brief, caption, teks di gambar).
- Export: PNG master @2x, PNG/JPG upload 1080 px, profil warna sRGB, nama file `<project>-<tanggal>-<judul>-<nomor-slide>.png`.
- AC: export carousel menghasilkan satu folder berisi semua slide berurutan dan `caption.txt`.

### F14. Integrasi CLI

- Deteksi lokasi `claude` dan `codex` (termasuk PATH dari login shell, karena aplikasi GUI macOS tidak mewarisi PATH terminal).
- Pemeriksaan versi dan status login saat aplikasi dibuka, dengan tombol "Periksa ulang".
- Pengaturan manual path CLI bila deteksi otomatis gagal.

### F15. Antrean dan Rate Limit

- Antrean job dengan konkurensi default 1 per CLI (dapat diatur).
- Deteksi pesan batas kuota dari output CLI, lalu job dijeda dengan status "Menunggu kuota" dan dapat dilanjutkan.
- AC: menutup aplikasi saat ada job berjalan memunculkan konfirmasi; job yang terputus dapat dilanjutkan dari tahap terakhir yang selesai.

### F16. Gaya Desain

- Pengguna memilih gaya desain sebagai default project dan dapat menggantinya per brief (keputusan pemilik, T-122).
- Gaya mengatur arketipe komposisi yang dipakai beserta parameternya, perangkat grafis, serta perlakuan tipografi dan foto, di dalam token dan aturan Brand Kit.
- Brand Kit menang: unsur gaya yang bertentangan dengan Brand Kit tidak dipakai, dan gaya yang ciri utamanya bertentangan (misalnya butuh gradient pada brand yang melarang gradient) ditandai "kurang cocok untuk brand ini".
- Pratinjau: setiap gaya punya contoh tampilan yang dirender dengan brand dan foto contoh project pengguna, tanpa memakai kuota bila fotonya sudah ada.
- Tahap 1 (tujuh gaya, sesuai folder referensi pemilik, keputusan 2026-10-19): Brutalisme, Corporate Clean, Cyberpunk/Futuristik, Flat Design, Minimalism, Glassmorphism/Neumorphism (satu gaya dengan dua varian), Vintage/Retro.
- Tahap 2 (enam belas gaya): Gaya Swiss, Bauhaus, Pop Art, Scrapbook/Digital Collage, Imperfect & Hand-drawn Aesthetics (Notes App Chic), Modernisme, Art Deco, Art Nouveau, Psychedelic, Y2K Nostalgia, Anti-Design, Maksimalisme, Retro-Futurisme, Immersive 3D & Spatial Design, Chaos Packaging, Neo-Minimalisme.
- Setiap gaya punya folder di `packages/templates/styles/<id>/` berisi `PANDUAN.md` (panduan lengkap untuk generate desain: komposisi, tipografi, warna, perangkat grafis, foto, pola layout untuk berbagai jenis konten, do dan don't, kecocokan Brand Kit, checklist QA) dan definisi mesin `style.ts`. Panduan bersifat umum untuk semua jenis konten, bukan satu desain khusus.
- AC: pengguna melihat pratinjau setiap gaya dengan brand-nya sebelum memilih; hasil generasi memakai gaya yang dipilih; QA visual menilai kesesuaian dengan gaya selain K1–K8 dan P1–P7.

---

## 8. Kebutuhan Non-Fungsional

| Area | Kebutuhan |
|---|---|
| Platform | macOS 14 Sonoma atau lebih baru. Apple Silicon wajib didukung, Intel opsional. |
| Performa UI | Aplikasi terbuka < 3 detik. Navigasi antar halaman < 200 ms. UI tidak pernah freeze saat job berjalan. |
| Performa render | Render satu slide (setelah aset siap) < 3 detik. |
| Privasi | Semua data lokal. Tidak ada telemetri. Satu-satunya data yang keluar adalah konteks yang dikirim lewat Claude CLI dan Codex CLI. |
| Keandalan | Crash sidecar tidak membuat aplikasi tertutup; sidecar otomatis dijalankan ulang. Tidak ada kehilangan data saat crash. |
| Backup | Folder project dapat disalin, di-backup, atau dimasukkan ke Git tanpa ekspor khusus. |
| Aksesibilitas UI | Navigasi keyboard untuk aksi utama. Mendukung light dan dark mode macOS. |
| Bahasa UI | Bahasa Indonesia. Bahasa konten mengikuti pengaturan per project. |

---

## 9. Di Luar Cakupan

### Setelah MVP (P2)

- Format Story/Reels cover 9:16 dan 1:1.
- Kalender konten dan content pillars.
- Batch generation (satu minggu konten dari daftar brief).
- Preview feed grid.
- Belajar dari pilihan dan penolakan varian.
- Ekstraksi Brand Kit otomatis dari website atau akun Instagram.
- Riset tren dan kompetitor.
- Copy multi-bahasa.
- Ekspor ke Figma atau file berlapis.

### Tidak akan dibuat (P3)

- Multi-pengguna, login aplikasi, atau kolaborasi tim.
- Distribusi aplikasi ke pihak lain.
- Integrasi API key berbayar (hanya relevan bila distribusi dipertimbangkan ulang).
- Video dan animasi.
- Auto-posting dan analitik (memerlukan Meta Graph API dan akun bisnis; dipertimbangkan ulang setelah MVP stabil).
- Server atau sinkronisasi cloud.

---

## 10. Risiko dan Mitigasi

| Risiko | Dampak | Mitigasi | Sinyal dini |
|---|---|---|---|
| Kualitas desain belum setara desainer | Tinggi | Fase 1 (spike) adalah gerbang go/no-go. Investasi besar di library template dan checklist QA. | Skor QA visual rata-rata < 7 di spike. |
| Codex CLI tidak mendukung generasi gambar seperti yang diharapkan, atau flag-nya berubah | Tinggi | Verifikasi di awal Fase 1. Adapter aset dibuat terpisah agar sumber gambar bisa diganti (foto pengguna, stok foto lokal). | Spike aset gagal. |
| Kuota subscription cepat habis | Sedang | Konkurensi 1, cache hasil tahap, revisi parsial (bukan generate ulang semua), jumlah varian bisa dikurangi. | Job sering berstatus "Menunggu kuota". |
| Output Claude tidak konsisten secara format | Sedang | Skema Zod ketat, instruksi output JSON, retry terbatas, contoh output di prompt. | Tingkat retry > 20%. |
| Perubahan perilaku atau flag CLI setelah update | Sedang | Semua pemanggilan CLI lewat satu adapter per CLI, dengan test kontrak. Catat versi CLI yang teruji. | Test kontrak gagal setelah update CLI. |
| Ketentuan layanan subscription | Sedang | Hanya penggunaan pribadi via CLI resmi. Distribusi berarti wajib migrasi ke API key. | Rencana untuk membagikan aplikasi. |
| Bundling Playwright dan sharp di aplikasi desktop | Sedang | MVP memakai Node.js yang terinstal di Mac (pemakaian pribadi). Packaging penuh ditunda. | — |

---

## 11. Milestone

| Fase | Isi | Kriteria selesai |
|---|---|---|
| 0. Fondasi | PRD, arsitektur, `CLAUDE.md`, setup monorepo | Dokumen disetujui, `pnpm dev` membuka jendela kosong. |
| 1. Spike pipeline | Script tanpa UI: brief → copy → layout → aset → render → QA | 3 brand × 3 brief menghasilkan PNG yang menurut pengguna layak publikasi pada ≥ 6 dari 9 percobaan. |
| 2. Walking skeleton | Tauri + UI minimal + sidecar + satu tombol Buat | Menekan Buat di UI menghasilkan PNG dengan progres real-time. |
| 3. Irisan vertikal | Fitur P0 satu per satu (urutan: Project & Brand Kit → Knowledge & Copy Guide → Brief & varian → Revisi chat → QA di UI → Editor teks → Library & export → Carousel) | Semua AC P0 terpenuhi. |
| 4. Polish | Penanganan error, rate limit, UX detail, build `.dmg` | Kriteria sukses di bagian 3 terukur dan tercapai. |

---

## 12. Pertanyaan Terbuka

1. ~~Nama final aplikasi.~~ Terjawab: **Laras** (lihat `DESIGN.md` bagian 1).
2. ~~Bahasa konten default per project: Indonesia, English, atau campuran?~~ Terjawab (2026-10-18): bahasa konten ditetapkan per project di copy guide, `id` atau `en`. Campuran belum didukung.
3. Berapa jumlah template awal yang dibutuhkan per format? (Usulan: 8 template feed, 4 sistem carousel.)
4. Apakah perlu library aset lokal (foto stok milik sendiri) sebagai alternatif aset AI?
5. Ambang skor QA visual yang tepat. Perlu dikalibrasi selama Fase 1.
