import type { StylePattern } from "./index.ts";

// Vintage/Retro (T-134). Pola pertama menjadi thumbnail gaya.
export const retroVintagePatterns: StylePattern[] = [
  {
    // Kata yang dilompati (rujukan kampanye MOVE): subjek melompat keluar dari kata kunci.
    id: "dilompati",
    cases: {
      "kopi-lembayung": {
        archetype: "feed-kata-dilompati",
        variant: "editorial-hangat",
        text: {
          kata: "HORE",
          tagline: "sangrai minggu ini sudah datang.",
          angka: "Rp85.000",
          keterangan: "200 g, tanggal sangrai di kemasan",
        },
        images: { image: "gaya-retro.webp" },
        options: {
          tone: "primary",
          depan: "bawah",
          side: "center",
          kalimat: "kiri",
          logo: "bottom-right",
        },
        logo: "onDark",
      },
      // Seruni tanpa subjek melompat: sampul editorial dengan potret 70-an (pola lain, T-134).
      "seruni-skin": {
        archetype: "feed-sampul-editorial",
        variant: "editorial-hangat",
        styleOptions: { foto: "natural" },
        text: {
          pembuka: "kulit butuh",
          kata: "WAKTU",
          headline: "Umumnya beberapa minggu,",
          sorot: "dengan perawatan rutin.",
          kredit: "Konsultasi gratis, Surabaya",
        },
        images: { image: "gaya-retro.jpg" },
        options: { zona: "atas", tinta: "gelap", skala: "sedang", rata: "kiri" },
        logo: "onDark",
      },
      "ritme-run-club": {
        archetype: "feed-kata-dilompati",
        variant: "editorial-hangat",
        text: {
          kata: "FREE",
          tagline: "Sunday group run. Every pace.",
          angka: "5:45 AM",
          keterangan: "Sundays in Jakarta. No sign-up.",
        },
        images: { image: "gaya-retro.webp" },
        options: {
          tone: "secondary",
          baris: "utuh",
          depan: "bawah",
          side: "center",
          kalimat: "kanan",
          logo: "bottom-right",
        },
        logo: "primary",
      },
    },
  },
  {
    // Poster huruf (rujukan poster 70-an jingga): kata raksasa, subjek di depan kaki hurufnya.
    id: "poster",
    cases: {
      "kopi-lembayung": {
        archetype: "feed-poster-huruf",
        variant: "editorial-hangat",
        styleOptions: { foto: "mono" },
        text: {
          kata: "SANGRAI SENDIRI",
          headline: "Setiap minggu, tanggalnya di kemasan.",
          kolom1: "Biji petani Jawa Barat",
          kolom2: "Kemasan 200 g, Rp85.000",
          kredit: "Biji kopi sangrai",
          info: "Bandung",
          cta: "Ambil sekantong",
        },
        images: { image: "gaya-corporate.webp" },
        options: { tone: "primary", huruf: "accent", side: "left", bayangan: "keras" },
        logo: "onDark",
      },
      "seruni-skin": {
        archetype: "feed-poster-huruf",
        variant: "editorial-hangat",
        styleOptions: { foto: "natural" },
        text: {
          kata: "30",
          headline: "menit untuk mengenal kulitmu dulu.",
          kolom1: "Konsultasi kulit, gratis",
          kolom2: "Terapis bersertifikat",
          kolom3: "Reservasi via WhatsApp",
          kredit: "Konsultasi kulit",
          info: "Surabaya",
        },
        images: { image: "gaya-corporate.webp" },
        options: { tone: "secondary", side: "right", bayangan: "lembut" },
        logo: "primary",
      },
      "ritme-run-club": {
        archetype: "feed-poster-huruf",
        variant: "editorial-hangat",
        styleOptions: { foto: "mono" },
        text: {
          kata: "10K",
          headline: "Ritme City Race. Entry IDR 250,000.",
          kolom1: "Every pace welcome",
          kolom2: "Fees fund Sunday water",
          kredit: "City race",
          info: "Jakarta",
          cta: "Save your spot",
        },
        images: { image: "gaya-cyberpunk.webp" },
        options: { tone: "primary", side: "left", bayangan: "keras" },
        logo: "onDark",
      },
    },
  },
  {
    // Sampul editorial (rujukan feed edukasi berbutir): kata raksasa di area tenang foto film.
    id: "sampul",
    cases: {
      "kopi-lembayung": {
        archetype: "feed-sampul-editorial",
        variant: "editorial-hangat",
        text: {
          pembuka: "pagi yang",
          kata: "PELAN",
          headline: "lebih enak ditemani",
          sorot: "kopi susu gula aren.",
          kredit: "Rp22.000, buka 06.30-21.00",
        },
        images: { image: "foto.jpg" },
        options: { zona: "atas", tinta: "gelap", rata: "kiri" },
        logo: "primary",
      },
      "seruni-skin": {
        archetype: "feed-sampul-editorial",
        variant: "editorial-hangat",
        styleOptions: { foto: "natural" },
        text: {
          pembuka: "sebelum merawat,",
          kata: "KENALI",
          headline: "kulitmu dulu. Konsultasi",
          sorot: "30 menit, gratis.",
          kredit: "Studio kulit, Surabaya",
        },
        images: { image: "konsep.jpg" },
        options: { zona: "atas", tinta: "gelap", logo: "kiri", rata: "kiri" },
        logo: "primary",
      },
      "ritme-run-club": {
        archetype: "feed-sampul-editorial",
        variant: "editorial-hangat",
        text: {
          pembuka: "Sunday,",
          kata: "5:45 AM",
          headline: "Every pace welcome.",
          sorot: "Free, no sign-up.",
          kredit: "Free group run, Jakarta",
        },
        images: { image: "foto.jpg" },
        options: { zona: "atas", alas: "bidang", skala: "besar", rata: "kiri" },
        logo: "onDark",
      },
    },
  },
];
