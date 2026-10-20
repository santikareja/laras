import { CanvasFrame, Icon, type IconName, Logo, Photo, Rule, Text } from "../primitives/index.ts";
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
  placeSubject,
  Ripple,
  Stage,
  type StageKind,
  Swirl,
  subjectStyle,
} from "../styles/flat-design/parts.tsx";
import { styleEffect, styleTreatment } from "../styles/layer.tsx";
import { SceneBackdrop, sceneSlot } from "./scene.tsx";

// Arketipe Subjek dan lingkar (T-134, PANDUAN Flat Design pola 1; referensi Opay): satu bentuk
// besar pembawa metafora (cakram matahari, cincin, lensa kaca pembesar, biji kopi, blob) di
// belakang subjek cut-out yang kepalanya keluar dari tepi atas bentuk, garis swirl tebal yang
// mengikat subjek dengan bidang, riak tone-on-tone, headline dua nada, chip info, CTA, logo.
// Lapisan: bidang → riak → bingkai → bentuk → swirl → subjek → chip dan headline → CTA, logo.
// Susunan `samping`: kolom teks di sisi dekat, wajah subjek di sepertiga atas sisi jauh (subjek
// seluruh badan). Susunan `atas`: teks di atas, wajah di sepertiga bawah, bentuk terpotong tepi
// bawah seperti matahari terbit (subjek setengah badan).

const MARGIN = "var(--space-safe)";
// Batas atas cakram di susunan atas (px), di bawah blok headline dan CTA; logo di atas menurunkan
// blok teks 96 px, jadi batasnya ikut turun.
const DISC_TOP = 0.4 * 1350;
const LOGO_TOP_OFFSET = 96;
const STAGE: Record<StageKind, { size: number; drop: number }> = {
  // drop: jarak pusat bentuk di bawah wajah, sebagai bagian diameter.
  cakram: { size: 600, drop: 0.68 },
  cincin: { size: 600, drop: 0.66 },
  blob: { size: 620, drop: 0.66 },
  lensa: { size: 620, drop: 0.06 },
  biji: { size: 840, drop: -0.06 },
};
const KINDS = Object.keys(STAGE) as StageKind[];
const ICONS: IconName[] = ["calendar", "clock", "pin", "check", "star"];

