import { z } from "zod";
import { Slug } from "./common.ts";
import { CopyDraft } from "./copy-draft.ts";
import { LayoutSpec } from "./layout-spec.ts";

// Output tahap revise (ARCH 5.2, 5.4): copy dan layout utuh dengan hanya bagian yang diminta
// berubah, aset yang perlu dibuat ulang, dan ringkasan perubahan untuk catatan versi (PRD F12).
export const Revision = z
  .strictObject({
    copy: CopyDraft,
    layout: LayoutSpec,
    regenerateAssets: z.array(Slug),
    summary: z.string().min(1),
  })
  .superRefine((revision, ctx) => {
    const requested = revision.layout.assetRequests.map((r) => r.id);
    for (const id of revision.regenerateAssets) {
      if (!requested.includes(id)) {
        ctx.addIssue({
          code: "custom",
          path: ["regenerateAssets"],
          message: `Aset "${id}" tidak ada di assetRequests layout`,
        });
      }
    }
  });
export type Revision = z.infer<typeof Revision>;
