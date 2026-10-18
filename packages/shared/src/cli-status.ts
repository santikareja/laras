import { z } from "zod";

// Hasil deteksi CLI (ARCH 4.5, PRD F14), dikirim sidecar ke UI sebagai cli.status.
export const CliName = z.enum(["claude", "codex"]);
export type CliName = z.infer<typeof CliName>;

export const CliSource = z.enum(["login-shell", "common", "manual"]);

export const CliStatus = z.discriminatedUnion("found", [
  z.strictObject({ name: CliName, found: z.literal(false) }),
  z.strictObject({
    name: CliName,
    found: z.literal(true),
    path: z.string().startsWith("/", "Path CLI harus absolut"),
    source: CliSource,
    version: z.string().min(1).nullable(),
    loggedIn: z.boolean(),
    account: z.string().min(1).nullable(),
  }),
]);
export type CliStatus = z.infer<typeof CliStatus>;
