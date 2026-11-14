import { askAI, errorResponse, savedOrLive } from "@/lib/ai";
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
    const { data, saved } = await savedOrLive(personaId ? fixtures[personaId]?.readiness[job.id]?.assess : undefined, () =>
      askAI(AssessmentSchema, ASSESS_PROMPT, {
        job: {
          title: job.title,
          company: job.company,
          summary: job.summary,
          requirements: job.requirements?.length ? job.requirements : null,
          postingText: job.requirements?.length ? null : (job.details ?? job.summary),
        },
        evidence,
      }),
    );
    return Response.json({ requirements: mergeAssessment(job, data, evidence), saved });
  } catch (err) {
    return errorResponse("readiness assess", err, "We couldn't check your readiness for this job. Please try again.");
  }
}
