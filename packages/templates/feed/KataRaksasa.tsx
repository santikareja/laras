import { Display, Logo, Photo, Sticker, Text } from "../primitives/index.ts";
import { color, space } from "../primitives/vars.ts";
import {
  boxFromPercent,
  containedFocus,
  textBelowFocus,
  thirdsPlacement,
} from "../src/geometry.ts";
import { optionalSlot, type SlideProps, slot, type Template } from "../src/template.ts";
import { StyleBackdrop, StyleOverlay, styleEffect, styleTreatment } from "../styles/layer.tsx";

// Arketipe A1 Kata raksasa (T-122, ADR-015; PRD 4 K2, K3): kata kunci raksasa di belakang subjek
// cut-out di atas bidang warna brand. Ukuran kata dipaskan renderer (fit-to-width); headline dan
// CTA berada di sisi seberang subjek, di bawah bila fokus subjek tinggi dan di tengah bila rendah
// (PRD 4 P8). Logo mengikuti aturan brand lewat opsi.

const SHIFT: Record<string, number> = { left: -16, center: 0, right: 16 };
// Satu jarak tepi untuk semua elemen sudut, ditambah satu langkah karena stiker dimiringkan.
const EDGE = `calc(var(--space-safe) + ${space(1)})`;
const SUBJECT = { bottom: -5, width: 100, height: 84 };

function KataRaksasaSlide({ slots, options, style }: SlideProps) {
  const dark = options.tone === "primary";
  const cta = optionalSlot(slots, "cta", "text");
  const image = slot(slots, "image", "image");
  const side = options.side ?? "center";
  const shift = SHIFT[side] ?? 0;
  const textRight = side === "left";
  // Subjek di sisi kiri atau kanan ditempatkan agar fokusnya di titik sepertiga (P8, T-131),
  // tanpa naik agar tidak menutup huruf kata raksasa; subjek di tengah adalah komposisi terpusat.
  const box = boxFromPercent({ ...SUBJECT, left: shift });
  const placement =
    image.subject && side !== "center"
      ? thirdsPlacement(box, 4 / 5, image.subject, side === "left" ? "left" : "right", false)
      : undefined;
  const focus =
    placement?.focus ?? (image.subject ? containedFocus(box, 4 / 5, image.subject) : undefined);
  const textBottom = focus ? textBelowFocus(focus.y) : true;
  const logoBottomRight = options.logo === "bottom-right";
  return (
    <div
      data-qa-composition={side === "center" ? "center" : undefined}
      style={{
        position: "relative",
        height: "100%",
        overflow: "hidden",
        background: color(dark ? "primary" : "secondary"),
      }}
    >
      <StyleBackdrop
        style={style}
        {...(side === "left" || side === "right" ? { subjectSide: side } : {})}
      />
      <div style={{ position: "absolute", top: "17%", left: EDGE, right: EDGE }}>
        <Display
          slot="kata"
          font="heading"
          scale={2.6}
          color={dark ? "accent" : "primary"}
          effect={styleEffect(style, "display")}
        >
          {slot(slots, "kata", "text").value}
        </Display>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: `${SUBJECT.bottom}%`,
          height: `${SUBJECT.height}%`,
          transform: `translateX(${shift}%)${placement?.transform ? ` ${placement.transform}` : ""}`,
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
      <div
        style={{
          position: "absolute",
          ...(logoBottomRight ? { right: EDGE, bottom: EDGE } : { left: EDGE, top: EDGE }),
        }}
      >
        <Logo slot="logo" src={slot(slots, "logo", "logo").src} height={6} />
      </div>
      <div
        style={{
          position: "absolute",
          width: "34%",
          ...(textRight ? { right: EDGE } : { left: EDGE }),
          ...(textBottom ? { bottom: `calc(${EDGE} + ${space(1)})` } : { top: "46%" }),
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr)",
          gap: space(3),
          justifyItems: textRight ? "end" : "start",
          textAlign: textRight ? "right" : "left",
        }}
      >
        <Text
          slot="headline"
          as="h1"
          font="heading"
          size={3}
          color={dark ? "neutral-light" : "neutral-dark"}
        >
          {slot(slots, "headline", "text").value}
        </Text>
        {cta && (
          <Sticker
            wrap
            slot="cta"
            background={dark ? "accent" : "primary"}
            color={dark ? "neutral-dark" : "neutral-light"}
            rotate={-3}
          >
            {cta.value}
          </Sticker>
        )}
      </div>
      <StyleOverlay
        style={style}
        label={optionalSlot(slots, "label", "text")?.value}
        corner={logoBottomRight ? "top-left" : "top-right"}
        surface={dark ? "dark" : "light"}
      />
    </div>
  );
}

export const kataRaksasa: Template = {
  meta: {
    id: "feed-kata-raksasa",
    name: "Kata raksasa",
    format: "feed-4x5",
    description:
      "Satu kata kunci raksasa di belakang subjek cut-out di atas bidang warna brand, headline pendek dan CTA di sisi seberang subjek. Untuk pesan yang bisa dirangkum satu kata atau angka.",
    slots: [
      {
        name: "image",
        type: "image",
        required: true,
        description: "Subjek cut-out berlatar transparan (orang atau produk)",
        aspectRatio: "4:5",
        cutout: true,
      },
      {
        name: "kata",
        type: "text",
        required: true,
        description: "Satu kata kunci atau angka dari copy, ditampilkan raksasa",
        maxChars: 10,
      },
      {
        name: "headline",
        type: "text",
        required: true,
        description: "Headline pendek dari copy",
        maxChars: 32,
      },
      { name: "cta", type: "text", required: false, description: "Ajakan dari copy", maxChars: 28 },
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
        description: "Logo; pakai onDark bila tone primary",
      },
    ],
    options: [
      {
        name: "tone",
        values: ["primary", "secondary"],
        default: "primary",
        description: "Warna bidang: primary (gelap) atau secondary",
      },
      {
        name: "side",
        values: ["left", "center", "right"],
        default: "center",
        description: "Geser subjek; headline dan CTA otomatis di sisi seberangnya",
      },
      {
        name: "logo",
        values: ["top-left", "bottom-right"],
        default: "top-left",
        description: "Letak logo, mengikuti aturan brand",
      },
    ],
  },
  Slide: KataRaksasaSlide,
};
