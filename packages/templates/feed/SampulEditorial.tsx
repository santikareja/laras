import { Logo, Photo, Rule, Text } from "../primitives/index.ts";
import { type ColorToken, color, space } from "../primitives/vars.ts";
import { optionalSlot, type SlideProps, slot, type Template } from "../src/template.ts";
import { StyleOverlay, styleTreatment } from "../styles/layer.tsx";
import { AccentText, BigWord, LAYER } from "../styles/retro-vintage/parts.tsx";

// Arketipe Sampul editorial (T-134, Vintage/Retro pola 2; PRD 4 K1, K2, K7): sampul majalah
// 70-an. Foto penuh bernuansa film dengan area tenang (langit, dinding, kain) tempat satu kata
// raksasa duduk; pembuka kecil font aksen di atasnya, satu kalimat dengan satu frasa disorot warna
// aksen di bawahnya, baris kepala cetak (label + garis) di atas judul, dan logo di sudut seberang. Skala kata yang ekstrem terhadap
// subjek foto adalah idenya (kata = pesan, foto = suasana yang membuktikannya).

const EDGE = "var(--space-safe)";
const LINE = 0.86;
// Ukuran kata: besar mengisi lebar (batas 320 px), sedang untuk area tenang sempit (74% lebar,
// batas 230 px) agar area ukur font display tidak menyentuh subjek foto.
const SCALE: Record<string, { cap: number; width: string }> = {
  besar: { cap: 320, width: "100%" },
  sedang: { cap: 230, width: "74%" },
};

const INK: Record<string, { word: ColorToken; small: ColorToken }> = {
  gelap: { word: "primary", small: "neutral-dark" },
  terang: { word: "neutral-light", small: "neutral-light" },
};

// Alas bidang (foto tanpa area tenang): kata di pita solid primary seperti kepala majalah, foto
// di bawahnya tidak tertimpa teks.
const BAND_INK = { word: "secondary", small: "neutral-light" } as const;

function SampulEditorialSlide({ slots, options, style }: SlideProps) {
  const band = options.alas === "bidang";
  const ink = band ? BAND_INK : (INK[options.tinta ?? "gelap"] ?? INK.gelap);
  if (!ink) throw new Error("Tinta tidak dikenal");
  const image = slot(slots, "image", "image");
  const pembuka = optionalSlot(slots, "pembuka", "text");
  const sorot = optionalSlot(slots, "sorot", "text");
  const kredit = optionalSlot(slots, "kredit", "text");
  const top = options.zona !== "bawah";
  const scale = SCALE[options.skala ?? "besar"] ?? SCALE.besar;
  if (!scale) throw new Error("Skala tidak dikenal");
  const center = options.rata === "tengah";
  const align = center ? "center" : "left";
  const logo = <Logo slot="logo" src={slot(slots, "logo", "logo").src} height={6} />;
  // Baris kepala cetak (label kecil + garis) di atas judul, seperti baris edisi majalah. Di alas
  // bidang logo ikut di baris ini; di atas foto logo berdiri di sudut seberang.
  const masthead = (kredit || band) && (
    <div style={{ width: "100%", display: "grid", gap: space(3), marginBottom: space(2) }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: kredit ? "space-between" : "flex-end",
          gap: space(4),
        }}
      >
        {kredit && (
          <AccentText slot="kredit" caps color={ink.small}>
            {kredit.value}
          </AccentText>
        )}
        {band && logo}
      </div>
      <Rule color={ink.small} weight={2} />
    </div>
  );
  const title = (
    <>
      {masthead}
      {pembuka && (
        <AccentText slot="pembuka" size={3} color={ink.small} align={align}>
          {pembuka.value}
        </AccentText>
      )}
      <div style={{ width: scale.width }}>
        <BigWord
          slot="kata"
          rows={[slot(slots, "kata", "text").value]}
          color={ink.word}
          cap={scale.cap}
          mode="justify"
          align={align}
          lineHeight={LINE}
        />
      </div>
      <div
        style={{
          maxWidth: "78%",
          display: "grid",
          gap: space(1),
          justifyItems: center ? "center" : "start",
        }}
      >
        <Text slot="headline" font="body" size={2} strong color={ink.small} balance>
          {slot(slots, "headline", "text").value}
        </Text>
        {sorot && (
          <Text
            slot="sorot"
            font="body"
            size={2}
            strong
            color="neutral-dark"
            highlight={{ text: sorot.value, background: "accent", color: "neutral-dark", tilt: -1 }}
          >
            {sorot.value}
          </Text>
        )}
      </div>
    </>
  );
  const titleStyle = {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr)",
    justifyItems: center ? "center" : "start",
    textAlign: align,
    gap: space(2),
  } as const;
  if (band) {
    return (
      <div
        style={{
          position: "relative",
          height: "100%",
          overflow: "hidden",
          display: "flex",
          flexDirection: top ? "column" : "column-reverse",
          background: color("primary"),
        }}
      >
        <div
          data-qa-element="group"
          data-qa-name="judul"
          style={{
            ...titleStyle,
            position: "relative",
            zIndex: LAYER.text,
            padding: top ? `${EDGE} ${EDGE} ${space(6)}` : `${space(6)} ${EDGE} ${EDGE}`,
            background: color("primary"),
          }}
        >
          {title}
        </div>
        <div style={{ position: "relative", flex: 1 }}>
          <Photo slot="image" src={image.src} treatment={styleTreatment(style)} />
        </div>
        <StyleOverlay style={style} surface="photo" />
      </div>
    );
  }
  return (
    <div style={{ position: "relative", height: "100%", overflow: "hidden" }}>
      <div data-qa-element="background" style={{ position: "absolute", inset: 0 }}>
        <Photo slot="image" src={image.src} treatment={styleTreatment(style)} />
      </div>
      <div
        data-qa-element="group"
        data-qa-name="judul"
        style={{
          ...titleStyle,
          position: "absolute",
          zIndex: LAYER.text,
          left: EDGE,
          right: EDGE,
          ...(top
            ? { top: `calc(${EDGE} + ${space(3)})` }
            : { bottom: `calc(${EDGE} + ${space(8)})` }),
        }}
      >
        {title}
      </div>
      <div
        style={{
          position: "absolute",
          zIndex: LAYER.text,
          ...(top ? { bottom: EDGE } : { top: EDGE }),
          ...(options.logo === "kiri" ? { left: EDGE } : { right: EDGE }),
        }}
      >
        {logo}
      </div>
      <StyleOverlay style={style} surface="photo" />
    </div>
  );
}

