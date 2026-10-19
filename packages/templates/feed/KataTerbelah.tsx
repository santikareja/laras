import type { SubjectInfo } from "@laras/shared";
import { Logo, Photo, Text } from "../primitives/index.ts";
import { color, space } from "../primitives/vars.ts";
import { CANVAS } from "../src/geometry.ts";
import { optionalSlot, type SlideProps, slot, type Template } from "../src/template.ts";
import {
  Halo,
  HudRow,
  inkOn,
  type Light,
  PixelField,
  Pixels,
  ScreenTexture,
  SplitWord,
} from "../styles/cyberpunk/parts.tsx";
import { StyleBackdrop, StyleOverlay, styleEffect, styleTreatment } from "../styles/layer.tsx";

// Arketipe khas Cyberpunk "Kata terbelah" (T-134, styles/cyberpunk/PANDUAN.md 9.1; rujukan
// AUTOMATIZAR/SOMOS): pernyataan heroik satu kata. Kata raksasa selebar konten di sepertiga atas,
// subjek besar berdiri di depannya sehingga bagian bawah huruf tertutup kepala atau puncak
// subjek, dan potongan kata berpita warna cahaya ditarik ke depan subjek (subjek terjepit di
// antara kata dan pitanya). Pembuka di atas kata, label HUD tiga kolom di safe margin atas, satu
// kalimat dan CTA di bawah subjek, piksel lepas di satu sisi subjek, cahaya di belakangnya.
// Komposisi simetris di sumbu tengah (P8 dikecualikan seperti feed-satu-objek).

const { width: W, height: H } = CANVAS;
// Dasar kata (pecahan tinggi kanvas) dan seberapa jauh puncak subjek naik menutup huruf.
const WORD_BOTTOM = 0.34;
const OVERLAP = 0.075;
const ASPECT = 4 / 5;
// Tinggi (px) untuk menghitung lantai: safe margin terbesar fixture, logo, jarak, satu baris body
// langkah 2 (≤ 36 px × 1,4), baris CTA berpita, dan jarak di antaranya. Body selalu satu baris.
const BOTTOM = { safe: 80, logo: 48, gap: 32, line: 52, cta: 60, stack: 16 } as const;

// Lantai subjek (pecahan tinggi kanvas): blok info tepat di bawahnya, di atas logo bila logo di
// tengah bawah.
function floorOf(body: boolean, cta: boolean, logoBelow: boolean): number {
  const info = (body ? BOTTOM.line : 0) + (cta ? BOTTOM.cta : 0) + (body && cta ? BOTTOM.stack : 0);
  const reserved = BOTTOM.safe + (logoBelow ? BOTTOM.logo + BOTTOM.gap : 0) + info + BOTTOM.gap;
  return (H - reserved) / H;
}

type Box = { left: number; top: number; width: number; height: number };

// Kotak gambar (px kanvas): puncak alpha subjek tepat OVERLAP di atas dasar kata; subjek berdiri
// sampai lantai, atau subjek terpotong (setengah badan) selebar kanvas dan meluber ke bawah.
// Titik fokus di sumbu tengah.
function subjectBox(subject: SubjectInfo | undefined, cut: boolean, floor: number): Box {
  const t = subject?.box.top ?? 0.05;
  const b = subject?.box.bottom ?? 0.95;
  const top = (WORD_BOTTOM - OVERLAP) * H;
  const height = cut ? H * 0.85 : (floor * H - top) / Math.max(b - t, 0.3);
  const width = height * ASPECT;
  const x = subject?.focus.x ?? 0.5;
  return { left: W / 2 - x * width, top: top - t * height, width, height };
}

