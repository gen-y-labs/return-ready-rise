"use client";

import { useState } from "react";
import personasJson from "@/data/personas.json";
import { AreasStep } from "@/components/AreasStep";
import { DemoPlayer } from "@/components/DemoPlayer";
import { Logo } from "@/components/Logo";
import { ReadinessStep } from "@/components/ReadinessStep";
import { ResumeStep } from "@/components/ResumeStep";
import { StoryStep } from "@/components/StoryStep";
import { postJson } from "@/lib/client";
import type {
  Answer,
  AssessedRequirement,
  Availability,
  CategoryFit,
  Contact,
  JobWithFit,
  JobsResponse,
  Persona,
  Plan,
  Profile,
  Resume,
  Source,
  Story,
} from "@/lib/types";

const personas = personasJson as Persona[];

const EMPTY_STORY: Story = { pastWork: "", breakStory: "", breakActivities: "" };
const EMPTY_CONTACT: Contact = { name: "", email: "", phone: "", location: "" };
const DEFAULT_AVAILABILITY: Availability = {
  days: ["Mon", "Tue", "Wed", "Thu", "Fri"],
  start: "09:00",
  end: "14:00",
  maxHoursPerWeek: 25,
  locations: [],
  workplace: ["remote", "hybrid", "onsite"],
};

const STEPS = ["Tell us your story", "Your job areas", "Get ready", "Your résumé"];

