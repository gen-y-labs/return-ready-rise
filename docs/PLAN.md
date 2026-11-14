# ReturnReady: build plan (v3)

A caregiver types or speaks their background and what they did during their career break. ReturnReady ranks 6 job areas by how many key skills their own examples show, lists Utah and remote jobs that fit their hours and cities, and builds a one-page résumé with the break as a dated entry. Every résumé line traces to the user's words.

## 1. Run it

```bash
npm install
cp .env.example .env.local   # add GEMINI_API_KEY; Adzuna keys are optional
npm run dev                  # http://localhost:3000
```

**Example profiles are instant.** Priya, David, and Emily use saved AI results from `data/fixtures/` while their story is unchanged, so the demo needs no API calls. Editing the story or typing a new one calls Gemini live.

**Gemini quota.** The free tier allows 20 requests a day per model, and one full run uses about 5. Turn on billing for the key's Google AI Studio project before demoing live input; billing also unlocks `gemini-4-argon` and `gemini-4-carbon`.

## 2. What is built

| Screen | What it does |
|---|---|
| 1. Tell us your story | 3 text boxes with mic buttons (Chrome/Edge), days, hours, max hours, workplace types, preferred cities, contact. Example buttons for Priya, David, Emily. Shows skills, each tied to the user's words. Caregiving examples are off until ticked. |
| 2. Your job areas | 6 areas ranked by %, with breakdown and clarification questions. Jobs for the selected area, grouped by posted date: last 24 hours, last 7 days, last 30 days. Within each group: Fits, then Needs confirmation, then Conflict. Jobs outside the user's cities are hidden. |
| 3. Get ready | Opened from "Check my readiness" on any job card. Each job requirement shows Required/Preferred, evidence, what's uncertain, and one question. The user answers "I already do this", "I need a refresher", "I need to learn it", or "Not sure", and can add real experience (confirmed, in their own words). They choose preparation time and get a plan grouped as Before you apply / Ask the employer / Alongside applying. Each item has an action, why, estimated time, a "done when" check, and search phrases. Ticking an item done lets them add what they did as a practice project, then reassess. |
| 4. Your résumé | One-page résumé. Break title picker (dates only / brief / detailed). Made-up numbers highlighted red. Edit or remove any line. Practice projects in their own section. Prep steps. Download PDF (browser print) and Copy text. |

| File | Job |
|---|---|
| `app/api/extract` | Story -> evidence + skills + career break (Gemini) |
| `app/api/categories` | Evidence -> status per key skill (Gemini) -> % (code, `lib/score.ts`) |
| `app/api/jobs` | Sources -> city filter -> recency -> hours check (code, `lib/arrangement.ts`) |
| `app/api/resume` | Confirmed evidence -> résumé (Gemini) -> claim checks (code, `lib/checks.ts`) |
| `app/api/readiness/assess` | Job requirements + evidence -> status per requirement (Gemini) -> rules (code, `lib/readiness.ts`) |
| `app/api/readiness/plan` | Unmet requirements + answers + prep time -> plan (Gemini) -> gap types, ordering, time fit (code) |
| `lib/sources.ts` | Job sources. Saved listings, Adzuna (needs keys), Remotive (no key). Add new APIs here. |
| `lib/ai.ts` | Google Gemini via `@google/genai`, model `gemini-4-hydrogen` (override with `GEMINI_MODEL`), JSON output checked against our Zod schemas, saved-response fallback |
| `data/` | Personas, 6 job areas, sample jobs, practice tasks, Priya fixtures |

`mockups/index.html` is the earlier design reference; the app replaces it.

## 3. Rules the code enforces

- **Percentage** = key skills with status Supported or Refresh ÷ 5. Ties go to the area with more paid-work evidence. Never an overall score.
- **Cities:** remote jobs show if Remote is ticked. Other jobs show only if their location names a chosen city.
- **Hours:** no hours listed -> Needs confirmation, unless the job is full-time and the user's limit is under 35 hrs (Conflict). A day the user can't work, hours outside their window, or too many hours -> Conflict. Hybrid/on-site jobs that fit still say "check travel time on office days".
- **Recency:** jobs older than 30 days are dropped.
- **Claims:** bullets citing unconfirmed evidence are dropped. Any number not in the cited evidence is flagged and re-checked after edits. Break titles never include medical details.
- **Readiness:**
  - "Not shown yet" means missing evidence, not a missing skill. A skill counts as missing only after the user says "I need to learn it".
  - Credentials (licenses, permits, certifications, background checks) are always "Employer must verify", never met.
  - Practice-only evidence can't meet a years-of-experience requirement.
  - A "met" status that cites no real evidence becomes "Not shown yet".
  - Plan items must point at a real requirement of the selected job. Required items rank above preferred ones. Preferred items move to "Alongside applying" when the before-applying total goes over the user's time.
  - Ticking an item done changes nothing by itself; only evidence the user adds and confirms does, after a reassessment.
  - Learning resources are search phrases only, never invented links or courses.
  - Practice projects never appear as jobs on the résumé.