function SubjekLingkarSlide({ slots, options, style }: SlideProps) {
  const flip = options.flip === "yes";
  const near = flip ? "right" : "left";
  const image = slot(slots, "image", "image");
  // Subjek lebar (mis. orang bersama hewan) menjadi kecil di kolom samping, jadi selalu memakai
  // susunan atas agar subjek menonjol (catatan pemilik T-139).
  const box = image.subject?.box;
  const wide = box ? (box.right - box.left) / ((box.bottom - box.top) * 1.25) > 0.75 : false;
  const side = options.susunan === "atas" || wide ? "atas" : "samping";
  const field: ColorToken =
    options.tone === "secondary"
      ? "secondary"
      : options.tone === "neutral"
        ? "neutral-light"
        : "primary";
  const dark = field === "primary";
  const ink: ColorToken = dark ? "neutral-light" : "primary";
  const fill: ColorToken = field === "primary" ? "secondary" : "primary";
  const kind = KINDS.find((k) => k === options.bentuk) ?? "cakram";
  const logoBottom = options.logo === "bottom";
  const mirror = (x: number) => (flip ? CANVAS.width - x : x);

  const info = optionalSlot(slots, "info", "text");
  const scene = optionalSlot(slots, "adegan", "image");
  const sorotan = optionalSlot(slots, "sorotan", "text");
  const cta = optionalSlot(slots, "cta", "text");
  const icon = ICONS.find((name) => name === options.ikon);

  // Wajah di titik sepertiga sisi jauh: atas untuk susunan samping, bawah untuk susunan atas.
  const cut = (image.subject?.box.bottom ?? 1) >= 0.97;
  // Susunan atas simetris (catatan pemilik T-139 lanjutan): subjek di tengah, cakram besar di
  // belakang kepalanya seperti matahari sore, headline terpusat di atas.
  const placed = placeSubject(
    image.subject,
    side === "atas"
      ? {
          focus: { x: CANVAS.width / 2, y: 860 },
          bottom: CANVAS.height + 170,
          maxWidth: 780,
          minLeft: -400,
          maxRight: CANVAS.width + 400,
        }
      : {
          focus: { x: mirror(770), y: 430 },
          bottom: cut ? CANVAS.height + 12 : CANVAS.height - 56,
          maxWidth: 560,
          minLeft: flip ? 24 : 470,
          maxRight: flip ? 610 : CANVAS.width - 24,
        },
    side === "atas" ? { width: 900 } : { width: 760 },
  );
  // Susunan atas: kotak subjek (bukan wajah) di tengah kanvas, agar kelompok lebar seimbang.
  const shift =
    side === "atas" && box
      ? CANVAS.width / 2 - (placed.left + ((box.left + box.right) / 2) * placed.width)
      : 0;
  const frame = {
    ...placed,
    left: placed.left + shift,
    focus: { ...placed.focus, x: placed.focus.x + shift },
  };
  const stageKind = STAGE[kind];
  // Cakram di susunan atas lebih besar dan naik ke belakang kepala agar terbaca utuh sebagai halo.
  const size = side === "atas" ? Math.round(stageKind.size * 1.25) : stageKind.size;
  const drop = side === "atas" ? Math.min(stageKind.drop, 0.2) : stageKind.drop;
  const stage = {
    x:
      side === "atas"
        ? frame.focus.x
        : frame.focus.x + (flip ? -1 : 1) * (kind === "biji" ? 40 : kind === "lensa" ? 0 : 30),
    // Puncak cakram tidak lebih tinggi dari 40% kanvas agar headline dan CTA di atasnya bebas.
    y:
      side === "atas"
        ? Math.max(
            frame.focus.y + size * drop,
            DISC_TOP + (logoBottom ? 0 : LOGO_TOP_OFFSET) + size / 2,
          )
        : frame.focus.y + size * drop,
  };
  const headlineSize = side === "atas" ? 6 : 5;
  const swirl =
    options.garis === "none" ? undefined : options.garis === "light" ? "neutral-light" : "accent";

  const sorot =
    sorotan &&
    (options.sorot === "block" ? (
      // Blok sorot satu warna aksen bersudut brand (kata dalam pill, PANDUAN 5), tegak 0°.
      <div
        style={{
          width: "fit-content",
          padding: "0 0.18em 0.06em",
          borderRadius: "var(--shape-radius)",
          background: color("accent"),
        }}
      >
        <Text slot="sorotan" font="heading" size={headlineSize} color="neutral-dark">
          {sorotan.value}
        </Text>
      </div>
    ) : (
      <Text
        slot="sorotan"
        font="heading"
        size={headlineSize}
        color={options.sorot === "secondary" ? "secondary" : "accent"}
        effect={styleEffect(style, "headline")}
        balance
      >
        {sorotan.value}
      </Text>
    ));

  const logo = <Logo slot="logo" src={slot(slots, "logo", "logo").src} height={6} />;
  return (
    <div
      style={{
        position: "relative",
        height: "100%",
        overflow: "hidden",
        background: color(field),
      }}
    >
      {scene && <SceneBackdrop src={scene.src} treatment={styleTreatment(style)} />}
      {!scene && options.pola !== "none" && (
        <Ripple center={stage} field={field} ink={fill} from={Math.round(size / 2) + 56} />
      )}
      {options.bingkai === "garis" && (
        <CanvasFrame color={dark ? "neutral-light" : "primary"} inset={36} opacity={0.45} />
      )}
      <Stage kind={kind} center={stage} size={size} fill={fill} line={field} flip={flip} />
      {swirl && (
        <Swirl
          {...(side === "samping" && (kind === "biji" || kind === "lensa")
            ? {
                center: { x: frame.focus.x + (flip ? -60 : 60), y: frame.focus.y + 380 },
                radius: 470,
                from: -125,
                to: 125,
              }
            : side === "atas"
              ? // Busur kiri bawah: tidak naik ke area headline dan CTA di atas cakram.
                { center: stage, radius: size / 2 + 70, from: 110, to: 200 }
              : { center: stage, radius: size / 2 + 70, from: -100, to: 110 })}
          color={swirl}
          flip={flip}
        />
      )}
      <div style={subjectStyle(frame)}>
        <Photo
          slot="image"
          src={image.src}
          fit="contain"
          treatment={styleTreatment(style)}
          focus={image.subject?.focus}
        />
      </div>

      <div
        data-qa-element="group"
        data-qa-name="headline"
        style={{
          position: "absolute",
          ...(side === "atas" ? { left: MARGIN, right: MARGIN } : { [near]: MARGIN, width: "40%" }),
          top: side === "atas" ? `calc(${MARGIN} + ${logoBottom ? 0 : LOGO_TOP_OFFSET}px)` : "21%",
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr)",
          justifyItems: side === "atas" ? "center" : flip ? "end" : "start",
          textAlign: side === "atas" ? "center" : near,
          gap: space(1),
        }}
      >
        {info && (
          <span
            style={{
              display: "flex",
              flexDirection: flip ? "row-reverse" : "row",
              alignItems: "center",
              gap: space(2),
              marginBottom: space(3),
              padding: `${space(1)} ${space(3)}`,
              borderRadius: "var(--radius-pill)",
              background: color(dark ? "neutral-light" : "primary"),
              color: color(dark ? "primary" : "neutral-light"),
            }}
          >
            {icon && <Icon name={icon} size={28} stroke={3} />}
            <span
              data-slot="info"
              data-slot-type="text"
              style={{
                fontFamily: fontFamily("body"),
                fontWeight: fontWeight("body", true),
                fontSize: fontSize(1),
                fontSynthesis: "none",
                lineHeight: 1.3,
              }}
            >
              {info.value}
            </span>
          </span>
        )}
        <Text
          slot="headline"
          as="h1"
          font="heading"
          size={headlineSize}
          color={ink}
          effect={styleEffect(style, "headline")}
          balance
        >
          {slot(slots, "headline", "text").value}
        </Text>
        {sorot}
        {cta && (
          // CTA berupa baris teks bergaris aksen tepat di bawah headline, bukan tombol pill dengan
          // ikon panah (catatan pemilik T-139: tombol terasa kaku dan AI-slop).
          <div
            style={{
              display: "grid",
              gap: space(2),
              justifyItems: side === "atas" ? "center" : flip ? "end" : "start",
              marginTop: space(4),
            }}
          >
            <Text slot="cta" font="body" size={2} color={ink} strong>
              {cta.value}
            </Text>
            <Rule
              color={swirl === "neutral-light" ? "neutral-light" : "accent"}
              length={96}
              weight={6}
            />
          </div>
        )}
      </div>

      {!logoBottom && (
        <div style={{ position: "absolute", top: MARGIN, [near]: MARGIN }}>{logo}</div>
      )}
      {logoBottom && (
        <div style={{ position: "absolute", bottom: MARGIN, [near]: MARGIN }}>{logo}</div>
      )}
    </div>
  );
}

