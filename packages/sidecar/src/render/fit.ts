// Fit-to-width terukur (T-123): elemen teks bertanda data-fit diskalakan agar lebar teks
// sebenarnya (Range) mengisi lebar kotaknya, dibatasi data-fit-max (ekspresi CSS ukuran,
// mis. calc(var(--font-size-6) * 2.6)). Menggantikan perkiraan lebar huruf per font (KNOWLEDGE
// T-122). Dijalankan di page sebagai string (lihat collect.ts) setelah font siap, sebelum QA
// dan screenshot. Mengembalikan ukuran akhir (px) per elemen.
export const FIT_SCRIPT = `(() => {
  // Batas dihitung di samping elemennya agar variabel CSS milik induk ikut terbaca.
  const toPx = (el, expression) => {
    const probe = document.createElement("span");
    probe.style.display = "none";
    probe.style.fontSize = expression;
    el.after(probe);
    const px = parseFloat(getComputedStyle(probe).fontSize);
    probe.remove();
    return px;
  };
  const sizes = [];
  for (const el of document.querySelectorAll("[data-fit]")) {
    const cap = el.hasAttribute("data-fit-max") ? toPx(el, el.getAttribute("data-fit-max")) : Infinity;
    const range = document.createRange();
    range.selectNodeContents(el);
    let size = parseFloat(getComputedStyle(el).fontSize);
    for (let i = 0; i < 4; i++) {
      const width = range.getBoundingClientRect().width;
      const available = el.clientWidth;
      if (!width || !available) break;
      const next = Math.min(cap, (size * available) / width);
      if (Math.abs(next - size) < 0.25) break;
      size = next;
      el.style.fontSize = size.toFixed(2) + "px";
    }
    sizes.push(size);
  }
  return sizes;
})()`;

// Elemen miring bertanda data-rotate-safe (stiker dengan rotasi brand, T-124): kotak miringnya
// melebar w·sin θ di ujung-ujungnya. Bila kotak tegaknya di dalam safe margin tetapi kotak
// miringnya melewati, elemen digeser ke dalam sejauh luapannya. Kotak tegak yang sudah melanggar
// tidak disentuh agar QA tetap melaporkannya. Mengembalikan geseran [dx, dy] per elemen yang digeser.
export const ROTATION_SCRIPT = `(() => {
  const safe = parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--space-safe")) || 0;
  const width = window.innerWidth;
  const height = window.innerHeight;
  const moved = [];
  for (const el of document.querySelectorAll("[data-rotate-safe]")) {
    const tilted = el.getBoundingClientRect();
    const transform = el.style.transform;
    el.style.transform = "none";
    const upright = el.getBoundingClientRect();
    el.style.transform = transform;
    const inside =
      upright.left >= safe - 0.5 && upright.top >= safe - 0.5 &&
      upright.right <= width - safe + 0.5 && upright.bottom <= height - safe + 0.5;
    if (!inside) continue;
    const dx = Math.max(0, safe - tilted.left) - Math.max(0, tilted.right - (width - safe));
    const dy = Math.max(0, safe - tilted.top) - Math.max(0, tilted.bottom - (height - safe));
    if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) continue;
    el.style.translate = dx.toFixed(2) + "px " + dy.toFixed(2) + "px";
    moved.push([Number(dx.toFixed(2)), Number(dy.toFixed(2))]);
  }
  return moved;
})()`;
