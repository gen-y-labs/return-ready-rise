"use client";

import { useState, type Dispatch, type ReactNode, type SetStateAction } from "react";
import { checkBullets } from "@/lib/checks";
import type { Bullet, Contact, Evidence, Resume } from "@/lib/types";

type Level = "minimal" | "brief" | "detailed";
type Section = "break" | "practice" | number;

const LEVELS: [Level, string][] = [["minimal", "Dates only"], ["brief", "Brief"], ["detailed", "Detailed"]];

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function highlight(text: string, marks: string[]): ReactNode {
  if (!marks.length) return text;
  const parts = text.split(new RegExp(`(${marks.map(escapeRegExp).join("|")})`, "g"));
  return parts.map((part, i) =>
    marks.includes(part) ? (
      <mark key={i} className="bg-rose-200 rounded px-0.5">
        {part}
      </mark>
    ) : (
      part
    ),
  );
}

function EditableLine({
  text,
  marks = [],
  multiline = false,
  onSave,
  onRemove,
}: {
  text: string;
  marks?: string[];
  multiline?: boolean;
  onSave: (text: string) => void;
  onRemove?: () => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  if (draft !== null) {
    const done = () => {
      onSave(draft.trim());
      setDraft(null);
    };
    return multiline ? (
      <textarea autoFocus rows={3} value={draft} onChange={(e) => setDraft(e.target.value)} onBlur={done} className="w-full border border-teal-500 rounded p-1 font-sans text-sm" />
    ) : (
      <input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={done}
        onKeyDown={(e) => e.key === "Enter" && done()}
        className="w-full border border-teal-500 rounded p-1 font-sans text-sm"
      />
    );
  }
  return (
    <span className="group">
      {highlight(text, marks)}
      <span className="print:hidden font-sans text-xs ml-2 opacity-40 group-hover:opacity-100">
        <button onClick={() => setDraft(text)} className="text-teal-700 hover:underline">
          Edit
        </button>
        {onRemove && (
          <button onClick={onRemove} className="text-slate-500 hover:underline ml-2">
            Remove
          </button>
        )}
      </span>
    </span>
  );
}

type Props = {
  resume: Resume;
  setResume: Dispatch<SetStateAction<Resume | null>>;
  contact: Contact;
  evidence: Evidence[];
  areaName: string;
  leftOut: string[];
  onBack: () => void;
};

export function ResumeStep({ resume, setResume, contact, evidence, areaName, leftOut, onBack }: Props) {
  const [level, setLevel] = useState<Level>("brief");
  const [copied, setCopied] = useState(false);
  const allowed = new Map(evidence.map((e) => [e.id, e]));

  function updateBullet(section: Section, index: number, text: string | null) {
    setResume((r) => {
      if (!r) return r;
      const extra =
        section === "break" ? (r.careerBreak?.years ?? "") : section === "practice" ? "" : r.experience[section].dates;
      const apply = (bullets: Bullet[]) =>
        bullets.flatMap((b, i) => {
          if (i !== index) return [b];
          if (text === null || !text) return [];
          return [{ ...b, text, flags: checkBullets([{ ...b, text }], allowed, extra)[0]?.flags ?? [] }];
        });
      if (section === "break") {
        return { ...r, careerBreak: r.careerBreak && { ...r.careerBreak, bullets: apply(r.careerBreak.bullets) } };
      }
      if (section === "practice") return { ...r, practice: apply(r.practice) };
      return { ...r, experience: r.experience.map((x, i) => (i === section ? { ...x, bullets: apply(x.bullets) } : x)) };
    });
  }

  const flagged = [
    ...(resume.careerBreak?.bullets ?? []),
    ...resume.experience.flatMap((x) => x.bullets),
    ...resume.practice,
  ].filter((b) => b.flags.length);

  function asText(): string {
    const lines = [contact.name, [contact.location, contact.email, contact.phone].filter(Boolean).join(" · "), "", "SUMMARY", resume.summary.text, "", "EXPERIENCE"];
    if (resume.careerBreak) {
      lines.push(`${resume.careerBreak.titles[level]} (${resume.careerBreak.years})`, ...resume.careerBreak.bullets.map((b) => `- ${b.text}`), "");
    }
    for (const x of resume.experience) {
      lines.push(`${x.title}, ${x.org}${x.location ? `, ${x.location}` : ""} (${x.dates})`, ...x.bullets.map((b) => `- ${b.text}`), "");
    }
    if (resume.practice.length) lines.push("PRACTICE PROJECTS", ...resume.practice.map((b) => `- ${b.text}`), "");
    lines.push("SKILLS", resume.skills.join(" · "));
    if (resume.education.length) lines.push("", "EDUCATION", ...resume.education);
    return lines.join("\n");
  }

  const heading = "mt-5 text-xs font-bold uppercase tracking-widest text-teal-800 border-b border-slate-300 pb-1";

  return (
    <section className="grid lg:grid-cols-12 gap-6">
      <div className="lg:col-span-4 space-y-4 print:hidden">
        <div>
          <div className="text-sm text-slate-500">Résumé for</div>
          <h1 className="text-xl font-semibold">{areaName}</h1>
        </div>

        {resume.careerBreak && (
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <div className="font-medium text-sm">How should your break appear?</div>
            <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
              {LEVELS.map(([l, label]) => (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  className={`rounded-lg border px-2 py-1.5 ${level === l ? "bg-teal-600 text-white border-teal-600" : "border-slate-300 text-slate-600"}`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-2">Medical details are never added. Your break activities stay listed under it.</p>
          </div>
        )}

        {flagged.length > 0 ? (
          <div className="bg-rose-50 rounded-xl border border-rose-200 p-4 text-sm text-rose-800">
            <div className="font-medium">
              {flagged.length} line{flagged.length > 1 ? "s" : ""} need{flagged.length > 1 ? "" : "s"} your review
            </div>
            <ul className="mt-1 space-y-1">
              {flagged.map((b) => (
                <li key={b.id}>
                  {b.flags.map((f) => `"${f.detail}"`).join(", ")} {b.flags.length > 1 ? "are" : "is"} not in anything you told us. Remove it or
                  use your own number.
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="bg-emerald-50 rounded-xl border border-emerald-200 p-4 text-sm text-emerald-800">
            Every line is traced to your own words.
          </div>
        )}

        {resume.prepSteps.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-sm">
            <div className="font-medium">Before you apply</div>
            <ol className="mt-2 space-y-2">
              {resume.prepSteps.map((s) => (
                <li key={s.id}>
                  <span className="font-medium">
                    {s.title} · {s.minutes} min.
                  </span>{" "}
                  <span className="text-slate-600">{s.task}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {leftOut.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 p-4 text-sm">
            <div className="font-medium">Left out on purpose</div>
            <ul className="text-slate-600 mt-1 space-y-1 text-xs">
              {leftOut.map((l) => (
                <li key={l}>{l}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button onClick={() => window.print()} className="bg-teal-600 hover:bg-teal-700 text-white rounded-lg px-4 py-2 font-medium text-sm">
            Download PDF
          </button>
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(asText());
              setCopied(true);
            }}
            className="border border-slate-300 bg-white rounded-lg px-4 py-2 text-sm"
          >
            {copied ? "Copied" : "Copy text"}
          </button>
          <button onClick={onBack} className="text-sm text-slate-500 underline px-2">
            Back to job areas
          </button>
        </div>
        <p className="text-xs text-slate-500">Download PDF opens your browser&apos;s print window. Choose &ldquo;Save as PDF&rdquo;.</p>
      </div>

      <div className="lg:col-span-8">
        <article className="bg-white border border-slate-200 shadow-sm rounded-sm max-w-[8.5in] mx-auto px-6 sm:px-10 py-8 text-[14px] leading-relaxed font-serif print:border-0 print:shadow-none print:p-0">
          <h2 className="text-2xl font-bold tracking-tight">{contact.name || "Your name"}</h2>
          <div className="text-slate-600 text-sm">{[contact.location, contact.email, contact.phone].filter(Boolean).join(" · ")}</div>

          <h3 className={heading}>Summary</h3>
          <p className="mt-2">
            <EditableLine
              text={resume.summary.text}
              multiline
              onSave={(text) => setResume((r) => r && { ...r, summary: { ...r.summary, text } })}
            />
          </p>

          <h3 className={heading}>Experience</h3>
          {resume.careerBreak && (
            <div className="mt-3">
              <div className="flex justify-between gap-4">
                <span className="font-bold">{resume.careerBreak.titles[level]}</span>
                <span className="text-slate-600 shrink-0">{resume.careerBreak.years}</span>
              </div>
              <BulletList bullets={resume.careerBreak.bullets} onChange={(i, t) => updateBullet("break", i, t)} />
            </div>
          )}
          {resume.experience.map((x, section) => (
            <div key={`${x.org}-${x.dates}`} className="mt-4">
              <div className="flex justify-between gap-4">
                <span className="font-bold">
                  {x.title}, {x.org}
                </span>
                <span className="text-slate-600 shrink-0">{x.dates}</span>
              </div>
              {x.location && <div className="text-slate-600 text-sm italic">{x.location}</div>}
              <BulletList bullets={x.bullets} onChange={(i, t) => updateBullet(section, i, t)} />
            </div>
          ))}

          {resume.practice.length > 0 && (
            <>
              <h3 className={heading}>Practice projects</h3>
              <BulletList bullets={resume.practice} onChange={(i, t) => updateBullet("practice", i, t)} />
            </>
          )}
          {resume.skills.length > 0 && (
            <>
              <h3 className={heading}>Skills</h3>
              <p className="mt-2">{resume.skills.join(" · ")}</p>
            </>
          )}
          {resume.education.length > 0 && (
            <>
              <h3 className={heading}>Education</h3>
              {resume.education.map((e) => (
                <p key={e} className="mt-2">
                  {e}
                </p>
              ))}
            </>
          )}
        </article>
      </div>
    </section>
  );
}

function BulletList({ bullets, onChange }: { bullets: Bullet[]; onChange: (index: number, text: string | null) => void }) {
  return (
    <ul className="mt-1 space-y-1">
      {bullets.map((b, i) => (
        <li
          key={`${b.id}-${i}`}
          className={`flex gap-2 ${b.flags.length ? "bg-rose-50 outline outline-1 outline-rose-300 rounded px-1 -mx-1 print:bg-transparent print:outline-0" : ""}`}
        >
          <span>•</span>
          <span className="flex-1">
            <EditableLine
              text={b.text}
              marks={b.flags.map((f) => f.detail)}
              onSave={(t) => onChange(i, t)}
              onRemove={() => onChange(i, null)}
            />
          </span>
        </li>
      ))}
    </ul>
  );
}
