// Membaca codepoint yang dipetakan font (tabel cmap) untuk validasi Brand Kit (PRD F2):
// font harus bisa dibaca dan memuat glyph Latin dasar. Mendukung WOFF2, TTF, dan OTF.
import { brotliDecompressSync } from "node:zlib";

const WOFF2_SIGNATURE = 0x774f4632; // "wOF2"
const SFNT_VERSIONS = new Set([0x00010000, 0x4f54544f, 0x74727565]); // TrueType, "OTTO", "true"
const WOFF2_KNOWN_TAGS = [
  "cmap",
  "head",
  "hhea",
  "hmtx",
  "maxp",
  "name",
  "OS/2",
  "post",
  "cvt ",
  "fpgm",
  "glyf",
  "loca",
  "prep",
  "CFF ",
  "VORG",
  "EBDT",
  "EBLC",
  "gasp",
  "hdmx",
  "kern",
  "LTSH",
  "PCLT",
  "VDMX",
  "vhea",
  "vmtx",
  "BASE",
  "GDEF",
  "GPOS",
  "GSUB",
  "EBSC",
  "JSTF",
  "MATH",
  "CBDT",
  "CBLC",
  "COLR",
  "CPAL",
  "SVG ",
  "sbix",
  "acnt",
  "avar",
  "bdat",
  "bloc",
  "bsln",
  "cvar",
  "fdsc",
  "feat",
  "fmtx",
  "fvar",
  "gvar",
  "hsty",
  "just",
  "lcar",
  "mort",
  "morx",
  "opbd",
  "prop",
  "trak",
  "Zapf",
  "Silf",
  "Glat",
  "Gloc",
  "Feat",
  "Sill",
];
const BASIC_LATIN = { first: 0x20, last: 0x7e };

export class FontReadError extends Error {}

export function fontCodepoints(data: Uint8Array): Set<number> {
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  if (data.byteLength < 12) throw new FontReadError("File terlalu kecil untuk sebuah font");
  const signature = view.getUint32(0);
  const cmap = signature === WOFF2_SIGNATURE ? woff2Cmap(data, view) : sfntCmap(view, signature);
  return parseCmap(cmap);
}

export function missingBasicLatin(codepoints: Set<number>): number[] {
  const missing: number[] = [];
  for (let cp = BASIC_LATIN.first; cp <= BASIC_LATIN.last; cp++) {
    if (!codepoints.has(cp)) missing.push(cp);
  }
  return missing;
}

function sfntCmap(view: DataView, version: number): DataView {
  if (!SFNT_VERSIONS.has(version)) throw new FontReadError("Bukan file font WOFF2, TTF, atau OTF");
  const numTables = view.getUint16(4);
  for (let i = 0; i < numTables; i++) {
    const record = 12 + i * 16;
    if (tagAt(view, record) === "cmap") {
      return new DataView(
        view.buffer,
        view.byteOffset + view.getUint32(record + 8),
        view.getUint32(record + 12),
      );
    }
  }
  throw new FontReadError("Font tidak memiliki tabel cmap");
}

function woff2Cmap(data: Uint8Array, view: DataView): DataView {
  if (view.getUint32(4) === 0x74746366)
    throw new FontReadError("Koleksi font (TTC) tidak didukung");
  const numTables = view.getUint16(12);
  const totalCompressedSize = view.getUint32(20);
  let offset = 48;
  let streamOffset = 0;
  let cmap: { start: number; length: number } | null = null;
  for (let i = 0; i < numTables; i++) {
    const flags = data[offset++] ?? 0;
    const tagIndex = flags & 0x3f;
    const transformVersion = flags >> 6;
    let tag = WOFF2_KNOWN_TAGS[tagIndex];
    if (tagIndex === 63) {
      tag = tagAt(view, offset);
      offset += 4;
    }
    const origLength = readBase128(data, offset);
    offset = origLength.next;
    // glyf/loca: versi 0 berarti ditransformasi; tabel lain: versi selain 0 berarti ditransformasi.
    const transformed =
      tag === "glyf" || tag === "loca" ? transformVersion === 0 : transformVersion !== 0;
    let storedLength = origLength.value;
    if (transformed) {
      const transformLength = readBase128(data, offset);
      offset = transformLength.next;
      storedLength = transformLength.value;
    }
    if (tag === "cmap") cmap = { start: streamOffset, length: storedLength };
    streamOffset += storedLength;
  }
  if (!cmap) throw new FontReadError("Font tidak memiliki tabel cmap");
  const tables = brotliDecompressSync(data.subarray(offset, offset + totalCompressedSize));
  return new DataView(tables.buffer, tables.byteOffset + cmap.start, cmap.length);
}

