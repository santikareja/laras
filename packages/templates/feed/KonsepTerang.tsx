import { Display, Icon, type IconName, Logo, Photo, Text } from "../primitives/index.ts";
import { type ColorToken, color, space } from "../primitives/vars.ts";
import { optionalSlot, type SlideProps, slot, type Template } from "../src/template.ts";
import { styleTreatment } from "../styles/layer.tsx";

// Arketipe eksperimen Konsep terang (T-139, referensi pemilik "Don't Get TRAPPED"): iklan cetak
// yang lapang. Satu foto konsep besar (cut-out) diagonal dari sudut bawah dengan bayangan lantai
// lembut, satu benda pendamping kecil sebagai penyeimbang, dan blok teks tiga tingkat di kolom
// seberang: pembuka sedang, satu kata kunci raksasa berwarna brand, penutup sedang, lalu body kecil
// dan sapuan kuas. Cincin tipis besar terpotong di sudut sebagai dekor, ajakan berikon di tengah
// bawah, logo di sudut atas. Lapisan: bidang → cincin → subjek dan pendamping → teks → kaki.

const EDGE = "var(--space-safe)";
// Kotak subjek 4:5 (px): sekitar 62% lebar kanvas.
const SUBJECT = { width: 670, height: 838 };
const ICONS: IconName[] = ["pin", "globe", "clock", "calendar", "check", "arrow-right"];
// Bayangan lantai lembut dari token, seperti foto produk di atas lantai terang.
const SHADOW =
  "drop-shadow(18px 26px 26px color-mix(in srgb, var(--color-neutral-dark) 30%, transparent))";

function Arc({ size, style }: { size: number; style: React.CSSProperties }) {
  return (
    <div
      data-qa-element="decor"
      aria-hidden="true"
      style={{
        position: "absolute",
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        border: `${Math.round(size * 0.09)}px solid ${color("secondary")}`,
        opacity: 0.55,
        ...style,
      }}
    />
  );
}

// Sapuan kuas meruncing di kedua ujung, di bawah body.
function Stroke({ tone }: { tone: ColorToken }) {
  return (
    <svg
      data-qa-element="decor"
      aria-hidden="true"
      viewBox="0 0 240 10"
      style={{ display: "block", width: "62%", height: "auto", color: color(tone) }}
    >
      <path d="M0 6 C 70 2, 170 1, 240 4 C 170 7, 70 9, 0 7 Z" fill="currentColor" />
    </svg>
  );
}

function KonsepTerangSlide({ slots, options, style }: SlideProps) {
  const subjectLeft = options.side !== "right";
  const near = subjectLeft ? "left" : "right";
  const far = subjectLeft ? "right" : "left";
  const field: ColorToken = options.tone === "secondary" ? "secondary" : "neutral-light";
  const keyword: ColorToken = options.kata === "accent" ? "accent" : "primary";
  const image = slot(slots, "image", "image");
  const pendamping = optionalSlot(slots, "pendamping", "image");
  const pembuka = optionalSlot(slots, "pembuka", "text");
  const penutup = optionalSlot(slots, "penutup", "text");
  const body = optionalSlot(slots, "body", "text");
  const cta = optionalSlot(slots, "cta", "text");
  const icon = ICONS.find((name) => name === options.ikon) ?? "pin";
  const logoTop = options.logo !== "bottom";
  const treatment = styleTreatment(style);
  return (
    <div
      style={{
        position: "relative",
        height: "100%",
        overflow: "hidden",
        background: color(field),
      }}
    >
      <Arc size={700} style={{ [near]: "-400px", top: "-380px" }} />
      <Arc size={460} style={{ [far]: "-230px", bottom: "-170px" }} />
      <div
        style={{
          position: "absolute",
          [near]: "-4%",
          // Kotak 4:5 dan dasar alpha subjek menembus tepi bawah kanvas: potongan datar cut-out
          // tidak boleh melayang di atas tepi (tampak seperti persegi ditempel).
          bottom: `${-Math.round((1 - (image.subject?.box.bottom ?? 1)) * SUBJECT.height) - 12}px`,
          width: `${SUBJECT.width}px`,
          height: `${SUBJECT.height}px`,
          filter: SHADOW,
        }}
      >
        <Photo
          slot="image"
          src={image.src}
          fit="contain"
          treatment={treatment}
          focus={image.subject?.focus}
        />
      </div>
      {pendamping && (
        <div
          style={{
            position: "absolute",
            [far]: `calc(${EDGE} + 2%)`,
            top: "60%",
            width: "26%",
            height: "20%",
            filter: SHADOW,
          }}
        >
          <Photo slot="pendamping" src={pendamping.src} fit="contain" treatment={treatment} />
        </div>
      )}
      <div
        data-qa-element="group"
        data-qa-name="teks"
        style={{
          position: "absolute",
          top: "15%",
          [far]: EDGE,
          width: "56%",
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr)",
          justifyItems: "start",
          textAlign: "left",
        }}
      >
        {pembuka && (
          <Text slot="pembuka" font="body" size={4} color="neutral-dark" strong balance>
            {pembuka.value}
          </Text>
        )}
        <Display slot="kata" font="heading" scale={2.8} color={keyword}>
          {slot(slots, "kata", "text").value}
        </Display>
        {penutup && (
          <Text slot="penutup" font="body" size={4} color="neutral-dark" strong balance>
            {penutup.value}
          </Text>
        )}
        {body && (
          <div style={{ marginTop: space(5), display: "grid", gap: space(4), width: "100%" }}>
            <Text slot="body" font="body" size={2} color="neutral-dark" measure={34} balance>
              {body.value}
            </Text>
            <Stroke tone={keyword} />
          </div>
        )}
        {cta && (
          // Ajakan berikon di kolom teks: di referensi ia duduk di lantai kosong tengah bawah, tetapi
          // subjek cut-out besar sering mengisi area itu.
          <div
            data-qa-element="group"
            data-qa-name="ajakan"
            style={{
              marginTop: space(5),
              display: "flex",
              alignItems: "center",
              gap: space(2),
              color: color("neutral-dark"),
            }}
          >
            <Icon name={icon} size={36} color={keyword} />
            <Text slot="cta" font="body" size={2} color="neutral-dark" strong>
              {cta.value}
            </Text>
          </div>
        )}
      </div>
      <div
        style={{
          position: "absolute",
          [far]: EDGE,
          ...(logoTop ? { top: EDGE } : { bottom: EDGE }),
        }}
      >
        <Logo slot="logo" src={slot(slots, "logo", "logo").src} height={5} />
      </div>
    </div>
  );
}

