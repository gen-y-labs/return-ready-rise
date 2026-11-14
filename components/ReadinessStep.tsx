"use client";

import { useState } from "react";
import { ArrangementChip } from "./chips";
import type { Answer, AssessedRequirement, Evidence, GapType, JobWithFit, Plan, PlanItem, Source } from "@/lib/types";

export const isUserAdded = (e: Evidence) => e.id.startsWith("u");

const chip = "text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap h-fit";

const STATUS: Record<AssessedRequirement["status"], [string, string]> = {
  met: ["Shown in your profile", "bg-emerald-100 text-emerald-800"],
  partial: ["Partly shown", "bg-amber-100 text-amber-800"],
  not_shown: ["Not shown yet", "bg-slate-200 text-slate-700"],
  credential_check: ["Employer must verify", "bg-indigo-100 text-indigo-800"],
};

const GAP: Record<GapType, string> = {
  not_in_profile: "Experience not in your profile yet",
  partly_shown: "Partly shown",
  unconfirmed: "No evidence yet (not confirmed missing)",
  refresh: "Needs a refresher",
  missing_skill: "New skill to learn",
  credential: "Formal requirement to verify",
};

const ACTION: Record<PlanItem["action"], string> = {
  improve_profile: "Improve your profile",
  refresh: "Refresh a skill",
  learn: "Learn a new skill",
  demonstrate: "Show you can do it",
  verify_requirement: "Verify a formal requirement",
  ask_employer: "Ask the employer",
};

const GROUPS: [PlanItem["priority"], string][] = [
  ["before_applying", "Before you apply"],
  ["ask_employer", "Ask the employer"],
  ["alongside_applying", "Alongside applying"],
];

const PREP_OPTIONS: [number, string][] = [[30, "30 minutes"], [60, "1 hour"], [120, "2 hours"], [240, "4 hours"], [480, "8 hours"]];

const SOURCE_TEXT: Record<Source, string> = {
  paid: "Paid work",
  volunteer: "Volunteer",
  caregiving: "Caregiving",
  education: "Course or credential",
  practice: "Practice project",
};

function hours(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return [h ? `${h} hr` : "", m ? `${m} min` : ""].filter(Boolean).join(" ") || "0 min";
}

function RequiredChip({ required }: { required: boolean | null }) {
  if (required === null) return <span className={`${chip} bg-slate-100 text-slate-600`}>Not stated</span>;
  return required ? (
    <span className={`${chip} bg-slate-800 text-white`}>Required</span>
  ) : (
    <span className={`${chip} bg-slate-100 text-slate-600`}>Preferred</span>
  );
}

function AddEvidenceForm({
  sources,
  prompt,
  onAdd,
}: {
  sources: Source[];
  prompt: string;
  onAdd: (text: string, source: Source) => void;
}) {
  const [text, setText] = useState("");
  const [source, setSource] = useState<Source>(sources[0]);
  const [accurate, setAccurate] = useState(false);
  const [added, setAdded] = useState(false);

  if (added) return <div className="text-xs text-emerald-700 mt-2">Added to your profile. Reassess to see the change.</div>;
  return (
    <div className="mt-2 rounded-lg bg-slate-50 border border-slate-200 p-3 space-y-2 text-sm">
      <label className="block text-slate-700">
        {prompt}
        <textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} className="mt-1 w-full border border-slate-300 rounded-lg p-2 bg-white" />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        {sources.length > 1 && (
          <select value={source} onChange={(e) => setSource(e.target.value as Source)} className="border border-slate-300 rounded-lg p-1.5 bg-white text-xs">
            {sources.map((s) => (
              <option key={s} value={s}>
                {SOURCE_TEXT[s]}
              </option>
            ))}
          </select>
        )}
        <label className="flex items-center gap-2 text-xs text-slate-600">
          <input type="checkbox" checked={accurate} onChange={(e) => setAccurate(e.target.checked)} />
          This is accurate and in my own words
        </label>
        <button
          disabled={!text.trim() || !accurate}
          onClick={() => {
            onAdd(text.trim(), source);
            setAdded(true);
          }}
          className="ml-auto bg-slate-800 text-white rounded-lg px-3 py-1.5 text-xs disabled:opacity-40"
        >
          Add to my profile
        </button>
      </div>
    </div>
  );
}

