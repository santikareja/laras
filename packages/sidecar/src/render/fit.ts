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
