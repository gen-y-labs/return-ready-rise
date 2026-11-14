import { askAI, errorResponse, savedOrLive } from "@/lib/ai";
import { fixtures, practiceTasks } from "@/lib/data";
import { PLAN_PROMPT } from "@/lib/prompts";
import { finalizePlan } from "@/lib/readiness";
import { PlanSchema, type Answer, type AssessedRequirement, type Evidence, type JobListing } from "@/lib/types";

export async function POST(req: Request) {
  const { job, requirements, answers, evidence, prepMinutes, personaId } = (await req.json()) as {
    job: JobListing;
    requirements: AssessedRequirement[];
    answers: Record<string, Answer>;
    evidence: Evidence[];
    prepMinutes: number;
    personaId: string | null;
  };
  const open = requirements.filter((r) => r.status !== "met");
  if (!open.length) {
    return Response.json({ plan: { items: [], beforeMinutes: 0, prepMinutes }, saved: false });
  }

  try {
    const { data, saved } = await savedOrLive(personaId ? fixtures[personaId]?.readiness[job.id]?.plan : undefined, () =>
      askAI(PlanSchema, PLAN_PROMPT, {
        job: { title: job.title, company: job.company, summary: job.summary, scheduleText: job.scheduleText },
        requirements: open.map((r) => ({
          requirementId: r.id,
          text: r.text,
          kind: r.kind,
          required: r.required,
          status: r.status,
          uncertain: r.uncertain,
          evidenceIds: r.evidenceIds,
          answer: answers[r.id] ?? null,
        })),
        evidence,
        practiceTasks,
        minutesAvailable: prepMinutes,
      }),
    );
    return Response.json({ plan: finalizePlan(data, requirements, answers, prepMinutes), saved });
  } catch (err) {
    return errorResponse("readiness plan", err, "We couldn't build your improvement plan. Please try again.");
  }
}
