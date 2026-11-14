import { z } from "zod";
import categoriesJson from "@/data/categories.json";
import jobsJson from "@/data/jobs.json";
import tasksJson from "@/data/practice-tasks.json";
import extractPriya from "@/data/fixtures/extract-priya.json";
import categoriesPriya from "@/data/fixtures/categories-priya.json";
import resumePriyaAdmin from "@/data/fixtures/resume-priya-administrative-support.json";
import assessPriyaMvcs from "@/data/fixtures/readiness-priya-mvcs-assess.json";
import planPriyaMvcs from "@/data/fixtures/readiness-priya-mvcs-plan.json";
import extractDavid from "@/data/fixtures/extract-david.json";
import categoriesDavid from "@/data/fixtures/categories-david.json";
import resumeDavidOps from "@/data/fixtures/resume-david-operations-coordination.json";
import assessDavidGranite from "@/data/fixtures/readiness-david-granite-assess.json";
import planDavidGranite from "@/data/fixtures/readiness-david-granite-plan.json";
import extractEmily from "@/data/fixtures/extract-emily.json";
import categoriesEmily from "@/data/fixtures/categories-emily.json";
import resumeEmilyFrontDesk from "@/data/fixtures/resume-emily-front-desk-reception.json";
import assessEmilyTimp from "@/data/fixtures/readiness-emily-timp-dental-assess.json";
import planEmilyTimp from "@/data/fixtures/readiness-emily-timp-dental-plan.json";
import {
  AssessmentSchema,
  CategoryMatchesSchema,
  JobListingSchema,
  PlanSchema,
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

type Fixture = {
  profile: Profile;
  categories: CategoryMatches;
  resumes: Record<string, ResumeDraft>;
  readiness: Record<string, { assess: z.infer<typeof AssessmentSchema>; plan: z.infer<typeof PlanSchema> }>;
};

const readiness = (assess: unknown, plan: unknown) => ({
  assess: AssessmentSchema.parse(assess),
  plan: PlanSchema.parse(plan),
});

// Saved AI results for the example profiles, served instantly while the example is unchanged.
export const fixtures: Record<string, Fixture> = {
  priya: {
    profile: ProfileSchema.parse(extractPriya),
    categories: CategoryMatchesSchema.parse(categoriesPriya),
    resumes: { "administrative-support": ResumeDraftSchema.parse(resumePriyaAdmin) },
    readiness: { "mvcs-admin-coordinator": readiness(assessPriyaMvcs, planPriyaMvcs) },
  },
  david: {
    profile: ProfileSchema.parse(extractDavid),
    categories: CategoryMatchesSchema.parse(categoriesDavid),
    resumes: { "operations-coordination": ResumeDraftSchema.parse(resumeDavidOps) },
    readiness: { "granite-peak-ops-manager": readiness(assessDavidGranite, planDavidGranite) },
  },
  emily: {
    profile: ProfileSchema.parse(extractEmily),
    categories: CategoryMatchesSchema.parse(categoriesEmily),
    resumes: { "front-desk-reception": ResumeDraftSchema.parse(resumeEmilyFrontDesk) },
    readiness: { "timp-dental-reception": readiness(assessEmilyTimp, planEmilyTimp) },
  },
};
