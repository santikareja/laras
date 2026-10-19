import type { ColorToken, GlowMode, TextEffect } from "../../primitives/index.ts";
import {
  Display,
  Grain,
  HudFrame,
  HudLabel,
  NeonRail,
  Photo,
  PixelScatter,
  Ticker,
} from "../../primitives/index.ts";
import { space } from "../../primitives/vars.ts";
import type { EffectRole, SpecimenProps, StyleLayerProps, StyleRender } from "../../src/style.ts";
import { AtCorner } from "../corner.tsx";
import { SpecimenCell, SpecimenGrid } from "../specimen-grid.tsx";

// Lapisan gaya Cyberpunk/Futuristik (PANDUAN.md bagian 6, 7, 12): glow satu token (padat untuk
// brand tanpa gradient), subjek mono dengan scanline dan halo, rel neon di lantai, piksel lepas di
// sisi subjek, bingkai HUD, dan label HUD dari copy. Teks body tidak pernah diberi glow.

const GLOW = "accent" as const;
const mode = (options: Record<string, string>): GlowMode =>
  options.glow === "solid" ? "solid" : "soft";
// Token cahaya dari opsi gaya (default accent).
const light = (options: Record<string, string>): ColorToken =>
  options.cahaya === "primary" || options.cahaya === "secondary" ? options.cahaya : GLOW;

// Kata raksasa: satu jenis glitch (iris geser, pemisahan kanal cahaya + accent, atau gema warna
// cahaya), atau tanpa glitch untuk heading serif (bagian 5). Headline besar: glow.
function textEffect(options: Record<string, string>, role: EffectRole): TextEffect | undefined {
  if (role === "headline")
    return options.glow === "tidak"
      ? undefined
      : { kind: "glow", color: light(options), mode: mode(options) };
  if (options.glitch === "kanal") {
    const other: ColorToken = light(options) === "accent" ? "primary" : "accent";
    return { kind: "glitch", mode: "split", colors: [light(options), other] };
  }
  if (options.glitch === "gema") return { kind: "glitch", mode: "echo", color: light(options) };
  if (options.glitch === "tidak") return undefined;
  return { kind: "glitch", mode: "slice", bands: 1 };
}

function Backdrop({ style, floor }: StyleLayerProps) {
  return (
    <>
      {style.options.tekstur === "grain" && <Grain tone="neutral-light" opacity={0.06} />}
      <div style={{ position: "absolute", top: "36%", right: 0, width: "18%", height: "34%" }}>
        <PixelScatter
          mode="grid"
          tone={light(style.options)}
          side="left"
          cols={4}
          rows={8}
          cell={40}
        />
      </div>
      {floor && (
        <div style={{ position: "absolute", left: "12%", right: "12%", bottom: floor }}>
          <NeonRail color={light(style.options)} mode={mode(style.options)} thickness={4} />
        </div>
      )}
    </>
  );
}

function Overlay({ label, corner }: StyleLayerProps) {
  return (
    <>
      <HudFrame color="neutral-light" arm={56} opacity={0.8} />
      {label && corner && (
        <AtCorner corner={corner}>
          <div style={{ padding: space(4) }}>
            <HudLabel slot="label" color="neutral-light" format="slash">
              {label}
            </HudLabel>
          </div>
        </AtCorner>
      )}
    </>
  );
}

function Specimen({ subject, photo, style }: SpecimenProps) {
  const word = (effect: Parameters<typeof Display>[0]["effect"]) => (
    <div style={{ padding: space(3) }}>
      <Display font="heading" scale={1} color="neutral-light" effect={effect}>
        NEON
      </Display>
    </div>
  );
  return (
    <SpecimenGrid columns={3} rows={4}>
      <SpecimenCell name="Glow lunak" background="neutral-dark">
        {word({ kind: "glow", color: GLOW, mode: "soft" })}
      </SpecimenCell>
      <SpecimenCell name="Glow padat" background="neutral-dark">
        {word({ kind: "glow", color: GLOW, mode: "solid" })}
      </SpecimenCell>
      <SpecimenCell name="Glitch iris" background="neutral-dark">
        {word({ kind: "glitch", mode: "slice", bands: 1 })}
      </SpecimenCell>
      <SpecimenCell name="Glitch kanal" background="neutral-dark">
        {word({ kind: "glitch", mode: "split", colors: ["primary", "accent"] })}
      </SpecimenCell>
      <SpecimenCell name="Glitch gema" background="neutral-dark">
        {word({ kind: "glitch", mode: "echo", color: GLOW })}
      </SpecimenCell>
      <SpecimenCell name="Halo dan scanline" background="neutral-dark">
        <Photo
          src={subject}
          fit="contain"
          treatment={{
            kind: "neon",
            mono: true,
            scanline: true,
            glow: GLOW,
            mode: mode(style.options),
          }}
        />
      </SpecimenCell>
      <SpecimenCell name="Bingkai HUD" background="neutral-dark">
        <HudFrame
          color="neutral-light"
          arm={40}
          ticks={{ side: "bottom", count: 5 }}
          plus={[[0.5, 0.5]]}
        />
      </SpecimenCell>
      <SpecimenCell name="Label HUD" background="neutral-dark" style={{ padding: space(3) }}>
        <div style={{ display: "grid", gap: space(2) }}>
          <HudLabel color="neutral-light">Kategori</HudLabel>
          <HudLabel color="neutral-light" format="slash">
            Lokasi
          </HudLabel>
          <HudLabel color="neutral-dark" band={GLOW} format="count" current={2} total={6} />
        </div>
      </SpecimenCell>
      <SpecimenCell name="Piksel lepas" background="neutral-dark">
        <PixelScatter mode="scatter" tone={GLOW} side="left" count={24} />
      </SpecimenCell>
      <SpecimenCell name="Foto mono, grain" background="neutral-dark">
        <Photo src={photo} treatment={{ kind: "mono" }} />
        <Grain tone="neutral-light" opacity={0.08} />
      </SpecimenCell>
      <SpecimenCell
        name="Rel neon"
        background="neutral-dark"
        style={{ display: "grid", alignContent: "center", gap: space(4), padding: space(3) }}
      >
        <NeonRail color={GLOW} mode="soft" thickness={4} />
        <NeonRail color={GLOW} mode="solid" thickness={4} />
      </SpecimenCell>
      <SpecimenCell
        name="Pita berulang"
        background="neutral-dark"
        style={{ display: "grid", alignContent: "center" }}
      >
        <Ticker items={["Laras", "Gaya"]} color="neutral-dark" background={GLOW} />
      </SpecimenCell>
    </SpecimenGrid>
  );
}

export const cyberpunkRender: StyleRender = {
  variables: () => [],
  // Tanpa halo: foto apa adanya atau mono, tanpa scanline (subjek sudah bercahaya tepi).
  treatment: ({ options }) =>
    options.glow === "tidak"
      ? { kind: options.foto === "natural" ? "natural" : "mono" }
      : {
          kind: "neon",
          mono: options.foto !== "natural",
          scanline: options.tekstur === "scanline",
          glow: light(options),
          mode: mode(options),
        },
  effect: ({ options }, role) => textEffect(options, role),
  Backdrop,
  Overlay,
  Specimen,
};
