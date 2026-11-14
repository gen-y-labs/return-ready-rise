import type { z } from "zod";
import type {
  Answer,
  AssessedRequirement,
  AssessmentSchema,
  Evidence,
  GapType,
  JobListing,
  Plan,
  PlanItem,
  PlanSchema,
} from "./types";

const requiredRank = (required: boolean | null) => (required === true ? 0 : required === null ? 1 : 2);
const normId = (id: string) => id.toLowerCase().replace(/[^a-z0-9]/g, "");
const PRIORITY_RANK = { before_applying: 0, ask_employer: 1, alongside_applying: 2 };

export function mergeAssessment(
  job: JobListing,
  ai: z.infer<typeof AssessmentSchema>,
  evidence: Evidence[],
): AssessedRequirement[] {
  const byId = new Map(evidence.map((e) => [e.id, e]));
  const listed = job.requirements ?? [];
  const fromPosting = listed.length === 0;

  // Listed requirements are trusted data: keep their text, kind, and required flag.
  const rows = fromPosting
    ? ai.requirements
    : listed.map((req, i) => {
        // Models sometimes reformat ids ("R1", "1"); fall back to position when the counts line up.
        const found =
          ai.requirements.find((r) => normId(r.id) === normId(req.id)) ??
          (ai.requirements.length === listed.length ? ai.requirements[i] : undefined);
        return {
          ...req,
          status: found?.status ?? ("not_shown" as const),
          evidenceIds: found?.evidenceIds ?? [],
          uncertain: found?.uncertain ?? "Not assessed yet.",
          question: found?.question ?? null,
        };
      });

  return rows
    .map((r) => {
      const evidenceIds = r.evidenceIds.filter((id) => byId.has(id));
      const practiceOnly = evidenceIds.length > 0 && evidenceIds.every((id) => byId.get(id)!.source === "practice");
      let status = r.status;
      if (status === "met" && evidenceIds.length === 0) status = "not_shown";
      // We never verify credentials, and practice never counts as work experience.
      if (r.kind === "credential") status = "credential_check";
      else if (r.kind === "experience" && practiceOnly && status === "met") status = "partial";
      return { ...r, evidenceIds, status, fromPosting };
    })
    .sort((a, b) => requiredRank(a.required) - requiredRank(b.required));
}

export function gapTypeOf(r: AssessedRequirement, answer: Answer | undefined): GapType {
  if (r.status === "credential_check") return "credential";
  if (answer === "have") return "not_in_profile";
  if (answer === "refresh") return "refresh";
  if (answer === "learn") return "missing_skill";
  return r.status === "partial" ? "partly_shown" : "unconfirmed";
}

function byPriority(a: PlanItem, b: PlanItem) {
  return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] || requiredRank(a.required) - requiredRank(b.required);
}

export function finalizePlan(
  draft: z.infer<typeof PlanSchema>,
  requirements: AssessedRequirement[],
  answers: Record<string, Answer>,
  prepMinutes: number,
): Plan {
  const byId = new Map(requirements.map((r) => [r.id, r]));
  const items: PlanItem[] = draft.items.flatMap((item, n) => {
    const req = byId.get(item.requirementId);
    if (!req || req.status === "met") return [];
    return [
      {
        ...item,
        id: `p${n + 1}`,
        minutes: Math.max(5, Math.round(item.minutes)),
        requirementText: req.text,
        required: req.required,
        gapType: gapTypeOf(req, answers[req.id]),
        movedForTime: false,
      },
    ];
  });
  items.sort(byPriority);

  // Keep before-applying work within the stated time by moving preferred items later.
  let beforeMinutes = items.filter((i) => i.priority === "before_applying").reduce((sum, i) => sum + i.minutes, 0);
  for (const item of [...items].reverse()) {
    if (beforeMinutes <= prepMinutes) break;
    if (item.priority === "before_applying" && item.required !== true) {
      item.priority = "alongside_applying";
      item.movedForTime = true;
      beforeMinutes -= item.minutes;
    }
  }
  items.sort(byPriority);

  return { items, beforeMinutes, prepMinutes };
}
