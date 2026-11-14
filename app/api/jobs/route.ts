import { checkArrangement, inPreferredLocation, recencyOf } from "@/lib/arrangement";
import { categories } from "@/lib/data";
import { fetchJobs } from "@/lib/sources";
import type { Availability, JobWithFit, JobsResponse } from "@/lib/types";

const RECENCY_ORDER = { day: 0, week: 1, month: 2, unknown: 3 };
const FIT_ORDER = { fits: 0, needs_confirmation: 1, conflict: 2 };

export async function POST(req: Request) {
  const { categoryId, availability } = (await req.json()) as { categoryId: string; availability: Availability };
  const category = categories.find((c) => c.id === categoryId);
  if (!category) return Response.json({ error: "Unknown job area." }, { status: 400 });

  const { jobs, sources } = await fetchJobs(category);
  const now = Date.now();
  let hiddenByLocation = 0;
  const shown: JobWithFit[] = [];

  for (const job of jobs) {
    if (!inPreferredLocation(job, availability)) {
      hiddenByLocation++;
      continue;
    }
    const recency = recencyOf(job.postedAt, now);
    if (recency === "older") continue;
    shown.push({ ...job, recency, arrangement: checkArrangement(job, availability) });
  }

  shown.sort(
    (a, b) =>
      RECENCY_ORDER[a.recency] - RECENCY_ORDER[b.recency] ||
      FIT_ORDER[a.arrangement.status] - FIT_ORDER[b.arrangement.status],
  );

  const body: JobsResponse = { jobs: shown, hiddenByLocation, sources };
  return Response.json(body);
}
