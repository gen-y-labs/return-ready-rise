"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import { VoiceButton } from "./VoiceButton";
import { DAYS, type Availability, type Contact, type Evidence, type Persona, type Profile, type Story, type Workplace } from "@/lib/types";

const FIELDS: { key: keyof Story; label: string; note?: string; hint: string; rows: number }[] = [
  { key: "pastWork", label: "1. Your past work", hint: "Jobs, years, and what you did. You can paste an old résumé.", rows: 5 },
  {
    key: "breakStory",
    label: "2. Your career break",
    note: "share only what you want",
    hint: "When it started and why. You choose later how much appears on your résumé. We never add medical details.",
    rows: 2,
  },
  {
    key: "breakActivities",
    label: "3. What you did during the break",
    hint: "Volunteering, school, community, or family responsibilities. Concrete examples help most.",
    rows: 3,
  },
];

const UTAH_CITIES = [
  "Salt Lake City", "West Valley City", "Sandy", "Draper", "Lehi", "American Fork",
  "Pleasant Grove", "Orem", "Provo", "Ogden", "Park City", "St. George",
];

const WORKPLACES: [Workplace, string][] = [["remote", "Remote"], ["hybrid", "Hybrid"], ["onsite", "On-site"]];

const SOURCE_LABEL: Record<Evidence["source"], [string, string]> = {
  paid: ["Paid work", "bg-teal-50 text-teal-800 border-teal-500"],
  volunteer: ["During break · Volunteer", "bg-indigo-50 text-indigo-800 border-indigo-400"],
  caregiving: ["During break · Caregiving", "bg-rose-50 text-rose-800 border-rose-300"],
  education: ["Education", "bg-slate-100 text-slate-700 border-slate-400"],
  practice: ["Practice project", "bg-amber-50 text-amber-800 border-amber-400"],
};

const input = "w-full border border-slate-300 rounded-lg p-2 text-sm bg-white";

function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

type Props = {
  personas: Persona[];
  personaId: string | null;
  onLoadPersona: (p: Persona) => void;
  contact: Contact;
  setContact: Dispatch<SetStateAction<Contact>>;
  story: Story;
  setStory: Dispatch<SetStateAction<Story>>;
  availability: Availability;
  setAvailability: Dispatch<SetStateAction<Availability>>;
  profile: Profile | null;
  removed: Set<string>;
  onRemoveEvidence: (ids: string[]) => void;
  caregivingOn: Set<string>;
  onToggleCaregiving: (id: string) => void;
  busy: string | null;
  onAnalyze: () => void;
  onNext: () => void;
};

