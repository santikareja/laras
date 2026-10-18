import { describe, expect, it } from "vitest";
import { CopyGuide } from "./copy-guide.ts";
import { issuesOf } from "./test-utils.ts";

const guide = (): CopyGuide => ({
  language: "id",
  tone: "Hangat dan akrab, memakai sapaan kamu",
  examples: {
    good: ["Pagi ini kopinya lebih hemat, mampir sebentar yuk."],
    bad: ["DAPATKAN PROMO TERBAIK SEKARANG JUGA!!!"],
  },
  forbiddenWords: ["termurah", "terbaik se-Indonesia"],
  ctaStyle: "Ajakan santai dengan kata kerja, tanpa tanda seru beruntun",
  emoji: { allowed: true, max: 2 },
  hashtags: { max: 5, always: ["#kopilembayung"] },
});

describe("CopyGuide", () => {
  it("menerima panduan copy lengkap", () => {
    expect(issuesOf(CopyGuide, guide())).toEqual([]);
  });

  it("menerima bahasa en dan emoji yang dilarang dengan batas 0", () => {
    expect(
      issuesOf(CopyGuide, { ...guide(), language: "en", emoji: { allowed: false, max: 0 } }),
    ).toEqual([]);
  });

  it("menolak bahasa di luar id dan en", () => {
    expect(CopyGuide.safeParse({ ...guide(), language: "jv" }).success).toBe(false);
  });

  it("menolak batas emoji saat emoji dilarang", () => {
    expect(issuesOf(CopyGuide, { ...guide(), emoji: { allowed: false, max: 3 } })).toContain(
      "Batas emoji harus 0 bila emoji tidak diizinkan",
    );
  });

  it("menolak hashtag wajib yang melebihi batas atau salah format", () => {
    expect(
      issuesOf(CopyGuide, { ...guide(), hashtags: { max: 1, always: ["#a", "#b"] } }),
    ).toContain("Hashtag wajib tidak boleh melebihi batas hashtag");
    expect(
      CopyGuide.safeParse({ ...guide(), hashtags: { max: 5, always: ["kopi"] } }).success,
    ).toBe(false);
    expect(CopyGuide.safeParse({ ...guide(), hashtags: { max: 31, always: [] } }).success).toBe(
      false,
    );
  });

  it("menolak contoh benar kosong dan key yang tidak dikenal", () => {
    expect(CopyGuide.safeParse({ ...guide(), examples: { good: [], bad: [] } }).success).toBe(
      false,
    );
    expect(CopyGuide.safeParse({ ...guide(), persona: "barista" }).success).toBe(false);
  });
});
