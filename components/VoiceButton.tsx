"use client";

import { useRef, useState, useSyncExternalStore } from "react";

type Recognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
};
type RecognitionCtor = new () => Recognition;

function recognitionCtor(): RecognitionCtor | undefined {
  const w = window as unknown as { SpeechRecognition?: RecognitionCtor; webkitSpeechRecognition?: RecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

const noSubscribe = () => () => {};

export function VoiceButton({ onText }: { onText: (text: string) => void }) {
  const supported = useSyncExternalStore(noSubscribe, () => Boolean(recognitionCtor()), () => false);
  const [listening, setListening] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const rec = useRef<Recognition | null>(null);

  if (!supported) return null;

  function toggle() {
    if (rec.current) {
      rec.current.stop();
      return;
    }
    const Ctor = recognitionCtor()!;
    const r = new Ctor();
    r.continuous = true;
    r.interimResults = false;
    r.lang = "en-US";
    r.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) onText(e.results[i][0].transcript.trim());
      }
    };
    r.onerror = (e) => setProblem(e.error === "not-allowed" ? "Microphone blocked" : `Voice error: ${e.error}`);
    r.onend = () => {
      rec.current = null;
      setListening(false);
    };
    rec.current = r;
    setProblem(null);
    r.start();
    setListening(true);
  }

  return (
    <span className="flex items-center gap-2">
      {problem && <span className="text-xs text-rose-700">{problem}</span>}
      <button
        type="button"
        onClick={toggle}
        className={`text-xs rounded-full px-3 py-1 border ${
          listening ? "bg-rose-600 border-rose-600 text-white" : "border-slate-300 text-slate-700 hover:bg-slate-50"
        }`}
      >
        {listening ? "■ Stop" : "🎤 Speak"}
      </button>
    </span>
  );
}
