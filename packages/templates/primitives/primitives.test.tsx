import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Badge, Grid, Image, Logo, Text } from "./index.ts";
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

  it("ukuran font jatuh ke langkah terbesar yang ada di skala brand", () => {
    expect(fontSize(1)).toBe("var(--font-size-1)");
    expect(fontSize(3)).toBe("var(--font-size-3, var(--font-size-2, var(--font-size-1)))");
  });
});
