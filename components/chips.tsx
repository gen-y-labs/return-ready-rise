import type { Arrangement, JobListing, Status } from "@/lib/types";

const STATUS: Record<Status, [string, string]> = {
  supported: ["Supported", "bg-emerald-100 text-emerald-800"],
  refresh: ["Refresh", "bg-indigo-100 text-indigo-800"],
  needs_clarification: ["Needs clarification", "bg-amber-100 text-amber-800"],
  missing: ["Missing", "bg-rose-100 text-rose-800"],
};

const ARRANGEMENT: Record<Arrangement["status"], [string, string]> = {
  fits: ["Fits your hours", "bg-emerald-100 text-emerald-800"],
  needs_confirmation: ["Needs confirmation", "bg-amber-100 text-amber-800"],
  conflict: ["Conflict", "bg-rose-100 text-rose-800"],
};

const chip = "text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap h-fit";

export function StatusChip({ status }: { status: Status }) {
  const [label, color] = STATUS[status];
  return <span className={`${chip} ${color}`}>{label}</span>;
}

export function ArrangementChip({ status }: { status: Arrangement["status"] }) {
  const [label, color] = ARRANGEMENT[status];
  return <span className={`${chip} ${color}`}>{label}</span>;
}

export function SourceChip({ job }: { job: JobListing }) {
  const labels = {
    "jobs.utah.gov": [`jobs.utah.gov${job.capturedAt ? ` · saved ${job.capturedAt}` : ""}`, "bg-sky-50 text-sky-800"],
    adzuna: ["Adzuna · live", "bg-violet-50 text-violet-800"],
    remotive: ["Remotive · live", "bg-fuchsia-50 text-fuchsia-800"],
    sample: ["Sample listing", "bg-slate-100 text-slate-600"],
  } as const;
  const [label, color] = labels[job.source];
  return <span className={`${chip} ${color}`}>{label}</span>;
}
