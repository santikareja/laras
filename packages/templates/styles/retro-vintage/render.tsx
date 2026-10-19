import type { StyleRender } from "../../src/style.ts";

// Lapisan gaya Vintage/Retro (PANDUAN.md bagian 7 dan 12).
export const retroVintageRender: StyleRender = {
  variables: () => [],
  treatment: ({ options }) => {
    switch (options.foto) {
      case "duotone":
        return { kind: "duotone", dark: "primary", light: "neutral-light" };
      case "mono":
        return { kind: "mono" };
      case "natural":
        return { kind: "natural" };
      default:
        return { kind: "hangat", tone: "accent" };
    }
  },
};
