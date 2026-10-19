import { bidangWarna } from "../feed/BidangWarna.tsx";
import { fotoKonsep } from "../feed/FotoKonsep.tsx";
import { kataRaksasa } from "../feed/KataRaksasa.tsx";
import { kolaseDiagonal } from "../feed/KolaseDiagonal.tsx";
import { satuObjek } from "../feed/SatuObjek.tsx";
import type { Template } from "./template.ts";

// Arketipe komposisi yang disetujui pemilik di T-122 (ADR-015). Belum menjadi katalog Claude;
// katalog diganti di T-131 dan template lama dipensiunkan.
export const archetypes: Template[] = [
  kataRaksasa,
  bidangWarna,
  satuObjek,
  fotoKonsep,
  kolaseDiagonal,
];
