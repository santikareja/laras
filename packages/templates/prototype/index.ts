import type { Template } from "../src/template.ts";
import { bidangWarna } from "./BidangWarna.tsx";
import { kataRaksasa } from "./KataRaksasa.tsx";
import { kolaseDiagonal } from "./KolaseDiagonal.tsx";
import { satuObjek } from "./SatuObjek.tsx";

// Prototipe arketipe komposisi T-122 (ADR-015). Bukan bagian katalog: Claude dan pipeline
// tidak memakainya sampai sistem arketipe T-123 dibangun.
export const prototypes: Template[] = [kataRaksasa, bidangWarna, satuObjek, kolaseDiagonal];
