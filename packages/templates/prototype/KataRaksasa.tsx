import { Display, Image, Logo, Sticker, Text } from "../primitives/index.ts";
import { color, space } from "../primitives/vars.ts";
import { optionalSlot, type SlideProps, slot, type Template } from "../src/template.ts";

// Prototipe A1 (T-122, PRD 4 K2, K3): kata raksasa di belakang subjek cut-out di atas bidang
// warna brand. Posisi subjek, teks, dan logo adalah parameter agar aturan brand (mis. logo
// kanan bawah) dan P1 (maksimal dua sumbu perataan) bisa dipenuhi. Bukan bagian katalog.

const SHIFT: Record<string, string> = { left: "-16%", center: "0%", right: "16%" };
// Satu jarak tepi untuk semua elemen sudut, ditambah satu langkah karena stiker dimiringkan.
const EDGE = `calc(var(--space-safe) + ${space(1)})`;

function KataRaksasaSlide({ slots, options }: SlideProps) {
  const dark = options.tone === "primary";
  const cta = optionalSlot(slots, "cta", "text");
  const text = options.text ?? "bottom-left";
  const right = text !== "bottom-left";
  const logoBottomRight = options.logo === "bottom-right";
  return (
    <div
      style={{
        position: "relative",
        height: "100%",
        overflow: "hidden",
        background: color(dark ? "primary" : "secondary"),
      }}
    >
      <div style={{ position: "absolute", top: "17%", left: EDGE, right: EDGE }}>
        <Display
          slot="kata"
          font="heading"
          scale={2.6}
          charWidth={options.width === "condensed" ? 0.5 : 0.8}
          color={dark ? "accent" : "primary"}
        >
          {slot(slots, "kata", "text").value}
        </Display>
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: "-5%",
          height: "84%",
          transform: `translateX(${SHIFT[options.side ?? "center"]})`,
        }}
      >
        <Image slot="image" src={slot(slots, "image", "image").src} fit="contain" />
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
          ...(right ? { right: EDGE } : { left: EDGE }),
          ...(text === "middle-right" ? { top: "46%" } : { bottom: `calc(${EDGE} + ${space(1)})` }),
          display: "grid",
          gap: space(3),
          justifyItems: right ? "end" : "start",
          textAlign: right ? "right" : "left",
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
            slot="cta"
            background={dark ? "accent" : "primary"}
            color={dark ? "neutral-dark" : "neutral-light"}
            rotate={-3}
          >
            {cta.value}
          </Sticker>
        )}
      </div>
    </div>
  );
}

export const kataRaksasa: Template = {
  meta: {
    id: "proto-kata-raksasa",
    name: "Kata raksasa",
    format: "feed-4x5",
    description:
      "Prototipe: satu kata kunci raksasa di belakang subjek cut-out, headline pendek dan CTA di sudut.",
    slots: [
      {
        name: "image",
        type: "image",
        required: true,
        description: "Subjek cut-out berlatar transparan",
        aspectRatio: "4:5",
      },
      {
        name: "kata",
        type: "text",
        required: true,
        description: "Satu kata kunci raksasa",
        maxChars: 10,
      },
      { name: "headline", type: "text", required: true, description: "Headline", maxChars: 40 },
      { name: "cta", type: "text", required: false, description: "Ajakan", maxChars: 28 },
      { name: "logo", type: "logo", required: true, description: "Logo" },
    ],
    options: [
      {
        name: "tone",
        values: ["primary", "secondary"],
        default: "primary",
        description: "Warna bidang",
      },
      {
        name: "side",
        values: ["left", "center", "right"],
        default: "center",
        description: "Geser subjek",
      },
      {
        name: "width",
        values: ["wide", "condensed"],
        default: "wide",
        description: "Lebar huruf font heading, untuk ukuran kata raksasa",
      },
      {
        name: "text",
        values: ["bottom-left", "bottom-right", "middle-right"],
        default: "bottom-left",
        description: "Letak headline dan CTA",
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
