"use client";

import { ArrangementChip, SourceChip, StatusChip } from "./chips";
import { time12 } from "@/lib/arrangement";
import type { Availability, CategoryFit, JobWithFit, JobsResponse, Recency } from "@/lib/types";

const RECENCY_LABEL: Record<Recency, string> = {
  day: "Posted in the last 24 hours",
  week: "Posted in the last 7 days",
  month: "Posted in the last 30 days",
  unknown: "Posting date not listed",
};

type Props = {
  fits: CategoryFit[];
  selected: string;
  onSelect: (categoryId: string) => void;
  jobs: JobsResponse | null;
  availability: Availability;
  busy: string | null;
  onBuildResume: () => void;
};

function JobCard({ job }: { job: JobWithFit }) {
  const a = job.arrangement;
  return (
    <div className={`bg-white rounded-xl border p-3 ${a.status === "fits" ? "border-emerald-300" : "border-slate-200"}`}>
      <div className="flex justify-between gap-2">
        <div>
          <div className="font-medium text-sm">{job.title}</div>
          <div className="text-xs text-slate-500">
            {job.company} · {job.location} · {job.pay}
          </div>
        </div>
        <ArrangementChip status={a.status} />
      </div>
      <div className="text-xs text-slate-600 mt-2">{job.scheduleText}</div>
      <ul className="text-xs mt-1 space-y-0.5">
        {a.reasons.map((r) => (
          <li key={r} className={a.status === "conflict" ? "text-rose-700" : a.status === "fits" ? "text-emerald-700" : "text-amber-800"}>
            {r}
          </li>
        ))}
      </ul>
      {a.confirm.length > 0 && (
        <div className="text-xs text-slate-600 mt-2">
          <span className="font-medium">Before applying:</span> {a.confirm.join(" ")}
        </div>
      )}
      <div className="flex justify-between items-center mt-2">
        <SourceChip job={job} />
        {job.url && (
          <a href={job.url} target="_blank" rel="noreferrer" className="text-xs text-teal-700 underline">
            View posting ↗
          </a>
        )}
      </div>
    </div>
  );
}

export function AreasStep({ fits, selected, onSelect, jobs, availability: av, busy, onBuildResume }: Props) {
  const fit = fits.find((f) => f.categoryId === selected)!;
  const groups = (["day", "week", "month", "unknown"] as Recency[])
    .map((r) => ({ recency: r, jobs: jobs?.jobs.filter((j) => j.recency === r) ?? [] }))
    .filter((g) => g.jobs.length);
  const toRaise = fit.matches.filter((m) => m.status !== "supported");

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Your job areas</h1>
          <p className="text-slate-600 mt-1 text-sm">% = key skills shown in your own examples. It is not a hiring prediction.</p>
        </div>
        <div className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-2">
          <span className="font-medium">Your terms:</span> {av.days.join(", ")} · {time12(av.start)}–{time12(av.end)} · ≤ {av.maxHoursPerWeek} hrs ·{" "}
          {[av.workplace.includes("remote") ? "Remote" : "", ...av.locations].filter(Boolean).join(", ")}
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-5 mt-5">
        <div className="lg:col-span-4 space-y-2">
          {fits.map((f) => {
            const on = f.categoryId === selected;
            const strong = f.percent >= 80;
            return (
              <button
                key={f.categoryId}
                onClick={() => onSelect(f.categoryId)}
                className={`w-full text-left bg-white rounded-xl border p-3 ${on ? "border-teal-500 ring-1 ring-teal-500" : "border-slate-200 hover:border-slate-300"}`}
              >
                <div className="flex justify-between gap-2">
                  <span className="font-medium text-sm">{f.name}</span>
                  <span className={`font-semibold tabular-nums ${strong ? "text-teal-700" : "text-slate-600"}`}>{f.percent}%</span>
                </div>
                <div className="mt-2 h-1.5 bg-slate-100 rounded-full">
                  <div className={`h-1.5 rounded-full ${strong ? "bg-teal-600" : "bg-slate-400"}`} style={{ width: `${f.percent}%` }} />
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {f.shown} of {f.total} key skills shown in your examples
                </div>
                {on && (
                  <ul className="mt-2 space-y-1.5">
                    {f.matches.map((m) => (
                      <li key={m.keySkillId} className="text-xs">
                        <div className="flex gap-2 items-start">
                          <StatusChip status={m.status} />
                          <span className="text-slate-700">{m.text}</span>
                        </div>
                        <div className="text-slate-500 ml-1 mt-0.5">{m.explanation}</div>
                        {m.question && <div className="text-amber-800 ml-1 mt-0.5">Q: {m.question}</div>}
                      </li>
                    ))}
                  </ul>
                )}
              </button>
            );
          })}
        </div>

        <div className="lg:col-span-5">
          <h2 className="font-semibold">{fit.name} jobs</h2>
          {busy === "jobs" && <div className="text-sm text-slate-500 mt-3">Loading jobs…</div>}
          {busy !== "jobs" && jobs && (
            <>
              <div className="text-xs text-slate-500 mt-1">
                Sources:{" "}
                {jobs.sources
                  .map((s) => `${s.name} ${s.status === "live" ? `(${s.count})` : s.status === "off" ? "(not connected)" : "(unavailable)"}`)
                  .join(" · ")}
                {jobs.hiddenByLocation > 0 && ` · ${jobs.hiddenByLocation} hidden outside your cities`}
              </div>
              {!groups.length && (
                <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
                  No jobs in your cities from the last 30 days. Try adding cities or turning on remote work.
                </div>
              )}
              {groups.map((g) => (
                <div key={g.recency} className="mt-4">
                  <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {RECENCY_LABEL[g.recency]} ({g.jobs.length})
                  </div>
                  <div className="mt-2 space-y-3">
                    {g.jobs.map((j) => (
                      <JobCard key={j.id} job={j} />
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        <aside className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-slate-200 p-4 lg:sticky lg:top-20">
            <div className="text-xs uppercase tracking-wide text-slate-500">Your résumé</div>
            <div className="font-semibold mt-1">Built for {fit.name.toLowerCase()}</div>
            <ul className="text-xs text-slate-600 mt-3 space-y-1">
              <li>Career break shown as a dated entry</li>
              <li>Every line traced to your own words</li>
              <li>Download as PDF</li>
            </ul>
            <button
              onClick={onBuildResume}
              disabled={busy !== null}
              className="mt-3 w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white rounded-lg py-2 font-medium text-sm"
            >
              {busy === "resume" ? "Writing your résumé…" : "Build my résumé"}
            </button>
            {toRaise.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-100 text-xs">
                <div className="font-medium text-slate-700">To raise this match</div>
                <ul className="mt-1 space-y-1 text-slate-600">
                  {toRaise.map((m) => (
                    <li key={m.keySkillId}>
                      <StatusChip status={m.status} /> {m.text}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
