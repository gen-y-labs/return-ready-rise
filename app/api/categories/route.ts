import { askAI, errorResponse, savedOrLive } from "@/lib/ai";
import { categories, fixtures } from "@/lib/data";
import { CATEGORIES_PROMPT } from "@/lib/prompts";
import { scoreCategories } from "@/lib/score";
import { CategoryMatchesSchema, type Profile } from "@/lib/types";

export async function POST(req: Request) {
  const { profile, personaId } = (await req.json()) as { profile: Profile; personaId: string | null };

  try {
    const { data, saved } = await savedOrLive(personaId ? fixtures[personaId]?.categories : undefined, () =>
      askAI(CategoryMatchesSchema, CATEGORIES_PROMPT, {
        evidence: profile.evidence,
        areas: categories.map(({ id, name, keySkills }) => ({ id, name, keySkills })),
      }),
    );
    return Response.json({ fits: scoreCategories(data, categories, profile.evidence), saved });
  } catch (err) {
    return errorResponse("categories", err, "We couldn't match your skills to job areas. Please try again.");
  }
}
