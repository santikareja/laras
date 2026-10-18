// Batas kuota subscription (ARCH 4.5, Deteksi rate limit). Pola di bawah dan nilai status
// rate_limit_event selain "allowed" BELUM terverifikasi pada CLI asli (KNOWLEDGE): diperbarui
// begitu perilaku saat kuota habis teramati.

export class LimitReachedError extends Error {
  readonly resetsAt: Date | null;

  constructor(message: string, resetsAt: Date | null) {
    super(message);
    this.name = "LimitReachedError";
    this.resetsAt = resetsAt;
  }
}

const LIMIT_PATTERNS = [
  /usage limit reached/i,
  /rate limit (?:reached|exceeded)/i,
  /(?:you['’]ve|you have) (?:hit|reached) your (?:usage )?limit/i,
  /quota (?:exceeded|exhausted)/i,
];

// Format pesan lama Claude Code: "Claude AI usage limit reached|<detik epoch>".
const RESET_EPOCH = /limit reached\|(\d{10})\b/i;

export function limitInText(text: string): { resetsAt: Date | null } | null {
  if (!LIMIT_PATTERNS.some((pattern) => pattern.test(text))) return null;
  const epoch = RESET_EPOCH.exec(text)?.[1];
  return { resetsAt: epoch ? new Date(Number(epoch) * 1000) : null };
}
