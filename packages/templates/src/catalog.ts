import { fotoPenuh } from "../feed/FotoPenuh.tsx";
import { fotoTeks } from "../feed/FotoTeks.tsx";
import { kutipan } from "../feed/Kutipan.tsx";
import { sorotan } from "../feed/Sorotan.tsx";
import type { Template } from "./template.ts";

// Katalog template yang boleh dipilih Claude di tahap layout (ARCH 6.2).
export const templates: Template[] = [fotoTeks, sorotan, fotoPenuh, kutipan];
