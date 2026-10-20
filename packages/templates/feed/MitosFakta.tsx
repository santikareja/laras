import type { CSSProperties } from "react";
import { Button, Logo, Photo, Text } from "../primitives/index.ts";
import {
  type ColorToken,
  color,
  fontFamily,
  fontSize,
  fontWeight,
  space,
} from "../primitives/vars.ts";
import { CANVAS } from "../src/geometry.ts";
import { optionalSlot, type SlideProps, slot, type Template } from "../src/template.ts";
import {
  HangTag,
  InnerBlob,
  placeSubject,
  subjectStyle,
  Verdict,
} from "../styles/flat-design/parts.tsx";
import { styleTreatment } from "../styles/layer.tsx";

// Arketipe Mitos atau fakta (T-134, PANDUAN Flat Design pola 2; referensi thryv): edukasi singkat
// yang membantah satu mitos. Bentuk berlapis (blob, pita, atau busur) di belakang subjek cut-out
// yang menembus tepi bawah; tag gantung miring di atas kepala subjek; di sisi seberang headline
// pemancing, baris mitos bertanda × yang dicoret, dan fakta bertanda ✓ (di kartu atau polos),
// CTA, logo. Lapisan: bidang → bentuk → subjek → tag → teks → CTA dan logo. Tujuh elemen.

const MARGIN = "var(--space-safe)";
const COLUMN = "50%";

type Layers = { back: ColorToken; front: ColorToken };

// Pasangan warna bentuk dari warna bidang (aksen hanya untuk bentuk kecil di depan).
function layersFor(field: ColorToken): Layers {
  if (field === "primary") return { back: "secondary", front: "accent" };
  if (field === "secondary") return { back: "primary", front: "accent" };
  return { back: "primary", front: "secondary" };
}

type ShapeProps = {
  kind: string;
  layers: Layers;
  double: boolean;
  focus: { x: number; y: number };
  flip: boolean;
};

const at = (left: number, top: number, width: number, height: number): CSSProperties => ({
  position: "absolute",
  left: `${Math.round(left)}px`,
  top: `${Math.round(top)}px`,
  width: `${Math.round(width)}px`,
  height: `${Math.round(height)}px`,
});

