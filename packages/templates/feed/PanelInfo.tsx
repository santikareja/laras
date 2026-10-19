import type { IconName } from "../primitives/Icons.tsx";
import { Button, Icon, IconRow, Logo, Panel, Photo, Text } from "../primitives/index.ts";
import { color, space } from "../primitives/vars.ts";
import { optionalSlot, type SlideProps, slot, type Template } from "../src/template.ts";
import { StyleBackdrop, StyleOverlay, styleTreatment } from "../styles/layer.tsx";

// Arketipe Panel info (T-132; panduan Corporate Clean pola A, ADR-015): panel warna yang terpotong
// satu tepi kanvas berisi eyebrow, headline, dan subjudul; subjek cut-out di sisi seberang yang
// menembus tepi panel; checklist berikon di bawah panel; blok aksi (tombol dan satu kontak) di kaki.
// Lima elemen: logo, panel teks, subjek, checklist, blok aksi. Teks panel berhenti sebelum zona
// tumpang subjek agar tidak pernah tertutup.

const PANEL_WIDTH = "60%";
// Batas kanan teks panel (dari tepi panel): setengah kanvas, sebelum subjek menembus panel.
const TEXT_LIMIT = "calc(1080px * 0.5 - var(--space-safe))";
const CONTACT_ICONS: Record<string, IconName> = {
  phone: "phone",
  chat: "chat",
  pin: "pin",
  mail: "mail",
  globe: "globe",
};