function KataTerbelahSlide({ slots, options, style }: SlideProps) {
  const image = slot(slots, "image", "image");
  const kata = slot(slots, "kata", "text").value;
  const pembuka = optionalSlot(slots, "pembuka", "text");
  const body = optionalSlot(slots, "body", "text");
  const cta = optionalSlot(slots, "cta", "text");
  const light = (options.cahaya ?? "accent") as Light;
  const cut = options.subjek === "terpotong";
  const corner = options.logo === "bottom-right";
  const floor = floorOf(body !== undefined, cta !== undefined, !corner);
  const background = options.tone === "primary" ? "primary" : "neutral-dark";
  const box = subjectBox(image.subject, cut, floor);
  const alpha = image.subject?.box ?? { left: 0.1, top: 0.05, right: 0.9, bottom: 0.95 };
  const span = (alpha.bottom - alpha.top) * box.height;
  const cyber = style?.id === "cyberpunk";
  const effect = styleEffect(style, "display");
  const word = (front: boolean) => (
    <SplitWord
      text={kata}
      ink="neutral-light"
      band={light}
      scale={2}
      front={front}
      {...(front ? {} : { slot: "kata" })}
      effect={effect}
    />
  );
  // Blok kata: dasar kata tetap di WORD_BOTTOM, pembuka mengikuti tinggi kata di atasnya.
  // Gema glitch digeser 0,06 em ke kanan bawah: kotak kata dipersempit di kanan agar gemanya tetap
  // di dalam safe margin (satu jarak tepi, P11).
  const echo = effect?.kind === "glitch" && effect.mode === "echo";
  const wordBlock = {
    position: "absolute",
    left: "var(--space-safe)",
    right: echo ? `calc(var(--space-safe) + ${space(2)})` : "var(--space-safe)",
    bottom: `${(1 - WORD_BOTTOM) * 100}%`,
  } as const;
  const pixelSide =
    options.piksel === "kiri" ? "left" : options.piksel === "kanan" ? "right" : null;
  return (
    <div
      data-qa-composition="center"
      style={{
        position: "relative",
        height: "100%",
        overflow: "hidden",
        background: color(background),
      }}
    >
      {cyber ? <ScreenTexture style={style} /> : <StyleBackdrop style={style} surface="dark" />}
      {options.halo !== "tidak" && (
        <Halo
          kind={options.halo === "cakram" ? "cakram" : "kolam"}
          light={light}
          x={W / 2}
          y={box.top + (alpha.top + 0.3 * (alpha.bottom - alpha.top)) * box.height}
          size={options.halo === "cakram" ? W * 0.78 : W * 1.15}
        />
      )}
      <div
        data-qa-element="group"
        data-qa-name="judul"
        style={{ ...wordBlock, display: "grid", gap: space(2), justifyItems: "center" }}
      >
        {pembuka && (
          <Text slot="pembuka" font="body" size={2} strong color="neutral-light" balance>
            {pembuka.value}
          </Text>
        )}
        {word(false)}
      </div>
      {pixelSide && (
        <Pixels
          side={pixelSide}
          light={light}
          left={
            pixelSide === "right"
              ? box.left + alpha.right * box.width - 0.04 * W
              : box.left + alpha.left * box.width - 0.2 * W
          }
          top={box.top + alpha.top * box.height + 0.18 * span}
          width={0.24 * W}
          height={0.42 * span}
        />
      )}
      {pixelSide && (
        // Grid piksel di sisi seberang piksel lepas, sejajar badan subjek.
        <PixelField
          side={pixelSide === "left" ? "right" : "left"}
          light={light}
          x={
            pixelSide === "left"
              ? box.left + alpha.right * box.width - 0.02 * W
              : box.left + alpha.left * box.width + 0.02 * W
          }
          top={box.top + alpha.top * box.height + 0.3 * span}
          rows={Math.max(4, Math.min(9, Math.floor((0.45 * span) / 40)))}
        />
      )}
      <div
        style={{
          position: "absolute",
          left: box.left,
          top: box.top,
          width: box.width,
          height: box.height,
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
      {cut && (
        <div
          data-qa-element="decor"
          aria-hidden="true"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: `${(floor - 0.14) * 100}%`,
            bottom: 0,
            pointerEvents: "none",
            background: `linear-gradient(to bottom, transparent, ${color(background)} 55%)`,
          }}
        />
      )}
      <div style={wordBlock}>{word(true)}</div>
      <HudRow
        labels={[
          optionalSlot(slots, "hud1", "text")?.value,
          optionalSlot(slots, "hud2", "text")?.value,
          optionalSlot(slots, "hud3", "text")?.value,
        ]}
        color="neutral-light"
        style={{ top: "var(--space-safe)" }}
      />
      {(body || cta) && (
        <div
          data-qa-element="group"
          data-qa-name="info"
          style={{
            position: "absolute",
            left: "var(--space-safe)",
            right: "var(--space-safe)",
            // Info menempel ke bawah: di atas logo tengah, atau di safe margin bila logo di pojok.
            // Lantai subjek dihitung dari tinggi info yang sama (floorOf).
            bottom: corner
              ? "var(--space-safe)"
              : `calc(var(--space-safe) + ${space(5)} + ${space(4)})`,
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr)",
            gap: space(2),
            justifyItems: "center",
            textAlign: "center",
          }}
        >
          {body && (
            <p
              data-slot="body"
              data-slot-type="text"
              style={{
                margin: 0,
                fontFamily: "var(--font-body)",
                fontWeight: "var(--font-body-weight)",
                fontSize: "var(--font-size-2)",
                fontSynthesis: "none",
                lineHeight: 1.4,
                whiteSpace: "nowrap",
                color: color("neutral-light"),
              }}
            >
              {body.value}
            </p>
          )}
          {cta && (
            <span
              data-slot="cta"
              data-slot-type="text"
              style={{
                fontFamily: "var(--font-body)",
                fontWeight: "var(--font-body-weight-strong)",
                fontSize: "var(--font-size-2)",
                fontSynthesis: "none",
                lineHeight: 1.2,
                padding: `0.12em ${space(2)}`,
                borderRadius: "var(--shape-radius)",
                background: color(light),
                color: color(inkOn(light)),
              }}
            >
              {cta.value}
            </span>
          )}
        </div>
      )}
      <div
        style={{
          position: "absolute",
          bottom: "var(--space-safe)",
          ...(corner ? { right: "var(--space-safe)" } : { left: 0, right: 0 }),
          display: "flex",
          justifyContent: "center",
        }}
      >
        <Logo slot="logo" src={slot(slots, "logo", "logo").src} height={5} />
      </div>
      {!cyber && <StyleOverlay style={style} surface="dark" />}
    </div>
  );
}

