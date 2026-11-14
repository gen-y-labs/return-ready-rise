import { askClaude, withFallback } from "@/lib/claude";
import { fixtures } from "@/lib/data";
import { EXTRACT_PROMPT } from "@/lib/prompts";
import { ProfileSchema, type Story } from "@/lib/types";

export async function POST(req: Request) {
  const { story, personaId } = (await req.json()) as { story: Story; personaId: string | null };
  if (!story.pastWork.trim() && !story.breakActivities.trim()) {
    return Response.json(
      { error: "Tell us about your past work or what you did during your break." },
      { status: 400 },
    );
  }

  try {
    const { data, fallback } = await withFallback(
      () => askClaude(ProfileSchema, EXTRACT_PROMPT, { currentYear: new Date().getFullYear(), ...story }),
      personaId ? fixtures[personaId]?.profile : undefined,
    );
    return Response.json({ profile: data, fallback });
  } catch (err) {
    console.error("extract failed", err);
    return Response.json({ error: "We couldn't analyze your story. Please try again." }, { status: 502 });
  }
}
