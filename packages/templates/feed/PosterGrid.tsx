import type { SubjectInfo } from "@laras/shared";
import { Logo, Photo, Text } from "../primitives/index.ts";
import type { ImageTreatment } from "../primitives/Photo.tsx";
import { color, space } from "../primitives/vars.ts";
import { CANVAS } from "../src/geometry.ts";
import { optionalSlot, type SlideProps, slot, type Template } from "../src/template.ts";
import {
  accentFont,
  Leader,
  type LineTone,
  Mono,
  Rangka,
  Ruler,
  STROKE,
  Stack,
  stackLines,
} from "../styles/brutalism/parts.tsx";
import { StyleBackdrop, StyleOverlay, styleTreatment } from "../styles/layer.tsx";

// Arketipe khas Brutalisme "Poster grid" (T-134; PANDUAN Brutalisme pola 1, rujukan 4b97… dan
// a0fe…): lembar spesifikasi. Grid 12 kolom bernomor dipamerkan, kata kunci raksasa bertumpuk
// selebar area aman dengan baris terakhir disorot, lalu subjek cut-out berdiri di kolom sisinya
// dan menembus kaki huruf baris terakhir (K3). Di belakang subjek: cakram aksen dan blok dasar
// yang bleed ke tepi (geometri bermakna: matahari terbit, cap sangrai). Di kolom seberang:
// anotasi mono dengan garis penunjuk tepat ke subjek, body, CTA berupa pita tinta, dan logo.
// Lapisan: kertas dan garis grid → cakram → blok dasar → kata raksasa → subjek → teks dan label.
//
// Tinggi kata raksasa baru diketahui setelah fit renderer, jadi subjek dan anotasi menempel ke
// hurufnya lewat CSS anchor positioning (anchor di baris terakhir dan di kotak subjek).

const ANCHOR = {
  kata: "--poster-kata",
  akhir: "--poster-kata-akhir",
  subjek: "--poster-subjek",
  tinggi: "--poster-tinggi",
};
const TEXT_ANCHOR = "--poster-teks";
// Puncak subjek menimpa baris terakhir sampai titik ini (dari atas kotak baris): kaki huruf.
const BITE = "74%";
// Pusat subjek (bagian lebar area aman) di sisinya.
const CENTER = 0.72;
// Kolom teks di sisi seberang subjek (bagian lebar area aman).
const COLUMN = 0.46;
// Tinggi blok dasar (px) di atas safe margin bawah.
const GROUND = 184;
const ROUND = (value: number) => Math.round(value * 10000) / 10000;

const SOROT: Record<string, LineTone> = {
  aksen: "aksen",
  primer: "primer",
  blok: "blok",
  balik: "balik",
  tinta: "tinta",
};

const FULL: SubjectInfo = {
  box: { left: 0, top: 0, right: 1, bottom: 1 },
  focus: { x: 0.5, y: 0.4 },
};

// Kotak gambar subjek (kanvas): kotak alpha yang terlihat dimulai di kaki huruf baris terakhir
// (anchor) dan berakhir di `floor`. Tinggi gambar = tinggi terlihat / tinggi kotak alpha.
function subjectInsets(subject: SubjectInfo, floor: string) {
  const { box } = subject;
  const bh = box.bottom - box.top;
  const a = `anchor(${ANCHOR.akhir} ${BITE})`;
  const t = ROUND(box.top / bh);
  const u = ROUND((1 - box.top) / bh);
  return {
    // top = A − box.top × (F − A) / bh; bawah = A + (1 − box.top) × (F − A) / bh.
    top: `calc(${ROUND(1 + t)} * ${a} - ${t} * (${floor}))`,
    bottom: `calc(${CANVAS.height}px - ${ROUND(1 - u)} * ${a} - ${u} * (${floor}))`,
  };
}

// Halftone subjek besar: jarak titik 9 px dan dicetak di atas kertas, sehingga siluetnya tetap
// utuh seperti potongan cetakan yang ditempel di atas cakram (rujukan 365b…), bukan titik yang
// larut ke warna di belakangnya.
function subjectTreatment(treatment: ImageTreatment): ImageTreatment {
  return treatment.kind === "halftone"
    ? { ...treatment, pitch: 9, paper: "neutral-light" }
    : treatment;
}

