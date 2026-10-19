# Glassmorphism dan Neumorphism (varian Kaca dan Timbul)
> Gaya "soft UI" yang meminjam bahasa material antarmuka digital untuk poster: informasi diletakkan di atas permukaan yang terasa nyata tetapi lembut. Varian **Kaca** memakai panel tembus pandang yang membuat latar di belakangnya buram, sehingga teks punya bidang tenang tanpa memutus suasana foto. Varian **Timbul** memakai bentuk yang seolah dicetak dari bahan latar, menonjol atau cekung hanya karena cahaya dan bayangan. Kesan yang dikejar: tenang, bersih, modern, dan berlapis; seperti membuka aplikasi yang tertata, bukan brosur yang berteriak. Keberhasilan gaya ini diukur dari dua hal: kedalaman yang terasa tanpa ramai, dan teks yang tetap terbaca jelas walaupun permukaannya tembus pandang atau berwarna sama dengan latar.

## 1. Asal-usul dan esensi

**Kaca (glassmorphism).**
- Pendahulunya adalah tema Aero di era Windows Vista dan Windows 7, yang memberi bingkai jendela tampilan seperti kaca.
- Microsoft menghidupkan kembali bahasa ini lewat Fluent Design System (2017). Materialnya bernama **Acrylic**, dengan resep berlapis: latar, blur, lapisan blend untuk menjaga kontras, tint warna, lalu noise halus. Panduan Microsoft menyarankan Acrylic untuk permukaan sementara (menu, panel yang muncul). Panduan itu juga melarang menumpuk beberapa lapis Acrylic dan menempatkan teks berwarna aksen di atasnya. Di Windows 11, permukaan utama beralih ke material Mica yang buram, dan Acrylic tinggal dipakai untuk permukaan sementara.
- Apple memperkenalkan macOS Big Sur pada 22 Juni 2020 dengan palet warna dan material yang diperhalus. Liputan pers saat itu mencatat translusensi yang jauh lebih banyak. Pada tahun yang sama, Michał Malewicz mempopulerkan istilah *glassmorphism*.
- Nielsen Norman Group (2024) mendefinisikannya sebagai gaya yang memakai tingkat transparansi berbeda untuk membangun kedalaman dan memisahkan latar depan dari latar belakang. Tiga alat utamanya adalah opasitas, blur latar, dan garis tepi tipis yang memberi kesan tebal kaca.
- Pada 2025 Apple memperluas bahasa ini menjadi Liquid Glass di iOS 26. NN/g (Oktober 2025) mengkritiknya karena kontrol tembus pandang di atas konten ramai menurunkan keterbacaan. Pelajaran untuk Laras: kaca hanya berhasil bila latar di belakangnya tenang dan teksnya punya kontras yang terukur.

**Timbul (neumorphism, soft UI).**
- Tren ini meledak akhir 2019 dari mockup aplikasi bank karya Alexander Plyuto di Dribbble. Namanya gabungan "new/neo" dan "skeuomorphism". Sumber berbeda pendapat soal siapa pencetus istilahnya, tetapi Malewicz sendiri menulis bahwa tanpa sengaja ia ikut memicu demamnya.
- Tekniknya: elemen berwarna sama dengan latar dan hanya terpisah lewat dua bayangan, satu gelap dan satu terang, dari arah cahaya yang konsisten. Bayangan *inset* membuat bentuk tampak cekung (ditekan).
- Tren ini surut sekitar 2021. Axess Lab (2020) dan CSS-Tricks (2020) mencatat masalah yang sama: kontras rendah, elemen yang bisa diklik tidak jelas, dan hierarki menjadi datar bila semua elemen timbul.

**Kenapa satu gaya dengan dua varian.** Keduanya sama-sama "material lembut": sudut membulat, palet rendah saturasi, kedalaman halus, dan suasana tenang. Bedanya hanya sumber kedalaman: Kaca dari transparansi, Timbul dari bayangan.

**Esensi untuk poster Laras.** Kita tidak membuat antarmuka. Kita meminjam bahasa material antarmuka sebagai wadah informasi (kartu, chip, tombol pil, ikon). Karena poster tidak bisa diklik, pertanyaan "mana yang bisa diklik" berganti menjadi "mana yang wajib dibaca". Akibatnya, setiap elemen bergaya antarmuka harus membawa makna (durasi, lokasi, harga, langkah), bukan hiasan tombol palsu.

## 2. Kapan dipakai dan kapan dihindari

**Cocok untuk**
- Jenis bisnis: klinik kecantikan dan skincare, spa dan wellness, aplikasi meditasi atau kesehatan mental, renungan dan konten rohani yang tenang, hotel, resort, travel, properti premium, fintech, aplikasi dan SaaS, gadget, asuransi, kursus online, dan podcast.
- Jenis pesan: kutipan atau renungan pendek, pengumuman acara dengan detail (tanggal, jam, lokasi), fitur produk digital, paket harga yang sederhana, langkah atau tips singkat, dan ajakan yang lembut ("Mulai hari ini", "Dengarkan episode baru").
- Audiens: dewasa muda sampai paruh baya urban yang akrab dengan aplikasi, dan audiens yang mencari ketenangan, kepercayaan, atau kesan premium.

**Hindari untuk**
- Promo agresif dan *flash sale* yang butuh energi tinggi. Kaca yang tenang meredam urgensi.
- Komunitas olahraga energi tinggi, acara musik keras, atau brand anak yang ceria multi-warna.
- F&B jalanan dan konten yang identitasnya hangat, kasar, atau bertekstur (lebih cocok gaya retro atau kolase).
- Konten padat data (tabel, jadwal panjang). Kartu kaca dengan banyak baris cepat menjadi kotak antarmuka yang membosankan.
- Varian Timbul untuk audiens lansia atau konten yang wajib terbaca di bawah sinar matahari. Kontras bawaannya rendah, jadi pakai varian Kaca atau gaya lain.

