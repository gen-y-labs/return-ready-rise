import type { Bullet, Evidence, ResumeDraft } from "./types";

const NUMBER = /\$?\d[\d,]*(?:\.\d+)?%?/g;

function numbersIn(text: string): string[] {
  return text.match(NUMBER) ?? [];
}

function bare(n: string): string {
  return n.replace(/[$,%]/g, "");
}

// Drops bullets that cite evidence the user did not confirm, and flags numbers
// the model wrote that do not appear in the cited evidence.
export function checkBullets(
  bullets: ResumeDraft["breakBullets"],
  allowed: Map<string, Evidence>,
  extraText = "",
): Bullet[] {
  return bullets
    .filter((b) => b.evidenceIds.length > 0 && b.evidenceIds.every((id) => allowed.has(id)))
    .map((b) => {
      const source = b.evidenceIds.map((id) => `${allowed.get(id)!.text} ${allowed.get(id)!.years}`).join(" ");
      const known = new Set(numbersIn(`${source} ${extraText}`).map(bare));
      const flags = numbersIn(b.text)
        .filter((n) => !known.has(bare(n)))
        .map((n) => ({ kind: "number_not_in_evidence" as const, detail: n }));
      return { ...b, flags };
    });
}