export default function Home() {
  const [step, setStep] = useState(1);
  const [personaId, setPersonaId] = useState<string | null>(null);
  const [contact, setContact] = useState(EMPTY_CONTACT);
  const [story, setStory] = useState(EMPTY_STORY);
  const [availability, setAvailability] = useState(DEFAULT_AVAILABILITY);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [caregivingOn, setCaregivingOn] = useState<Set<string>>(new Set());
  const [fits, setFits] = useState<CategoryFit[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [jobs, setJobs] = useState<JobsResponse | null>(null);
  const [resume, setResume] = useState<Resume | null>(null);
  const [readinessJob, setReadinessJob] = useState<JobWithFit | null>(null);
  const [requirements, setRequirements] = useState<AssessedRequirement[] | null>(null);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [prepMinutes, setPrepMinutes] = useState(120);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // True while the loaded example is unchanged, so every step serves its saved results.
  const [usingSaved, setUsingSaved] = useState(false);

  const loaded = personas.find((p) => p.id === personaId);
  const storyUnchanged = !!loaded && JSON.stringify(loaded.story) === JSON.stringify(story);
  const savedId = usingSaved ? personaId : null;

  // Evidence the user kept. Caregiving is only used when they tick it.
  const confirmed: Profile | null = profile && {
    ...profile,
    evidence: profile.evidence.filter(
      (e) => !removed.has(e.id) && (e.source !== "caregiving" || caregivingOn.has(e.id)),
    ),
  };

  async function run<T>(label: string, work: () => Promise<T>): Promise<T | undefined> {
    setBusy(label);
    setError(null);
    try {
      return await work();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(null);
    }
  }

  function loadPersona(p: Persona) {
    setPersonaId(p.id);
    setContact(p.contact);
    setStory(p.story);
    setAvailability(p.availability);
    setProfile(null);
    setFits(null);
    setResume(null);
    setUsingSaved(false);
    setStep(1);
  }

  async function analyze() {
    const res = await run("extract", () =>
      postJson<{ profile: Profile; saved: boolean }>("/api/extract", {
        story,
        personaId: storyUnchanged ? personaId : null,
      }),
    );
    if (!res) return;
    setProfile(res.profile);
    setRemoved(new Set());
    setCaregivingOn(new Set());
    setFits(null);
    setResume(null);
    setUsingSaved(res.saved);
  }

  async function loadJobs(categoryId: string) {
    setJobs(null);
    const res = await run("jobs", () => postJson<JobsResponse>("/api/jobs", { categoryId, availability }));
    if (res) setJobs(res);
  }

  async function seeAreas() {
    const res = await run("categories", () =>
      postJson<{ fits: CategoryFit[]; saved: boolean }>("/api/categories", { profile: confirmed, personaId: savedId }),
    );
    if (!res) return;
    setFits(res.fits);
        setSelected(res.fits[0].categoryId);
    setResume(null);
    setStep(2);
    await loadJobs(res.fits[0].categoryId);
  }

  async function selectArea(categoryId: string) {
    setSelected(categoryId);
    setResume(null);
    await loadJobs(categoryId);
  }

  async function buildResume(categoryId: string) {
    const fit = fits!.find((f) => f.categoryId === categoryId)!;
    const res = await run("resume", () =>
      postJson<{ resume: Resume; saved: boolean }>("/api/resume", { profile: confirmed, fit, personaId: savedId }),
    );
    if (!res) return;
    setResume(res.resume);
        setStep(4);
  }

  async function assess(job: JobWithFit) {
    const res = await run("assess", () =>
      postJson<{ requirements: AssessedRequirement[]; saved: boolean }>("/api/readiness/assess", {
        job,
        evidence: confirmed!.evidence,
        personaId: savedId,
      }),
    );
    if (!res) return;
    setRequirements(res.requirements);
    setPlan(null);
    setDone(new Set());
      }

  async function checkReadiness(job: JobWithFit) {
    setReadinessJob(job);
    setRequirements(null);
    setAnswers({});
    setPlan(null);
    setDone(new Set());
    setStep(3);
    await assess(job);
  }

  async function makePlan() {
    const res = await run("plan", () =>
      postJson<{ plan: Plan; saved: boolean }>("/api/readiness/plan", {
        job: readinessJob,
        requirements,
        answers,
        evidence: confirmed!.evidence,
        prepMinutes,
        personaId: savedId,
      }),
    );
    if (!res) return;
    setPlan(res.plan);
    setDone(new Set());
      }

  function addEvidence(text: string, source: Source) {
    setProfile(
      (p) =>
        p && {
          ...p,
          evidence: [
            ...p.evidence,
            { id: `u${p.evidence.length + 1}`, text, source, org: null, role: null, years: "", lastUsedYear: new Date().getFullYear() },
          ],
        },
    );
  }

  const leftOut = profile
    ? [
        ...profile.skills.filter((s) => !s.evidenceIds.length).map((s) => `${s.name}: no example given`),
        ...profile.evidence
          .filter((e) => e.source === "caregiving" && !caregivingOn.has(e.id))
          .map((e) => `"${e.text}": caregiving, not ticked for use`),
        ...(removed.size ? [`${removed.size} example${removed.size > 1 ? "s" : ""} you removed`] : []),
      ]
    : [];

  const reachable = [true, !!fits, !!readinessJob, !!resume];

  return (
    <>
      <header className="bg-white border-b border-slate-200 sm:sticky top-0 z-10 print:hidden">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2 justify-between">
          <div className="flex items-center gap-2">
            <Logo className="w-9 h-9 shrink-0" />
            <div>
              <div className="font-semibold">Return Ready Rise</div>
              <div className="hidden sm:block text-xs text-slate-500">
                Find where your experience fits, and prepare your next application.
              </div>
            </div>
          </div>
          <nav className="flex gap-1 text-xs sm:text-sm w-full sm:w-auto overflow-x-auto -mx-1 px-1">
            {STEPS.map((label, i) => (
              <button
                key={label}
                disabled={!reachable[i]}
                onClick={() => setStep(i + 1)}
                className={`shrink-0 whitespace-nowrap px-3 py-1.5 rounded-full disabled:opacity-40 ${
                  step === i + 1 ? "bg-teal-600 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {i + 1} · {label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl w-full mx-auto px-4 py-6 print:p-0 print:max-w-none">
        {usingSaved && (
          <div className="mb-4 rounded-lg bg-white border border-slate-200 px-4 py-2 text-xs text-slate-600 print:hidden">
            Example profile: showing saved AI results so the demo runs instantly. Edit the story or write your own to run live
            AI.
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-2 text-sm text-amber-900 print:hidden">
            {error}
          </div>
        )}

        {step === 1 && (
          <StoryStep
            personas={personas}
            personaId={personaId}
            onLoadPersona={loadPersona}
            contact={contact}
            setContact={setContact}
            story={story}
            setStory={setStory}
            availability={availability}
            setAvailability={setAvailability}
            profile={profile}
            removed={removed}
            onRemoveEvidence={(ids) => setRemoved((r) => new Set([...r, ...ids]))}
            caregivingOn={caregivingOn}
            onToggleCaregiving={(id) =>
              setCaregivingOn((c) => {
                const next = new Set(c);
                if (next.has(id)) next.delete(id);
                else next.add(id);
                return next;
              })
            }
            busy={busy}
            onAnalyze={analyze}
            onNext={seeAreas}
          />
        )}

        {step === 2 && fits && selected && (
          <AreasStep
            fits={fits}
            selected={selected}
            onSelect={selectArea}
            jobs={jobs}
            availability={availability}
            busy={busy}
            onBuildResume={() => buildResume(selected)}
            onCheckReadiness={checkReadiness}
          />
        )}

        {step === 3 && readinessJob && confirmed && (
          <ReadinessStep
            job={readinessJob}
            requirements={requirements}
            evidence={confirmed.evidence}
            answers={answers}
            onAnswer={(id, a) => setAnswers((x) => ({ ...x, [id]: a }))}
            onAddEvidence={addEvidence}
            prepMinutes={prepMinutes}
            setPrepMinutes={setPrepMinutes}
            plan={plan}
            done={done}
            onToggleDone={(id) =>
              setDone((d) => {
                const next = new Set(d);
                if (next.has(id)) next.delete(id);
                else next.add(id);
                return next;
              })
            }
            busy={busy}
            onMakePlan={makePlan}
            onReassess={() => assess(readinessJob)}
            onBuildResume={() => buildResume(readinessJob.categoryId)}
            onBack={() => setStep(2)}
          />
        )}

        {step === 4 && resume && confirmed && (
          <ResumeStep
            resume={resume}
            setResume={setResume}
            contact={contact}
            evidence={confirmed.evidence}
            areaName={fits!.find((f) => f.categoryId === resume.categoryId)!.name}
            leftOut={leftOut}
            onBack={() => setStep(2)}
          />
        )}
      </main>
      <DemoPlayer />
    </>
  );
}
