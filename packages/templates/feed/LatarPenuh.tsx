import type { TextZone } from "@laras/shared";
import { Logo, Photo, Rule, Text } from "../primitives/index.ts";
import { type ColorToken, space } from "../primitives/vars.ts";
import { optionalSlot, type SlideProps, slot, type Template } from "../src/template.ts";

// Arketipe eksperimen Latar penuh (spike T-140, di luar katalog Claude): karya visual penuh dari
// model gambar sebagai lapisan bawah, teks HTML di zona tenang yang dipilih sistem dari piksel
// gambar, dan subjek cut-out yang diambil dari gambar yang sama sebagai lapisan atas. Subjek hanya
// ditampilkan di dalam zona teks, sehingga headline tampak di belakang subjek (PRD 4 K3) tanpa
// risiko kontur ganda di bagian gambar lainnya. CTA berupa baris teks bergaris, bukan tombol.

// Kotak zona dalam pecahan kanvas, di dalam safe margin (64 px dari 1080 × 1350).
export const TEXT_ZONES: Record<
  TextZone,
  { left: number; top: number; right: number; bottom: number; align: "left" | "center" | "right" }
> = {
  "atas-kiri": { left: 0.06, top: 0.048, right: 0.62, bottom: 0.36, align: "left" },
  "atas-tengah": { left: 0.12, top: 0.048, right: 0.88, bottom: 0.36, align: "center" },
  "atas-kanan": { left: 0.38, top: 0.048, right: 0.94, bottom: 0.36, align: "right" },
  "bawah-kiri": { left: 0.06, top: 0.64, right: 0.62, bottom: 0.952, align: "left" },
  "bawah-tengah": { left: 0.12, top: 0.64, right: 0.88, bottom: 0.952, align: "center" },
  "bawah-kanan": { left: 0.38, top: 0.64, right: 0.94, bottom: 0.952, align: "right" },
};

const ZONES = Object.keys(TEXT_ZONES) as TextZone[];
const INK: Record<string, ColorToken> = { terang: "neutral-light", gelap: "neutral-dark" };
const pct = (value: number) => `${(value * 100).toFixed(1)}%`;
const SAFE = "var(--space-safe)";
const JUSTIFY = { left: "start", center: "center", right: "end" } as const;

function LatarPenuhSlide({ slots, options }: SlideProps) {
  const zone = TEXT_ZONES[(options.zona ?? "atas-kiri") as TextZone] ?? TEXT_ZONES["atas-kiri"];
  const ink = INK[options.nada ?? "terang"] ?? "neutral-light";
  const top = zone.top < 0.5;
  const logoAt = options.logo ?? (top ? "bottom-right" : "top-right");
  // Logo di sudut yang sama dengan zona teks masuk ke kelompok teks agar tidak bertabrakan.
  const logoSide = logoAt.endsWith("left") ? "left" : "right";
  const logoInZone =
    logoAt.startsWith("top") === top && zone.align !== (logoSide === "left" ? "right" : "left");
  const subject = optionalSlot(slots, "subjek", "image");
  const body = optionalSlot(slots, "body", "text");
  const cta = optionalSlot(slots, "cta", "text");
  const logo = <Logo slot="logo" src={slot(slots, "logo", "logo").src} height={5} />;
  // Tepi luar zona memakai safe margin brand (64 px bawaan, lebih besar untuk brand tertentu).
  const edge = (value: number) => (value < 0.07 ? SAFE : pct(value));
  const place = {
    left: edge(zone.left),
    right: edge(1 - zone.right),
    ...(top ? { top: edge(zone.top) } : { bottom: edge(1 - zone.bottom) }),
  };
  return (
    <div style={{ position: "relative", height: "100%", overflow: "hidden" }}>
      <div
        data-qa-element="background"
        data-qa-name="latar"
        style={{ position: "absolute", inset: 0 }}
      >
        <Photo slot="latar" src={slot(slots, "latar", "image").src} />
      </div>
      <div
        data-qa-element="group"
        data-qa-name="teks"
        style={{
          position: "absolute",
          ...place,
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr)",
          gap: space(3),
          justifyItems: JUSTIFY[zone.align],
          textAlign: zone.align,
        }}
      >
        {logoInZone && top && logo}
        <Text slot="headline" as="h1" font="heading" size={6} color={ink} strong balance>
          {slot(slots, "headline", "text").value}
        </Text>
        {body && (
          <Text slot="body" font="body" size={2} color={ink} measure={40} balance>
            {body.value}
          </Text>
        )}
        {cta && (
          <div style={{ display: "grid", gap: space(2), justifyItems: JUSTIFY[zone.align] }}>
            <Rule color={ink} length={72} weight={3} />
            <Text slot="cta" font="body" size={2} color={ink} strong>
              {cta.value}
            </Text>
          </div>
        )}
        {logoInZone && !top && logo}
      </div>
      {subject && (
        <div
          data-qa-name="subjek"
          style={{
            position: "absolute",
            inset: 0,
            clipPath: `inset(${pct(zone.top)} ${pct(1 - zone.right)} ${pct(1 - zone.bottom)} ${pct(zone.left)})`,
          }}
        >
          <Photo slot="subjek" src={subject.src} />
        </div>
      )}
      {!logoInZone && (
        <div
          style={{
            position: "absolute",
            [logoAt.startsWith("top") ? "top" : "bottom"]: "var(--space-safe)",
            [logoSide]: "var(--space-safe)",
          }}
        >
          {logo}
        </div>
      )}
    </div>
  );
}

export const latarPenuh: Template = {
  meta: {
    id: "feed-latar-penuh",
    name: "Latar penuh",
    format: "feed-4x5",
    description:
      "Eksperimen T-140: karya visual penuh dari model gambar, headline dan CTA HTML di zona tenang yang dipilih dari piksel, subjek cut-out dari gambar yang sama menimpa headline.",
    slots: [
      {
        name: "latar",
        type: "image",
        required: true,
        description: "Karya visual penuh tanpa teks dengan zona tenang untuk teks",
        aspectRatio: "4:5",
      },
      {
        name: "subjek",
        type: "image",
        required: false,
        description: "Subjek utama yang diambil dari latar, berposisi sama persis",
        aspectRatio: "4:5",
        cutout: true,
      },
      { name: "headline", type: "text", required: true, description: "Headline", maxChars: 48 },
      { name: "body", type: "text", required: false, description: "Satu kalimat", maxChars: 90 },
      { name: "cta", type: "text", required: false, description: "CTA pendek", maxChars: 40 },
      { name: "logo", type: "logo", required: true, description: "Logo brand" },
    ],
    options: [
      {
        name: "zona",
        values: ZONES,
        default: "atas-kiri",
        description: "Zona teks, dipilih sistem dari piksel gambar",
      },
      {
        name: "nada",
        values: ["terang", "gelap"],
        default: "terang",
        description: "Warna teks terang untuk latar gelap, gelap untuk latar terang",
      },
      {
        name: "logo",
        values: ["top-left", "top-right", "bottom-left", "bottom-right"],
        default: "bottom-right",
        description: "Sudut logo, mengikuti aturan brand",
      },
    ],
  },
  Slide: LatarPenuhSlide,
};
