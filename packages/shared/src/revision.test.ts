import { describe, expect, it } from "vitest";
import { Revision } from "./revision.ts";
import { issuesOf } from "./test-utils.ts";

const revision = (regenerateAssets: string[]) => ({
  copy: {
    slides: [{ headline: "Roti hangat jam tujuh" }],
    caption: "Mampir pagi ini.",
    hashtags: [],
  },
  layout: {
    templateId: "feed-foto-teks",
    format: "feed-4x5",
    slides: [{ slots: { image: { type: "image", assetId: "roti" } }, options: {} }],
    assetRequests: [{ id: "roti", description: "Roti di rak kayu", aspectRatio: "3:2" }],
  },
  regenerateAssets,
  summary: "Headline dipersingkat.",
});

describe("Revision", () => {
  it("menerima revisi dengan aset yang dibuat ulang dari assetRequests", () => {
    expect(issuesOf(Revision, revision([]))).toEqual([]);
    expect(issuesOf(Revision, revision(["roti"]))).toEqual([]);
  });

  it("menolak aset yang tidak ada di layout", () => {
    expect(issuesOf(Revision, revision(["kue"]))).toContain(
      'Aset "kue" tidak ada di assetRequests layout',
    );
  });
});
