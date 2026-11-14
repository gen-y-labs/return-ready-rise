import { z } from "zod";
import categoriesJson from "@/data/categories.json";
import jobsJson from "@/data/jobs.json";
import tasksJson from "@/data/practice-tasks.json";
import extractPriya from "@/data/fixtures/extract-priya.json";
import categoriesPriya from "@/data/fixtures/categories-priya.json";
import resumePriyaAdmin from "@/data/fixtures/resume-priya-administrative-support.json";
import {
  CategoryMatchesSchema,
  JobListingSchema,
  ProfileSchema,
  ResumeDraftSchema,
  type Category,
  type CategoryMatches,
  type PracticeTask,
  type Profile,
  type ResumeDraft,
} from "./types";

export const categories: Category[] = categoriesJson;
export const practiceTasks: PracticeTask[] = tasksJson;
export const savedJobs = z.array(JobListingSchema).parse(jobsJson);

type Fixture = { profile: Profile; categories: CategoryMatches; resumes: Record<string, ResumeDraft> };

// Saved responses for the demo persona, used when the Claude API is unavailable.
export const fixtures: Record<string, Fixture> = {
  priya: {
    profile: ProfileSchema.parse(extractPriya),
    categories: CategoryMatchesSchema.parse(categoriesPriya),
    resumes: { "administrative-support": ResumeDraftSchema.parse(resumePriyaAdmin) },
  },
};
