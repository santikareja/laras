import { z } from "zod";
import { HASHTAG_LIMIT, Hashtag, NonEmptyText } from "./common.ts";

// Bahasa konten ditetapkan per project (PRD 12 pertanyaan 2).
export const ContentLanguage = z.enum(["id", "en"]);
export type ContentLanguage = z.infer<typeof ContentLanguage>;

// copy-guide.json per project (PRD F4, ARCH 8.1).
export const CopyGuide = z.strictObject({
  language: ContentLanguage,
  tone: NonEmptyText,
  examples: z.strictObject({
    good: z.array(NonEmptyText).min(1),
    bad: z.array(NonEmptyText),
  }),
  forbiddenWords: z.array(NonEmptyText),
  ctaStyle: NonEmptyText,
  emoji: z
    .strictObject({ allowed: z.boolean(), max: z.int().min(0) })
    .refine((emoji) => emoji.allowed || emoji.max === 0, {
      message: "Batas emoji harus 0 bila emoji tidak diizinkan",
    }),
  hashtags: z
    .strictObject({ max: z.int().min(0).max(HASHTAG_LIMIT), always: z.array(Hashtag) })
    .refine((hashtags) => hashtags.always.length <= hashtags.max, {
      message: "Hashtag wajib tidak boleh melebihi batas hashtag",
    }),
});
export type CopyGuide = z.infer<typeof CopyGuide>;
