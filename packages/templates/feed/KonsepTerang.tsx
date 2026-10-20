import { SUBJECT_BANDS } from "@laras/shared";
import { Display, Icon, type IconName, Logo, Photo, Text } from "../primitives/index.ts";
import { type ColorToken, color, space } from "../primitives/vars.ts";
import { optionalSlot, type SlideProps, slot, type Template } from "../src/template.ts";
import { styleTreatment } from "../styles/layer.tsx";

// Arketipe Konsep terang (T-139, referensi pemilik "Don't Get TRAPPED"; masuk katalog Claude
// setelah disetujui pemilik 2026-10-20): iklan cetak
// yang lapang. Satu foto konsep besar (cut-out) diagonal dari sudut bawah dengan bayangan lantai
// lembut, satu benda pendamping kecil sebagai penyeimbang, dan blok teks tiga tingkat di kolom
// seberang: pembuka sedang, satu kata kunci raksasa berwarna brand, penutup sedang, lalu body kecil
// dan sapuan kuas. Cincin tipis besar terpotong di sudut sebagai dekor, ajakan berikon di akhir
// kolom teks, logo di sudut sisi teks. Lapisan: bidang → cincin → subjek dan pendamping → teks → logo.

const EDGE = "var(--space-safe)";
// Kolom teks di sisi seberang: lebar 56% dari tepi aman (safe margin terbesar fixture 80 px).
const TEXT_WIDTH = 0.56;
const TEXT_INNER_EDGE = 1080 - 80 - TEXT_WIDTH * 1080;
const TEXT_ANCHOR = "--konsep-teks";
// Kotak subjek 4:5: tepi sisi menembus kanvas 54 px, dasar alpha menembus tepi bawah 12 px, dan
// bagian bawah subjek setinggi `sink` dari tinggi alpha terpotong tepi bawah (keputusan pemilik
// T-139: kaki boleh terpotong sedikit agar subjek lebih besar).
const SUBJECT = { offset: -54, bleed: 12, ratio: 0.8, sink: 0.14 };
// Jarak subjek ke kolom teks (horizontal) dan ke dasar blok teks (vertikal).
const GAP = { side: 24, below: 40 };
// Zona tetap yang tidak boleh dimasuki subjek: logo di sudut bawah (tinggi logo space-5, lebar
// dicadangkan 200 px) dan benda pendamping (26% × 20% kanvas, mulai 60% tinggi).
const LOGO_ZONE = { inner: 1080 - 80 - 200 - 24, top: 1350 - 80 - 50 - 24 };
const PENDAMPING_ZONE = { inner: 1080 - 80 - 0.28 * 1080 - 24, top: 0.6 * 1350 - 24 };

type Band = [number, number] | null;
type AlphaBox = { top: number; left: number; right: number; bottom: number };
type Placed = { box: AlphaBox; bands?: Band[] | undefined };
const FALLBACK_BOX: AlphaBox = { top: 0.05, left: 0.1, right: 0.9, bottom: 0.95 };

// Letak subjek dari kotak dan profil lebar alpha per pita (T-139). Dasar alpha selalu menembus
// tepi bawah kanvas (potongan datar cut-out tidak boleh melayang) sampai bagian `sink` terpotong;
// `ground` adalah pecahan tinggi kotak yang duduk di tepi bawah. Subjek dibuat sebesar mungkin,
// dan teks tidak pernah menimpanya: pita yang menjangkau kolom teks harus berada di bawah dasar
// blok teks. Tinggi blok teks baru diketahui di browser, jadi batas tinggi subjek ditulis sebagai
// min() atas pita dengan anchor CSS: pita i aman bila jangkauannya belum sampai kolom teks pada
// tinggi itu, atau bila puncaknya (1350 + bleed - (ground - i/16) × H) di bawah dasar teks.
function placement(
  { box, bands }: Placed,
  near: "left" | "right",
  zones: { logo: boolean; pendamping: boolean },
) {
  const { top, left, right, bottom } = box;
  const { offset, bleed, ratio, sink } = SUBJECT;
  const ground = bottom - sink * (bottom - top);
  const profile: Band[] =
    bands ??
    Array.from({ length: SUBJECT_BANDS }, (_, i) => {
      const middle = (i + 0.5) / SUBJECT_BANDS;
      return middle >= top && middle <= bottom ? [left, right] : null;
    });
  // Jangkauan pita dari tepi sisi subjek ke arah kolom teks, dalam px pada tinggi kotak h.
  const reach = (band: [number, number], h: number) =>
    offset + (near === "left" ? band[1] : 1 - band[0]) * ratio * h;
  // Puncak pita i di kanvas pada tinggi kotak h; pita yang puncaknya di bawah kanvas tidak tampak.
  const crest = (i: number, h: number) => 1350 + bleed - (ground - i / SUBJECT_BANDS) * h;
  // Batas statis: alpha setinggi 86% kanvas dan selebar 92% kanvas, lalu dikecilkan sampai pita
  // yang sejajar zona logo atau pendamping tidak masuk zona itu.
  const fixed = [
    ...(zones.logo ? [LOGO_ZONE] : []),
    ...(zones.pendamping ? [PENDAMPING_ZONE] : []),
  ];
  const clear = (h: number) =>
    profile.every((band, i) => {
      if (!band || crest(i, h) >= 1350) return true;
      const base = crest(i + 1, h);
      return fixed.every((zone) => base < zone.top || reach(band, h) <= zone.inner);
    });
  let cap = Math.min((0.86 * 1350) / (ground - top), (0.92 * 1080) / ((right - left) * ratio));
  while (cap > 400 && !clear(cap)) cap -= 8;
  const limit = TEXT_INNER_EDGE - GAP.side;
  const terms = profile.flatMap((band, i) => {
    const rise = ground - i / SUBJECT_BANDS;
    if (!band || rise <= 0) return [];
    const free = (limit - offset) / (reach(band, 1) - offset || 1e-6);
    if (free >= cap) return [];
    return [
      `max(${Math.round(free)}px, calc((${1350 + bleed - GAP.below}px - anchor(${TEXT_ANCHOR} bottom)) / ${rise.toFixed(4)}))`,
    ];
  });
  const height =
    terms.length > 0 ? `min(${Math.round(cap)}px, ${terms.join(", ")})` : `${Math.round(cap)}px`;
  const far = near === "left" ? "right" : "left";
  return {
    [near]: `${offset}px`,
    [far]: `calc(${1080 - offset}px - ${ratio} * ${height})`,
    top: `calc(${1350 + bleed}px - ${ground.toFixed(4)} * ${height})`,
    bottom: `calc(${-bleed}px - ${(1 - ground).toFixed(4)} * ${height})`,
  };
}
const ICONS: IconName[] = ["pin", "globe", "clock", "calendar", "check", "arrow-right"];
// Bayangan lantai lembut dari token, seperti foto produk di atas lantai terang.
const SHADOW =
  "drop-shadow(18px 26px 26px color-mix(in srgb, var(--color-neutral-dark) 30%, transparent))";

