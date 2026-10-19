import { Logo, Photo, Text, type TextEffect } from "../primitives/index.ts";
import { FloorShadow } from "../primitives/Shapes.tsx";
import { color, space } from "../primitives/vars.ts";
import {
  optionalSlot,
  type ResolvedSlot,
  type SlideProps,
  slot,
  type Template,
} from "../src/template.ts";
import { StyleBackdrop, StyleOverlay, styleEffect, styleTreatment } from "../styles/layer.tsx";

// Arketipe A3 Satu objek (T-122, ADR-015; PRD 4 K1, K7): satu subjek cut-out kecil di bidang
// warna dengan bayangan lantai, ruang kosong luas, satu kalimat dan satu baris pendukung di atas.
// Pasangannya untuk foto konsep penuh adalah `feed-foto-konsep`.

const BACKGROUND = {
  neutral: "neutral-light",
  secondary: "secondary",
  primary: "primary",
  dark: "neutral-dark",
} as const;
const FLOOR = "16%";
// Sudut kosong untuk label gaya, berseberangan dengan logo.
const LABEL_CORNER = { "bottom-right": "bottom-left", "top-left": "bottom-right" } as const;

// Headline dan satu baris pendukung di tengah atas, dipakai juga oleh feed-foto-konsep.
export function TopCaption({
  slots,
  dark,
  effect,
}: {
  slots: Record<string, ResolvedSlot>;
  dark: boolean;
  // Efek teks gaya untuk headline (mis. glow Cyberpunk); tanpa gaya tidak ada.
  effect?: TextEffect | undefined;
}) {
  const body = optionalSlot(slots, "body", "text");
  return (
    <div
      data-qa-element="group"
      data-qa-name="teks"
      style={{
        position: "absolute",
        top: "calc(var(--space-safe) * 1.5)",
        left: "15%",
        right: "15%",
        display: "grid",
        gap: space(3),
        justifyItems: "center",
        textAlign: "center",
      }}
    >
      <Text
        slot="headline"
        as="h1"
        font="heading"
        size={5}
        color={dark ? "neutral-light" : "primary"}
        {...(effect ? { effect } : {})}
      >
        {slot(slots, "headline", "text").value}
      </Text>
      {body && (
        <Text
          slot="body"
          font="body"
          size={2}
          color={dark ? "neutral-light" : "neutral-dark"}
          measure={40}
          balance
        >
          {body.value}
        </Text>
      )}
    </div>
  );
}

// Logo di posisi yang dipilih opsi (aturan brand).
export function PlacedLogo({ src, at }: { src: string; at: string }) {
  return (
    <div
      style={{
        position: "absolute",
        ...(at === "top-left"
          ? { top: "var(--space-safe)", left: "var(--space-safe)" }
          : at === "bottom-right"
            ? { bottom: "var(--space-safe)", right: "var(--space-safe)" }
            : { bottom: "var(--space-safe)", left: 0, right: 0 }),
        display: "flex",
        justifyContent: "center",
      }}
    >
      <Logo slot="logo" src={src} height={5} />
    </div>
  );
}

function SatuObjekSlide({ slots, options, style }: SlideProps) {
  const dark = options.tone === "primary" || options.tone === "dark";
  const logoAt = options.logo ?? "bottom-center";
  const image = slot(slots, "image", "image");
  const tone = BACKGROUND[(options.tone ?? "neutral") as keyof typeof BACKGROUND];
  return (
    <div
      // Komposisi terpusat: rule of thirds tidak dicek (keputusan pemilik T-130).
      data-qa-composition="center"
      style={{
        position: "relative",
        height: "100%",
        overflow: "hidden",
        background: color(tone ?? "neutral-light"),
      }}
    >
      <StyleBackdrop style={style} floor={FLOOR} />
      <FloorShadow dark={dark} />
      <div
        style={{ position: "absolute", left: "20%", right: "20%", bottom: FLOOR, height: "50%" }}
      >
        <Photo
          slot="image"
          src={image.src}
          fit="contain"
          treatment={styleTreatment(style)}
          focus={image.subject?.focus}
        />
      </div>
      <TopCaption slots={slots} dark={dark} effect={styleEffect(style, "headline")} />
      <PlacedLogo src={slot(slots, "logo", "logo").src} at={logoAt} />
      <StyleOverlay
        style={style}
        label={optionalSlot(slots, "label", "text")?.value}
        corner={LABEL_CORNER[logoAt as keyof typeof LABEL_CORNER] ?? "bottom-left"}
        floor={FLOOR}
        surface={dark ? "dark" : "light"}
      />
    </div>
  );
}

export const satuObjek: Template = {
  meta: {
    id: "feed-satu-objek",
    name: "Satu objek",
    format: "feed-4x5",
    description:
      "Satu subjek cut-out kecil di bidang warna dengan ruang kosong luas, satu kalimat dan satu baris pendukung di atas. Untuk produk atau orang dengan pesan sederhana yang tenang.",
    slots: [
      {
        name: "image",
        type: "image",
        required: true,
        description: "Subjek cut-out berlatar transparan",
        aspectRatio: "4:5",
        cutout: true,
      },
      {
        name: "headline",
        type: "text",
        required: true,
        description: "Headline dari copy",
        maxChars: 40,
      },
      {
        name: "body",
        type: "text",
        required: false,
        description: "Satu baris dari copy",
        maxChars: 70,
      },
      {
        name: "label",
        type: "text",
        required: false,
        description:
          "Label kecil dari copy (tanggal, lokasi, edisi) untuk gaya yang memakainya; tanpa gaya tidak tampil",
        maxChars: 24,
      },
      {
        name: "logo",
        type: "logo",
        required: true,
        description: "Logo; varian onDark bila tone primary atau dark",
      },
    ],
    options: [
      {
        name: "tone",
        values: ["neutral", "secondary", "primary", "dark"],
        default: "neutral",
        description: "Warna bidang; dark = netral gelap (mis. gaya Cyberpunk)",
      },
      {
        name: "logo",
        values: ["bottom-center", "bottom-right", "top-left"],
        default: "bottom-center",
        description: "Letak logo, mengikuti aturan brand",
      },
    ],
  },
  Slide: SatuObjekSlide,
};
