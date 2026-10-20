import type { IconName } from "../primitives/Icons.tsx";
import { Button, Logo, Photo, Text } from "../primitives/index.ts";
import { color, space } from "../primitives/vars.ts";
import { optionalSlot, type SlideProps, slot, type Template } from "../src/template.ts";
import {
  AccentText,
  ContactLine,
  type FeatureItem,
  FeatureRow,
  frameSubject,
  PathLine,
  px,
  tidy,
} from "../styles/corporate-clean/parts.tsx";
import { StyleBackdrop, StyleOverlay, styleTreatment } from "../styles/layer.tsx";

// Arketipe Deret fitur (T-134; PANDUAN Corporate Clean pola B, referensi 7626). Ide besarnya
// "dari A ke B": lintasan berlabel (rute asal, langkah kunjungan, jalan ke lari) melintas di
// belakang subjek dan keluar dari jendela panggung, sehingga manfaat dibaca sebagai perjalanan,
// bukan daftar. Komposisi terpusat: logo, headline dua baris (baris kedua warna brand atau blok
// sorot), subjudul, jendela panggung tempat subjek cut-out muncul dari bawah dan kepalanya
// menembus tepi atas jendela, lintasan dengan label awal dan akhir, deret tiga manfaat berikon,
// tombol, dan satu kontak. Enam elemen: kop teks, lintasan, subjek, deret fitur, aksi, logo.

// Geometri (px kanvas 1080 × 1350). Blok bawah (fitur, tombol, kontak) menempel ke safe margin
// bawah setinggi STACK; jendela berakhir 32 px di atasnya.
const STACK = 300;
const WINDOW_TOP = 660;
const WINDOW_BOTTOM = `calc(var(--space-safe) + ${STACK}px)`;
// Kepala subjek dan bagian tubuh yang terlihat di jendela (subjek terpotong tepi bawah jendela).
const HEAD = 520;
const VISIBLE = 0.64;
const HALF_WIDTH = 230;
// Lintasan dari kiri bawah jendela ke kanan atas, keluar dari tepi atas jendela.
const PATH: [number, number][] = [
  [128, 880],
  [420, 850],
  [690, 730],
  [928, 616],
];

const ICONS = [
  "check",
  "shield",
  "clock",
  "calendar",
  "truck",
  "user",
  "star",
  "heart",
  "leaf",
  "eye",
  "chart",
  "target",
  "card",
  "bag",
  "home",
  "chat",
  "pin",
];
const CONTACT_ICONS = ["chat", "phone", "pin", "mail", "globe", "clock", "calendar"];
const PATH_KINDS: Record<string, { dashed: boolean; end: "arrow" | "dot"; stops: boolean }> = {
  arrow: { dashed: false, end: "arrow", stops: false },
  route: { dashed: true, end: "dot", stops: false },
  steps: { dashed: false, end: "dot", stops: true },
};

