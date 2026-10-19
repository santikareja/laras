import { bidangWarna } from "../feed/BidangWarna.tsx";
import { fotoKonsep } from "../feed/FotoKonsep.tsx";
import { kartuKaca } from "../feed/KartuKaca.tsx";
import { kataRaksasa } from "../feed/KataRaksasa.tsx";
import { kolaseDiagonal } from "../feed/KolaseDiagonal.tsx";
import { panelInfo } from "../feed/PanelInfo.tsx";
import { satuObjek } from "../feed/SatuObjek.tsx";
import { brutalismArchetypes } from "../styles/brutalism/archetypes.ts";
import { corporateCleanArchetypes } from "../styles/corporate-clean/archetypes.ts";
import { cyberpunkArchetypes } from "../styles/cyberpunk/archetypes.ts";
import { flatDesignArchetypes } from "../styles/flat-design/archetypes.ts";
import { retroVintageArchetypes } from "../styles/retro-vintage/archetypes.ts";
import type { Template } from "./template.ts";

// Arketipe komposisi yang disetujui pemilik di T-122 (ADR-015), panel info dan kartu kaca dari
// panduan gaya (T-132), dan arketipe khas per gaya (T-134). Daftar ini adalah katalog Claude
// sejak T-131.
export const archetypes: Template[] = [
  kataRaksasa,
  bidangWarna,
  satuObjek,
  fotoKonsep,
  kolaseDiagonal,
  panelInfo,
  kartuKaca,
  ...corporateCleanArchetypes,
  ...cyberpunkArchetypes,
  ...retroVintageArchetypes,
  ...brutalismArchetypes,
  ...flatDesignArchetypes,
];
