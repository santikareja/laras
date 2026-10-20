import type { SubjectInfo } from "@laras/shared";
import { Logo, Photo, Text } from "../primitives/index.ts";
import { color, space } from "../primitives/vars.ts";
import { CANVAS } from "../src/geometry.ts";
import { optionalSlot, type SlideProps, slot, type Template } from "../src/template.ts";
import {
  CtaBand,
  Halo,
  HudRow,
  hudText,
  type Light,
  lightMode,
  ScreenTexture,
  SplitWord,
  STAGE,
  Stage,
} from "../styles/cyberpunk/parts.tsx";
import { StyleBackdrop, StyleOverlay, styleEffect, styleTreatment } from "../styles/layer.tsx";

// Arketipe khas Cyberpunk "Panggung neon" (T-134, styles/cyberpunk/PANDUAN.md 9.2; rujukan
// DOMINA/trofi): objek atau orang dipajang seperti trofi di bawah sorot lampu. Pembuka dan kata
// utama bercahaya di atas menjadi sumber lampu: dari dasar kata turun kerucut cahaya ke genangan
// cahaya di lantai, dengan rel neon di tepi panggung. Puncak subjek menyentuh dasar kata (subjek di
// depan huruf); subjek setengah badan berdiri di balik meja bercahaya. Di bawah podium plakat data
// (kunci dan nilai, mis. harga) seperti label pameran, CTA berpita, dan logo. Label HUD tiga kolom
// di atas, sama dengan pola Cyberpunk lain. Komposisi simetris di sumbu tengah.

const { width: W, height: H } = CANVAS;
const WORD_BOTTOM = 0.3;
// Puncak subjek sedikit menimpa dasar kata (px); subjek setengah badan turun di balik meja (px).
const TOUCH = 28;
const BEHIND = 72;
// Kerucut cahaya: lebar puncak (di dasar kata) dan dasar (di lantai), pecahan lebar kanvas.
const CONE = { top: 0.3, bottom: 0.66 } as const;
const ASPECT = 4 / 5;
// Tinggi blok bawah (px): safe margin terbesar fixture, logo, CTA, plakat, dan jarak.
const BOTTOM = { safe: 80, logo: 48, gap: 32, cta: 60, plakat: 84, stack: 24 } as const;

function floorOf(plakat: boolean, cta: boolean, logoBelow: boolean, desk: boolean): number {
  const reserved =
    BOTTOM.safe +
    (logoBelow ? BOTTOM.logo + BOTTOM.gap : 0) +
    (cta ? BOTTOM.cta : 0) +
    (plakat && cta ? BOTTOM.stack : 0) +
    (plakat ? BOTTOM.plakat : 0) +
    BOTTOM.gap +
    (desk ? STAGE.desk : STAGE.pool / 2 + STAGE.rail + 4);
  return H - reserved;
}

type Box = { left: number; top: number; width: number; height: number };

// Kotak gambar (px kanvas): dasar alpha subjek di lantai (subjek terpotong: di balik podium),
// puncaknya menyentuh dasar kata, titik fokus di sumbu tengah.
function subjectBox(subject: SubjectInfo | undefined, floor: number, cut: boolean): Box {
  const t = subject?.box.top ?? 0.05;
  const b = subject?.box.bottom ?? 0.95;
  const top = WORD_BOTTOM * H - TOUCH;
  const height = (floor + (cut ? BEHIND : 0) - top) / Math.max(b - t, 0.3);
  const width = height * ASPECT;
  const x = subject?.focus.x ?? 0.5;
  return { left: W / 2 - x * width, top: top - t * height, width, height };
}

const PAIRS = [1, 2, 3] as const;

