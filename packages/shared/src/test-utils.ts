import type { z } from "zod";

// Pesan error validasi, agar test memastikan kegagalan terjadi karena aturan yang dimaksud.
export function issuesOf(schema: z.ZodType, value: unknown): string[] {
  const result = schema.safeParse(value);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}
