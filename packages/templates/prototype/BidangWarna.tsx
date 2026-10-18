import { Display, Image, Logo, Sticker, Text } from "../primitives/index.ts";
import { color, space } from "../primitives/vars.ts";
import { optionalSlot, type SlideProps, slot, type Template } from "../src/template.ts";

// Prototipe A2 v4 (T-122, PRD 4 P2, P8–P11): bidang warna dominan, lengkung warna kedua di
// belakang subjek cut-out, satu blok teks (pembuka bersorot, frasa utama bertumpuk, penutup)
// di sudut bawah seberang subjek, CTA tombol aksen dan logo. Lima elemen: lengkung, subjek,
// blok teks, CTA, logo. Fokus subjek di titik potong atas grid 3×3, blok teks di titik potong
// bawah seberangnya. Tanpa kemiringan. `flip` menukar sisi (logo kanan bawah untuk Kopi).

const EDGE = `calc(var(--space-safe) + ${space(1)})`;
// Perkiraan lebar huruf kapital per font heading (em); fit-to-width terukur menyusul di T-123.
const CHAR_WIDTH: Record<string, number> = { wide: 0.78, medium: 0.64, condensed: 0.5 };

function BidangWarnaSlide({ slots, options }: SlideProps) {
  const flip = options.flip === "yes";
  const near = flip ? "right" : "left";
  const far = flip ? "left" : "right";
  const pembuka = optionalSlot(slots, "pembuka", "text");
  const penutup = optionalSlot(slots, "penutup", "text");
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
          width: options.arch === "low" ? "46%" : "52%",
          height: options.arch === "low" ? "50%" : "62%",
          borderRadius: "999px 999px 0 0",
          background: color("primary"),
        }}
      />
      <div
        style={{ position: "absolute", [far]: "-6%", bottom: "-3%", width: "60%", height: "82%" }}
      >
        <Image slot="image" src={slot(slots, "image", "image").src} fit="contain" />
      </div>
      {/* Blok teks di seberang diagonal titik fokus subjek (PRD 4 P8): atas bila fokus di bawah. */}
      <div
        style={{
          position: "absolute",
          ...(options.text === "top"
            ? { top: EDGE }
            : { bottom: `calc(${EDGE} + ${space(7)} + ${space(3)})` }),
          [near]: EDGE,
          width: "48%",
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
          charWidth={CHAR_WIDTH[options.width ?? "wide"] ?? 0.78}
          align={near}
          stack
          color="primary"
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
    </div>
  );
}

export const bidangWarna: Template = {
  meta: {
    id: "proto-bidang-warna",
    name: "Bidang warna",
    format: "feed-4x5",
    description:
      "Prototipe: bidang warna dominan, lengkung di belakang subjek cut-out, satu blok teks tiga tingkat di sudut bawah seberang subjek, CTA tombol.",
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
      {
        name: "penutup",
        type: "text",
        required: false,
        description: "Penutup, boleh berisi fakta",
        maxChars: 32,
      },
      { name: "cta", type: "text", required: false, description: "Ajakan", maxChars: 28 },
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
        values: ["high", "low"],
        default: "high",
        description: "Tinggi lengkung, untuk menjaga proporsi warna kedua",
      },
      {
        name: "width",
        values: ["wide", "medium", "condensed"],
        default: "wide",
        description: "Lebar huruf font heading, untuk ukuran frasa utama",
      },
      {
        name: "text",
        values: ["bottom", "top"],
        default: "bottom",
        description: "Letak blok teks, di seberang diagonal titik fokus subjek",
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
