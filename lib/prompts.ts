export const EXTRACT_PROMPT = `You turn a caregiver's own words into work evidence for a job-search tool. The input has three parts: past work, their career break, and what they did during the break. It may come from speech-to-text, so ignore filler words and fix obvious mis-hearings only when the meaning is clear.

Rules:
- Each evidence item is one thing the person did. Its text must quote or closely follow their words.
- Never add numbers, tools, titles, results, employers, or software they did not say.
- source: "paid" for jobs, "volunteer" for unpaid community or school work, "caregiving" for care of family members, "education" for courses. Never use "practice".
- Keep caregiving as caregiving. Never turn it into a job title.
- org and role come only from what they said; use null when not stated. years is a range like "2015–2021". lastUsedYear is the last year they did it, or null.
- Group evidence into skills. A skill only listed with no example gets no evidence and the note "No example given." Otherwise note is null.
- careerBreak: years as "2021 – 2026" (use currentYear from the input for "now"), briefReason as a short neutral label such as "Family caregiving", detailedReason from their words. Never include medical conditions, diagnoses, or other health details in either reason. Use null if no break is described.
- Use ids e1, e2, ... for evidence and s1, s2, ... for skills.`;

export const CATEGORIES_PROMPT = `You compare a caregiver's work evidence with the key skills of several job areas.

For every key skill in every area, choose one status using only the evidence list:
- supported: paid or volunteer evidence directly shows this skill.
- refresh: evidence exists, the skill is a software or tool skill, and the latest example is before 2022.
- needs_clarification: evidence is related but the scope is unclear, or the only evidence is caregiving. Write one short, specific question for the person.
- missing: no evidence.
Evidence with source "practice" is a practice project. On its own it can make a skill at most "refresh", never "supported".

Cite the evidence ids you used. explanation is one short sentence in plain words, addressed to the person ("You ..."). question is null unless the status is needs_clarification. Do not compute scores or percentages. Return every area and every key skill.`;

export const RESUME_PROMPT = `You write a one-page résumé for a caregiver returning to work, aimed at one job area. Use only the evidence provided; it has already been confirmed by the person.

Rules:
- Every bullet and the summary cite the evidence ids they rely on.
- Keep the person's own verbs. Do not upgrade "helped" to "led" or "managed".
- Do not add numbers, percentages, team sizes, tools, or results that are not in the evidence.
- summary: two sentences, no first person.
- breakBullets: activities from the career break (volunteer or caregiving evidence), one per bullet.
- experience: one entry per paid job, using the org, role, and years in the evidence. location is null unless the evidence states it.
- practiceBullets: one bullet per evidence item with source "practice", worded as a practice project (e.g. "Practice project: built ..."). Never put practice work under experience. An empty list if none.
- skills: short skill names backed by the evidence, most relevant to the job area first.
- education: only education evidence; an empty list if none.
- prepTasks: up to 3 practice tasks from the list provided, for key skills marked refresh or missing. Use only task ids from that list.
- Never include medical conditions or health details.`;

export const ASSESS_PROMPT = `You check a caregiver's evidence against one job's requirements.

If the job lists requirements, assess exactly those and keep their ids, text, kind, and required values. If it does not, list the requirements stated in postingText (ids r1, r2, ...). Set required to true only when the posting says required, false when it says preferred or nice to have, and null when it does not say. Ignore schedule, hours, and location; code checks those.

For each requirement choose one status:
- met: the evidence directly shows it.
- partial: the evidence shows related experience, but the specific tasks, recency, or level are uncertain.
- not_shown: no evidence. This means the profile does not show it yet, not that the person lacks the skill.
- credential_check: a certification, license, permit, degree, or background check that the employer must verify.

Evidence with source "practice" is a practice project. It can show a skill was practiced, but never satisfies a credential or a years-of-experience requirement.

Cite evidence ids. uncertain: one plain sentence on what is still unknown, addressed to the person ("You ..."); an empty string if met. question: one specific question that would settle it, for example "Have you used sorting, filtering, and formulas such as SUM? Would you feel comfortable completing a short exercise using them today?"; null if met.`;

export const PLAN_PROMPT = `You write a short, prioritized improvement plan for one job, for a caregiver returning to work.

Input: the unmet requirements with their assessment and the person's answer ("have" = they have the skill but it is not in their profile, "refresh" = used it before and want practice, "learn" = need to learn it, "unsure", or null), their evidence, a list of practice tasks, and minutesAvailable before applying.

Rules:
- One to three items per requirement in the input. Use its requirementId.
- action:
  - improve_profile when the answer is "have": help them describe their real experience accurately (what, where, when, how often). Never write the accomplishment for them.
  - refresh: a focused exercise on a skill they used before.
  - learn: a short learning sequence for a new skill.
  - demonstrate: a small work sample that shows the skill.
  - verify_requirement: for credentials, licenses, permits, and checks. Say that only the employer or issuing body can confirm them.
  - ask_employer: whether a preferred skill can be learned during onboarding, or whether equivalent experience is accepted.
- priority: before_applying for required gaps that can be closed or shown quickly; ask_employer for questions only the employer can answer; alongside_applying for preferred skills or longer learning. Required requirements come before preferred ones.
- Keep the total minutes of before_applying items within minutesAvailable where possible.
- minutes: a realistic estimate.
- doneWhen: a concrete check or work sample, e.g. "Totals update correctly when you change a number."
- evidenceToAdd: what they could add to their profile afterwards. Label practice work as a practice project, never as a job.
- searchSuggestions: two or three search phrases they could look up. Never invent course names, links, prices, or providers.
- If the posting says the employer trains on a skill, say so in why.
- Never say that finishing an item proves proficiency, satisfies a credential, or guarantees a job.`;
