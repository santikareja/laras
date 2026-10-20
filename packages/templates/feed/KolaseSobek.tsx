import type { SubjectInfo } from "@laras/shared";
import { Logo, Photo, Text } from "../primitives/index.ts";
import type { ImageTreatment } from "../primitives/Photo.tsx";
import { color, space } from "../primitives/vars.ts";
import { optionalSlot, type SlideProps, slot, type Template } from "../src/template.ts";
import {
  accentFont,
  InfoRow,
  type LineTone,
  Mono,
  Stack,
  stackLines,
  tornClip,
} from "../styles/brutalism/parts.tsx";
import { StyleBackdrop, StyleOverlay, styleTreatment } from "../styles/layer.tsx";

// Arketipe khas Brutalisme "Kolase sobek" (T-134; rujukan 365b…): kata raksasa dua nada di atas,
// lalu satu gambar disobek menjadi tiga pita kertas yang bergeser mendatar di atas cakram aksen
// besar. Sobekan adalah metaforanya: gerak (pelari yang terbelah kecepatan), kemasan yang dibuka,
// atau pesan yang dibongkar. Di kolom seberang: pernyataan besar dan CTA pita tinta; di kaki:
// baris info tiga kolom bergaya arsip dari copy. Kata raksasa 1–2 baris agar kolom teks selalu
// muat di bawahnya (Anton selebar area aman setinggi ±500 px).
// Lapisan: kertas → cakram → pita foto sobek → kata raksasa dan teks → baris info dan logo.

// Tiga pita bergeser mendatar ke arah kolom teks (px). Sobekan pertama jatuh di bawah wajah
// (leher atau dada; kemasan boleh tersobek), sobekan kedua di tengah sisanya.
const SHIFTS = [0, 44, -20];

function tearsFor(subject: SubjectInfo | undefined): [number, number] {
  if (!subject) return [0.37, 0.67];
  const { focus, box } = subject;
  // Wajah orang setengah badan bisa sampai separuh kotak alpha: sobekan pertama di bawahnya.
  const below = Math.max(focus.y + 0.24, box.top + 0.48 * (box.bottom - box.top));
  const first = Math.min(Math.max(below, 0.25), 0.62);
  return [first, first + (Math.max(box.bottom, first + 0.2) - first) / 2];
}

const GAP = 14;
// Lebar kolase dan kolom teks (bagian lebar area aman).
const COLLAGE = 0.56;
const COLUMN = 0.38;

const SOROT: Record<string, LineTone> = {
  aksen: "aksen",
  primer: "primer",
  blok: "blok",
  balik: "balik",
};

// Halftone dicetak di atas kertas: potongan subjek tetap utuh di atas cakram, titik 9 px.
function stripTreatment(treatment: ImageTreatment): ImageTreatment {
  return treatment.kind === "halftone"
    ? { ...treatment, pitch: 9, paper: "neutral-light" }
    : treatment;
}