export const sampulEditorial: Template = {
  meta: {
    id: "feed-sampul-editorial",
    name: "Sampul editorial",
    format: "feed-4x5",
    description:
      "Sampul majalah 70-an: foto penuh bernuansa film dengan area tenang (langit, dinding, kain), satu kata raksasa di area itu, pembuka kecil di atasnya, satu kalimat dengan penutup yang disorot warna aksen, baris kepala kecil di atas judul, dan logo di sudut seberang. Untuk edukasi, cerita brand, atau sampul carousel; foto wajib punya area tenang 35–45% di atas atau bawah.",
    slots: [
      {
        name: "image",
        type: "image",
        required: true,
        description:
          "Foto penuh bernuansa film dengan area tenang polos (langit, dinding, kain) di atas atau bawah",
        aspectRatio: "4:5",
      },
      {
        name: "kata",
        type: "text",
        required: true,
        description: "Satu kata kunci atau angka dari copy, ditampilkan raksasa dalam satu baris",
        maxChars: 9,
      },
      {
        name: "pembuka",
        type: "text",
        required: false,
        description: "Pembuka 1–3 kata huruf kecil yang dibaca sebelum kata kunci",
        maxChars: 18,
      },
      {
        name: "headline",
        type: "text",
        required: true,
        description: "Satu kalimat pendek yang melanjutkan kata kunci",
        maxChars: 44,
      },
      {
        name: "sorot",
        type: "text",
        required: false,
        description: "Penutup kalimat 2–4 kata di baris sendiri, disorot warna aksen",
        maxChars: 24,
      },
      {
        name: "kredit",
        type: "text",
        required: false,
        description: "Baris kepala kecil di atas judul: produk, harga, lokasi, atau edisi",
        maxChars: 30,
      },
      {
        name: "logo",
        type: "logo",
        required: true,
        description: "Logo; pakai onDark bila sudut logo di area foto gelap atau di alas bidang",
      },
    ],
    options: [
      {
        name: "zona",
        values: ["atas", "bawah"],
        default: "atas",
        description: "Letak judul di area tenang foto; logo di tepi seberang",
      },
      {
        name: "tinta",
        values: ["gelap", "terang"],
        default: "gelap",
        description: "Warna teks: gelap di area foto terang, terang di area foto gelap",
      },
      {
        name: "alas",
        values: ["foto", "bidang"],
        default: "foto",
        description:
          "foto: kata di area tenang foto; bidang: kata di pita primary, foto di sisa kanvas (foto tanpa area tenang)",
      },
      {
        name: "skala",
        values: ["besar", "sedang"],
        default: "besar",
        description: "Ukuran kata: besar mengisi lebar, sedang untuk area tenang yang sempit",
      },
      {
        name: "logo",
        values: ["kanan", "kiri"],
        default: "kanan",
        description:
          "Sudut logo di tepi seberang judul (bawah bila zona atas), mengikuti aturan brand dan sisi foto yang tenang",
      },
      {
        name: "rata",
        values: ["kiri", "tengah"],
        default: "kiri",
        description: "Perataan blok judul",
      },
    ],
  },
  Slide: SampulEditorialSlide,
};
