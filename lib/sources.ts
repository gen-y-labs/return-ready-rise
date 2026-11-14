import { savedJobs } from "./data";
import type { Category, JobListing, SourceStatus } from "./types";

type Source = { name: string; run: (category: Category) => Promise<JobListing[] | null> };

const cache = new Map<string, { at: number; jobs: JobListing[] }>();

async function cached(key: string, ttlMs: number, load: () => Promise<JobListing[]>): Promise<JobListing[]> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < ttlMs) return hit.jobs;
  const jobs = await load();
  cache.set(key, { at: Date.now(), jobs });
  return jobs;
}

function plainText(html: string, max = 220): string {
  const text = html.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

function payRange(min?: number, max?: number): string {
  if (!min && !max) return "Pay not listed";
  const fmt = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
  return min && max && min !== max ? `${fmt(min)}–${fmt(max)}/yr` : `${fmt((min ?? max)!)}/yr`;
}

type AdzunaJob = {
  id: string;
  title: string;
  description: string;
  redirect_url: string;
  created: string;
  company?: { display_name?: string };
  location?: { display_name?: string };
  salary_min?: number;
  salary_max?: number;
  contract_time?: string;
};

function employmentType(value: string | undefined): "full_time" | "part_time" | null {
  return value === "full_time" || value === "part_time" ? value : null;
}

async function adzuna(category: Category): Promise<JobListing[] | null> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) return null;

  // Free tier is about 250 calls a day.
  return cached(`adzuna:${category.id}`, 60 * 60 * 1000, async () => {
    const params = new URLSearchParams({
      app_id: appId,
      app_key: appKey,
      what: category.searchTerm,
      where: "Utah",
      results_per_page: "20",
    });
    const res = await fetch(`https://api.adzuna.com/v1/api/jobs/us/search/1?${params}`);
    if (!res.ok) throw new Error(`Adzuna returned ${res.status}`);
    const body = (await res.json()) as { results: AdzunaJob[] };
    return body.results.map((j) => ({
      id: `adzuna-${j.id}`,
      source: "adzuna" as const,
      url: j.redirect_url,
      postedAt: j.created,
      capturedAt: null,
      categoryId: category.id,
      title: plainText(j.title, 120),
      company: j.company?.display_name ?? "Company not listed",
      location: j.location?.display_name ?? "Utah",
      workplace: null,
      employmentType: employmentType(j.contract_time),
      schedule: null,
      scheduleText: `${j.contract_time === "part_time" ? "Part-time. " : j.contract_time === "full_time" ? "Full-time. " : ""}Hours not listed.`,
      pay: payRange(j.salary_min, j.salary_max),
      summary: plainText(j.description),
      details: plainText(j.description, 2000),
    }));
  });
}

type RemotiveJob = {
  id: number;
  url: string;
  title: string;
  company_name: string;
  job_type: string;
  publication_date: string;
  candidate_required_location: string;
  salary: string;
  description: string;
};

const US_OK = /usa|united states|\bus\b|americas|north america|worldwide|anywhere/i;

async function remotive(category: Category): Promise<JobListing[]> {
  // Remotive asks for at most a few calls a day and blocks more than 2 a minute.
  return cached(`remotive:${category.id}`, 6 * 60 * 60 * 1000, async () => {
    const params = new URLSearchParams({ search: category.searchTerm, limit: "20" });
    const res = await fetch(`https://remotive.com/api/remote-jobs?${params}`);
    if (!res.ok) throw new Error(`Remotive returned ${res.status}`);
    const body = (await res.json()) as { jobs: RemotiveJob[] };
    // Remotive's search also matches descriptions, so keep only titles that name the role.
    const titleWords = category.searchTerm.split(" ").filter((w) => w.length > 3);
    return body.jobs
      .filter((j) => US_OK.test(j.candidate_required_location))
      .filter((j) => titleWords.some((w) => j.title.toLowerCase().includes(w)))
      .map((j) => ({
        id: `remotive-${j.id}`,
        source: "remotive" as const,
        url: j.url,
        postedAt: j.publication_date,
        capturedAt: null,
        categoryId: category.id,
        title: j.title,
        company: j.company_name,
        location: `Remote (${j.candidate_required_location})`,
        workplace: "remote" as const,
        employmentType: employmentType(j.job_type),
        schedule: null,
        scheduleText: `${j.job_type === "part_time" ? "Part-time" : "Full-time"}. Hours not listed.`,
        pay: j.salary || "Pay not listed",
        summary: plainText(j.description),
        details: plainText(j.description, 2000),
      }));
  });
}

// Add a new job API here: return null when it isn't configured, throw on failure.
const SOURCES: Source[] = [
  { name: "Saved listings", run: async (c) => savedJobs.filter((j) => j.categoryId === c.id) },
  { name: "Adzuna", run: adzuna },
  { name: "Remotive", run: remotive },
];

export async function fetchJobs(category: Category): Promise<{ jobs: JobListing[]; sources: SourceStatus[] }> {
  const results = await Promise.allSettled(SOURCES.map((s) => s.run(category)));
  const jobs: JobListing[] = [];
  const sources = results.map((r, i): SourceStatus => {
    const name = SOURCES[i].name;
    if (r.status === "rejected") {
      console.error(`${name} failed`, r.reason);
      return { name, status: "error", count: 0 };
    }
    if (r.value === null) return { name, status: "off", count: 0 };
    jobs.push(...r.value);
    return { name, status: "live", count: r.value.length };
  });
  return { jobs, sources };
}
