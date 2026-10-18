import { Image, Logo, Scribble, Sticker, Text } from "../primitives/index.ts";
import { color, space } from "../primitives/vars.ts";
import { optionalSlot, type SlideProps, slot, type Template } from "../src/template.ts";

// Prototipe A2 (T-122, PRD 4 K4, K5, K7): bidang warna, lingkaran besar di balik subjek
// cut-out yang keluar bingkai, headline dengan kata bersorot, coretan panah, dan stiker fakta.

function BidangWarnaSlide({ slots, options }: SlideProps) {
  const mark = options.mark === "primary" ? "primary" : "accent";
  const onMark = mark === "primary" ? "neutral-light" : "neutral-dark";
  const sorot = optionalSlot(slots, "sorot", "text");
  const stiker = optionalSlot(slots, "stiker", "badge");
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
          width: "88%",
          aspectRatio: "1",
          right: "-30%",
          bottom: "-14%",
          borderRadius: "50%",
          background: color(mark),
        }}
      />
      <div
        style={{ position: "absolute", right: "-12%", bottom: "-4%", width: "86%", height: "80%" }}
      >
        <Image slot="image" src={slot(slots, "image", "image").src} fit="contain" />
      </div>
      <div
        style={{
          position: "absolute",
          top: "var(--space-safe)",
          left: "var(--space-safe)",
          width: "62%",
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
      <div style={{ position: "absolute", top: "44%", left: "30%", width: "22%" }}>
        <Scribble shape="arrow" color="primary" rotate={24} />
      </div>
      {stiker && (
        <div
          style={{
            position: "absolute",
            top: "58%",
            left: `calc(var(--space-safe) + ${space(2)})`,
          }}
        >
          <Sticker
            slot="stiker"
            background="primary"
            color="neutral-light"
            edge="neutral-light"
            rotate={-6}
            size={3}
          >
            {stiker.value}
          </Sticker>
        </div>
      )}
      <div
        style={{
          position: "absolute",
          bottom: "var(--space-safe)",
          left: "var(--space-safe)",
          display: "grid",
          gap: space(3),
          justifyItems: "start",
        }}
      >
        {cta && (
          <Text slot="cta" font="body" size={2} color="primary" strong>
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
    ],
  },
  Slide: BidangWarnaSlide,
};
