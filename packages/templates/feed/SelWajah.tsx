import { Logo, Text } from "../primitives/index.ts";
import type { ImageTreatment } from "../primitives/Photo.tsx";
import {
  type ColorToken,
  color,
  fontFamily,
  fontSize,
  fontWeight,
  space,
} from "../primitives/vars.ts";
import { optionalSlot, type SlideProps, slot, type Template } from "../src/template.ts";
import { accentFont, type CellFill, Cells, Credits, Mono } from "../styles/brutalism/parts.tsx";
import { StyleBackdrop, StyleOverlay, styleTreatment } from "../styles/layer.tsx";

// Arketipe khas Brutalisme "Sel wajah" (T-134; PANDUAN Brutalisme pola 4, rujukan c9ca…): satu
// foto (wajah, tangan, atau kelompok) dipotong menjadi 4 × 3 sel berjeda yang menjadi elemen
// dominan. Judul satu baris selebar area aman di atasnya, kata pertamanya knock-out di blok tinta,
// dan baris sel teratas menggigit kaki hurufnya: huruf terpotong grid. Dua sel diganti: panel
// kertas berisi body dan blok aksen berisi CTA, di sisi seberang fokus foto. Di kaki: kredit mono
// bergaya poster film yang berisi fakta dari copy, dan logo.
// Lapisan: kertas → judul → sel foto (menimpa kaki judul) → teks sel → kredit dan logo.

const ANCHOR = { judul: "--sel-judul", kaki: "--sel-kaki" };
// Sel teratas menimpa judul mulai titik ini dari puncak huruf kapital: 16% kaki huruf terpotong.
// Judul juga dipotong di garis yang sama, agar kaki huruf tidak tampak di celah antarsel (T-135).
const BITE = 84;
const GRID = { columns: 4, rows: 3, gap: 12 };
const ZOOM: Record<string, number> = { "1": 1, "2": 1.25, "3": 1.6 };

const TONES: Record<string, ColorToken> = {
  primer: "primary",
  aksen: "accent",
  tinta: "neutral-dark",
};

// Judul satu baris dipaskan ke lebar (data-fit): kata pertama di blok knock-out bila ada dua kata
// atau lebih, sisanya berwarna `tone`. Padding blok dalam em agar ikut ukuran hasil fit.
function Judul({ text, tone }: { text: string; tone: ColorToken }) {
  const [first = "", ...rest] = text.trim().split(/\s+/);
  const block = rest.length > 0;
  return (
    <p
      data-slot="judul"
      data-slot-type="text"
      style={{
        margin: 0,
        fontFamily: fontFamily("heading"),
        fontWeight: fontWeight("heading", true),
        fontSize: fontSize(1),
        fontSynthesis: "none",
        lineHeight: 0.86,
        whiteSpace: "nowrap",
        textTransform: "var(--style-heading-transform, none)" as "none",
        letterSpacing: "var(--style-heading-tracking, normal)",
        containerType: "inline-size",
      }}
    >
      <span
        data-fit="width"
        data-fit-max={`calc(${fontSize(6)} * 2.4)`}
        style={{
          display: "block",
          fontSize: `calc(100cqw / ${(Math.max(text.length, 1) * 0.6).toFixed(2)})`,
          // Kotak baris = tinggi huruf kapital sampai garis dasar (sama untuk semua font).
          textBox: "trim-both cap alphabetic",
          // Hanya bawah yang dipotong: puncak huruf kecil dan padding blok knock-out di atas kotak
          // tinggi kapital tetap utuh (inset negatif).
          clipPath: `inset(-1em -1em ${100 - BITE}% -1em)`,
          color: color(tone),
          anchorName: ANCHOR.judul,
        }}
      >
        {block ? (
          <>
            <span
              style={{
                display: "inline-block",
                padding: "0.1em 0.1em 0.12em",
                marginRight: "0.12em",
                borderRadius: "var(--shape-radius)",
                background: color("neutral-dark"),
                color: color("neutral-light"),
              }}
            >
              {first}
            </span>
            {rest.join(" ")}
          </>
        ) : (
          first
        )}
      </span>
    </p>
  );
}

