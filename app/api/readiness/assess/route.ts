import { askClaude, withFallback } from "@/lib/claude";
import { fixtures } from "@/lib/data";
import { ASSESS_PROMPT } from "@/lib/prompts";
import { mergeAssessment } from "@/lib/readiness";
import { AssessmentSchema, type Evidence, type JobListing } from "@/lib/types";

export async function POST(req: Request) {
  const { job, evidence, personaId } = (await req.json()) as {
    job: JobListing;
    evidence: Evidence[];
    personaId: string | null;
  };

  try {
    const { data, fallback } = await withFallback(
      () =>
        askClaude(AssessmentSchema, ASSESS_PROMPT, {
          job: {
            title: job.title,
            company: job.company,
            summary: job.summary,
            requirements: job.requirements?.length ? job.requirements : null,
            postingText: job.requirements?.length ? null : (job.details ?? job.summary),
          },
          evidence,
        }),
      personaId ? fixtures[personaId]?.readiness[job.id]?.assess : undefined,
    );
    return Response.json({ requirements: mergeAssessment(job, data, evidence), fallback });
  } catch (err) {
    console.error("readiness assess failed", err);
    return Response.json({ error: "We couldn't check your readiness for this job. Please try again." }, { status: 502 });
  }
}
