import {
  Blob,
  Button,
  CurvedPanel,
  Disc,
  IconDisc,
  Image,
  Swoosh,
  Text,
} from "../../primitives/index.ts";
import { color, space } from "../../primitives/vars.ts";
import type { SpecimenProps, StyleLayerProps, StyleRender } from "../../src/style.ts";
import { SpecimenCell, SpecimenGrid } from "../specimen-grid.tsx";
import { HangTag, Ripple, Stage, Swirl, Verdict } from "./parts.tsx";

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

function Specimen({ subject }: SpecimenProps) {
  const center = { x: 150, y: 150 };
  return (
    <SpecimenGrid columns={3} rows={4}>
      <SpecimenCell name="Panggung dan subjek" background="primary">
        <Stage
          kind="cakram"
          center={{ x: 150, y: 165 }}
          size={160}
          fill="secondary"
          line="primary"
        />
        <div style={{ position: "absolute", left: "20%", right: "20%", top: "2%", bottom: 0 }}>
          <Image src={subject} fit="contain" />
        </div>
      </SpecimenCell>
      <SpecimenCell name="Lensa">
        <Stage
          kind="lensa"
          center={{ x: 135, y: 110 }}
          size={150}
          fill="primary"
          line="neutral-light"
        />
      </SpecimenCell>
      <SpecimenCell name="Biji" background="primary">
        <Stage kind="biji" center={center} size={200} fill="secondary" line="primary" />
      </SpecimenCell>
      <SpecimenCell name="Swirl dan riak" background="primary">
        <Ripple center={{ x: 540, y: 560 }} field="primary" ink="secondary" from={120} count={6} />
        <Swirl
          center={{ x: 540, y: 560 }}
          radius={300}
          from={-150}
          to={60}
          color="accent"
          thickness={54}
        />
      </SpecimenCell>
      <SpecimenCell name="Tag gantung" style={{ display: "grid", placeItems: "center" }}>
        <div style={{ marginTop: space(6) }}>
          <HangTag
            slot="tanda"
            background="neutral-dark"
            color="neutral-light"
            string="neutral-dark"
            drop={80}
          >
            Mitos vs Fakta
          </HangTag>
        </div>
      </SpecimenCell>
      <SpecimenCell
        name="Vonis"
        style={{ display: "grid", alignContent: "center", gap: space(3), padding: space(3) }}
      >
        <Verdict
          icon="x"
          label={{ slot: "labelMitos", text: "Mitos" }}
          statement={{ slot: "mitos", text: "Dicoret" }}
          mark="accent"
          markInk="neutral-dark"
          ink="neutral-dark"
          struck="accent"
        />
        <Verdict
          icon="check"
          label={{ slot: "labelFakta", text: "Fakta" }}
          statement={{ slot: "fakta", text: "Ditegaskan" }}
          mark="primary"
          markInk="neutral-light"
          ink="neutral-dark"
          strong
        />
      </SpecimenCell>
      <SpecimenCell name="Tiket" background="primary" style={{ padding: space(4) }}>
        <div
          style={{
            position: "relative",
            height: "100%",
            borderRadius: "var(--shape-radius)",
            background: color("secondary"),
          }}
        >
          {(["left", "right"] as const).map((side) => (
            <span
              key={side}
              style={{
                position: "absolute",
                bottom: "22%",
                [side]: "-18px",
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: color("primary"),
              }}
            />
          ))}
          <span
            style={{
              position: "absolute",
              bottom: "calc(22% + 16px)",
              left: "28px",
              right: "28px",
              borderTop: `5px dashed ${color("primary")}`,
            }}
          />
        </div>
      </SpecimenCell>
      <SpecimenCell name="Blob" style={{ padding: space(3) }}>
        <Blob color="secondary" points={6} seed={2} />
      </SpecimenCell>
      <SpecimenCell name="Panel gelombang" background="secondary">
        <CurvedPanel color="primary" edge="wave" at={0.5} />
      </SpecimenCell>
      <SpecimenCell
        name="Ikon datar"
        style={{ display: "flex", alignItems: "center", gap: space(2), padding: space(3) }}
      >
        <IconDisc
          name="calendar"
          size={36}
          ratio={1.6}
          shape="circle"
          background="primary"
          color="neutral-light"
        />
        <IconDisc
          name="pin"
          size={36}
          ratio={1.6}
          shape="circle"
          background="accent"
          color="neutral-dark"
        />
        <IconDisc
          name="check"
          size={36}
          ratio={1.6}
          shape="circle"
          background="secondary"
          color="neutral-dark"
        />
      </SpecimenCell>
      <SpecimenCell
        name="CTA berikon"
        style={{ display: "grid", alignContent: "center", padding: space(3) }}
      >
        <Button shape="pill">Coba</Button>
      </SpecimenCell>
      <SpecimenCell
        name="Dua nada"
        style={{ display: "grid", alignContent: "center", padding: space(3) }}
      >
        <Text
          font="heading"
          size={4}
          color="neutral-dark"
          accentWords={{ text: "nada", color: "primary" }}
        >
          Dua nada
        </Text>
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
