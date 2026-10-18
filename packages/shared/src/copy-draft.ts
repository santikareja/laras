import { z } from "zod";
import { HASHTAG_LIMIT, Hashtag, NonEmptyText as Text } from "./common.ts";

const CAPTION_LIMIT = 2200; // batas caption Instagram, termasuk hashtag

// Teks semantik per slide. Copy ditulis sebelum template dipilih (ARCH 5.2), jadi tahap
// layout yang memetakan field ini ke slot template.
export const CopySlide = z
  .strictObject({
    headline: Text.optional(),
    subheadline: Text.optional(),
    body: Text.optional(),
    cta: Text.optional(),
    items: z.array(Text).min(1).optional(),
  })
  .refine((slide) => Object.values(slide).some((value) => value !== undefined), {
    message: "Setiap slide butuh minimal satu teks",
  });
export type CopySlide = z.infer<typeof CopySlide>;

// Output tahap copy (ARCH 5.2; PRD US-13, F7).
export const CopyDraft = z
  .strictObject({
    slides: z.array(CopySlide).min(1).max(20),
    caption: Text,
    hashtags: z.array(Hashtag).max(HASHTAG_LIMIT),
  })
  .refine(
    (draft) => `${draft.caption}\n\n${draft.hashtags.join(" ")}`.trim().length <= CAPTION_LIMIT,
    { message: `Caption beserta hashtag maksimal ${CAPTION_LIMIT} karakter`, path: ["caption"] },
  );
export type CopyDraft = z.infer<typeof CopyDraft>;
