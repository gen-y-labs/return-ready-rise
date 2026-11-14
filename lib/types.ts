import { z } from "zod";

export const SourceSchema = z.enum(["paid", "volunteer", "caregiving", "education"]);
export type Source = z.infer<typeof SourceSchema>;

export const EvidenceSchema = z.object({
  id: z.string(),
  text: z.string(),
  source: SourceSchema,
  org: z.string().nullable(),
  role: z.string().nullable(),
  years: z.string(),
  lastUsedYear: z.number().nullable(),
});
export type Evidence = z.infer<typeof EvidenceSchema>;

export const ProfileSchema = z.object({
  evidence: z.array(EvidenceSchema),
  skills: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      evidenceIds: z.array(z.string()),
      note: z.string().nullable(),
    }),
  ),
  careerBreak: z
    .object({
      years: z.string(),
      briefReason: z.string(),
      detailedReason: z.string(),
    })
    .nullable(),
});
export type Profile = z.infer<typeof ProfileSchema>;

export type Story = {
  pastWork: string;
  breakStory: string;
  breakActivities: string;
};

export type Contact = { name: string; email: string; phone: string; location: string };

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export type Day = (typeof DAYS)[number];
export type Workplace = "remote" | "hybrid" | "onsite";

export type Availability = {
  days: Day[];
  start: string;
  end: string;
  maxHoursPerWeek: number;
  locations: string[];
  workplace: Workplace[];
};

export type Persona = {
  id: string;
  label: string;
  contact: Contact;
  story: Story;
  availability: Availability;
};

export type Category = {
  id: string;
  name: string;
  searchTerm: string;
  keySkills: { id: string; text: string }[];
};

export const StatusSchema = z.enum(["supported", "needs_clarification", "refresh", "missing"]);
export type Status = z.infer<typeof StatusSchema>;

export const CategoryMatchesSchema = z.object({
  categories: z.array(
    z.object({
      categoryId: z.string(),
      matches: z.array(
        z.object({
          keySkillId: z.string(),
          status: StatusSchema,
          evidenceIds: z.array(z.string()),
          explanation: z.string(),
          question: z.string().nullable(),
        }),
      ),
    }),
  ),
});
export type CategoryMatches = z.infer<typeof CategoryMatchesSchema>;

export type CategoryFit = {
  categoryId: string;
  name: string;
  percent: number;
  shown: number;
  total: number;
  matches: (CategoryMatches["categories"][number]["matches"][number] & { text: string })[];
};

export const JobListingSchema = z.object({
  id: z.string(),
  source: z.enum(["jobs.utah.gov", "adzuna", "remotive", "sample"]),
  url: z.string().nullable(),
  postedAt: z.string().nullable(),
  capturedAt: z.string().nullable(),
  categoryId: z.string(),
  title: z.string(),
  company: z.string(),
  location: z.string(),
  workplace: z.enum(["remote", "hybrid", "onsite"]).nullable(),
  employmentType: z.enum(["full_time", "part_time"]).nullable().optional(),
  schedule: z
    .object({
      days: z.array(z.enum(DAYS)),
      start: z.string(),
      end: z.string(),
      hoursPerWeek: z.number(),
      exceptions: z.string().optional(),
    })
    .nullable(),
  scheduleText: z.string(),
  pay: z.string(),
  summary: z.string(),
});
export type JobListing = z.infer<typeof JobListingSchema>;

export type Arrangement = {
  status: "fits" | "conflict" | "needs_confirmation";
  reasons: string[];
  confirm: string[];
};
export type Recency = "day" | "week" | "month" | "unknown";
export type JobWithFit = JobListing & { arrangement: Arrangement; recency: Recency };
export type SourceStatus = { name: string; status: "live" | "off" | "error"; count: number };
export type JobsResponse = { jobs: JobWithFit[]; hiddenByLocation: number; sources: SourceStatus[] };

const BulletDraftSchema = z.object({ id: z.string(), text: z.string(), evidenceIds: z.array(z.string()) });

export const ResumeDraftSchema = z.object({
  summary: z.object({ text: z.string(), evidenceIds: z.array(z.string()) }),
  breakBullets: z.array(BulletDraftSchema),
  experience: z.array(
    z.object({
      title: z.string(),
      org: z.string(),
      location: z.string().nullable(),
      dates: z.string(),
      bullets: z.array(BulletDraftSchema),
    }),
  ),
  skills: z.array(z.string()),
  education: z.array(z.string()),
  prepTasks: z.array(z.object({ taskId: z.string(), keySkillId: z.string() })),
});
export type ResumeDraft = z.infer<typeof ResumeDraftSchema>;

export type Flag = { kind: "number_not_in_evidence"; detail: string };
export type Bullet = z.infer<typeof BulletDraftSchema> & { flags: Flag[] };
export type PracticeTask = { id: string; title: string; minutes: number; task: string };

export type Resume = {
  categoryId: string;
  summary: { text: string; evidenceIds: string[] };
  careerBreak: {
    years: string;
    titles: { minimal: string; brief: string; detailed: string };
    bullets: Bullet[];
  } | null;
  experience: { title: string; org: string; location: string | null; dates: string; bullets: Bullet[] }[];
  skills: string[];
  education: string[];
  prepSteps: (PracticeTask & { keySkillId: string })[];
};
