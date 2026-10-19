# Vintage/Retro
> Desain baru yang memakai bahasa visual media cetak lama (iklan majalah, poster acara, sampul album dari era 1950-an sampai 1990-an) dengan disiplin komposisi masa kini. Kesannya hangat, akrab, percaya diri, dan "punya cerita": warna hangat yang sedikit pudar, huruf display berkarakter, tekstur cetak yang halus (grain, halftone, registrasi meleset), dan foto bernuansa film. Retro di Laras bukan kostum atau tumpukan ikon zaman dulu. Nostalgianya dibawa oleh warna, huruf, dan material cetak, sementara susunan tetap rapi, hemat teks, dan mudah dibaca. Gaya ini punya tiga sub-varian (iklan cetak klasik, editorial hangat, groovy) dan setiap postingan memakai tepat satu.

## 1. Asal-usul dan esensi

**Vintage dan retro.** Vintage berarti benda yang memang berasal dari masa lalu. Retro berarti karya baru yang sengaja meminjam gaya masa lalu. Laras selalu membuat retro: semua elemen dibuat baru dari token brand, hanya rasanya yang lama.

**Akar per dekade (yang dipinjam gaya ini):**
- **1950-an, mid-century modern dan Atomic Age.** Mid-century modern lahir di Amerika setelah 1945 dan memuncak di 1950-an: sans serif tebal kadang dipadu huruf kursif, pastel cerah bersama warna tanah hangat, bentuk geometris sederhana tanpa ornamen, dan ruang negatif yang lapang. Desain Atomic Age (kira-kira 1945–1967) menyumbang motif starburst, bumerang, dan atom. Saul Bass memakai potongan kertas, bentuk simbolik yang disederhanakan, dan tipografi yang sengaja miring.
- **1960–70-an, psikedelik dan groovy.** Poster psikedelik (sekitar 1966–1972) memakai huruf tangan yang meliuk, warna jenuh yang "bergetar", dan pengaruh Art Nouveau. Tipografi 70-an penuh huruf swash, huruf menggelembung, bayangan jatuh, ekstrusi, outline, dan inline. Cooper Black (Oswald Cooper, 1922) bangkit lagi pada budaya tandingan 60–70-an sebagai lawan modernisme Swiss, dan sampai sekarang menjadi penanda rasa 70-an.
- **1980-an.** Kelompok Memphis (Milano, dipimpin Ettore Sottsass) membawa warna nyaris neon, geometri dasar, dan coretan zig-zag. Titik halftone yang diperbesar dipakai sebagai tekstur yang sengaja diperlihatkan.
- **1990-an.** Grunge dan anti-design, smiley di grafis rave, sisa bentuk Memphis, dan iklan produk di atas latar warna polos. Sub-varian groovy mengambil bahasa visual yang kini populer sebagai "retro groovy" pada referensi pemilik: huruf gemuk ala 70-an dipadu motif ceria (kotak-kotak, pelangi lengkung, stiker) yang lekat dengan nostalgia 90-an.

**Material cetak yang ditiru.** Cetak lama memakai satu pelat per warna yang jarang pas sempurna (registrasi meleset), tinta merembes ke kertas sehingga tepi sedikit kasar, tint dibuat dari titik halftone karena jumlah tinta terbatas, kertas menguning, dan hampir tidak ada hitam atau putih yang murni. Laras meniru efek ini dengan CSS/SVG secukupnya, bukan dengan gambar tekstur.

**Esensi untuk Laras.** Retro yang baik terasa seperti cetakan bagus yang dibuat hari ini: satu era yang jelas, satu ide besar, huruf berkarakter, warna hangat dari token brand, dan tekstur yang baru terasa saat dilihat dekat. Nasihat yang konsisten dari sumber riset: pilih satu era dan ikuti aturannya, jangan berlebihan, dan tetap tujukan desain ke penonton masa kini.

### Konsep gaya: nostalgia yang bertenaga (T-134)

Penilaian pemilik atas render T-131: gaya ini "terlalu datar dan tidak punya konsep". Penyebabnya, gaya hanya menjadi hiasan (bingkai, grain) di atas arketipe kata raksasa yang sama, dengan foto studio yang sama untuk semua gaya, tanpa metafora, dan terlalu kosong (warna dominan 61–72% dan area tenang 61–65%, padahal referensi pemilik bermedian 43% dan 66%, dengan 4–6 elemen). Di referensi, gaya mengubah komposisinya: tubuh yang melompat menembus huruf, foto arsip yang menimpa kaki huruf poster, kata sampul yang duduk di langit atau dinding foto film. Empat hal berikut wajib ada di setiap pola Vintage/Retro:

1. **Metafora atau ide besar.** Satu ide visual yang langsung membawa pesan, dan kata raksasa adalah kata kunci pesan itu. Contoh di render demo: pria 70-an melompat sambil mengangkat kantong kopi menembus kata HORE ("sangrai minggu ini sudah datang"); pelari yang melompati kata FREE (lari bersama yang gratis, sekaligus rasa bebas); peracik kopi yang duduk di depan SANGRAI SENDIRI; wanita yang menunggu di jendela di bawah kata WAKTU (hasil perawatan butuh beberapa minggu); buah persik di bawah kaca pembesar dengan kata KENALI.
2. **Gambar bergaya.** Aset khusus gaya: cut-out orang 70-an yang melompat (`gaya-retro.webp`), potret editorial berbutir (`gaya-retro.jpg`), atau cut-out lain yang diberi perlakuan gaya: `mono` untuk rasa foto arsip di atas dinding warna, `hangat` untuk foto film, grain global, dan **bayangan keras subjek di dinding** (bayangan lembut untuk brand berbayangan lembut). Foto studio polos tanpa perlakuan tidak dipakai.
3. **Interaksi huruf dan subjek.** Huruf berselang depan-belakang tubuh (baris atas di belakang badan, baris bawah di depan kaki), subjek duduk atau berdiri di depan kaki huruf poster (maks ±35% tinggi baris terakhir tertutup), bayangan subjek jatuh di atas huruf di belakangnya, dan penutup kalimat yang disorot warna aksen. Huruf yang tertutup tidak boleh mengubah arti kata (FREE yang huruf R-nya tertutup terbaca FEE).
4. **Susunan lapisan dengan hierarki jelas.** Bidang warna jenuh atau foto film → grain → baris kata di belakang subjek → subjek dengan bayangan keras → baris kata di depan subjek → info pendukung (angka kunci, kolom fakta) → detail cetak kecil (baris kredit berhuruf aksen, garis 2 px, logo). Padat boleh, kacau tidak: setiap lapisan punya satu tugas.

Tiga pola khas (arketipe T-134) menerjemahkan konsep ini; urutannya di render demo: Kata dilompati (thumbnail gaya), Poster huruf, Sampul editorial (bagian 9 pola 6, 3, dan 2).

**Batas dengan gaya lain (Tahap 2).** Bila desain condong penuh ke salah satu ciri berikut, desain itu sudah pindah gaya: titik halftone raksasa ala komik dan balon kata (Pop Art), huruf meleleh memenuhi kanvas (Psychedelic), krom, biru perak, dan antarmuka digital (Y2K Nostalgia), neon dan grid perspektif (Retro-Futurisme), geometri emas simetris (Art Deco), atau kolase sobek berlapis-lapis (Scrapbook). Vintage/Retro hanya mengambil versi lembut dari ciri-ciri itu.

### Sub-varian yang bisa dipilih

| id | Nama | Era acuan | Kesan | Ciri penentu |
|---|---|---|---|---|
| `iklan-cetak` | Iklan cetak klasik | 1950–70-an | ceria, menjual, jujur | latar kertas atau bidang warna dengan pita, headline serif tebal atau script iklan, subjek ekspresif, starburst berisi kata pendek, bingkai garis atau oval |
| `editorial-hangat` | Editorial hangat | 1970-an dengan rasa majalah modern | percaya diri, stylish, kalem | bidang warna hangat jenuh-sedang, kata raksasa yang mengunci dengan subjek, pasangan serif italic dan grotesk tebal, grain film, teks kredit kecil |
| `groovy` | Groovy | 1970-an yang dihidupkan lagi 1990-an | riang, muda, komunitas | latar krem, huruf serif bulat gemuk dengan outline dan bayangan offset, pelangi lengkung bergaris, kotak-kotak, stiker bulat |

