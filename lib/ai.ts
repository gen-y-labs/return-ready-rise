import { ApiError, GoogleGenAI } from "@google/genai";
import { z } from "zod";

// Google's recommended model for new projects (Nov 2026). Carbon/Argon need a billed plan; set GEMINI_MODEL to switch.
const MODEL = process.env.GEMINI_MODEL || "gemini-4-hydrogen";

export async function askAI<S extends z.ZodType>(schema: S, system: string, input: unknown): Promise<z.infer<S>> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set.");

  const jsonSchema = z.toJSONSchema(schema) as Record<string, unknown>;
  delete jsonSchema.$schema;

  const response = await new GoogleGenAI({ apiKey }).models.generateContent({
    model: MODEL,
    contents: JSON.stringify(input),
    config: {
      systemInstruction: system,
      responseMimeType: "application/json",
      responseJsonSchema: jsonSchema,
    },
  });

  const text = response.text;
  if (!text) {
    const reason = response.candidates?.[0]?.finishReason ?? response.promptFeedback?.blockReason ?? "unknown";
    throw new Error(`Gemini returned no text (reason: ${reason}).`);
  }
  // Gemini follows the schema but does not guarantee every value, so validate before use.
  return schema.parse(JSON.parse(text));
}

// Example profiles use saved results so the demo is instant; everything else calls Gemini.
export async function savedOrLive<T>(saved: T | undefined, run: () => Promise<T>): Promise<{ data: T; saved: boolean }> {
  if (saved !== undefined) return { data: saved, saved: true };
  return { data: await run(), saved: false };
}

export function errorResponse(label: string, err: unknown, message: string) {
  console.error(`${label} failed`, err);
  if (err instanceof ApiError && err.status === 429) {
    return Response.json(
      { error: "The AI service has reached its usage limit. Try again later, or load one of the example profiles." },
      { status: 503 },
    );
  }
  return Response.json({ error: message }, { status: 502 });
}