function readBase128(data: Uint8Array, start: number): { value: number; next: number } {
  let value = 0;
  for (let i = 0; i < 5; i++) {
    const byte = data[start + i] ?? 0;
    value = value * 128 + (byte & 0x7f);
    if ((byte & 0x80) === 0) return { value, next: start + i + 1 };
  }
  throw new FontReadError("Direktori tabel WOFF2 rusak");
}

function tagAt(view: DataView, offset: number): string {
  return String.fromCharCode(
    view.getUint8(offset),
    view.getUint8(offset + 1),
    view.getUint8(offset + 2),
    view.getUint8(offset + 3),
  );
}

// Pilih subtabel Unicode: format 12 lebih dulu (cakupan penuh), lalu format 4.
function parseCmap(cmap: DataView): Set<number> {
  const numTables = cmap.getUint16(2);
  const subtables: { format: number; offset: number }[] = [];
  for (let i = 0; i < numTables; i++) {
    const record = 4 + i * 8;
    const platform = cmap.getUint16(record);
    const encoding = cmap.getUint16(record + 2);
    const offset = cmap.getUint32(record + 4);
    const isUnicode = platform === 0 || (platform === 3 && (encoding === 1 || encoding === 10));
    if (isUnicode) subtables.push({ format: cmap.getUint16(offset), offset });
  }
  const chosen = subtables.find((t) => t.format === 12) ?? subtables.find((t) => t.format === 4);
  if (!chosen)
    throw new FontReadError("Font tidak memiliki pemetaan Unicode (cmap format 4 atau 12)");
  return chosen.format === 12
    ? parseFormat12(cmap, chosen.offset)
    : parseFormat4(cmap, chosen.offset);
}

function parseFormat4(cmap: DataView, offset: number): Set<number> {
  const segCount = cmap.getUint16(offset + 6) / 2;
  const endCodes = offset + 14;
  const startCodes = endCodes + segCount * 2 + 2;
  const idDeltas = startCodes + segCount * 2;
  const idRangeOffsets = idDeltas + segCount * 2;
  const codepoints = new Set<number>();
  for (let seg = 0; seg < segCount; seg++) {
    const end = cmap.getUint16(endCodes + seg * 2);
    const start = cmap.getUint16(startCodes + seg * 2);
    const delta = cmap.getInt16(idDeltas + seg * 2);
    const rangeOffsetPos = idRangeOffsets + seg * 2;
    const rangeOffset = cmap.getUint16(rangeOffsetPos);
    for (let cp = start; cp <= end && cp !== 0xffff; cp++) {
      let glyph = (cp + delta) & 0xffff;
      if (rangeOffset !== 0) {
        const raw = cmap.getUint16(rangeOffsetPos + rangeOffset + (cp - start) * 2);
        glyph = raw === 0 ? 0 : (raw + delta) & 0xffff;
      }
      if (glyph !== 0) codepoints.add(cp);
    }
  }
  return codepoints;
}

function parseFormat12(cmap: DataView, offset: number): Set<number> {
  const groups = cmap.getUint32(offset + 12);
  const codepoints = new Set<number>();
  for (let g = 0; g < groups; g++) {
    const group = offset + 16 + g * 12;
    const start = cmap.getUint32(group);
    const end = cmap.getUint32(group + 4);
    const startGlyph = cmap.getUint32(group + 8);
    for (let cp = start; cp <= end; cp++) {
      if (startGlyph + (cp - start) !== 0) codepoints.add(cp);
    }
  }
  return codepoints;
}