function PanggungNeonSlide({ slots, options, style }: SlideProps) {
  const image = slot(slots, "image", "image");
  const pembuka = optionalSlot(slots, "pembuka", "text");
  const cta = optionalSlot(slots, "cta", "text");
  const cells = PAIRS.flatMap((n) => {
    const value = optionalSlot(slots, `nilai${n}`, "text");
    const key = optionalSlot(slots, `kunci${n}`, "text");
    return value ? [{ n, key: key?.value, value: value.value }] : [];
  });
  const light = (options.cahaya ?? "accent") as Light;
  // Primary brand sering gelap atau jenuh tua (kontras rendah di latar gelap): kunci jadi terang.
  const keyInk = light === "primary" ? "neutral-light" : light;
  const corner = options.logo === "bottom-right";
  const desk = options.panggung === "meja";
  const floor = floorOf(cells.length > 0, cta !== undefined, !corner, desk);
  const box = subjectBox(image.subject, floor, desk);
  const background = options.tone === "primary" ? "primary" : "neutral-dark";
  const cyber = style?.id === "cyberpunk";
  const mode = lightMode(style);
  const halo = options.halo ?? "kolam";
  const coneTop = WORD_BOTTOM * H - 24;
  const wordBlock = {
    position: "absolute",
    left: "var(--space-safe)",
    right: "var(--space-safe)",
    bottom: `${(1 - WORD_BOTTOM) * 100}%`,
  } as const;
  const stage = (
    <Stage
      kind={desk ? "meja" : "lantai"}
      fill={halo === "cakram" ? "cakram" : halo === "kolam" ? "kolam" : "tidak"}
      light={light}
      mode={mode}
      floor={floor}
      width={CONE.bottom * W}
    />
  );
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
      {halo === "kolam" && (
        <Halo kind="kolam" light={light} x={W / 2} y={(coneTop + floor) / 2} size={W * 1.05} />
      )}
      {halo !== "tidak" && (
        // Kerucut sorot: lunak (gradasi token cahaya) atau padat primary untuk brand tanpa gradient.
        <div
          data-qa-element="decor"
          aria-hidden="true"
          style={{
            position: "absolute",
            left: 0,
            top: coneTop,
            width: W,
            height: floor - coneTop,
            pointerEvents: "none",
            clipPath: `polygon(${50 - CONE.top * 50}% 0, ${50 + CONE.top * 50}% 0, ${50 + CONE.bottom * 50}% 100%, ${50 - CONE.bottom * 50}% 100%)`,
            background:
              halo === "cakram"
                ? color("primary")
                : `linear-gradient(to bottom, color-mix(in srgb, ${color(light)} 34%, transparent), color-mix(in srgb, ${color(light)} 8%, transparent))`,
          }}
        />
      )}
      {!desk && stage}
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
        <div style={{ width: "76%" }}>
          <SplitWord
            text={slot(slots, "kata", "text").value}
            ink="neutral-light"
            band={light}
            scale={1.5}
            slot="kata"
            effect={styleEffect(style, "headline")}
          />
        </div>
      </div>
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
      {desk && stage}
      <HudRow
        labels={[
          optionalSlot(slots, "hud1", "text")?.value,
          optionalSlot(slots, "hud2", "text")?.value,
          optionalSlot(slots, "hud3", "text")?.value,
        ]}
        color="neutral-light"
        style={{ top: "var(--space-safe)" }}
      />
      {(cells.length > 0 || cta) && (
        <div
          data-qa-element="group"
          data-qa-name="plakat"
          style={{
            position: "absolute",
            left: "var(--space-safe)",
            right: "var(--space-safe)",
            bottom: corner
              ? "var(--space-safe)"
              : `calc(var(--space-safe) + ${space(5)} + ${space(4)})`,
            display: "grid",
            gridTemplateColumns: "minmax(0, 1fr)",
            gap: space(3),
            justifyItems: "center",
            textAlign: "center",
          }}
        >
          {cells.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: `repeat(${cells.length}, minmax(0, 1fr))`,
                width: "100%",
              }}
            >
              {cells.map((cell, i) => (
                <div
                  key={cell.n}
                  style={{
                    display: "grid",
                    gap: space(2),
                    justifyItems: "center",
                    padding: `0 ${space(2)}`,
                    borderLeft:
                      i > 0
                        ? `var(--shape-stroke) solid color-mix(in srgb, ${color("neutral-light")} 40%, transparent)`
                        : undefined,
                  }}
                >
                  {cell.key && (
                    <span
                      data-slot={`kunci${cell.n}`}
                      data-slot-type="text"
                      style={hudText(keyInk)}
                    >
                      {cell.key}
                    </span>
                  )}
                  <span
                    data-slot={`nilai${cell.n}`}
                    data-slot-type="text"
                    style={{
                      fontFamily: "var(--font-body)",
                      fontWeight: "var(--font-body-weight-strong)",
                      fontSize: "var(--font-size-2)",
                      fontSynthesis: "none",
                      lineHeight: 1.2,
                      whiteSpace: "nowrap",
                      color: color("neutral-light"),
                    }}
                  >
                    {cell.value}
                  </span>
                </div>
              ))}
            </div>
          )}
          {cta && <CtaBand text={cta.value} light={light} />}
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

