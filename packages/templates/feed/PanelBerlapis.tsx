import type { IconName } from "../primitives/Icons.tsx";
import { DotGrid, Logo, Photo, Text } from "../primitives/index.ts";
import { color, space } from "../primitives/vars.ts";
import { CANVAS } from "../src/geometry.ts";
import { optionalSlot, type SlideProps, slot, type Template } from "../src/template.ts";
import {
  AccentText,
  Assurance,
  Chip,
  type ContactItem,
  ContactLine,
  FOOTER_HEIGHT,
  FooterBar,
  frameSubject,
  lastClause,
  mirror,
  px,
  tidy,
} from "../styles/corporate-clean/parts.tsx";
import { StyleBackdrop, StyleOverlay, styleTreatment } from "../styles/layer.tsx";

// Arketipe Panel berlapis (T-134; PANDUAN Corporate Clean pola A, referensi 528a). Ide besarnya
// "orang di balik layanan": orang nyata yang memegang alat kerjanya keluar dari tumpukan kartu
// brand. Lapisan dari belakang: bidang tenang; kartu terang berisi logo dan eyebrow yang mengintip
// di atas panel; panel brand (bleed) berisi headline dengan satu frasa sorot, garis aksen, dan
// subjudul; subjek cut-out yang tepi dalamnya menembus panel; pil yang menjepit subjek dan panel;
// label vertikal tipis di sudut atas; baris jaminan; bar kontak yang menjadi lantai subjek.
// Tujuh elemen: kop (logo dan eyebrow), panel teks, subjek, pil, label vertikal, jaminan, bar kontak.

// Geometri untuk subjek di kiri (dicerminkan bila subjek di kanan), px kanvas 1080 × 1350.
const PANEL_EDGE = 440;
// Kolom teks panel dan isi kartu mulai di sini; subjek berhenti 16 px sebelumnya.
const TEXT_EDGE = 544;
const SUBJECT_EDGE = TEXT_EDGE - 16;
// Tepi luar subjek; label vertikal di sudut atas tidak tertutup kepala.
const OUTER = 72;
const HEAD = 176;
const FLOOR = CANVAS.height - FOOTER_HEIGHT - 16;
// Kartu belakang mengintip setinggi ini di atas panel.
const CARD_PEEK = 152;
const CARD_PAD = 40;
const CARD_MIN = 360;
const PANEL_MIN = 600;

const CONTACT_ICONS = ["chat", "phone", "pin", "mail", "globe", "clock", "calendar", "truck"];

