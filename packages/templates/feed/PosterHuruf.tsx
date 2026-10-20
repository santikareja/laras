import { Logo, Photo, Rule, Sticker, Text } from "../primitives/index.ts";
import { type ColorToken, color, space } from "../primitives/vars.ts";
import { optionalSlot, type SlideProps, slot, type Template } from "../src/template.ts";
import { StyleBackdrop, StyleOverlay, styleTreatment } from "../styles/layer.tsx";
import {
  AccentText,
  BigWord,
  type CastShadow,
  castShadow,
  LAYER,
  wordRows,
} from "../styles/retro-vintage/parts.tsx";
import { SceneBackdrop, sceneSlot } from "./scene.tsx";

// Arketipe Poster huruf (T-134, Vintage/Retro pola 3; PRD 4 K2, K3, K8): poster acara 70-an.
// Kata kunci raksasa memenuhi lebar di separuh atas bidang warna, subjek cut-out berdiri atau
// duduk di depan bagian bawah hurufnya dengan bayangan keras di dinding, baris kredit cetak di
// atas, dan blok detail editorial (headline pendek + kolom fakta + CTA) di sisi seberang subjek.

const EDGE = "var(--space-safe)";
// Kata dimulai di bawah baris kredit; area konten font display (Anton ±0,3 em di atas kotak
// baris) harus tetap di dalam kanvas, jadi kata tidak boleh lebih tinggi dari ini.
const WORD_TOP = 19;
const LINE = 0.86;
// Tinggi tumpukan kata maksimal (px): blok detail di bawahnya selalu punya tempat.
const STACK = 620;
// Kepala subjek menimpa bagian bawah kata (maks ±35% tinggi baris terakhir, Vintage/Retro P6):
// titik ini (pecahan tinggi kotak kata) adalah puncak tubuh subjek; tubuh memanjang sampai dasar.
const overlap = (rows: number) => 1 - 0.32 / rows;
const FALLBACK_BOX = { left: 0.1, top: 0.05, right: 0.9, bottom: 0.95 };

const FIELD: Record<string, { field: ColorToken; ink: ColorToken; small: ColorToken }> = {
  primary: { field: "primary", ink: "secondary", small: "neutral-light" },
  secondary: { field: "secondary", ink: "primary", small: "neutral-dark" },
  accent: { field: "accent", ink: "primary", small: "neutral-dark" },
  neutral: { field: "neutral-light", ink: "primary", small: "neutral-dark" },
};

function PosterHurufSlide({ slots, options, style }: SlideProps) {
  const tone = FIELD[options.tone ?? "secondary"] ?? FIELD.secondary;
  if (!tone) throw new Error("Tone tidak dikenal");
  const ink: ColorToken = options.huruf === "accent" ? "accent" : tone.ink;
  const image = slot(slots, "image", "image");
  const scene = optionalSlot(slots, "adegan", "image");
  const box = image.subject?.box ?? FALLBACK_BOX;
  const kredit = optionalSlot(slots, "kredit", "text");
  const info = optionalSlot(slots, "info", "text");
  const cta = optionalSlot(slots, "cta", "text");
  const columns = ["kolom1", "kolom2", "kolom3"].flatMap((name) => {
    const value = optionalSlot(slots, name, "text");
    return value ? [{ name, value: value.value }] : [];
  });
  const rows = wordRows(slot(slots, "kata", "text").value, 2, false);
  const cap = Math.round(STACK / (rows.length * LINE));
  const subjectLeft = options.side !== "right";
  // Tinggi pembungkus subjek: dari OVERLAP kotak kata sampai dasar kanvas, dibagi tinggi tubuh.
  const span = box.bottom - box.top;
  const cover = Math.round(overlap(rows.length) * 100);
  const height = `calc((${100 - WORD_TOP}cqh - ${cover}%) / ${span.toFixed(3)})`;
  const shadow = castShadow(tone.field, (options.bayangan as CastShadow) ?? "keras", !subjectLeft);
  return (
    <div
      style={{
        position: "relative",
        height: "100%",
        overflow: "hidden",
        containerType: "size",
        background: color(tone.field),
      }}
    >
      {scene ? (
        <SceneBackdrop src={scene.src} treatment={styleTreatment(style)} />
      ) : (
        <StyleBackdrop style={style} subjectSide={subjectLeft ? "left" : "right"} />
      )}
      {(kredit || info) && (
        <div
          data-qa-element="group"
          data-qa-name="kredit"
          style={{
            position: "absolute",
            zIndex: LAYER.text,
            top: EDGE,
            left: EDGE,
            right: EDGE,
            display: "grid",
            gap: space(2),
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: space(4) }}>
            {kredit ? (
              <AccentText slot="kredit" caps color={tone.small}>
                {kredit.value}
              </AccentText>
            ) : (
              <span />
            )}
            {info && (
              <AccentText slot="info" caps color={tone.small} align="right">
                {info.value}
              </AccentText>
            )}
          </div>
          <Rule color={tone.small} weight={2} />
        </div>
      )}
      <div style={{ position: "absolute", top: `${WORD_TOP}%`, left: EDGE, right: EDGE }}>
        <BigWord slot="kata" rows={rows} color={ink} cap={cap} mode="justify" lineHeight={LINE} />
        <div
          style={{
            position: "absolute",
            zIndex: LAYER.subject,
            height,
            top: `calc(${cover}% - ${height} * ${box.top.toFixed(3)})`,
            aspectRatio: "4 / 5",
            // Pusat tubuh di sepertiga kanvas sisi subjek.
            left: `calc(${subjectLeft ? 33 : 67}cqw - var(--space-safe))`,
            transform: `translateX(-${(((box.left + box.right) / 2) * 100).toFixed(1)}%)`,
            // Bayangan keras di dinding hanya untuk bidang warna; adegan punya cahayanya sendiri.
            filter: scene ? undefined : shadow,
          }}
        >
          <Photo
            slot="image"
            src={image.src}
            fit="contain"
            treatment={styleTreatment(style)}
            focus={image.subject?.focus}
          />
        </div>
      </div>
      <div
        data-qa-element="group"
        data-qa-name="detail"
        style={{
          position: "absolute",
          zIndex: LAYER.text,
          bottom: EDGE,
          width: "40%",
          ...(subjectLeft ? { right: EDGE } : { left: EDGE }),
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr)",
          gap: space(3),
        }}
      >
        <Text slot="headline" as="h1" font="heading" size={3} color={tone.small} balance>
          {slot(slots, "headline", "text").value}
        </Text>
        {columns.length > 0 && (
          <div style={{ display: "grid", gap: space(2) }}>
            {columns.map((column) => (
              <div key={column.name} style={{ display: "grid", gap: space(1) }}>
                <Rule color={tone.small} weight={2} />
                <AccentText slot={column.name} color={tone.small}>
                  {column.value}
                </AccentText>
              </div>
            ))}
          </div>
        )}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: cta ? "space-between" : "flex-end",
            gap: space(3),
          }}
        >
          {cta && (
            <Sticker
              slot="cta"
              size={1}
              background={tone.field === "primary" ? "secondary" : "primary"}
              color={tone.field === "primary" ? "primary" : "neutral-light"}
            >
              {cta.value}
            </Sticker>
          )}
          <Logo slot="logo" src={slot(slots, "logo", "logo").src} height={6} />
        </div>
      </div>
      <StyleOverlay style={style} surface={tone.field === "primary" ? "dark" : "light"} />
    </div>
  );
}

