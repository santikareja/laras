import { Logo, Photo, Sticker, Text } from "../primitives/index.ts";
import { type ColorToken, color, space } from "../primitives/vars.ts";
import { optionalSlot, type SlideProps, slot, type Template } from "../src/template.ts";
import { StyleBackdrop, StyleOverlay, styleTreatment } from "../styles/layer.tsx";
import {
  AccentText,
  BigWord,
  type CastShadow,
  castShadow,
  LAYER,
  shadowTone,
  wordRows,
} from "../styles/retro-vintage/parts.tsx";

// Arketipe Kata dilompati (T-134, Vintage/Retro pola 6; PRD 4 K1–K3): kata kunci dipecah menjadi
// dua-tiga baris raksasa yang sama besar di atas bidang warna jenuh, dan subjek cut-out yang
// melompat menembusnya: baris atas di belakang tubuh, baris bawah di depan kaki, sehingga subjek
// tampak melompat keluar dari kata. Bayangan subjek jatuh di dinding dan huruf di belakangnya.
// Kalimat kecil font aksen di atas, angka kunci dan CTA kecil di bawah (K7, K8).

const EDGE = "var(--space-safe)";
// Tinggi tumpukan kata maksimal (px) untuk batas ukuran huruf; pita kata mengisi sisa tinggi di
// antara baris atas (kalimat, logo) dan baris bawah (info, logo).
const STACK = 0.6 * 1350;
const LINE = 0.82;
const SHIFT: Record<string, number> = { left: -14, center: 0, right: 14 };

const INK: Record<string, { field: ColorToken; ink: ColorToken; small: ColorToken }> = {
  primary: { field: "primary", ink: "neutral-light", small: "neutral-light" },
  secondary: { field: "secondary", ink: "neutral-dark", small: "neutral-dark" },
  accent: { field: "accent", ink: "neutral-dark", small: "neutral-dark" },
};

// Kotak subjek bila cut-out belum dianalisis (pecahan gambar).
const FALLBACK_BOX = { left: 0.1, top: 0.05, right: 0.9, bottom: 0.95 };
// Tinggi tubuh subjek terhadap tinggi tumpukan kata, per jumlah baris.
const BODY: Record<number, number> = { 1: 1.7, 2: 0.96, 3: 0.84 };
// Pinggang orang melompat (pecahan tinggi tubuh dari atas) dan jarak pinggang di atas baris depan
// (em kata): area ukur kontras baris depan dimulai 0,21 em (Fraunces) sampai 0,35 em (Anton) di atas kotak barisnya, jadi badan
// (baju) tidak boleh masuk ke sana, hanya kaki.
const WAIST = 0.55;
const CLEAR = 0.38;

// Letak dan tinggi pembungkus subjek dalam persen tinggi kotak kata. Tanpa baris depan, pinggang
// diletakkan di batas baris pertama dan kedua.
function subjectPlace(
  box: { top: number; bottom: number },
  count: number,
  frontIndex: number | undefined,
) {
  const stack = count * LINE;
  const body = (BODY[count] ?? 1) * 100;
  const height = body / (box.bottom - box.top);
  const boundary = ((frontIndex ?? Math.min(1, count - 1)) * LINE - CLEAR) / stack;
  const waist = box.top + WAIST * (box.bottom - box.top);
  return {
    top: Math.round((boundary * 100 - waist * height) * 10) / 10,
    height: Math.round(height * 10) / 10,
  };
}

// Satu baris di depan berarti subjek melompat di atas kata dengan kaki di belakang hurufnya.
function frontRows(option: string | undefined, count: number): number[] {
  return option === "tidak" ? [] : [count - 1];
}