function PanelBerlapisSlide({ slots, options, style }: SlideProps) {
  const flip = options.subjek === "right";
  // Sisi dekat = sisi subjek; sisi jauh = sisi panel (bleed).
  const near = flip ? "right" : "left";
  const far = flip ? "left" : "right";
  const pad = (side: "near" | "far") =>
    `padding${(side === "near") !== flip ? "Left" : "Right"}` as const;
  const field = options.tone === "neutral" ? "neutral-light" : "secondary";
  const card = field === "secondary" ? "neutral-light" : "secondary";
  const logoBottom = options.logo === "bottom";
  const highlight =
    options.sorot === "none" ? undefined : options.sorot === "secondary" ? "secondary" : "accent";
  const image = slot(slots, "image", "image");
  const eyebrow = optionalSlot(slots, "eyebrow", "text");
  const subjudul = optionalSlot(slots, "subjudul", "text");
  const chip = optionalSlot(slots, "chip", "text");
  const poin = optionalSlot(slots, "poin", "text");
  const vertikal = optionalSlot(slots, "vertikal", "text");
  const contacts = (["kontak1", "kontak2"] as const).flatMap((name, i): ContactItem[] => {
    const value = optionalSlot(slots, name, "text");
    const icon = options[`ikon${i + 1}`] ?? (i === 0 ? "chat" : "pin");
    return value ? [{ icon: icon as IconName, text: value.value, slot: name }] : [];
  });
  const logo = <Logo slot="logo" src={slot(slots, "logo", "logo").src} height={5} />;
  const headline = tidy(slot(slots, "headline", "text").value);
  const accent = highlight ? lastClause(headline) : undefined;

  // Kotak gambar dihitung di koordinat kanvas untuk sisi subjek; gambar tidak dicerminkan.
  const frame = frameSubject({
    subject: image.subject,
    top: HEAD,
    floor: FLOOR,
    side: near,
    edge: mirror(SUBJECT_EDGE, flip),
    limit: mirror(OUTER, flip),
  });

  return (
    <div
      style={{
        position: "relative",
        height: "100%",
        overflow: "hidden",
        background: color(field),
      }}
    >
      <StyleBackdrop style={style} subjectSide={near} />

      {/* Kartu belakang (tab): mengintip di atas panel, berisi logo dan eyebrow (kop brand). */}
      <div
        style={{
          position: "absolute",
          top: "var(--space-safe)",
          // Isi kartu mulai di tepi awal kolom teks panel (kiri), di sisi mana pun panelnya.
          left: flip ? `calc(var(--space-safe) - ${CARD_PAD}px)` : px(TEXT_EDGE - CARD_PAD),
          width: "fit-content",
          minWidth: CARD_MIN,
          height: CARD_PEEK + 96,
          boxSizing: "border-box",
          padding: `0 ${CARD_PAD}px`,
          borderRadius: "var(--shape-radius)",
          background: color(card),
          boxShadow: "var(--shape-shadow)",
        }}
      >
        <div
          data-qa-element="group"
          data-qa-name="kop"
          style={{
            height: CARD_PEEK,
            display: "flex",
            alignItems: "center",
            gap: space(4),
          }}
        >
          {!logoBottom && logo}
          {eyebrow && (
            <AccentText slot="eyebrow" color="primary">
              {eyebrow.value}
            </AccentText>
          )}
        </div>
      </div>

      {/* Panel brand (bleed ke tepi sisi jauh) dan baris jaminan di bawahnya. */}
      <div
        style={{
          position: "absolute",
          top: `calc(var(--space-safe) + ${CARD_PEEK}px)`,
          bottom: FOOTER_HEIGHT,
          [near]: px(PANEL_EDGE),
          [far]: 0,
          display: "flex",
          flexDirection: "column",
          gap: space(5),
        }}
      >
        <div
          data-qa-element="group"
          data-qa-name="panel teks"
          style={{
            position: "relative",
            boxSizing: "border-box",
            minHeight: PANEL_MIN,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "flex-start",
            gap: space(4),
            padding: `${space(5)} 0`,
            [pad("near")]: TEXT_EDGE - PANEL_EDGE,
            [pad("far")]: "var(--space-safe)",
            borderRadius: flip
              ? "0 var(--shape-radius) var(--shape-radius) 0"
              : "var(--shape-radius) 0 0 var(--shape-radius)",
            background: color("primary"),
          }}
        >
          <Text
            slot="headline"
            as="h1"
            font="heading"
            size={options.judul === "medium" ? 4 : 5}
            color="neutral-light"
            {...(accent && highlight ? { accentWords: { text: accent, color: highlight } } : {})}
          >
            {headline}
          </Text>
          <span
            aria-hidden="true"
            style={{
              display: "block",
              width: 88,
              height: 6,
              margin: `${space(1)} 0`,
              background: color("accent"),
            }}
          />
          {subjudul && (
            <Text slot="subjudul" font="body" size={2} color="neutral-light" measure={30}>
              {subjudul.value}
            </Text>
          )}
          {/* Pil di tepi bawah panel, di atas subjek: menjepit subjek, panel, dan bidang; ujung
              dalamnya segaris dengan kolom teks. */}
          {chip && (
            <div
              style={{
                position: "absolute",
                zIndex: 2,
                bottom: 0,
                [far]: `calc(100% - ${TEXT_EDGE - PANEL_EDGE}px)`,
                width: "max-content",
                maxWidth: `calc(${TEXT_EDGE}px - var(--space-safe))`,
                transform: "translateY(50%)",
              }}
            >
              <Chip slot="chip" background={card} color="neutral-dark" mark="accent">
                {chip.value}
              </Chip>
            </div>
          )}
        </div>
        {poin && (
          // Baris jaminan di tengah ruang antara panel dan bar kaki.
          <div
            style={{
              margin: "auto 0",
              [pad("near")]: TEXT_EDGE - PANEL_EDGE,
              [pad("far")]: "var(--space-safe)",
            }}
          >
            <Assurance slot="poin" ring="primary" color="neutral-dark">
              {poin.value}
            </Assurance>
          </div>
        )}
      </div>

      {/* Subjek: kotak alpha dari kepala sampai lantai, tepi dalam menembus panel. */}
      <div
        style={{
          position: "absolute",
          zIndex: 1,
          top: px(frame.top),
          left: px(frame.left),
          width: px(frame.width),
          height: px(frame.height),
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

      {/* Detail kecil: pola titik di sudut kosong sisi panel, di atas bar kaki. */}
      <div
        style={{
          position: "absolute",
          bottom: FOOTER_HEIGHT + 32,
          [far]: "var(--space-safe)",
        }}
      >
        <DotGrid tone="primary" tint={0.35} cols={6} rows={3} />
      </div>

      {vertikal && (
        <div
          style={{ position: "absolute", top: "var(--space-safe)", [near]: "var(--space-safe)" }}
        >
          <AccentText slot="vertikal" color="primary" vertical>
            {vertikal.value}
          </AccentText>
        </div>
      )}

      {(contacts.length > 0 || logoBottom) && (
        <FooterBar background="primary">
          <ContactLine
            items={contacts}
            color="neutral-light"
            iconBackground="neutral-light"
            iconColor="primary"
            divider="neutral-light"
          >
            {logoBottom ? logo : undefined}
          </ContactLine>
        </FooterBar>
      )}
      <div style={{ position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none" }}>
        <StyleOverlay style={style} corner={flip ? "top-left" : "top-right"} surface="light" />
      </div>
    </div>
  );
}

export const panelBerlapis: Template = {
  meta: {
    id: "feed-panel-berlapis",
    name: "Panel berlapis",
    format: "feed-4x5",
    description:
      "Orang di balik layanan: subjek cut-out (orang yang memegang alat kerja atau produk) keluar dari tumpukan kartu brand. Kartu terang berisi logo dan eyebrow mengintip di atas panel warna brand berisi headline dengan satu frasa sorot dan subjudul; pil menjepit subjek dan panel; label vertikal tipis di sudut; satu baris jaminan; bar kontak di kaki. Untuk promo jasa, pengenalan layanan, atau ajakan yang butuh wajah tepercaya. Pilih sisi subjek agar tatapan atau gerak subjek mengarah ke panel.",
    slots: [
      {
        name: "image",
        type: "image",
        required: true,
        description:
          "Orang nyata seluruh badan atau tiga perempat badan (cut-out), duduk atau melangkah, memegang alat kerja atau produk",
        aspectRatio: "4:5",
        cutout: true,
        composition: {
          base: "Real person in full or three-quarter body, sitting or stepping, holding work tools or the product, in a natural working posture turned slightly toward the panel; feet or seat visible, because a contact bar acts as the floor.",
        },
      },
      {
        name: "eyebrow",
        type: "text",
        required: false,
        description: "Kategori layanan 2–3 kata di kartu atas, kapital dengan font aksen",
        maxChars: 20,
      },
      {
        name: "headline",
        type: "text",
        required: true,
        description:
          "Headline 2–4 baris dari copy; klausa sesudah koma atau titik terakhir diberi warna sorot",
        maxChars: 36,
      },
      {
        name: "subjudul",
        type: "text",
        required: false,
        description: "Satu kalimat manfaat, maksimal dua baris",
        maxChars: 56,
      },
      {
        name: "chip",
        type: "text",
        required: false,
        description:
          "Pil yang menempel di tubuh subjek: peran, harga, atau fakta singkat dari knowledge",
        maxChars: 20,
      },
      {
        name: "poin",
        type: "text",
        required: false,
        description: "Satu baris jaminan dengan ikon centang di bawah panel",
        maxChars: 32,
      },
      {
        name: "vertikal",
        type: "text",
        required: false,
        description: "Label vertikal tipis di sudut atas sisi subjek: nama brand dan kota",
        maxChars: 24,
      },
      {
        name: "kontak1",
        type: "text",
        required: false,
        description: "Kontak atau info praktis pertama di bar kaki",
        maxChars: 22,
      },
      {
        name: "kontak2",
        type: "text",
        required: false,
        description: "Kontak atau info praktis kedua di bar kaki",
        maxChars: 22,
      },
      {
        name: "logo",
        type: "logo",
        required: true,
        description: "Logo; pakai onDark bila logo di bar kaki (opsi logo bottom)",
      },
    ],
    options: [
      {
        name: "tone",
        values: ["secondary", "neutral"],
        default: "secondary",
        description: "Warna bidang dominan; kartu belakang memakai warna terang lainnya",
      },
      {
        name: "subjek",
        values: ["left", "right"],
        default: "left",
        description: "Sisi subjek; pilih sisi agar tatapan atau gerak subjek mengarah ke panel",
      },
      {
        name: "logo",
        values: ["top", "bottom"],
        default: "top",
        description: "Logo di kartu atas, atau di ujung bar kaki (aturan logo kanan bawah)",
      },
      {
        name: "judul",
        values: ["large", "medium"],
        default: "large",
        description:
          "Ukuran headline: large (langkah 5) atau medium (langkah 4, untuk skala brand yang besar atau headline panjang)",
      },
      {
        name: "sorot",
        values: ["accent", "secondary", "none"],
        default: "accent",
        description:
          "Warna klausa terakhir headline (sesudah koma atau titik terakhir); secondary bila brand melarang aksen di atas primary",
      },
      {
        name: "ikon1",
        values: CONTACT_ICONS,
        default: "chat",
        description: "Ikon kontak pertama",
      },
      {
        name: "ikon2",
        values: CONTACT_ICONS,
        default: "pin",
        description: "Ikon kontak kedua",
      },
    ],
  },
  Slide: PanelBerlapisSlide,
};
