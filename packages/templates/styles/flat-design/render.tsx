import {
  Blob,
  Button,
  CanvasFrame,
  CurvedPanel,
  Disc,
  Display,
  HardFrame,
  IconDisc,
  Marker,
  Ring,
  Scallop,
  Swoosh,
  Text,
} from "../../primitives/index.ts";
import { space } from "../../primitives/vars.ts";
import type { SpecimenProps, StyleLayerProps, StyleRender } from "../../src/style.ts";
import { SpecimenCell, SpecimenGrid } from "../specimen-grid.tsx";

// Lapisan gaya Flat Design (PANDUAN.md bagian 7 dan 12): satu keluarga bentuk per postingan sesuai
// varian (pita = swoosh, organik = blob, geometris = cakram), tanpa bayangan, tekstur, atau
// gradient. Bentuk berada di belakang subjek dan teks.

function Backdrop({ style, subjectSide = "right" }: StyleLayerProps) {
  const edge = subjectSide;
  switch (style.variant) {
    case "organik":
      return (
        <div
          style={{
            position: "absolute",
            [edge]: "-12%",
            bottom: "-8%",
            width: "64%",
            height: "56%",
          }}
        >
          <Blob color="primary" points={6} seed={3} />
        </div>
      );
    case "geometris":
      return (
        <div style={{ position: "absolute", [edge]: "-16%", bottom: "-12%" }}>
          <Disc color="primary" diameter={720} />
        </div>
      );
    default:
      return <Swoosh color="primary" preset="side" variant="band" flipX={edge === "left"} />;
  }
}

function Specimen(_: SpecimenProps) {
  return (
    <SpecimenGrid columns={3} rows={4}>
      <SpecimenCell name="Swoosh garis">
        <Swoosh color="primary" preset="wave" variant="line" />
      </SpecimenCell>
      <SpecimenCell name="Swoosh pita">
        <Swoosh color="accent" preset="arc" variant="band" />
      </SpecimenCell>
      <SpecimenCell name="Blob" style={{ padding: space(3) }}>
        <Blob color="secondary" points={6} seed={2}>
          <Text font="heading" size={2} color="neutral-dark">
            Blob
          </Text>
        </Blob>
      </SpecimenCell>
      <SpecimenCell name="Scallop" style={{ padding: space(3) }}>
        <Scallop color="accent" lobes={12}>
          <Text font="heading" size={2} color="neutral-dark">
            Kartu
          </Text>
        </Scallop>
      </SpecimenCell>
      <SpecimenCell name="Panel gelombang" background="secondary">
        <CurvedPanel color="primary" edge="wave" at={0.5} />
      </SpecimenCell>
      <SpecimenCell name="Panel takik" background="secondary">
        <CurvedPanel color="primary" edge="notch" at={0.5} />
      </SpecimenCell>
      <SpecimenCell name="Cakram dan cincin" style={{ display: "grid", placeItems: "center" }}>
        <div style={{ position: "relative", width: 220, height: 220 }}>
          <Disc color="secondary" diameter={220} />
          <Ring color="primary" diameter={220} />
        </div>
      </SpecimenCell>
      <SpecimenCell
        name="Ikon datar"
        style={{ display: "flex", alignItems: "center", gap: space(2), padding: space(3) }}
      >
        <IconDisc
          name="star"
          size={40}
          ratio={1.6}
          shape="brand"
          background="accent"
          color="neutral-dark"
        />
        <IconDisc
          name="pin"
          size={40}
          ratio={1.6}
          shape="brand"
          background="primary"
          color="neutral-light"
        />
        <IconDisc
          name="calendar"
          size={40}
          ratio={1.6}
          shape="brand"
          background="secondary"
          color="neutral-dark"
        />
      </SpecimenCell>
      <SpecimenCell
        name="CTA berikon"
        style={{ display: "grid", alignContent: "center", padding: space(3) }}
      >
        <Button>Coba</Button>
      </SpecimenCell>
      <SpecimenCell
        name="Penanda"
        style={{ display: "grid", alignContent: "center", gap: space(2), padding: space(3) }}
      >
        <Marker mark="accent" color="neutral-dark">
          Mitos
        </Marker>
        <Marker mark="primary" color="neutral-dark" shape="circle">
          Fakta
        </Marker>
      </SpecimenCell>
      <SpecimenCell name="Dua nada" style={{ padding: space(3) }}>
        <Display
          font="heading"
          scale={1}
          color="neutral-dark"
          stack
          accentWords={{ text: "NADA", color: "primary" }}
        >
          DUA NADA
        </Display>
      </SpecimenCell>
      <SpecimenCell name="Bayangan datar" background="secondary" style={{ padding: space(4) }}>
        <HardFrame shadow="primary" background="neutral-light">
          <div style={{ padding: space(3) }}>
            <Text font="heading" size={2} color="neutral-dark">
              Kartu
            </Text>
          </div>
        </HardFrame>
        <CanvasFrame color="primary" opacity={0.5} />
      </SpecimenCell>
    </SpecimenGrid>
  );
}

export const flatDesignRender: StyleRender = {
  variables: () => [],
  treatment: () => ({ kind: "natural" }),
  Backdrop,
  Specimen,
};