export const kataTerbelah: Template = {
  meta: {
    id: "feed-kata-terbelah",
    name: "Kata terbelah",
    format: "feed-4x5",
    description:
      "Pernyataan heroik satu kata: kata raksasa selebar konten di sepertiga atas, subjek cut-out besar berdiri di depannya menutup bagian bawah huruf, satu potongan kata berpita warna cahaya di depan subjek. Pembuka di atas kata, label HUD tiga kolom di atas, satu kalimat dan CTA di bawah subjek. Gaya Cyberpunk; untuk pernyataan berani, peluncuran, atau ajakan yang bisa dirangkum satu kata.",
    slots: [
      {
        name: "image",
        type: "image",
        required: true,
        description:
          "Subjek cut-out dramatis berlatar transparan (objek simbolis atau orang dengan cahaya tepi)",
        aspectRatio: "4:5",
        cutout: true,
      },
      {
        name: "kata",
        type: "text",
        required: true,
        description:
          "Satu kata pernyataan dari copy, kapital; potongan yang diberi pita warna cahaya ditandai kurung siku (satu pasang), mis. DI[UNDUH]",
        maxChars: 11,
      },
      {
        name: "pembuka",
        type: "text",
        required: false,
        description: "Frasa pendek sebelum kata, dibaca menyambung dengan kata",
        maxChars: 28,
      },
      {
        name: "body",
        type: "text",
        required: false,
        description: "Satu kalimat fakta pendukung, tampil satu baris",
        maxChars: 44,
      },
      { name: "cta", type: "text", required: false, description: "Ajakan singkat", maxChars: 22 },
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
        description: "Label HUD tengah atas: edisi, jadwal, atau program",
        maxChars: 16,
      },
      {
        name: "hud3",
        type: "text",
        required: false,
        description: "Label HUD kanan atas: jam, tanggal, atau handle",
        maxChars: 16,
      },
      { name: "logo", type: "logo", required: true, description: "Logo varian onDark" },
    ],
    options: [
      {
        name: "tone",
        values: ["dark", "primary"],
        default: "dark",
        description: "Panggung: netral gelap, atau primary bila primary brand gelap",
      },
      {
        name: "cahaya",
        values: ["accent", "primary", "secondary"],
        default: "accent",
        description:
          "Warna cahaya untuk pita, kolam atau cincin, piksel, dan CTA: token jenuh brand",
      },
      {
        name: "halo",
        values: ["kolam", "cakram", "tidak"],
        default: "kolam",
        description:
          "Cahaya di belakang subjek: kolam lunak, atau cakram padat untuk brand tanpa gradient",
      },
      {
        name: "subjek",
        values: ["berdiri", "terpotong"],
        default: "berdiri",
        description:
          "Berdiri utuh di lantai (objek, orang seluruh badan), atau terpotong setengah badan dan memudar ke bawah (perlu brand yang mengizinkan gradient)",
      },
      {
        name: "piksel",
        values: ["tidak", "kiri", "kanan"],
        default: "kanan",
        description: "Pecahan piksel di satu sisi subjek; tidak untuk brand dengan batas elemen",
      },
      {
        name: "logo",
        values: ["bottom-center", "bottom-right"],
        default: "bottom-center",
        description: "Letak logo, mengikuti aturan brand",
      },
    ],
  },
  Slide: KataTerbelahSlide,
};
