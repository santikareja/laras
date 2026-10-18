import { Image, Logo, Scribble, Sticker, Text } from "../primitives/index.ts";
import { color, space } from "../primitives/vars.ts";
import { optionalSlot, type SlideProps, slot, type Template } from "../src/template.ts";

// Prototipe A2 (T-122, PRD 4 K4, K5, K7): bidang warna, lingkaran besar di balik subjek
// cut-out yang keluar bingkai, headline dengan kata bersorot, coretan panah, dan stiker fakta.
// `flip` menukar sisi subjek dan kolom teks sehingga logo bisa di kanan bawah; panah bisa
// dimatikan untuk brand dengan batas elemen visual (PRD 4 P5).

const EDGE = `calc(var(--space-safe) + ${space(1)})`;

function BidangWarnaSlide({ slots, options }: SlideProps) {
  const flip = options.flip === "yes";
  const mark = options.mark === "primary" ? "primary" : "accent";
  const onMark = mark === "primary" ? "neutral-light" : "neutral-dark";
  const sorot = optionalSlot(slots, "sorot", "text");
  const stiker = optionalSlot(slots, "stiker", "badge");
  const cta = optionalSlot(slots, "cta", "text");
  const near = flip ? "right" : "left";
  const far = flip ? "left" : "right";
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
          width: "88%",
          aspectRatio: "1",
          [far]: "-30%",
          bottom: "-14%",
          borderRadius: "50%",
          background: color(mark),
        }}
      />
      <div
        style={{ position: "absolute", [far]: "-18%", bottom: "-4%", width: "86%", height: "80%" }}
      >
        <Image slot="image" src={slot(slots, "image", "image").src} fit="contain" />
      </div>
      <div
        style={{
          position: "absolute",
          top: EDGE,
          [near]: EDGE,
          width: "62%",
          textAlign: near,
        }}
      >
        <Text
          slot="headline"
          as="h1"
          font="heading"
          size={options.size === "medium" ? 5 : 6}
          color="primary"
          {...(sorot ? { highlight: { text: sorot.value, background: mark, color: onMark } } : {})}
        >
          {slot(slots, "headline", "text").value}
        </Text>
      </div>
      {options.arrow !== "no" && (
        <div style={{ position: "absolute", top: "44%", [near]: "30%", width: "22%" }}>
          <Scribble shape="arrow" color="primary" rotate={flip ? -24 : 24} flip={flip} />
        </div>
      )}
      {stiker && (
        <div style={{ position: "absolute", top: "58%", [near]: EDGE }}>
          <Sticker
            slot="stiker"
            background="primary"
            color="neutral-light"
            edge="neutral-light"
            rotate={flip ? 4 : -4}
            size={3}
          >
            {stiker.value}
          </Sticker>
        </div>
      )}
      <div
        style={{
          position: "absolute",
          bottom: EDGE,
          [near]: EDGE,
          // Kolom CTA tidak boleh masuk ke area lingkaran dan subjek (PRD 4 P6).
          maxWidth: "36%",
          display: "grid",
          gap: space(3),
          justifyItems: flip ? "end" : "start",
          textAlign: near,
        }}
      >
        {cta && (
          <Text slot="cta" font="body" size={2} color="primary" strong balance>
            {cta.value}
          </Text>
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
      "Prototipe: subjek cut-out keluar bingkai di atas lingkaran warna, headline dengan kata bersorot, panah coretan, stiker fakta.",
    slots: [
      {
        name: "image",
        type: "image",
        required: true,
        description: "Subjek cut-out berlatar transparan",
        aspectRatio: "4:5",
      },
      { name: "headline", type: "text", required: true, description: "Headline", maxChars: 40 },
      {
        name: "sorot",
        type: "text",
        required: false,
        description: "Bagian headline yang diberi blok sorot",
        maxChars: 16,
      },
      { name: "stiker", type: "badge", required: false, description: "Fakta pendek", maxChars: 20 },
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
        description: "Warna lingkaran dan blok sorot",
      },
      {
        name: "size",
        values: ["large", "medium"],
        default: "large",
        description: "Ukuran headline",
      },
      {
        name: "flip",
        values: ["no", "yes"],
        default: "no",
        description: "Subjek di kiri dan kolom teks serta logo di kanan",
      },
      {
        name: "arrow",
        values: ["yes", "no"],
        default: "yes",
        description: "Panah coretan dari teks ke subjek",
      },
    ],
  },
  Slide: BidangWarnaSlide,
};
