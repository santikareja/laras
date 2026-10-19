# Foto contoh untuk `pnpm render:demo`

Satu foto per brand fixture, dipakai sebagai aset job (`foto.jpg`, 1122 × 1402, JPG kualitas 85) untuk slot `image` template. Semua dibuat dengan Codex CLI 0.163.0 (tool bawaan `image_gen`, login ChatGPT) atas izin pemilik, lalu dikonversi dari PNG. Tanpa teks, huruf, logo, atau watermark (diperiksa langsung).

| Brand | Asal | Prompt (ringkas) |
|---|---|---|
| `kopi-lembayung` | Uji T-101, 2026-10-18 | Cangkir kopi di atas kain linen dengan palet brand |
| `seruni-skin` | T-108, 2026-10-18, thread `01a14f80-220b-7111-a5cb-ab8f9522ebdc` | Pipi dan rahang dengan tekstur kulit asli, botol tetes tanpa label, cahaya jendela, palet brand |
| `ritme-run-club` | T-108, 2026-10-18, thread `01a14f80-e144-7990-a7a4-3e668d3444ee` | Tiga pelari beragam bentuk tubuh sedang berlari saat matahari terbit, pakaian polos warna brand, tanpa nomor dada |

| `seruni-skin` (`foto-4x5.jpg`) | T-109, 2026-10-18, thread `01a14f8d-d0c7-76d1-9534-e91e0eb516b2` | Foto utuh dari tepi ke tepi: jari mengoleskan serum ke pipi, mata di luar bingkai, botol tanpa label, jubah biru pucat |

Catatan: `seruni-skin/foto.jpg` berupa foto 3:2 yang ditempel di atas latar polos (garis potongan di sekitar y 265 dan y 1130). Aman untuk slot 3:2 yang dipotong di tengah, tetapi tidak untuk foto penuh; slot 4:5 memakai `foto-4x5.jpg`. `render:demo` memilih `foto-<rasio>.jpg` bila ada, selain itu `foto.jpg`.

## Aset prototipe arketipe (T-122)

Dipakai `pnpm render:demo` untuk arketipe (`scripts/archetype-content.ts`), semua 1122 × 1402. Cut-out disimpan sebagai WebP beralpha (kualitas 88, alpha 100) setelah alpha ≥ 250 dinormalisasi menjadi 255 (KNOWLEDGE, T-121).

| File | Asal | Prompt (ringkas) |
|---|---|---|
| `kopi-lembayung/subjek.webp` | T-121 V1, 2026-10-19 | Kantong kopi kraft berlabel kosong, sendok kayu berisi biji, latar transparan |
| `ritme-run-club/subjek.webp` | T-121 V2, 2026-10-19 | Perempuan Indonesia berlari seluruh tubuh, singlet biru brand, latar transparan |
| `seruni-skin/konsep.jpg` | T-121 V3, 2026-10-19 | Persik di bawah kaca pembesar, latar polos `#EAF1F4`, 40% atas kosong (JPG 85) |
| `seruni-skin/subjek.webp` | T-122, 2026-10-19 | Perempuan Indonesia setengah badan menyentuh pipi, tekstur kulit asli, atasan biru pucat, latar transparan |
| `kopi-lembayung/interaksi.webp` | T-122 v3, 2026-10-19 | Tangan mengangkat kantong kopi kraft berlabel kosong, biji berjatuhan dari atas kantong, lengan masuk dari tepi bawah, latar transparan |
| `seruni-skin/interaksi.webp` | T-122 v3, 2026-10-19 | Perempuan Indonesia sebatas dada memegang kaca pembesar di depan pipi (tekstur kulit asli diperbesar), latar transparan |
| `ritme-run-club/interaksi.webp` | T-122 v3, 2026-10-19 | Laki-laki Indonesia melompat saat berlari, sudut rendah, seluruh tubuh, singlet biru brand, latar transparan |
