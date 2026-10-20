import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Port tetap karena Tauri memuat devUrl http://localhost:1420 (src-tauri/tauri.conf.json).
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Bundel sidecar di repo (`pnpm --filter @laras/sidecar build`, T-203); aplikasi terpaket akan
  // memakai resource bundel (Fase 4).
  define: {
    __LARAS_SIDECAR__: JSON.stringify(
      fileURLToPath(new URL("../../packages/sidecar/dist/sidecar.mjs", import.meta.url)),
    ),
  },
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
});
