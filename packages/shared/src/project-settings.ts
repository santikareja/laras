import { z } from "zod";
import { Slug } from "./common.ts";

// Gaya desain terpilih (PRD F16, T-133): id dan varian dari StyleMeta. Opsi gaya per postingan
// dipilih di tahap layout (LayoutSpec.styleOptions).
export const StyleSelection = z.strictObject({ id: Slug, variant: Slug });
export type StyleSelection = z.infer<typeof StyleSelection>;

// project.json di folder project (ARCH 8.1, T-133): pengaturan project di luar Brand Kit.
// `style` null berarti tanpa gaya (arketipe dirender apa adanya).
export const ProjectSettings = z.strictObject({ style: StyleSelection.nullable() });
export type ProjectSettings = z.infer<typeof ProjectSettings>;
