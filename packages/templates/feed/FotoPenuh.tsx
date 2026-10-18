import { Badge, Image, Logo, Text } from "../primitives/index.ts";
import { color, space } from "../primitives/vars.ts";
import { optionalSlot, type SlideProps, slot, type Template } from "../src/template.ts";

// Template C: foto 4:5 menutup kanvas; teks di panel solid agar kontras tidak bergantung
// pada isi foto dan tanpa gradient (aturan sebagian brand).

function FotoPenuhSlide({ slots, options }: SlideProps) {
  const dark = options.tone === "dark";
  const ink = dark ? "neutral-light" : "neutral-dark";
  const emphasis = dark ? "secondary" : "primary";
  const badge = optionalSlot(slots, "badge", "badge");
  const body = optionalSlot(slots, "body", "text");
  const cta = optionalSlot(slots, "cta", "text");
  return (
    <div style={{ position: "relative", height: "100%" }}>
      <div style={{ position: "absolute", inset: 0 }}>
        <Image slot="image" src={slot(slots, "image", "image").src} />
      </div>
      <div
        style={{
          position: "relative",
          boxSizing: "border-box",
          height: "100%",
          padding: "var(--space-safe)",
          display: "flex",
          flexDirection: "column",
          justifyContent: options.position === "top" ? "flex-start" : "flex-end",
        }}
      >
        <div
          style={{
            display: "grid",
            gap: space(3),
            justifyItems: "start",
            padding: space(6),
            background: color(dark ? "primary" : "neutral-light"),
            borderRadius: "var(--shape-radius)",
            boxShadow: "var(--shape-shadow)",
          }}
        >
          {badge && (
            <Badge slot="badge" background="accent" color="neutral-dark">
              {badge.value}
            </Badge>
          )}
          <Text slot="headline" as="h1" font="heading" size={4} color={emphasis}>
            {slot(slots, "headline", "text").value}
          </Text>
          {body && (
            <Text slot="body" font="body" size={2} color={ink}>
              {body.value}
            </Text>
          )}
          <div
            style={{
              justifySelf: "stretch",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-between",
              gap: space(4),
              marginTop: space(2),
            }}
          >
            <div>
              {cta && (
                <Text slot="cta" font="body" size={2} color={emphasis} strong>
                  {cta.value}
                </Text>
              )}
            </div>
            <Logo slot="logo" src={slot(slots, "logo", "logo").src} height={6} />
          </div>
        </div>
      </div>
    </div>
  );
}

export const fotoPenuh: Template = {
  meta: {
    id: "feed-foto-penuh",
    name: "Foto penuh",
    format: "feed-4x5",
    description:
      "Foto menutup seluruh postingan, teks di panel berwarna di atas atau bawah. Untuk suasana, produk, atau momen yang fotonya menjadi pesan utama.",
    slots: [
      {
        name: "image",
        type: "image",
        required: true,
        description:
          "Foto utama tanpa teks yang memenuhi bingkai; sisakan area tenang di sisi panel (bawah atau atas sesuai opsi position)",
        aspectRatio: "4:5",
      },
      {
        name: "badge",
        type: "badge",
        required: false,
        description: "Label pendek di atas judul, mis. kategori atau status",
        maxChars: 20,
      },
      {
        name: "headline",
        type: "text",
        required: true,
        description: "Judul dari copy, maksimal dua baris",
        maxChars: 45,
      },
      {
        name: "body",
        type: "text",
        required: false,
        description: "Satu atau dua kalimat penjelas dari copy",
        maxChars: 90,
      },
      { name: "cta", type: "text", required: false, description: "Ajakan dari copy", maxChars: 28 },
      {
        name: "logo",
        type: "logo",
        required: true,
        description: "Logo di dalam panel; pakai varian onDark bila tone dark",
      },
    ],
    options: [
      {
        name: "tone",
        values: ["light", "dark"],
        default: "light",
        description: "Warna panel teks: netral terang (light) atau primary (dark)",
      },
      {
        name: "position",
        values: ["bottom", "top"],
        default: "bottom",
        description: "Letak panel teks; pilih sisi foto yang tidak menutupi subjek",
      },
    ],
  },
  Slide: FotoPenuhSlide,
};
