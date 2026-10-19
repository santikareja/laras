import {
  GridLines,
  HardFrame,
  Icon,
  PaperTexture,
  Photo,
  PhotoCells,
  Scribble,
  TechLabel,
  Text,
  TextBlock,
} from "../../primitives/index.ts";
import { space } from "../../primitives/vars.ts";
import type { SpecimenProps, StyleLayerProps, StyleRender } from "../../src/style.ts";
import { AtCorner } from "../corner.tsx";
import { SpecimenCell, SpecimenGrid } from "../specimen-grid.tsx";

// Lapisan gaya Brutalisme (PANDUAN.md bagian 7 dan 12): kertas kusam dan grid terlihat di belakang
// isi, foto hitam-putih (atau halftone/fotokopi), label teknis dari copy di sudut kosong.

function Backdrop({ style }: StyleLayerProps) {
  return (
    <>
      {style.options.tekstur === "kertas" && <PaperTexture opacity={0.1} />}
      {style.options.grid !== "no" && (
        <GridLines
          color="neutral-dark"
          columns={6}
          rows={1}
          opacity={0.35}
          marks={[
            [0, 0],
            [6, 1],
          ]}
        />
      )}
    </>
  );
}

function Overlay({ label, corner, surface }: StyleLayerProps) {
  if (!label || !corner) return null;
  return (
    <AtCorner corner={corner}>
      <TechLabel
        slot="label"
        color={surface === "dark" ? "neutral-light" : "neutral-dark"}
        bar="accent"
        lines={[label]}
      />
    </AtCorner>
  );
}

function Specimen({ subject, photo }: SpecimenProps) {
  return (
    <SpecimenGrid columns={3} rows={3}>
      <SpecimenCell name="Kertas dan grid">
        <PaperTexture opacity={0.12} />
        <GridLines color="neutral-dark" columns={3} rows={1} opacity={0.5} marks={[[0, 0]]} />
      </SpecimenCell>
      <SpecimenCell name="Foto mono" background="secondary">
        <Photo src={subject} fit="contain" treatment={{ kind: "mono" }} />
      </SpecimenCell>
      <SpecimenCell name="Halftone" background="secondary">
        <Photo src={subject} fit="contain" treatment={{ kind: "halftone", ink: "neutral-dark" }} />
      </SpecimenCell>
      <SpecimenCell name="Fotokopi" background="secondary">
        <Photo src={subject} fit="contain" treatment={{ kind: "fotokopi", ink: "neutral-dark" }} />
      </SpecimenCell>
      <SpecimenCell name="Sel foto" style={{ padding: space(2) }}>
        <PhotoCells src={photo} grid="3x3" gap={8} treatment={{ kind: "mono" }} />
      </SpecimenCell>
      <SpecimenCell name="Label teknis" style={{ padding: space(3) }}>
        <TechLabel color="neutral-dark" bar="accent" lines={["Edisi 01", "Label teknis"]} />
      </SpecimenCell>
      <SpecimenCell name="Blok teks" style={{ padding: space(2) }}>
        <TextBlock background="accent" color="neutral-dark" label="Fakta" size={3}>
          BLOK TEKS
        </TextBlock>
      </SpecimenCell>
      <SpecimenCell name="Bingkai keras (Neo)" background="secondary" style={{ padding: space(4) }}>
        <HardFrame shadow="neutral-dark" edge="neutral-dark" background="neutral-light">
          <div style={{ padding: space(3) }}>
            <Text font="heading" size={2} color="neutral-dark" strong>
              Kartu Neo
            </Text>
          </div>
        </HardFrame>
      </SpecimenCell>
      <SpecimenCell name="Coret dan ikon" style={{ padding: space(3) }}>
        <div style={{ position: "relative", width: "fit-content" }}>
          <Text font="heading" size={3} color="neutral-dark">
            Mitos
          </Text>
          <div style={{ position: "absolute", inset: 0 }}>
            <Scribble shape="cross" color="accent" fill />
          </div>
        </div>
        <div style={{ display: "flex", gap: space(2), marginTop: space(4) }}>
          {(["target", "arrow-right", "x", "plus", "eye"] as const).map((name) => (
            <Icon key={name} name={name} size={40} stroke={4} color="neutral-dark" />
          ))}
        </div>
      </SpecimenCell>
    </SpecimenGrid>
  );
}

export const brutalismRender: StyleRender = {
  variables: () => [],
  treatment: ({ options }) => {
    switch (options.foto) {
      case "halftone":
        return { kind: "halftone", ink: "neutral-dark" };
      case "fotokopi":
        return { kind: "fotokopi", ink: "neutral-dark" };
      case "natural":
        return { kind: "natural" };
      default:
        return { kind: "mono" };
    }
  },
  Backdrop,
  Overlay,
  Specimen,
};
