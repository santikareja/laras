import type { StylePattern } from "./index.ts";

// Flat Design (T-134): pola khas dari referensi Opay dan thryv. Pola pertama menjadi thumbnail.
export const flatDesignPatterns: StylePattern[] = [
  {
    // Subjek dan lingkar: bentuk besar pembawa metafora di belakang subjek yang menembus tepinya.
    id: "subjek-lingkar",
    cases: {
      // Biji kopi raksasa: penyangrai duduk di dalam biji yang ia sangrai sendiri.
      "kopi-lembayung": {
        archetype: "feed-subjek-lingkar",
        variant: "geometris",
        text: {
          info: "Tanggal sangrai di kemasan",
          headline: "Disangrai sendiri,",
          sorotan: "setiap minggu.",
          cta: "Ambil sekantong",
        },
        images: { image: "gaya-corporate.webp" },
        options: {
          bentuk: "biji",
          susunan: "samping",
          tone: "primary",
          sorot: "accent",
          garis: "none",
          pola: "riak",
          ikon: "calendar",
          bingkai: "garis",
          flip: "yes",
          logo: "bottom",
        },
        logo: "onDark",
      },
      // Lensa kaca pembesar: wajah di dalam lensa, "lihat kulitmu lebih dekat".
      "seruni-skin": {
        archetype: "feed-subjek-lingkar",
        variant: "organik",
        text: {
          info: "Konsultasi gratis 30 menit",
          headline: "Lihat kulitmu",
          sorotan: "lebih dekat.",
          cta: "Reservasi",
        },
        images: { image: "subjek.webp" },
        options: {
          bentuk: "lensa",
          susunan: "atas",
          tone: "secondary",
          sorot: "block",
          garis: "none",
          pola: "none",
          ikon: "clock",
          bingkai: "none",
          flip: "no",
          logo: "top",
        },
        logo: "primary",
      },
      // Matahari 05.45: pelari melintas di depan matahari terbit, garis lintasan putih.
      "ritme-run-club": {
        archetype: "feed-subjek-lingkar",
        variant: "geometris",
        text: {
          info: "Free. Any pace.",
          headline: "Sunday,",
          sorotan: "5:45 AM",
          cta: "Just show up",
        },
        images: { image: "subjek.webp" },
        options: {
          bentuk: "cakram",
          susunan: "samping",
          tone: "primary",
          sorot: "secondary",
          garis: "light",
          pola: "riak",
          ikon: "check",
          bingkai: "garis",
          flip: "no",
          logo: "top",
        },
        logo: "onDark",
      },
    },
  },
  {
    // Mitos atau fakta: subjek ragu di depan bentuk berlapis, mitos dicoret, fakta di kartu.
    id: "mitos-fakta",
    cases: {
      // Tangan menyodorkan kantong: tanggal sangrai di kemasan adalah buktinya.
      "kopi-lembayung": {
        archetype: "feed-mitos-fakta",
        variant: "geometris",
        text: {
          tanda: "Mitos vs Fakta",
          headline: "Biji kopi awet, kan?",
          labelMitos: "Mitos",
          mitos: "Tanggal sangrai tidak penting.",
          labelFakta: "Fakta",
          fakta: "Penting. Kami menulisnya di setiap kemasan.",
          cta: "Ambil sekantong",
        },
        images: { image: "interaksi.webp" },
        options: {
          bentuk: "busur",
          lapis: "dua",
          tone: "secondary",
          fakta: "kartu",
          flip: "yes",
          logo: "bottom",
        },
        logo: "primary",
      },
      // Seruni: dua elemen visual utama (subjek dan satu blob), fakta polos, tanpa tag.
      "seruni-skin": {
        archetype: "feed-mitos-fakta",
        variant: "organik",
        text: {
          headline: "Masih percaya ini?",
          labelMitos: "Mitos",
          mitos: "Sekali facial, kulit langsung beres.",
          labelFakta: "Fakta",
          fakta: "Hasil terlihat setelah beberapa minggu perawatan rutin.",
          cta: "Konsultasi gratis",
        },
        images: { image: "subjek.webp" },
        options: {
          bentuk: "blob",
          lapis: "satu",
          tone: "secondary",
          fakta: "polos",
          flip: "no",
          logo: "top",
        },
        logo: "primary",
      },
      // Pelatih menunjuk ke fakta; angka pace ditulis besar (aturan brand).
      "ritme-run-club": {
        archetype: "feed-mitos-fakta",
        variant: "pita",
        text: {
          tanda: "Myth vs Fact",
          headline: "Too slow to join?",
          labelMitos: "Myth",
          mitos: "Run clubs are only for fast runners.",
          labelFakta: "Fact",
          angka: "8:30",
          fakta: "min/km pace group walks and runs.",
          cta: "Join free",
        },
        images: { image: "gaya-corporate.webp" },
        options: {
          bentuk: "pita",
          lapis: "dua",
          tone: "neutral",
          fakta: "kartu",
          flip: "yes",
          logo: "top",
        },
        logo: "primary",
      },
    },
  },
  {
    // Tiket: voucher atau tiket datar raksasa yang ditembus subjek; nilai besar di potongan.
    id: "tiket",
    cases: {
      // Label harga: kantong dan sendok biji menembus tepi tiket.
      "kopi-lembayung": {
        archetype: "feed-tiket",
        variant: "geometris",
        text: {
          kepala: "Biji kopi 200 g",
          headline: "Sangrai",
          sorotan: "baru.",
          detail1: "Disangrai tiap minggu",
          detail2: "Antar radius 3 km",
          nilai: "Rp85.000",
          cta: "Pesan antar",
        },
        images: { image: "subjek.webp" },
        options: {
          tone: "primary",
          tiket: "secondary",
          sorot: "block",
          ikon1: "calendar",
          ikon2: "truck",
          pola: "riak",
          pijak: "garis",
          flip: "no",
          logo: "bottom",
        },
        logo: "onDark",
      },
      // Voucher konsultasi: terapis duduk menembus tepi voucher; dua elemen visual utama.
      "seruni-skin": {
        archetype: "feed-tiket",
        variant: "organik",
        text: {
          kepala: "Voucher",
          headline: "Konsultasi",
          sorotan: "kulit",
          detail1: "30 menit dengan terapis",
          detail2: "Reservasi via WhatsApp",
          nilai: "Gratis",
          cta: "Reservasi",
        },
        images: { image: "gaya-corporate.webp" },
        options: {
          tone: "primary",
          tiket: "secondary",
          sorot: "block",
          ikon1: "clock",
          ikon2: "chat",
          pola: "none",
          pijak: "dasar",
          flip: "no",
          logo: "top",
        },
        logo: "onDark",
      },
      // Tiket lomba: pelari melesat keluar dari tiket 10K; angka ditulis besar.
      "ritme-run-club": {
        archetype: "feed-tiket",
        variant: "geometris",
        text: {
          kepala: "Race entry",
          headline: "Ritme 10K",
          sorotan: "City Race",
          detail1: "Jakarta",
          detail2: "Funds water stations",
          nilai: "IDR 250K",
          cta: "Register",
        },
        images: { image: "interaksi.webp" },
        options: {
          tone: "primary",
          tiket: "secondary",
          sorot: "primary",
          ikon1: "pin",
          ikon2: "heart",
          pola: "riak",
          pijak: "garis",
          flip: "no",
          logo: "top",
        },
        logo: "onDark",
      },
    },
  },
];
