// Kolektor data ukur QA (ARCH 7.2), dievaluasi di page sebagai string: sidecar tidak memuat tipe
// DOM, dan fungsi yang diserialisasi tidak boleh berisi helper hasil transformasi tsx/esbuild.
// Menandai setiap elemen teks dengan data-qa-text (dipakai CDP dan sampling); platformFonts
// diisi renderer. Hasilnya bertipe Measurements (rules.ts).
export const COLLECT_SCRIPT = String.raw`(() => {
  const box = (r) => ({ left: r.left, top: r.top, right: r.right, bottom: r.bottom });
  const alpha = (color) => {
    if (color === "transparent") return 0;
    const slash = color.match(/\/\s*([\d.]+)(%?)\s*\)$/);
    if (slash) return slash[2] ? Number(slash[1]) / 100 : Number(slash[1]);
    const rgba = color.match(/^rgba\((?:[^,]+,){3}\s*([\d.]+)\)$/);
    return rgba ? Number(rgba[1]) : 1;
  };
  const slotOf = (el) => el.closest("[data-slot]")?.getAttribute("data-slot") ?? null;
  const describe = (el) => slotOf(el) ?? el.tagName.toLowerCase();
  const elements = [document.documentElement, document.body, ...document.body.querySelectorAll("*")];
  const isText = (el) =>
    [...el.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== "");

  // Latar efektif di satu titik: mulai dari elemen teks itu sendiri (mis. badge berlatar),
  // lalu elemen di bawahnya; yang pertama berupa gambar atau berlatar opaque. Latar transparan
  // sebagian diperlakukan seperti gambar (disampling dari piksel).
  const backgroundAt = (el, x, y) => {
    const stack = document.elementsFromPoint(x, y);
    const start = stack.indexOf(el);
    if (start < 0) return null;
    for (const node of stack.slice(start)) {
      // Bentuk SVG (swoosh, pelangi) di belakang teks: kontras diukur dari piksel (T-130). Hanya
      // geometri yang tergambar di titik itu; kotak <svg> sendiri menutupi seluruh lapisannya.
      if (node.tagName === "IMG" || (node instanceof SVGElement && node.tagName.toLowerCase() !== "svg")) {
        return { kind: "image" };
      }
      const color = getComputedStyle(node).backgroundColor;
      const a = alpha(color);
      if (a >= 1) return { kind: "color", color };
      if (a > 0) return { kind: "image" };
    }
    return { kind: "color", color: "rgb(255, 255, 255)" };
  };

  const texts = elements.filter(isText).map((el, id) => {
    el.setAttribute("data-qa-text", String(id));
    const style = getComputedStyle(el);
    const range = document.createRange();
    range.selectNodeContents(el);
    // Range memakai area konten font: huruf display (Anton ±0,35 em) melapor di luar kotak barisnya,
    // sehingga kata raksasa di dekat tepi dianggap terpotong padahal hurufnya utuh (T-127). Batas
    // vertikal baris dijepit ke kotak elemen; horizontal tetap dari Range.
    const own = el.getBoundingClientRect();
    const lines = [...range.getClientRects()].map((r) => ({
      ...box(r),
      top: Math.max(r.top, own.top),
      bottom: Math.min(r.bottom, own.bottom),
    }));
    const points = lines.slice(0, 8).flatMap((line) =>
      [0.15, 0.5, 0.85].map((f) => [line.left + (line.right - line.left) * f, (line.top + line.bottom) / 2]),
    );
    return {
      id,
      slot: slotOf(el),
      text: el.textContent.trim(),
      rect: box(el.getBoundingClientRect()),
      lines,
      color: style.color,
      fontSize: parseFloat(style.fontSize),
      fontWeight: Number(style.fontWeight),
      fontFamily: style.fontFamily,
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
      backgrounds: points.map(([x, y]) => backgroundAt(el, x, y)).filter(Boolean),
      platformFonts: [],
    };
  });

  const colors = [];
  for (const el of elements) {
    const style = getComputedStyle(el);
    if (alpha(style.backgroundColor) > 0) {
      colors.push({ kind: "background", color: style.backgroundColor, target: describe(el) });
    }
    for (const side of ["Top", "Right", "Bottom", "Left"]) {
      const color = style["border" + side + "Color"];
      const visible = parseFloat(style["border" + side + "Width"]) > 0 && style["border" + side + "Style"] !== "none";
      if (visible && alpha(color) > 0) colors.push({ kind: "border", color, target: describe(el) });
    }
  }

  // Gradient CSS yang tampak (aturan brand tanpa gradient, T-124). Bukan gradient: pola bertanda
  // data-qa-gradient="pattern" (titik halftone, papan catur), gradient berulang (garis, sinar), dan
  // gradient yang semua warnanya sama (bidang polos untuk mask).
  const gradients = [];
  for (const el of elements) {
    if (el.closest('[data-qa-gradient="pattern"]')) continue;
    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) continue;
    const style = getComputedStyle(el);
    for (const value of [style.backgroundImage, style.maskImage, style.webkitMaskImage, style.borderImageSource]) {
      if (!value || !value.includes("gradient(")) continue;
      const soft = value
        .split(/,(?![^(]*\))(?=\s*(?:repeating-)?(?:linear|radial|conic)-gradient|\s*url)/)
        .filter((layer) => /^\s*(linear|radial|conic)-gradient\(/.test(layer))
        .some((layer) => new Set(layer.match(/rgba?\([^)]*\)|color\([^)]*\)|transparent/g) ?? []).size > 1);
      if (soft) {
        gradients.push(describe(el));
        break;
      }
    }
  }

  return {
    canvas: { width: window.innerWidth, height: window.innerHeight },
    texts,
    gradients: [...new Set(gradients)],
    slots: [...document.querySelectorAll("[data-slot]")].map((el) => ({
      slot: el.getAttribute("data-slot"),
      type: el.getAttribute("data-slot-type"),
      rect: box(el.getBoundingClientRect()),
    })),
    colors,
    brokenImages: [...document.images]
      .filter((img) => !img.complete || img.naturalWidth === 0)
      .map((img) => img.currentSrc || img.src),
    fontFaces: [...document.fonts].map((face) => ({ family: face.family.replace(/^"|"$/g, ""), status: face.status })),
  };
})()`;

// Dipasang sebelum screenshot kedua: hanya piksel latar yang tersisa untuk sampling kontras.
export const HIDE_TEXT_CSS = `[data-qa-text] {
  color: transparent !important;
  -webkit-text-fill-color: transparent !important;
  text-shadow: none !important;
}`;