**Kapan memilih varian**

| Pertimbangan | Kaca | Timbul |
|---|---|---|
| Aset utama | Foto suasana kuat (langit, laut, interior terang, orang dalam pose tenang) | Tanpa foto, atau satu objek cut-out kecil |
| Latar | Foto utuh, atau bidang warna dengan bentuk bertepi tegas di belakang kaca | Bidang satu warna, terang atau gelap menengah |
| Pesan | Kutipan, acara, properti, travel, testimoni | Fitur aplikasi, produk kecil, langkah, angka tunggal, ajakan |
| Kesan | Lapang, udara, premium | Taktil, rapi, "perangkat" |
| Syarat Brand Kit | Ada warna terang untuk tint; radius berapa pun (ideal ≥ 16 px) | `shape.shadow = soft` **wajib**; radius ≥ 16 px; ada warna permukaan bernada menengah-terang |

Pakai satu varian per postingan. Dalam satu carousel, semua slide memakai varian yang sama.

## 3. Ciri visual kunci

Butir yang bisa dicek dari gambar (K = varian Kaca, T = varian Timbul, K/T = keduanya):
1. **K**: ada 1–2 panel semi-transparan, dan latar di belakangnya terlihat buram (detail foto hilang, warna masih terbaca).
2. **K**: tepi panel berupa garis tipis terang 1–2 px yang terlihat di seluruh keliling panel.
3. **T**: bentuk berwarna sama dengan latar dan terpisah hanya oleh pasangan bayangan: gelap di kanan bawah, terang di kiri atas (cahaya 135°, sama untuk semua bentuk).
4. **T**: ada minimal satu bentuk cekung (*inset*) atau cembung yang menjadi titik fokus. Tidak semua elemen timbul.
5. **K/T**: sudut membulat konsisten memakai `--shape-radius`; tombol, chip, dan ikon berbentuk pil atau lingkaran.
6. **K/T**: palet analog atau monokrom rendah saturasi, didominasi satu keluarga warna (misal biru langit ke biru keabuan).
7. **K/T**: tipografi sans bersih; isi bobot regular atau medium, headline bobot tebal; tidak ada huruf dekoratif.
8. **K/T**: elemen antarmuka kecil yang bermakna, seperti ikon garis di dalam tombol bulat, chip label, bilah progres, atau baris info ber-ikon.
9. **K/T**: kedalaman berlapis yang terbaca jelas, yaitu latar, lalu permukaan (kaca atau timbul), lalu teks atau subjek. Maksimal 3 lapis.
10. **K/T**: ruang kosong lapang; area tenang (langit, bidang polos) ≥ 40% kanvas.

## 4. Komposisi, grid, dan hierarki

**Grid.** Kanvas 1080 × 1350, safe margin `--space-safe` (64–80 px), 12 kolom di dalam safe margin. Panel kaca dan bentuk timbul selalu menempel pada tepi kolom:
- Panel lebar: 12 kolom (selebar area aman, ±952 px).
- Panel sedang: 8–10 kolom (±630–800 px), rata kiri atau rata kanan pada kolom 1 atau 12.
- Chip dan tombol: lebar mengikuti isi, tetapi tepi kirinya menempel pada sumbu perataan yang sama dengan teks.

**Hierarki.** Satu elemen dominan, dipilih salah satu:
- headline di dalam atau di luar panel (84–140 px), atau
- subjek foto atau objek timbul (luas 25–45% kanvas).
Elemen tingkat kedua (panel, kutipan) tingginya ≤ setengah elemen dominan secara bobot visual. Maksimal 3 ukuran huruf.

**Ruang dan kepadatan.**
- Panel kaca: luas ≤ 45% kanvas (contoh 952 × 600 px ≈ 39%). Padding dalam 48–64 px (`--space-5` sampai `--space-6` pada unit 8 px), sama di keempat sisi.
- Maksimal 2 panel kaca per slide (1 utama + 1 kecil seperti chip atau baris tombol). Tidak boleh ada kaca di atas kaca.
- Varian Timbul: maksimal 4 bentuk timbul atau cekung yang terlihat. Satu kelompok tombol ikon dihitung satu bentuk.
- Jarak antarpanel atau antarbentuk ≥ 2 × jarak bayangan timbul (lihat bagian 7), agar bayangan tidak saling bertabrakan.
- Ruang kosong ≥ 40%: area foto tenang di luar panel dan bidang polos dihitung kosong; panel dihitung elemen.

**Aturan Laras: tetap wajib / dilonggarkan (dengan batas angka)**

