import { color, space } from "../primitives/vars.ts";
import { type SlideProps, slot, type Template } from "../src/template.ts";
import { styleRender } from "./layer.tsx";

// Spesimen perangkat grafis per gaya (T-132): satu halaman berisi semua perangkat gaya dengan isi
// contoh, dirender dengan brand fixture agar pemilik dan agent bisa menilai perangkatnya. Bukan
// bagian katalog Claude. Isi per gaya ada di `Specimen` pada render.tsx gaya itu.

function SpesimenGayaSlide({ slots, style }: SlideProps) {
  if (!style) throw new Error("Spesimen gaya membutuhkan gaya");
  const { Specimen } = styleRender(style.id);
  if (!Specimen) throw new Error(`Gaya "${style.id}" belum punya spesimen`);
  return (
    <div
      style={{
        position: "relative",
        height: "100%",
        overflow: "hidden",
        boxSizing: "border-box",
        padding: "var(--space-safe)",
        background: color("neutral-light"),
        display: "grid",
        gap: space(4),
      }}
    >
      <Specimen
        style={style}
        subject={slot(slots, "subjek", "image").src}
        photo={slot(slots, "foto", "image").src}
        logo={slot(slots, "logo", "logo").src}
      />
    </div>
  );
}

export const styleSpecimen: Template = {
  meta: {
    id: "spesimen-gaya",
    name: "Spesimen gaya",
    format: "feed-4x5",
    description: "Lembar perangkat grafis satu gaya desain untuk ditinjau. Bukan untuk postingan.",
    slots: [
      {
        name: "subjek",
        type: "image",
        required: true,
        description: "Subjek cut-out contoh",
        aspectRatio: "4:5",
        cutout: true,
      },
      {
        name: "foto",
        type: "image",
        required: true,
        description: "Foto contoh",
        aspectRatio: "4:5",
      },
      { name: "logo", type: "logo", required: true, description: "Logo brand" },
    ],
    options: [],
  },
  Slide: SpesimenGayaSlide,
};
