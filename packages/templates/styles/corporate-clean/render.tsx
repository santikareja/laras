import {
  Button,
  ContactBar,
  DeviceMockup,
  DotGrid,
  IconRow,
  Panel,
  Photo,
  ProfileTag,
  RatingCard,
  StatCard,
  Swoosh,
  Text,
} from "../../primitives/index.ts";
import { space } from "../../primitives/vars.ts";
import type { SpecimenProps, StyleLayerProps, StyleRender } from "../../src/style.ts";
import { SpecimenCell, SpecimenGrid } from "../specimen-grid.tsx";

// Lapisan gaya Corporate Clean (PANDUAN.md bagian 7 dan 12): tanpa tekstur; satu keluarga dekorasi
// opsional (swoosh di sudut). Panel, ikon, tombol, dan kartu dipakai lewat arketipe.

function Backdrop({ style }: StyleLayerProps) {
  if (style.options.dekor !== "swoosh") return null;
  return <Swoosh color="secondary" preset="corner" variant="line" />;
}

function Specimen({ subject, photo }: SpecimenProps) {
  return (
    <SpecimenGrid columns={3} rows={4}>
      <SpecimenCell name="Panel" style={{ padding: space(3) }}>
        <Panel background="primary" padding={4}>
          <Text font="heading" size={2} color="neutral-light">
            Panel info
          </Text>
        </Panel>
      </SpecimenCell>
      <SpecimenCell
        name="Deret ikon"
        span={2}
        style={{ display: "grid", alignContent: "center", padding: space(3) }}
      >
        <IconRow
          items={[
            { icon: "shield", label: "Terjamin" },
            { icon: "clock", label: "Tepat waktu" },
            { icon: "truck", label: "Antar" },
          ]}
          color="neutral-dark"
          iconBackground="secondary"
          iconColor="primary"
        />
      </SpecimenCell>
      <SpecimenCell name="Checklist" style={{ padding: space(3) }}>
        <IconRow
          items={[
            { icon: "check", label: "Poin satu" },
            { icon: "check", label: "Poin dua" },
          ]}
          direction="column"
          color="neutral-dark"
          iconBackground="primary"
          iconColor="neutral-light"
          iconSize={32}
        />
      </SpecimenCell>
      <SpecimenCell
        name="Tombol"
        style={{ display: "grid", alignContent: "center", padding: space(3) }}
      >
        <Button>Hubungi</Button>
      </SpecimenCell>
      <SpecimenCell name="Kartu angka" background="secondary" style={{ padding: space(3) }}>
        <StatCard
          background="neutral-light"
          value="98%"
          label="Contoh label"
          color="primary"
          size={4}
        />
      </SpecimenCell>
      <SpecimenCell name="Kartu rating" background="secondary" style={{ padding: space(3) }}>
        <RatingCard
          background="neutral-light"
          score="4,8"
          source="Contoh sumber"
          color="neutral-dark"
          starColor="accent"
        />
      </SpecimenCell>
      <SpecimenCell
        name="Tag profil"
        span={2}
        style={{ display: "grid", alignContent: "center", padding: space(3) }}
      >
        {/* biome-ignore lint/a11y/useValidAriaRole: `role` di ProfileTag adalah jabatan, bukan ARIA */}
        <ProfileTag src={subject} name="Nama" role="Peran" ring="accent" color="neutral-dark" />
      </SpecimenCell>
      <SpecimenCell
        name="Bar kontak"
        span={2}
        style={{ display: "grid", alignContent: "center", padding: space(3) }}
      >
        <ContactBar
          items={[
            { icon: "chat", text: "Kontak" },
            { icon: "pin", text: "Lokasi" },
          ]}
          variant="filled"
          background="primary"
          color="neutral-light"
          iconBackground="neutral-light"
          iconColor="primary"
        />
      </SpecimenCell>
      <SpecimenCell name="Mockup ponsel" background="secondary" style={{ padding: space(3) }}>
        <DeviceMockup kind="phone" src={photo} />
      </SpecimenCell>
      <SpecimenCell name="Swoosh dan titik">
        <Swoosh color="secondary" preset="corner" variant="line" />
        <div style={{ position: "absolute", top: space(3), right: space(3) }}>
          <DotGrid tone="primary" />
        </div>
      </SpecimenCell>
      <SpecimenCell name="Foto natural">
        <Photo src={photo} />
      </SpecimenCell>
    </SpecimenGrid>
  );
}

export const corporateCleanRender: StyleRender = {
  variables: () => [],
  treatment: () => ({ kind: "natural" }),
  Backdrop,
  Specimen,
};