| Aturan | Status | Batas di gaya ini |
|---|---|---|
| P1 grid 12 kolom, maks 2 sumbu perataan | Tetap wajib | Panel, teks, dan chip berbagi sumbu kiri yang sama. Komposisi simetris tengah dihitung 1 sumbu. |
| P2 satu dominan, maks 3 ukuran huruf, headline ≥ 2× body | Tetap wajib | Pada kutipan, teks kutipan boleh menjadi dominan (44–60 px) asal body/atribusi ≤ setengahnya. |
| P3 kedekatan dan ritme spasi | Tetap wajib | Padding panel seragam; jarak antarbaris info = 1 langkah spasi yang sama. |
| P4 maks 2 keluarga huruf, baris body 30–45 karakter | Tetap wajib | Lebar teks di panel diatur supaya baris body 30–45 karakter. |
| P5 maks 3 elemen visual utama | Tetap wajib | Foto latar + panel + (subjek cut-out atau kelompok ikon). |
| P6 keseimbangan, tidak saling menutup bagian penting | Tetap wajib | Panel tidak boleh menutup wajah atau produk; subjek boleh memotong tepi panel (lihat pola 6). |
| P7 kontras ≥ 4,5:1 (≥ 3:1 untuk teks ≥ 32 px), font ≥ 24 px, safe margin | **Tidak pernah dilonggarkan** | Kontras diukur dari piksel hasil render, bukan dari warna token (bagian 6). |
| P8 fokus di titik potong grid 3×3 (±8%) | Dilonggarkan | Untuk kutipan dan objek timbul, fokus boleh di sumbu tengah x = 540 asal y berada di garis sepertiga (450 atau 900, ±108 px). Maks 1 dari 3 postingan berturut-turut memakai komposisi tengah. |
| P9 60-30-10 dari piksel | Dilonggarkan | Kaca: dominan ≥ 55%, kedua 20–35%, aksen ≤ 8%. Timbul: dominan boleh 70–85%, kedua 8–25%, aksen ≤ 6%. |
| P10 ruang kosong ≥ 35%, maks 5 elemen | Diperketat | Ruang kosong ≥ 40%; maks 5 elemen termasuk logo dan CTA. |
| P11 konsistensi | Dilonggarkan sedikit | Boleh 2 radius: `--shape-radius` untuk panel dan bulat penuh untuk pil/lingkaran (hanya bila radius brand ≥ 16 px). Satu nilai blur, satu tint, satu arah cahaya, satu keluarga ikon per postingan. |

## 5. Tipografi

**Kategori huruf**
- Paling cocok: neo-grotesk dan grotesk netral, geometric sans, serta humanist sans. Kaca yang premium (properti, hotel) juga cocok dengan serif transisional atau didone tipis untuk headline huruf besar.
- Untuk varian Timbul: rounded sans sangat cocok dengan bentuknya.
- Font aksen opsional (T-124): tidak disarankan. Gaya ini mengandalkan satu suara yang tenang.

**Skala (kanvas 1080)**

| Peran | Ukuran | Bobot | Leading | Tracking |
|---|---|---|---|---|
| Headline | 84–140 px (langkah skala 5–6) | `-weight-strong` | 1,0–1,1 | −1% s.d. −2,5% |
| Kutipan / frasa utama | 44–60 px (langkah 3–4) | regular atau medium | 1,25–1,35 | 0 s.d. −1% |
| Body / baris info | 28–36 px (langkah 1–2) | regular | 1,4–1,5 | 0 |
| Label, chip, atribusi | 24–28 px (langkah 1) | `-weight-strong` | 1,2 | 0 s.d. +4%; huruf kapital +6% s.d. +8% |

- Rasio headline:body 2,5–4:1. Kutipan:atribusi ≥ 1,6:1.
- Huruf: kalimat biasa (*sentence case*) untuk isi dan kutipan. Huruf kapital hanya untuk label pendek ≤ 3 kata atau wordmark.
- Perataan: rata kiri di dalam panel. Rata tengah hanya untuk kutipan ≤ 4 baris dan pola tengah simetris.
- Headline maksimal 3 baris, kutipan maksimal 5 baris, tanpa baris yatim.

**Perlakuan khusus**
- **Dilarang:** teks timbul atau cekung (*embossed/debossed*), yaitu teks berwarna sama dengan latar yang hanya dibentuk bayangan. Gagal kontras dan klise.
- Dilarang outline, rotasi, dan teks bertumpuk. Gaya ini tidak memakai efek tipografi; kedalaman datang dari permukaan, bukan dari huruf.
- Teks di atas kaca tidak memakai `text-shadow` sebagai pengganti kontras.
- Huruf dalam tuts keyboard timbul (pola 5) dirender HTML dengan ukuran ≥ 48 px.

**Pemetaan ke font brand.** Font `heading` untuk headline dan angka harga, font `body` untuk kutipan, isi, label, dan chip.

**Kapan "kurang cocok".** Font heading brand berupa display tebal condensed, brush, script, slab berat, atau bertekstur. Adaptasinya: headline font itu diletakkan di luar panel (langsung di atas foto atau bidang), sedangkan semua isi di dalam panel memakai font body.

## 6. Warna

**Strategi palet.** Analog atau monokrom rendah saturasi, dengan satu keluarga warna yang mendominasi. Kaca mendapat warna dari foto yang diarahkan ke nada brand. Timbul mendapat warna dari satu bidang permukaan.

**Pemetaan token**

| Peran | Kaca | Timbul |
|---|---|---|
| Dominan | Nada foto yang diselaraskan ke `primary` atau `secondary` (langit, laut, dinding) | Permukaan: `secondary` atau `neutral-light` (bukan putih murni) |
| Kedua | Tint panel: `neutral-light` (kaca terang) atau `neutral-dark`/`primary` (kaca gelap) | `primary` untuk teks, ikon, dan isi bentuk cekung |
| Teks | `neutral-dark` di kaca terang; `neutral-light` di kaca gelap | `neutral-dark` atau `primary` |
| Aksen ≤ 6–8% | `accent` hanya untuk satu CTA pil atau satu sorotan angka | Sama |

**Proporsi terhadap P9.** Lihat tabel di bagian 4. Aksen tidak pernah dipakai sebagai tint kaca dan tidak pernah sebagai warna teks di atas kaca. Microsoft mencatat kombinasi teks aksen di atas Acrylic cenderung gagal kontras.