function DeretFiturSlide({ slots, options, style }: SlideProps) {
  const field = options.tone === "secondary" ? "secondary" : "neutral-light";
  const stage = field === "secondary" ? "neutral-light" : "secondary";
  const logoBottom = options.logo === "bottom-right";
  const image = slot(slots, "image", "image");
  const eyebrow = optionalSlot(slots, "eyebrow", "text");
  const headline2 = optionalSlot(slots, "headline2", "text");
  const subjudul = optionalSlot(slots, "subjudul", "text");
  const awal = optionalSlot(slots, "awal", "text");
  const akhir = optionalSlot(slots, "akhir", "text");
  const cta = optionalSlot(slots, "cta", "text");
  const kontak = optionalSlot(slots, "kontak", "text");
  const features = (["fitur1", "fitur2", "fitur3"] as const).flatMap((name, i): FeatureItem[] => {
    const value = optionalSlot(slots, name, "text");
    const icon = (options[`ikon${i + 1}`] ?? "check") as IconName;
    return value ? [{ icon, label: value.value, slot: name }] : [];
  });
  const kind = PATH_KINDS[options.lintasan ?? "arrow"] ?? PATH_KINDS.arrow;
  const size = options.judul === "medium" ? 4 : 5;
  const logo = <Logo slot="logo" src={slot(slots, "logo", "logo").src} height={5} />;

  const frame = frameSubject({
    subject: image.subject,
    top: HEAD,
    // Jendela berakhir ±986 px (safe margin 64); bagian terlihat = VISIBLE dari tinggi subjek.
    floor: HEAD + (986 - HEAD) / VISIBLE,
    side: "center",
    edge: 540,
    limit: HALF_WIDTH,
  });
  const start = PATH[0] ?? [0, 0];
  const end = PATH[PATH.length - 1] ?? [0, 0];

  return (
    <div
      data-qa-composition="center"
      style={{ position: "relative", height: "100%", overflow: "hidden", background: color(field) }}
    >
      <StyleBackdrop style={style} />

      {/* Kop teks terpusat: logo atau eyebrow, headline dua baris, subjudul, garis aksen. */}
      <div
        data-qa-element="group"
        data-qa-name="kop teks"
        style={{
          position: "absolute",
          top: "var(--space-safe)",
          left: "var(--space-safe)",
          right: "var(--space-safe)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          gap: space(2),
        }}
      >
        {!logoBottom && <div style={{ marginBottom: space(3) }}>{logo}</div>}
        {eyebrow && (
          <div style={{ marginBottom: space(2) }}>
            <AccentText slot="eyebrow" color="primary">
              {eyebrow.value}
            </AccentText>
          </div>
        )}
        <Text slot="headline" as="h1" font="heading" size={size} color="neutral-dark">
          {tidy(slot(slots, "headline", "text").value)}
        </Text>
        {headline2 &&
          (options.judul2 === "sorot" ? (
            <Text
              slot="headline2"
              as="h2"
              font="heading"
              size={size}
              color="neutral-dark"
              highlight={{
                text: headline2.value,
                background: "accent",
                color: "neutral-dark",
                tilt: 0,
              }}
            >
              {headline2.value}
            </Text>
          ) : (
            <Text slot="headline2" as="h2" font="heading" size={size} color="primary">
              {tidy(headline2.value)}
            </Text>
          ))}
        {subjudul && (
          <div style={{ marginTop: space(2) }}>
            <Text slot="subjudul" font="body" size={2} color="neutral-dark" balance>
              {subjudul.value}
            </Text>
          </div>
        )}
        <span
          aria-hidden="true"
          style={{
            display: "block",
            width: 88,
            height: 6,
            marginTop: space(2),
            background: color("accent"),
          }}
        />
      </div>

      {/* Jendela panggung. */}
      <div
        style={{
          position: "absolute",
          top: WINDOW_TOP,
          bottom: WINDOW_BOTTOM,
          left: "var(--space-safe)",
          right: "var(--space-safe)",
          borderRadius: "var(--shape-radius)",
          background: color(stage),
          boxShadow: "var(--shape-shadow)",
        }}
      />
      <PathLine points={PATH} color="primary" hole={stage} {...kind} />

      {/* Subjek muncul dari bawah jendela: dipotong tepi bawah jendela, kepala menembus tepi atas. */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: WINDOW_BOTTOM,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
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
      </div>

      {/* Label lintasan: awal di bawah titik awal, akhir di atas ujung lintasan. */}
      {(awal || akhir) && (
        <div data-qa-element="group" data-qa-name="lintasan">
          {awal && (
            <div style={{ position: "absolute", top: start[1] + 36, left: start[0] - 22 }}>
              <AccentText slot="awal" color="primary">
                {awal.value}
              </AccentText>
            </div>
          )}
          {akhir && (
            <div
              style={{
                position: "absolute",
                bottom: 1350 - end[1] + 44,
                right: "var(--space-safe)",
              }}
            >
              <AccentText slot="akhir" color="primary">
                {akhir.value}
              </AccentText>
            </div>
          )}
        </div>
      )}

      {/* Blok bawah: deret fitur, tombol, satu kontak; logo di kanan bawah bila aturan brand. */}
      <div
        style={{
          position: "absolute",
          left: "var(--space-safe)",
          right: "var(--space-safe)",
          bottom: "var(--space-safe)",
          height: STACK,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: space(4),
        }}
      >
        {features.length > 0 && (
          <div
            data-qa-element="group"
            data-qa-name="deret fitur"
            style={{ width: "100%", marginBottom: space(1) }}
          >
            <FeatureRow
              items={features}
              color="neutral-dark"
              iconBackground="primary"
              iconColor="neutral-light"
              divider="neutral-dark"
            />
          </div>
        )}
        <div
          data-qa-element="group"
          data-qa-name="aksi"
          style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: space(2) }}
        >
          {cta && (
            <Button slot="cta" shape="pill">
              {cta.value}
            </Button>
          )}
          {kontak && (
            <ContactLine
              items={[
                {
                  icon: (options.ikonKontak ?? "chat") as IconName,
                  text: kontak.value,
                  slot: "kontak",
                },
              ]}
              color="neutral-dark"
              iconBackground="primary"
              iconColor="neutral-light"
              divider="neutral-dark"
              layout="inline"
            />
          )}
        </div>
      </div>
      {logoBottom && (
        <div
          style={{ position: "absolute", right: "var(--space-safe)", bottom: "var(--space-safe)" }}
        >
          {logo}
        </div>
      )}
      <StyleOverlay style={style} corner="top-left" surface="light" />
    </div>
  );
}