function KolaseSobekSlide({ slots, options, style }: SlideProps) {
  const right = options.side === "right";
  const near = right ? "right" : "left";
  const far = right ? "left" : "right";
  const image = slot(slots, "image", "image");
  const seri = optionalSlot(slots, "seri", "text");
  const pernyataan = optionalSlot(slots, "pernyataan", "text");
  const cta = optionalSlot(slots, "cta", "text");
  const info = optionalSlot(slots, "info", "text");
  const logoTop = options.logo !== "bottom";
  const kata = slot(slots, "kata", "text").value;
  const lines = stackLines(kata);
  const tone = SOROT[options.sorot ?? "aksen"] ?? "aksen";
  const disc = options.bentuk !== "none";
  const treatment = stripTreatment(styleTreatment(style));
  const backdrop = style && { ...style, options: { ...style.options, grid: "no" } };
  const logo = <Logo slot="logo" src={slot(slots, "logo", "logo").src} height={6} />;
  // Batas pita (bagian tinggi kolase; gambar contain mengisi tinggi kolase).
  const [tearA, tearB] = tearsFor(image.subject);
  const edges = [0, tearA, tearB, 1];
  const STRIPS = SHIFTS.map((shift, i) => ({
    shift,
    top: edges[i] ?? 0,
    height: (edges[i + 1] ?? 1) - (edges[i] ?? 0),
  }));
  const discSize = `min(${Math.round((COLLAGE - 0.04) * 100)}cqw, 88cqh)`;
  return (
    <div
      style={{
        position: "relative",
        height: "100%",
        overflow: "hidden",
        background: color("neutral-light"),
      }}
    >
      <StyleBackdrop style={backdrop} subjectSide={near} />
      <div
        style={{
          position: "absolute",
          inset: "var(--space-safe)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: right ? "row-reverse" : "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: space(4),
            minHeight: space(6),
            marginBottom: space(4),
          }}
        >
          {seri ? (
            <div style={{ maxWidth: "62%" }}>
              <Mono slot="seri" color="neutral-dark" bar="accent" align={near}>
                {seri.value}
              </Mono>
            </div>
          ) : (
            <span />
          )}
          {logoTop && logo}
        </div>
        <Stack slot="kata" scale={lines.length >= 3 ? 1.4 : 2} tones={{ [lines.length - 1]: tone }}>
          {kata}
        </Stack>
        <div
          style={{
            position: "relative",
            flex: "1 1 auto",
            margin: `${space(4)} 0`,
            containerType: "size",
          }}
        >
          {disc && (
            <div
              data-qa-element="shape"
              data-qa-name="cakram"
              aria-hidden="true"
              style={{
                position: "absolute",
                [near]: `calc(${Math.round((COLLAGE / 2) * 100)}cqw - ${discSize} / 2)`,
                top: `calc(52cqh - ${discSize} / 2)`,
                width: `calc(${discSize})`,
                height: `calc(${discSize})`,
                borderRadius: "50%",
                background: color("accent"),
              }}
            />
          )}
          {/* Kolase: tiga pita kertas dari satu gambar, tepi sobek, bergeser mendatar. */}
          <div
            data-slot="image"
            data-slot-type="image"
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              [near]: 0,
              width: `${COLLAGE * 100}cqw`,
              containerType: "size",
            }}
          >
            {STRIPS.map((strip, i) => {
              const top = strip.top;
              const shift = right ? -strip.shift : strip.shift;
              return (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: pita ke-i, urutan tetap
                  key={i}
                  style={{
                    position: "absolute",
                    left: shift,
                    width: "100%",
                    top: `calc(${top * 100}cqh + ${i > 0 ? GAP / 2 : 0}px)`,
                    height: `calc(${strip.height * 100}cqh - ${i > 0 && i < STRIPS.length - 1 ? GAP : GAP / 2}px)`,
                    overflow: "hidden",
                    clipPath: tornClip(i + 1, i > 0, i < STRIPS.length - 1),
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      // Seukuran kolase, digeser setinggi posisi pita: potongan menyambung.
                      top: `calc(-${top * 100}cqh - ${i > 0 ? GAP / 2 : 0}px)`,
                      height: "100cqh",
                    }}
                  >
                    <Photo
                      src={image.src}
                      fit="contain"
                      treatment={treatment}
                      focus={i === 0 ? image.subject?.focus : undefined}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              [far]: 0,
              width: `${COLUMN * 100}cqw`,
              display: "flex",
              flexDirection: "column",
              gap: space(4),
              // Rata ke sisi luar kolom teks (seberang kolase).
              alignItems: right ? "flex-start" : "flex-end",
              textAlign: far,
            }}
          >
            {pernyataan && (
              <Text slot="pernyataan" font="heading" size={4} color="neutral-dark" strong>
                {pernyataan.value}
              </Text>
            )}
            <span style={{ flex: "1 1 0" }} />
            {cta && (
              <p
                data-slot="cta"
                data-slot-type="text"
                style={{
                  ...accentFont(),
                  margin: 0,
                  padding: `${space(2)} ${space(3)}`,
                  borderRadius: "var(--shape-radius)",
                  background: color("neutral-dark"),
                  color: color("neutral-light"),
                  fontSize: "var(--font-size-1)",
                  lineHeight: 1.2,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                }}
              >
                {cta.value}
              </p>
            )}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: right ? "row-reverse" : "row",
            alignItems: "flex-end",
            gap: space(5),
          }}
        >
          <div style={{ flex: "1 1 auto", minWidth: 0 }}>
            {info && (
              <InfoRow slot="info" head="primary">
                {info.value}
              </InfoRow>
            )}
          </div>
          {!logoTop && logo}
        </div>
      </div>
      <StyleOverlay style={style} surface="light" />
    </div>
  );
}

