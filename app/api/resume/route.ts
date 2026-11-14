import { checkBullets } from "@/lib/checks";
import { askClaude, withFallback } from "@/lib/claude";
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
    const { data: draft, fallback } = await withFallback(
      () =>
        askClaude(ResumeDraftSchema, RESUME_PROMPT, {
          jobArea: fit.name,
          keySkills: fit.matches.map((m) => ({ id: m.keySkillId, text: m.text, status: m.status })),
          evidence: profile.evidence,
          careerBreak: profile.careerBreak,
          practiceTasks: practiceTasks.map(({ id, title }) => ({ id, title })),
        }),
      personaId ? fixtures[personaId]?.resumes[fit.categoryId] : undefined,
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
          detailed: `Career break · ${brk.detailedReason}`,
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
    return Response.json({ resume, fallback });
  } catch (err) {
    console.error("resume failed", err);
    return Response.json({ error: "We couldn't build your résumé. Please try again." }, { status: 502 });
  }
}