function SelWajahSlide({ slots, options, style }: SlideProps) {
  const right = options.side !== "left";
  const near = right ? "left" : "right";
  const image = slot(slots, "foto", "image");
  const seri = optionalSlot(slots, "seri", "text");
  const body = optionalSlot(slots, "body", "text");
  const cta = optionalSlot(slots, "cta", "text");
  const kredit = optionalSlot(slots, "kredit", "text");
  const logoTop = options.logo !== "bottom";
  const tone = TONES[options.nada ?? "primer"] ?? "primary";
  const zoom = ZOOM[options.zoom ?? "1"] ?? 1;
  // Titik fokus foto penuh dari opsi (letak yang diminta Claude di deskripsi aset, T-135);
  // diletakkan di sisi `side` grid sel.
  const focus = {
    x: 0.5,
    y: options.fokus === "tengah" ? 0.48 : options.fokus === "bawah" ? 0.62 : 0.32,
  };
  const treatment: ImageTreatment = (() => {
    const base = styleTreatment(style);
    return base.kind === "halftone" ? { ...base, pitch: 8 } : base;
  })();
  // Panel body dan CTA (dua sel) di baris tengah dan satu sel aksen di sudut bawah, di sisi
  // seberang fokus foto.
  const fills: Record<number, CellFill> = {};
  if (body || cta) {
    fills[right ? 4 : 6] = {
      kind: "panel",
      span: 2,
      children: (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr)",
            justifyItems: right ? "start" : "end",
            gap: space(3),
            padding: right ? `0 ${space(3)} 0 0` : `0 0 0 ${space(3)}`,
            textAlign: near,
          }}
        >
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
                fontSize: fontSize(1),
                lineHeight: 1.2,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              {cta.value}
            </p>
          )}
        </div>
      ),
    };
  }
  const corner = right ? 8 : 11;
  if (options.sel === "tint") fills[corner] = { kind: "photo", tint: "accent" };
  if (options.sel === "blok") fills[corner] = { kind: "block", background: "accent" };
  const logo = <Logo slot="logo" src={slot(slots, "logo", "logo").src} height={6} />;
  const backdrop = style && { ...style, options: { ...style.options, grid: "no" } };
  return (
    <div
      style={{
        position: "relative",
        height: "100%",
        overflow: "hidden",
        background: color("neutral-light"),
      }}
    >
      <StyleBackdrop style={backdrop} subjectSide={right ? "right" : "left"} />
      <div
        style={{
          position: "absolute",
          inset: "var(--space-safe)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div>
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
              <div style={{ maxWidth: "62%" }}>
                <Mono slot="seri" color="neutral-dark" bar="accent" align={near}>
                  {seri.value}
                </Mono>
              </div>
            ) : (
              <span />
            )}
            {logoTop && logo}
          </div>
          <Judul text={slot(slots, "judul", "text").value} tone={tone} />
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: right ? "row" : "row-reverse",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: space(4),
            anchorName: ANCHOR.kaki,
          }}
        >
          {kredit ? (
            <div style={{ maxWidth: "70%" }}>
              <Credits slot="kredit" head="primary" align={near}>
                {kredit.value}
              </Credits>
            </div>
          ) : (
            <span />
          )}
          {!logoTop && logo}
        </div>
      </div>
      {/* Sel foto: dari kaki huruf judul sampai di atas kaki poster (anchor). */}
      <div
        style={{
          position: "absolute",
          left: "var(--space-safe)",
          right: "var(--space-safe)",
          top: `anchor(${ANCHOR.judul} ${BITE}%)`,
          bottom: `calc(anchor(${ANCHOR.kaki} top) + ${space(4)})`,
        }}
      >
        <Cells
          slot="foto"
          src={image.src}
          columns={GRID.columns}
          rows={GRID.rows}
          gap={GRID.gap}
          frame={{ zoom, x: focus.x, y: focus.y, atX: right ? 0.64 : 0.36, atY: 0.42 }}
          treatment={treatment}
          fills={fills}
        />
      </div>
      <StyleOverlay style={style} surface="light" />
    </div>
  );
}

