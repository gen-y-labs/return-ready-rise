import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import type { z } from "zod";

export async function askClaude<S extends z.ZodType>(
  schema: S,
  system: string,
  input: unknown,
): Promise<z.infer<S>> {
  const client = new Anthropic();
  const response = await client.beta.messages.parse({
    model: "claude-opus-5-5",
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    output_config: { effort: "low", format: betaZodOutputFormat(schema) },
    system,
    messages: [{ role: "user", content: JSON.stringify(input) }],
  });
  if (response.stop_reason === "refusal") throw new Error("Claude declined this request.");
  if (!response.parsed_output) throw new Error(`No structured output (stop reason: ${response.stop_reason}).`);
  return response.parsed_output;
}

// Returns the saved demo response when the live call fails, so the demo never stalls on stage.
export async function withFallback<T>(
  run: () => Promise<T>,
  fixture: T | undefined,
): Promise<{ data: T; fallback: boolean }> {
  try {
    return { data: await run(), fallback: false };
  } catch (err) {
    if (fixture === undefined) throw err;
    console.error("Claude call failed; using saved demo response.", err);
    return { data: fixture, fallback: true };
  }
}
