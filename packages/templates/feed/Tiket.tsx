import { Button, Icon, type IconName, Logo, Photo } from "../primitives/index.ts";
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
import { FitLine, placeSubject, Ripple, subjectStyle } from "../styles/flat-design/parts.tsx";
import { styleTreatment } from "../styles/layer.tsx";

// Arketipe Tiket (T-134, PANDUAN Flat Design pola 3; referensi Avante: panel bertakik yang
// ditembus subjek): satu tiket atau voucher datar raksasa (panel dengan dua takik setengah
// lingkaran dan garis sobek) yang ditembus subjek cut-out di tepi sisi jauhnya. Isi tiket:
// chip label, headline dua nada, dua baris detail berikon (K8); potongan tiket berisi harga atau
// nilai besar dan CTA. Lapisan: bidang → riak → tiket → subjek → isi tiket → logo. Enam elemen.

const MARGIN = "var(--space-safe)";
// Tiket: lebar dan letak dalam px kanvas; potongan (stub) di bawah garis sobek.
const TICKET = { top: 210, width: 620, stub: 320, notch: 34 };
// Isi tiket berhenti sebelum zona tumpang subjek (tepi jauh tiket − 120 px).
const CONTENT = 436;
const ICONS: IconName[] = ["calendar", "clock", "pin", "check", "truck", "chat", "heart"];

