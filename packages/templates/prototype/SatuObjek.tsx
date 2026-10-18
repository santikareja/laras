import { Image, Logo, Text } from "../primitives/index.ts";
import { color, space } from "../primitives/vars.ts";
import { optionalSlot, type SlideProps, slot, type Template } from "../src/template.ts";

// Prototipe A3 (T-122, PRD 4 K1, K7): satu objek atau gambar konsep dengan ruang kosong luas,
// satu kalimat, satu baris pendukung. Mode "object" untuk cut-out, "full" untuk foto konsep.

function SatuObjekSlide({ slots, options }: SlideProps) {
  const full = options.mode === "full";
  const body = optionalSlot(slots, "body", "text");
  const src = slot(slots, "image", "image").src;
  return (
    <div
      style={{
        position: "relative",
        height: "100%",
        overflow: "hidden",
        background: color(options.tone === "secondary" ? "secondary" : "neutral-light"),
      }}
    >
      {full ? (
        <div style={{ position: "absolute", inset: 0 }}>
          <Image slot="image" src={src} />
        </div>
      ) : (
        <>
          <div
            style={{
              position: "absolute",
              left: "30%",
              right: "30%",
              bottom: "19%",
              height: "3%",
              borderRadius: "50%",
              background: color("neutral-dark"),
              opacity: 0.18,
              filter: "blur(14px)",
            }}
          />
          <div
            style={{
              position: "absolute",
              left: "20%",
              right: "20%",
              bottom: "16%",
              height: "50%",
            }}
          >
            <Image slot="image" src={src} fit="contain" />
          </div>
        </>
      )}
      <div
        style={{
          position: "absolute",
          top: "calc(var(--space-safe) * 1.5)",
          left: "15%",
          right: "15%",
          display: "grid",
          gap: space(3),
          justifyItems: "center",
          textAlign: "center",
        }}
      >
        <Text slot="headline" as="h1" font="heading" size={5} color="primary">
          {slot(slots, "headline", "text").value}
        </Text>
        {body && (
          <Text slot="body" font="body" size={2} color="neutral-dark">
            {body.value}
          </Text>
        )}
      </div>
      <div
        style={{
          position: "absolute",
          // Mode full: gambar konsep mengisi bagian bawah, jadi logo pindah ke pojok kiri atas.
          ...(full ? { top: "var(--space-safe)" } : { bottom: "var(--space-safe)" }),
          left: full ? "var(--space-safe)" : 0,
          right: full ? undefined : 0,
          display: "flex",
          justifyContent: full ? "flex-start" : "center",
        }}
      >
        <Logo slot="logo" src={slot(slots, "logo", "logo").src} height={5} />
      </div>
    </div>
  );
}

export const satuObjek: Template = {
  meta: {
    id: "proto-satu-objek",
    name: "Satu objek",
    format: "feed-4x5",
    description:
      "Prototipe: satu objek atau gambar konsep dengan ruang kosong luas, satu kalimat dan satu baris pendukung.",
    slots: [
      {
        name: "image",
        type: "image",
        required: true,
        description: "Cut-out (mode object) atau foto konsep dengan 40% atas kosong (mode full)",
        aspectRatio: "4:5",
      },
      { name: "headline", type: "text", required: true, description: "Headline", maxChars: 40 },
      { name: "body", type: "text", required: false, description: "Satu baris", maxChars: 70 },
      { name: "logo", type: "logo", required: true, description: "Logo di atas latar terang" },
    ],
    options: [
      {
        name: "mode",
        values: ["object", "full"],
        default: "object",
        description: "Cut-out di bidang atau foto penuh",
      },
      {
        name: "tone",
        values: ["neutral", "secondary"],
        default: "neutral",
        description: "Warna bidang mode object",
      },
    ],
  },
  Slide: SatuObjekSlide,
};
