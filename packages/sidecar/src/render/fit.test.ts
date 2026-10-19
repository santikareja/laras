import { chromium } from "playwright-core";
import { afterAll, describe, expect, it } from "vitest";
import { FIT_SCRIPT } from "./fit.ts";

// Fit-to-width diuji langsung di Chromium dengan font sistem: ukuran akhir mengikuti lebar teks
// sebenarnya, bukan perkiraan jumlah huruf (T-123).
const browser = chromium.launch();
afterAll(async () => (await browser).close());

async function fit(body: string) {
  const page = await (await browser).newPage();
  try {
    await page.setContent(`<body style="margin:0">${body}</body>`);
    const sizes = await page.evaluate<number[]>(FIT_SCRIPT);
    // String, bukan fungsi: sidecar tidak memuat tipe DOM (lihat collect.ts).
    const widths = await page.evaluate<{ text: number; box: number }[]>(`
      [...document.querySelectorAll("[data-fit]")].map((el) => {
        const range = document.createRange();
        range.selectNodeContents(el);
        return { text: range.getBoundingClientRect().width, box: el.clientWidth };
      })`);
    return { sizes, widths };
  } finally {
    await page.close();
  }
}

const line = (text: string, width: number, max = "400px") =>
  `<div style="width:${width}px"><p data-fit="width" data-fit-max="${max}" style="margin:0;font:700 40px serif;white-space:nowrap">${text}</p></div>`;

describe("fit-to-width (T-123)", () => {
  it("mengecilkan kata panjang dan membesarkan kata pendek sampai pas dengan kotaknya", async () => {
    const { widths } = await fit(line("SANGRAI SENDIRI", 300) + line("KENALI", 600));
    for (const { text, box } of widths) expect(Math.abs(text - box)).toBeLessThan(3);
  });

  it("tidak melewati batas ukuran", async () => {
    const { sizes, widths } = await fit(line("AI", 900, "120px"));
    expect(sizes).toEqual([120]);
    expect(widths[0]?.text ?? 0).toBeLessThan(900);
  });

  it("batas boleh berupa ekspresi CSS dan setiap baris bertumpuk dipaskan sendiri", async () => {
    const stack = `<div style="width:500px;--besar:50px"><p style="margin:0;font:700 40px serif;white-space:nowrap">
      <span data-fit="width" data-fit-max="calc(var(--besar) * 4)" style="display:block">MINGGU</span>
      <span data-fit="width" data-fit-max="calc(var(--besar) * 4)" style="display:block">INI</span></p></div>`;
    const { sizes, widths } = await fit(stack);
    expect(Math.abs((widths[0]?.text ?? 0) - 500)).toBeLessThan(3);
    expect(sizes[1]).toBe(200);
  });
});
