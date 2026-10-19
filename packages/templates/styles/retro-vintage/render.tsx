import {
  CanvasFrame,
  Checker,
  Display,
  Grain,
  HalftonePattern,
  OvalFrame,
  Photo,
  Rainbow,
  RoundBadge,
  Rule,
  Starburst,
  Sunburst,
  Text,
} from "../../primitives/index.ts";
import { space } from "../../primitives/vars.ts";
import type { SpecimenProps, StyleLayerProps, StyleRender } from "../../src/style.ts";
import { AtCorner } from "../corner.tsx";
import { SpecimenCell, SpecimenGrid } from "../specimen-grid.tsx";

// Lapisan gaya Vintage/Retro (PANDUAN.md bagian 6, 7, 12): satu tekstur global (grain) atau halftone
// lokal, dekorasi sesuai sub-varian (iklan cetak: bingkai garis ganda; groovy: pelangi; editorial
// hangat: hampir tanpa dekorasi), foto bergrading hangat, dan baris kredit dari copy. Sunburst
// tidak dipakai di lapisan umum karena teks tidak boleh di atas sinar (dipakai arketipe T-134).

function Backdrop({ style }: StyleLayerProps) {
  // Bingkai di bawah subjek: subjek boleh menembus bingkai seperti iklan cetak lawas.
  if (style.variant === "iklan-cetak") return <CanvasFrame color="accent" double inset={32} />;
  if (style.variant !== "groovy") return null;
  return (
    <div style={{ position: "absolute", left: 0, bottom: 0 }}>
      <Rainbow colors={["accent", "secondary", "primary"]} radius={420} band={44} from="left" />
    </div>
  );
}

function Overlay({ style, label, corner, surface }: StyleLayerProps) {
  const ink = surface === "dark" ? "neutral-light" : "neutral-dark";
  return (
    <>
      {style.options.tekstur === "grain" && <Grain tone="neutral-dark" opacity={0.08} />}
      {style.options.tekstur === "halftone" && (
        <div style={{ position: "absolute", top: 0, right: 0, width: "34%", height: "26%" }}>
          <HalftonePattern tone="accent" cell={16} dot={0.5} />
        </div>
      )}
      {label && corner && (
        <AtCorner corner={corner}>
          <Rule color={ink} length={96} weight={2} />
          <div style={{ marginTop: space(2) }}>
            <Text slot="label" font="body" size={1} color={ink}>
              {label}
            </Text>
          </div>
        </AtCorner>
      )}
    </>
  );
}

function Specimen({ subject, photo }: SpecimenProps) {
  return (
    <SpecimenGrid columns={3} rows={4}>
      <SpecimenCell name="Grain" background="secondary">
        <Grain tone="neutral-dark" opacity={0.1} />
      </SpecimenCell>
      <SpecimenCell name="Halftone">
        <HalftonePattern tone="accent" cell={16} dot={0.5} />
      </SpecimenCell>
      <SpecimenCell name="Cetak meleset" style={{ padding: space(3) }}>
        <Display
          font="heading"
          scale={1}
          color="primary"
          effect={{ kind: "misregister", color: "accent" }}
        >
          RETRO
        </Display>
      </SpecimenCell>
      <SpecimenCell name="Starburst" style={{ display: "grid", placeItems: "center" }}>
        <Starburst color="neutral-dark" diameter={200}>
          Baru!
        </Starburst>
      </SpecimenCell>
      <SpecimenCell name="Sunburst">
        <Sunburst tone="secondary" rays={18} />
      </SpecimenCell>
      <SpecimenCell name="Kotak-kotak" style={{ display: "grid", alignContent: "end" }}>
        <Checker tone="primary" alt="neutral-light" cell={48} rows={2} />
      </SpecimenCell>
      <SpecimenCell name="Pelangi">
        <div style={{ position: "absolute", left: 0, bottom: 0 }}>
          <Rainbow colors={["accent", "secondary", "primary"]} radius={220} band={32} from="left" />
        </div>
      </SpecimenCell>
      <SpecimenCell name="Bingkai ganda">
        <CanvasFrame color="primary" double inset={28} />
      </SpecimenCell>
      <SpecimenCell name="Bingkai oval" style={{ padding: space(4) }}>
        <OvalFrame color="primary">
          <Photo src={photo} treatment={{ kind: "hangat", tone: "accent" }} />
        </OvalFrame>
      </SpecimenCell>
      <SpecimenCell name="Stiker bulat" style={{ display: "grid", placeItems: "center" }}>
        <RoundBadge background="accent" color="neutral-dark" diameter={160}>
          Rasa baru
        </RoundBadge>
      </SpecimenCell>
      <SpecimenCell name="Huruf retro" background="primary" style={{ padding: space(3) }}>
        <Display
          font="heading"
          scale={1}
          color="secondary"
          effect={{ kind: "retro", outline: "neutral-dark", shadow: "accent" }}
        >
          GROOVY
        </Display>
      </SpecimenCell>
      <SpecimenCell
        name="Hangat, duotone"
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}
      >
        <div style={{ position: "relative" }}>
          <Photo src={subject} fit="contain" treatment={{ kind: "hangat", tone: "accent" }} />
        </div>
        <div style={{ position: "relative" }}>
          <Photo
            src={photo}
            treatment={{ kind: "duotone", dark: "primary", light: "neutral-light" }}
          />
        </div>
      </SpecimenCell>
    </SpecimenGrid>
  );
}

export const retroVintageRender: StyleRender = {
  // Bingkai garis ganda iklan cetak butuh safe margin minimal 80 px (Vintage/Retro 7).
  variables: (brand, { variant }) =>
    variant === "iklan-cetak"
      ? [["--space-safe", `${Math.max(brand.spacing.safeMargin, 80)}px`]]
      : [],
  treatment: ({ options }) => {
    switch (options.foto) {
      case "duotone":
        return { kind: "duotone", dark: "primary", light: "neutral-light" };
      case "mono":
        return { kind: "mono" };
      case "natural":
        return { kind: "natural" };
      default:
        return { kind: "hangat", tone: "accent" };
    }
  },
  effect: ({ variant }, role) =>
    variant === "groovy" && role === "display"
      ? { kind: "retro", outline: "neutral-dark", shadow: "accent" }
      : undefined,
  Backdrop,
  Overlay,
  Specimen,
};
