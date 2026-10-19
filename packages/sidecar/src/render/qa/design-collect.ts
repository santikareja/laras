// Kolektor data ukur aturan desain PRD 4 (T-130), dievaluasi di page sebagai string seperti
// COLLECT_SCRIPT. Elemen dihitung dari slot dan penanda `data-qa-element` di arketipe dan
// primitives: `group` (satu elemen, slot di dalamnya tidak dihitung lagi), `shape` (bentuk yang
// dihitung), `background` (foto latar penuh), `decor` (tekstur, garis, bingkai: tidak dihitung).
// Hasilnya bertipe DesignMeasurements (design.ts).
export const DESIGN_SCRIPT = String.raw`(() => {
  const box = (r) => ({ left: r.left, top: r.top, right: r.right, bottom: r.bottom });
  const hidden = (el) => el.closest('[aria-hidden="true"]') !== null;
  const marked = (el, kinds) => {
    const found = el.parentElement?.closest("[data-qa-element]");
    return found ? kinds.includes(found.getAttribute("data-qa-element")) : false;
  };
  const visible = (r) => r.width > 0 && r.height > 0;
  const painted = (el) => {
    const style = getComputedStyle(el);
    return (
      style.backgroundColor !== "rgba(0, 0, 0, 0)" ||
      (parseFloat(style.borderTopWidth) > 0 && style.borderTopStyle !== "none")
    );
  };
  // Batas tinta teks: gabungan kotak baris, bukan kotak elemen yang bisa lebih lebar.
  const ink = (el) => {
    const range = document.createRange();
    range.selectNodeContents(el);
    const rects = [...range.getClientRects()].filter(visible);
    if (rects.length === 0) return box(el.getBoundingClientRect());
    return {
      left: Math.min(...rects.map((r) => r.left)),
      top: Math.min(...rects.map((r) => r.top)),
      right: Math.max(...rects.map((r) => r.right)),
      bottom: Math.max(...rects.map((r) => r.bottom)),
    };
  };
  // Range memakai area konten font: huruf display dengan line-height rapat (Anton, Fraunces 0,8)
  // melapor atas dan bawah di luar kotak barisnya. Untuk perataan dan jarak tepi (P1, P11)
  // batas vertikal dijepit ke kotak elemen.
  const blockInk = (el) => {
    const rect = ink(el);
    const own = el.getBoundingClientRect();
    return { ...rect, top: Math.max(rect.top, own.top), bottom: Math.min(rect.bottom, own.bottom) };
  };
  const slots = [...document.querySelectorAll("[data-slot]")].filter((el) => !hidden(el));
  const typeOf = (el) => el.getAttribute("data-slot-type");
  const groups = [...document.querySelectorAll('[data-qa-element="group"]')];
  const standalone = slots.filter((el) => !marked(el, ["group", "background", "shape", "decor"]));

  const blocks = [
    ...groups.map((el) => ({ name: el.getAttribute("data-qa-name") || "grup", rect: blockInk(el) })),
    ...standalone
      .filter((el) => ["text", "badge", "logo"].includes(typeOf(el)))
      .map((el) => ({
        name: el.getAttribute("data-slot"),
        // Tombol dan stiker berlatar menempel ke sumbu lewat kotaknya, teks biasa lewat tintanya.
        rect: typeOf(el) === "text" && !painted(el) ? blockInk(el) : box(el.getBoundingClientRect()),
      })),
  ];

  const headingFamily = getComputedStyle(document.documentElement)
    .getPropertyValue("--font-heading")
    .trim()
    .replace(/^"|"$/g, "");
  const textNodes = (el) => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) {
      if (!hidden(walker.currentNode.parentElement)) nodes.push(walker.currentNode);
    }
    return nodes;
  };
  // Isi setiap baris dari posisi tiap karakter (baris = kelompok top yang sama).
  const linesOf = (el) => {
    const rows = [];
    const range = document.createRange();
    for (const node of textNodes(el)) {
      for (let i = 0; i < node.textContent.length; i++) {
        range.setStart(node, i);
        range.setEnd(node, i + 1);
        const rect = [...range.getClientRects()].find(visible);
        const char = node.textContent[i];
        if (!rect) {
          if (rows.length > 0) rows[rows.length - 1].text += char;
          continue;
        }
        const last = rows[rows.length - 1];
        if (last && Math.abs(rect.top - last.top) < rect.height / 2) last.text += char;
        else rows.push({ top: rect.top, text: char });
      }
    }
    return rows.map((row) => row.text.replace(/\s+/g, " ").trim()).filter(Boolean);
  };
  const texts = slots
    .filter((el) => ["text", "badge"].includes(typeOf(el)))
    .map((el) => {
      const sized = [el, ...el.querySelectorAll("*")].filter((node) => !hidden(node));
      const size = Math.max(...sized.map((node) => parseFloat(getComputedStyle(node).fontSize)));
      const display = el.matches("[data-fit]") || el.querySelector("[data-fit]") !== null;
      // Teks vertikal (label 90°) tidak punya baris horizontal untuk P4.
      const vertical = getComputedStyle(el).writingMode.startsWith("vertical");
      const family = getComputedStyle(el).fontFamily.replace(/^"|"$/g, "").split(",")[0].replace(/"/g, "").trim();
      return {
        slot: el.getAttribute("data-slot"),
        size,
        role: display ? "display" : family === headingFamily ? "heading" : "body",
        rect: ink(el),
        lines: display || vertical ? [] : linesOf(el),
      };
    });

  // Titik fokus subjek (data-qa-focus = pecahan x y dalam gambar), di dalam kotak konten
  // gambar sesuai object-fit.
  const focusImage = [...document.querySelectorAll("img[data-qa-focus]")]
    .sort((a, b) => {
      const area = (img) => img.getBoundingClientRect().width * img.getBoundingClientRect().height;
      return area(b) - area(a);
    })[0];
  let focus = null;
  if (focusImage && focusImage.naturalWidth > 0) {
    const [fx, fy] = focusImage.getAttribute("data-qa-focus").split(" ").map(Number);
    const r = focusImage.getBoundingClientRect();
    const sx = r.width / focusImage.naturalWidth;
    const sy = r.height / focusImage.naturalHeight;
    const scale = getComputedStyle(focusImage).objectFit === "cover" ? Math.max(sx, sy) : Math.min(sx, sy);
    const w = focusImage.naturalWidth * scale;
    const h = focusImage.naturalHeight * scale;
    focus = { x: r.left + (r.width - w) / 2 + fx * w, y: r.top + (r.height - h) / 2 + fy * h };
  }

  const elements = [
    ...groups.map((el) => ({ kind: "group", name: el.getAttribute("data-qa-name") || "grup" })),
    ...[...document.querySelectorAll('[data-qa-element="shape"]')]
      .filter((el) => !marked(el, ["group", "decor"]))
      .map((el) => ({ kind: "shape", name: el.getAttribute("data-qa-name") || "bentuk" })),
    ...[...document.querySelectorAll('[data-qa-element="background"]')].map((el) => ({
      kind: "background",
      name: el.getAttribute("data-qa-name") || "foto latar",
    })),
    ...standalone.map((el) => ({ kind: typeOf(el), name: el.getAttribute("data-slot") })),
  ];

  // Radius bidang yang terlihat (pil = -1) dan sudut rotasi elemen sendiri.
  const radii = [];
  const angles = [];
  for (const el of document.body.querySelectorAll("*")) {
    // Bentuk dan dekorasi (lengkung setengah pil, cakram) bukan radius kartu atau tombol (P11).
    if (hidden(el) || el.closest('[data-qa-element="decor"], [data-qa-element="shape"]')) continue;
    const style = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const radius = parseFloat(style.borderTopLeftRadius);
    if (painted(el) && visible(r) && radius > 0) {
      radii.push(radius >= Math.min(r.width, r.height) / 2 - 1 ? -1 : Math.round(radius));
    }
    const matrix = style.transform.match(/^matrix\(([^,]+),\s*([^,]+)/);
    if (matrix) {
      const angle = Math.round((Math.atan2(Number(matrix[2]), Number(matrix[1])) * 180) / Math.PI);
      if (angle !== 0) angles.push(angle);
    }
  }

  return {
    canvas: { width: window.innerWidth, height: window.innerHeight },
    blocks,
    texts,
    focus,
    elements,
    photoBackground: document.querySelector('[data-qa-element="background"]') !== null,
    centered: document.querySelector('[data-qa-composition="center"]') !== null,
    radii,
    angles,
    excluded: [
      ...slots.filter((el) => ["text", "badge"].includes(typeOf(el))).map((el) => ink(el)),
      ...slots.filter((el) => typeOf(el) === "logo").map((el) => box(el.getBoundingClientRect())),
    ],
  };
})()`;
