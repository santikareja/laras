import {
  FloorShadow,
  OutlineFrame,
  Photo,
  Rule,
  Text,
  VerticalLabel,
} from "../../primitives/index.ts";
import { space } from "../../primitives/vars.ts";
import type { SpecimenProps, StyleLayerProps, StyleRender } from "../../src/style.ts";
import { AtCorner } from "../corner.tsx";
import { SpecimenCell, SpecimenGrid } from "../specimen-grid.tsx";

// Lapisan gaya Minimalism (PANDUAN.md bagian 7 dan 12): satu jenis dekorasi saja. Garis rambut
// menjadi lantai tempat objek berdiri bila arketipe punya lantai; label vertikal dari copy di
// kolom paling tepi. Tanpa tekstur, pola, atau efek.

function Backdrop({ floor, surface }: StyleLayerProps) {
  if (!floor) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: floor,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <Rule color={surface === "dark" ? "neutral-light" : "neutral-dark"} length={216} />
    </div>
  );
}

function Overlay({ label, corner, surface }: StyleLayerProps) {
  if (!label || !corner) return null;
  return (
    <AtCorner corner={corner}>
      <VerticalLabel slot="label" color={surface === "dark" ? "neutral-light" : "neutral-dark"}>
        {label}
      </VerticalLabel>
    </AtCorner>
  );
}

function Specimen({ subject, photo }: SpecimenProps) {
  return (
    <SpecimenGrid columns={3} rows={2}>
      <SpecimenCell
        name="Garis rambut"
        style={{ display: "grid", alignContent: "center", justifyItems: "center", gap: space(5) }}
      >
        <Rule color="neutral-dark" length={160} />
        <Rule color="accent" length={96} />
      </SpecimenCell>
      <SpecimenCell name="Garis lantai" background="secondary">
        <FloorShadow />
        <div
          style={{ position: "absolute", left: "20%", right: "20%", bottom: "16%", height: "60%" }}
        >
          <Photo src={subject} fit="contain" />
        </div>
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: "16%",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Rule color="neutral-dark" length={120} />
        </div>
      </SpecimenCell>
      <SpecimenCell name="Label vertikal" style={{ padding: space(4) }}>
        <VerticalLabel color="neutral-dark">Edisi pertama</VerticalLabel>
      </SpecimenCell>
      <SpecimenCell name="Bingkai garis" style={{ padding: space(6) }}>
        <div style={{ position: "relative", height: "100%" }}>
          <Photo src={photo} />
          <OutlineFrame color="neutral-dark" offset={24} side="left" />
        </div>
      </SpecimenCell>
      <SpecimenCell name="Foto mono" background="secondary">
        <Photo src={subject} fit="contain" treatment={{ kind: "mono" }} />
      </SpecimenCell>
      <SpecimenCell
        name="Ruang kosong"
        style={{ display: "grid", alignContent: "end", padding: space(4) }}
      >
        <Text font="heading" size={3} color="neutral-dark">
          Satu ide.
        </Text>
      </SpecimenCell>
    </SpecimenGrid>
  );
}

export const minimalismRender: StyleRender = {
  variables: () => [],
  treatment: () => ({ kind: "natural" }),
  Backdrop,
  Overlay,
  Specimen,
};
