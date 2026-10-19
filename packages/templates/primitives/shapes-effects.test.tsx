import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Display } from "./Display.tsx";
import { Glow, NeonRail, type TextEffect } from "./Effects.tsx";
import {
  Blob,
  CurvedPanel,
  Disc,
  FloorShadow,
  Rainbow,
  Ring,
  RoundBadge,
  Scallop,
  Starburst,
  Swoosh,
} from "./Shapes.tsx";
import { Text } from "./Text.tsx";

const html = renderToStaticMarkup;
const count = (markup: string, pattern: RegExp) => markup.match(pattern)?.length ?? 0;

const EFFECTS: TextEffect[] = [
  { kind: "glow", color: "primary" },
  { kind: "glow", color: "accent", mode: "solid" },
  { kind: "glitch", mode: "slice", bands: 2 },
  { kind: "glitch", mode: "split", colors: ["primary", "accent"] },
  { kind: "glitch", mode: "echo", color: "accent" },
  { kind: "ink-wear", wear: "heavy" },
  { kind: "misregister", color: "secondary" },
  { kind: "retro", outline: "neutral-dark", shadow: "accent" },
];

describe("efek teks", () => {
  it("salinan dekoratif tanpa slot, aria-hidden, dan tidak terkena titik ukur QA", () => {
    for (const effect of EFFECTS) {
      const markup = html(
        <Display slot="kata" font="heading" scale={2} stack color="neutral-light" effect={effect}>
          LARI MALAM
        </Display>,
      );
      expect(count(markup, /data-slot="kata"/g)).toBe(1);
      const copies = count(markup, /aria-hidden="true" style="position:absolute;inset:0/g);
      expect(count(markup, /pointer-events:none/g)).toBe(copies);
      // Setiap lapisan (asli dan salinan) tetap dipaskan renderer: dua baris per lapisan.
      expect(count(markup, /<span data-fit="width"/g)).toBe(2 * (copies + 1));
    }
  });

  it("salinan memakai warna token dan mode campur sesuai panduan", () => {
    const split = html(
      <Display font="heading" scale={2} color="neutral-light" effect={EFFECTS[3] as TextEffect}>
        GLITCH
      </Display>,
    );
    expect(count(split, /mix-blend-mode:screen/g)).toBe(2);
    expect(split).toContain("translateX(-0.03em)");
    const misregister = html(
      <Text
        slot="headline"
        font="heading"
        size={6}
        color="primary"
        effect={EFFECTS[6] as TextEffect}
      >
        Cetak ulang
      </Text>,
    );
    expect(misregister).toContain("mix-blend-mode:multiply");
    expect(misregister).toContain("translate(4px, 4px)");
    expect(misregister).toContain("color:var(--color-secondary)");
  });

  it("glow, tinta aus, dan huruf retro hanya mengubah gaya teks asli", () => {
    const glow = html(
      <Display
        slot="kata"
        font="heading"
        scale={2}
        color="neutral-light"
        effect={EFFECTS[0] as TextEffect}
      >
        NEON
      </Display>,
    );
    expect(glow).toContain(
      "text-shadow:0 0 0.04em color-mix(in srgb, var(--color-primary) 80%, transparent)",
    );
    expect(glow).not.toContain("aria-hidden");
    const solid = html(
      <Display font="heading" scale={2} color="neutral-light" effect={EFFECTS[1] as TextEffect}>
        NEON
      </Display>,
    );
    expect(solid).toContain("filter:url(#laras-glow-padat-accent)");
    expect(solid).toContain('id="laras-glow-padat-accent"');
    const ink = html(
      <Display font="heading" scale={2} color="neutral-dark" effect={EFFECTS[5] as TextEffect}>
        AUS
      </Display>,
    );
    expect(ink).toContain("mask-composite:exclude");
    expect(ink).toContain("data:image/svg+xml");
  });

  it("headline dua nada: frasa atau kata tumpukan diberi warna kedua", () => {
    const text = html(
      <Text
        font="heading"
        size={5}
        color="neutral-dark"
        accentWords={{ text: "dua nada", color: "primary" }}
      >
        Headline dua nada rapi
      </Text>,
    );
    expect(text).toContain(
      'Headline <span style="color:var(--color-primary)">dua nada</span> rapi',
    );
    const stack = html(
      <Display
        font="heading"
        scale={2}
        stack
        color="neutral-dark"
        accentWords={{ text: "INI", color: "primary" }}
      >
        MINGGU INI
      </Display>,
    );
    expect(count(stack, /color:var\(--color-primary\)/g)).toBe(1);
    expect(stack).toMatch(/color:var\(--color-primary\)">INI<\/span>/);
  });

  it("sorot di salinan tetap mengambil tempat tetapi tidak terlihat", () => {
    const markup = html(
      <Text
        slot="headline"
        font="heading"
        size={6}
        color="primary"
        highlight={{ text: "pagi", background: "accent", color: "neutral-dark" }}
        effect={{ kind: "misregister", color: "secondary" }}
      >
        Edisi pagi
      </Text>,
    );
    expect(count(markup, /background:var\(--color-accent\)/g)).toBe(2);
    expect(count(markup, /visibility:hidden/g)).toBe(1);
  });
});

describe("bentuk", () => {
  it("bayangan lantai bawaan sama dengan elips feed-satu-objek", () => {
    expect(html(<FloorShadow />)).toBe(
      '<div data-qa-element="decor" style="position:absolute;left:30%;right:30%;bottom:19%;height:3%;border-radius:50%;background:var(--color-neutral-dark);opacity:0.18;filter:blur(14px)"></div>',
    );
    expect(html(<FloorShadow dark shift={4} />)).toContain("left:34%;right:26%");
  });

  it("deterministik, dekoratif, dan hanya memakai warna token", () => {
    const render = () =>
      html(
        <div>
          <Swoosh preset="wave" color="primary" ends="round" flipX />
          <Blob color="secondary" seed={3} />
          <Scallop color="neutral-light" ratio={1.2}>
            <span>isi</span>
          </Scallop>
          <CurvedPanel edge="notch" color="neutral-light" />
          <Disc color="secondary" diameter={600} />
          <Ring color="accent" diameter={600} />
          <Rainbow colors={["accent", "secondary", "primary"]} radius={240} gap={8} />
          <Glow color="primary">
            <span>subjek</span>
          </Glow>
          <NeonRail color="accent" mode="solid" />
        </div>,
      );
    const markup = render();
    expect(render()).toBe(markup);
    expect(markup).not.toContain("data-slot");
    expect(markup).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i);
    expect(markup).toContain("border:60px solid var(--color-accent)");
    expect(markup).toContain('stroke-dasharray="760 2000"');
  });

  it("starburst dan stiker bulat membawa teks copy sebagai badge", () => {
    const star = html(
      <Starburst slot="promo" color="neutral-dark" points={30}>
        Baru!
      </Starburst>,
    );
    expect(star).toContain('data-slot="promo" data-slot-type="badge"');
    // Titik dibatasi 20: 40 sudut poligon.
    expect(count(star.match(/polygon\(([^)]*)\)/)?.[1] ?? "", /%,/g)).toBe(39);
    expect(star).toContain("font-size:max(var(--font-size-2, var(--font-size-1)), 32px)");
    const badge = html(<RoundBadge color="neutral-dark" icon="star" />);
    expect(badge).not.toContain("data-slot");
    expect(badge).toContain("border:5px solid var(--color-neutral-dark)");
  });
});
