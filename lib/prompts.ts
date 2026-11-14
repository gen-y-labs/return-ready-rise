export const EXTRACT_PROMPT = `You turn a caregiver's own words into work evidence for a job-search tool. The input has three parts: past work, their career break, and what they did during the break. It may come from speech-to-text, so ignore filler words and fix obvious mis-hearings only when the meaning is clear.

Rules:
- Each evidence item is one thing the person did. Its text must quote or closely follow their words.
- Never add numbers, tools, titles, results, employers, or software they did not say.
- source: "paid" for jobs, "volunteer" for unpaid community or school work, "caregiving" for care of family members, "education" for courses.
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

Cite the evidence ids you used. explanation is one short sentence in plain words, addressed to the person ("You ..."). question is null unless the status is needs_clarification. Do not compute scores or percentages. Return every area and every key skill.`;

export const RESUME_PROMPT = `You write a one-page résumé for a caregiver returning to work, aimed at one job area. Use only the evidence provided; it has already been confirmed by the person.

Rules:
- Every bullet and the summary cite the evidence ids they rely on.
- Keep the person's own verbs. Do not upgrade "helped" to "led" or "managed".
- Do not add numbers, percentages, team sizes, tools, or results that are not in the evidence.
- summary: two sentences, no first person.
- breakBullets: activities from the career break (volunteer or caregiving evidence), one per bullet.
- experience: one entry per paid job, using the org, role, and years in the evidence. location is null unless the evidence states it.
- skills: short skill names backed by the evidence, most relevant to the job area first.
- education: only education evidence; an empty list if none.
- prepTasks: up to 3 practice tasks from the list provided, for key skills marked refresh or missing. Use only task ids from that list.
- Never include medical conditions or health details.`;