Aturan pemilihan: **satu sub-varian per project** sebagai default (agar feed konsisten), dengan pola layout yang berganti antar postingan (K6). Default bila ragu: `editorial-hangat`, karena paling modern dan paling luwes terhadap Brand Kit. Pilih `iklan-cetak` untuk promo produk konsumen yang ingin terasa legendaris dan ramah. Pilih `groovy` untuk brand muda, komunitas, musik, merchandise, atau acara santai. Satu carousel tidak pernah mencampur sub-varian.

## 2. Kapan dipakai dan kapan dihindari

**Cocok untuk:**
- Kuliner dan minuman: kafe dan kedai kopi, bakery, es krim, warung legendaris, restoran keluarga, brand minuman. (`iklan-cetak` untuk promo menu, `editorial-hangat` untuk cerita brand.)
- Gaya hidup dan kreatif: brand fashion lokal, thrift dan barang bekas, barbershop, studio foto, toko piringan hitam, toko buku, penerbit kecil, agensi kreatif dan kreator konten.
- Acara dan komunitas: konser kecil, malam DJ, pasar kreatif, festival kuliner, komunitas lari santai atau sepeda, klub film, peluncuran edisi terbatas. (`groovy` atau `editorial-hangat`.)
- Momen brand: ulang tahun ke-10 atau ke-25, edisi spesial, kampanye "throwback", kemasan atau menu lama yang kembali.
- Jenis pesan: promo dan harga, peluncuran, pengumuman acara, cerita brand, testimoni hangat, tips ringan, ajakan bergabung.
- Audiens: 18–40 tahun yang menyukai estetika analog, pelanggan setia yang menghargai kesan "sudah lama ada", komunitas hobi.

**Hindari atau pakai dengan sangat hati-hati:**
- Klinik, rumah sakit, apotek, layanan darurat, dan informasi kesehatan serius. Kesan main-main dan tekstur kusam menurunkan rasa steril dan presisi. Pengecualian terbatas: kampanye komunitas (mis. donor darah) dengan `editorial-hangat` tanpa starburst.
- Fintech, bank digital, asuransi, investasi, B2B SaaS, dan firma hukum. Audiens mencari keamanan dan ketepatan. Hanya cocok untuk kampanye nostalgia sekali-sekali (mis. HUT perusahaan) dalam `editorial-hangat`.
- Konten padat data (tabel, perbandingan fitur detail, angka keuangan), instruksi teknis panjang, peringatan keselamatan, pengumuman duka, dan pernyataan resmi atau krisis.
- Brand mewah minimalis yang identitasnya bergantung pada putih bersih dan huruf tipis. Bila dipakai, hanya `editorial-hangat` dengan grain sangat tipis.
- Audiens anak-anak: `groovy` boleh, tetapi tanpa grain dan dengan huruf yang sangat mudah dibaca.

## 3. Ciri visual kunci

Ciri berikut bisa dicek dari gambar hasil render:
1. **Satu sub-varian terbaca jelas.** Tidak ada starburst 50-an bersama kotak-kotak 90-an bersama neon 80-an dalam satu postingan.
2. **Palet hangat dan sedikit pudar.** Tidak ada bidang besar berwarna hitam murni atau putih murni. Latar berupa kertas krem (`neutral-light`) atau bidang warna brand yang jenuh-sedang.
3. **Tekstur cetak global yang halus.** Grain terlihat saat diperbesar 200% tetapi tidak mengganggu teks pada ukuran normal. Halftone, bila ada, terbatas pada satu bidang.
4. **Headline display berkarakter mendominasi.** Serif tebal, grotesk condensed raksasa, atau serif bulat gemuk dengan outline dan bayangan offset, menempati 15–40% luas kanvas.
5. **Pasangan huruf yang kontras.** Display tebal dipadu satu frasa pendek serif italic atau script, atau dipadu grotesk kecil untuk body.
6. **Foto bernuansa film.** Grading hangat, kontras lembut, grain halus; atau subjek cut-out yang ekspresif (tertawa, melompat, berpose) dengan bayangan keras.
7. **Perangkat grafis khas era, maksimal dua jenis.** Contoh: starburst, sunburst, pelangi lengkung, kotak-kotak, bingkai garis ganda atau oval, stiker bulat.
8. **Interaksi huruf dan subjek** (khusus `editorial-hangat`): subjek berdiri di depan kata raksasa, duduk di atasnya, atau melompat menembusnya.
9. **Teks mikro bergaya kredit cetak** (opsional): nomor edisi, tanggal, halaman "03/07" di tepi atas atau bawah, 24 px.
10. **Bayangan selalu keras** (tanpa blur) bila dipakai pada huruf, stiker, atau subjek di dinding.

## 4. Komposisi, grid, dan hierarki

**Grid.** 12 kolom di dalam safe margin brand (64–80 px). Bila memakai bingkai retro (garis di tepi kanvas), gunakan safe margin 80 px agar teks berjarak minimal 24 px dari garis bingkai. Bidang dekoratif (sunburst, pelangi, kotak-kotak, foto) boleh menembus tepi kanvas. Teks dan logo tidak pernah keluar safe margin.

**Titik potong 3×3** pada kanvas 1080 × 1350: (360, 450), (720, 450), (360, 900), (720, 900), toleransi ±8% (±86 px horizontal, ±108 px vertikal).

**Hierarki dan kepadatan per sub-varian:**
- `iklan-cetak`: tiga tingkat jelas, yaitu headline (atau subjek dengan produk) sebagai dominan, starburst atau harga sebagai tingkat kedua, lalu body dan CTA. Lebih padat dari standar Laras, seperti iklan majalah: 5–7 elemen, ruang kosong ≥ 25%. Komposisi simetris (sumbu tengah) atau asimetris kiri-kanan sama-sama sah.
- `editorial-hangat`: satu dominan yang sangat besar (kata raksasa atau foto), sisanya kecil dan rapi. Kontras skala ekstrem adalah intinya: kata raksasa 5–10× tinggi body. Ruang kosong ≥ 25%, maksimal 6 elemen (dikalibrasi dari referensi pemilik, T-134). Teks kredit kecil disusun dalam satu baris atau satu kolom sempit, rata pada garis grid.
- `groovy`: headline gemuk sebagai dominan, satu perangkat besar (pelangi atau kotak-kotak) sebagai tingkat kedua, stiker kecil sebagai aksen. Ruang kosong ≥ 25%, maksimal 7 elemen. Headline biasanya rata tengah atau rata kiri di sepertiga atas.

Kelompok headline bertingkat (pembuka kecil, frasa utama, penutup) dihitung **satu elemen**. Lapisan tekstur global (grain atau halftone latar) tidak dihitung elemen dan tidak mengurangi ruang kosong.

**Tabel aturan Laras untuk gaya ini**

