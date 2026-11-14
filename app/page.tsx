"use client";

import { useState } from "react";
import personasJson from "@/data/personas.json";
import { AreasStep } from "@/components/AreasStep";
import { ResumeStep } from "@/components/ResumeStep";
import { StoryStep } from "@/components/StoryStep";
import { postJson } from "@/lib/client";
import type { Availability, CategoryFit, Contact, JobsResponse, Persona, Profile, Resume, Story } from "@/lib/types";

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

const STEPS = ["Tell us your story", "Your job areas", "Your résumé"];

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
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fallback, setFallback] = useState(false);

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
    setFallback(false);
    setStep(1);
  }

  async function analyze() {
    const res = await run("extract", () =>
      postJson<{ profile: Profile; fallback: boolean }>("/api/extract", { story, personaId }),
    );
    if (!res) return;
    setProfile(res.profile);
    setRemoved(new Set());
    setCaregivingOn(new Set());
    setFits(null);
    setResume(null);
    setFallback(res.fallback);
  }

  async function loadJobs(categoryId: string) {
    setJobs(null);
    const res = await run("jobs", () => postJson<JobsResponse>("/api/jobs", { categoryId, availability }));
    if (res) setJobs(res);
  }

  async function seeAreas() {
    const res = await run("categories", () =>
      postJson<{ fits: CategoryFit[]; fallback: boolean }>("/api/categories", { profile: confirmed, personaId }),
    );
    if (!res) return;
    setFits(res.fits);
    setFallback((f) => f || res.fallback);
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

  async function buildResume() {
    const fit = fits!.find((f) => f.categoryId === selected)!;
    const res = await run("resume", () =>
      postJson<{ resume: Resume; fallback: boolean }>("/api/resume", { profile: confirmed, fit, personaId }),
    );
    if (!res) return;
    setResume(res.resume);
    setFallback((f) => f || res.fallback);
    setStep(3);
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

  const reachable = [true, !!fits, !!resume];

  return (
    <>
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 print:hidden">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center gap-4 justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-600 text-white grid place-items-center font-bold">R</div>
            <div>
              <div className="font-semibold">ReturnReady</div>
              <div className="text-xs text-slate-500">Find where your experience fits, and prepare your next application.</div>
            </div>
          </div>
          <nav className="flex flex-wrap gap-1 text-sm">
            {STEPS.map((label, i) => (
              <button
                key={label}
                disabled={!reachable[i]}
                onClick={() => setStep(i + 1)}
                className={`px-3 py-1.5 rounded-full disabled:opacity-40 ${
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
        {fallback && (
          <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-4 py-2 text-sm text-amber-900 print:hidden">
            Live AI is unavailable, so you&apos;re seeing saved demo results for this example.
          </div>
        )}
        {error && (
          <div className="mb-4 rounded-lg bg-rose-50 border border-rose-200 px-4 py-2 text-sm text-rose-800 print:hidden">{error}</div>
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
            onBuildResume={buildResume}
          />
        )}

        {step === 3 && resume && confirmed && (
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
    </>
  );
}
