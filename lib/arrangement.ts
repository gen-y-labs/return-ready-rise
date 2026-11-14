import type { Arrangement, Availability, JobListing, Recency } from "./types";

const WORKPLACE_LABEL = { remote: "Remote", hybrid: "Hybrid", onsite: "On-site" } as const;

export function time12(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "p.m." : "a.m.";
  const hour = h % 12 || 12;
  return m ? `${hour}:${String(m).padStart(2, "0")} ${suffix}` : `${hour} ${suffix}`;
}

export function inPreferredLocation(job: JobListing, a: Availability): boolean {
  if (job.workplace === "remote") return a.workplace.includes("remote");
  const place = job.location.toLowerCase();
  return a.locations.some((city) => place.includes(city.toLowerCase()));
}

export function checkArrangement(job: JobListing, a: Availability): Arrangement {
  const conflicts: string[] = [];
  const unknowns: string[] = [];
  const confirm: string[] = [];
  const s = job.schedule;

  if (!s && job.employmentType === "full_time" && a.maxHoursPerWeek < 35) {
    conflicts.push(`Full-time role. Your limit is ${a.maxHoursPerWeek} hrs/week.`);
  } else if (!s) {
    unknowns.push("Hours are not listed. Remote does not always mean flexible hours.");
    confirm.push("Ask which hours the role needs you to be working or online.");
  } else {
    const badDays = s.days.filter((d) => !a.days.includes(d));
    if (badDays.length) conflicts.push(`Needs ${badDays.join(", ")}, which you can't work.`);
    if (s.start < a.start || s.end > a.end) {
      conflicts.push(
        `Hours ${time12(s.start)}–${time12(s.end)} are outside your ${time12(a.start)}–${time12(a.end)} window.`,
      );
    }
    if (s.hoursPerWeek > a.maxHoursPerWeek) {
      conflicts.push(`Needs ${s.hoursPerWeek} hrs/week. Your limit is ${a.maxHoursPerWeek}.`);
    }
    if (s.exceptions) {
      unknowns.push(`Also: ${s.exceptions}.`);
      confirm.push(`Ask whether "${s.exceptions.toLowerCase()}" is required.`);
    }
  }

  if (!job.workplace) confirm.push("Ask whether the job is remote, hybrid, or on-site.");
  if (job.workplace && !a.workplace.includes(job.workplace)) {
    conflicts.push(`${WORKPLACE_LABEL[job.workplace]} work isn't one of your choices.`);
  }
  if (job.workplace === "hybrid" || job.workplace === "onsite") {
    confirm.push(`Check travel time to the office in ${job.location} on office days.`);
  }

  if (conflicts.length) return { status: "conflict", reasons: conflicts, confirm: [] };
  if (unknowns.length) return { status: "needs_confirmation", reasons: unknowns, confirm };
  return {
    status: "fits",
    reasons: [`${time12(s!.start)}–${time12(s!.end)}, ${s!.hoursPerWeek} hrs/week fits your hours.`],
    confirm,
  };
}

const HOUR = 60 * 60 * 1000;

export function recencyOf(postedAt: string | null, now: number): Recency | "older" {
  if (!postedAt) return "unknown";
  const age = now - new Date(postedAt).getTime();
  if (age <= 24 * HOUR) return "day";
  if (age <= 7 * 24 * HOUR) return "week";
  if (age <= 30 * 24 * HOUR) return "month";
  return "older";
}