| Aturan | Status | Batas di gaya Vintage/Retro |
|---|---|---|
| P1 grid dan sumbu perataan | Dilonggarkan sedikit | Tetap maks 2 sumbu perataan untuk teks. Maks 2 elemen dekoratif (starburst, stiker) boleh di luar kolom grid dan dimiringkan −8° sampai 8°. Kata raksasa dipaskan lebar safe area, tidak menembus margin. |
| P2 hierarki dan ukuran huruf | Dilonggarkan | Boleh 4 ukuran huruf bila ukuran keempat adalah teks kredit 24 px (maks 3 butir, ≤ 6% luas). Headline tetap ≥ 2× body; elemen kedua ≤ ½ dominan. |
| P3 kedekatan dan ritme | Tetap wajib | Jarak antar blok memakai `--space-*`; tanpa celah mati di antara headline dan subjek. |
| P4 keluarga huruf | Dilonggarkan bersyarat | Keluarga ketiga hanya lewat peran font aksen opsional (T-124) untuk maks 4 kata. Tanpa font aksen tetap 2 keluarga. Tanpa baris yatim; body 30–45 karakter per baris. |
| P5 elemen visual utama | Dilonggarkan untuk `iklan-cetak` dan `groovy` | Maks 4 elemen visual utama (mis. subjek, starburst, pelangi, bingkai). `editorial-hangat` tetap maks 3. |
| P6 keseimbangan, tidak saling menutup | Tetap wajib | Subjek boleh menimpa bagian bawah kata raksasa, tetapi maks 35% tinggi huruf tertutup dan kata tetap terbaca. Pada kata yang dilompati, baris atas boleh tertutup badan selama arti kata tidak berubah. Starburst tidak menutup wajah atau produk. |
| P7 keterbacaan, kontras, ukuran minimum, safe margin | **Tidak pernah dilonggarkan** | Kontras ≥ 4,5:1 (≥ 3:1 untuk teks ≥ 32 px) diukur pada hasil akhir setelah warna dipudarkan dan tekstur dipasang; font ≥ 24 px; teks di dalam safe margin. |
| P8 titik fokus di titik potong | Dilonggarkan untuk komposisi simetris | `iklan-cetak` dan `groovy` boleh berporos tengah: fokus di x = 540 (±8%) pada garis y = 450 atau y = 900. `editorial-hangat` tetap di titik potong. |
| P9 60-30-10 | Dilonggarkan (T-134) | Ambang QA dari pengukuran referensi pemilik: warna dominan ≥ 30%, warna kedua beserta gambar ≤ 55%, aksen ≤ 12%. Arah desain per sub-varian di bagian 6. Diukur dari piksel dengan toleransi warna agar grain tidak memecah kelas warna. |
| P10 ruang kosong dan jumlah elemen | Dilonggarkan (T-134) | Ruang kosong ≥ 25% (median area tenang referensi 66% dikurangi aturan dominan − 5%), maks 6 elemen termasuk logo dan CTA (referensi 4–6); `iklan-cetak` dan `groovy` maks 7. Kelompok (baris kredit, blok detail) dihitung satu. |
| P11 konsistensi | **Diperketat** | Satu tekstur global per postingan, satu sudut miring (pilih satu dari ±4°, ±6°, ±8°), satu gaya bayangan (keras, tanpa blur), satu keluarga dekorasi (satu era), radius dari `--shape-radius`. |

## 5. Tipografi

**Kategori huruf per sub-varian** (memakai nama kategori `StyleMeta`):

| Sub-varian | Headline | Body | Huruf besar/kecil | Tracking | Leading headline | Rasio headline:body |
|---|---|---|---|---|---|---|
| `iklan-cetak` | `serif-display` tebal atau `slab`; frasa pendek boleh `script` | `grotesk` atau `humanist-sans` | title case atau kalimat | normal | 0,95–1,05 | 3–4× |
| `editorial-hangat` | `grotesk-condensed` sangat tebal atau `geometric-sans` untuk kata raksasa; `serif-display` italic untuk pembuka | `grotesk` atau `serif-text` | kata raksasa huruf besar; pembuka huruf kecil italic | rapat (−1% sampai −3%) untuk kata raksasa; lebar (+4% sampai +8%) untuk teks kredit huruf besar | 0,85–0,95 | 5–10× untuk kata raksasa, 2–3× untuk subjudul |
| `groovy` | `serif-display` bulat dan gemuk (rasa Cooper Black) atau `rounded-sans` tebal | `rounded-sans` atau `grotesk` | title case | normal sampai rapat | 0,9–1,0 | 3–5× |

Untuk `StyleMeta`: heading `serif-display`, `grotesk-condensed`, `slab`, `geometric-sans`; body `grotesk`, `humanist-sans`, `serif-text`; headingCase `mixed`; scaleRatio sekitar 4; tracking `tight`.

**Perlakuan khusus (semua dibuat CSS, tidak pernah oleh model gambar):**
- **Kata raksasa** (`editorial-hangat`): 1 kata, 3–8 huruf, dipaskan lebar safe area dengan `Display` atau `BigWord`, tinggi 18–60% kanvas. Tumpuk vertikal maks 3 baris untuk kata yang dipecah (mis. HO / RE), semua baris sama besar bila subjek melompatinya. Warna `neutral-light` di atas bidang `primary`, atau `primary` di atas kertas.
- **Pembuka italic** (`editorial-hangat`): 1–2 kata huruf kecil serif italic, 44–84 px, menempel di atas atau di kiri kata raksasa, boleh menimpa tepi huruf pertama sedikit (≤ 15% tingginya).
- **Outline dan bayangan offset** (`groovy`): isi huruf `neutral-light` atau `secondary`, outline `neutral-dark` setebal 4–6% ukuran huruf, bayangan offset keras ke kanan bawah 6–8% ukuran huruf tanpa blur, warna `primary` atau `accent`. Hanya untuk headline ≥ 84 px.
- **Registrasi meleset pada huruf** (opsional, semua sub-varian): salinan headline dengan warna token kedua digeser 3–6 px (pada basis 1080), mode campur `multiply`. Maks satu elemen teks per postingan, hanya headline ≥ 84 px. Kontras dihitung pada lapisan utama.
- **Sorot di balik kata** (`Highlight`, sudah ada) untuk satu kata di subjudul, warna `accent`, cocok untuk `iklan-cetak`.
- **Rotasi**: headline lurus. Hanya teks di dalam starburst atau stiker yang ikut miring.
- **Teks kredit**: 24 px, huruf besar dengan tracking lebar atau huruf kecil biasa, maks 3 butir, diletakkan sejajar tepi atas atau bawah safe area.
- **Jangan memalsukan gaya huruf.** `Text` mengunci `font-synthesis: none`; italic atau bobot yang tidak ada di file brand tidak boleh dibuat browser. Bila brand tidak punya italic, pembuka memakai font aksen atau heading tegak.

**Pemetaan ke font brand.**
- Font `heading` brand menjadi headline atau kata raksasa. Pilih sub-varian yang sesuai karakter heading: serif tebal ke `iklan-cetak` atau `groovy`; grotesk condensed atau geometric tebal ke `editorial-hangat`; serif bulat gemuk ke `groovy`.
- Font `body` brand untuk body, CTA, dan headline kecil.
- **Font aksen Brand Kit** (`--font-accent`, T-134; fixture: Courier Prime 700, IBM Plex Mono 500, Space Mono 700) untuk teks cetak kecil: kalimat ketik di atas kata raksasa, pembuka sampul, baris kredit huruf besar ber-tracking lebar, kolom fakta, dan keterangan angka. Font aksen ketik ini menggantikan italic yang tidak dimiliki fixture: pasangan "huruf ketik kecil + heading raksasa" adalah versi Laras dari pasangan italic + grotesk di referensi. Bila brand tidak punya font aksen, perannya jatuh ke font body.
- Kata raksasa selalu font heading brand. Angka raksasa memakai angka sejajar (`font-variant-numeric: lining-nums`) bila font punya fiturnya, karena angka bergaya lama (Cormorant) turun di bawah garis dasar dan menabrak teks di bawahnya.
- Kata raksasa display punya area konten font yang lebih tinggi dari kotak barisnya (Fraunces ±0,21 em, Anton ±0,35 em di atas kotak baris pada line-height 0,82–0,86). QA kontras mengukur seluruh area itu, jadi baris yang berada di depan subjek hanya boleh menutup kaki, bukan baju, dan kata di tepi atas kanvas perlu jarak tambahan.

**Kapan font brand membuat gaya "kurang cocok".**
- Heading hanya tersedia dalam bobot ≤ 400: `groovy` dan `iklan-cetak` kurang cocok; pakai `editorial-hangat` dengan kata raksasa yang dipaskan lebar agar tetap berbobot visual.
- Heading `monospace` atau sans futuristik: kurang cocok untuk semua sub-varian; pakai `editorial-hangat` dengan perlakuan foto dan warna saja.
- Heading `script` tipis: hanya untuk pembuka, bukan kata raksasa.

## 6. Warna

**Strategi palet.** Hangat, jenuh-sedang, dan sedikit pudar seperti tinta di kertas. Warna utama retro (oranye, terakota, merah bata, kuning mustard, krem, hijau zaitun, biru kusam) hanya dipakai bila memang ada di token brand. Gaya tidak pernah menambah hue baru.

**Warna pudar dalam batas token.** Kesan pudar dibuat dengan mencampur token brand dengan token brand lain, tidak dengan hex baru:
- Bidang besar: `color-mix(in oklab, var(--color-primary) 85–92%, var(--color-neutral-light))`. Campuran `neutral-light` maks 15%.
- "Tinta" gelap: bila `neutral-dark` brand adalah hitam murni, teks dan outline boleh memakai campuran 90–95% `neutral-dark` dengan 5–10% `primary`.
- "Kertas": bila `neutral-light` brand adalah putih murni, latar kertas boleh memakai campuran 92–96% `neutral-light` dengan 4–8% `secondary` atau `primary`.
- Logo dan warna produk tidak pernah dipudarkan.
- Bila aturan brand menuntut warna persis (mis. "Warna tidak boleh diubah"), pemudaran dimatikan dan rasa retro dibawa oleh huruf dan tekstur saja.
- Pemudaran butuh helper token (`fade`) di primitives: **perlu dibuat**.

