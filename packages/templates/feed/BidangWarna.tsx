import { Display, Logo, Photo, Sticker, Text } from "../primitives/index.ts";
import { color, space } from "../primitives/vars.ts";
import { boxFromPercent, textBelowFocus, thirdsPlacement } from "../src/geometry.ts";
import { optionalSlot, type SlideProps, slot, type Template } from "../src/template.ts";
import { StyleBackdrop, StyleOverlay, styleEffect, styleTreatment } from "../styles/layer.tsx";

// Arketipe A2 Bidang warna (T-122 v4, ADR-015; PRD 4 P2, P8–P11): bidang warna dominan, lengkung
// warna kedua di belakang subjek cut-out, satu blok teks tiga tingkat (pembuka bersorot, frasa
// utama bertumpuk yang dipaskan renderer, penutup), CTA tombol aksen dan logo. Lima elemen.
// Blok teks berseberangan diagonal dengan titik fokus subjek: di bawah bila fokus tinggi, di atas
// bila fokus rendah. `flip` menukar sisi (mis. logo kanan bawah sesuai aturan brand).

const EDGE = `calc(var(--space-safe) + ${space(1)})`;
const SUBJECT = { bottom: -3, width: 60, height: 82, offset: -6 };

function BidangWarnaSlide({ slots, options, style }: SlideProps) {
  const flip = options.flip === "yes";
  const near = flip ? "right" : "left";
  const far = flip ? "left" : "right";
  const image = slot(slots, "image", "image");
  const pembuka = optionalSlot(slots, "pembuka", "text");
  const penutup = optionalSlot(slots, "penutup", "text");
  const cta = optionalSlot(slots, "cta", "text");
  const box = boxFromPercent({ ...SUBJECT, [far]: SUBJECT.offset });
  // Fokus subjek di titik sepertiga sisi subjek (P8, T-131).
  const placement = image.subject ? thirdsPlacement(box, 4 / 5, image.subject, far) : undefined;
  const textBottom = placement ? textBelowFocus(placement.focus.y) : true;
  return (
    <div
      style={{
        position: "relative",
        height: "100%",
        overflow: "hidden",
        background: color(options.tone === "neutral" ? "neutral-light" : "secondary"),
      }}
    >
      <StyleBackdrop style={style} subjectSide={far} />
      {options.arch !== "none" && (
        <div
          data-qa-element="shape"
          data-qa-name="lengkung"
          style={{
            position: "absolute",
            [far]: "-4%",
            bottom: 0,
            width: options.arch === "low" ? "46%" : "52%",
            height: options.arch === "low" ? "50%" : "62%",
            borderRadius: "999px 999px 0 0",
            background: color("primary"),
          }}
        />
      )}
      <div
        style={{
          position: "absolute",
          [far]: `${SUBJECT.offset}%`,
          bottom: `${SUBJECT.bottom}%`,
          width: `${SUBJECT.width}%`,
          height: `${SUBJECT.height}%`,
          transform: placement?.transform,
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
        data-qa-element="group"
        data-qa-name="blok teks"
        style={{
          position: "absolute",
          ...(textBottom ? { bottom: `calc(${EDGE} + ${space(7)} + ${space(3)})` } : { top: EDGE }),
          [near]: EDGE,
          width: "44%",
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr)",
          gap: space(3),
          justifyItems: flip ? "end" : "start",
          textAlign: near,
        }}
      >
        {pembuka && (
          <Text
            slot="pembuka"
            font="body"
            size={2}
            color="neutral-dark"
            strong
            highlight={{
              text: pembuka.value,
              background: "accent",
              color: "neutral-dark",
              tilt: 0,
            }}
          >
            {pembuka.value}
          </Text>
        )}
        <Display
          slot="headline"
          font="heading"
          scale={2}
          align={near}
          stack
          color="primary"
          effect={styleEffect(style, "display")}
        >
          {slot(slots, "headline", "text").value}
        </Display>
        {penutup && (
          <Text slot="penutup" font="heading" size={3} color="primary" measure={18} balance>
            {penutup.value}
          </Text>
        )}
      </div>
      <div
        style={{
          position: "absolute",
          bottom: EDGE,
          [near]: EDGE,
          display: "flex",
          alignItems: "center",
          gap: space(5),
        }}
      >
        {cta && (
          <Sticker slot="cta" background="accent" color="neutral-dark">
            {cta.value}
          </Sticker>
        )}
        <Logo slot="logo" src={slot(slots, "logo", "logo").src} height={6} />
      </div>
      <StyleOverlay
        style={style}
        label={optionalSlot(slots, "label", "text")?.value}
        {...(textBottom ? { corner: flip ? "top-right" : "top-left" } : {})}
        surface="light"
      />
    </div>
  );
}

export const bidangWarna: Template = {
  meta: {
    id: "feed-bidang-warna",
    name: "Bidang warna",
    format: "feed-4x5",
    description:
      "Bidang warna brand yang tenang dengan lengkung di belakang subjek cut-out, headline tiga tingkat (pembuka kecil, frasa utama raksasa, penutup), CTA tombol. Untuk promo produk atau ajakan dengan satu frasa kuat.",
    slots: [
      {
        name: "image",
        type: "image",
        required: true,
        description: "Subjek cut-out berlatar transparan yang berinteraksi (memegang, bergerak)",
        aspectRatio: "4:5",
        cutout: true,
        composition: {
          base: "Cut-out subject caught mid-action (holding, reaching, or moving) with the whole body or upper body readable as one silhouette; a curved color shape sits behind it.",
          option: "flip",
          byValue: {
            no: "Turn the body and gaze slightly toward the left, where the text sits.",
            yes: "Turn the body and gaze slightly toward the right, where the text sits.",
          },
        },
      },
      {
        name: "pembuka",
        type: "text",
        required: false,
        description: "Kalimat pembuka kecil bersorot dari copy",
        maxChars: 28,
      },
      {
        name: "headline",
        type: "text",
        required: true,
        description: "Frasa utama satu sampai dua kata dari copy, ditumpuk satu kata per baris",
        maxChars: 12,
      },
      {
        name: "penutup",
        type: "text",
        required: false,
        description: "Penutup dari copy, boleh berisi fakta seperti harga",
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
      { name: "logo", type: "logo", required: true, description: "Logo di atas latar terang" },
    ],
    options: [
      {
        name: "tone",
        values: ["secondary", "neutral"],
        default: "secondary",
        description: "Warna bidang dominan",
      },
      {
        name: "arch",
        values: ["high", "low", "none"],
        default: "high",
        description:
          "Tinggi lengkung; low bila warna primary brand sangat kuat; none bila gaya memakai bentuk sendiri",
      },
      {
        name: "flip",
        values: ["no", "yes"],
        default: "no",
        description: "Subjek di kiri, blok teks dan logo di kanan",
      },
    ],
  },
  Slide: BidangWarnaSlide,
};
