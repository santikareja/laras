import { describe, expect, it } from "vitest";
import { ContentPlan } from "./content-plan.ts";
import { issuesOf } from "./test-utils.ts";

const feedPlan = (): ContentPlan => ({
  format: "feed-4x5",
  keyMessage: "Promo kopi pagi diskon 20% sampai Minggu",
  audience: "Pekerja kantoran di sekitar toko",
  slides: [{ role: "hook", intent: "Tarik perhatian dengan diskon" }],
  angles: [
    { id: "a1", angle: "Hemat sebelum kerja", rationale: "Harga jadi alasan utama" },
    { id: "a2", angle: "Ritual pagi yang tenang", rationale: "Menjual suasana" },
    { id: "a3", angle: "Terbatas sampai Minggu", rationale: "Urgensi" },
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
});
