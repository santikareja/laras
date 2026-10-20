import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/App";
// Plus Jakarta Sans dibundel lokal (DESIGN 4), hanya bobot yang dipakai --type-display.
import "@fontsource/plus-jakarta-sans/700.css";
import "./styles/global.css";

const root = document.getElementById("root");
if (!root) {
  throw new Error("Elemen #root tidak ditemukan di index.html.");
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