function TiketSlide({ slots, options, style }: SlideProps) {
  const flip = options.flip === "yes";
  const near = flip ? "right" : "left";
  const far = flip ? "left" : "right";
  const logoBottom = options.logo === "bottom";
  const mirror = (x: number) => (flip ? CANVAS.width - x : x);
  const field: ColorToken = options.tone === "secondary" ? "secondary" : "primary";
  const ticket: ColorToken =
    options.tiket === "secondary" && field !== "secondary" ? "secondary" : "neutral-light";
  const image = slot(slots, "image", "image");
  const kepala = optionalSlot(slots, "kepala", "text");
  const sorotan = optionalSlot(slots, "sorotan", "text");
  const details = (["detail1", "detail2"] as const).flatMap((name, index) => {
    const value = optionalSlot(slots, name, "text");
    const icon = ICONS.find((i) => i === options[index === 0 ? "ikon1" : "ikon2"]) ?? "check";
    return value ? [{ name, value: value.value, icon }] : [];
  });
  const cta = optionalSlot(slots, "cta", "text");

  // Subjek di sisi jauh, menembus tepi tiket; wajah atau produk di sepertiga atas.
  const cut = (image.subject?.box.bottom ?? 0) >= 0.97;
  const edge = 64 + TICKET.width;
  const frame = placeSubject(
    image.subject,
    {
      focus: { x: mirror(790), y: 450 },
      // Subjek terpotong menembus bawah; subjek utuh berpijak di garis sobek tiket.
      bottom: cut
        ? CANVAS.height + 150
        : options.pijak === "dasar"
          ? CANVAS.height - 64
          : CANVAS.height - 64 - TICKET.stub + 24,
      maxWidth: 540,
      minLeft: flip ? -300 : edge - 130,
      maxRight: flip ? CANVAS.width - edge + 130 : CANVAS.width + 300,
    },
    { width: 720 },
  );
  const notch = (side: "left" | "right") => (
    <span
      style={{
        position: "absolute",
        bottom: `${TICKET.stub - TICKET.notch}px`,
        [side]: `${-TICKET.notch}px`,
        width: `${TICKET.notch * 2}px`,
        height: `${TICKET.notch * 2}px`,
        borderRadius: "50%",
        background: color(field),
      }}
    />
  );
  const sorotBlock = options.sorot === "block";

  return (
    <div
      style={{ position: "relative", height: "100%", overflow: "hidden", background: color(field) }}
    >
      {options.pola !== "none" && (
        <Ripple center={frame.focus} field={field} ink={ticket} from={250} count={8} />
      )}
      <div
        data-qa-element="shape"
        data-qa-name="tiket"
        aria-hidden="true"
        style={{
          position: "absolute",
          top: `${TICKET.top}px`,
          bottom: MARGIN,
          [near]: MARGIN,
          width: `${TICKET.width}px`,
          borderRadius: "var(--shape-radius)",
          background: color(ticket),
        }}
      >
        {notch("left")}
        {notch("right")}
        <span
          style={{
            position: "absolute",
            bottom: `${TICKET.stub}px`,
            left: `${TICKET.notch + 16}px`,
            right: `${TICKET.notch + 16}px`,
            borderTop: `6px dashed ${color(field)}`,
          }}
        />
      </div>
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
        style={{
          position: "absolute",
          ...(logoBottom ? { bottom: MARGIN, [far]: MARGIN } : { top: MARGIN, [near]: MARGIN }),
        }}
      >
        <Logo slot="logo" src={slot(slots, "logo", "logo").src} height={6} />
      </div>
      <div
        data-qa-element="group"
        data-qa-name="judul tiket"
        style={{
          position: "absolute",
          top: `${TICKET.top + 56}px`,
          [near]: `calc(${MARGIN} + ${space(6)})`,
          width: `${CONTENT}px`,
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr)",
          justifyItems: flip ? "end" : "start",
          textAlign: near,
          gap: space(1),
        }}
      >
        {kepala && (
          <span
            data-slot="kepala"
            data-slot-type="text"
            style={{
              marginBottom: space(3),
              fontFamily: fontFamily("body"),
              fontWeight: fontWeight("body", true),
              fontSize: fontSize(1),
              fontSynthesis: "none",
              lineHeight: 1.2,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: color("neutral-dark"),
            }}
          >
            {kepala.value}
          </span>
        )}
        <FitLine slot="headline" step={5} color="neutral-dark" align={near}>
          {slot(slots, "headline", "text").value}
        </FitLine>
        {sorotan && (
          <FitLine
            slot="sorotan"
            step={5}
            color={sorotBlock ? "neutral-dark" : "primary"}
            block={sorotBlock ? "accent" : undefined}
            align={near}
          >
            {sorotan.value}
          </FitLine>
        )}
      </div>
      {details.length > 0 && (
        <div
          data-qa-element="group"
          data-qa-name="detail"
          style={{
            position: "absolute",
            bottom: `calc(${MARGIN} + ${TICKET.stub + 48}px)`,
            [near]: `calc(${MARGIN} + ${space(6)})`,
            width: `${CONTENT}px`,
            display: "grid",
            gap: space(3),
          }}
        >
          {details.map((detail) => (
            <div
              key={detail.name}
              style={{
                display: "flex",
                flexDirection: flip ? "row-reverse" : "row",
                alignItems: "center",
                gap: space(3),
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  display: "flex",
                  flex: "none",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: color(field),
                  color: color(ticket),
                }}
              >
                <Icon name={detail.icon} size={30} stroke={3} />
              </span>
              <span
                data-slot={detail.name}
                data-slot-type="text"
                style={{
                  fontFamily: fontFamily("body"),
                  fontWeight: fontWeight("body", false),
                  fontSize: fontSize(2),
                  fontSynthesis: "none",
                  lineHeight: 1.25,
                  textAlign: near,
                  color: color("neutral-dark"),
                }}
              >
                {detail.value}
              </span>
            </div>
          ))}
        </div>
      )}
      <div
        data-qa-element="group"
        data-qa-name="potongan"
        style={{
          position: "absolute",
          bottom: `calc(${MARGIN} + ${space(5)})`,
          [near]: `calc(${MARGIN} + ${space(6)})`,
          height: `${TICKET.stub - 88}px`,
          width: `${CONTENT}px`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          alignItems: flip ? "flex-end" : "flex-start",
        }}
      >
        <FitLine slot="nilai" step={5} color="primary" align={near}>
          {slot(slots, "nilai", "text").value}
        </FitLine>
        {cta && (
          <Button slot="cta" shape="pill">
            {cta.value}
          </Button>
        )}
      </div>
    </div>
  );
}

