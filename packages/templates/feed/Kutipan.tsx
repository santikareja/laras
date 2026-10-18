import { Badge, Grid, Logo, Text } from "../primitives/index.ts";
import { space } from "../primitives/vars.ts";
import { optionalSlot, type SlideProps, slot, type Template } from "../src/template.ts";

// Template D: kutipan atau pernyataan sebagai elemen dominan. Tanda kutip besar dekoratif
// memakai primary atau secondary, tidak pernah accent (kontras accent tidak dijamin).

function KutipanSlide({ slots, options }: SlideProps) {
  const dark = options.tone === "dark";
  const ink = dark ? "neutral-light" : "neutral-dark";
  const badge = optionalSlot(slots, "badge", "badge");
  const attribution = optionalSlot(slots, "attribution", "text");
  return (
    <Grid rows="auto minmax(0, 1fr) auto" gap={6} inset background={dark ? "primary" : "secondary"}>
      <div style={{ gridColumn: "1 / -1" }}>
        {badge && (
          <Badge slot="badge" background="accent" color="neutral-dark">
            {badge.value}
          </Badge>
        )}
      </div>
      <div style={{ gridColumn: "1 / -1", alignSelf: "center", display: "grid", gap: space(4) }}>
        <div aria-hidden="true" style={{ height: space(6) }}>
          <Text as="span" font="heading" size={6} color={dark ? "secondary" : "primary"}>
            “
          </Text>
        </div>
        <Text slot="quote" as="p" font="heading" size={5} color={ink}>
          {slot(slots, "quote", "text").value}
        </Text>
        {attribution && (
          <Text slot="attribution" font="body" size={2} color={ink} strong>
            {`— ${attribution.value}`}
          </Text>
        )}
      </div>
      <div style={{ gridColumn: "9 / -1", alignSelf: "end", justifySelf: "end" }}>
        <Logo slot="logo" src={slot(slots, "logo", "logo").src} height={6} />
      </div>
    </Grid>
  );
}

export const kutipan: Template = {
  meta: {
    id: "feed-kutipan",
    name: "Kutipan",
    format: "feed-4x5",
    description:
      "Kutipan pelanggan atau pernyataan brand ditampilkan besar, tanpa foto. Untuk testimoni, nilai brand, atau kalimat yang ingin diingat.",
    slots: [
      {
        name: "badge",
        type: "badge",
        required: false,
        description: "Label pendek di pojok atas, mis. Kata pelanggan",
        maxChars: 20,
      },
      {
        name: "quote",
        type: "text",
        required: true,
        description: "Kutipan atau pernyataan dari copy, tanpa tanda kutip",
        maxChars: 100,
      },
      {
        name: "attribution",
        type: "text",
        required: false,
        description: "Nama dan keterangan sumber kutipan, tanpa tanda pisah",
        maxChars: 40,
      },
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
        values: ["secondary", "dark"],
        default: "secondary",
        description: "Latar warna sekunder brand atau primary (dark)",
      },
    ],
  },
  Slide: KutipanSlide,
};
