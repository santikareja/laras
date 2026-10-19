import type { IconName } from "../primitives/Icons.tsx";
import { Display, IconDisc, Logo, Photo, Text } from "../primitives/index.ts";
import { type ColorToken, color, space } from "../primitives/vars.ts";
import { CANVAS } from "../src/geometry.ts";
import { optionalSlot, type SlideProps, slot, type Template } from "../src/template.ts";
import {
  AccentText,
  type ContactItem,
  ContactLine,
  frameSubject,
  px,
  tidy,
} from "../styles/corporate-clean/parts.tsx";
import { StyleBackdrop, StyleOverlay, styleEffect, styleTreatment } from "../styles/layer.tsx";

// Arketipe Kata kunci (T-134; PANDUAN Corporate Clean pola F varian kata raksasa, referensi e8d6).
// Ide besarnya "kata yang menjadi keahlian": satu kata kunci layanan selebar kanvas, dan orang
// yang menjalankannya berdiri di depannya sehingga kepala dan bahunya menutup bagian bawah huruf.
// Di bawahnya bukti tersusun: headline, daftar tiga layanan berikon di panel brand yang ditembus
// tubuh subjek, kartu angka (K8) yang melayang di depan subjek, dan baris kontak di kaki panel.
// Tujuh elemen: logo, kata kunci, kop teks, subjek, daftar, kartu angka, kontak.

// Kepala subjek mulai di titik ini (pecahan tinggi kata kunci): subjek menutup bagian bawah huruf.
const HEAD_AT = 0.5;
// Kotak subjek (px kanvas): tinggi kotak alpha dan sisi kanan; subjek berada di kanan, menghadap
// atau bergerak ke kanan sesuai aset.
const SUBJECT_HEIGHT = 1000;
const SUBJECT_EDGE = 500;
const SUBJECT_OUTER = CANVAS.width - 24;
// Kolom kiri untuk teks dan daftar (px dari tepi kiri kanvas).
const COLUMN = 484;
// Kata kunci di bawah baris logo (juga bila logo di kanan bawah, agar sama di seluruh feed).
const KEYWORD_TOP = 80;
// Panel bukti menempel ke tepi bawah kanvas; lis kontak setinggi STRIP di atas safe margin bawah.
const PANEL_HEIGHT = 500;
const STRIP = 76;

const ICONS = [
  "check",
  "shield",
  "clock",
  "calendar",
  "truck",
  "user",
  "star",
  "heart",
  "leaf",
  "eye",
  "chart",
  "target",
  "card",
  "bag",
  "home",
];
const CONTACT_ICONS = ["chat", "phone", "pin", "mail", "globe", "clock", "calendar", "truck"];

