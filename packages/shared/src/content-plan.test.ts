import { describe, expect, it } from "vitest";
import { ContentPlan } from "./content-plan.ts";
import { issuesOf } from "./test-utils.ts";

const visual = () => ({
  idea: "Cangkir kopi sebagai jam pagi",
  image: "a coffee cup whose saucer is a clock face at 7 a.m.",
  kind: "concept" as const,
});

const feedPlan = (): ContentPlan => ({
  format: "feed-4x5",
  keyMessage: "Promo kopi pagi diskon 20% sampai Minggu",
  audience: "Pekerja kantoran di sekitar toko",
  setting: {
    location: "a quiet alley in Bandung, Indonesia",
    people: "Indonesian office workers in their twenties and thirties",
  },
  slides: [{ role: "hook", intent: "Tarik perhatian dengan diskon" }],
  angles: [
    {
      id: "a1",
      angle: "Hemat sebelum kerja",
      rationale: "Harga jadi alasan utama",
      visual: visual(),
    },
    { id: "a2", angle: "Ritual pagi yang tenang", rationale: "Menjual suasana", visual: visual() },
    { id: "a3", angle: "Terbatas sampai Minggu", rationale: "Urgensi", visual: visual() },
  ],
});

describe("ContentPlan", () => {
  it("menerima plan feed dengan tiga angle", () => {
    expect(issuesOf(ContentPlan, feedPlan())).toEqual([]);
  });

  it("menerima plan carousel 2–20 slide", () => {
    const plan: ContentPlan = {
      ...feedPlan(),
      format: "carousel-4x5",
      slides: [
        { role: "hook", intent: "Buka dengan pertanyaan" },
        { role: "list", intent: "Tiga alasan" },
        { role: "cta", intent: "Ajak datang" },
      ],
    };
    expect(issuesOf(ContentPlan, plan)).toEqual([]);
  });

  it("menolak jumlah slide yang tidak sesuai format", () => {
    const feed = { ...feedPlan(), slides: [...feedPlan().slides, { role: "cta", intent: "x" }] };
    expect(issuesOf(ContentPlan, feed)).toContain("Format feed-4x5 harus berisi tepat 1 slide");
    const carousel = { ...feedPlan(), format: "carousel-4x5" };
    expect(issuesOf(ContentPlan, carousel)).toContain(
      "Format carousel-4x5 harus berisi 2–20 slide",
    );
  });

  it("menolak lebih dari empat angle", () => {
    const angles = [1, 2, 3, 4, 5].map((n) => ({
      id: `a${n}`,
      angle: `Angle ${n}`,
      rationale: "r",
      visual: visual(),
    }));
    expect(ContentPlan.safeParse({ ...feedPlan(), angles }).success).toBe(false);
  });

  it("menolak id angle ganda dan angle yang sama", () => {
    const plan = feedPlan();
    const sameId = { ...plan, angles: [plan.angles[0], { ...plan.angles[1], id: "a1" }] };
    expect(issuesOf(ContentPlan, sameId)).toContain('Id angle "a1" dipakai lebih dari sekali');
    const sameAngle = {
      ...plan,
      angles: [plan.angles[0], { ...plan.angles[1], angle: " hemat SEBELUM kerja " }],
    };
    expect(issuesOf(ContentPlan, sameAngle)).toContain(
      "Setiap varian harus memakai angle yang berbeda",
    );
  });

  it("menolak role slide dan key yang tidak dikenal", () => {
    expect(
      ContentPlan.safeParse({ ...feedPlan(), slides: [{ role: "intro", intent: "x" }] }).success,
    ).toBe(false);
    expect(ContentPlan.safeParse({ ...feedPlan(), tone: "santai" }).success).toBe(false);
  });

  it("konsep visual per angle dan setting wajib; jenis gambar dari enum (T-125)", () => {
    const { setting: _, ...noSetting } = feedPlan();
    expect(issuesOf(ContentPlan, noSetting)).not.toEqual([]);
    const plan = feedPlan();
    const noVisual = { ...plan, angles: plan.angles.map(({ visual: __, ...a }) => a) };
    expect(issuesOf(ContentPlan, noVisual)).not.toEqual([]);
    const badKind = {
      ...plan,
      angles: plan.angles.map((a) => ({ ...a, visual: { ...a.visual, kind: "video" } })),
    };
    expect(issuesOf(ContentPlan, badKind)).not.toEqual([]);
  });
});
