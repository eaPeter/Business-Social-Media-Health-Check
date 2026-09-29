"use client";

import { forwardRef } from "react";
import type { Question } from "@/lib/assessment/types";
import { QUESTION_COUNT } from "@/lib/assessment/questions";
import { ArrowRight, ChevronLeft } from "./icons";

interface Props {
  question: Question;
  index: number;
  selected: number | null;
  error: boolean;
  onSelect: (optionIndex: number) => void;
  onNext: () => void;
  onPrev: () => void;
}

export const QuestionStep = forwardRef<HTMLHeadingElement, Props>(function QuestionStep(
  { question, index, selected, error, onSelect, onNext, onPrev },
  headingRef,
) {
  const headingId = `q-${question.id}-title`;
  const number = index + 1;
  const isLast = number === QUESTION_COUNT;

  return (
    <section className="card p-6 sm:p-10" aria-labelledby={headingId}>
      {index > 0 ? (
        <button type="button" onClick={onPrev} className="btn-text -ml-1">
          <ChevronLeft /> Previous
        </button>
      ) : null}

      <p className={`eyebrow ${index > 0 ? "mt-1" : ""}`}>
        Question {number} of {QUESTION_COUNT}
      </p>
      <div
        role="progressbar"
        aria-label="Progress"
        aria-valuemin={1}
        aria-valuemax={QUESTION_COUNT}
        aria-valuenow={number}
        aria-valuetext={`Question ${number} of ${QUESTION_COUNT}`}
        className="bar-track mt-3 h-[6px]"
      >
        <div className="bar-fill" style={{ width: `${(number / QUESTION_COUNT) * 100}%` }} />
      </div>

      <h2
        id={headingId}
        ref={headingRef}
        tabIndex={-1}
        className="serif mt-8 text-[27px] leading-[1.2] outline-none sm:text-[32px]"
      >
        {question.text}
      </h2>

      <fieldset aria-labelledby={headingId} className="mt-7 space-y-3">
        {question.options.map((option, i) => (
          <label key={option.label} className="block">
            <input
              type="radio"
              name={`question-${question.id}`}
              className="sr-only"
              checked={selected === i}
              onChange={() => onSelect(i)}
              aria-describedby={error ? `q-${question.id}-error` : undefined}
            />
            <span className="option">
              <span className="option-dot" aria-hidden />
              <span>{option.label}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <p
        id={`q-${question.id}-error`}
        role="alert"
        className={`field-error min-h-[20px] ${error ? "" : "invisible"}`}
      >
        {error ? "Choose an answer to continue." : ""}
      </p>

      <button
        type="button"
        onClick={onNext}
        aria-disabled={selected === null}
        className="btn btn-primary mt-3 w-full"
      >
        {isLast ? "Finish" : "Continue"} <ArrowRight />
      </button>
    </section>
  );
});