**Proporsi P9 per sub-varian** (arah desain; ambang QA yang dipakai mesin ada di bagian 4: dominan ≥ 30%, kedua + gambar ≤ 55%, aksen ≤ 12%):

| Sub-varian | Dominan | Kedua + gambar | Aksen | Catatan |
|---|---|---|---|---|
| `iklan-cetak` | ≥ 50% (kertas `neutral-light` atau bidang `primary`) | 25–40% (`primary`/`secondary` untuk pita dan bidang, foto) | ≤ 12% (`accent` untuk starburst atau CTA) | aksen boleh di starburst dan CTA sekaligus |
| `editorial-hangat` | ≥ 40% (bidang `primary` atau foto bergrading hangat) | 30–55% (kata raksasa, subjek dengan bayangannya) | ≤ 12% (`accent` untuk penutup yang disorot, CTA, atau kata raksasa di bidang `primary` gelap) | referensi: dominan median 43% |
| `groovy` | ≥ 45% (`neutral-light` krem atau `secondary`) | 30–40% (`primary` untuk pelangi atau kotak-kotak, subjek) | ≤ 15% (`accent` di satu perangkat dekoratif, mis. satu pita pelangi, dan CTA) | aksen boleh di satu perangkat dekoratif selain CTA |

**Pemetaan token default:**
- `iklan-cetak`: latar `neutral-light`; pita dan bidang `primary`; starburst `accent` dengan teks `neutral-dark`; headline `primary` atau `neutral-dark`.
- `editorial-hangat`: latar `primary` (dipudarkan 8–12%); kata raksasa `neutral-light`; pembuka dan body `neutral-dark` atau `neutral-light` sesuai kontras; satu sorotan `accent`.
- `groovy`: latar `neutral-light`; pelangi berurutan `primary`, `secondary`, `accent`, `neutral-dark` (pilih 3–4); headline berisi `neutral-light` dengan outline `neutral-dark` dan bayangan `primary`.

**Kontras.** Hitung ulang setelah pemudaran. Teks di atas sunburst, kotak-kotak, atau halftone wajib berada di panel solid atau di bagian pola yang kontrasnya ke teks ≥ 4,5:1 di semua sel. Grain di atas teks body dilarang; grain di atas headline ≥ 84 px boleh dengan opasitas ≤ 8%.

**Gradient: tidak dipakai** (`gradient: never`). Pelangi adalah pita solid, sunburst adalah irisan solid, dan halftone adalah titik solid. Pola ini memakai fungsi gradient CSS dengan hard stop, tetapi secara visual tidak bergradasi, jadi tetap sah untuk brand yang melarang gradient. Gradasi kepadatan halftone (titik memudar) termasuk gradient visual dan tidak dipakai pada brand yang melarang gradient. Vignette gelap di sudut tidak pernah dipakai.

## 7. Bentuk, tekstur, dan perangkat grafis

**Bentuk dan garis.** Lingkaran, oval, busur, bintang bergerigi, dan pita lurus. Sudut kotak mengikuti `--shape-radius` brand. Garis berupa garis tebal-tipis ganda khas bingkai cetak (tebal 6–8 px dan tipis 2 px dengan jeda 8–12 px) atau garis tipis 2 px pemisah teks kredit. Ikon, bila perlu, bergaya garis tebal sederhana. Dekorasi harus "datar" seperti cetak: tanpa efek 3D halus, kaca, atau glow.

**Perangkat yang sudah ada di Laras:**

| Perangkat | Pemakaian di gaya ini |
|---|---|
| `Display` | kata raksasa dan tumpukan kata (`editorial-hangat`) |
| `Highlight` | sorot satu kata di subjudul (`iklan-cetak`) |
| `Sticker` | CTA atau chip fakta; pada `groovy` pakai `edge` tebal `neutral-dark` |
| `Scribble` | `underline` di bawah satu kata, `arrow` ajakan geser, `sparkle` kecil di `groovy` (maks 2) |
| `Frame` | foto berbingkai dengan `duotone` warna brand; tepi sobek hanya untuk `groovy` dan maks satu |
| `Tape` | jarang; hanya `groovy` untuk satu foto kecil |
| `Image` (`mono`) | foto arsip hitam-putih di atas bidang warna (rasa poster "ACE") |
| `Logo` | logo brand, tidak pernah diberi tekstur atau dipudarkan |
| `BigWord` (`styles/retro-vintage/parts.tsx`, T-134) | kata raksasa satu slot dalam 1–3 baris: `equal` (semua baris sama besar, baris terlebar mengisi lebar, untuk kata yang dilompati) atau `justify` (setiap baris dipaskan sendiri, untuk poster). Pada `equal` setiap baris bisa di depan atau di belakang subjek (z-index tanpa stacking context), baris depan diberi bayangan keras searah bayangan subjek |
| `AccentText` (T-134) | teks font aksen: kalimat ketik, pembuka, kredit huruf besar, kolom fakta |
| `castShadow` / `shadowTone` (T-134) | bayangan subjek di dinding: token bidang dicampur 34% `neutral-dark`, jatuh ke kanan bawah; keras (tanpa blur) atau lembut sesuai Brand Kit |

**Perangkat yang perlu dibuat:**

| Perangkat | Status | Spesifikasi (basis 1080 × 1350) |
|---|---|---|
| `Grain` | perlu dibuat | Lapisan penuh kanvas dari SVG `feTurbulence` `type="fractalNoise"`, `baseFrequency` 0,7–0,9, `numOctaves` 2–3, `stitchTiles="stitch"`, `seed` tetap agar render deterministik, lalu `feColorMatrix` saturasi 0 (abu-abu, tanpa warna). Opasitas 6–12%, mode campur `soft-light` (latar warna atau foto) atau `multiply` (kertas terang). Tidak memakai filter contrast/brightness pada elemen karena menggeser warna token. Di bawah teks body, boleh di atas headline. |
| `Halftone` | perlu dibuat | Pola titik `radial-gradient` warna token dengan hard stop, sel 12–20 px, diameter titik 35–60% sel, dua lapis diimbangi setengah sel agar tersusun diagonal. Hanya pada satu bidang (bayangan subjek, satu pita, sudut kanvas), maks 25% luas, tidak di belakang teks body. |
| `Misregister` | perlu dibuat | Salinan satu bentuk atau headline dengan token kedua, geser 3–6 px ke kanan bawah, `mix-blend-mode: multiply`. Maks satu elemen per postingan. |
| `Starburst` | perlu dibuat (varian bentuk `Sticker`) | Bintang bergerigi 14–20 titik, jari-jari dalam 78–86%, diameter 180–280 px, isi `accent`, teks 1–3 kata ≥ 32 px, miring sesuai sudut postingan. Untuk "Baru!", harga, atau "Edisi terbatas". |
| `Sunburst` | perlu dibuat | Sinar dari satu titik (`repeating-conic-gradient` dengan hard stop), 16–24 sinar, dua token yang berdekatan atau satu token dengan versi pudarnya. Pusat sinar di titik fokus atau di belakang subjek. Teks tidak di atas sinar kecuali di panel solid. Maks 1 per postingan. |
| `Checker` | perlu dibuat | Kotak-kotak dua token (`conic-gradient` hard stop), sel 48–80 px, dipakai sebagai pita 1–2 baris di tepi atas atau bawah, atau sebagai bingkai. Maks 15% luas. Versi bergelombang tidak dipakai. |
| `Rainbow` | perlu dibuat | Pelangi lengkung 3–5 pita konsentris solid, lebar pita 28–56 px, celah 0 atau 8 px warna kertas, masuk dari satu tepi kanvas. Maks 20% luas. Bisa dibangun dari lengkung `feed-bidang-warna`. |
| `RetroFrame` | perlu dibuat | (a) Bingkai garis ganda di tepi kanvas, inset 28–40 px, warna `neutral-dark` atau `primary`; (b) bingkai oval untuk foto (rasio 3:4) dengan garis ganda. Pakai safe margin 80 px bila (a) dipakai. |
| `RoundBadge` | perlu dibuat | Stiker bulat Ø 120–200 px berisi ikon sederhana (bunga, bintang, hati) atau 1–2 kata, outline `neutral-dark` 4–6 px. Teks melengkung mengikuti lingkaran boleh menyusul. |
| `RetroType` | perlu dibuat (opsi `Display`) | Opsi outline dan bayangan offset keras sesuai bagian 5. |
| `CutoutEdge` | perlu dibuat | Tepi putih 8–12 px mengelilingi subjek cut-out (efek stiker potong) untuk `groovy`, dari `drop-shadow` tanpa blur warna `neutral-light`. |
| Helper `fade` | perlu dibuat | Campuran token sesuai bagian 6, dipakai semua perangkat di atas. |

