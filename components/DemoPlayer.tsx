"use client";

import { useRef, useState } from "react";

// Drives the real UI by clicking its buttons, so the demo always shows the actual app.
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function find(selector: string, text: string): HTMLElement | undefined {
  return [...document.querySelectorAll<HTMLElement>(selector)].find(
    (el) => el.textContent?.includes(text) && !(el as HTMLButtonElement).disabled,
  );
}

async function waitFor(selector: string, text: string): Promise<HTMLElement> {
  for (let i = 0; i < 80; i++) {
    const el = find(selector, text);
    if (el) return el;
    await sleep(150);
  }
  throw new Error(`Demo could not find "${text}".`);
}

function spotlight(el: Element | undefined) {
  document.querySelectorAll("[data-demo-focus]").forEach((e) => e.removeAttribute("data-demo-focus"));
  if (!el) return;
  el.setAttribute("data-demo-focus", "");
  el.scrollIntoView({ behavior: "smooth", block: "center" });
}

async function click(text: string, selector = "button") {
  const el = await waitFor(selector, text);
  spotlight(el);
  await sleep(500);
  el.click();
  await sleep(400);
}

async function show(selector: string, text: string) {
  spotlight(await waitFor(selector, text));
  await sleep(300);
}

const card = (title: string) => async () => {
  const heading = await waitFor("div.font-medium", title);
  spotlight(heading.closest(".rounded-xl") ?? heading);
  await sleep(300);
};

async function startPersona(name: string) {
  await click("Tell us your story");
  await click(name);
  await click("Analyze my experience");
  await waitFor("button", "See my job areas");
}

type Step = { act?: () => Promise<void>; say: string };

const STEPS: Step[] = [
  { say: "This is Return Ready Rise. It helps anyone come back to work after a career break, whatever the reason and whatever their field." },
  { act: () => startPersona("Priya"), say: "Meet Priya. Six years as an administrative coordinator, then five years raising her children. She can work nine to two. She tells her story, and the AI turns it into skills, each tied to her own words." },
  { act: async () => { await click("See my job areas"); await show("button", "Administrative support"); }, say: "Her best fit is administrative support, at eighty percent. Four of five key skills, with Excel to refresh." },
  { act: card("Part-Time Administrative Coordinator"), say: "Jobs are filtered by her hours and her cities. This Lehi role fits nine to two." },
  { act: card("Administrative Assistant (Remote)"), say: "This remote job matches her skills, but it needs eight to five, so it is flagged as a conflict. Remote does not mean flexible." },
  {
    act: async () => {
      const lehi = await waitFor("div.font-medium", "Part-Time Administrative Coordinator");
      const btn = [...(lehi.closest(".rounded-xl")?.querySelectorAll("button") ?? [])].find((b) => b.textContent?.includes("Check my readiness"));
      spotlight(btn);
      await sleep(500);
      btn?.click();
      const excel = await waitFor("section .rounded-xl", "Basic Excel");
      spotlight(excel);
    },
    say: "For this job, it separates what is missing from what simply is not shown yet, and asks her one question.",
  },
  {
    act: async () => {
      const excel = await waitFor("section .rounded-xl", "Basic Excel");
      [...excel.querySelectorAll("button")].find((b) => b.textContent === "I need a refresher")?.click();
      await click("Make my improvement plan");
      await show("div.uppercase", "Before you apply");
    },
    say: "She asks for a refresher, and gets a short plan that fits her two hours: three Excel exercises before she applies.",
  },
  {
    act: async () => { await click("Build my résumé for this job"); await show("article li", "20%"); },
    say: "Her résumé shows the break as a normal, dated entry. And it flags numbers she never said, like twenty percent, so nothing is invented.",
  },
  { act: async () => { await startPersona("David"); await click("See my job areas"); await card("Operations Manager")(); }, say: "Now David. He managed operations for eight years, then cared for his mother, and wants full-time work. The full-time manager role fits his eight to five." },
  { act: card("Logistics Operations Supervisor"), say: "A six a.m. shift does not, and the app says so." },
  { act: async () => { await click("Build my résumé"); await click("Detailed"); await show("article", "Caring for a parent"); }, say: "His real numbers stay, because he said them. He chooses how much to share, and his break reads caring for a parent, with no health details." },
  { act: async () => { await startPersona("Emily"); await click("See my job areas"); await card("Front Desk Receptionist (Part-Time)")(); }, say: "Finally Emily, with little formal work history: a restaurant job and school volunteering. She is matched to front desk roles that fit her school hours, using only her real examples." },
  { act: async () => spotlight(undefined), say: "Return Ready Rise understands what you can do, when you can work, and how to show your break. Thank you." },
];

