import { Badge, Grid, Logo, Text } from "../primitives/index.ts";
import { space } from "../primitives/vars.ts";
import { optionalSlot, type SlideProps, slot, type Template } from "../src/template.ts";

// Template B: latar warna brand dengan angka atau kata sorotan besar, tanpa foto.
// Sorotan di atas primary memakai secondary, bukan accent: kontras accent di atas primary
// tidak dijamin (Ritme Run Club 1.8:1).

function SorotanSlide({ slots, options }: SlideProps) {
  const dark = options.tone !== "light";
  const ink = dark ? "neutral-light" : "neutral-dark";
  const emphasis = dark ? "secondary" : "primary";
  const badge = optionalSlot(slots, "badge", "badge");
  const body = optionalSlot(slots, "body", "text");
  const cta = optionalSlot(slots, "cta", "text");
  return (
    <Grid
      rows="auto minmax(0, 1fr) auto"
      gap={6}
      inset
      background={dark ? "primary" : "neutral-light"}
    >
      <div style={{ gridColumn: "1 / -1" }}>
        {badge && (
          <Badge slot="badge" background="accent" color="neutral-dark">
            {badge.value}
          </Badge>
        )}
      </div>
      <div style={{ gridColumn: "1 / -1", alignSelf: "end", display: "grid", gap: space(4) }}>
        <Text slot="highlight" as="p" font="heading" size={6} color={emphasis}>
          {slot(slots, "highlight", "text").value}
        </Text>
        <Text slot="headline" as="h1" font="heading" size={4} color={ink}>
          {slot(slots, "headline", "text").value}
        </Text>
        {body && (
          <Text slot="body" font="body" size={2} color={ink}>
            {body.value}
          </Text>
        )}
      </div>
      <div style={{ gridColumn: "1 / 9", alignSelf: "end" }}>
        {cta && (
          <Text slot="cta" font="body" size={2} color={emphasis} strong>
            {cta.value}
          </Text>
        )}
      </div>
      <div style={{ gridColumn: "9 / -1", alignSelf: "end", justifySelf: "end" }}>
        <Logo slot="logo" src={slot(slots, "logo", "logo").src} height={6} />
      </div>
    </Grid>
  );
}

export const sorotan: Template = {
  meta: {
    id: "feed-sorotan",
    name: "Sorotan",
    format: "feed-4x5",
    description:
      "Angka atau kata sangat pendek ditampilkan besar di atas warna brand, tanpa foto. Untuk promo, jadwal, jarak, jumlah, atau pengumuman singkat.",
    slots: [
      {
        name: "badge",
        type: "badge",
        required: false,
        description: "Label pendek di pojok atas, mis. hari atau kategori",
        maxChars: 20,
      },
      {
        name: "highlight",
        type: "text",
        required: true,
        description: "Angka atau kata yang ditonjolkan, diambil dari copy, mis. 07.00, 5K, Gratis",
        maxChars: 8,
      },
      {
        name: "headline",
        type: "text",
        required: true,
        description: "Judul dari copy yang menjelaskan sorotan, maksimal dua baris",
        maxChars: 40,
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
        description: "Logo; pakai varian onDark bila tone dark",
      },
    ],
    options: [
      {
        name: "tone",
        values: ["dark", "light"],
        default: "dark",
        description: "Latar warna primary (dark) atau netral terang (light)",
      },
    ],
  },
  Slide: SorotanSlide,
};