**Aturan konsistensi (P11).**
- Satu tekstur global per postingan: `Grain` (default `editorial-hangat`) atau tanpa tekstur. `Halftone` hanya lokal dan tidak dipakai bersama `Misregister` dalam satu postingan.
- Satu keluarga dekorasi per sub-varian, maks dua jenis per postingan: `iklan-cetak` = starburst, sunburst, bingkai garis, bingkai oval, pita; `editorial-hangat` = garis kredit, garis bawah, satu sorotan (hampir tanpa dekorasi); `groovy` = pelangi, kotak-kotak, stiker bulat, kilau.
- Satu sudut miring untuk semua elemen miring, satu tebal outline, satu arah bayangan (kanan bawah).

## 8. Foto dan ilustrasi

**Art direction umum.** Foto harus terasa diambil dengan film atau di studio iklan lama, tetapi dengan kualitas tajam masa kini. Warna hangat, kontras lembut, hitam sedikit terangkat, grain halus. Subjek manusia ekspresif dan percaya diri, tidak berpose stok kantor. Tanpa teks apa pun di gambar.

| Sub-varian | Subjek dan pose | Cahaya | Sudut kamera | Jenis aset |
|---|---|---|---|---|
| `iklan-cetak` | orang tertawa lebar, menyeruput, menunjuk, atau memegang produk dekat wajah; produk makanan yang menggugah | studio terang dan rata, sedikit kilap | setinggi mata, setengah badan | cut-out subjek dan produk; foto utuh di bingkai oval |
| `editorial-hangat` | pose dinamis (melompat, menari, duduk di atas mobil atau kursi, bersandar ke dinding); objek tunggal di lanskap luas | matahari sore yang keras dengan bayangan tegas di dinding warna, atau mendung lembut untuk lanskap | rendah atau setinggi mata, seluruh badan | cut-out seluruh badan (untuk kata raksasa); foto konsep dengan 40–50% ruang kosong; foto arsip hitam-putih |
| `groovy` | benda nostalgia (kaset, kamera instan, TV tabung, piringan hitam, sepatu kanvas) atau orang muda bergaya santai | siang lembut, bayangan pendek | lurus dari depan atau sedikit dari atas | cut-out objek dengan tepi stiker; foto kecil dalam bingkai |

**Aset demo khusus gaya (T-134, Codex):** Kopi `gaya-retro.webp` (pria 70-an melompat memegang kantong kopi, cut-out), Ritme `gaya-retro.webp` (pelari melompat kaki terbuka, gaya foto 70-an, cut-out), Seruni `gaya-retro.jpg` (potret editorial 70-an berbutir dengan dinding kosong di atas). Pola poster memakai cut-out duduk atau berlari dari gaya lain (`gaya-corporate.webp`, `gaya-cyberpunk.webp`) dengan perlakuan `mono`, sehingga foto berwarna studio berubah menjadi foto arsip di atas dinding warna; pola sampul memakai foto penuh brand (`foto.jpg`, `konsep.jpg`) dengan grading `hangat`.

**Perlakuan CSS yang dipakai:** `grain` (lapisan global), `duotone` warna brand (`Frame`, sudah ada) untuk foto arsip atau seragam, `mono` di atas bidang warna (rasa poster "ACE"), bayangan keras subjek di dinding (`castShadow`), dan `halftone` lokal pada bayangan. Grading hangat diminta lewat prompt. CSS hanya menurunkan saturasi (0,85–0,95) dan kontras (0,92–0,96) bila perlu. Filter sepia tidak dipakai karena menggeser warna produk.

**Contoh frasa prompt (bahasa Inggris):**
- "1970s editorial photograph, warm late-afternoon sunlight, crisp hard shadow cast on a plain wall"
- "shot on 35mm film, fine natural film grain, slightly faded warm tones, soft contrast, lifted blacks"
- "full-body person mid-jump, dynamic dance pose, plain seamless backdrop, isolated subject with clean edges for cut-out"
- "single vintage wooden chair in a wide empty grass field, overcast soft light, large empty sky above"
- "1960s magazine advertisement photography style, bright even studio lighting, rich but slightly faded color"
- "cheerful person laughing while holding an unbranded drink near the face, half-body studio portrait, plain background"
- "nostalgic object still life: cassette tape, instant camera, CRT television, on a plain pastel backdrop, centered, isolated for cut-out"
- "black-and-white archival-style photograph of two people sitting on a bench, documentary mood, natural grain"

**Frasa yang dilarang:**
- Semua yang memancing teks atau merek: "poster", "vintage advertisement", "magazine cover", "album cover", "flyer", "label", "sign", "logo", "text", "lettering", "typography", "caption", "packaging with brand name". Produk diminta "unbranded, blank label".
- Tekstur yang menjadi tugas CSS atau terlalu klise: "sepia", "dust and scratches", "burnt edges", "torn old paper", "crumpled paper", "vignette", "Instagram filter".
- Bingkai dan tepi film: "polaroid frame", "film border", "sprocket holes" (sering membawa angka dan teks).
- Gaya lain: "neon", "synthwave", "vaporwave", "chrome", "glitch", "cyberpunk".

**Ilustrasi.** Bila brand memakai ilustrasi, gaya yang cocok adalah bentuk datar sederhana seperti potongan kertas dengan 2–3 warna token. Karakter kartun bermata besar dan sarung tangan putih ala kartun lama hanya untuk `groovy`, maks satu per postingan, dan tidak dibuat oleh model gambar bila mengandung teks.

## 9. Pola layout feed 4:5

### Pola 1: Iklan starburst (promo produk atau harga), sub-varian `iklan-cetak`
Susunan dari atas ke bawah:
1. Pembuka kecil 24–32 px (≤ 30 karakter) rata kiri di y 96–140.
2. Headline serif tebal 2 baris, 84–112 px, rata kiri, y 150–420, maks 6 kata.
3. Subjek cut-out (orang dengan produk, atau produk saja) di separuh bawah, berdiri di atas pita, mengisi x 360–1016.
4. `Starburst` Ø 200–260 px berisi harga atau "Baru!", miring sesuai sudut postingan, di sekitar (720, 450), boleh menimpa tepi subjek ≤ 15% luasnya tanpa menutup wajah atau produk.
5. Pita bawah `primary` setinggi 120–160 px berisi CTA (`Sticker`) di kiri dan logo di kanan.

Fokus utama: wajah atau produk di (720, 900). Elemen kedua: headline di (360, 450). Jumlah elemen: 6. Opsi: `Sunburst` pudar di belakang subjek, menggantikan pita bila pita tidak dipakai. Arketipe terdekat: `feed-bidang-warna`. Usulan arketipe: `feed-iklan-cetak` (**perlu dibuat**) dengan slot starburst dan pita bawah.

### Pola 2: Sampul majalah (edukasi, cerita brand, sampul carousel), sub-varian `editorial-hangat`
Ide besar: kata sampul yang raksasa duduk di area tenang foto film (langit, dinding, kain), foto membuktikan suasananya. Contoh: "pagi yang PELAN" di atas kain linen dengan secangkir kopi (Kopi), "kulit butuh WAKTU" di dinding di atas wanita yang menunggu di jendela (Seruni), "sebelum merawat, KENALI" di atas buah persik di bawah kaca pembesar (Seruni).
Susunan dari atas ke bawah:
1. Baris kepala: kredit 24 px font aksen huruf besar (produk, harga, lokasi) dengan garis 2 px di bawahnya.
2. Pembuka font aksen 44–60 px, 1–3 kata huruf kecil, dibaca sebelum kata kunci.
3. Kata raksasa satu baris dipaskan lebar: `besar` (batas 320 px) atau `sedang` (74% lebar, batas 230 px) bila area tenangnya sempit atau ada jendela terang di sisinya.
4. Headline body satu kalimat pendek, lalu penutup 2–4 kata di baris sendiri dengan blok sorot `accent` (interaksi huruf: potongan kalimat disorot).
5. Foto penuh bergrading hangat dengan grain; logo di sudut seberang judul (kanan bawah untuk Kopi).
6. Varian `alas: bidang` untuk foto tanpa area tenang (lari subuh Ritme): pita `primary` di atas berisi baris kepala dengan logo, judul berwarna `secondary`, dan foto di sisa kanvas tanpa tertimpa teks, seperti kepala majalah lari 70-an.

