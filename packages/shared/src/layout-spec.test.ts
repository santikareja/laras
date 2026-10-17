import { describe, expect, it } from "vitest";
import { LayoutSpec } from "./layout-spec.ts";
import { issuesOf } from "./test-utils.ts";

const spec = (): LayoutSpec => ({
  templateId: "feed-hero-photo",
  format: "feed-4x5",
  slides: [
    {
      slots: {
        headline: { type: "text", value: "Pagi cerah, kopi hemat" },
        photo: { type: "image", assetId: "bg-01" },
        logo: { type: "logo", variant: "onDark" },
        badge: { type: "badge", value: "-20%" },
      },
      options: { align: "left" },
    },
  ],
  assetRequests: [
    { id: "bg-01", description: "Cangkir kopi di meja kayu, cahaya pagi", aspectRatio: "4:5" },
  ],
});

describe("LayoutSpec", () => {
  it("menerima spec dengan slot teks, gambar, logo, dan badge", () => {
    expect(issuesOf(LayoutSpec, spec())).toEqual([]);
  });

  it("menolak slot gambar yang merujuk aset tidak dikenal", () => {
    const s = spec();
    s.assetRequests = [];
    expect(issuesOf(LayoutSpec, s)).toContain(
      'Slot gambar merujuk aset "bg-01" yang tidak ada di assetRequests',
    );
  });

  it("menolak id aset ganda dan rasio yang salah format", () => {
    const s = spec();
    const request = s.assetRequests[0];
    if (!request) throw new Error("fixture tanpa assetRequests");
    s.assetRequests = [request, request];
    expect(issuesOf(LayoutSpec, s)).toContain('Id aset "bg-01" dipakai lebih dari sekali');
    expect(
      issuesOf(LayoutSpec, { ...spec(), assetRequests: [{ ...request, aspectRatio: "4x5" }] }),
    ).toContain("Rasio berformat lebar:tinggi, mis. 4:5");
  });

  it("menolak tipe slot, varian logo, dan jumlah slide yang tidak sah", () => {
    const badSlot = {
      ...spec(),
      slides: [{ slots: { x: { type: "video", value: "a" } }, options: {} }],
    };
    expect(LayoutSpec.safeParse(badSlot).success).toBe(false);
    const badLogo = {
      ...spec(),
      slides: [{ slots: { logo: { type: "logo", variant: "gold" } }, options: {} }],
    };
    expect(LayoutSpec.safeParse(badLogo).success).toBe(false);
    expect(issuesOf(LayoutSpec, { ...spec(), slides: [] })).toContain(
      "Format feed-4x5 harus berisi tepat 1 slide",
    );
  });
});
