import { Display, Frame, Image, Logo, Sticker, Tape, Text } from "../primitives/index.ts";
import { color, space } from "../primitives/vars.ts";
import { optionalSlot, type SlideProps, slot, type Template } from "../src/template.ts";

// Arketipe A4 Kolase diagonal (T-122 v4, ADR-015; PRD 4 K3, P2, P8–P11): kolase yang ditahan. Lima elemen: bingkai foto
// (tepi sobek dan selotip sebagai satu keluarga dekorasi kertas), subjek cut-out yang keluar dari
// bingkai sebagai satu-satunya fokus, pita headline di garis sepertiga bawah, blok body dan CTA,
// logo. Pita memakai warna kedua, aksen hanya untuk CTA. `flip` menukar sisi.

const EDGE = `calc(var(--space-safe) + ${space(1)})`;
const DUOTONE = { primary: "primary", secondary: "secondary", accent: "accent" } as const;
const BAND_INK = { primary: "neutral-light", secondary: "primary" } as const;

function KolaseDiagonalSlide({ slots, options }: SlideProps) {
  const flip = options.flip === "yes";
  const near = flip ? "right" : "left";
  const far = flip ? "left" : "right";
  const dark = options.tone === "primary";
  const band = options.band === "secondary" ? "secondary" : "primary";
  const subjek = optionalSlot(slots, "subjek", "image");
  const body = optionalSlot(slots, "body", "text");
  const cta = optionalSlot(slots, "cta", "text");
  const duotone = DUOTONE[(options.duotone ?? "") as keyof typeof DUOTONE];
  const tilt = flip ? 5 : -5;
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
          top: "8%",
          [near]: "9%",
          width: "50%",
          aspectRatio: "4 / 5",
        }}
      >
        <Frame
          slot="image"
          src={slot(slots, "image", "image").src}
          edge="neutral-light"
          rotate={tilt}
          torn
          {...(duotone ? { duotone } : {})}
        />
        <div style={{ position: "absolute", top: "-2%", [near]: "-8%", width: "34%" }}>
          <Tape color="secondary" rotate={-tilt * 7} />
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          top: "62%",
          left: "-10%",
          right: "-10%",
          padding: `${space(3)} calc(1080px * 0.1 + ${EDGE} + ${space(1)})`,
          display: "flex",
          justifyContent: flip ? "flex-end" : "flex-start",
          background: color(band),
          transform: `rotate(${tilt}deg)`,
        }}
      >
        <div style={{ width: subjek ? "calc(1080px * 0.5)" : "100%" }}>
          <Display slot="headline" font="heading" scale={1} align={near} color={BAND_INK[band]}>
            {slot(slots, "headline", "text").value}
          </Display>
        </div>
      </div>
      {subjek && (
        <div
          style={{ position: "absolute", [far]: "-4%", bottom: "-3%", width: "56%", height: "80%" }}
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
          gridTemplateColumns: "minmax(0, 1fr)",
          gap: space(4),
          justifyItems: flip ? "end" : "start",
          textAlign: near,
        }}
      >
        {body && (
          <Text
            slot="body"
            font="body"
            size={2}
            color={dark ? "neutral-light" : "neutral-dark"}
            measure={34}
            balance
          >
            {body.value}
          </Text>
        )}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: space(5),
            justifyContent: flip ? "flex-end" : "flex-start",
          }}
        >
          {cta && (
            <Sticker slot="cta" background="accent" color="neutral-dark">
              {cta.value}
            </Sticker>
          )}
          <Logo slot="logo" src={slot(slots, "logo", "logo").src} height={5} />
        </div>
      </div>
    </div>
  );
}

export const kolaseDiagonal: Template = {
  meta: {
    id: "feed-kolase-diagonal",
    name: "Kolase diagonal",
    format: "feed-4x5",
    description:
      "Kolase yang ditahan: bingkai foto bertepi sobek dengan selotip, subjek cut-out keluar dari bingkai sebagai fokus, pita headline miring, CTA. Untuk acara, ajakan komunitas, atau cerita di balik produk.",
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
        cutout: true,
      },
      {
        name: "headline",
        type: "text",
        required: true,
        description: "Headline pita, satu baris",
        maxChars: 18,
      },
      {
        name: "body",
        type: "text",
        required: false,
        description: "Satu kalimat, boleh berisi fakta",
        maxChars: 80,
      },
      { name: "cta", type: "text", required: false, description: "Ajakan", maxChars: 28 },
      { name: "logo", type: "logo", required: true, description: "Logo" },
    ],
    options: [
      {
        name: "tone",
        values: ["neutral", "primary"],
        default: "neutral",
        description: "Warna bidang dominan",
      },
      {
        name: "band",
        values: ["primary", "secondary"],
        default: "primary",
        description: "Warna pita (warna kedua, bukan aksen)",
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
        description: "Bingkai di kanan, subjek di kiri, blok teks dan logo di kanan",
      },
    ],
  },
  Slide: KolaseDiagonalSlide,
};
