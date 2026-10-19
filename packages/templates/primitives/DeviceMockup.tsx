import type { ReactNode } from "react";
import { Image } from "./Image.tsx";
import { color } from "./vars.ts";

// Proporsi perangkat tampak depan. Ponsel 9 : 19; laptop: tutup 82% lebar dengan layar 16 : 10,
// alas setebal 3,6% lebar.
const PHONE = 9 / 19;
const LID = 0.82;
const BASE = 0.036;
const LID_HEIGHT = (LID * 10.6) / 16;
const LAPTOP = 1 / (LID_HEIGHT + BASE);

type DeviceMockupProps = {
  kind: "phone" | "laptop";
  // Gambar layar (cover); tanpa nilai, layar berisi children HTML di atas neutral-light.
  src?: string;
  slot?: string;
  children?: ReactNode;
};

// Bingkai ponsel atau laptop dari CSS (token gelap) untuk isi layar yang dirender HTML (Corporate
// DeviceMockup). Mengisi kotak induknya dengan rasio tetap, berpusat.
export function DeviceMockup({ kind, src, slot, children }: DeviceMockupProps) {
  const screen = (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        // Teks HTML tidak pernah dipotong agar luberannya tertangkap QA (seperti Text).
        overflow: src ? "hidden" : undefined,
        background: color("neutral-light"),
        borderRadius: kind === "phone" ? "10cqw" : undefined,
      }}
    >
      {src ? <Image src={src} {...(slot ? { slot } : {})} /> : children}
    </div>
  );
  const ratio = kind === "phone" ? PHONE : LAPTOP;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        containerType: "size",
      }}
    >
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: `min(100cqw, ${(ratio * 100).toFixed(3)}cqh)`,
          aspectRatio: `${ratio}`,
          containerType: "inline-size",
        }}
      >
        {kind === "phone" ? (
          <div
            style={{
              boxSizing: "border-box",
              position: "relative",
              width: "100%",
              height: "100%",
              padding: "3.6cqw",
              borderRadius: "13.6cqw",
              background: color("neutral-dark"),
            }}
          >
            {screen}
            <div
              style={{
                position: "absolute",
                top: "7cqw",
                left: "36%",
                width: "28%",
                height: "8cqw",
                borderRadius: "4cqw",
                background: color("neutral-dark"),
              }}
            />
          </div>
        ) : (
          <>
            <div
              style={{
                boxSizing: "border-box",
                width: `${LID * 100}%`,
                height: `${(LID_HEIGHT * 100).toFixed(3)}cqw`,
                padding: "2.4cqw 2.4cqw 3cqw",
                borderRadius: "2.4cqw 2.4cqw 0 0",
                background: color("neutral-dark"),
              }}
            >
              {screen}
            </div>
            <div
              style={{
                position: "relative",
                width: "100%",
                height: `${BASE * 100}cqw`,
                borderRadius: "0 0 2cqw 2cqw / 0 0 1.8cqw 1.8cqw",
                background: `color-mix(in srgb, ${color("neutral-dark")} 78%, ${color("neutral-light")})`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: "42%",
                  width: "16%",
                  height: "40%",
                  borderRadius: "0 0 1.2cqw 1.2cqw",
                  background: color("neutral-dark"),
                }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