export const deretFitur: Template = {
  meta: {
    id: "feed-deret-fitur",
    name: "Deret fitur",
    format: "feed-4x5",
    description:
      "Dari A ke B: komposisi terpusat dengan headline dua baris (baris kedua warna brand atau blok sorot), subjek cut-out yang muncul dari jendela panggung dengan kepala menembus tepi atasnya, lintasan berlabel (panah naik, rute, atau langkah) yang melintas di belakang subjek, deret tiga manfaat berikon, tombol, dan satu kontak. Untuk pengenalan layanan, ajakan, atau brand awareness yang bisa dirangkum sebagai perjalanan dua titik nyata dari knowledge.",
    slots: [
      {
        name: "image",
        type: "image",
        required: true,
        description:
          "Orang nyata setengah badan ke atas (cut-out), menghadap kamera atau sedikit ke samping, memegang alat kerja atau produk",
        aspectRatio: "4:5",
        cutout: true,
        composition: {
          base: "Real person from the waist up facing the camera or slightly turned, holding work tools or the product; head and shoulders fully visible, because the head breaks out of the top of a window frame.",
        },
      },
      {
        name: "eyebrow",
        type: "text",
        required: false,
        description: "Kategori 2–3 kata di atas headline, kapital dengan font aksen",
        maxChars: 20,
      },
      {
        name: "headline",
        type: "text",
        required: true,
        description: "Baris pertama headline, satu baris",
        maxChars: 18,
      },
      {
        name: "headline2",
        type: "text",
        required: false,
        description: "Baris kedua headline yang diberi warna brand atau blok sorot, satu baris",
        maxChars: 18,
      },
      {
        name: "subjudul",
        type: "text",
        required: false,
        description: "Satu kalimat pendukung, satu baris",
        maxChars: 44,
      },
      {
        name: "awal",
        type: "text",
        required: false,
        description: "Label titik awal lintasan (asal, langkah pertama), 1–2 kata",
        maxChars: 14,
      },
      {
        name: "akhir",
        type: "text",
        required: false,
        description: "Label titik akhir lintasan (tujuan, hasil yang jujur), 1–2 kata",
        maxChars: 14,
      },
      { name: "fitur1", type: "text", required: false, description: "Manfaat 1", maxChars: 22 },
      { name: "fitur2", type: "text", required: false, description: "Manfaat 2", maxChars: 22 },
      { name: "fitur3", type: "text", required: false, description: "Manfaat 3", maxChars: 22 },
      { name: "cta", type: "text", required: false, description: "Ajakan 2–3 kata", maxChars: 18 },
      {
        name: "kontak",
        type: "text",
        required: false,
        description: "Satu kontak atau lokasi dari knowledge",
        maxChars: 26,
      },
      {
        name: "logo",
        type: "logo",
        required: true,
        description: "Logo di atas latar terang",
      },
    ],
    options: [
      {
        name: "tone",
        values: ["neutral", "secondary"],
        default: "neutral",
        description: "Warna bidang; jendela panggung memakai warna terang lainnya",
      },
      {
        name: "lintasan",
        values: ["arrow", "route", "steps"],
        default: "arrow",
        description:
          "Bentuk lintasan: arrow (naik, maju), route (rute putus-putus dari asal ke tujuan), steps (langkah dengan titik antara)",
      },
      {
        name: "judul",
        values: ["large", "medium"],
        default: "large",
        description: "Ukuran headline: large (langkah 5) atau medium (langkah 4)",
      },
      {
        name: "judul2",
        values: ["primary", "sorot"],
        default: "primary",
        description:
          "Baris kedua berwarna primary, atau blok sorot aksen bila primary terlalu dekat dengan warna teks",
      },
      {
        name: "logo",
        values: ["top", "bottom-right"],
        default: "top",
        description: "Logo di atas headline, atau di kanan bawah (aturan brand)",
      },
      { name: "ikon1", values: ICONS, default: "check", description: "Ikon manfaat 1" },
      { name: "ikon2", values: ICONS, default: "shield", description: "Ikon manfaat 2" },
      { name: "ikon3", values: ICONS, default: "clock", description: "Ikon manfaat 3" },
      {
        name: "ikonKontak",
        values: CONTACT_ICONS,
        default: "chat",
        description: "Ikon kontak",
      },
    ],
  },
  Slide: DeretFiturSlide,
};