Fokus utama: kata raksasa di sepertiga atas. Elemen kedua: subjek foto di sepertiga bawah. Jumlah elemen: 3 (foto latar, kelompok judul, logo). Arketipe: `feed-sampul-editorial` (T-134). Opsi: `zona` atas/bawah, `tinta` gelap/terang, `skala`, `alas`, `logo` kanan/kiri, `rata`.

### Pola 3: Poster huruf raksasa (acara, profil orang, satu angka kunci), sub-varian `editorial-hangat`
Ide besar: poster acara 70-an, kata atau angka kunci memenuhi lebar dinding warna dan orang di baliknya berdiri atau duduk di depan kaki hurufnya seperti di depan dinding bersinar matahari sore. Contoh: peracik kopi (foto arsip `mono`) duduk di depan SANGRAI SENDIRI berwarna `accent` di dinding `primary` (Kopi); terapis duduk di depan angka 30 ("menit untuk mengenal kulitmu dulu", Seruni); sprinter `mono` melesat di depan 10K kuning di dinding biru (Ritme).
Susunan dari atas ke bawah:
1. Baris kredit: kredit kiri dan info kanan (font aksen huruf besar 24 px), garis 2 px di bawahnya.
2. Kata atau angka raksasa 1–2 baris mulai y ±19%, setiap baris dipaskan lebar, tumpukan maks 620 px; angka memakai angka sejajar.
3. Subjek cut-out di sepertiga kiri atau kanan, puncak tubuhnya di 1 − 0,32/jumlah baris tinggi kotak kata (kepala menutup ±30% baris terakhir), tubuh memanjang sampai dasar kanvas, bayangan di dinding (keras, atau lembut untuk Seruni).
4. Blok detail di sisi seberang subjek: headline heading 40–52 px, 1–3 kolom fakta (garis 2 px + font aksen 24 px), lalu CTA dan logo satu baris di dasar.

Fokus utama: kepala subjek di sekitar (360, 700) atau (720, 700). Elemen kedua: blok detail di (720, 1000). Jumlah elemen: 5 (kelompok kredit, kata, subjek, kelompok detail; logo di dalam blok detail). Arketipe: `feed-poster-huruf` (T-134). Opsi: `tone` dinding, `huruf` kontras/accent (accent hanya di dinding `primary` gelap), `side`, `bayangan`. Pola satu kata di belakang subjek yang lebih tenang tetap memakai `feed-kata-raksasa`.

### Pola 4: Potret oval (testimoni atau kutipan), sub-varian `iklan-cetak`
Susunan dari atas ke bawah:
1. Label kecil 24–32 px rata tengah ("Kata pelanggan").
2. Foto pelanggan di bingkai oval 3:4 selebar 52–60% kanvas, rata tengah, y 170–760, garis ganda `RetroFrame`.
3. Kutipan serif tebal 2–3 baris, 60–84 px, tanda kutip besar `accent`, menimpa tepi bawah oval 40–80 px.
4. Nama dan peran 24–32 px dengan rating bintang kecil `accent` (K8).
5. Logo bawah tengah.

Fokus utama: wajah di (540, 450), poros tengah (P8 dilonggarkan). Elemen kedua: kutipan pada garis y = 900. Jumlah elemen: 5. Arketipe terdekat: `feed-satu-objek`. Usulan arketipe: `feed-potret-oval` (**perlu dibuat**).

### Pola 5: Pernyataan groovy (ajakan atau brand awareness), sub-varian `groovy`
Susunan dari atas ke bawah:
1. Logo kiri atas.
2. Headline serif bulat gemuk 2–3 baris (84–112 px atau Display), outline dan bayangan offset, rata kiri, sepertiga atas, maks 3 kata per baris.
3. Satu baris body 32 px.
4. `Rainbow` 4 pita masuk dari tepi kanan atau kanan bawah, maks 20% luas.
5. 1–2 `RoundBadge` Ø 120–180 px (satu jenis ikon) menempel di ujung headline atau di ujung pelangi.
6. CTA (`Sticker` dengan `edge` tebal) di kiri bawah.

Fokus utama: headline di (360, 450). Elemen kedua: pelangi dan stiker di (720, 900). Jumlah elemen: 6. Variasi: ganti pelangi dengan pita `Checker` di tepi bawah. Arketipe terdekat: `feed-bidang-warna` (lengkung warna kedua) tanpa subjek. Usulan arketipe: `feed-groovy` (**perlu dibuat**).

### Pola 6: Kata yang dilompati (peluncuran, kampanye energi, ajakan bergerak), sub-varian `editorial-hangat`
Ide besar: tubuh yang melompat menembus kata kunci, sehingga kata itu "dihidupkan" oleh gerak (rujukan kampanye MOVE, prinsipnya saja). Contoh: pria 70-an melompat sambil mengangkat kantong kopi keluar dari HO / RE ("sangrai minggu ini sudah datang", Kopi); pelari melompati FREE dengan kaki di belakang hurufnya ("Sunday group run. Every pace.", Ritme).
Susunan dari atas ke bawah:
1. Baris atas: kalimat ketik font aksen 32–36 px di sisi yang bebas dari tangan dan kepala subjek; logo kiri atas bila brand mengizinkan.
2. Kata kunci 1–3 baris yang sama besar (baris terlebar mengisi lebar, tumpukan maks 60% tinggi kanvas), rata tengah, di bidang jenuh; kata tunggal dipecah dua (`baris: pecah`) atau utuh satu baris (`baris: utuh`, subjek melompat di atasnya).
3. Subjek cut-out melompat, ditempatkan relatif terhadap kotak kata hasil fit: pinggang (55% tinggi tubuh) 0,38 em di atas baris depan. Baris atas di belakang badan, baris terakhir di depan kaki (z-index tanpa mask, satu slot teks). Bayangan keras subjek jatuh di dinding dan di huruf belakang; baris depan mendapat bayangan keras searah, jadi huruf itu tampak melayang di depan kaki.
4. Baris bawah: angka kunci (heading langkah 4, mis. harga atau jam), keterangan font aksen, CTA kecil; logo di sudut sesuai brand (Kopi kanan bawah).

Fokus utama: badan subjek di tengah tumpukan (komposisi terpusat yang disengaja). Elemen kedua: angka kunci di kiri bawah. Jumlah elemen: 5 (kalimat, kata, subjek, kelompok info, logo). Arketipe: `feed-kata-dilompati` (T-134). Syarat aset: orang seluruh badan sedang melompat atau menari dengan kaki di separuh bawah; brand tanpa aset seperti itu (Seruni) memakai pola 2. Huruf yang tertutup badan tidak boleh mengubah arti kata: pilih `baris: utuh` atau kata lain bila perlu.

### Pola 7: Kisi nostalgia (menu atau katalog singkat), sub-varian `groovy` atau `iklan-cetak`
Susunan dari atas ke bawah:
1. Headline 1–2 baris di atas, 60–84 px.
2. Kisi 2 × 2 panel dengan garis `neutral-dark` 4–6 px dan radius brand: tiga panel berisi foto produk cut-out di atas warna token berbeda, satu panel berisi teks (harga atau jam buka).
3. Pita `Checker` atau CTA dan logo di bawah.

Fokus utama: panel teks atau produk unggulan di (720, 450). Elemen kedua: CTA di (360, 900). Jumlah elemen: 5 (kisi dihitung satu, maks 4 panel). Usulan arketipe: `feed-kisi-panel` (**perlu dibuat**).

## 10. Carousel