## 4. Team of 5, one driver

| Person | Now | At 1:30 |
|---|---|---|
| Driver | Builds in this repo. Adds the Gemini API key. Fixes what testers report. | Freeze code. |
| Data | Copies 6–8 real jobs.utah.gov listings into `data/jobs.json` (`source: "jobs.utah.gov"`, `url`, `postedAt`, `capturedAt`; hours only if stated). Keep the Lehi sample for the demo. | Check every listing renders. |
| Integrations | Gets Adzuna keys into `.env.local`. Checks the `us` path in Adzuna's docs. | Confirm source counts on screen 2. |
| Tester | Runs section 6 in Chrome with Priya, David, Emily. Reports exact steps to the driver. | Run section 6 again on the final build. |
| Pitch | Writes the 3-minute script (section 5) and slides. Records a backup video once the flow is stable. | Rehearse twice. |

## 5. Demo script (3 minutes)

1. **Priya (main, 90s):** Load the example, speak one sentence into box 3, Analyze. Administrative support 80%: "Excel needs a refresh, Outlook/Teams missing." The Lehi Part-Time Administrative Coordinator fits 9–2, with "check travel time on office days". The remote full-time assistant shows Conflict. Check my readiness on the Lehi job: Excel is "Partly shown" with the question "Have you used sorting, filtering, and SUM?". Answer "I need a refresher" and make the plan: sort/filter practice, a SUM expense tracker, and a weekly summary, about 1 hr 15 min of her 2 hours. Outlook/Teams goes to "Ask the employer", because the posting includes training. Build the résumé: the break is a dated entry, "3" and "20%" are flagged, remove the line, pick Brief, Download PDF.
2. **David (full-time, 45s):** Former operations manager, 2-year eldercare break, 8–5. Operations coordination 60%. The 8–5 Operations Manager role and the paid returnship fit; the 6 a.m. supervisor shift conflicts. His résumé keeps the numbers he gave (team of 14, $2.1 million budget, 18% fewer late deliveries) without flags, and the break reads "Caring for a parent" with no health details.
3. **Emily (limited experience, 30s):** Hospitality and school front-office volunteering map to Front desk and reception. The résumé uses only her examples; nothing is invented.
4. **Close (15s):** "It understood what I can do, when I can work, and how to show my break."

## 6. Test checklist

| # | Case | Expected |
|---|---|---|
| 1 | Each example profile, unchanged | Every step returns instantly with the "Example profile" note. |
| 2 | Priya areas | Admin 80, Project 60, Operations 60, Program 20, Front desk 0, Customer support 0. |
| 3 | Priya admin jobs | Lehi job Fits; 8 a.m. Orem job and remote 8–5 job Conflict; remote no-hours job Needs confirmation. |
| 4 | Remove Lehi from cities | Lehi job disappears; "hidden outside your cities" count goes up. |
| 5 | Résumé numbers | "3" and "20%" flagged; editing the line to remove them clears the flag. |
| 6 | Break titles | No medical words at any level. |
| 7 | David operations jobs | Operations Manager 8–5 and the returnship Fit; 6 a.m. supervisor Conflict; hybrid role with no hours Needs confirmation; American Fork part-time hidden (outside his cities). |
| 8 | Emily, with API key | Front desk ranks high; résumé has no skills she didn't mention. |
| 9 | Voice in Chrome; then Safari | Chrome fills the box. Safari hides the mic; typing works. |
| 10 | With API key, any new story | Live results, no banner. |
| 11 | Priya, Lehi job, Get ready | 4 of 7 shown; Excel and writing "Partly shown"; Outlook/Teams "Not shown yet". |
| 12 | Plan with 2 hours vs 30 minutes | Same required items; at 30 minutes a warning that required items need more time. |
| 13 | Tick a plan item, add what you did | Saved as "Practice project"; assessment unchanged until Reassess. |
| 14 | With API key, a job with a credential (Valley Food Network permit) | Shows "Employer must verify" even after "I have it". |
| 15 | With API key, add practice and reassess, then build résumé | Practice appears under "Practice projects", never under a job. |

## 7. Next, if time allows

- Saved responses for David and Emily, so all three can demo without a key.
- More job APIs in `lib/sources.ts` from the source list (USAJOBS, CareerOneStop, Jooble need keys; Greenhouse/Lever/Ashby need employer board IDs).
- Remove duplicate jobs across sources.