export const subjekLingkar: Template = {
  meta: {
    id: "feed-subjek-lingkar",
    name: "Subjek dan lingkar",
    format: "feed-4x5",
    description:
      "Subjek cut-out di depan satu bentuk besar pembawa metafora (cakram matahari, cincin, lensa kaca pembesar, biji kopi, blob) dengan kepala keluar dari tepi atasnya, garis swirl tebal, headline dua nada, chip info, CTA. Untuk ajakan, promo, atau brand awareness dengan satu ide visual.",
    slots: [
      sceneSlot(
        "A large circle shape sits behind the subject, so keep the area around it simple, and keep the text side and the top band calm for the headline.",
        { primary: "dark", secondary: "light", neutral: "light" },
      ),
      {
        name: "image",
        type: "image",
        required: true,
        description:
          "Orang cut-out berlatar transparan (seluruh badan untuk susunan samping, setengah badan untuk susunan atas), busana warna brand",
        aspectRatio: "4:5",
        cutout: true,
        composition: {
          base: "Person in brand-colored clothing, full body for the side layout or from the waist up for the top layout, with the head clear above a large circle shape behind them.",
          option: "flip",
          byValue: {
            no: "Turn the body and gaze slightly toward the left, where the text sits.",
            yes: "Turn the body and gaze slightly toward the right, where the text sits.",
          },
        },
      },
      {
        name: "headline",
        type: "text",
        required: true,
        description: "Bagian pertama headline dari copy, warna teks utama",
        maxChars: 18,
      },
      {
        name: "sorotan",
        type: "text",
        required: false,
        description: "Lanjutan headline (frasa kunci) dari copy, warna kedua atau blok sorot",
        maxChars: 14,
      },
      {
        name: "info",
        type: "text",
        required: false,
        description: "Chip info pendek dari copy (tanggal, harga, fakta)",
        maxChars: 26,
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
        values: ["cakram", "cincin", "lensa", "biji", "blob"],
        default: "cakram",
        description:
          "Metafora bentuk: cakram (matahari, koin, piring), cincin (sorotan), lensa (periksa, kenali), biji (kopi, kakao, benih), blob (ramah, bebas; hanya radius brand > 0)",
      },
      {
        name: "susunan",
        values: ["samping", "atas"],
        default: "samping",
        description:
          "samping: teks di sisi, subjek seluruh badan; atas: teks di atas, subjek setengah badan. Subjek lebar (orang bersama hewan, kelompok) selalu memakai susunan atas",
      },
      {
        name: "tone",
        values: ["primary", "secondary", "neutral"],
        default: "primary",
        description: "Warna bidang; bentuk memakai warna pasangannya",
      },
      {
        name: "sorot",
        values: ["accent", "secondary", "block"],
        default: "accent",
        description:
          "Warna sorotan: accent atau secondary di bidang gelap (patuhi larangan pasangan warna brand), block (blok aksen) di bidang terang",
      },
      {
        name: "garis",
        values: ["accent", "light", "none"],
        default: "accent",
        description: "Garis swirl tebal; none untuk brand yang membatasi elemen visual",
      },
      {
        name: "pola",
        values: ["riak", "none"],
        default: "riak",
        description: "Riak tone-on-tone di sekitar bentuk",
      },
      {
        name: "ikon",
        values: ["none", "calendar", "clock", "pin", "check", "star"],
        default: "none",
        description: "Ikon datar di chip info (tanggal, jam, lokasi, gratis, rating)",
      },
      {
        name: "bingkai",
        values: ["none", "garis"],
        default: "none",
        description: "Garis bingkai dalam tipis di belakang subjek",
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
  Slide: SubjekLingkarSlide,
};
