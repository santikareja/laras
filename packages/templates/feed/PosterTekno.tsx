import type { SubjectInfo } from "@laras/shared";
import { Logo, Photo, VerticalLabel } from "../primitives/index.ts";
import { type ColorToken, color, fontSize, space } from "../primitives/vars.ts";
import { CANVAS, thirdsPlacement } from "../src/geometry.ts";
import { optionalSlot, type SlideProps, slot, type Template } from "../src/template.ts";
import { HudRow } from "../styles/cyberpunk/parts.tsx";
import { StyleBackdrop, StyleOverlay, styleTreatment } from "../styles/layer.tsx";

// Arketipe khas Cyberpunk "Poster tekno" (T-134, styles/cyberpunk/PANDUAN.md 9.3; rujukan
// db09…, nuansa poster-tekno): repetisi sebagai metafora ritme, rutinitas, atau kelompok. Bidang
// token terang penuh; kata raksasa ditumpuk tiga kali (baris pertama padat, dua gema bergaris
// tepi), subjek besar (monokrom dengan gaya) berdiri di depan gema sehingga baris kedua dan
// ketiga terbelah badannya. Pita gelap selebar kanvas di bawah (subjek berdiri di tepinya atau
// tenggelam di baliknya) memuat satu baris data besar (angka, jadwal, harga), CTA berpita warna
// bidang, dan logo. Label HUD tiga kolom dengan garis kepala di atas dan label vertikal di tepi
// kanan. Subjek dan kata utama di titik potong grid (P8, sumbu kiri).

const { width: W, height: H } = CANVAS;
// Baris padat lalu dua gema.
const ROWS = ["padat", "gema-1", "gema-2"] as const;
// Pita bawah: tinggi dari bawah kanvas (px), dan seberapa jauh dasar subjek setengah badan
// tenggelam di baliknya.
const BAND = 254;
const SINK = 72;
// Puncak alpha subjek (pecahan tinggi kanvas) dan sisi subjek (titik fokus di sepertiga kanan).
const SUBJECT_TOP = 0.29;
const ASPECT = 4 / 5;

type Box = { left: number; top: number; width: number; height: number };

// Kotak gambar (px kanvas): subjek berdiri di tepi atas pita, atau setengah badan tenggelam di
// baliknya; titik fokus di sepertiga kanan.
function subjectBox(subject: SubjectInfo | undefined, cut: boolean): Box {
  const t = subject?.box.top ?? 0.05;
  const b = subject?.box.bottom ?? 0.95;
  const top = SUBJECT_TOP * H;
  const height = (H - BAND + (cut ? SINK : 0) - top) / Math.max(b - t, 0.3);
  const width = height * ASPECT;
  const x = subject?.focus.x ?? 0.5;
  return { left: (2 / 3) * W - x * width, top: top - t * height, width, height };
}

// Satu baris kata dipaskan ke lebar kotak. Baris gema: garis tepi gelap dengan isi warna bidang
// (paint-order: garis dulu, sehingga kontur font variabel yang bertumpuk tertutup isi), tanpa slot.
function Row({ text, field, echo }: { text: string; field: ColorToken; echo: boolean }) {
  const cap = `calc(${fontSize(6)} * 1.8)`;
  return (
    <div style={{ containerType: "inline-size", width: "100%" }}>
      <p
        {...(echo ? {} : { "data-slot": "kata", "data-slot-type": "text" })}
        data-fit="width"
        data-fit-max={cap}
        style={{
          margin: 0,
          fontFamily: "var(--font-heading)",
          fontWeight: "var(--font-heading-weight-strong)",
          fontSize: `min(${cap}, calc(100cqw / ${(Math.max(text.length, 1) * 0.6).toFixed(2)}))`,
          fontSynthesis: "none",
          lineHeight: 0.84,
          whiteSpace: "nowrap",
          textTransform: "uppercase",
          letterSpacing: "var(--style-heading-tracking, -0.01em)",
          color: color(echo ? field : "neutral-dark"),
          ...(echo
            ? { WebkitTextStroke: `6px ${color("neutral-dark")}`, paintOrder: "stroke fill" }
            : {}),
        }}
      >
        {text}
      </p>
    </div>
  );
}

