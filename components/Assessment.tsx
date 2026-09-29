"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { QUESTIONS, QUESTION_COUNT } from "@/lib/assessment/questions";
import type { AssessmentResult } from "@/lib/assessment/types";
import { Intro } from "./Intro";
import { LeadForm, type LeadValues } from "./LeadForm";
import { QuestionStep } from "./QuestionStep";
import { Results } from "./Results";

type Stage = "intro" | "questions" | "lead" | "result";

interface Saved {
  stage: Stage;
  step: number;
  answers: (number | null)[];
  lead: LeadValues;
  key: string;
  result?: AssessmentResult;
  firstName?: string;
}

const STORAGE_KEY = "shc:v1";
const emptyLead: LeadValues = { name: "", email: "", businessName: "", phone: "" };

const uuid = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
      });

const fresh = (): Saved => ({
  stage: "intro",
  step: 0,
  answers: Array(QUESTION_COUNT).fill(null),
  lead: emptyLead,
  key: uuid(),
});

export function Assessment() {
  const [state, setState] = useState<Saved | null>(null); // null until localStorage has been read
  const [dir, setDir] = useState<"forward" | "back">("forward");
  const [needsAnswer, setNeedsAnswer] = useState(false);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);

  // Restore progress (and a completed result) so refreshing never loses answers or re-submits.
  useEffect(() => {
    let saved: Saved | null = null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Saved;
        if (Array.isArray(parsed.answers) && parsed.answers.length === QUESTION_COUNT && parsed.key) {
          saved = parsed.stage === "result" && !parsed.result ? fresh() : parsed;
        }
      }
    } catch {}
    setState(saved ?? fresh());
  }, []);

  useEffect(() => {
    if (!state) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  // Move focus to the new heading after each step change, for keyboard and screen-reader users.
  useEffect(() => {
    if (!state) return;
    if (!moved.current) {
      moved.current = true;
      return;
    }
    headingRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [state?.stage, state?.step]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = useCallback((patch: Partial<Saved>) => setState((s) => (s ? { ...s, ...patch } : s)), []);

  if (!state) return <div className="min-h-[520px]" aria-hidden />;

  const go = (d: "forward" | "back", patch: Partial<Saved>) => {
    setDir(d);
    setNeedsAnswer(false);
    update(patch);
  };

  const anim = dir === "forward" ? "step-forward" : "step-back";

  if (state.stage === "intro") {
    const inProgress = state.answers.some((a) => a !== null);
    return (
      <div key="intro" className={anim}>
        <Intro
          onStart={() => {
            // Resume where they left off if they already began.
            const firstOpen = state.answers.findIndex((a) => a === null);
            go("forward", { stage: "questions", step: inProgress ? Math.max(firstOpen, 0) : 0 });
          }}
        />
      </div>
    );
  }

  if (state.stage === "questions") {
    const index = state.step;
    const q = QUESTIONS[index];
    const selected = state.answers[index];
    return (
      <div key={`q${index}`} className={anim}>
        <QuestionStep
          ref={headingRef}
          question={q}
          index={index}
          selected={selected}
          error={needsAnswer && selected === null}
          onSelect={(i) => {
            setNeedsAnswer(false);
            update({ answers: state.answers.map((a, n) => (n === index ? i : a)) });
          }}
          onPrev={() => go("back", { step: index - 1 })}
          onNext={() => {
            if (selected === null) return setNeedsAnswer(true);
            if (index < QUESTION_COUNT - 1) go("forward", { step: index + 1 });
            else go("forward", { stage: "lead" });
          }}
        />
      </div>
    );
  }

  if (state.stage === "lead") {
    return (
      <div key="lead" className={anim}>
        <LeadForm
          ref={headingRef}
          values={state.lead}
          onChange={(lead) => update({ lead })}
          onBack={() => go("back", { stage: "questions", step: QUESTION_COUNT - 1 })}
          onSubmit={async (lead, website) => {
            try {
              const res = await fetch("/api/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ submissionKey: state.key, answers: state.answers, lead, website }),
              });
              const data = await res.json().catch(() => ({}));
              if (!res.ok) return { error: data.error, fieldErrors: data.fieldErrors };
              go("forward", {
                stage: "result",
                result: data.result as AssessmentResult,
                firstName: lead.name.split(" ")[0],
                lead: emptyLead, // don't keep contact details on the device after saving
              });
            } catch {
              return { error: "We couldn't reach the server. Check your connection and try again." };
            }
          }}
        />
      </div>
    );
  }

  return (
    <div key="result" className="rise">
      <Results
        ref={headingRef}
        result={state.result!}
        firstName={state.firstName}
        onRetake={() => {
          setDir("forward");
          setState({ ...fresh(), stage: "questions" });
        }}
      />
    </div>
  );
}