**Aturan kontras (P7, tidak dilonggarkan)**
1. Kontras teks di atas kaca diukur dari **piksel hasil render**. Ambil warna latar efektif di area teks, yaitu 5% piksel terburuk (yang paling mirip warna teks). Syaratnya ≥ 4,5:1 untuk teks < 32 px dan ≥ 3:1 untuk teks ≥ 32 px.
2. Pasangan paling aman: teks `neutral-dark` di kaca terang. Teks putih di atas kaca terang dilarang, kecuali foto di belakangnya gelap dan hasil ukurnya lolos.
3. Algoritma penyesuaian kaca:
   - Mulai dengan tint 65% (kaca terang) atau 55% (kaca gelap) dan blur 40 px.
   - Bila gagal, naikkan tint +10% sampai maksimal 85%.
   - Bila masih gagal, geser panel ke area foto yang lebih tenang.
   - Bila tetap gagal, ganti panel menjadi padat (tint 100%). Cara ini meniru fallback "kurangi transparansi" di Apple dan Windows.
4. Teks langsung di atas foto atau langit (di luar panel) tunduk pada aturan yang sama. Teks putih di atas biru pucat (lihat referensi pemilik) hampir pasti gagal; turunkan ke area langit yang lebih gelap atau ganti warna teks.
5. Timbul: teks dan ikon memakai warna padat dengan kontras ≥ 4,5:1 terhadap permukaan. Bentuk yang membawa makna (tombol CTA, bilah progres, ikon) wajib ≥ 3:1 terhadap sekitarnya (WCAG 1.4.11). Karena itu, CTA tidak boleh hanya berupa bentuk timbul: isi dengan `accent` atau `primary`.

**Gradient**
- Gaya ini tidak membutuhkan gradient CSS. Default: tidak ada gradient.
- Kilau kaca (gradient terang 135° dari 20% ke 0% opasitas) dan permukaan cembung bergradient pada Timbul hanya boleh bila brand tidak melarang gradient. Itu pun maksimal satu elemen per postingan.
- Bila brand berisi "Tanpa gradient": latar hanya foto atau bidang datar; tidak ada kilau; tidak ada "bola warna buram" di belakang kaca. Gradasi alami di dalam foto (misal langit) bukan elemen desain dan tetap boleh. Blur yang dihasilkan kaca diperlakukan sebagai sifat material, bukan gradient desain.

## 7. Bentuk, tekstur, dan perangkat grafis

**Bentuk dan sudut.**
- Panel dan bentuk timbul memakai `--shape-radius` apa adanya. Gaya ini tidak menciptakan radius baru.
- Pil dan lingkaran (tombol, chip, ikon) memakai bulat penuh, hanya bila radius brand ≥ 16 px.
- Bila radius brand < 16 px, semua elemen bersudut sama dengan panel (lihat bagian 12).

**Resep varian Kaca** (nilai pada kanvas 1080):
- Blur latar 32–48 px di atas foto, 24–32 px di atas bidang warna. Satu nilai per postingan.
- `saturate(120–140%)` agar hasil blur tidak kusam.
- Tint: `color-mix(in srgb, var(--color-neutral-light) 65%, transparent)` untuk kaca terang, atau `neutral-dark`/`primary` 55% untuk kaca gelap. Naikkan sesuai algoritma kontras.
- Tepi: garis `min(var(--shape-stroke), 2px)` dengan warna `neutral-light` 40–60% (kaca terang) atau 20–30% (kaca gelap).
- Bayangan: `var(--shape-shadow)`; bila brand `none`, tanpa bayangan dan tepi terang yang memisahkan panel.
- Noise opsional 2–4% opasitas, untuk meredam *banding* pada blur.

**Resep varian Timbul:**
- Jarak bayangan d = 12–24 px untuk bentuk ≥ 300 px, dan 6–10 px untuk bentuk ≤ 120 px. Blur bayangan = 2 × d.
- Bayangan gelap di (+d, +d): `color-mix(in srgb, <permukaan> 82%, var(--color-neutral-dark))`.
- Bayangan terang di (−d, −d): `color-mix(in srgb, <permukaan> 35%, var(--color-neutral-light))`.
- Cekung: resep yang sama dengan `inset`.
- Cahaya selalu dari kiri atas (135°).
- Permukaan harus bernada menengah-terang. Bila `neutral-light` nyaris putih, turunkan dengan `color-mix(neutral-light 92%, primary 8%)` agar bayangan terang terlihat. Warna turunan token boleh; warna baru tidak.

**Ikon.**
- Satu keluarga ikon garis per postingan, ujung garis membulat, ketebalan garis setara `--shape-stroke` (minimal 2 px).
- Ukuran ikon 32–48 px di dalam tombol bulat 72–96 px.
- Setiap ikon harus bermakna dan sebaiknya berlabel teks: pin = lokasi, kalender = tanggal, jam = waktu, headphone = audio. Ikon "unduh" dan "bagikan" sebagai hiasan dilarang.

**Perangkat grafis**

