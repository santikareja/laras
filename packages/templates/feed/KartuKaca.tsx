import { Badge, Button, GlassPanel, Logo, Photo, Text } from "../primitives/index.ts";
import { space } from "../primitives/vars.ts";
import { optionalSlot, type SlideProps, slot, type Template } from "../src/template.ts";
import { StyleBackdrop, StyleOverlay, styleTreatment } from "../styles/layer.tsx";

// Arketipe Kartu kaca (T-132; panduan Glassmorphism pola 1, ADR-015): foto suasana penuh, panel
// kaca buram selebar 10 kolom di sepertiga bawah (atau tengah) berisi chip, headline, angka atau
// harga, satu baris keterangan, dan tombol pil. Empat elemen: foto, panel, tombol, logo. Panel kaca
// bersaudara langsung dengan lapisan foto agar backdrop-filter bekerja (Glassmorphism 7).

const EDGE = "calc(1080px / 12)";

function KartuKacaSlide({ slots, options, style }: SlideProps) {
  const dark = options.kaca === "dark";
  const ink = dark ? "neutral-light" : "neutral-dark";
  const chip = optionalSlot(slots, "chip", "text");
  const angka = optionalSlot(slots, "angka", "text");
  const body = optionalSlot(slots, "body", "text");
  const cta = optionalSlot(slots, "cta", "text");
  const logoBottom = options.logo === "bottom-right";
  return (
    <div style={{ position: "relative", height: "100%", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0 }}>
        <Photo
          slot="image"
          src={slot(slots, "image", "image").src}
          treatment={styleTreatment(style)}
        />
      </div>
      <StyleBackdrop style={style} />
      <div
        style={{
          position: "absolute",
          left: EDGE,
          right: EDGE,
          ...(options.posisi === "tengah"
            ? { top: "50%", transform: "translateY(-50%)" }
            : { bottom: logoBottom ? "calc(var(--space-safe) + 96px)" : "var(--space-safe)" }),
        }}
      >
        <GlassPanel tone={dark ? "dark" : "light"} padding={6}>
          <div style={{ display: "grid", gap: space(3), justifyItems: "start" }}>
            {chip && (
              <Badge slot="chip" background="primary" color="neutral-light">
                {chip.value}
              </Badge>
            )}
            <Text slot="headline" as="h1" font="heading" size={4} color={ink}>
              {slot(slots, "headline", "text").value}
            </Text>
            {angka && (
              <Text slot="angka" font="heading" size={5} color={ink} strong>
                {angka.value}
              </Text>
            )}
            {body && (
              <Text slot="body" font="body" size={2} color={ink} measure={40} balance>
                {body.value}
              </Text>
            )}
            {cta && (
              <div style={{ marginTop: space(3) }}>
                <Button slot="cta" shape="pill" iconStroke="brand">
                  {cta.value}
                </Button>
              </div>
            )}
          </div>
        </GlassPanel>
      </div>
      <div
        style={{
          position: "absolute",
          ...(logoBottom
            ? { right: "var(--space-safe)", bottom: "var(--space-safe)" }
            : { left: "var(--space-safe)", top: "var(--space-safe)" }),
        }}
      >
        <Logo slot="logo" src={slot(slots, "logo", "logo").src} height={5} />
      </div>
      <StyleOverlay
        style={style}
        label={optionalSlot(slots, "label", "text")?.value}
        corner={logoBottom ? "top-left" : "top-right"}
        surface="photo"
      />
    </div>
  );
}

export const kartuKaca: Template = {
  meta: {
    id: "feed-kartu-kaca",
    name: "Kartu kaca",
    format: "feed-4x5",
    description:
      "Foto suasana penuh dengan panel kaca buram di sepertiga bawah berisi chip, headline, angka atau harga, satu baris keterangan, dan tombol pil. Untuk promo, acara, atau kutipan di atas foto yang kuat.",
    slots: [
      {
        name: "image",
        type: "image",
        required: true,
        description: "Foto suasana atau produk dalam konteks, bagian bawah cukup tenang",
        aspectRatio: "4:5",
      },
      {
        name: "chip",
        type: "text",
        required: false,
        description: "Kategori pendek di chip",
        maxChars: 20,
      },
      {
        name: "headline",
        type: "text",
        required: true,
        description: "Headline dari copy",
        maxChars: 44,
      },
      {
        name: "angka",
        type: "text",
        required: false,
        description: "Harga, tanggal, atau angka utama dari knowledge",
        maxChars: 16,
      },
      {
        name: "body",
        type: "text",
        required: false,
        description: "Satu baris keterangan",
        maxChars: 60,
      },
      { name: "cta", type: "text", required: false, description: "Ajakan 2–3 kata", maxChars: 20 },
      {
        name: "label",
        type: "text",
        required: false,
        description:
          "Label kecil dari copy (tanggal, lokasi, edisi) untuk gaya yang memakainya; tanpa gaya tidak tampil",
        maxChars: 24,
      },
      { name: "logo", type: "logo", required: true, description: "Logo; onDark bila foto gelap" },
    ],
    options: [
      {
        name: "kaca",
        values: ["light", "dark"],
        default: "light",
        description: "Kaca terang dengan teks gelap, atau kaca gelap dengan teks terang",
      },
      {
        name: "posisi",
        values: ["bawah", "tengah"],
        default: "bawah",
        description: "Letak panel kaca",
      },
      {
        name: "logo",
        values: ["top-left", "bottom-right"],
        default: "top-left",
        description: "Letak logo, mengikuti aturan brand",
      },
    ],
  },
  Slide: KartuKacaSlide,
};