function RequirementCard({
  req,
  evidenceById,
  answer,
  onAnswer,
  onAddEvidence,
}: {
  req: AssessedRequirement;
  evidenceById: Map<string, Evidence>;
  answer: Answer | undefined;
  onAnswer: (a: Answer) => void;
  onAddEvidence: (text: string, source: Source) => void;
}) {
  const [label, color] = STATUS[req.status];
  const credential = req.status === "credential_check";
  const options: [Answer, string][] = credential
    ? [["have", "I have it"], ["learn", "I don't have it yet"], ["unsure", "Not sure"]]
    : [["have", "I already do this"], ["refresh", "I need a refresher"], ["learn", "I need to learn it"], ["unsure", "Not sure"]];

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="font-medium text-sm flex-1 min-w-0">{req.text}</div>
        <div className="flex gap-1">
          <RequiredChip required={req.required} />
          <span className={`${chip} ${color}`}>{label}</span>
        </div>
      </div>
      {req.fromPosting && <div className="text-[11px] text-slate-500 mt-0.5">Read from the posting text</div>}

      {req.evidenceIds.map((id) => {
        const e = evidenceById.get(id);
        return (
          e && (
            <div key={id} className="mt-1.5 text-xs text-slate-600 border-l-2 border-slate-300 pl-2">
              &ldquo;{e.text}&rdquo; <span className="text-slate-400">· {isUserAdded(e) ? `Added by you · ${SOURCE_TEXT[e.source]}` : SOURCE_TEXT[e.source]}</span>
            </div>
          )
        );
      })}

      {req.status !== "met" && (
        <>
          {req.uncertain && <p className="text-xs text-slate-600 mt-2">{req.uncertain}</p>}
          {req.question && <p className="text-sm text-slate-800 mt-1 font-medium">{req.question}</p>}
          {credential && <p className="text-xs text-indigo-800 mt-1">Only the employer or issuing body can confirm this. We never mark it as met.</p>}
          <div className="flex flex-wrap gap-2 mt-2">
            {options.map(([a, text]) => (
              <button
                key={a}
                onClick={() => onAnswer(a)}
                className={`text-xs rounded-full border px-3 py-1 ${
                  answer === a ? "bg-teal-600 border-teal-600 text-white" : "border-slate-300 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {text}
              </button>
            ))}
          </div>
          {answer === "have" && (
            <AddEvidenceForm
              sources={credential ? ["education"] : ["paid", "volunteer"]}
              prompt={credential ? "Which credential do you have, and when does it expire?" : "Describe a time you did this: what you did, where, and when."}
              onAdd={onAddEvidence}
            />
          )}
        </>
      )}
    </div>
  );
}

function PlanItemCard({
  item,
  done,
  onToggle,
  onAddEvidence,
}: {
  item: PlanItem;
  done: boolean;
  onToggle: () => void;
  onAddEvidence: (text: string, source: Source) => void;
}) {
  return (
    <div className={`bg-white rounded-xl border p-3 ${done ? "border-emerald-300" : "border-slate-200"}`}>
      <div className="flex items-start gap-3">
        <input type="checkbox" checked={done} onChange={onToggle} className="mt-1 h-4 w-4 shrink-0" aria-label={`Mark "${item.activity}" done`} />
        <div className="flex-1 min-w-0 space-y-1 text-sm">
          <div className="flex flex-wrap gap-1">
            <span className={`${chip} bg-teal-50 text-teal-800`}>{ACTION[item.action]}</span>
            <span className={`${chip} bg-slate-100 text-slate-700`}>{GAP[item.gapType]}</span>
            <RequiredChip required={item.required} />
          </div>
          <div className="text-xs text-slate-500">For: {item.requirementText}</div>
          <div className="font-medium">{item.activity}</div>
          <div className="text-slate-600 text-xs">{item.why}</div>
          <div className="text-xs text-slate-600">
            <span className="font-medium">Estimated:</span> about {hours(item.minutes)} (estimate) · <span className="font-medium">Done when:</span> {item.doneWhen}
          </div>
          {item.evidenceToAdd && (
            <div className="text-xs text-slate-600">
              <span className="font-medium">Afterwards:</span> {item.evidenceToAdd}
            </div>
          )}
          {item.searchSuggestions.length > 0 && (
            <div className="text-xs text-slate-600">
              <span className="font-medium">Search for:</span> {item.searchSuggestions.map((s) => `"${s}"`).join(", ")}
            </div>
          )}
          {item.movedForTime && <div className="text-xs text-amber-800">Moved here to fit your preparation time.</div>}
          {done && item.action !== "ask_employer" && item.action !== "verify_requirement" && (
            <>
              <div className="text-xs text-slate-500">Checking this off doesn&apos;t change your assessment. Add what you did, then reassess.</div>
              <AddEvidenceForm
                sources={item.action === "improve_profile" ? ["paid", "volunteer"] : ["practice"]}
                prompt={item.action === "improve_profile" ? "Describe the experience: what you did, where, and when." : "What did you complete? This is saved as a practice project, not a job."}
                onAdd={onAddEvidence}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

type Props = {
  job: JobWithFit;
  requirements: AssessedRequirement[] | null;
  evidence: Evidence[];
  answers: Record<string, Answer>;
  onAnswer: (requirementId: string, a: Answer) => void;
  onAddEvidence: (text: string, source: Source) => void;
  prepMinutes: number;
  setPrepMinutes: (m: number) => void;
  plan: Plan | null;
  done: Set<string>;
  onToggleDone: (id: string) => void;
  busy: string | null;
  onMakePlan: () => void;
  onReassess: () => void;
  onBuildResume: () => void;
  onBack: () => void;
};

export function ReadinessStep(p: Props) {
  const evidenceById = new Map(p.evidence.map((e) => [e.id, e]));
  const reqs = p.requirements ?? [];
  const met = reqs.filter((r) => r.status === "met");
  const required = reqs.filter((r) => r.required === true);
  const added = p.evidence.filter(isUserAdded);

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <button onClick={p.onBack} className="text-xs text-slate-500 underline">
            ← Back to jobs
          </button>
          <h1 className="text-2xl font-semibold mt-1">Get ready: {p.job.title}</h1>
          <div className="text-sm text-slate-600">
            {p.job.company} · {p.job.location} · {p.job.pay}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-3 text-xs max-w-sm">
          <ArrangementChip status={p.job.arrangement.status} />
          <ul className="mt-1 text-slate-600">
            {p.job.arrangement.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-3">
          <div className="flex items-baseline justify-between gap-2">
            <h2 className="font-semibold">1. Where you stand</h2>
            {p.requirements && (
              <span className="text-xs text-slate-500">
                {met.length} of {reqs.length} shown in your profile · required: {required.filter((r) => r.status === "met").length} of {required.length}
              </span>
            )}
          </div>
          {p.busy === "assess" && <div className="text-sm text-slate-500">Checking your profile against this job…</div>}
          {p.requirements && p.busy !== "assess" && (
            <>
              <p className="text-xs text-slate-500">
                &ldquo;Not shown yet&rdquo; means your profile doesn&apos;t show it. It doesn&apos;t mean you lack the skill. Tell us which applies.
              </p>
              {reqs.map((r) => (
                <RequirementCard
                  key={r.id}
                  req={r}
                  evidenceById={evidenceById}
                  answer={p.answers[r.id]}
                  onAnswer={(a) => p.onAnswer(r.id, a)}
                  onAddEvidence={p.onAddEvidence}
                />
              ))}
            </>
          )}
          {added.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-3 text-xs">
              <div className="font-medium text-sm">Added by you ({added.length})</div>
              <ul className="mt-1 space-y-1 text-slate-600">
                {added.map((e) => (
                  <li key={e.id}>
                    &ldquo;{e.text}&rdquo; · {SOURCE_TEXT[e.source]}
                  </li>
                ))}
              </ul>
              <button
                onClick={p.onReassess}
                disabled={p.busy !== null}
                className="mt-2 border border-slate-300 rounded-lg px-3 py-1.5 text-xs disabled:opacity-50"
              >
                {p.busy === "assess" ? "Reassessing…" : "Reassess with my updates"}
              </button>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <h2 className="font-semibold">2. Your improvement plan</h2>
          <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-wrap items-center gap-3 text-sm">
            <label htmlFor="prep" className="text-slate-700">
              Time you can spend before applying
            </label>
            <select id="prep" value={p.prepMinutes} onChange={(e) => p.setPrepMinutes(Number(e.target.value))} className="border border-slate-300 rounded-lg p-1.5 bg-white">
              {PREP_OPTIONS.map(([m, label]) => (
                <option key={m} value={m}>
                  {label}
                </option>
              ))}
            </select>
            <button
              onClick={p.onMakePlan}
              disabled={p.busy !== null || !p.requirements}
              className="ml-auto bg-teal-600 hover:bg-teal-700 text-white rounded-lg px-4 py-2 font-medium text-sm disabled:opacity-50"
            >
              {p.busy === "plan" ? "Making your plan…" : p.plan ? "Update my plan" : "Make my improvement plan"}
            </button>
          </div>

          {!p.plan && p.busy !== "plan" && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
              Answer the questions on the left, choose your time, then make your plan.
            </div>
          )}

          {p.plan && p.plan.items.length === 0 && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-sm text-emerald-800">
              Your profile shows every requirement for this job. You&apos;re ready to build your résumé.
            </div>
          )}

          {p.plan && p.plan.items.length > 0 && (
            <>
              <div className={`text-xs ${p.plan.beforeMinutes > p.plan.prepMinutes ? "text-amber-800" : "text-slate-600"}`}>
                Before applying: about {hours(p.plan.beforeMinutes)} of your {hours(p.plan.prepMinutes)} (estimates).
                {p.plan.beforeMinutes > p.plan.prepMinutes && " Required items take longer than the time you chose."}
              </div>
              {GROUPS.map(([priority, title]) => {
                const items = p.plan!.items.filter((i) => i.priority === priority);
                return (
                  items.length > 0 && (
                    <div key={priority} className="space-y-2">
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {title} ({items.length})
                      </div>
                      {items.map((item) => (
                        <PlanItemCard
                          key={item.id}
                          item={item}
                          done={p.done.has(item.id)}
                          onToggle={() => p.onToggleDone(item.id)}
                          onAddEvidence={p.onAddEvidence}
                        />
                      ))}
                    </div>
                  )
                );
              })}
            </>
          )}

          <p className="text-xs text-slate-500">
            This plan can make your application stronger. It doesn&apos;t guarantee you&apos;ll qualify or get the job, and finishing a course
            or practice task doesn&apos;t prove a credential.
          </p>
          <button
            onClick={p.onBuildResume}
            disabled={p.busy !== null}
            className="w-full bg-slate-800 hover:bg-slate-900 text-white rounded-lg py-2.5 font-medium text-sm disabled:opacity-50"
          >
            {p.busy === "resume" ? "Writing your résumé…" : "Build my résumé for this job"}
          </button>
        </div>
      </div>
    </section>
  );
}