export const tiket: Template = {
  meta: {
    id: "feed-tiket",
    name: "Tiket",
    format: "feed-4x5",
    description:
      "Tiket atau voucher datar raksasa (dua takik dan garis sobek) yang ditembus subjek cut-out di tepinya; label, headline dua nada, dua detail berikon, nilai besar (harga, Gratis, jarak) di potongan tiket, CTA. Untuk pendaftaran acara, voucher, promo harga, reservasi.",
    slots: [
      {
        name: "image",
        type: "image",
        required: true,
        description:
          "Orang cut-out (bergerak, menunjuk, memegang produk) atau produk cut-out berlatar transparan",
        aspectRatio: "4:5",
        cutout: true,
      },
      {
        name: "kepala",
        type: "text",
        required: false,
        description: "Label kapital pendek di kepala tiket dari copy (Voucher, Race entry)",
        maxChars: 18,
      },
      {
        name: "headline",
        type: "text",
        required: true,
        description: "Nama acara, produk, atau layanan dari copy",
        maxChars: 16,
      },
      {
        name: "sorotan",
        type: "text",
        required: false,
        description: "Lanjutan headline (frasa kunci) dari copy, warna kedua atau blok sorot",
        maxChars: 14,
      },
      {
        name: "detail1",
        type: "text",
        required: false,
        description: "Detail pertama dari knowledge (tanggal, durasi, lokasi)",
        maxChars: 26,
      },
      {
        name: "detail2",
        type: "text",
        required: false,
        description: "Detail kedua dari knowledge",
        maxChars: 26,
      },
      {
        name: "nilai",
        type: "text",
        required: true,
        description: "Nilai besar di potongan tiket dari copy: harga, Gratis, jarak",
        maxChars: 12,
      },
      { name: "cta", type: "text", required: false, description: "Ajakan dari copy", maxChars: 18 },
      { name: "logo", type: "logo", required: true, description: "Logo di atas bidang tone" },
    ],
    options: [
      {
        name: "tone",
        values: ["primary", "secondary"],
        default: "primary",
        description: "Warna bidang di luar tiket",
      },
      {
        name: "tiket",
        values: ["neutral", "secondary"],
        default: "neutral",
        description: "Warna tiket: neutral (terang) atau secondary bila bidang primary",
      },
      {
        name: "sorot",
        values: ["primary", "block"],
        default: "primary",
        description:
          "Sorotan warna primary, atau blok aksen bila primary kurang kontras dengan teks gelap",
      },
      {
        name: "ikon1",
        values: ["calendar", "clock", "pin", "check", "truck", "chat", "heart"],
        default: "calendar",
        description: "Ikon datar detail pertama",
      },
      {
        name: "ikon2",
        values: ["pin", "calendar", "clock", "check", "truck", "chat", "heart"],
        default: "pin",
        description: "Ikon datar detail kedua",
      },
      {
        name: "pola",
        values: ["riak", "none"],
        default: "riak",
        description: "Riak tone-on-tone di belakang subjek",
      },
      {
        name: "pijak",
        values: ["garis", "dasar"],
        default: "garis",
        description:
          "Subjek utuh berpijak di garis sobek tiket, atau di dasar kanvas (subjek duduk atau tinggi); subjek terpotong selalu menembus bawah",
      },
      {
        name: "flip",
        values: ["no", "yes"],
        default: "no",
        description: "Tiket di kanan, subjek di kiri",
      },
      {
        name: "logo",
        values: ["top", "bottom"],
        default: "top",
        description:
          "Logo di atas sisi tiket, atau di sudut bawah sisi subjek (hanya bila subjek tidak menutup sudut itu, mis. produk)",
      },
    ],
  },
  Slide: TiketSlide,
};
