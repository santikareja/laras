import { describe, expect, it } from "vitest";
import { duplicates, HexColor, RelativePath, slideCountError } from "./common.ts";

describe("RelativePath", () => {
  it("menerima path relatif di dalam folder", () => {
    for (const path of ["fonts/BrandSans.woff2", "assets/bg-01.png", "a/./b.png"]) {
      expect(RelativePath.safeParse(path).success).toBe(true);
    }
  });

  it("menolak path absolut, home, backslash, dan keluar folder", () => {
    for (const path of [
      "/etc/hosts",
      "~/rahasia.txt",
      "a\\b.png",
      "../luar.png",
      "a/../../b.png",
      "",
    ]) {
      expect(RelativePath.safeParse(path).success).toBe(false);
    }
  });
});

describe("HexColor", () => {
  it("hanya menerima #RRGGBB", () => {
    expect(HexColor.safeParse("#0F3D3E").success).toBe(true);
    expect(HexColor.safeParse("#fff").success).toBe(false);
    expect(HexColor.safeParse("0F3D3E").success).toBe(false);
  });
});

describe("slideCountError", () => {
  it("feed tepat satu slide, carousel 2–20", () => {
    expect(slideCountError("feed-4x5", 1)).toBeNull();
    expect(slideCountError("feed-4x5", 2)).toContain("tepat 1");
    expect(slideCountError("carousel-4x5", 2)).toBeNull();
    expect(slideCountError("carousel-4x5", 20)).toBeNull();
    expect(slideCountError("carousel-4x5", 1)).toContain("2–20");
    expect(slideCountError("carousel-4x5", 21)).toContain("2–20");
  });
});

describe("duplicates", () => {
  it("mengembalikan nilai yang muncul lebih dari sekali", () => {
    expect(duplicates(["a", "b", "a", "c", "a"])).toEqual(["a"]);
    expect(duplicates(["a", "b"])).toEqual([]);
  });
});