function PosterTeknoSlide({ slots, options, style }: SlideProps) {
  const image = slot(slots, "image", "image");
  const kata = slot(slots, "kata", "text").value;
  const data = optionalSlot(slots, "data", "text");
  const cta = optionalSlot(slots, "cta", "text");
  const vertical = optionalSlot(slots, "vertikal", "text");
  const field: ColorToken = options.bidang === "accent" ? "accent" : "secondary";
  const box = subjectBox(image.subject, options.subjek === "terpotong");
  const placement = image.subject
    ? thirdsPlacement(box, ASPECT, image.subject, "right", false)
    : undefined;
  const cyber = style?.id === "cyberpunk";
  const edge = "var(--space-safe)";
  return (
    <div
      style={{ position: "relative", height: "100%", overflow: "hidden", background: color(field) }}
    >
      {!cyber && <StyleBackdrop style={style} surface="light" />}
      <div
        data-qa-element="decor"
        aria-hidden="true"
        style={{
          position: "absolute",
          left: edge,
          right: edge,
          top: `calc(${edge} + ${space(5)})`,
          height: "var(--shape-stroke)",
          minHeight: 2,
          background: color("neutral-dark"),
        }}
      />
      <div
        data-qa-element="group"
        data-qa-name="judul"
        style={{
          position: "absolute",
          left: edge,
          // Kolom kanan untuk label vertikal.
          right: `calc(${edge} + ${space(6)})`,
          top: `calc(${edge} + ${space(7)})`,
          display: "grid",
          gap: space(1),
        }}
      >
        {ROWS.map((row, i) => (
          <div
            key={row}
            {...(i > 0 ? { "aria-hidden": true, style: { pointerEvents: "none" } } : {})}
          >
            <Row text={kata} field={field} echo={i > 0} />
          </div>
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          left: box.left,
          top: box.top,
          width: box.width,
          height: box.height,
          transform: placement?.transform,
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
      {vertical && (
        <div style={{ position: "absolute", right: edge, top: `calc(${edge} + ${space(7)})` }}>
          <VerticalLabel slot="vertikal" color="neutral-dark" caps>
            {vertical.value}
          </VerticalLabel>
        </div>
      )}
      <HudRow
        labels={[
          optionalSlot(slots, "hud1", "text")?.value,
          optionalSlot(slots, "hud2", "text")?.value,
          optionalSlot(slots, "hud3", "text")?.value,
        ]}
        color="neutral-dark"
        style={{ top: edge }}
      />
      <div
        data-qa-element="shape"
        data-qa-name="pita"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: BAND,
          background: color("neutral-dark"),
        }}
      />
      <div
        data-qa-element="group"
        data-qa-name="info"
        style={{
          position: "absolute",
          left: edge,
          right: edge,
          bottom: edge,
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) auto",
          alignItems: "end",
          columnGap: space(4),
        }}
      >
        <div style={{ display: "grid", gap: space(3), justifyItems: "start" }}>
          {data && (
            <p
              data-slot="data"
              data-slot-type="text"
              style={{
                margin: 0,
                fontFamily: "var(--font-heading)",
                fontWeight: "var(--font-heading-weight-strong)",
                fontSize: fontSize(3),
                fontSynthesis: "none",
                lineHeight: 1.1,
                whiteSpace: "nowrap",
                color: color("neutral-light"),
              }}
            >
              {data.value}
            </p>
          )}
          {cta && (
            <span
              data-slot="cta"
              data-slot-type="text"
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: "var(--font-body-weight-strong)",
                fontSize: fontSize(3),
                fontSynthesis: "none",
                lineHeight: 1.15,
                whiteSpace: "nowrap",
                padding: `0.1em ${space(2)}`,
                borderRadius: "var(--shape-radius)",
                background: color(field),
                color: color("neutral-dark"),
              }}
            >
              {cta.value}
            </span>
          )}
        </div>
        <Logo slot="logo" src={slot(slots, "logo", "logo").src} height={6} />
      </div>
      {!cyber && <StyleOverlay style={style} surface="light" />}
    </div>
  );
}

export const posterTekno: Template = {
  meta: {
    id: "feed-poster-tekno",
    name: "Poster tekno",
    format: "feed-4x5",
    description:
      "Poster rilis di bidang token terang: kata raksasa ditumpuk tiga kali (padat lalu dua gema bergaris tepi) sebagai metafora ritme atau rutinitas, subjek besar di depan gema (monokrom dengan gaya Cyberpunk), pita gelap di bawah berisi satu baris data besar (angka, jadwal, harga), CTA, dan logo; label HUD di atas dan label vertikal di tepi kanan. Gaya Cyberpunk varian poster tekno; untuk peluncuran, acara, jadwal rutin, atau program berulang.",
    slots: [
      {
        name: "image",
        type: "image",
        required: true,
        description:
          "Subjek cut-out berlatar transparan (orang atau objek); monokrom dengan gaya Cyberpunk bila aturan brand mengizinkan",
        aspectRatio: "4:5",
        cutout: true,
        composition: {
          base: "Large subject standing tall, centered, and facing the camera, full body or knees up, readable as a strong silhouette in front of repeated giant words.",
        },
      },
      {
        name: "kata",
        type: "text",
        required: true,
        description: "Satu kata pendek yang pantas diulang (ritme, rutinitas), kapital",
        maxChars: 8,
      },
      {
        name: "data",
        type: "text",
        required: false,
        description: "Satu baris data besar dari copy: angka, jadwal, jarak, atau harga",
        maxChars: 20,
      },
      { name: "cta", type: "text", required: false, description: "Ajakan singkat", maxChars: 18 },
      {
        name: "vertikal",
        type: "text",
        required: false,
        description: "Label vertikal di tepi kanan: nama brand atau edisi",
        maxChars: 16,
      },
      {
        name: "hud1",
        type: "text",
        required: false,
        description: "Label HUD kiri atas: kategori atau lokasi",
        maxChars: 16,
      },
      {
        name: "hud2",
        type: "text",
        required: false,
        description: "Label HUD tengah atas: program atau jadwal",
        maxChars: 16,
      },
      {
        name: "hud3",
        type: "text",
        required: false,
        description: "Label HUD kanan atas: harga, tanggal, atau handle",
        maxChars: 16,
      },
      {
        name: "logo",
        type: "logo",
        required: true,
        description: "Logo varian onDark (di pita gelap)",
      },
    ],
    options: [
      {
        name: "subjek",
        values: ["berdiri", "terpotong"],
        default: "berdiri",
        description:
          "Berdiri di tepi atas pita (objek, orang seluruh badan), atau setengah badan tenggelam di balik pita",
      },
      {
        name: "bidang",
        values: ["secondary", "accent"],
        default: "secondary",
        description: "Token terang untuk bidang poster (luminans tinggi agar teks gelap terbaca)",
      },
    ],
  },
  Slide: PosterTeknoSlide,
};
