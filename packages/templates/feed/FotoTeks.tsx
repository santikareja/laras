import { Badge, Grid, Image, Logo, Text } from "../primitives/index.ts";
import { color, space } from "../primitives/vars.ts";
import { optionalSlot, type SlideProps, slot, type Template } from "../src/template.ts";

// Template A: foto full-bleed 3:2 di atas, teks di bawah dalam safe margin brand.

function FotoTeksSlide({ slots, options }: SlideProps) {
  const badge = optionalSlot(slots, "badge", "badge");
  const body = optionalSlot(slots, "body", "text");
  const cta = optionalSlot(slots, "cta", "text");
  return (
    <div
      style={{
        display: "grid",
        gridTemplateRows: "auto minmax(0, 1fr)",
        height: "100%",
        background: color(options.tone === "secondary" ? "secondary" : "neutral-light"),
      }}
    >
      <div style={{ aspectRatio: "3 / 2" }}>
        <Image slot="image" src={slot(slots, "image", "image").src} />
      </div>
      <Grid rows="auto minmax(0, 1fr)" gap={5} inset>
        <div
          style={{ gridColumn: "1 / -1", display: "grid", gap: space(3), justifyItems: "start" }}
        >
          {badge && (
            <Badge slot="badge" background="accent" color="neutral-dark">
              {badge.value}
            </Badge>
          )}
          <Text slot="headline" as="h1" font="heading" size={4} color="primary">
            {slot(slots, "headline", "text").value}
          </Text>
          {body && (
            <Text slot="body" font="body" size={2} color="neutral-dark">
              {body.value}
            </Text>
          )}
        </div>
        <div style={{ gridColumn: "1 / 9", alignSelf: "end" }}>
          {cta && (
            <Text slot="cta" font="body" size={2} color="primary" strong>
              {cta.value}
            </Text>
          )}
        </div>
        <div style={{ gridColumn: "9 / -1", alignSelf: "end", justifySelf: "end" }}>
          <Logo slot="logo" src={slot(slots, "logo", "logo").src} height={6} />
        </div>
      </Grid>
    </div>
  );
}

export const fotoTeks: Template = {
  meta: {
    id: "feed-foto-teks",
    name: "Foto dan teks",
    format: "feed-4x5",
    description:
      "Foto lebar di atas, judul dan teks pendek di bawah. Untuk produk, menu, layanan, atau pengumuman yang punya satu foto kuat.",
    slots: [
      {
        name: "image",
        type: "image",
        required: true,
        description: "Foto utama tanpa teks; subjek di tengah karena tepi atas dan bawah terpotong",
        aspectRatio: "3:2",
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
      { name: "logo", type: "logo", required: true, description: "Logo di atas latar terang" },
    ],
    options: [
      {
        name: "tone",
        values: ["light", "secondary"],
        default: "light",
        description: "Latar area teks: netral terang atau warna sekunder brand",
      },
    ],
  },
  Slide: FotoTeksSlide,
};
