import { describe, expect, it } from "vitest";
import { CopyDraft } from "./copy-draft.ts";
import { issuesOf } from "./test-utils.ts";

const draft = (): CopyDraft => ({
  slides: [
    {
      headline: "Pagi cerah, kopi hemat",
      subheadline: "Diskon 20% sampai Minggu",
      cta: "Mampir sebelum kerja",
    },
  ],
  caption: "Kopi pagimu lebih hemat minggu ini.",
  hashtags: ["#kopipagi", "#promo_kopi", "#Jakarta2026"],
});

describe("CopyDraft", () => {
  it("menerima draf feed dengan caption dan hashtag", () => {
    expect(issuesOf(CopyDraft, draft())).toEqual([]);
  });

  it("menerima slide daftar dengan items", () => {
    const list: CopyDraft = {
      ...draft(),
      slides: [{ headline: "Tiga alasan", items: ["Murah", "Cepat", "Enak"] }],
    };
    expect(issuesOf(CopyDraft, list)).toEqual([]);
  });

  it("menolak slide tanpa teks dan teks berisi spasi saja", () => {
    expect(issuesOf(CopyDraft, { ...draft(), slides: [{}] })).toContain(
      "Setiap slide butuh minimal satu teks",
    );
    expect(CopyDraft.safeParse({ ...draft(), slides: [{ headline: "   " }] }).success).toBe(false);
  });

  it("menolak hashtag yang tidak sah dan lebih dari 30 hashtag", () => {
    expect(issuesOf(CopyDraft, { ...draft(), hashtags: ["#kopi pagi"] })).toContain(
      "Hashtag harus berbentuk #kata tanpa spasi",
    );
    expect(CopyDraft.safeParse({ ...draft(), hashtags: ["kopi"] }).success).toBe(false);
    const many = Array.from({ length: 31 }, (_, i) => `#tag${i}`);
    expect(CopyDraft.safeParse({ ...draft(), hashtags: many }).success).toBe(false);
  });

  it("menolak caption beserta hashtag lebih dari 2200 karakter", () => {
    const long = { ...draft(), caption: "a".repeat(2190) };
    expect(issuesOf(CopyDraft, long)).toContain("Caption beserta hashtag maksimal 2200 karakter");
  });

  it("menolak field slide yang tidak dikenal", () => {
    expect(CopyDraft.safeParse({ ...draft(), slides: [{ title: "x" }] }).success).toBe(false);
  });
});