function PosterGridSlide({ slots, options, style }: SlideProps) {
  const right = options.side !== "left";
  const near = right ? "left" : "right";
  const far = right ? "right" : "left";
  const image = slot(slots, "image", "image");
  const subject = image.subject ?? FULL;
  const seri = optionalSlot(slots, "seri", "text");
  const catatan = optionalSlot(slots, "catatan", "text");
  const body = optionalSlot(slots, "body", "text");
  const cta = optionalSlot(slots, "cta", "text");
  const pernyataan = optionalSlot(slots, "pernyataan", "text");
  const logoTop = options.logo !== "bottom";
  const shape = options.bentuk ?? "disc";
  const ground =
    options.dasar === "primer" ? "primary" : options.dasar === "none" ? null : "neutral-dark";
  const cut = options.subjek === "terpotong";
  const kata = slot(slots, "kata", "text").value;
  const lines = stackLines(kata);
  const tone = SOROT[options.sorot ?? "aksen"] ?? "aksen";
  // Grid poster digambar arketipe ini; grid lapisan gaya dimatikan agar tidak dobel.
  const grid = style?.options.grid !== "no";
  const backdrop = style && { ...style, options: { ...style.options, grid: "no" } };
  // Dasar subjek di kanvas: tepi bawah (terpotong), atas blok dasar, atau safe margin bawah.
  const floor = cut
    ? `${CANVAS.height}px`
    : `${CANVAS.height}px - var(--space-safe)${ground ? ` - ${GROUND}px` : ""}`;
  const insets = subjectInsets(subject, floor);
  const centerX = `var(--space-safe) + ${right ? CENTER : 1 - CENTER} * (100% - 2 * var(--space-safe))`;
  const cx = (subject.box.left + subject.box.right) / 2;
  // Titik tuju anotasi: fokus subjek, digeser ke arah teks dan sedikit ke bawah (pipi, bukan
  // mata; label kemasan, bukan tepinya).
  const bw = subject.box.right - subject.box.left;
  const bh = subject.box.bottom - subject.box.top;
  const point = {
    x: ROUND((subject.focus.x + (right ? -1 : 1) * 0.04 * bw) * 100),
    y: ROUND((subject.focus.y + 0.09 * bh) * 100),
  };
  const logo = <Logo slot="logo" src={slot(slots, "logo", "logo").src} height={6} />;
  const discSize = "min(48cqw, 100cqh - 24px)";
  // Tepi dalam blok dasar dari sisi seberang kanvas (sejajar kolom teks + satu langkah).
  const groundEdge = `calc(var(--space-safe) + ${COLUMN} * (100% - 2 * var(--space-safe)) + ${space(3)})`;
  return (
    <div
      style={{
        position: "relative",
        height: "100%",
        overflow: "hidden",
        background: color("neutral-light"),
      }}
    >
      <StyleBackdrop style={backdrop} subjectSide={far} />
      {grid && <Rangka />}
      <div
        style={{
          position: "absolute",
          inset: "var(--space-safe)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: right ? "row" : "row-reverse",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: space(4),
            minHeight: space(6),
            marginBottom: space(4),
          }}
        >
          {seri ? (
            <div style={{ maxWidth: "60%" }}>
              <Mono slot="seri" color="neutral-dark" bar="accent" align={near}>
                {seri.value}
              </Mono>
            </div>
          ) : (
            <span />
          )}
          {logoTop && logo}
        </div>
        {grid ? (
          <Ruler />
        ) : (
          <span
            aria-hidden="true"
            data-qa-element="decor"
            style={{ display: "block", height: STROKE, background: color("neutral-dark") }}
          />
        )}
        <div style={{ marginTop: space(4) }}>
          <Stack
            slot="kata"
            scale={lines.length >= 3 ? 1.8 : 2.6}
            tones={{ [lines.length - 1]: tone }}
            anchors={{ block: ANCHOR.kata, last: ANCHOR.akhir }}
          >
            {kata}
          </Stack>
        </div>
        <div
          style={{
            position: "relative",
            flex: "1 1 auto",
            marginTop: space(2),
            containerType: "size",
          }}
        >
          {shape === "disc" && (
            <div
              data-qa-element="shape"
              data-qa-name="cakram"
              aria-hidden="true"
              style={{
                position: "absolute",
                [far]: `calc(${ROUND((1 - CENTER) * 100)}cqw - ${discSize} / 2)`,
                top: ground
                  ? `calc(100cqh - ${GROUND}px - ${discSize} * 0.8)`
                  : `calc(100cqh - ${discSize})`,
                width: `calc(${discSize})`,
                height: `calc(${discSize})`,
                borderRadius: "50%",
                background: color("accent"),
              }}
            />
          )}
          {shape === "blok" && (
            <div
              data-qa-element="shape"
              data-qa-name="blok aksen"
              aria-hidden="true"
              style={{
                position: "absolute",
                [far]: 0,
                top: "12cqh",
                width: "42cqw",
                height: ground ? `calc(88cqh - ${GROUND}px + ${space(4)})` : "70cqh",
                borderRadius: "var(--shape-radius)",
                background: color("accent"),
              }}
            />
          )}
          {ground && (
            <div
              data-qa-element="shape"
              data-qa-name="blok dasar"
              aria-hidden="true"
              style={{
                position: "absolute",
                [far]: "calc(-1 * var(--space-safe))",
                bottom: "calc(-1 * var(--space-safe))",
                width: `calc(${ROUND((1 - COLUMN) * 100)}cqw - ${space(3)} + var(--space-safe))`,
                height: `calc(${GROUND}px + var(--space-safe))`,
                background: color(ground),
              }}
            />
          )}
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              [near]: 0,
              width: `${COLUMN * 100}cqw`,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              alignItems: right ? "flex-start" : "flex-end",
              textAlign: near,
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(0, 1fr)",
                justifyItems: right ? "start" : "end",
                gap: space(4),
                width: "100%",
                anchorName: TEXT_ANCHOR,
              }}
            >
              {pernyataan && (
                <Text slot="pernyataan" font="heading" size={4} color="neutral-dark" strong>
                  {pernyataan.value}
                </Text>
              )}
              {body && (
                <Text slot="body" font="body" size={2} color="neutral-dark" balance>
                  {body.value}
                </Text>
              )}
              {cta && (
                <p
                  data-slot="cta"
                  data-slot-type="text"
                  style={{
                    ...accentFont(),
                    margin: 0,
                    padding: `${space(2)} ${space(3)}`,
                    borderRadius: "var(--shape-radius)",
                    background: color("neutral-dark"),
                    color: color("neutral-light"),
                    fontSize: "var(--font-size-1)",
                    lineHeight: 1.2,
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  {cta.value}
                </p>
              )}
              {!logoTop && <div style={{ marginTop: space(2) }}>{logo}</div>}
            </div>
          </div>
        </div>
      </div>
      {grid && ground && (
        // Grid berlanjut di atas blok dasar dengan garis terang.
        <Rangka
          tone="neutral-light"
          clip={`inset(calc(100% - var(--space-safe) - ${GROUND}px) ${right ? 0 : groundEdge} 0 ${right ? groundEdge : 0})`}
        />
      )}
      {/* Subjek: kotak alpha dari kaki huruf baris terakhir sampai dasarnya (anchor). */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: insets.top,
          bottom: insets.bottom,
        }}
      >
        {/* Penggaris tinggi kotak (anchor-size), agar posisi mendatar tidak memakai transform:
            transform membuat stacking context dan memutus multiply halftone dengan latar. */}
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width: 1,
            anchorName: ANCHOR.tinggi,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: `calc(${centerX} - ${ROUND(cx * 0.8)} * anchor-size(${ANCHOR.tinggi} height))`,
            aspectRatio: "4 / 5",
            anchorName: ANCHOR.subjek,
          }}
        >
          <Photo
            slot="image"
            src={image.src}
            fit="contain"
            treatment={subjectTreatment(styleTreatment(style))}
            focus={image.subject?.focus}
          />
        </div>
      </div>
      {catatan && (
        // Anotasi setinggi titik tuju pada subjek, di bawah kata raksasa dan di atas body.
        <div
          data-qa-element="group"
          data-qa-name="anotasi"
          style={{
            position: "absolute",
            [near]: "var(--space-safe)",
            // anchor() di `left`/`right` sudah berupa jarak tepi itu ke titik pada subjek.
            [far]: `anchor(${ANCHOR.subjek} ${point.x}%)`,
            // Penjaga bawah kata raksasa dipasang terakhir agar selalu menang.
            top: `max(min(anchor(${ANCHOR.subjek} ${point.y}%) - 20px, anchor(${TEXT_ANCHOR} top) - 96px), anchor(${ANCHOR.kata} bottom) + ${space(4)})`,
            display: "flex",
            flexDirection: right ? "row" : "row-reverse",
            alignItems: "center",
            gap: space(2),
          }}
        >
          <div style={{ flex: "0 1 auto", maxWidth: `${ROUND(COLUMN * 0.8 * 100)}%` }}>
            <Mono slot="catatan" color="neutral-dark" align={near}>
              {catatan.value}
            </Mono>
          </div>
          <Leader to={far} />
        </div>
      )}
      <StyleOverlay style={style} surface="light" />
    </div>
  );
}

