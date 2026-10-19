import { isBlocking, type RenderCheck } from "../packages/shared/src/index.ts";

// Cetak hasil QA satu render untuk skrip render: cek wajib yang gagal menggagalkan skrip, saran
// aturan desain (T-130) dicetak terpisah dan tidak menggagalkan. Mengembalikan jumlah keduanya.
export function printChecks(file: string, checks: RenderCheck[], showAdvice = true) {
  const blocking = checks.filter(isBlocking);
  const advice = checks.filter((check) => !check.passed && check.severity === "saran");
  const note = showAdvice && advice.length > 0 ? `, ${advice.length} saran desain` : "";
  console.log(`${file} ${blocking.length === 0 ? "QA lolos" : "QA GAGAL"}${note}`);
  for (const check of blocking) console.log(`  - ${check.rule} ${check.target}: ${check.message}`);
  if (showAdvice) {
    for (const check of advice)
      console.log(`  · saran ${check.rule} ${check.target}: ${check.message}`);
  }
  return { blocking: blocking.length, advice: showAdvice ? advice.length : 0 };
}
