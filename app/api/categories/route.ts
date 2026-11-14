import { askClaude, withFallback } from "@/lib/claude";
import { categories, fixtures } from "@/lib/data";
import { CATEGORIES_PROMPT } from "@/lib/prompts";
import { scoreCategories } from "@/lib/score";
import { CategoryMatchesSchema, type Profile } from "@/lib/types";

export async function POST(req: Request) {
  const { profile, personaId } = (await req.json()) as { profile: Profile; personaId: string | null };

  try {
    const { data, fallback } = await withFallback(
      () =>
        askClaude(CategoryMatchesSchema, CATEGORIES_PROMPT, {
          evidence: profile.evidence,
          areas: categories.map(({ id, name, keySkills }) => ({ id, name, keySkills })),
        }),
      personaId ? fixtures[personaId]?.categories : undefined,
    );
    return Response.json({ fits: scoreCategories(data, categories, profile.evidence), fallback });
  } catch (err) {
    console.error("categories failed", err);
    return Response.json({ error: "We couldn't match your skills to job areas. Please try again." }, { status: 502 });
  }
}
