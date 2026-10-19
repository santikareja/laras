import { Image, Logo, Text } from "../primitives/index.ts";
import { color, space } from "../primitives/vars.ts";
import {
  optionalSlot,
  type ResolvedSlot,
  type SlideProps,
  slot,
  type Template,
} from "../src/template.ts";

// Arketipe A3 Satu objek (T-122, ADR-015; PRD 4 K1, K7): satu subjek cut-out kecil di bidang
// warna dengan bayangan lantai, ruang kosong luas, satu kalimat dan satu baris pendukung di atas.
// Pasangannya untuk foto konsep penuh adalah `feed-foto-konsep`.

const BACKGROUND = {
  neutral: "neutral-light",
  secondary: "secondary",
  primary: "primary",
} as const;

// Headline dan satu baris pendukung di tengah atas, dipakai juga oleh feed-foto-konsep.
export function TopCaption({
  slots,
  dark,
}: {
  slots: Record<string, ResolvedSlot>;
  dark: boolean;
}) {
  const body = optionalSlot(slots, "body", "text");
  return (
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
  );
}

// Logo di posisi yang dipilih opsi (aturan brand).
export function PlacedLogo({ src, at }: { src: string; at: string }) {
  return (
    <div
      style={{
        position: "absolute",
        ...(at === "top-left"
          ? { top: "var(--space-safe)", left: "var(--space-safe)" }
          : at === "bottom-right"
            ? { bottom: "var(--space-safe)", right: "var(--space-safe)" }
            : { bottom: "var(--space-safe)", left: 0, right: 0 }),
        display: "flex",
        justifyContent: "center",
      }}
    >
      <Logo slot="logo" src={src} height={5} />
    </div>
  );
}

function SatuObjekSlide({ slots, options }: SlideProps) {
  const dark = options.tone === "primary";
  const tone = BACKGROUND[(options.tone ?? "neutral") as keyof typeof BACKGROUND];
  return (
    <div
      style={{
        position: "relative",
        height: "100%",
        overflow: "hidden",
        background: color(tone ?? "neutral-light"),
      }}
    >
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
        style={{ position: "absolute", left: "20%", right: "20%", bottom: "16%", height: "50%" }}
      >
        <Image slot="image" src={slot(slots, "image", "image").src} fit="contain" />
      </div>
      <TopCaption slots={slots} dark={dark} />
      <PlacedLogo src={slot(slots, "logo", "logo").src} at={options.logo ?? "bottom-center"} />
    </div>
  );
}

export const satuObjek: Template = {
  meta: {
    id: "feed-satu-objek",
    name: "Satu objek",
    format: "feed-4x5",
    description:
      "Satu subjek cut-out kecil di bidang warna dengan ruang kosong luas, satu kalimat dan satu baris pendukung di atas. Untuk produk atau orang dengan pesan sederhana yang tenang.",
    slots: [
      {
        name: "image",
        type: "image",
        required: true,
        description: "Subjek cut-out berlatar transparan",
        aspectRatio: "4:5",
        cutout: true,
      },
      {
        name: "headline",
        type: "text",
        required: true,
        description: "Headline dari copy",
        maxChars: 40,
      },
      {
        name: "body",
        type: "text",
        required: false,
        description: "Satu baris dari copy",
        maxChars: 70,
      },
      {
        name: "logo",
        type: "logo",
        required: true,
        description: "Logo; varian onDark bila tone primary",
      },
    ],
    options: [
      {
        name: "tone",
        values: ["neutral", "secondary", "primary"],
        default: "neutral",
        description: "Warna bidang",
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
