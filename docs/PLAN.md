# ReturnReady: build plan (v3)

A caregiver types or speaks their background and what they did during their career break. ReturnReady ranks 6 job areas by how many key skills their own examples show, lists Utah and remote jobs that fit their hours and cities, and builds a one-page résumé with the break as a dated entry. Every résumé line traces to the user's words.

## 1. Run it

```bash
npm install
cp .env.example .env.local   # add ANTHROPIC_API_KEY; Adzuna keys are optional
npm run dev                  # http://localhost:3000
```

Without `ANTHROPIC_API_KEY`, the Priya example uses saved responses in `data/fixtures/` and shows a banner. Other input shows an error until a key is set.

## 2. What is built

| Screen | What it does |
|---|---|
| 1. Tell us your story | 3 text boxes with mic buttons (Chrome/Edge), days, hours, max hours, workplace types, preferred cities, contact. Example buttons for Priya, Maria, Emily. Shows skills, each tied to the user's words. Caregiving examples are off until ticked. |
| 2. Your job areas | 6 areas ranked by %, with breakdown and clarification questions. Jobs for the selected area, grouped by posted date: last 24 hours, last 7 days, last 30 days. Within each group: Fits, then Needs confirmation, then Conflict. Jobs outside the user's cities are hidden. |
| 3. Your résumé | One-page résumé. Break title picker (dates only / brief / detailed). Made-up numbers highlighted red. Edit or remove any line. Prep steps. Download PDF (browser print) and Copy text. |

| File | Job |
|---|---|
| `app/api/extract` | Story -> evidence + skills + career break (Claude) |
| `app/api/categories` | Evidence -> status per key skill (Claude) -> % (code, `lib/score.ts`) |
| `app/api/jobs` | Sources -> city filter -> recency -> hours check (code, `lib/arrangement.ts`) |
| `app/api/resume` | Confirmed evidence -> résumé (Claude) -> claim checks (code, `lib/checks.ts`) |
| `lib/sources.ts` | Job sources. Saved listings, Adzuna (needs keys), Remotive (no key). Add new APIs here. |
| `lib/claude.ts` | `claude-opus-5-5`, effort `low`, structured output, server-side refusal fallback, saved-response fallback |
| `data/` | Personas, 6 job areas, sample jobs, practice tasks, Priya fixtures |

`mockups/index.html` is the earlier design reference; the app replaces it.

## 3. Rules the code enforces

- **Percentage** = key skills with status Supported or Refresh ÷ 5. Ties go to the area with more paid-work evidence. Never an overall score.
- **Cities:** remote jobs show if Remote is ticked. Other jobs show only if their location names a chosen city.
- **Hours:** no hours listed -> Needs confirmation, unless the job is full-time and the user's limit is under 35 hrs (Conflict). A day the user can't work, hours outside their window, or too many hours -> Conflict. Hybrid/on-site jobs that fit still say "check travel time on office days".
- **Recency:** jobs older than 30 days are dropped.
- **Claims:** bullets citing unconfirmed evidence are dropped. Any number not in the cited evidence is flagged and re-checked after edits. Break titles never include medical details.

## 4. Team of 5, one driver

| Person | Now | At 1:30 |
|---|---|---|
| Driver | Builds with Claude in this repo. Adds the API key. Fixes what testers report. | Freeze code. |
| Data | Copies 6–8 real jobs.utah.gov listings into `data/jobs.json` (`source: "jobs.utah.gov"`, `url`, `postedAt`, `capturedAt`; hours only if stated). Keep the Lehi sample for the demo. | Check every listing renders. |
| Integrations | Gets Adzuna keys into `.env.local`. Checks the `us` path in Adzuna's docs. | Confirm source counts on screen 2. |
| Tester | Runs section 6 in Chrome with Priya, Maria, Emily. Reports exact steps to the driver. | Run section 6 again on the final build. |
| Pitch | Writes the 3-minute script (section 5) and slides. Records a backup video once the flow is stable. | Rehearse twice. |

## 5. Demo script (3 minutes)

1. **Priya (main, 90s):** Load the example, speak one sentence into box 3, Analyze. Administrative support 80%: "Excel needs a refresh, Outlook/Teams missing." The Lehi Part-Time Administrative Coordinator fits 9–2, with "check travel time on office days". The remote full-time assistant shows Conflict. Build the résumé: the break is a dated entry, "3" and "20%" are flagged, remove the line, pick Brief, Download PDF.
2. **Maria (schedule, 45s):** Remote only, Mon–Thu 10–3. The part-time remote support job fits. "Flexible schedule" with no hours shows Needs confirmation, with the question to ask. Full-time remote roles show Conflict.
3. **Emily (limited experience, 30s):** Hospitality and school front-office volunteering map to Front desk and reception. The résumé uses only her examples; nothing is invented.
4. **Close (15s):** "It understood what I can do, when I can work, and how to show my break."

## 6. Test checklist

| # | Case | Expected |
|---|---|---|
| 1 | Priya, no API key | Banner shows; all 3 steps work from saved responses. |
| 2 | Priya areas | Admin 80, Project 60, Operations 60, Program 20, Front desk 0, Customer support 0. |
| 3 | Priya admin jobs | Lehi job Fits; 8 a.m. Orem job and remote 8–5 job Conflict; remote no-hours job Needs confirmation. |
| 4 | Remove Lehi from cities | Lehi job disappears; "hidden outside your cities" count goes up. |
| 5 | Résumé numbers | "3" and "20%" flagged; editing the line to remove them clears the flag. |
| 6 | Break titles | No medical words at any level. |
| 7 | Maria customer support | Part-time remote 10–2 Fits; Friday/8–5 role Conflict; "flexible schedule" Needs confirmation. |
| 8 | Emily, with API key | Front desk ranks high; résumé has no skills she didn't mention. |
| 9 | Voice in Chrome; then Safari | Chrome fills the box. Safari hides the mic; typing works. |
| 10 | With API key, any new story | Live results, no banner. |

## 7. Next, if time allows

- Saved responses for Maria and Emily (so all three demo without a key).
- More job APIs in `lib/sources.ts` from the source list (USAJOBS, CareerOneStop, Jooble need keys; Greenhouse/Lever/Ashby need employer board IDs).
- Remove duplicate jobs across sources.