function KataDilompatiSlide({ slots, options, style }: SlideProps) {
  const tone = INK[options.tone ?? "primary"] ?? INK.primary;
  if (!tone) throw new Error("Tone tidak dikenal");
  const ink: ColorToken = options.huruf === "primary" ? "primary" : tone.ink;
  const image = slot(slots, "image", "image");
  const angka = optionalSlot(slots, "angka", "text");
  const keterangan = optionalSlot(slots, "keterangan", "text");
  const cta = optionalSlot(slots, "cta", "text");
  const kata = slot(slots, "kata", "text").value;
  const rows = options.baris === "utuh" ? [kata] : wordRows(kata, 3, true);
  const cap = Math.round(STACK / (rows.length * LINE));
  const side = options.side ?? "center";
  const shift = SHIFT[side] ?? 0;
  const logoCorner = options.logo ?? "top-left";
  // Kalimat di sisi atas yang bebas dari tangan dan kepala subjek; logo kiri atas dengan kalimat
  // kiri bertumpuk di atasnya.
  const taglineRight = options.kalimat !== "kiri";
  const stackTop = logoCorner === "top-left" && !taglineRight;
  const infoRight = logoCorner === "bottom-left";
  const shadowKind = (options.bayangan as CastShadow | undefined) ?? "keras";
  const front = frontRows(options.depan, rows.length);
  const place = subjectPlace(image.subject?.box ?? FALLBACK_BOX, rows.length, front[0]);
  const logo = <Logo slot="logo" src={slot(slots, "logo", "logo").src} height={6} />;
  const info = (angka || keterangan || cta) && (
    <div
      data-qa-element="group"
      data-qa-name="info"
      style={{
        width: "44%",
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr)",
        gap: space(2),
        justifyItems: infoRight ? "end" : "start",
        textAlign: infoRight ? "right" : "left",
      }}
    >
      {angka && (
        <Text slot="angka" font="heading" size={4} color={tone.small}>
          {angka.value}
        </Text>
      )}
      {keterangan && (
        <AccentText slot="keterangan" color={tone.small} align={infoRight ? "right" : "left"}>
          {keterangan.value}
        </AccentText>
      )}
      {cta && (
        <div style={{ marginTop: space(2) }}>
          <Sticker
            wrap
            slot="cta"
            size={1}
            background={tone.field === "primary" ? "accent" : "primary"}
            color={tone.field === "primary" ? "neutral-dark" : "neutral-light"}
          >
            {cta.value}
          </Sticker>
        </div>
      )}
    </div>
  );
  const edgeRow = {
    position: "relative",
    zIndex: LAYER.text,
    display: "flex",
    justifyContent: "space-between",
    gap: space(4),
  } as const;
  return (
    <div
      data-qa-composition={side === "center" ? "center" : undefined}
      style={{
        position: "relative",
        height: "100%",
        boxSizing: "border-box",
        padding: EDGE,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        gap: space(4),
        background: color(tone.field),
      }}
    >
      <StyleBackdrop
        style={style}
        {...(side === "left" || side === "right" ? { subjectSide: side } : {})}
      />
      <div
        style={{
          ...edgeRow,
          alignItems: "flex-start",
          ...(stackTop ? { flexDirection: "column", gap: space(3) } : {}),
        }}
      >
        {logoCorner === "top-left" ? logo : <span />}
        <div
          data-qa-element="group"
          data-qa-name="kalimat"
          style={{ width: "48%", order: taglineRight || stackTop ? 1 : -1 }}
        >
          <AccentText
            slot="tagline"
            size={2}
            color={tone.small}
            align={taglineRight ? "right" : "left"}
          >
            {slot(slots, "tagline", "text").value}
          </AccentText>
        </div>
      </div>
      {/* Pita kata mengisi sisa tinggi; tanpa stacking context agar baris kata dan subjek bisa
          berselang. Satu baris: kata di dasar pita agar tubuh subjek punya ruang di atasnya. */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          alignItems: rows.length === 1 ? "flex-end" : "center",
          paddingBottom: rows.length === 1 ? space(3) : undefined,
        }}
      >
        {/* Subjek ditempatkan relatif terhadap kotak kata (persen tingginya), jadi ikut ukuran
            kata hasil fit: pinggang subjek selalu di atas baris depan. */}
        <div style={{ position: "relative", width: "100%" }}>
          <BigWord
            slot="kata"
            rows={rows}
            color={ink}
            cap={cap}
            mode="equal"
            lineHeight={LINE}
            front={front}
            frontShadow={shadowKind === "keras" ? shadowTone(tone.field) : undefined}
          />
          <div
            style={{
              position: "absolute",
              zIndex: LAYER.subject,
              top: `${place.top}%`,
              height: `${place.height}%`,
              left: "50%",
              aspectRatio: "4 / 5",
              transform: `translateX(calc(-50% + ${shift}%))`,
              filter: castShadow(tone.field, shadowKind),
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
      </div>
      <div style={{ ...edgeRow, alignItems: "flex-end" }}>
        {infoRight ? logoCorner === "bottom-left" ? logo : <span /> : (info ?? <span />)}
        {infoRight ? info : logoCorner === "bottom-right" ? logo : <span />}
      </div>
      <StyleOverlay style={style} surface={tone.field === "primary" ? "dark" : "light"} />
    </div>
  );
}