const pair = (n: 1 | 2 | 3) => [
  {
    name: `kunci${n}`,
    type: "text" as const,
    required: false,
    description: `Kunci data ${n} plakat (mis. HARGA, BIJI, JADWAL)`,
    maxChars: 12,
  },
  {
    name: `nilai${n}`,
    type: "text" as const,
    required: false,
    description: `Nilai data ${n} plakat dari copy (mis. Rp85.000)`,
    maxChars: 16,
  },
];

export const panggungNeon: Template = {
  meta: {
    id: "feed-panggung-neon",
    name: "Panggung neon",
    format: "feed-4x5",
    description:
      "Produk atau orang dipajang seperti trofi: pembuka dan kata utama bercahaya di atas, kerucut sorot dari kata ke genangan cahaya di lantai dan rel neon, subjek cut-out berdiri di lantai (atau setengah badan di balik meja bercahaya) dengan puncak menyentuh kata, plakat data (kunci dan nilai, mis. harga) seperti label pameran, CTA berpita, label HUD tiga kolom. Gaya Cyberpunk; untuk promo produk, harga, peluncuran, atau acara.",
    slots: [
      {
        name: "image",
        type: "image",
        required: true,
        description:
          "Subjek cut-out berlatar transparan: objek atau orang utuh yang berdiri, atau orang setengah badan (panggung meja)",
        aspectRatio: "4:5",
        cutout: true,
        composition: {
          base: "Subject displayed like a trophy under a top spotlight: a whole standing object or person, or a person from the waist up behind a glowing table; centered and facing the camera.",
        },
      },
      {
        name: "kata",
        type: "text",
        required: true,
        description: "Kata utama dari copy (satu kata, angka, atau dua kata pendek)",
        maxChars: 9,
      },
      {
        name: "pembuka",
        type: "text",
        required: false,
        description: "Frasa pendek sebelum kata utama, dibaca menyambung",
        maxChars: 28,
      },
      ...pair(1),
      ...pair(2),
      ...pair(3),
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
        description: "Warna cahaya untuk sorot, rel, kunci plakat, dan CTA: token jenuh brand",
      },
      {
        name: "halo",
        values: ["kolam", "cakram", "tidak"],
        default: "kolam",
        description:
          "Sorot cahaya: kerucut lunak bergradasi, kerucut primary padat untuk brand tanpa gradient, atau tanpa",
      },
      {
        name: "panggung",
        values: ["lantai", "meja"],
        default: "lantai",
        description:
          "Lantai: subjek utuh (objek, orang seluruh badan) berdiri di genangan cahaya; meja: subjek setengah badan di balik meja bercahaya",
      },
      {
        name: "logo",
        values: ["bottom-center", "bottom-right"],
        default: "bottom-center",
        description: "Letak logo, mengikuti aturan brand",
      },
    ],
  },
  Slide: PanggungNeonSlide,
};
