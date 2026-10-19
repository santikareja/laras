import {
  Button,
  GlassPanel,
  IconButton,
  Keycap,
  Photo,
  ProgressTrack,
  SoftSurface,
  Text,
} from "../../primitives/index.ts";
import { space } from "../../primitives/vars.ts";
import type { SpecimenProps, StyleRender } from "../../src/style.ts";
import { SpecimenCell, SpecimenGrid } from "../specimen-grid.tsx";

// Lapisan gaya Glassmorphism dan Neumorphism (PANDUAN.md bagian 7 dan 12): kaca dan permukaan
// timbul dipakai lewat arketipe (feed-kartu-kaca); lapisan ini hanya memberi foto apa adanya.
// Varian Timbul hanya untuk brand dengan bayangan lembut (dicek styleFit, bagian 12).

function Specimen({ photo }: SpecimenProps) {
  const overPhoto = (children: React.ReactNode) => (
    <>
      <div style={{ position: "absolute", inset: 0 }}>
        <Photo src={photo} />
      </div>
      <div style={{ position: "absolute", left: space(3), right: space(3), bottom: space(3) }}>
        {children}
      </div>
    </>
  );
  return (
    <SpecimenGrid columns={3} rows={3}>
      <SpecimenCell name="Kaca terang">
        {overPhoto(
          <GlassPanel tone="light" padding={4}>
            <Text font="heading" size={2} color="neutral-dark">
              Kaca
            </Text>
          </GlassPanel>,
        )}
      </SpecimenCell>
      <SpecimenCell name="Kaca gelap">
        {overPhoto(
          <GlassPanel tone="dark" padding={4}>
            <Text font="heading" size={2} color="neutral-light">
              Kaca
            </Text>
          </GlassPanel>,
        )}
      </SpecimenCell>
      <SpecimenCell name="Tombol pil">
        {overPhoto(
          <div style={{ display: "grid", gap: space(2), justifyItems: "start" }}>
            <Button shape="pill" iconStroke="brand">
              Daftar
            </Button>
            <Button shape="pill" glass="light" icon={null}>
              Jadwal
            </Button>
          </div>,
        )}
      </SpecimenCell>
      <SpecimenCell
        name="Tombol ikon"
        background="secondary"
        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: space(3) }}
      >
        <IconButton name="play" variant="solid" background="accent" color="neutral-dark" />
        <IconButton name="headphones" variant="raised" background="secondary" color="primary" />
      </SpecimenCell>
      <SpecimenCell
        name="Timbul dan cekung"
        background="secondary"
        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: space(4) }}
      >
        <div style={{ width: 96, height: 96 }}>
          <SoftSurface surface="secondary" variant="raised" depth={10} />
        </div>
        <div style={{ width: 96, height: 96 }}>
          <SoftSurface surface="secondary" variant="inset" depth={10} />
        </div>
      </SpecimenCell>
      <SpecimenCell
        name="Bilah progres"
        background="secondary"
        style={{ display: "grid", alignContent: "center", padding: space(4) }}
      >
        <ProgressTrack value={0.6} surface="secondary" fill="primary" />
      </SpecimenCell>
      <SpecimenCell
        name="Tuts"
        background="secondary"
        style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: space(2) }}
      >
        <Keycap surface="secondary" color="primary">
          A
        </Keycap>
        <Keycap surface="secondary" color="primary">
          1
        </Keycap>
      </SpecimenCell>
      <SpecimenCell name="Tint foto">
        <Photo src={photo} treatment={{ kind: "tint", tone: "primary", strength: 0.2 }} />
      </SpecimenCell>
      <SpecimenCell name="Foto natural">
        <Photo src={photo} />
      </SpecimenCell>
    </SpecimenGrid>
  );
}

export const glassmorphismNeumorphismRender: StyleRender = {
  variables: () => [],
  treatment: () => ({ kind: "natural" }),
  Specimen,
};