function KataKunciSlide({ slots, options, style }: SlideProps) {
  const field = options.tone === "secondary" ? "secondary" : "neutral-light";
  const solid = options.panel !== "none";
  // Di atas panel brand teks terang; tanpa panel teks gelap di atas bidang.
  const ink: ColorToken = solid ? "neutral-light" : "neutral-dark";
  // Lis kontak: warna panel, atau warna terang lain sebagai lantai bila tanpa panel.
  const strip: ColorToken = solid
    ? "primary"
    : field === "secondary"
      ? "neutral-light"
      : "secondary";
  const logoBottom = options.logo === "bottom-right";
  const image = slot(slots, "image", "image");
  const subjudul = optionalSlot(slots, "subjudul", "text");
  const angka = optionalSlot(slots, "angka", "text");
  const angkaLabel = optionalSlot(slots, "angkaLabel", "text");
  const points = (["poin1", "poin2", "poin3"] as const).flatMap((name, i) => {
    const value = optionalSlot(slots, name, "text");
    const icon = (options[`ikon${i + 1}`] ?? "check") as IconName;
    return value ? [{ icon, label: value.value, slot: name }] : [];
  });
  const contacts = (["kontak1", "kontak2"] as const).flatMap((name, i): ContactItem[] => {
    const value = optionalSlot(slots, name, "text");
    const icon = (options[`ikonKontak${i + 1}`] ?? (i === 0 ? "chat" : "pin")) as IconName;
    return value ? [{ icon, text: value.value, slot: name }] : [];
  });
  const logo = <Logo slot="logo" src={slot(slots, "logo", "logo").src} height={5} />;

  // Ukuran subjek tetap; letak vertikalnya mengikuti tinggi kata kunci hasil fit (CSS).
  const frame = frameSubject({
    subject: image.subject,
    top: 0,
    floor: SUBJECT_HEIGHT,
    side: "right",
    edge: SUBJECT_EDGE,
    limit: SUBJECT_OUTER,
  });

  return (
    <div
      style={{ position: "relative", height: "100%", overflow: "hidden", background: color(field) }}
    >
      <StyleBackdrop style={style} subjectSide="right" />
      {!logoBottom && (
        <div style={{ position: "absolute", top: "var(--space-safe)", left: "var(--space-safe)" }}>
          {logo}
        </div>
      )}

      {/* Kata kunci dan subjek: kepala menutup bagian bawah huruf. */}
      <div
        style={{
          position: "absolute",
          top: `calc(var(--space-safe) + ${KEYWORD_TOP}px)`,
          left: "var(--space-safe)",
          right: "var(--space-safe)",
        }}
      >
        <Display
          slot="kata"
          font="heading"
          scale={1.8}
          align="left"
          color="primary"
          effect={styleEffect(style, "display")}
        >
          {slot(slots, "kata", "text").value}
        </Display>
        <div
          style={{
            position: "absolute",
            zIndex: 2,
            top: `calc(${HEAD_AT * 100}% - ${px(frame.subject.top - frame.top)})`,
            left: `calc(${px(frame.left)} - var(--space-safe))`,
            width: px(frame.width),
            height: px(frame.height),
          }}
        >
          <Photo
            slot="image"
            src={image.src}
            fit="contain"
            treatment={styleTreatment(style)}
            focus={image.subject?.focus}
          />
        </div>
      </div>

      {/* Kop teks di kolom kiri, tepat di atas panel bukti. */}
      <div
        style={{
          position: "absolute",
          left: "var(--space-safe)",
          bottom: PANEL_HEIGHT + 40,
        }}
      >
        <div
          data-qa-element="group"
          data-qa-name="kop teks"
          style={{
            width: `calc(${COLUMN}px - var(--space-safe))`,
            display: "grid",
            gap: space(3),
          }}
        >
          <Text slot="headline" as="h1" font="heading" size={4} color="neutral-dark">
            {tidy(slot(slots, "headline", "text").value)}
          </Text>
          {subjudul && (
            <Text slot="subjudul" font="body" size={1} color="neutral-dark" measure={34}>
              {subjudul.value}
            </Text>
          )}
        </div>
      </div>

      {/* Panel bukti di kaki kanvas, ditembus tubuh subjek; daftar layanan di kolom kiri. */}
      <div
        style={{
          position: "absolute",
          zIndex: 1,
          left: "var(--space-safe)",
          right: "var(--space-safe)",
          bottom: 0,
          height: PANEL_HEIGHT,
          boxSizing: "border-box",
          padding: `${space(5)} ${space(5)} 0`,
          borderRadius: "var(--shape-radius) var(--shape-radius) 0 0",
          background: solid ? color("primary") : undefined,
        }}
      >
        {points.length > 0 && (
          <div
            data-qa-element="group"
            data-qa-name="daftar"
            style={{
              width: `calc(${COLUMN}px - var(--space-safe) - ${space(5)})`,
              display: "grid",
            }}
          >
            {points.map((item, i) => (
              <div
                key={item.slot}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: space(3),
                  padding: `${space(2)} 0`,
                  borderTop:
                    i > 0
                      ? `2px solid color-mix(in srgb, ${color(ink)} 24%, transparent)`
                      : undefined,
                }}
              >
                <IconDisc
                  name={item.icon}
                  size={32}
                  ratio={2}
                  stroke={3}
                  background={solid ? "neutral-light" : "primary"}
                  color={solid ? "primary" : "neutral-light"}
                />
                <Text slot={item.slot} font="body" size={1} color={ink} strong>
                  {item.label}
                </Text>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lis kontak di depan kaki subjek (subjek berdiri di balik lis), garis tipis di atasnya. */}
      {(contacts.length > 0 || logoBottom) && (
        <div
          style={{
            position: "absolute",
            zIndex: 3,
            left: "var(--space-safe)",
            right: "var(--space-safe)",
            bottom: 0,
            height: `calc(var(--space-safe) + ${STRIP}px)`,
            boxSizing: "border-box",
            display: "flex",
            alignItems: "flex-start",
            padding: `${space(3)} ${space(3)} 0`,
            borderTop: `2px solid color-mix(in srgb, ${color(ink)} 32%, transparent)`,
            background: color(strip),
          }}
        >
          <div data-qa-element="group" data-qa-name="kontak" style={{ width: "100%" }}>
            <ContactLine
              items={contacts}
              color={ink}
              iconBackground={solid ? "neutral-light" : "primary"}
              iconColor={solid ? "primary" : "neutral-light"}
              divider={ink}
            >
              {logoBottom ? logo : undefined}
            </ContactLine>
          </div>
        </div>
      )}

      {/* Kartu angka melayang di depan sisi luar subjek (bukti dari knowledge). */}
      {angka && (
        <div
          data-qa-element="group"
          data-qa-name="kartu angka"
          style={{
            position: "absolute",
            zIndex: 3,
            right: "var(--space-safe)",
            bottom: `calc(var(--space-safe) + ${contacts.length > 0 || logoBottom ? STRIP + 32 : 0}px)`,
            maxWidth: 460,
            boxSizing: "border-box",
            display: "grid",
            gap: space(1),
            padding: `${space(4)} ${space(5)}`,
            borderRadius: "var(--shape-radius)",
            border: "var(--shape-stroke) solid var(--color-primary)",
            background: color("neutral-light"),
            boxShadow: "var(--shape-shadow)",
          }}
        >
          <Text slot="angka" as="p" font="heading" size={4} color="primary">
            {angka.value}
          </Text>
          {angkaLabel && (
            <AccentText slot="angkaLabel" color="neutral-dark">
              {angkaLabel.value}
            </AccentText>
          )}
        </div>
      )}
      <div style={{ position: "absolute", inset: 0, zIndex: 4, pointerEvents: "none" }}>
        <StyleOverlay style={style} corner="top-right" surface="light" />
      </div>
    </div>
  );
}

export const kataKunci: Template = {
  meta: {
    id: "feed-kata-kunci",
    name: "Kata kunci",
    format: "feed-4x5",
    description:
      "Kata yang menjadi keahlian: satu kata kunci layanan selebar kanvas dengan orang yang menjalankannya berdiri di depannya (kepala menutup bagian bawah huruf), lalu headline, panel brand berisi daftar tiga layanan berikon yang ditembus tubuh subjek, kartu angka dari knowledge, dan kontak di kaki panel. Untuk layanan yang bisa dirangkum satu kata atau angka, dengan bukti konkret.",
    slots: [
      {
        name: "image",
        type: "image",
        required: true,
        description:
          "Orang nyata seluruh atau tiga perempat badan (cut-out) yang menjalankan layanan, memegang alat kerja atau produk",
        aspectRatio: "4:5",
        cutout: true,
      },
      {
        name: "kata",
        type: "text",
        required: true,
        description: "Satu kata kunci atau angka layanan, ditampilkan raksasa",
        maxChars: 9,
      },
      {
        name: "headline",
        type: "text",
        required: true,
        description: "Headline 2–3 baris di kolom kiri",
        maxChars: 34,
      },
      {
        name: "subjudul",
        type: "text",
        required: false,
        description: "Satu kalimat pendukung, maksimal dua baris",
        maxChars: 56,
      },
      {
        name: "poin1",
        type: "text",
        required: false,
        description: "Layanan atau fakta 1",
        maxChars: 22,
      },
      {
        name: "poin2",
        type: "text",
        required: false,
        description: "Layanan atau fakta 2",
        maxChars: 22,
      },
      {
        name: "poin3",
        type: "text",
        required: false,
        description: "Layanan atau fakta 3",
        maxChars: 22,
      },
      {
        name: "angka",
        type: "text",
        required: false,
        description: "Angka bukti dari knowledge (harga, durasi, jumlah anggota)",
        maxChars: 9,
      },
      {
        name: "angkaLabel",
        type: "text",
        required: false,
        description: "Keterangan angka 2–3 kata, kapital dengan font aksen",
        maxChars: 18,
      },
      {
        name: "kontak1",
        type: "text",
        required: false,
        description: "Kontak atau info praktis pertama",
        maxChars: 20,
      },
      {
        name: "kontak2",
        type: "text",
        required: false,
        description: "Kontak atau info praktis kedua",
        maxChars: 20,
      },
      {
        name: "logo",
        type: "logo",
        required: true,
        description: "Logo; pakai onDark bila logo di kaki panel brand (logo bottom-right)",
      },
    ],
    options: [
      {
        name: "tone",
        values: ["neutral", "secondary"],
        default: "neutral",
        description: "Warna bidang di belakang kata kunci",
      },
      {
        name: "panel",
        values: ["solid", "none"],
        default: "solid",
        description:
          "Panel brand di bawah (solid), atau tanpa panel bila brand membatasi jumlah elemen visual utama",
      },
      {
        name: "logo",
        values: ["top-left", "bottom-right"],
        default: "top-left",
        description: "Logo di kiri atas, atau di kanan bawah bersama kontak (aturan brand)",
      },
      { name: "ikon1", values: ICONS, default: "check", description: "Ikon poin 1" },
      { name: "ikon2", values: ICONS, default: "shield", description: "Ikon poin 2" },
      { name: "ikon3", values: ICONS, default: "star", description: "Ikon poin 3" },
      {
        name: "ikonKontak1",
        values: CONTACT_ICONS,
        default: "chat",
        description: "Ikon kontak pertama",
      },
      {
        name: "ikonKontak2",
        values: CONTACT_ICONS,
        default: "pin",
        description: "Ikon kontak kedua",
      },
    ],
  },
  Slide: KataKunciSlide,
};
