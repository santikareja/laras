import { Image, Logo, Text } from "../primitives/index.ts";
import { color, space } from "../primitives/vars.ts";
import { optionalSlot, type SlideProps, slot, type Template } from "../src/template.ts";

// Prototipe A3 (T-122, PRD 4 K1, K7): satu objek atau gambar konsep dengan ruang kosong luas,
// satu kalimat, satu baris pendukung. Mode "object" untuk cut-out di bidang warna, "full" untuk
// foto konsep. Letak logo mengikuti aturan brand.

const BACKGROUND = {
  neutral: "neutral-light",
  secondary: "secondary",
  primary: "primary",
} as const;

function SatuObjekSlide({ slots, options }: SlideProps) {
  const full = options.mode === "full";
  const dark = !full && options.tone === "primary";
  const body = optionalSlot(slots, "body", "text");
  const src = slot(slots, "image", "image").src;
  const tone = BACKGROUND[(options.tone ?? "neutral") as keyof typeof BACKGROUND];
  const logo = options.logo ?? "bottom-center";
  return (
    <div
      style={{
        position: "relative",
        height: "100%",
        overflow: "hidden",
        background: color(tone ?? "neutral-light"),
      }}
    >
      {full ? (
        <div style={{ position: "absolute", inset: 0 }}>
          <Image slot="image" src={src} />
        </div>
      ) : (
        <>
          <div
            style={{
              position: "absolute",
              left: "30%",
              right: "30%",
              bottom: "19%",
              height: "3%",
              borderRadius: "50%",
              background: color("neutral-dark"),
              opacity: dark ? 0.35 : 0.18,
              filter: "blur(14px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: "20%",
              right: "20%",
              bottom: "16%",
              height: "50%",
            }}
          >
            <Image slot="image" src={src} fit="contain" />
          </div>
        </>
      )}
      <div
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
      <div
        style={{
          position: "absolute",
          ...(logo === "top-left"
            ? { top: "var(--space-safe)", left: "var(--space-safe)" }
            : logo === "bottom-right"
              ? { bottom: "var(--space-safe)", right: "var(--space-safe)" }
              : { bottom: "var(--space-safe)", left: 0, right: 0 }),
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Logo slot="logo" src={slot(slots, "logo", "logo").src} height={5} />
      </div>
    </div>
  );
}

export const satuObjek: Template = {
  meta: {
    id: "proto-satu-objek",
    name: "Satu objek",
    format: "feed-4x5",
    description:
      "Prototipe: satu objek atau gambar konsep dengan ruang kosong luas, satu kalimat dan satu baris pendukung.",
    slots: [
      {
        name: "image",
        type: "image",
        required: true,
        description: "Cut-out (mode object) atau foto konsep dengan 40% atas kosong (mode full)",
        aspectRatio: "4:5",
      },
      { name: "headline", type: "text", required: true, description: "Headline", maxChars: 40 },
      { name: "body", type: "text", required: false, description: "Satu baris", maxChars: 70 },
      {
        name: "logo",
        type: "logo",
        required: true,
        description: "Logo; varian onDark bila tone primary",
      },
    ],
    options: [
      {
        name: "mode",
        values: ["object", "full"],
        default: "object",
        description: "Cut-out di bidang atau foto penuh",
      },
      {
        name: "tone",
        values: ["neutral", "secondary", "primary"],
        default: "neutral",
        description: "Warna bidang mode object",
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
