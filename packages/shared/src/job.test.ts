import { describe, expect, it } from "vitest";
import { JobSpec, JobState, JobStatus } from "./job.ts";
import { issuesOf } from "./test-utils.ts";

const spec = {
  id: "brief-1-v1",
  briefId: "brief-1",
  brief: "Promo kopi pagi",
  format: "feed-4x5",
  slideCount: 1,
  variant: 1,
  variantCount: 3,
  templatePreference: null,
  userAssets: { produk: "uploads/produk.jpg" },
};

describe("Job", () => {
  it("menerima spec dan state job yang valid", () => {
    expect(issuesOf(JobSpec, spec)).toEqual([]);
    const state = {
      spec,
      status: "copy",
      error: null,
      resumeAt: null,
      updatedAt: "2026-10-18T10:00:00.000Z",
    };
    expect(issuesOf(JobState, state)).toEqual([]);
    expect(JobStatus.options).toContain("waiting_quota");
  });

  it("menolak jumlah slide yang tidak cocok format, varian berlebih, dan path aset absolut", () => {
    expect(issuesOf(JobSpec, { ...spec, slideCount: 2 })).toContain(
      "Format feed-4x5 harus berisi tepat 1 slide",
    );
    expect(issuesOf(JobSpec, { ...spec, variant: 4 })).toContain(
      "Nomor varian melebihi jumlah varian",
    );
    expect(JobSpec.safeParse({ ...spec, userAssets: { produk: "/etc/x.jpg" } }).success).toBe(
      false,
    );
  });
});
