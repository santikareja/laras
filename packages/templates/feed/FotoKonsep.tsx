import { Photo } from "../primitives/index.ts";
import { type SlideProps, slot, type Template } from "../src/template.ts";
import { StyleBackdrop, StyleOverlay, styleEffect, styleTreatment } from "../styles/layer.tsx";
import { PlacedLogo, TopCaption } from "./SatuObjek.tsx";

// Arketipe A3 Foto konsep (T-122, ADR-015; PRD 4 K1, K7): satu foto konsep penuh dengan bagian
// atas kosong, headline dan satu baris pendukung di ruang kosong itu. Pasangan feed-satu-objek
// untuk foto utuh (bukan cut-out).

function FotoKonsepSlide({ slots, options, style }: SlideProps) {
  return (
    <div style={{ position: "relative", height: "100%", overflow: "hidden" }}>
      <StyleBackdrop style={style} />
      <div
        data-qa-element="background"
        data-qa-name="foto"
        style={{ position: "absolute", inset: 0 }}
      >
        <Photo
          slot="image"
          src={slot(slots, "image", "image").src}
          treatment={styleTreatment(style)}
        />
      </div>
      <TopCaption slots={slots} dark={false} effect={styleEffect(style, "headline")} />
      <PlacedLogo src={slot(slots, "logo", "logo").src} at={options.logo ?? "top-left"} />
      <StyleOverlay style={style} />
    </div>
  );
}

export const fotoKonsep: Template = {
  meta: {
    id: "feed-foto-konsep",
    name: "Foto konsep",
    format: "feed-4x5",
    description:
      "Satu foto konsep atau metafora visual memenuhi kanvas, 40% atas dibiarkan kosong untuk headline dan satu baris pendukung. Untuk satu ide besar yang langsung terbaca dari gambar.",
    slots: [
      {
        name: "image",
        type: "image",
        required: true,
        description:
          "Foto konsep satu objek atau metafora dengan latar polos terang dan 40% atas kosong",
        aspectRatio: "4:5",
      },
      {
        name: "headline",
        type: "text",
        required: true,
        description: "Headline dari copy",
        maxChars: 40,
      },
      {
        name: "body",
        type: "text",
        required: false,
        description: "Satu baris dari copy",
        maxChars: 70,
      },
      { name: "logo", type: "logo", required: true, description: "Logo di atas latar terang" },
    ],
    options: [
      {
        name: "logo",
        values: ["top-left", "bottom-right"],
        default: "top-left",
        description: "Letak logo, mengikuti aturan brand",
      },
    ],
  },
  Slide: FotoKonsepSlide,
};