function speak(text: string, isStopped: () => boolean): Promise<void> {
  return new Promise((resolve) => {
    const synth = typeof window !== "undefined" ? window.speechSynthesis : undefined;
    const fallbackMs = text.split(" ").length * 380 + 1200;
    if (!synth) {
      setTimeout(resolve, fallbackMs);
      return;
    }
    const u = new SpeechSynthesisUtterance(text);
    const voice = synth.getVoices().find((v) => /Samantha|Google US English|Jenny|Aria/.test(v.name));
    if (voice) u.voice = voice;
    u.rate = 1.12;
    // Some browsers never fire onend, so a timer guarantees the demo moves on.
    const timer = setTimeout(resolve, fallbackMs + 4000);
    u.onend = () => {
      clearTimeout(timer);
      resolve();
    };
    if (isStopped()) resolve();
    else synth.speak(u);
  });
}

export function DemoPlayer() {
  const [caption, setCaption] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const stoppedRef = useRef(false);

  async function waitWhilePaused() {
    while (pausedRef.current && !stoppedRef.current) await sleep(200);
  }

  async function play() {
    stoppedRef.current = false;
    pausedRef.current = false;
    setPaused(false);
    window.scrollTo({ top: 0 });
    for (let i = 0; i < STEPS.length && !stoppedRef.current; i++) {
      setIndex(i);
      setCaption("…");
      try {
        await STEPS[i].act?.();
      } catch (err) {
        setCaption(err instanceof Error ? err.message : "Demo step failed.");
        return;
      }
      setCaption(STEPS[i].say);
      for (const sentence of STEPS[i].say.match(/[^.!?]+[.!?]/g) ?? [STEPS[i].say]) {
        await waitWhilePaused();
        if (stoppedRef.current) break;
        await speak(sentence.trim(), () => stoppedRef.current);
      }
      await sleep(500);
      await waitWhilePaused();
    }
    spotlight(undefined);
    if (!stoppedRef.current) setCaption(null);
  }

  function togglePause() {
    pausedRef.current = !pausedRef.current;
    setPaused(pausedRef.current);
    if (pausedRef.current) window.speechSynthesis?.pause();
    else window.speechSynthesis?.resume();
  }

  function stop() {
    stoppedRef.current = true;
    window.speechSynthesis?.cancel();
    spotlight(undefined);
    setCaption(null);
  }

  if (caption === null) {
    return (
      <button
        onClick={play}
        className="fixed bottom-4 right-4 z-30 rounded-full bg-slate-900 text-white text-sm px-4 py-2 shadow-lg print:hidden"
      >
        ▶ Guided demo
      </button>
    );
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 bg-slate-900/95 text-white print:hidden">
      <div className="max-w-5xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
        <span className="text-xs text-slate-400 tabular-nums">
          {index + 1}/{STEPS.length}
        </span>
        <p className="flex-1 min-w-[12rem] text-sm sm:text-base">{caption}</p>
        <button onClick={togglePause} className="rounded-full border border-slate-500 px-3 py-1 text-xs">
          {paused ? "Resume" : "Pause"}
        </button>
        <button onClick={stop} className="rounded-full border border-slate-500 px-3 py-1 text-xs">
          Stop
        </button>
      </div>
    </div>
  );
}