export const kolaseSobek: Template = {
  meta: {
    id: "feed-kolase-sobek",
    name: "Kolase sobek",
    format: "feed-4x5",
    description:
      "Kata raksasa dua nada di atas, satu subjek cut-out disobek menjadi tiga pita yang bergeser di atas cakram aksen besar (metafora gerak, kemasan dibuka, atau pesan dibongkar), pernyataan di kolom seberang, CTA pita tinta, dan baris info tiga kolom bergaya arsip di kaki. Untuk peluncuran, acara, dan pesan yang punya satu tindakan tegas.",
    slots: [
      {
        name: "kata",
        type: "text",
        required: true,
        description:
          "1–2 kata kunci dari copy, satu kata per baris (kata ≤ 2 karakter ikut baris sebelumnya); baris terakhir disorot",
        maxChars: 12,
      },
      {
        name: "image",
        type: "image",
        required: true,
        description:
          "Subjek cut-out yang disobek: orang bergerak (sobekan di bawah wajah) atau produk",
        aspectRatio: "4:5",
        cutout: true,
        composition: {
          base: "Cut-out of a person in motion (the tear runs below the face) or a product, whole and upright, readable when sliced into three horizontal strips.",
          option: "side",
          byValue: {
            left: "Turn the body and gaze slightly toward the right, where the text sits.",
            right: "Turn the body and gaze slightly toward the left, where the text sits.",
          },
        },
      },
      {
        name: "seri",
        type: "text",
        required: false,
        description: "Label teknis atas dari copy: seri, tempat, atau jadwal",
        maxChars: 30,
      },
      {
        name: "pernyataan",
        type: "text",
        required: false,
        description: "Pernyataan pendek dari copy di kolom teks, huruf heading besar",
        maxChars: 24,
      },
      { name: "cta", type: "text", required: false, description: "Ajakan pendek", maxChars: 20 },
      {
        name: "info",
        type: "text",
        required: false,
        description:
          "Baris info tiga kolom dari fakta copy, format 'Judul: isi' dipisah ' / ', isi ≤ 16 karakter",
        maxChars: 66,
      },
      { name: "logo", type: "logo", required: true, description: "Logo; varian primary" },
    ],
    options: [
      {
        name: "side",
        values: ["left", "right"],
        default: "left",
        description: "Sisi kolase; pernyataan dan CTA di sisi seberang",
      },
      {
        name: "sorot",
        values: ["aksen", "blok", "balik", "primer"],
        default: "aksen",
        description:
          "Baris terakhir kata raksasa: warna aksen (hanya bila aksen ≥ 3:1 di atas kertas), blok aksen, blok tinta knock-out, atau warna primer",
      },
      {
        name: "bentuk",
        values: ["disc", "none"],
        default: "disc",
        description:
          "Cakram aksen di belakang kolase; none untuk brand yang membatasi elemen visual",
      },
      {
        name: "logo",
        values: ["top", "bottom"],
        default: "top",
        description: "Logo di kepala atau di ujung baris info (mis. aturan kanan bawah)",
      },
    ],
  },
  Slide: KolaseSobekSlide,
};