export const posterHuruf: Template = {
  meta: {
    id: "feed-poster-huruf",
    name: "Poster huruf",
    format: "feed-4x5",
    description:
      "Poster acara 70-an: kata kunci atau angka raksasa memenuhi lebar separuh atas bidang warna, subjek cut-out di depan bagian bawah hurufnya dengan bayangan di dinding, baris kredit kecil di atas, dan blok detail (headline pendek, tiga kolom fakta, CTA) di sisi seberang subjek. Untuk acara, profil orang, atau satu angka kunci.",
    slots: [
      sceneSlot(
        "Keep the upper half calm and plain (wall, sky, or backdrop), because a giant word fills it, and keep the lower corner opposite the subject calm for a small text block.",
        { primary: "dark", secondary: "light", accent: "light", neutral: "light" },
      ),
      {
        name: "image",
        type: "image",
        required: true,
        description: "Subjek cut-out seluruh badan (berdiri atau duduk) berlatar transparan",
        aspectRatio: "4:5",
        cutout: true,
        composition: {
          base: "Full-body subject standing or sitting with the whole figure inside the frame, posed like a 1970s poster portrait; a giant word sits behind the head and shoulders.",
          option: "side",
          byValue: {
            left: "Turn the body and gaze slightly toward the right, where the text sits.",
            right: "Turn the body and gaze slightly toward the left, where the text sits.",
          },
        },
      },
      {
        name: "kata",
        type: "text",
        required: true,
        description:
          "Kata kunci atau angka pendek dari copy (1–2 kata, setiap kata satu baris); makin pendek makin besar",
        maxChars: 16,
      },
      {
        name: "headline",
        type: "text",
        required: true,
        description: "Headline pendek yang melengkapi kata kunci",
        maxChars: 44,
      },
      {
        name: "kolom1",
        type: "text",
        required: false,
        description: "Fakta pendek pertama dari copy (kolom editorial)",
        maxChars: 28,
      },
      { name: "kolom2", type: "text", required: false, description: "Fakta kedua", maxChars: 28 },
      { name: "kolom3", type: "text", required: false, description: "Fakta ketiga", maxChars: 28 },
      {
        name: "kredit",
        type: "text",
        required: false,
        description: "Kredit kecil kiri atas: nama acara, lokasi, atau seri",
        maxChars: 24,
      },
      {
        name: "info",
        type: "text",
        required: false,
        description: "Kredit kecil kanan atas: tanggal, jam, atau kota",
        maxChars: 18,
      },
      { name: "cta", type: "text", required: false, description: "Ajakan dari copy", maxChars: 22 },
      {
        name: "logo",
        type: "logo",
        required: true,
        description: "Logo; pakai onDark bila tone primary",
      },
    ],
    options: [
      {
        name: "tone",
        values: ["secondary", "primary", "accent", "neutral"],
        default: "secondary",
        description: "Warna dinding poster",
      },
      {
        name: "huruf",
        values: ["kontras", "accent"],
        default: "kontras",
        description:
          "Warna kata: kontras dengan dinding, atau accent (hanya di dinding primary yang gelap)",
      },
      {
        name: "side",
        values: ["left", "right"],
        default: "left",
        description: "Sisi subjek; blok detail dan logo di bawah sisi seberangnya",
      },
      {
        name: "bayangan",
        values: ["keras", "lembut", "tanpa"],
        default: "keras",
        description: "Bayangan subjek di dinding; ikuti bayangan Brand Kit",
      },
    ],
  },
  Slide: PosterHurufSlide,
};