| Perangkat | Status | Catatan |
|---|---|---|
| `Badge` (chip label padat) | Sudah ada | Dipakai untuk label kategori di dalam panel ("Renungan", "Episode 3"). |
| `Sticker` | Sudah ada, terbatas | Hanya rotasi 0°. Gaya ini tidak memakai elemen miring. |
| `Display`, `Logo`, `Image` (mono), `Frame` (duotone) | Sudah ada | `Display` hanya untuk satu kata besar di luar panel. Duotone cocok untuk menyatukan foto ke warna brand sebelum ditutup kaca. |
| **Kartu kaca** (`GlassPanel`) | Perlu dibuat | Props: tone terang/gelap, tint, blur; radius, tepi, dan bayangan dari token. Implementasi `backdrop-filter`, dengan fallback panel padat 90%. |
| **Permukaan timbul** (`SoftSurface`) | Perlu dibuat | Props: `raised`/`inset`, ukuran d; warna bayangan diturunkan dari permukaan. Hanya aktif bila `shape.shadow = soft`. |
| **Tombol ikon bulat** (`IconButton`) dan **set ikon garis** | Perlu dibuat | Set terbatas sekitar 20 ikon (pin, kalender, jam, play, headphone, panah, centang, bintang, telepon, tas, daun, hati). |
| **Tombol pil** (`PillButton`) | Perlu dibuat | Varian padat aksen (CTA) dan varian kaca (sekunder). Maksimal 2 per slide. |
| **Bilah progres** (`ProgressTrack`) | Perlu dibuat | Lintasan cekung + isi pil; untuk durasi audio atau penanda slide carousel. |
| **Tuts timbul** (`Keycap`) | Perlu dibuat | Kotak timbul berisi satu huruf HTML; maksimal 9 tuts per postingan. |
| **Grain/noise** dan **tint foto** | Perlu dibuat (dipakai bersama gaya lain) | Noise 2–4%; tint foto = lapisan warna brand 10–25% untuk menyelaraskan nada foto. |

**Konsistensi (P11).** Dalam satu postingan: satu nilai blur, satu tint, satu tebal tepi, satu arah cahaya, satu ukuran d per kelas ukuran, satu bentuk tombol, dan satu keluarga ikon.

**Catatan teknis untuk renderer.**
- `backdrop-filter` sudah Baseline 2024 dan didukung Chromium.
- Efeknya hilang bila induk panel memakai `opacity < 1`, `filter`, `mask`, atau `mix-blend-mode`, karena induk itu menjadi *backdrop root* (MDN). Panel kaca harus bersaudara langsung dengan lapisan foto.
- Blur hanya mengambil piksel tepat di belakang panel. Hasilnya tetap harus diperiksa lewat screenshot.

## 8. Foto dan ilustrasi

**Art direction varian Kaca**
- Subjek: lanskap lapang (langit, laut, kabut pegunungan), arsitektur di bawah langit bersih, orang dalam pose tenang (mata terpejam, menengadah, dilihat dari belakang memandang cakrawala), interior terang dengan cahaya jendela, atau produk dalam konteks dengan latar luas.
- Komposisi foto: 40–60% bingkai berupa area tenang bertekstur rendah, tempat panel nanti diletakkan.
- Sudut kamera: rendah (*low angle*) untuk orang, agar langit menjadi latar. Untuk lanskap, *wide shot* dengan cakrawala di garis sepertiga.
- Cahaya dan warna: siang lembut, berawan tipis, atau pagi hari; kontras rendah; warna kalem yang diarahkan ke nada brand (sebut keluarga warna di prompt, misal "soft pale blue", "muted sage"). Tingkat realisme: fotografi natural, tanpa efek dramatis.

**Art direction varian Timbul**
- Satu objek kecil bertekstur matte (lilin, botol tanpa label, cangkir, kerikil, daun, perangkat tanpa layar).
- Diminta sebagai **cut-out berlatar transparan**. Bayangan jatuh dibuat CSS agar warnanya sama persis dengan permukaan.
- Gaya objek: render 3D lembut seperti tanah liat, monokrom atau dua nada mendekati warna permukaan, cahaya dari kiri atas.

**Jenis aset.**
- Foto utuh: Kaca, pola 1–4.
- Cut-out: subjek menembus kaca (pola 6) dan objek timbul (pola 5).
- Foto konsep: satu objek di langit atau bidang tenang, dengan ruang kosong ≥ 40% untuk panel.

**Contoh frasa prompt (bahasa Inggris)**
- "calm seascape in the morning, soft pale blue sky filling the upper half of the frame, thin low clouds on the horizon, diffused light, muted desaturated colors, natural photograph"
- "person seen from behind standing on a rocky cliff, looking at a hazy blue horizon, large empty sky, soft natural daylight"
- "woman in a light linen shirt looking up toward the sky with eyes closed, low angle, clear sky background, gentle daylight, serene mood"
- "minimal spa interior lit by a large window, pale stone and linen textures, soft shadows, airy, generous empty wall area"
- "modern villa facade under a clear deep blue evening sky, wide shot, sky occupying the top 45 percent of the frame"
- "single small matte ceramic candle holder, soft clay-like 3D render, monochrome pale blue, light from the upper left, isolated on a transparent background"
- "unlabeled skincare bottle with a frosted matte surface, soft diffused light, isolated on a transparent background"

**Frasa yang dilarang di prompt gambar:**
- Antarmuka atau label gaya: "glassmorphism", "neumorphism", "UI", "app screen", "interface", "frosted glass card", "button", "icon".
- Teks dalam bentuk apa pun: "text", "letters", "typography", "label", "logo", "watermark", "keyboard keys with letters".
- Efek berlebih: "neon", "holographic", "iridescent", "rainbow gradient", "glossy chrome", "lens flare", "bokeh orbs", "abstract gradient blobs", "floating 3D shapes".

Panel kaca, tombol, ikon, dan tuts **selalu dibuat CSS**. Model gambar yang diminta menggambar kartu kaca hampir pasti mengarang teks dan UI palsu.

## 9. Pola layout feed 4:5

Koordinat mengacu kanvas 1080 × 1350. Titik potong grid 3×3: (360, 450), (720, 450), (360, 900), (720, 900).

