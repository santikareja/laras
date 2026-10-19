import { describe, expect, it } from "vitest";
import { ArtDirection } from "./art-direction.ts";

const valid = {
  idea: "Uap kopi menjadi selimut pagi di gang yang masih sepi.",
  image:
    "A narrow quiet alley in Bandung at dawn, a single glass of iced palm-sugar coffee on a wooden stool in the lower right, soft warm light, the upper third is a calm plain wall in deep teal.",
  textZone: "atas-kiri",
  subject: { description: "the glass of coffee on the wooden stool", kind: "object" },
};

describe("ArtDirection (T-140)", () => {
  it("menerima arahan lengkap dengan zona dan subjek", () => {
    expect(ArtDirection.parse(valid)).toEqual(valid);
  });

  it("menolak zona di luar enum dan brief gambar yang terlalu pendek", () => {
    expect(ArtDirection.safeParse({ ...valid, textZone: "tengah" }).success).toBe(false);
    expect(ArtDirection.safeParse({ ...valid, image: "A coffee." }).success).toBe(false);
  });
});
