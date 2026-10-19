import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { inkOn, lightMode, plainWord, SplitWord, splitChunk } from "./parts.tsx";

// Perangkat arketipe khas Cyberpunk (T-134): potongan berpita dari kurung siku, warna huruf di
// atas warna cahaya, mode cahaya garis, dan lapisan depan kata tanpa slot.
describe("perangkat Cyberpunk", () => {
  it("memisah potongan berpita dari satu pasang kurung siku", () => {
    expect(splitChunk("DI[UNDUH]")).toEqual({ before: "DI", chunk: "UNDUH", after: "" });
    expect(splitChunk("[UP]GRADE")).toEqual({ before: "", chunk: "UP", after: "GRADE" });
    expect(splitChunk("UPGRADE")).toBeNull();
    expect(splitChunk("A[B]C[D]")).toBeNull();
    expect(splitChunk("[UP]GRADE [")).toBeNull();
    expect(plainWord("DI[UNDUH]")).toBe("DIUNDUH");
  });

  it("huruf terang di atas primary, gelap di atas accent dan secondary", () => {
    expect(inkOn("primary")).toBe("neutral-light");
    expect(inkOn("accent")).toBe("neutral-dark");
    expect(inkOn("secondary")).toBe("neutral-dark");
  });

  it("garis cahaya mengikuti opsi glow gaya Cyberpunk", () => {
    const cyber = (glow: string) => ({ id: "cyberpunk", variant: "neon-gelap", options: { glow } });
    expect(lightMode(undefined)).toBe("flat");
    expect(lightMode({ id: "brutalism", variant: "x", options: {} })).toBe("flat");
    expect(lightMode(cyber("soft"))).toBe("soft");
    expect(lightMode(cyber("solid"))).toBe("solid");
    // Glow "tidak" hanya mematikan halo subjek; garis tetap padat tanpa blur.
    expect(lightMode(cyber("tidak"))).toBe("solid");
  });

  it("lapisan depan kata hanya memperlihatkan potongan berpita, tanpa slot", () => {
    const props = { text: "DI[UNDUH]", ink: "neutral-light", band: "accent", scale: 2 } as const;
    const back = renderToStaticMarkup(<SplitWord {...props} slot="kata" />);
    const front = renderToStaticMarkup(<SplitWord {...props} slot="kata" front />);
    expect(back).toContain('data-slot="kata"');
    expect(back).toContain("DI<span");
    expect(front).not.toContain("data-slot");
    expect(front).toContain('aria-hidden="true"');
    expect(front).toContain("visibility:visible");
  });
});