- **Satu sub-varian dan satu sistem untuk semua slide.** Seed grain sama, sudut miring sama, warna latar bergantian maks dua token (mis. `primary` dan `neutral-light`).
- **Elemen berulang:** baris kredit atau nomor halaman "02/07" 24 px di posisi tetap (kanan atas), logo kecil di posisi tetap, satu perangkat penanda di posisi tetap (pita `Checker` bawah, garis bingkai, atau pita pelangi). Gaya judul slide isi sama: angka besar (serif atau condensed) di kiri atas dan headline 2 baris di bawahnya.
- **Slide pembuka:** pola 2 (sampul majalah, `feed-sampul-editorial`) untuk edukasi, pola 1 (iklan starburst) untuk promo, pola 6 (`feed-kata-dilompati`) atau pola 5 untuk ajakan. Selalu ada isyarat geser (`Scribble` `arrow` atau teks kredit "Geser").
- **Slide isi:** satu poin per slide, headline ≤ 8 kata, body ≤ 3 baris (30–45 karakter), satu gambar atau satu perangkat. Posisi gambar boleh bergantian kiri-kanan, posisi teks tetap.
- **Slide penutup:** CTA besar di `Starburst` atau `Sticker`, logo, dan satu ajakan simpan atau kunjungi. Boleh memakai `Sunburst` pudar di belakang logo.
- **Kesinambungan:** pelangi atau pita yang terpotong di tepi kanan slide n dan berlanjut di tepi kiri slide n+1 (koordinat lintas slide: **perlu dibuat**). Maks 10 slide. Kata raksasa hanya di slide pembuka dan penutup agar tidak melelahkan.

## 11. Do dan don't

**Do:**
- Pilih satu sub-varian dan ikuti aturannya dari huruf sampai dekorasi.
- Biarkan huruf yang berbicara: satu headline berkarakter yang besar lebih retro daripada lima ornamen.
- Pakai warna dari token, dipudarkan dalam batas bagian 6, dengan latar kertas atau bidang hangat.
- Jaga tekstur tetap halus: grain 6–12%, halftone hanya di satu bidang.
- Gabungkan rasa lama dengan disiplin modern: ruang kosong, grid rapi, teks pendek, kontras terukur.
- Minta foto berkualitas modern dengan grading hangat dan grain halus, lalu biarkan CSS menambah material cetak.
- Gunakan bayangan keras, outline tebal, dan registrasi meleset sebagai "tanda tangan" yang dipakai secukupnya.
- Biarkan gambar bergaya membawa konsep (T-134): tubuh yang melompat menembus huruf, foto arsip `mono` di depan kaki huruf poster, bayangan subjek di dinding warna. Gaya mengubah komposisi, bukan hanya menambah tekstur.
- Pilih kata raksasa yang bermakna dan bentuknya cocok dengan subjek: huruf yang tertutup badan tidak boleh mengubah arti (FREE tanpa R terbaca FEE).

**Don't:**
- Meletakkan baris kata di depan baju atau badan subjek yang warnanya dekat dengan warna huruf: huruf kehilangan tepinya. Baris depan hanya menutup kaki.
- Memotong produk (kantong kopi, botol) di tepi kanvas atau menaruh logo dan teks di atas tangan subjek.
- Mencampur era: starburst 50-an, kotak-kotak 90-an, dan neon 80-an dalam satu postingan.
- Menumpuk ikon nostalgia sekaligus (smiley, mata kartun, hati, ceri, bunga, bintang, kaset, TV). Maks dua jenis dekorasi, maks tiga buah stiker.
- Mengarang sejarah brand: "Sejak 1975", "Est. 1980", atau "Resep asli nenek" hanya boleh bila faktanya ada di knowledge brand.
- Menulis "Retro", "Vintage", atau "Throwback" sebagai headline hanya untuk menegaskan gaya.
- Sepia menyeluruh, vignette gelap, goresan dan debu berat, kertas kusut atau lipat palsu, tepi terbakar.
- Grain di atas body, atau grain lebih dari 15% sehingga foto terlihat kotor.
- Registrasi meleset di semua teks, atau outline dan bayangan pada body.
- Bayangan dengan blur, glow, gradient matahari terbenam, krom, atau neon.
- Huruf "western", "saloon", atau "disko" berornamen berat yang tidak ada di Brand Kit.
- Memaksa `groovy` pada brand formal atau `iklan-cetak` pada brand yang tidak menjual produk.

**Risiko AI-slop khas gaya ini (harus dihindari):**
- Template generik ala marketplace template: krem + pink + smiley + kotak-kotak + kata "Good Vibes" yang bisa ditempel ke brand mana pun. Uji: bila logo diganti dan desain tetap masuk akal untuk brand lain, desain gagal.
- "Filter retro": foto biasa diberi sepia dan grain tebal tanpa perubahan komposisi atau tipografi.
- Ornamen sebagai pengisi ruang kosong: starburst kosong, bintang kilau di setiap sudut, garis bergelombang tanpa fungsi.
- Kata raksasa yang dipilih karena panjang, bukan karena bermakna. Kata raksasa harus kata kunci pesan.
- Kutipan gaya iklan lama yang dibuat-buat ("Dijamin nikmat sepanjang masa!"). Copy tetap mengikuti suara brand.

## 12. Kecocokan dengan Brand Kit

**Syarat agar cocok** (dipetakan ke `BrandCheck`):
- `light-color`: ada warna brand yang cukup terang untuk latar kertas. Dibutuhkan `iklan-cetak` dan `groovy`. Pesan bila gagal: "Gaya retro butuh warna terang untuk latar kertas; hanya sub-varian editorial hangat yang dipakai."
- `vivid-color`: ada warna brand jenuh-sedang untuk bidang hangat, starburst, atau pelangi. Pesan bila gagal: "Palet brand terlalu kalem untuk bidang warna retro; gaya tampil sebagai editorial bernuansa foto."
- Font heading punya bobot ≥ 700 atau berupa display (dicek manual atau lewat `--font-heading-weight-strong`). Untuk `groovy`, heading ideal `serif-display` bulat atau `rounded-sans`.
- Usulan cek tambahan `warm-color` (ada token dengan hue merah sampai kuning dan saturasi sedang): **perlu dibuat**. Palet dingin (biru, hijau) tetap bisa retro, seperti versi biru dan hijau kampanye "MOVE", tetapi kesannya lebih sejuk dan kehilangan rasa "hangat 70-an".

**Ditandai "kurang cocok untuk brand ini" bila:**
- Palet hanya hitam, putih, dan satu warna korporat dingin, atau palet gelap neon.
- Heading monospace, sans futuristik, atau hanya bobot tipis.
- Aturan brand melarang tekstur, ornamen, kemiringan, atau perubahan warna apa pun.
- Brand berada di kategori yang dihindari pada bagian 2.

**Cara beradaptasi bila tetap dipakai:**
1. Turun ke `editorial-hangat`: rasa retro dibawa oleh kata raksasa, pasangan huruf, foto bergrading hangat, dan teks kredit, tanpa starburst, pelangi, atau stiker.
2. Bila tekstur dilarang: hilangkan `Grain` dan `Halftone`. Andalkan foto yang memang sudah bergrain dan warna dipudarkan (bila diizinkan).
3. Bila gradient dilarang: tetap aman, karena semua pola memakai hard stop. Matikan gradasi kepadatan halftone.
4. Bila warna tidak boleh diubah: matikan helper `fade` dan pakai token apa adanya. Gunakan `neutral-light` sebagai kertas.
5. Bila `shape.radius` brand besar: bingkai dan panel ikut membulat. Bila 0: bingkai garis ganda bersudut tajam, cocok untuk `iklan-cetak`.
6. Aturan teks bebas brand (mis. "Logo selalu kanan bawah") menang atas posisi logo di pola bagian 9.
7. Bayangan kartu dan stiker mengikuti `--shape-shadow`. Bayangan offset keras hanya untuk headline `groovy` dan dianggap bagian dari huruf (ekstrusi). Bayangan subjek di dinding adalah perlakuan foto: keras untuk brand tanpa bayangan lembut (aman untuk "tanpa gradient"), lembut (blur) untuk brand berbayangan lembut.

**Penyesuaian fixture di render demo (T-134):**
- Kopi Lembayung: dinding `primary`, kata `neutral-light` (dilompati) atau `accent` (poster) karena kontrasnya tinggi di bidang gelap; logo selalu kanan bawah; bayangan keras.
- Seruni Skin: tidak punya aset subjek melompat, jadi pola pertamanya sampul editorial; palet kalem (dinding `secondary`, kata `primary`), `foto: natural` (kulit tanpa filter berlebihan), bayangan lembut, dan setiap slide hanya dua elemen visual utama (kata dan satu subjek atau foto).
- Ritme Run Club: angka, jarak, dan waktu ditulis besar (5:45 AM sebagai angka kunci heading, 10K sebagai kata poster, 5:45 AM sebagai kata sampul); aksen hanya sebagai blok sorot berteks gelap, tidak pernah teks di atas `primary`; subjek selalu bergerak.

