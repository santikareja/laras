import type { StyleRender } from "../../src/style.ts";

// Lapisan gaya Brutalisme (PANDUAN.md bagian 7 dan 12).
export const brutalismRender: StyleRender = {
  variables: () => [],
  treatment: ({ options }) => {
    switch (options.foto) {
      case "halftone":
        return { kind: "halftone", ink: "neutral-dark", paper: "neutral-light" };
      case "fotokopi":
        return { kind: "fotokopi", ink: "neutral-dark" };
      case "natural":
        return { kind: "natural" };
      default:
        return { kind: "mono" };
    }
  },
};