### Pola 1: Promo produk atau harga ("Kartu Harga Kaca")
- Susunan atas ke bawah: logo kecil (kiri atas), foto produk dalam konteks yang mengisi kanvas, lalu panel kaca 10 kolom di sepertiga bawah. Panel berisi chip kategori, nama produk (headline), harga besar, satu baris keterangan, dan tombol pil aksen.
- Titik fokus: produk di (720, 450); harga di (360, 900).
- Elemen: foto, panel (isi dihitung satu), CTA, logo = 4.
- Arketipe: usulan baru `feed-kartu-kaca` (perlu dibuat); terdekat `feed-foto-konsep`.
- Versi Timbul: produk cut-out di atas "piring" cekung bulat di (540, 520), dengan harga di pil timbul di bawahnya.

### Pola 2: Edukasi atau tips ("Daftar Timbul")
- Susunan: headline 2 baris di atas (rata kiri, kolom 1–9), lalu 3 baris tips. Setiap baris berupa bentuk timbul memanjang 12 kolom, berisi tombol ikon bulat cekung, teks ≤ 40 karakter, dan nomor. Logo di kanan bawah.
- Titik fokus: headline di (360, 450); baris tips mengalir di bawahnya.
- Elemen: headline, kelompok daftar (1 grup, maks 3 butir), logo = 3.
- Arketipe: usulan baru `feed-objek-timbul` dengan opsi "daftar". Lebih dari 3 tips dipindah ke carousel.

### Pola 3: Pengumuman atau acara ("Tiket Kaca")
- Susunan: headline besar langsung di atas langit (kolom 1–10, y 160–480), foto venue atau suasana penuh, lalu panel kaca 12 kolom di bawah (y 860–1220). Panel berisi 3 baris info ber-ikon (kalender, jam, pin) dan tombol pil "Daftar". Logo di kanan atas.
- Titik fokus: headline di (360, 450); panel info di (720, 900).
- Elemen: foto, headline, panel, CTA, logo = 5.
- Arketipe: `feed-kartu-kaca` dengan opsi "headline di luar panel". Referensi akar 44 menunjukkan pin lokasi sebagai elemen info.

### Pola 4: Testimoni atau kutipan ("Kutipan Kaca")
- Susunan: foto lanskap tenang, lalu panel kaca 10 kolom rata kiri (y 300–860). Panel berisi label sumber (24–28 px), kutipan 3–5 baris (44–56 px), lalu baris atribusi dengan foto wajah cut-out dalam lingkaran 96 px, nama, dan peran. Logo di kanan bawah, di luar panel.
- Titik fokus: awal kutipan di (360, 450). Alternatif: komposisi tengah x = 540, y = 450 (P8 dilonggarkan).
- Elemen: foto, panel, avatar, logo = 4.
- Arketipe: `feed-kartu-kaca` opsi "kutipan".

### Pola 5: Ajakan atau brand awareness ("Objek Timbul")
- Susunan: bidang permukaan polos; satu bentuk timbul besar (heksagon, lingkaran, atau kotak membulat 480–560 px) di (540, 480) berisi objek cut-out, atau 3×3 tuts timbul yang mengeja kata pendek ≤ 9 huruf. Di bawahnya headline 1–2 baris (y 900–1020), lalu tombol pil aksen dan logo.
- Titik fokus: objek di (540, 450), sumbu tengah yang dilonggarkan.
- Elemen: bentuk + objek (1 grup), headline, CTA, logo = 4.
- Arketipe: usulan baru `feed-objek-timbul`; terdekat `feed-satu-objek`.

### Pola 6: Brand awareness berlapis ("Subjek Menembus Kaca")
- Susunan: foto latar langit atau bidang warna, lalu panel kaca 10 kolom di tengah bawah. Subjek cut-out (orang atau produk) berdiri di belakang panel, tetapi kepala atau bagian atasnya keluar di atas tepi panel (memotong tepi 15–30% tinggi subjek). Headline pendek ada di dalam panel, logo di luar.
- Titik fokus: wajah subjek di (720, 450); headline di (360, 900).
- Elemen: latar, subjek, panel, logo = 4. Memenuhi K3 (teks dan gambar saling mengunci).
- Arketipe: `feed-kartu-kaca` opsi "subjek tembus"; terdekat `feed-kata-raksasa` (subjek di depan teks).

### Pola 7: Fitur aplikasi atau audio ("Panel Antarmuka")
- Susunan: headline 2 baris di atas, lalu satu panel (kaca di atas foto, atau timbul di bidang). Panel berisi elemen antarmuka bermakna: bilah progres dengan durasi, tombol putar, chip fitur. Satu baris body dan logo di bawah.
- Titik fokus: panel di (720, 900); headline di (360, 450).
- Elemen: headline, panel, body, logo = 4. Pakai hanya untuk produk digital, audio, atau podcast (K8 mockup).

## 10. Carousel

**Elemen berulang di semua slide:**
- Varian yang sama.
- Posisi jangkar panel yang sama (misal tepi atas panel selalu di y = 700, ±0 px).
- Blur, tint, padding, dan radius yang sama.
- Chip penanda slide "2/6" (24–28 px) di kanan atas dalam safe margin.
- Satu keluarga ikon.

**Kesinambungan varian Kaca:**
- Gunakan satu foto panorama selebar N × 1080 px yang dipotong per slide, sehingga langit dan cakrawala menyambung saat digeser. Panel boleh melintasi batas dua slide, maksimal 1 kali per carousel, dan teks di dalamnya tidak boleh terpotong.
- Alternatif: satu foto yang sama dengan potongan berbeda, dengan nada warna dikunci lewat tint foto.

**Kesinambungan varian Timbul:**
- Permukaan yang sama di semua slide.
- Bilah progres cekung di bawah (y ≈ 1220, selebar 12 kolom); isi pil timbulnya memanjang sesuai nomor slide.

**Slide pembuka:**
- Headline terbesar (langkah 6), satu panel kecil atau chip "Geser" dengan ikon panah, dan foto paling kuat.
- Tanpa CTA.

