import type { StyleRender } from "../../src/style.ts";

// Lapisan gaya Cyberpunk/Futuristik (PANDUAN.md bagian 7 dan 12).
export const cyberpunkRender: StyleRender = {
  variables: () => [],
  treatment: ({ options }) => (options.foto === "natural" ? { kind: "natural" } : { kind: "mono" }),
};
