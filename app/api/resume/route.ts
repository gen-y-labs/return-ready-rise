import { checkBullets } from "@/lib/checks";
import { askAI, errorResponse, savedOrLive } from "@/lib/ai";
import { fixtures, practiceTasks } from "@/lib/data";
import { RESUME_PROMPT } from "@/lib/prompts";
import { ResumeDraftSchema, type CategoryFit, type Profile, type Resume } from "@/lib/types";

export async function POST(req: Request) {
  const { profile, fit, personaId } = (await req.json()) as {
    profile: Profile;
    fit: CategoryFit;
    personaId: string | null;
  };

  try {
    const { data: draft, saved } = await savedOrLive(personaId ? fixtures[personaId]?.resumes[fit.categoryId] : undefined, () =>
      askAI(ResumeDraftSchema, RESUME_PROMPT, {
        jobArea: fit.name,
        keySkills: fit.matches.map((m) => ({ id: m.keySkillId, text: m.text, status: m.status })),
        evidence: profile.evidence,
        careerBreak: profile.careerBreak,
        practiceTasks: practiceTasks.map(({ id, title }) => ({ id, title })),
      }),
    );

    const allowed = new Map(profile.evidence.map((e) => [e.id, e]));
    // Practice projects are never shown as employment, and employment never as practice.
    const isPractice = (b: { evidenceIds: string[] }) => b.evidenceIds.every((id) => allowed.get(id)?.source === "practice");
    const brk = profile.careerBreak;
    const resume: Resume = {
      categoryId: fit.categoryId,
      summary: draft.summary,
      careerBreak: brk && {
        years: brk.years,
        titles: {
          minimal: "Career break",
          brief: `Career break · ${brk.briefReason}`,
          // A sentence-length reason doesn't fit a résumé heading; use the brief label instead.
          detailed:
            brk.detailedReason.length <= 40 && !/[.;]/.test(brk.detailedReason)
              ? `Career break · ${brk.detailedReason}`
              : `Career break · ${brk.briefReason}`,
        },
        bullets: checkBullets(draft.breakBullets.filter((b) => !isPractice(b)), allowed, brk.years),
      },
      experience: draft.experience.map((job) => ({
        ...job,
        bullets: checkBullets(job.bullets.filter((b) => !isPractice(b)), allowed, job.dates),
      })),
      practice: checkBullets(draft.practiceBullets.filter(isPractice), allowed),
      skills: draft.skills,
      education: draft.education,
      prepSteps: draft.prepTasks.slice(0, 3).flatMap((p) => {
        const task = practiceTasks.find((t) => t.id === p.taskId);
        return task ? [{ ...task, keySkillId: p.keySkillId }] : [];
      }),
    };
    return Response.json({ resume, saved });
  } catch (err) {
    return errorResponse("resume", err, "We couldn't build your résumé. Please try again.");
  }
}