export const kataDilompati: Template = {
  meta: {
    id: "feed-kata-dilompati",
    name: "Kata dilompati",
    format: "feed-4x5",
    description:
      "Kata kunci dipecah jadi dua-tiga baris raksasa di atas bidang warna jenuh, subjek cut-out yang melompat menembusnya (baris bawah di depan kaki), kalimat kecil di atas, angka kunci dan CTA kecil di bawah. Untuk kampanye energi, peluncuran, atau ajakan bergerak; butuh subjek melompat atau menari.",
    slots: [
      {
        name: "image",
        type: "image",
        required: true,
        description:
          "Subjek cut-out seluruh badan yang melompat atau menari, berlatar transparan; kaki di separuh bawah",
        aspectRatio: "4:5",
        cutout: true,
      },
      {
        name: "kata",
        type: "text",
        required: true,
        description:
          "Kata kunci pesan, 1–2 kata; setiap kata satu baris, kata tunggal 4–6 huruf dipecah dua (HORE → HO / RE). Pastikan huruf yang tertutup badan subjek tidak mengubah arti kata",
        maxChars: 9,
      },
      {
        name: "tagline",
        type: "text",
        required: true,
        description: "Kalimat kecil dari copy yang melengkapi kata kunci",
        maxChars: 40,
      },
      {
        name: "angka",
        type: "text",
        required: false,
        description: "Angka kunci dari copy: harga, waktu, atau jarak",
        maxChars: 12,
      },
      {
        name: "keterangan",
        type: "text",
        required: false,
        description: "Keterangan pendek angka kunci",
        maxChars: 40,
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
        values: ["primary", "secondary", "accent"],
        default: "primary",
        description: "Bidang warna jenuh di belakang kata",
      },
      {
        name: "huruf",
        values: ["kontras", "primary"],
        default: "kontras",
        description:
          "Warna kata: kontras (terang di bidang gelap, gelap di bidang terang) atau primary",
      },
      {
        name: "baris",
        values: ["pecah", "utuh"],
        default: "pecah",
        description:
          "pecah: setiap kata satu baris, kata tunggal dipecah dua; utuh: seluruh kata satu baris (subjek melompat di atasnya, kaki di belakang huruf)",
      },
      {
        name: "depan",
        values: ["bawah", "tidak"],
        default: "bawah",
        description:
          "bawah: baris terakhir di depan subjek dan menutup kakinya (badan harus di atas baris itu); tidak: semua baris di belakang subjek",
      },
      {
        name: "side",
        values: ["left", "center", "right"],
        default: "center",
        description: "Geser subjek; kalimat dan info di sisi seberangnya",
      },
      {
        name: "bayangan",
        values: ["keras", "lembut", "tanpa"],
        default: "keras",
        description: "Bayangan subjek di dinding; ikuti bayangan Brand Kit",
      },
      {
        name: "kalimat",
        values: ["kanan", "kiri"],
        default: "kanan",
        description:
          "Sisi kalimat kecil di atas; pilih sisi yang tidak tertutup tangan atau kepala subjek",
      },
      {
        name: "logo",
        values: ["top-left", "bottom-left", "bottom-right"],
        default: "top-left",
        description: "Letak logo, mengikuti aturan brand",
      },
    ],
  },
  Slide: KataDilompatiSlide,
};
