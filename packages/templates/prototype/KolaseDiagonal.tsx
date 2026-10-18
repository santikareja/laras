import { Display, Frame, Image, Logo, Scribble, Sticker, Tape, Text } from "../primitives/index.ts";
import { color, space } from "../primitives/vars.ts";
import { optionalSlot, type SlideProps, slot, type Template } from "../src/template.ts";

// Prototipe A4 v3 (T-122, PRD 4 K3, K5, K6): satu bingkai besar duotone bertepi sobek dengan
// selotip, subjek cut-out yang keluar dari bingkai, pita diagonal di bawah bingkai, fakta yang
// dilingkari coretan, dan CTA tombol. `flip` menukar sisi; `doodle` mematikan kilau untuk brand
// dengan batas elemen visual (PRD 4 P5).

const EDGE = `calc(var(--space-safe) + ${space(1)})`;
const DUOTONE = { primary: "primary", secondary: "secondary", accent: "accent" } as const;

function KolaseDiagonalSlide({ slots, options }: SlideProps) {
  const flip = options.flip === "yes";
  const near = flip ? "right" : "left";
  const far = flip ? "left" : "right";
  const dark = options.tone === "primary";
  const band = options.band === "accent" ? "accent" : "primary";
  const subjek = optionalSlot(slots, "subjek", "image");
  const fakta = optionalSlot(slots, "fakta", "badge");
  const body = optionalSlot(slots, "body", "text");
  const cta = optionalSlot(slots, "cta", "text");
  const duotone = DUOTONE[(options.duotone ?? "") as keyof typeof DUOTONE];
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
          top: "6%",
          [near]: "8%",
          width: "62%",
          aspectRatio: "4 / 5",
        }}
      >
        <Frame
          slot="image"
          src={slot(slots, "image", "image").src}
          edge="neutral-light"
          rotate={flip ? 3 : -3}
          torn
          {...(duotone ? { duotone } : {})}
        />
        <div style={{ position: "absolute", top: "-2%", [near]: "-6%", width: "30%" }}>
          <Tape color="secondary" rotate={flip ? 38 : -38} />
        </div>
        <div style={{ position: "absolute", top: "-1%", [far]: "-8%", width: "30%" }}>
          <Tape color="secondary" rotate={flip ? -32 : 32} />
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          top: "60%",
          left: "-10%",
          right: "-10%",
          padding: `${space(3)} calc(1080px * 0.1 + ${EDGE} + ${space(1)})`,
          display: "flex",
          justifyContent: flip ? "flex-end" : "flex-start",
          background: color(band),
          transform: `rotate(${flip ? 6 : -6}deg)`,
        }}
      >
        <div style={{ width: subjek ? "calc(1080px * 0.56)" : "100%" }}>
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
          style={{ position: "absolute", [far]: "-4%", bottom: "-3%", width: "58%", height: "84%" }}
        >
          <Image slot="subjek" src={subjek.src} fit="contain" />
        </div>
      )}
      {subjek && options.doodle !== "no" && (
        <div style={{ position: "absolute", top: "8%", [far]: "10%", width: "9%" }}>
          <Scribble shape="sparkle" color="accent" />
        </div>
      )}
      {fakta && (
        <div style={{ position: "absolute", top: "46%", [far]: `calc(${EDGE} + ${space(2)})` }}>
          <div style={{ position: "relative" }}>
            <Sticker
              slot="fakta"
              background="accent"
              color="neutral-dark"
              rotate={flip ? -5 : 5}
              size={3}
            >
              {fakta.value}
            </Sticker>
            <div
              style={{
                position: "absolute",
                inset: `calc(-1 * ${space(4)}) calc(-1 * ${space(5)})`,
              }}
            >
              <Scribble shape="circle" color={dark ? "neutral-light" : "primary"} fill />
            </div>
          </div>
        </div>
      )}
      <div
        style={{
          position: "absolute",
          [near]: EDGE,
          bottom: EDGE,
          width: subjek ? "46%" : "70%",
          gridTemplateColumns: "minmax(0, 1fr)",
          display: "grid",
          gap: space(3),
          justifyItems: flip ? "end" : "start",
          textAlign: near,
        }}
      >
        {body && (
          <Text slot="body" font="body" size={2} color={ink} measure={34} balance>
            {body.value}
          </Text>
        )}
        {cta && (
          <Sticker slot="cta" background="accent" color="neutral-dark">
            {cta.value}
          </Sticker>
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
      "Prototipe: bingkai duotone bertepi sobek dengan selotip, subjek keluar bingkai, pita diagonal, fakta dilingkari coretan.",
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
        description: "Subjek cut-out berlatar transparan yang keluar dari bingkai",
        aspectRatio: "4:5",
      },
      {
        name: "headline",
        type: "text",
        required: true,
        description: "Headline pita, satu baris",
        maxChars: 18,
      },
      { name: "fakta", type: "badge", required: false, description: "Fakta pendek", maxChars: 20 },
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
        name: "duotone",
        values: ["none", "primary", "secondary", "accent"],
        default: "none",
        description: "Warna duotone foto bingkai",
      },
      {
        name: "flip",
        values: ["no", "yes"],
        default: "no",
        description: "Bingkai di kanan, subjek di kiri, kolom teks dan logo di kanan",
      },
      {
        name: "doodle",
        values: ["yes", "no"],
        default: "yes",
        description: "Coretan kilau di dekat subjek",
      },
    ],
  },
  Slide: KolaseDiagonalSlide,
};
