import { Display, Image, Logo, Sticker, Text } from "../primitives/index.ts";
import { color, space } from "../primitives/vars.ts";
import { optionalSlot, type SlideProps, slot, type Template } from "../src/template.ts";

// Prototipe A2 v3 (T-122, PRD 4 K2, K3, K4, K5, K7): bidang warna dengan lengkung besar,
// headline tiga tingkat (pembuka kecil bersorot, frasa utama raksasa bertumpuk, penutup),
// subjek cut-out berinteraksi yang menimpa frasa utama, fakta ditempel ke subjek, CTA tombol.
// `flip` menukar sisi agar logo bisa di kanan bawah (aturan brand).

const EDGE = `calc(var(--space-safe) + ${space(1)})`;

function BidangWarnaSlide({ slots, options }: SlideProps) {
  const flip = options.flip === "yes";
  const near = flip ? "right" : "left";
  const far = flip ? "left" : "right";
  const mark = options.mark === "primary" ? "primary" : "accent";
  const onMark = mark === "primary" ? "neutral-light" : "neutral-dark";
  const pembuka = optionalSlot(slots, "pembuka", "text");
  const penutup = optionalSlot(slots, "penutup", "text");
  const fakta = optionalSlot(slots, "fakta", "badge");
  const cta = optionalSlot(slots, "cta", "text");
  return (
    <div
      style={{
        position: "relative",
        height: "100%",
        overflow: "hidden",
        background: color(options.tone === "neutral" ? "neutral-light" : "secondary"),
      }}
    >
      <div
        style={{
          position: "absolute",
          [far]: "-4%",
          bottom: 0,
          width: "52%",
          height: "66%",
          borderRadius: "999px 999px 0 0",
          background: color(mark),
        }}
      />
      <div
        style={{
          position: "absolute",
          top: EDGE,
          [near]: EDGE,
          width: "64%",
          display: "grid",
          gap: space(2),
          justifyItems: flip ? "end" : "start",
          textAlign: near,
        }}
      >
        {pembuka && (
          <Text
            slot="pembuka"
            font="body"
            size={2}
            color={onMark}
            strong
            highlight={{ text: pembuka.value, background: mark, color: onMark, tilt: -2 }}
          >
            {pembuka.value}
          </Text>
        )}
        <Display
          slot="headline"
          font="heading"
          scale={2}
          charWidth={options.width === "condensed" ? 0.5 : 0.78}
          align={near}
          stack
          color="primary"
        >
          {slot(slots, "headline", "text").value}
        </Display>
        {penutup && (
          <Text slot="penutup" font="heading" size={4} color="primary" measure={14} balance>
            {penutup.value}
          </Text>
        )}
      </div>
      <div
        style={{ position: "absolute", [far]: "-6%", bottom: "-3%", width: "66%", height: "76%" }}
      >
        <Image slot="image" src={slot(slots, "image", "image").src} fit="contain" />
      </div>
      {fakta && (
        <div
          style={{
            position: "absolute",
            bottom: options.fact === "low" ? "19%" : "30%",
            [near]: "34%",
          }}
        >
          <Sticker
            slot="fakta"
            background="primary"
            color="neutral-light"
            edge="neutral-light"
            rotate={flip ? 6 : -6}
            size={3}
          >
            {fakta.value}
          </Sticker>
        </div>
      )}
      <div
        style={{
          position: "absolute",
          bottom: EDGE,
          [near]: EDGE,
          gridTemplateColumns: "minmax(0, 1fr)",
          display: "grid",
          gap: space(4),
          justifyItems: flip ? "end" : "start",
        }}
      >
        {cta && (
          <Sticker slot="cta" background="primary" color="neutral-light">
            {cta.value}
          </Sticker>
        )}
        <Logo slot="logo" src={slot(slots, "logo", "logo").src} height={6} />
      </div>
    </div>
  );
}

export const bidangWarna: Template = {
  meta: {
    id: "proto-bidang-warna",
    name: "Bidang warna",
    format: "feed-4x5",
    description:
      "Prototipe: lengkung warna, headline tiga tingkat dengan frasa utama raksasa, subjek cut-out yang menimpa frasa, fakta di subjek, CTA tombol.",
    slots: [
      {
        name: "image",
        type: "image",
        required: true,
        description: "Subjek cut-out berlatar transparan yang berinteraksi",
        aspectRatio: "4:5",
      },
      {
        name: "pembuka",
        type: "text",
        required: false,
        description: "Kalimat pembuka kecil bersorot",
        maxChars: 28,
      },
      {
        name: "headline",
        type: "text",
        required: true,
        description: "Frasa utama, satu sampai dua kata, ditumpuk satu kata per baris",
        maxChars: 16,
      },
      { name: "penutup", type: "text", required: false, description: "Penutup", maxChars: 32 },
      { name: "fakta", type: "badge", required: false, description: "Fakta pendek", maxChars: 20 },
      { name: "cta", type: "text", required: false, description: "Ajakan", maxChars: 28 },
      { name: "logo", type: "logo", required: true, description: "Logo di atas latar terang" },
    ],
    options: [
      {
        name: "tone",
        values: ["secondary", "neutral"],
        default: "secondary",
        description: "Warna bidang",
      },
      {
        name: "mark",
        values: ["accent", "primary"],
        default: "accent",
        description: "Warna lengkung dan sorot pembuka",
      },
      {
        name: "width",
        values: ["wide", "condensed"],
        default: "wide",
        description: "Lebar huruf font heading, untuk ukuran frasa utama",
      },
      {
        name: "fact",
        values: ["high", "low"],
        default: "high",
        description: "Tinggi stiker fakta, agar tidak menabrak penutup atau CTA",
      },
      {
        name: "flip",
        values: ["no", "yes"],
        default: "no",
        description: "Subjek di kiri, kolom teks dan logo di kanan",
      },
    ],
  },
  Slide: BidangWarnaSlide,
};
