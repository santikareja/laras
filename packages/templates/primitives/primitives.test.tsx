import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Badge, Display, Frame, Grid, Image, Logo, Scribble, Sticker, Text } from "./index.ts";
import { fontSize } from "./vars.ts";

const html = renderToStaticMarkup;

// Properti yang wajib berasal dari token brand (CLAUDE.md, ARCH 6.2).
const TOKEN_PROPERTIES = ["color", "background", "font-family", "font-weight", "font-size"];

function styleDeclarations(markup: string): [string, string][] {
  return [...markup.matchAll(/style="([^"]*)"/g)].flatMap((match) =>
    (match[1] ?? "")
      .split(";")
      .filter(Boolean)
      .map((declaration): [string, string] => {
        const [property = "", ...value] = declaration.split(":");
        return [property.trim(), value.join(":").trim()];
      }),
  );
}

describe("primitives", () => {
  it("Text heading", () => {
    const markup = html(
      <Text slot="headline" font="heading" size={6} color="primary">
        Kopi pagi
      </Text>,
    );
    expect(markup).toMatchSnapshot();
    expect(markup).toMatch(/^<h2 data-slot="headline"/);
  });

  it("Text body tebal sebagai elemen pilihan", () => {
    const markup = html(
      <Text as="span" font="body" size={1} color="neutral-dark" strong>
        Buka 07.00
      </Text>,
    );
    expect(markup).toMatchSnapshot();
    expect(markup).toContain("font-weight:var(--font-body-weight-strong)");
  });

  it("Badge", () => {
    const markup = html(
      <Badge slot="promo" background="accent" color="neutral-dark">
        -20%
      </Badge>,
    );
    expect(markup).toMatchSnapshot();
  });

  it("Image", () => {
    const markup = html(
      <Image slot="hero" src="file:///job/assets/hero.png" fit="contain" rounded />,
    );
    expect(markup).toMatchSnapshot();
  });

  it("Logo", () => {
    expect(
      html(<Logo slot="logo" src="file:///p/logo/primary.svg" height={6} />),
    ).toMatchSnapshot();
  });

  it("Grid", () => {
    const markup = html(
      <Grid columns={6} rows="1fr auto" gap={4} inset background="neutral-light">
        <span>isi</span>
      </Grid>,
    );
    expect(markup).toMatchSnapshot();
  });

  it("Image, Grid, dan slot tanpa nilai tidak menulis atribut kosong", () => {
    const markup = html(
      <Grid gap={2}>
        <Image src="a.png" />
      </Grid>,
    );
    expect(markup).not.toContain("data-slot");
    expect(markup).not.toContain("padding");
    expect(markup).not.toContain("background");
    expect(markup).not.toContain("border-radius");
  });

  it("warna, font, dan ukuran font semuanya dari CSS variables brand", () => {
    const markup = html(
      <Grid gap={4} inset background="secondary">
        <Text font="heading" size={5} color="primary">
          Judul
        </Text>
        <Text font="body" size={2} color="neutral-dark">
          Isi
        </Text>
        <Badge background="accent" color="neutral-light">
          Baru
        </Badge>
        <Image src="a.png" />
        <Logo src="b.svg" height={5} />
      </Grid>,
    );
    const declarations = styleDeclarations(markup);
    const governed = declarations.filter(([property]) => TOKEN_PROPERTIES.includes(property));
    expect(governed.length).toBeGreaterThan(10);
    for (const [property, value] of governed) {
      expect(`${property}: ${value}`).toMatch(/: var\(--/);
    }
  });

  it("Display: kelipatan skala brand dibatasi lebar kotak", () => {
    const markup = html(
      <Display slot="kata" font="heading" scale={2.5} color="accent">
        SANGRAI
      </Display>,
    );
    expect(markup).toMatchSnapshot();
    expect(markup).toContain("container-type:inline-size");
    expect(markup).toContain("calc(100cqw / 4.90)");
  });

  it("Text dengan sorot: tanda baca sesudahnya tidak terpisah baris", () => {
    const markup = html(
      <Text
        slot="headline"
        font="heading"
        size={6}
        color="primary"
        highlight={{ text: "minggu ini", background: "accent", color: "neutral-dark" }}
      >
        Disangrai minggu ini, bukan bulan lalu.
      </Text>,
    );
    expect(markup).toMatchSnapshot();
    expect(markup).toContain('<span style="white-space:nowrap"><span');
    expect(markup).toMatch(/minggu ini<\/span>,<\/span> bukan bulan lalu\.</);
  });

  it("Text dengan sorot yang tidak ada di teks dirender biasa", () => {
    const markup = html(
      <Text
        font="body"
        size={2}
        color="primary"
        highlight={{ text: "x", background: "accent", color: "primary" }}
      >
        Tanpa sorot
      </Text>,
    );
    expect(markup).not.toContain("nowrap");
  });

  it("Text body dengan panjang baris dan baris seimbang (PRD 4 P4)", () => {
    const markup = html(
      <Text font="body" size={2} color="neutral-dark" measure={40} balance>
        Setiap perawatan diawali konsultasi gratis dan foto kondisi kulit.
      </Text>,
    );
    expect(markup).toContain("max-width:40ch");
    expect(markup).toContain("text-wrap:balance");
    expect(
      html(
        <Text font="body" size={2} color="primary">
          Isi
        </Text>,
      ),
    ).not.toContain("max-width");
  });

  it("Sticker, Scribble, dan Frame", () => {
    expect(
      html(
        <Sticker
          slot="stiker"
          background="primary"
          color="neutral-light"
          edge="neutral-light"
          rotate={-6}
        >
          5:45 AM
        </Sticker>,
      ),
    ).toMatchSnapshot();
    const scribble = html(<Scribble shape="underline" color="accent" rotate={4} flip />);
    expect(scribble).toMatchSnapshot();
    expect(scribble).toContain('aria-hidden="true"');
    expect(scribble).not.toContain("data-slot");
    expect(
      html(<Frame slot="image" src="a.png" edge="neutral-light" rotate={-4} />),
    ).toMatchSnapshot();
  });

  it("perangkat grafis juga hanya memakai CSS variables brand", () => {
    const markup = html(
      <div>
        <Display font="heading" scale={2} color="primary">
          5K
        </Display>
        <Text
          font="heading"
          size={5}
          color="primary"
          highlight={{ text: "5K", background: "accent", color: "neutral-dark" }}
        >
          First 5K
        </Text>
        <Sticker background="accent" color="neutral-dark" edge="neutral-light">
          Gratis
        </Sticker>
        <Scribble shape="arrow" color="primary" />
        <Frame src="a.png" edge="neutral-light" />
      </div>,
    );
    const governed = styleDeclarations(markup).filter(([property]) =>
      TOKEN_PROPERTIES.includes(property),
    );
    expect(governed.length).toBeGreaterThan(10);
    for (const [property, value] of governed) {
      expect(`${property}: ${value}`).toMatch(/: (?:var\(--|min\(calc\(var\(--)/);
    }
    expect(markup).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(/i);
  });

  it("ukuran font jatuh ke langkah terbesar yang ada di skala brand", () => {
    expect(fontSize(1)).toBe("var(--font-size-1)");
    expect(fontSize(3)).toBe("var(--font-size-3, var(--font-size-2, var(--font-size-1)))");
  });
});