export const posterGrid: Template = {
  meta: {
    id: "feed-poster-grid",
    name: "Poster grid",
    format: "feed-4x5",
    description:
      "Poster lembar spesifikasi: grid 12 kolom bernomor terlihat, 1–3 kata kunci raksasa bertumpuk satu kata per baris dengan baris terakhir disorot, subjek cut-out di kolom sisinya yang menembus kaki huruf, cakram aksen dan blok dasar di belakang subjek, anotasi yang menunjuk subjek, body, dan CTA berupa pita. Untuk pengumuman, promo produk, dan manifesto yang bisa dirangkum 1–3 kata.",
    slots: [
      {
        name: "kata",
        type: "text",
        required: true,
        description:
          "1–3 kata kunci dari copy, ditumpuk satu kata per baris (kata ≤ 2 karakter seperti AM atau 5K ikut baris sebelumnya); setiap baris maksimal 8 karakter",
        maxChars: 18,
      },
      {
        name: "image",
        type: "image",
        required: true,
        description: "Subjek cut-out berlatar transparan (produk atau orang)",
        aspectRatio: "4:5",
        cutout: true,
        composition: {
          base: "Cut-out product or person, upright and whole, that rises into the bottom of a stacked giant word; strong silhouette.",
          option: "side",
          byValue: {
            left: "Turn the body and gaze slightly toward the right, where the text sits.",
            right: "Turn the body and gaze slightly toward the left, where the text sits.",
          },
        },
      },
      {
        name: "seri",
        type: "text",
        required: false,
        description: "Label teknis atas dari copy: seri, tempat, atau jadwal",
        maxChars: 30,
      },
      {
        name: "catatan",
        type: "text",
        required: false,
        description:
          "Anotasi pendek dari copy yang menunjuk subjek dengan garis, mis. fakta produk yang terlihat di gambar",
        maxChars: 26,
      },
      {
        name: "pernyataan",
        type: "text",
        required: false,
        description: "Pernyataan pendek dari copy di kolom teks, huruf heading besar",
        maxChars: 24,
      },
      {
        name: "body",
        type: "text",
        required: false,
        description: "Satu kalimat pendukung dari copy",
        maxChars: 64,
      },
      {
        name: "cta",
        type: "text",
        required: false,
        description: "Ajakan atau harga",
        maxChars: 24,
      },
      { name: "logo", type: "logo", required: true, description: "Logo; varian primary" },
    ],
    options: [
      {
        name: "side",
        values: ["right", "left"],
        default: "right",
        description: "Sisi subjek; teks, anotasi, dan CTA di sisi seberang",
      },
      {
        name: "sorot",
        values: ["aksen", "blok", "balik", "primer", "tinta"],
        default: "aksen",
        description:
          "Perlakuan baris terakhir: warna aksen (hanya bila aksen ≥ 3:1 di atas kertas), blok aksen, blok tinta knock-out, warna primer, atau tanpa sorot",
      },
      {
        name: "bentuk",
        values: ["disc", "blok", "none"],
        default: "disc",
        description:
          "Bentuk aksen di belakang subjek; none untuk brand yang membatasi elemen visual utama",
      },
      {
        name: "dasar",
        values: ["gelap", "primer", "none"],
        default: "gelap",
        description: "Blok dasar tempat subjek berdiri, bleed ke tepi bawah dan sisi subjek",
      },
      {
        name: "subjek",
        values: ["utuh", "terpotong"],
        default: "utuh",
        description:
          "terpotong untuk cut-out setengah badan: bagian bawahnya diteruskan sampai tepi kanvas",
      },
      {
        name: "logo",
        values: ["top", "bottom"],
        default: "top",
        description:
          "Logo di kepala sisi subjek, atau di kaki kolom teks (mis. aturan kanan bawah)",
      },
    ],
  },
  Slide: PosterGridSlide,
};