function PanelInfoSlide({ slots, options, style }: SlideProps) {
  const flip = options.flip === "yes";
  const near = flip ? "right" : "left";
  const far = flip ? "left" : "right";
  const panel = options.panel === "dark" ? "neutral-dark" : "primary";
  const logoBottom = options.logo === "bottom";
  const image = slot(slots, "image", "image");
  const eyebrow = optionalSlot(slots, "eyebrow", "text");
  const subjudul = optionalSlot(slots, "subjudul", "text");
  const cta = optionalSlot(slots, "cta", "text");
  const kontak = optionalSlot(slots, "kontak", "text");
  const points = (["poin1", "poin2", "poin3"] as const).flatMap((name) => {
    const value = optionalSlot(slots, name, "text");
    return value ? [{ icon: "check" as const, label: value.value, slot: name }] : [];
  });
  const logo = <Logo slot="logo" src={slot(slots, "logo", "logo").src} height={5} />;
  return (
    <div
      style={{
        position: "relative",
        height: "100%",
        overflow: "hidden",
        background: color(options.tone === "secondary" ? "secondary" : "neutral-light"),
      }}
    >
      <StyleBackdrop style={style} subjectSide={far} />
      {!logoBottom && (
        <div
          style={{ position: "absolute", top: "var(--space-safe)", [near]: "var(--space-safe)" }}
        >
          {logo}
        </div>
      )}
      <div
        style={{
          position: "absolute",
          top: "14%",
          bottom: "var(--space-safe)",
          [near]: 0,
          width: PANEL_WIDTH,
          display: "flex",
          flexDirection: "column",
          alignItems: flip ? "flex-end" : "flex-start",
          gap: space(6),
        }}
      >
        <Panel background={panel} bleed={near} padding={6} justify="start" group="panel teks">
          <div
            style={{
              display: "grid",
              gap: space(3),
              maxWidth: TEXT_LIMIT,
              justifyItems: flip ? "end" : "start",
              textAlign: near,
              marginLeft: flip ? "auto" : undefined,
            }}
          >
            {eyebrow && (
              <Text slot="eyebrow" font="body" size={1} color="accent" strong>
                {eyebrow.value}
              </Text>
            )}
            <Text slot="headline" as="h1" font="heading" size={4} color="neutral-light">
              {slot(slots, "headline", "text").value}
            </Text>
            {subjudul && (
              <Text slot="subjudul" font="body" size={2} color="neutral-light" measure={34} balance>
                {subjudul.value}
              </Text>
            )}
          </div>
        </Panel>

        {points.length > 0 && (
          <div
            data-qa-element="group"
            data-qa-name="checklist"
            style={{ [`margin${flip ? "Right" : "Left"}`]: "var(--space-safe)" }}
          >
            <IconRow
              items={points}
              direction="column"
              color="neutral-dark"
              iconBackground={panel}
              iconColor="neutral-light"
              iconSize={32}
            />
          </div>
        )}
        <div
          style={{
            marginTop: "auto",
            [`margin${flip ? "Right" : "Left"}`]: "var(--space-safe)",
            // Lipatan terjadi di dalam kolom panel, bukan meluber ke luar kanvas (T-131).
            maxWidth: "calc(100% - var(--space-safe))",
            display: "flex",
            flexDirection: flip ? "row-reverse" : "row",
            alignItems: "center",
            gap: space(5),
          }}
        >
          {/* Logo pertama: di tepi luar sisi panel (kanan bawah bila panel di kanan), sejajar
              tengah tombol (tombol 96 px, logo 48 px) juga saat blok aksi terlipat dua baris. */}
          {logoBottom && (
            <div style={{ alignSelf: "flex-end", marginBottom: space(3) }}>{logo}</div>
          )}
          <div
            data-qa-element="group"
            data-qa-name="blok aksi"
            style={{
              display: "flex",
              flexDirection: flip ? "row-reverse" : "row",
              // Bila tidak muat, kontak naik ke atas tombol (baris kaki menempel ke bawah kanvas).
              flexWrap: "wrap-reverse",
              alignContent: "flex-start",
              flex: "1 1 auto",
              minWidth: 0,
              alignItems: "center",
              columnGap: space(5),
              rowGap: space(3),
            }}
          >
            {cta && <Button slot="cta">{cta.value}</Button>}
            {kontak && (
              <div style={{ display: "flex", alignItems: "center", gap: space(2) }}>
                <Icon
                  name={CONTACT_ICONS[options.kontak ?? "chat"] ?? "chat"}
                  size={40}
                  color="neutral-dark"
                />
                <Text slot="kontak" font="body" size={1} color="neutral-dark" strong>
                  {kontak.value}
                </Text>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Kotak 4:5 menempel ke tepi bawah agar tubuh atau lengan subjek tidak terputus. */}
      <div
        style={{
          position: "absolute",
          [far]: "-2%",
          bottom: 0,
          width: "52%",
          aspectRatio: "4 / 5",
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
      <StyleOverlay
        style={style}
        label={optionalSlot(slots, "label", "text")?.value}
        corner={flip ? "top-left" : "top-right"}
        surface="light"
      />
    </div>
  );
}

export const panelInfo: Template = {
  meta: {
    id: "feed-panel-info",
    name: "Panel info",
    format: "feed-4x5",
    description:
      "Panel warna di satu sisi berisi headline dan subjudul, subjek cut-out menembus tepi panel, checklist tiga poin, lalu tombol dan satu kontak. Untuk promo jasa, layanan, atau paket yang butuh beberapa fakta.",
    slots: [
      {
        name: "image",
        type: "image",
        required: true,
        description: "Subjek cut-out (orang yang bekerja atau memegang produk)",
        aspectRatio: "4:5",
        cutout: true,
      },
      {
        name: "eyebrow",
        type: "text",
        required: false,
        description: "Kategori atau konteks pendek di atas headline",
        maxChars: 24,
      },
      {
        name: "headline",
        type: "text",
        required: true,
        description: "Headline dari copy, 3–4 baris",
        maxChars: 36,
      },
      {
        name: "subjudul",
        type: "text",
        required: false,
        description: "Satu kalimat pendukung",
        maxChars: 56,
      },
      { name: "poin1", type: "text", required: false, description: "Poin fakta 1", maxChars: 26 },
      { name: "poin2", type: "text", required: false, description: "Poin fakta 2", maxChars: 26 },
      { name: "poin3", type: "text", required: false, description: "Poin fakta 3", maxChars: 26 },
      { name: "cta", type: "text", required: false, description: "Ajakan 2–3 kata", maxChars: 16 },
      {
        name: "kontak",
        type: "text",
        required: false,
        description: "Satu kontak atau lokasi dari knowledge",
        maxChars: 24,
      },
      {
        name: "label",
        type: "text",
        required: false,
        description:
          "Label kecil dari copy (tanggal, lokasi, edisi) untuk gaya yang memakainya; tanpa gaya tidak tampil",
        maxChars: 24,
      },
      { name: "logo", type: "logo", required: true, description: "Logo di atas latar terang" },
    ],
    options: [
      {
        name: "tone",
        values: ["neutral", "secondary"],
        default: "neutral",
        description: "Warna dominan latar",
      },
      {
        name: "panel",
        values: ["primary", "dark"],
        default: "primary",
        description: "Warna panel: primary, atau netral gelap bila primary terlalu terang",
      },
      {
        name: "flip",
        values: ["no", "yes"],
        default: "no",
        description: "Panel di kanan dan subjek di kiri",
      },
      {
        name: "logo",
        values: ["top", "bottom"],
        default: "top",
        description: "Logo di sisi panel: atas, atau bawah bersama tombol (aturan brand)",
      },
      {
        name: "kontak",
        values: ["chat", "phone", "pin", "mail", "globe"],
        default: "chat",
        description: "Ikon untuk slot kontak",
      },
    ],
  },
  Slide: PanelInfoSlide,
};
