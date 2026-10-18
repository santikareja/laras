import { Badge, Grid, Logo, Text } from "../primitives/index.ts";
import { type ColorToken, color, type FontSizeStep, space } from "../primitives/vars.ts";
import { type SlideProps, slot, type Template } from "../src/template.ts";

// Spesimen brand untuk `pnpm render:demo`: skala tipografi, palet, badge, dan logo satu brand.
// Alat cek font dan token, bukan bagian katalog template untuk Claude.

const SIZES: FontSizeStep[] = [1, 2, 3, 4, 5, 6];
const SWATCHES: ColorToken[] = ["primary", "secondary", "accent", "neutral-light", "neutral-dark"];

function SpecimenSlide({ slots }: SlideProps) {
  return (
    <Grid rows="auto auto 1fr auto auto" gap={6} inset background="neutral-light">
      <div style={{ gridColumn: "1 / -1" }}>
        <Badge slot="badge" background="accent" color="neutral-dark">
          {slot(slots, "badge", "badge").value}
        </Badge>
      </div>
      <div style={{ gridColumn: "1 / -1" }}>
        <Text slot="title" as="h1" font="heading" size={6} color="primary">
          {slot(slots, "title", "text").value}
        </Text>
      </div>
      <div
        style={{
          gridColumn: "1 / -1",
          alignSelf: "center",
          display: "flex",
          alignItems: "baseline",
          gap: space(5),
        }}
      >
        {SIZES.map((size) => (
          <Text key={size} as="span" font="heading" size={size} color="neutral-dark">
            Aa
          </Text>
        ))}
      </div>
      <div
        style={{
          gridColumn: "1 / -1",
          display: "grid",
          gridTemplateColumns: `repeat(${SWATCHES.length}, minmax(0, 1fr))`,
          gap: space(3),
        }}
      >
        {SWATCHES.map((token) => (
          <div key={token} style={{ display: "grid", gap: space(2) }}>
            <div
              style={{
                aspectRatio: "1",
                background: color(token),
                border: `var(--shape-stroke) solid ${color("neutral-dark")}`,
                borderRadius: "var(--shape-radius)",
                boxShadow: "var(--shape-shadow)",
              }}
            />
            <Text as="span" font="body" size={1} color="neutral-dark">
              {token}
            </Text>
          </div>
        ))}
      </div>
      <div style={{ gridColumn: "1 / 10", alignSelf: "end", display: "grid", gap: space(2) }}>
        <Text slot="body" font="body" size={2} color="neutral-dark">
          {slot(slots, "body", "text").value}
        </Text>
        <Text as="span" font="body" size={1} color="neutral-dark" strong>
          Teks tebal ukuran 1
        </Text>
      </div>
      <div style={{ gridColumn: "10 / -1", alignSelf: "end", justifySelf: "end" }}>
        <Logo slot="logo" src={slot(slots, "logo", "logo").src} height={6} />
      </div>
    </Grid>
  );
}

export const specimen: Template = {
  meta: { id: "specimen", format: "feed-4x5" },
  Slide: SpecimenSlide,
};
