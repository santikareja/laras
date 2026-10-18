import { Display, Frame, Image, Logo, Scribble, Sticker, Text } from "../primitives/index.ts";
import { color, space } from "../primitives/vars.ts";
import { optionalSlot, type SlideProps, slot, type Template } from "../src/template.ts";

// Prototipe A4 (T-122, PRD 4 K5, K6): foto berbingkai miring, pita diagonal berisi headline,
// subjek cut-out opsional yang menimpa ujung pita, stiker, dan coretan. `flip` menukar sisi
// sehingga kolom teks dan logo berada di kanan; coretan bisa dimatikan (PRD 4 P5).

const EDGE = `calc(var(--space-safe) + ${space(1)})`;

function KolaseDiagonalSlide({ slots, options }: SlideProps) {
  const flip = options.flip === "yes";
  const near = flip ? "right" : "left";
  const far = flip ? "left" : "right";
  const dark = options.tone === "primary";
  const band = options.band === "accent" ? "accent" : "primary";
  const subjek = optionalSlot(slots, "subjek", "image");
  const stiker = optionalSlot(slots, "stiker", "badge");
  const body = optionalSlot(slots, "body", "text");
  const cta = optionalSlot(slots, "cta", "text");
  const ink = dark ? "neutral-light" : "neutral-dark";
  return (
    <div
      style={{
        position: "relative",
        height: "100%",
        overflow: "hidden",
        background: color(dark ? "primary" : "neutral-light"),
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "7%",
          [near]: "9%",
          width: "54%",
          aspectRatio: "4 / 5",
        }}
      >
        <Frame
          slot="image"
          src={slot(slots, "image", "image").src}
          edge="neutral-light"
          rotate={flip ? 4 : -4}
        />
      </div>
      {stiker && (
        <div style={{ position: "absolute", top: "11%", [far]: `calc(${EDGE} + ${space(2)})` }}>
          <Sticker
            slot="stiker"
            background="accent"
            color="neutral-dark"
            edge="neutral-light"
            rotate={flip ? -8 : 8}
            size={3}
          >
            {stiker.value}
          </Sticker>
        </div>
      )}
      <div
        style={{
          position: "absolute",
          top: "52%",
          left: "-10%",
          right: "-10%",
          padding: `${space(3)} calc(1080px * 0.1 + ${EDGE} + ${space(1)})`,
          display: "flex",
          justifyContent: flip ? "flex-end" : "flex-start",
          background: color(band),
          transform: `rotate(${flip ? 7 : -7}deg)`,
        }}
      >
        {/* Dengan subjek, teks pita berhenti sebelum ujung yang ditimpa subjek. */}
        <div style={{ width: subjek ? "calc(1080px * 0.58)" : "100%" }}>
          <Display
            slot="headline"
            font="heading"
            scale={1}
            charWidth={options.width === "condensed" ? 0.5 : 0.72}
            align={near}
            color={band === "primary" ? "neutral-light" : "neutral-dark"}
          >
            {slot(slots, "headline", "text").value}
          </Display>
        </div>
      </div>
      {subjek && (
        <div
          style={{ position: "absolute", [far]: "-6%", bottom: "-5%", width: "50%", height: "50%" }}
        >
          <Image slot="subjek" src={subjek.src} fit="contain" />
        </div>
      )}
      <div
        style={{
          position: "absolute",
          [near]: EDGE,
          bottom: EDGE,
          width: subjek ? "44%" : "70%",
          display: "grid",
          gap: space(3),
          justifyItems: flip ? "end" : "start",
          textAlign: near,
        }}
      >
        {body && (
          <Text slot="body" font="body" size={2} color={ink} measure={40} balance>
            {body.value}
          </Text>
        )}
        {cta && (
          <div style={{ display: "grid", gap: space(1), justifyItems: flip ? "end" : "start" }}>
            <Text slot="cta" font="body" size={2} color={ink} strong>
              {cta.value}
            </Text>
            {options.underline !== "no" && (
              <div style={{ width: "70%" }}>
                <Scribble shape="underline" color="accent" flip={flip} />
              </div>
            )}
          </div>
        )}
        <Logo slot="logo" src={slot(slots, "logo", "logo").src} height={5} />
      </div>
    </div>
  );
}

export const kolaseDiagonal: Template = {
  meta: {
    id: "proto-kolase-diagonal",
    name: "Kolase diagonal",
    format: "feed-4x5",
    description:
      "Prototipe: foto berbingkai miring, pita diagonal berisi headline, subjek cut-out opsional, stiker, dan coretan.",
    slots: [
      {
        name: "image",
        type: "image",
        required: true,
        description: "Foto utuh untuk bingkai",
        aspectRatio: "4:5",
      },
      {
        name: "subjek",
        type: "image",
        required: false,
        description: "Subjek cut-out berlatar transparan",
        aspectRatio: "4:5",
      },
      {
        name: "headline",
        type: "text",
        required: true,
        description: "Headline pita, satu baris",
        maxChars: 18,
      },
      { name: "stiker", type: "badge", required: false, description: "Fakta pendek", maxChars: 20 },
      { name: "body", type: "text", required: false, description: "Satu kalimat", maxChars: 80 },
      { name: "cta", type: "text", required: false, description: "Ajakan", maxChars: 28 },
      { name: "logo", type: "logo", required: true, description: "Logo" },
    ],
    options: [
      {
        name: "tone",
        values: ["neutral", "primary"],
        default: "neutral",
        description: "Warna bidang",
      },
      {
        name: "width",
        values: ["wide", "condensed"],
        default: "wide",
        description: "Lebar huruf font heading, untuk ukuran teks pita",
      },
      {
        name: "band",
        values: ["primary", "accent"],
        default: "primary",
        description: "Warna pita",
      },
      {
        name: "flip",
        values: ["no", "yes"],
        default: "no",
        description: "Bingkai di kanan, subjek di kiri, kolom teks dan logo di kanan",
      },
      {
        name: "underline",
        values: ["yes", "no"],
        default: "yes",
        description: "Coretan garis bawah di bawah CTA",
      },
    ],
  },
  Slide: KolaseDiagonalSlide,
};