export const selWajah: Template = {
  meta: {
    id: "feed-sel-wajah",
    name: "Sel wajah",
    format: "feed-4x5",
    description:
      "Satu foto (wajah, tangan dengan produk, atau kelompok orang) dipotong menjadi 4 × 3 sel berjeda sebagai elemen dominan; judul satu baris di atasnya dengan kata pertama knock-out di blok tinta dan kaki huruf tergigit sel; panel body dan blok CTA menggantikan dua sel; kredit mono berisi fakta di kaki. Untuk testimoni, perkenalan orang di balik brand, dan pesan komunitas.",
    slots: [
      {
        name: "judul",
        type: "text",
        required: true,
        description:
          "Judul pendek dari copy, satu baris; dua kata atau lebih membuat kata pertama knock-out di blok tinta",
        maxChars: 14,
      },
      {
        name: "foto",
        type: "image",
        required: true,
        description:
          "Foto penuh dengan bentuk besar yang tetap terbaca bila dipotong: close-up wajah atau kulit, kelompok orang, benda dari atas. Minta di deskripsi aset letak bagian terpenting (wajah kelompok, mata pada close-up, produk) di sepertiga atas foto, dengan ruang tubuh atau latar di bawahnya",
        aspectRatio: "4:5",
        composition: {
          base: "Full photo with large shapes that stay readable when cut into a 4 by 3 grid: a face or skin close-up, a group, or objects from above; keep the most important part (eyes, faces, product) in the upper third with body or backdrop below.",
          option: "side",
          byValue: {
            right: "Place the focal point on the right half.",
            left: "Place the focal point on the left half.",
          },
        },
      },
      {
        name: "seri",
        type: "text",
        required: false,
        description: "Label teknis atas dari copy: program, tempat, atau seri",
        maxChars: 30,
      },
      {
        name: "body",
        type: "text",
        required: false,
        description: "Satu kalimat pendek dari copy di panel kertas dua sel (maks dua baris)",
        maxChars: 48,
      },
      {
        name: "cta",
        type: "text",
        required: false,
        description: "Ajakan pendek di bawah body, berupa pita tinta",
        maxChars: 24,
      },
      {
        name: "kredit",
        type: "text",
        required: false,
        description:
          "2–3 baris kredit bergaya poster film dari fakta copy, format 'Judul: isi' dipisah ' / '",
        maxChars: 90,
      },
      { name: "logo", type: "logo", required: true, description: "Logo; varian primary" },
    ],
    options: [
      {
        name: "side",
        values: ["right", "left"],
        default: "right",
        description: "Sisi fokus foto; panel body dan blok CTA di sisi seberang",
      },
      {
        name: "nada",
        values: ["primer", "aksen", "tinta"],
        default: "primer",
        description: "Warna kata judul di luar blok; aksen hanya bila aksen ≥ 3:1 di atas kertas",
      },
      {
        name: "zoom",
        values: ["1", "2", "3"],
        default: "1",
        description: "Seberapa dekat foto dipotong: 1 utuh, 3 paling dekat ke fokus",
      },
      {
        name: "fokus",
        values: ["atas", "tengah", "bawah"],
        default: "atas",
        description:
          "Letak vertikal bagian penting foto, sama dengan yang diminta di deskripsi aset (biasanya atas); salah pilih memotong wajah di baris sel pertama",
      },
      {
        name: "sel",
        values: ["tint", "blok", "none"],
        default: "tint",
        description:
          "Satu sel sudut bawah di sisi panel: foto dicetak warna aksen, blok aksen polos, atau foto biasa (brand yang melarang filter pada kulit: blok)",
      },
      {
        name: "logo",
        values: ["top", "bottom"],
        default: "top",
        description: "Logo di kepala atau di kaki sisi seberang kredit (mis. aturan kanan bawah)",
      },
    ],
  },
  Slide: SelWajahSlide,
};