export const konsepTerang: Template = {
  meta: {
    id: "feed-konsep-terang",
    name: "Konsep terang",
    format: "feed-4x5",
    description:
      "Iklan cetak yang lapang: satu foto konsep besar (cut-out) diagonal dari sudut bawah dengan bayangan lantai, benda pendamping kecil, blok teks tiga tingkat di kolom seberang (pembuka, satu kata kunci raksasa berwarna brand, penutup), body kecil dengan sapuan kuas, ajakan berikon.  Untuk satu ide visual metafora yang kuat.",
    slots: [
      {
        name: "image",
        type: "image",
        required: true,
        description: "Foto konsep cut-out besar yang membawa ide (orang dengan benda metafora)",
        aspectRatio: "4:5",
        cutout: true,
        composition: {
          base: "Conceptual hero cut-out, large and dramatic like a print-ad photograph on a plain light floor, whole and with a clear readable silhouette; it fills the lower two thirds diagonally from the corner, with soft natural light from above.",
          option: "side",
          byValue: {
            left: "Weight toward the lower left; turn the subject toward the right, where the text sits.",
            right:
              "Weight toward the lower right; turn the subject toward the left, where the text sits.",
          },
        },
      },
      {
        name: "pendamping",
        type: "image",
        required: false,
        description: "Satu benda pendamping kecil yang melengkapi metafora (cut-out)",
        aspectRatio: "4:5",
        cutout: true,
        composition: {
          base: "One small supporting prop that completes the metaphor, photographed from the same angle and with the same soft top light as the main subject, whole inside the frame.",
        },
      },
      {
        name: "pembuka",
        type: "text",
        required: false,
        description: "Baris pembuka sebelum kata kunci",
        maxChars: 22,
      },
      { name: "kata", type: "text", required: true, description: "Satu kata kunci", maxChars: 10 },
      {
        name: "penutup",
        type: "text",
        required: false,
        description: "Baris penutup setelah kata kunci",
        maxChars: 26,
      },
      { name: "body", type: "text", required: false, description: "Satu kalimat", maxChars: 70 },
      {
        name: "cta",
        type: "text",
        required: false,
        description: "Ajakan atau alamat singkat",
        maxChars: 36,
      },
      { name: "logo", type: "logo", required: true, description: "Logo brand" },
    ],
    options: [
      {
        name: "side",
        values: ["left", "right"],
        default: "left",
        description: "Sisi subjek; teks di seberangnya",
      },
      {
        name: "tone",
        values: ["neutral", "secondary"],
        default: "neutral",
        description: "Warna bidang terang",
      },
      {
        name: "kata",
        values: ["primary", "accent"],
        default: "primary",
        description: "Warna kata kunci dan aksen",
      },
      {
        name: "ikon",
        values: ICONS,
        default: "pin",
        description: "Ikon ajakan",
      },
      {
        name: "logo",
        values: ["top", "bottom"],
        default: "top",
        description: "Logo di sudut atas atau bawah sisi teks",
      },
    ],
  },
  Slide: KonsepTerangSlide,
};