## 13. Checklist QA gaya

Setiap butir dijawab ya atau tidak:
1. Postingan memakai tepat satu sub-varian, dan semua dekorasi berasal dari keluarga sub-varian itu (maks dua jenis).
2. Ada satu elemen dominan yang jelas (kata raksasa, headline display, atau subjek dengan produk), dan elemen kedua ≤ setengahnya.
3. Semua teks memenuhi kontras ≥ 4,5:1 (≥ 3:1 untuk ≥ 32 px) pada hasil akhir, termasuk teks di atas pola, warna pudar, dan grain.
4. Tidak ada teks di bawah 24 px dan tidak ada teks atau logo di luar safe margin.
5. Grain, bila ada, tidak terlihat sebagai noda pada ukuran tampilan normal dan tidak berada di atas teks body.
6. Tidak ada hitam murni atau putih murni pada bidang besar (kecuali token brand mewajibkan), dan tidak ada hue di luar token brand.
7. Tidak ada gradient visual, vignette, glow, atau bayangan berblur.
8. Proporsi warna sesuai tabel P9 sub-varian (dominan, kedua + gambar, aksen).
9. Jumlah elemen dan ruang kosong sesuai batas sub-varian (`editorial-hangat` ≤ 6 elemen; `iklan-cetak` dan `groovy` ≤ 7 elemen; semua ≥ 25% kosong; kalibrasi T-134).
10. Semua elemen miring memakai satu sudut yang sama, dan semua bayangan keras searah.
11. Gambar dari model tidak mengandung teks, huruf, angka, logo, label, atau bingkai film.
12. Desain terasa spesifik untuk brand ini, bukan template retro generik (headline, foto, dan perangkat terhubung ke pesan).
13. Ada satu ide besar yang terbaca tanpa membaca teks kecil, dan gambarnya bergaya (subjek bergerak, foto arsip, atau foto film), bukan foto studio polos.
14. Huruf dan subjek saling mengunci (berselang, kaki huruf tertutup ≤ ±35%, atau penutup disorot), kata tetap terbaca dengan arti yang sama, dan produk serta wajah tidak terpotong tepi atau tertutup huruf.

## 14. Referensi

**Referensi pemilik, folder `instagram reference design/retro vintage/`:**
- `097dcb16cd891ed6740fee07536527dd.jpg`: kisi sembilan iklan cetak lama dan parodinya; diambil starburst "neu!", pita warna, headline serif tebal dan script iklan, subjek tertawa memegang produk, bingkai oval potret ("A Clean Sweep!"), dan kepadatan khas iklan majalah untuk sub-varian `iklan-cetak`.
- `1758caf37e9254e52aa9b87568fd3dbc.jpg`: kampanye "MOVE" empat warna; diambil kata bertumpuk (MO / OO / VE) yang ditembus subjek melompat, tagline italic kecil, chip fitur bulat, dan bukti bahwa palet dingin pun bisa terasa retro (pola 6).
- `1a36ab78b352695d49fca3726fe5357a.jpg`: kisi poster bernuansa oranye ("ACE", "ROAMING", "July", "LUNCH TIMES", "TRACK NUMBER 09"); diambil kata raksasa grotesk condensed di atas foto arsip hitam-putih, subjek di depan atau di atas huruf, teks kredit kecil, bayangan keras di dinding warna, dan nomor halaman "3/10" untuk sub-varian `editorial-hangat`.
- `307e79c7352670a8ab657355fc1b2693.jpg`: feed agensi bernuansa oranye-krem; diambil foto editorial hangat, headline grotesk tebal pendek, kertas tertempel, dan cara menjaga satu palet di seluruh feed.
- `9f3c079cfcaf00af047a1674e944e030.jpg`: feed edukasi kreator; diambil pasangan serif italic dan grotesk tebal ("The STORY", "Five HOOKS"), foto konsep objek tunggal di padang rumput, grain film, dan baris kredit bawah dengan panah geser (pola 2 dan carousel).
- `afd7788684db76ecce6962e9a45d6f9e.jpg`: kumpulan template poster retro; diambil huruf serif bulat gemuk dengan outline dan bayangan offset, pelangi lengkung, kotak-kotak, stiker bulat, dan kisi panel untuk sub-varian `groovy`, sekaligus contoh risiko template generik yang harus dihindari.

**Pengukuran dan pemakaian di T-134.** Median keenam referensi di atas: warna dominan 43%, area tenang 66%, porsi selain dua warna utama 33%, 4–6 elemen; dari sinilah ambang QA bagian 4. Prinsip yang diambil, bukan desainnya: `1758…` menjadi pola 6 (`feed-kata-dilompati`), `1a36…` menjadi pola 3 (`feed-poster-huruf`), `9f3c…` menjadi pola 2 (`feed-sampul-editorial`). Tidak ada tata letak, teks, logo, atau gambar referensi yang disalin.

**Referensi akar, folder `instagram reference design/` (nomor urut nama file):**
- No. 13 (`1ff4090b559ec180864490e90463626d.jpg`): latar kuning mustard dominan dengan pasangan sans tebal dan script; diambil keberanian satu warna hangat sebagai dominan dan ruang kosong yang lapang.
- No. 28 (`7.jpg`): file yang identik dengan `9f3c079cfcaf00af047a1674e944e030.jpg`; memperkuat pola sampul majalah dan pasangan serif italic dengan grotesk.
- No. 30 (`781b4e67c15e98fea6497ea36f90f1fd.jpg`): latar krem dengan lengkung pita mustard dan biru di belakang subjek cut-out; diambil pita lengkung lebar sebagai dasar perangkat `Rainbow`.
- No. 41 (`a2accbec6ee99845ea90e09fe5c52814.jpg`): kolase objek cut-out bertepi putih di atas foto gelap; diambil efek tepi stiker (`CutoutEdge`) yang dipakai terbatas di `groovy`.
- No. 57 (`fc5473b131e7275526c82c1119036719.jpg`): feed pink-teal dengan kertas berpetak, stiker, dan coretan; diambil pita kotak-kotak dan stiker sebagai penanda carousel, serta pelajaran untuk membatasi jumlah dekorasi.

**Sumber web yang dibaca:**
- Envato Tuts+, gaya desain grafis 1950-an (mid-century modern, Swiss, Skandinavia): https://design.tutsplus.com/articles/50s-graphic-design-mid-century-modern-to-swiss-style--cms-38521
- Envato Tuts+, tren grafis 1970-an (huruf swash, groovy, bayangan, outline): https://design.tutsplus.com/articles/a-look-at-graphic-trends-that-define-the-70s-retro-fonts-text-effects-and-more--cms-34691
- Envato Tuts+, desain grafis 1990-an (grunge, anti-design, smiley rave): https://design.tutsplus.com/articles/why-90s-graphic-design-was-a-total-game-changer--cms-108390
- Made Good Designs, desain grafis 1980-an (Memphis, halftone diperbesar, saran memilih satu aliran): https://madegooddesigns.com/80s-graphic-design/
- Made Good Designs, sejarah dan pemakaian Cooper Black: https://madegooddesigns.com/cooper-black-font/
- RetroSupply, enam kesalahan desain retro (registrasi, tepi, halftone, ink starve, blend mode, distress): https://www.retrosupply.co/blogs/design/14921177-are-you-making-these-6-retro-design-mistakes
- ManyPixels, gaya-gaya vintage dan cara membuat retro tetap modern: https://www.manypixels.co/blog/inspiration/retro-design
- Wikipedia, Atomic Age (desain): https://en.wikipedia.org/wiki/Atomic_Age_(design)
- Wikipedia, Psychedelic art: https://en.wikipedia.org/wiki/Psychedelic_art
- Wikipedia, Saul Bass: https://en.wikipedia.org/wiki/Saul_Bass
- CSS-Tricks, grainy gradients dengan SVG `feTurbulence`: https://css-tricks.com/grainy-gradients/
- CSS { In Real Life }, pola halftone CSS: https://css-irl.info/css-halftone-patterns/