export function StoryStep(p: Props) {
  const [newCity, setNewCity] = useState("");
  const { availability: a, setAvailability: setA } = p;
  const cities = [...new Set([...UTAH_CITIES, ...a.locations])];
  const evidenceById = new Map(p.profile?.evidence.map((e) => [e.id, e]));

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Tell us your story</h1>
          <p className="text-slate-600 mt-1">Type or speak. Say what you did, for whom, how often, and when.</p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="text-slate-500 self-center">Try an example:</span>
          {p.personas.map((persona) => (
            <button
              key={persona.id}
              onClick={() => p.onLoadPersona(persona)}
              className={`rounded-full border px-3 py-1 ${
                p.personaId === persona.id ? "bg-slate-800 text-white border-slate-800" : "border-slate-300 bg-white hover:bg-slate-50"
              }`}
            >
              {persona.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mt-6">
        <div className="space-y-4">
          {FIELDS.map((f) => (
            <div key={f.key} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex justify-between items-center gap-2">
                <label htmlFor={f.key} className="font-medium text-sm">
                  {f.label} {f.note && <span className="text-slate-400 font-normal">({f.note})</span>}
                </label>
                <VoiceButton onText={(t) => p.setStory((s) => ({ ...s, [f.key]: `${s[f.key]} ${t}`.trim() }))} />
              </div>
              <textarea
                id={f.key}
                rows={f.rows}
                value={p.story[f.key]}
                onChange={(e) => p.setStory((s) => ({ ...s, [f.key]: e.target.value }))}
                className={`${input} mt-2`}
              />
              <p className="text-xs text-slate-500 mt-1">{f.hint}</p>
            </div>
          ))}

          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 text-sm">
            <div className="font-medium">4. When and where you can work</div>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((d) => (
                <button
                  key={d}
                  onClick={() => setA((x) => ({ ...x, days: toggle(x.days, d) }))}
                  className={`px-3 py-1 rounded-full border ${
                    a.days.includes(d) ? "bg-teal-600 border-teal-600 text-white" : "border-slate-300 text-slate-500"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3">
              <label>
                From
                <input type="time" value={a.start} onChange={(e) => setA((x) => ({ ...x, start: e.target.value }))} className={`${input} mt-1`} />
              </label>
              <label>
                Until
                <input type="time" value={a.end} onChange={(e) => setA((x) => ({ ...x, end: e.target.value }))} className={`${input} mt-1`} />
              </label>
              <label>
                Max hrs/week
                <input
                  type="number"
                  min={1}
                  value={a.maxHoursPerWeek}
                  onChange={(e) => setA((x) => ({ ...x, maxHoursPerWeek: Number(e.target.value) }))}
                  className={`${input} mt-1`}
                />
              </label>
            </div>
            <div className="flex flex-wrap gap-4">
              {WORKPLACES.map(([w, label]) => (
                <label key={w} className="flex items-center gap-2">
                  <input type="checkbox" checked={a.workplace.includes(w)} onChange={() => setA((x) => ({ ...x, workplace: toggle(x.workplace, w) }))} />
                  {label}
                </label>
              ))}
            </div>
            <div>
              <div className="text-slate-600">Cities you can work in (for hybrid and on-site jobs)</div>
              <div className="flex flex-wrap gap-2 mt-2">
                {cities.map((c) => (
                  <button
                    key={c}
                    onClick={() => setA((x) => ({ ...x, locations: toggle(x.locations, c) }))}
                    className={`px-3 py-1 rounded-full border text-xs ${
                      a.locations.includes(c) ? "bg-teal-600 border-teal-600 text-white" : "border-slate-300 text-slate-600"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <form
                className="flex gap-2 mt-2"
                onSubmit={(e) => {
                  e.preventDefault();
                  const city = newCity.trim();
                  if (city) setA((x) => ({ ...x, locations: [...new Set([...x.locations, city])] }));
                  setNewCity("");
                }}
              >
                <input value={newCity} onChange={(e) => setNewCity(e.target.value)} placeholder="Add another city" className={input} />
                <button className="border border-slate-300 rounded-lg px-3 text-xs">Add</button>
              </form>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 text-sm">
            <div className="font-medium">5. Your name and contact (for the résumé)</div>
            <div className="grid grid-cols-2 gap-3 mt-2">
              {(["name", "email", "phone", "location"] as const).map((k) => (
                <input
                  key={k}
                  aria-label={k}
                  placeholder={{ name: "Full name", email: "Email", phone: "Phone", location: "City, State" }[k]}
                  value={p.contact[k]}
                  onChange={(e) => p.setContact((c) => ({ ...c, [k]: e.target.value }))}
                  className={input}
                />
              ))}
            </div>
          </div>

          <button
            onClick={p.onAnalyze}
            disabled={p.busy !== null}
            className="w-full bg-slate-800 hover:bg-slate-900 disabled:opacity-60 text-white rounded-lg py-2.5 font-medium"
          >
            {p.busy === "extract" ? "Reading your story…" : "Analyze my experience"}
          </button>
          <p className="text-xs text-slate-500">
            Session only. Nothing is saved after you close this tab. Voice input is turned into text by your browser (Chrome uses
            Google&apos;s servers).
          </p>
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <h2 className="font-semibold">What we found</h2>
            {p.profile && <span className="text-xs text-slate-500">Each skill is tied to your own words</span>}
          </div>

          {!p.profile && (
            <div className="mt-3 rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">
              Your skills will appear here, each one tied to something you said.
            </div>
          )}

          {p.profile && (
            <div className="space-y-3 mt-3">
              {p.profile.skills.map((skill) => {
                const items = skill.evidenceIds.map((id) => evidenceById.get(id)).filter((e): e is Evidence => !!e && !p.removed.has(e.id));
                if (skill.evidenceIds.length && !items.length) return null;
                if (!skill.evidenceIds.length) {
                  return (
                    <div key={skill.id} className="bg-amber-50 rounded-xl border border-amber-300 p-3">
                      <div className="font-medium">{skill.name}</div>
                      <p className="text-sm text-amber-800 mt-1">{skill.note ?? "No example given."} It won&apos;t be used until you add an example to your story.</p>
                    </div>
                  );
                }
                return (
                  <div key={skill.id} className="bg-white rounded-xl border border-slate-200 p-3">
                    <div className="flex justify-between gap-2">
                      <div className="font-medium">{skill.name}</div>
                      <button onClick={() => p.onRemoveEvidence(items.map((e) => e.id))} className="text-xs text-slate-500 hover:text-slate-800">
                        Remove
                      </button>
                    </div>
                    {skill.note && <div className="text-xs text-slate-500">{skill.note}</div>}
                    {items.map((e) => {
                      const [label, color] = SOURCE_LABEL[e.source];
                      const care = e.source === "caregiving";
                      return (
                        <div key={e.id} className={`mt-2 text-sm border-l-2 pl-2 ${color.split(" ").pop()}`}>
                          &ldquo;{e.text}&rdquo;
                          <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
                            <span className={`px-1.5 rounded ${color}`}>{label}</span>
                            {[e.org, e.years].filter(Boolean).join(" · ")}
                          </div>
                          {care && (
                            <label className="flex items-center gap-2 text-xs mt-1 text-slate-600">
                              <input type="checkbox" checked={p.caregivingOn.has(e.id)} onChange={() => p.onToggleCaregiving(e.id)} />
                              Use in job matching and résumé (off by default)
                            </label>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
              {p.profile.careerBreak && (
                <div className="text-xs text-slate-500 px-1">
                  Career break found: {p.profile.careerBreak.years} ({p.profile.careerBreak.briefReason})
                </div>
              )}
              <button
                onClick={p.onNext}
                disabled={p.busy !== null}
                className="w-full bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white rounded-lg py-2.5 font-medium"
              >
                {p.busy === "categories" ? "Matching job areas…" : "See my job areas →"}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