**Slide isi:**
- Satu ide per slide; teks ≤ 25 kata per panel.
- Ukuran huruf dan posisi panel sama.

**Slide penutup:**
- Panel berisi ringkasan 1 kalimat, tombol pil aksen (CTA), dan logo.
- Pada Kaca, panel berada di potongan foto terakhir yang paling tenang.

Panjang ideal 5–7 slide. Lebih dari itu, panel yang sama terasa repetitif.

## 11. Do dan don't

**Do**
- Letakkan panel kaca di atas area foto yang paling tenang. Pilih atau minta foto dengan area itu sejak awal.
- Ukur kontras dari piksel render, lalu naikkan tint sebelum mengubah apa pun yang lain.
- Pakai teks gelap di kaca terang sebagai pilihan pertama.
- Batasi kaca menjadi 1 panel utama; sisanya chip kecil.
- Jaga satu arah cahaya untuk semua bentuk timbul; pastikan bayangan kiri atas benar-benar lebih terang daripada permukaan.
- Isi CTA dengan warna padat (`accent`) agar tetap terbaca sebagai tombol.
- Beri label teks pada ikon yang membawa informasi.
- Selaraskan nada foto ke palet brand (prompt warna, duotone, atau tint foto).

**Don't**
- Kaca di atas kaca, atau dua panel kaca saling bersentuhan tepi.
- Panel kaca di atas foto ramai (kerumunan, daun rapat, teks di foto) tanpa blur ≥ 32 px.
- Teks putih tipis di atas kaca terang atau langit pucat.
- Teks timbul atau cekung (*embossed*).
- Ukuran label < 24 px, walaupun referensi antarmuka sering memakai label mungil.
- Semua elemen dibuat timbul. Hierarki hilang dan hasilnya terlihat seperti "lumpur abu-abu".
- Tombol palsu tanpa makna (unduh, bagikan, suka) sekadar hiasan.
- Rotasi, kemiringan, atau tumpukan kartu miring.
- Bayangan ganda pada kaca sekaligus bayangan timbul pada elemen lain dalam satu postingan.

**Risiko AI-slop khas gaya ini**
- Latar gradient ungu-merah muda-biru dengan "bola warna" buram dan dua-tiga kartu kaca melayang miring (klise Dribbble 2021).
- Kartu kredit kaca, *dashboard* palsu, dan grafik dekoratif tanpa data nyata.
- Bentuk 3D abstrak mengilap (blob, bola, cincin) yang tidak berhubungan dengan pesan.
- Kilau gradient, garis tepi gradient, noise, dan bayangan tebal ditumpuk sekaligus.
- Ponsel atau UI aplikasi lengkap dengan status bar dan notch, padahal produknya bukan aplikasi.
- Neumorphism abu-abu di atas abu-abu dengan teks abu-abu: kontras gagal dan terasa seperti template generik.

## 12. Kecocokan dengan Brand Kit

**Syarat cocok, varian Kaca:**
- Palet punya minimal satu warna terang (`neutral-light` atau `secondary`) untuk tint, dan satu warna gelap (`neutral-dark`) untuk teks dengan kontras ≥ 7:1 terhadap warna terang tersebut. Cadangan ini memberi ruang saat tint dibuat semi-transparan.
- Brand memakai foto.
- `shape.radius` ideal 16–48 px.
- `shape.shadow` boleh `none` atau `soft`.

**Syarat cocok, varian Timbul:**
- `shape.shadow = soft` (wajib, karena esensinya bayangan).
- `shape.radius` ≥ 16 px.
- Ada warna permukaan bernada menengah-terang (`secondary` atau `neutral-light` yang bisa diturunkan).
- `neutral-dark` atau `primary` memberi kontras ≥ 4,5:1 di atas permukaan itu.

**Ditandai "kurang cocok untuk brand ini" bila:**
- `shape.shadow = none`: varian Timbul tidak dipakai sama sekali. Alihkan ke Kaca.
- `shape.radius` < 16 px: kedua varian kehilangan kelembutannya.
- Palet brand jenuh dan berenergi tinggi, tanpa warna terang yang kalem.
- Font heading tergolong "kurang cocok" (bagian 5).
- Aturan brand menuntut kesan keras, ramai, atau retro.

**Cara beradaptasi bila tetap dipakai:**
- **Radius 0:** pakai "Kaca bersudut". Panel bersudut tajam dengan tepi terang 1–2 px, tombol persegi (bukan pil), dan tanpa Timbul. Kesan bergeser dari lembut ke arsitektural.
- **Shadow `none`:** panel kaca tanpa bayangan; pemisah hanya tepi terang dan perbedaan tint.
- **"Tanpa gradient":** tanpa kilau, tanpa permukaan cembung bergradient, tanpa bola warna buram; latar foto atau bidang datar.
- **Palet jenuh:** pakai kaca gelap (`neutral-dark` 55–70%) di atas foto yang sudah di-duotone ke `primary`. Aksen tetap hanya untuk CTA.
- **Aturan logo** (misal "Logo selalu kanan bawah"): logo diletakkan di luar panel kaca, di posisi yang ditentukan brand, dan pola disesuaikan agar sudut itu kosong.

**Contoh dari fixture:**
- `seruni-skin` (radius 24, shadow soft, navy dan biru pucat): cocok untuk kedua varian.
- `kopi-lembayung` (radius 0, shadow none, "Tanpa gradient"): kurang cocok. Hanya bisa memakai adaptasi Kaca bersudut di atas foto kafe bercahaya alami.
- `ritme-run-club` (radius 0, warna jenuh, foto harus bergerak): kurang cocok. Sebaiknya pilih gaya lain.