function Arc({
  size,
  tone,
  style,
}: {
  size: number;
  tone: ColorToken;
  style: React.CSSProperties;
}) {
  return (
    <div
      data-qa-element="decor"
      aria-hidden="true"
      style={{
        position: "absolute",
        width: `${size}px`,
        height: `${size}px`,
        borderRadius: "50%",
        border: `${Math.round(size * 0.09)}px solid ${color(tone)}`,
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
  const ring: ColorToken = field === "secondary" ? "neutral-light" : "secondary";
  const image = slot(slots, "image", "image");
  const pendamping = optionalSlot(slots, "pendamping", "image");
  const pembuka = optionalSlot(slots, "pembuka", "text");
  const penutup = optionalSlot(slots, "penutup", "text");
  const body = optionalSlot(slots, "body", "text");
  const cta = optionalSlot(slots, "cta", "text");
  const icon = ICONS.find((name) => name === options.ikon) ?? "pin";
  const logoTop = options.logo !== "bottom";
  const treatment = styleTreatment(style);
  const logo = <Logo slot="logo" src={slot(slots, "logo", "logo").src} height={5} />;
  const place = placement(
    { box: image.subject?.box ?? FALLBACK_BOX, bands: image.subject?.bands },
    near,
    { logo: !logoTop, pendamping: pendamping !== undefined },
  );
  const ajakan = cta && (
    <div
      data-qa-element="group"
      data-qa-name="ajakan"
      style={{ display: "flex", alignItems: "center", gap: space(2) }}
    >
      <Icon name={icon} size={36} color={keyword} />
      <Text slot="cta" font="body" size={2} color="neutral-dark" strong>
        {cta.value}
      </Text>
    </div>
  );
  return (
    <div
      style={{
        position: "relative",
        height: "100%",
        overflow: "hidden",
        background: color(field),
      }}
    >
      {/* Cincin satu tingkat lebih terang atau gelap dari bidang agar terlihat samar. */}
      <Arc size={700} tone={ring} style={{ [near]: "-400px", top: "-380px" }} />
      <Arc size={460} tone={ring} style={{ [far]: "-230px", bottom: "-170px" }} />
      <div
        data-qa-element="group"
        data-qa-name="teks"
        style={{
          position: "absolute",
          top: logoTop ? "15%" : "12%",
          [far]: EDGE,
          width: `${TEXT_WIDTH * 100}%`,
          anchorName: TEXT_ANCHOR,
          zIndex: 1,
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr)",
          justifyItems: "start",
          textAlign: "left",
        }}
      >
        {pembuka && (
          <Text slot="pembuka" font="body" size={3} color="neutral-dark" strong balance>
            {pembuka.value}
          </Text>
        )}
        <Display slot="kata" font="heading" scale={2.8} color={keyword}>
          {slot(slots, "kata", "text").value}
        </Display>
        {penutup && (
          <Text slot="penutup" font="body" size={3} color="neutral-dark" strong balance>
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
        {ajakan && <div style={{ marginTop: space(5) }}>{ajakan}</div>}
      </div>
      {pendamping && (
        <div
          style={{
            position: "absolute",
            [far]: `calc(${EDGE} + 2%)`,
            top: `max(60%, calc(anchor(${TEXT_ANCHOR} bottom) + ${GAP.below}px))`,
            width: "26%",
            height: "20%",
            filter: SHADOW,
          }}
        >
          <Photo slot="pendamping" src={pendamping.src} fit="contain" treatment={treatment} />
        </div>
      )}
      {/* Pendamping dan subjek setelah blok teks di DOM: anchor CSS hanya berlaku untuk anchor yang
          mendahului. */}
      <div style={{ position: "absolute", ...place, filter: SHADOW }}>
        <Photo
          slot="image"
          src={image.src}
          fit="contain"
          treatment={treatment}
          focus={image.subject?.focus}
        />
      </div>
      <div style={{ position: "absolute", [far]: EDGE, [logoTop ? "top" : "bottom"]: EDGE }}>
        {logo}
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
        maxChars: 20,
      },
      { name: "kata", type: "text", required: true, description: "Satu kata kunci", maxChars: 10 },
      {
        name: "penutup",
        type: "text",
        required: false,
        description: "Baris penutup setelah kata kunci",
        maxChars: 24,
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
