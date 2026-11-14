import type { Category, CategoryFit, CategoryMatches, Evidence } from "./types";

const SHOWN = new Set(["supported", "refresh"]);

export function scoreCategories(
  result: CategoryMatches,
  categories: Category[],
  evidence: Evidence[],
): CategoryFit[] {
  const paidIds = new Set(evidence.filter((e) => e.source === "paid").map((e) => e.id));

  const fits = categories.map((category) => {
    const found = result.categories.find((c) => c.categoryId === category.id);
    const matches = category.keySkills.map((skill) => {
      const match = found?.matches.find((m) => m.keySkillId === skill.id);
      return {
        keySkillId: skill.id,
        text: skill.text,
        status: match?.status ?? "missing",
        evidenceIds: match?.evidenceIds ?? [],
        explanation: match?.explanation ?? "No evidence found.",
        question: match?.question ?? null,
      };
    });
    const shown = matches.filter((m) => SHOWN.has(m.status));
    const paidBacked = shown.filter((m) => m.evidenceIds.some((id) => paidIds.has(id))).length;
    return {
      fit: {
        categoryId: category.id,
        name: category.name,
        percent: Math.round((shown.length / matches.length) * 100),
        shown: shown.length,
        total: matches.length,
        matches,
      },
      paidBacked,
    };
  });

  return fits
    .sort((a, b) => b.fit.percent - a.fit.percent || b.paidBacked - a.paidBacked)
    .map((f) => f.fit);
}