## 13. Checklist QA gaya

Setiap butir dinilai ya/tidak dari PNG hasil render:
1. Postingan memakai satu varian saja (Kaca atau Timbul), dan semua slide carousel memakai varian yang sama.
2. **Kaca:** latar di belakang panel benar-benar buram (detail tidak terbaca), dan panel punya tepi terang yang terlihat di seluruh kelilingnya.
3. **Kaca:** jumlah panel kaca ≤ 2, tidak ada kaca di atas kaca, dan luas panel ≤ 45% kanvas.
4. **Timbul:** bayangan terang di kiri atas dan gelap di kanan bawah pada semua bentuk, dan bentuk tidak "hilang" ke latar.
5. Semua teks lolos kontras dari piksel render: ≥ 4,5:1 untuk < 32 px, ≥ 3:1 untuk ≥ 32 px. Termasuk teks di atas kaca dan teks langsung di atas foto.
6. Tidak ada teks di bawah 24 px, tidak ada teks timbul atau cekung, dan semua teks berada di dalam safe margin.
7. Radius konsisten: panel memakai `--shape-radius`; pil dan lingkaran hanya muncul bila radius brand ≥ 16 px.
8. Satu arah cahaya, satu nilai blur, satu tint, dan satu keluarga ikon dalam satu postingan.
9. Setiap ikon dan elemen antarmuka membawa informasi nyata (lokasi, waktu, durasi, harga, langkah); tidak ada tombol hiasan.
10. CTA (bila ada) berupa pil berisi warna padat dengan kontras teks ≥ 4,5:1, dan aksen ≤ 8% piksel.
11. Palet terasa satu keluarga warna yang tenang, foto selaras dengan nada brand, dan tidak ada gradient bila brand melarangnya.
12. Bebas klise AI-slop: tidak ada bola gradient warna-warni, kartu miring bertumpuk, blob 3D mengilap, atau UI palsu yang tidak relevan.

## 14. Referensi

**Referensi pemilik**
- `neurophism glassmorphism/718b6ca44014367e57180d0f9dd72ba2.jpg`: grid 9 postingan bertema renungan. Dari sini diambil kartu kaca membulat di atas langit dan laut, palet biru monokrom, tipografi sans bersih (kutipan regular di tengah, headline tebal rata kiri), tombol pil dan tombol ikon bulat, chip label di dalam kartu, pemutar audio sebagai elemen antarmuka, lilin dalam heksagon timbul, dan tuts keyboard timbul yang mengeja kata. Juga dicatat sebagai peringatan: beberapa label terlalu kecil dan teks putih di atas biru pucat berkontras rendah.
- Referensi akar no. 44 (`b274466eb9929d8e09123e315f356508.jpg`): foto udara properti dengan pin lokasi dan label waktu tempuh. Diambil pola baris info ber-ikon (pin) di atas foto, untuk pola 3.
- Referensi akar no. 48 (`cbb4d0b818b7f2370b7eb1d3ffa96142.jpg`): kartu pencarian semi-transparan terang di atas langit lembut, ditambah kartu rating. Diambil contoh kaca terang dengan teks gelap yang terbaca, serta kartu info sebagai elemen K8.
- Referensi akar no. 53 (`e7f1934263118933c030fd7ded2b45b8.jpg`): empat panel tembus pandang vertikal berisi foto kecil dan label, melayang di langit biru di atas bangunan. Diambil pola panel kaca berulang yang rata pada satu garis, dan headline serif kapital untuk properti premium.

**Sumber web**
- Nielsen Norman Group, "Glassmorphism: Definition and Best Practices" (Megan Brown, 2024): https://www.nngroup.com/articles/glassmorphism/
- Nielsen Norman Group, "Liquid Glass Is Cracked, and Usability Suffers in iOS 26" (Raluca Budiu, 2025): https://www.nngroup.com/articles/liquid-glass/
- MDN, `backdrop-filter`: https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter
- Microsoft Learn, "Acrylic material": https://learn.microsoft.com/en-us/windows/apps/design/style/acrylic
- Wikipedia, "Fluent Design System": https://en.wikipedia.org/wiki/Fluent_Design_System
- Apple Newsroom, "Apple introduces macOS Big Sur with a beautiful new design" (22 Juni 2020): https://www.apple.com/newsroom/2020/06/apple-introduces-macos-big-sur-with-a-beautiful-new-design/
- 9to5Mac, liputan redesign macOS Big Sur (22 Juni 2020): https://9to5mac.com/2020/06/22/apple-announces-macos-big-sur-sweeping-visual-redesign/
- Wikipedia, "Glassmorphism": https://en.wikipedia.org/wiki/Glassmorphism
- Hype4 Academy, Michał Malewicz, "Glassmorphism in user interfaces" (bagian pembuka): https://hype4.academy/articles/design/glassmorphism-in-user-interfaces
- Josh W. Comeau, "Next-level frosted glass with backdrop-filter": https://www.joshwcomeau.com/css/backdrop-filter/
- CSS-Tricks, Adrian Bece, "Neumorphism and CSS" (2020): https://css-tricks.com/neumorphism-and-css/
- Axess Lab, Hampus Sethfors, "Neumorphism – the accessible and inclusive way" (2020): https://axesslab.com/neumorphism/
- Wikipedia, "Neumorphism": https://en.wikipedia.org/wiki/Neumorphism
- W3C, Understanding WCAG 2.1 SC 1.4.3 Contrast (Minimum): https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html
- W3C, Understanding WCAG 2.1 SC 1.4.11 Non-text Contrast: https://www.w3.org/WAI/WCAG21/Understanding/non-text-contrast.html