// Bentuk berlapis di sisi subjek, dihitung sebagai satu bentuk (satu keluarga, P5 panduan).
function Shapes({ kind, layers, double, focus, flip }: ShapeProps) {
  const mirror = (left: number, width: number) => (flip ? CANVAS.width - left - width : left);
  const box = (left: number, top: number, width: number, height: number) =>
    at(mirror(left, width), top, width, height);
  const fx = flip ? CANVAS.width - focus.x : focus.x;
  const fy = focus.y;
  return (
    <div
      data-qa-element="shape"
      data-qa-name={kind}
      aria-hidden="true"
      style={{ position: "absolute", inset: 0, overflow: "hidden" }}
    >
      {kind === "pita" && (
        <svg
          aria-hidden="true"
          viewBox={`0 0 ${CANVAS.width} ${CANVAS.height}`}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        >
          <g transform={flip ? `translate(${CANVAS.width} 0) scale(-1 1)` : undefined}>
            <path
              d={`M 1240 ${fy + 420} C ${fx + 60} ${fy + 470}, ${fx - 280} ${fy + 100}, ${fx - 130} ${fy - 170} S ${fx + 150} ${fy - 430}, ${fx + 110} -140`}
              fill="none"
              strokeWidth={190}
              style={{ stroke: color(layers.back) }}
            />
            {double && (
              <path
                d={`M ${fx - 60} 1480 C ${fx - 40} ${fy + 520}, ${fx + 240} ${fy + 260}, 1240 ${fy + 220}`}
                fill="none"
                strokeWidth={120}
                style={{ stroke: color(layers.front) }}
              />
            )}
          </g>
        </svg>
      )}
      {kind === "busur" && (
        <svg
          aria-hidden="true"
          viewBox={`0 0 ${CANVAS.width} ${CANVAS.height}`}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
        >
          <g transform={flip ? `translate(${CANVAS.width} 0) scale(-1 1)` : undefined}>
            {double && (
              <circle
                cx={CANVAS.width}
                cy={CANVAS.height}
                r={320}
                style={{ fill: color(layers.front) }}
              />
            )}
            <circle
              cx={CANVAS.width}
              cy={CANVAS.height}
              r={545}
              fill="none"
              strokeWidth={160}
              style={{ stroke: color(layers.back) }}
            />
          </g>
        </svg>
      )}
      {kind === "blob" && (
        <>
          <div style={box(fx - 360, focus.y - 300, 860, 940)}>
            <InnerBlob color={layers.back} points={6} seed={4} variation={0.14} />
          </div>
          {double && (
            <div style={box(fx + 120, focus.y + 300, 420, 400)}>
              <InnerBlob color={layers.front} points={5} seed={1} variation={0.12} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function MitosFaktaSlide({ slots, options, style }: SlideProps) {
  const flip = options.flip === "yes";
  const near = flip ? "right" : "left";
  const field: ColorToken =
    options.tone === "primary"
      ? "primary"
      : options.tone === "secondary"
        ? "secondary"
        : "neutral-light";
  const dark = field === "primary";
  const ink: ColorToken = dark ? "neutral-light" : "neutral-dark";
  const heading: ColorToken = dark ? "neutral-light" : "primary";
  const layers = layersFor(field);
  const card = options.fakta !== "polos";
  const kind = options.bentuk === "pita" || options.bentuk === "busur" ? options.bentuk : "blob";
  const mirror = (x: number) => (flip ? CANVAS.width - x : x);

  const image = slot(slots, "image", "image");
  const tanda = optionalSlot(slots, "tanda", "text");
  const angka = optionalSlot(slots, "angka", "text");
  const cta = optionalSlot(slots, "cta", "text");
  const logoBottom = options.logo === "bottom";

  // Wajah (atau produk) di sepertiga sisi subjek, setinggi kolom vonis; subjek menembus bawah.
  const frame = placeSubject(
    image.subject,
    {
      focus: { x: mirror(790), y: 610 },
      bottom: CANVAS.height + 150,
      maxWidth: 600,
      minLeft: flip ? -300 : 620,
      maxRight: flip ? 460 : CANVAS.width + 300,
    },
    { width: 840 },
  );
  // Fakta di kartu: kartu warna seberang bidang; tanpa kartu: teks di bidang.
  const factInk: ColorToken = card ? (dark ? "neutral-dark" : "neutral-light") : ink;
  const logo = <Logo slot="logo" src={slot(slots, "logo", "logo").src} height={6} />;

  return (
    <div
      style={{ position: "relative", height: "100%", overflow: "hidden", background: color(field) }}
    >
      <Shapes
        kind={kind}
        layers={layers}
        double={options.lapis !== "satu"}
        focus={frame.focus}
        flip={flip}
      />
      <div style={subjectStyle(frame)}>
        <Photo
          slot="image"
          src={image.src}
          fit="contain"
          treatment={styleTreatment(style)}
          focus={image.subject?.focus}
        />
      </div>
      {tanda && (
        <div
          style={{
            position: "absolute",
            top: "calc(var(--space-safe) + 56px)",
            left: `${mirror(846)}px`,
            transform: "translateX(-50%)",
          }}
        >
          <HangTag
            slot="tanda"
            background={dark ? "neutral-light" : "neutral-dark"}
            color={dark ? "neutral-dark" : "neutral-light"}
            string={dark ? "neutral-light" : "neutral-dark"}
            drop={240}
            rotate={flip ? 7 : -7}
          >
            {tanda.value}
          </HangTag>
        </div>
      )}

      {!logoBottom && (
        <div style={{ position: "absolute", top: MARGIN, [near]: MARGIN }}>{logo}</div>
      )}
      <div
        style={{
          position: "absolute",
          top: "15%",
          [near]: MARGIN,
          width: COLUMN,
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr)",
          gap: space(6),
        }}
      >
        <Text slot="headline" as="h1" font="heading" size={5} color={heading} balance>
          {slot(slots, "headline", "text").value}
        </Text>
        <div
          data-qa-element="group"
          data-qa-name="vonis"
          style={{ display: "grid", gap: space(5) }}
        >
          <Verdict
            icon="x"
            label={{ slot: "labelMitos", text: slot(slots, "labelMitos", "text").value }}
            statement={{ slot: "mitos", text: slot(slots, "mitos", "text").value }}
            mark="accent"
            markInk="neutral-dark"
            ink={ink}
            struck="accent"
          />
          <div
            style={{
              ...(card
                ? {
                    padding: space(4),
                    borderRadius: "var(--shape-radius)",
                    background: color(dark ? "neutral-light" : "primary"),
                  }
                : {}),
            }}
          >
            <Verdict
              icon="check"
              label={{ slot: "labelFakta", text: slot(slots, "labelFakta", "text").value }}
              statement={{ slot: "fakta", text: slot(slots, "fakta", "text").value }}
              mark={card ? (dark ? "primary" : "secondary") : "primary"}
              markInk={card ? (dark ? "neutral-light" : "primary") : "neutral-light"}
              ink={factInk}
              strong
            >
              {angka && (
                <span
                  data-slot="angka"
                  data-slot-type="text"
                  style={{
                    gridColumn: "1 / -1",
                    marginTop: space(2),
                    fontFamily: fontFamily("heading"),
                    fontWeight: fontWeight("heading", true),
                    fontSize: fontSize(5),
                    fontSynthesis: "none",
                    lineHeight: 1,
                    color: color(factInk),
                  }}
                >
                  {angka.value}
                </span>
              )}
            </Verdict>
          </div>
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          bottom: MARGIN,
          [near]: MARGIN,
          display: "grid",
          justifyItems: flip ? "end" : "start",
          gap: space(4),
        }}
      >
        {cta && (
          <Button slot="cta" shape="pill">
            {cta.value}
          </Button>
        )}
        {logoBottom && logo}
      </div>
    </div>
  );
}

export const mitosFakta: Template = {
  meta: {
    id: "feed-mitos-fakta",
    name: "Mitos atau fakta",
    format: "feed-4x5",
    description:
      "Edukasi singkat yang membantah satu mitos: subjek cut-out berekspresi ragu di depan bentuk berlapis, tag gantung miring, headline pemancing, mitos bertanda × yang dicoret, fakta bertanda ✓ di kartu, CTA. Untuk mitos vs fakta, salah kaprah, atau tanya jawab.",
    slots: [
      {
        name: "image",
        type: "image",
        required: true,
        description:
          "Orang cut-out setengah badan berekspresi ragu, berpikir, atau menunjuk (atau tangan memegang produk), terpotong di bawah",
        aspectRatio: "4:5",
        cutout: true,
        composition: {
          base: "Person from the waist up, cropped flat at the bottom, with a doubtful, thinking, or pointing expression (or a hand holding the product); head clear, because a hanging tag sits above it.",
          option: "flip",
          byValue: {
            no: "Turn the body and gaze slightly toward the left, where the text sits.",
            yes: "Turn the body and gaze slightly toward the right, where the text sits.",
          },
        },
      },
      {
        name: "tanda",
        type: "text",
        required: false,
        description: "Teks tag gantung dari copy, mis. Mitos vs Fakta",
        maxChars: 16,
      },
      {
        name: "headline",
        type: "text",
        required: true,
        description: "Pertanyaan pemancing pendek dari copy",
        maxChars: 22,
      },
      {
        name: "labelMitos",
        type: "text",
        required: true,
        description: "Label mitos satu kata dari copy (Mitos, Myth)",
        maxChars: 8,
      },
      {
        name: "mitos",
        type: "text",
        required: true,
        description: "Pernyataan mitos yang dibantah, satu kalimat dari copy",
        maxChars: 36,
      },
      {
        name: "labelFakta",
        type: "text",
        required: true,
        description: "Label fakta satu kata dari copy (Fakta, Fact)",
        maxChars: 8,
      },
      {
        name: "angka",
        type: "text",
        required: false,
        description: "Angka besar pendukung fakta dari copy (waktu, jarak, harga)",
        maxChars: 8,
      },
      {
        name: "fakta",
        type: "text",
        required: true,
        description: "Fakta yang membantah, dari knowledge",
        maxChars: 56,
      },
      { name: "cta", type: "text", required: false, description: "Ajakan dari copy", maxChars: 18 },
      {
        name: "logo",
        type: "logo",
        required: true,
        description: "Logo; pakai onDark bila tone primary",
      },
    ],
    options: [
      {
        name: "bentuk",
        values: ["blob", "pita", "busur"],
        default: "blob",
        description:
          "Bentuk di belakang subjek: blob (radius brand > 0), pita lengkung tebal, busur (brand bersudut siku)",
      },
      {
        name: "lapis",
        values: ["dua", "satu"],
        default: "dua",
        description: "Dua lapis bentuk, atau satu bila brand membatasi elemen visual",
      },
      {
        name: "tone",
        values: ["neutral", "secondary", "primary"],
        default: "neutral",
        description: "Warna bidang",
      },
      {
        name: "fakta",
        values: ["kartu", "polos"],
        default: "kartu",
        description: "Fakta di kartu warna seberang bidang, atau polos (elemen visual minimal)",
      },
      {
        name: "flip",
        values: ["no", "yes"],
        default: "no",
        description: "Subjek di kiri, teks di kanan",
      },
      {
        name: "logo",
        values: ["top", "bottom"],
        default: "top",
        description: "Logo di sudut atas atau bawah sisi teks, mengikuti aturan brand",
      },
    ],
  },
  Slide: MitosFaktaSlide,
};
