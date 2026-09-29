"use client";

import { forwardRef, useEffect, useState } from "react";
import type { AssessmentResult } from "@/lib/assessment/types";
import { CTA } from "@/lib/config";
import { Check, Compass } from "./icons";

interface Props {
  result: AssessmentResult;
  firstName?: string;
  onRetake: () => void;
}

function ReserveButton({ className = "" }: { className?: string }) {
  return (
    <a href={CTA.url} target="_blank" rel="noopener noreferrer" className={`btn btn-primary w-full sm:w-auto sm:min-w-[240px] ${className}`}>
      {CTA.buttonLabel}
    </a>
  );
}

export const Results = forwardRef<HTMLHeadingElement, Props>(function Results({ result, firstName, onRetake }, headingRef) {
  const [filled, setFilled] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setFilled(true), 150);
    return () => clearTimeout(t);
  }, []);

  const [lead, ...rest] = result.diagnosis;

  return (
    <div className="space-y-6 md:-mx-10">
      <article className="card overflow-hidden" aria-labelledby="result-title">
        {/* Score + level */}
        <div className="relative overflow-hidden bg-brand px-6 pb-9 pt-9 text-white sm:px-10 sm:pb-11 sm:pt-11">
          <div className="pointer-events-none absolute -right-14 -top-20 h-56 w-56 rounded-full bg-white/[0.07]" aria-hidden />
          <p className="relative text-[12px] font-semibold uppercase tracking-[0.08em] text-white/80">
            {firstName ? `${firstName}, your` : "Your"} Business Social Media Health Check
          </p>
          <div className="relative mt-5 flex items-end gap-2" aria-label={`Score: ${result.totalScore} out of 100`}>
            <span className="serif text-[72px] leading-none sm:text-[88px]">{result.totalScore}</span>
            <span className="serif pb-2 text-[24px] text-white/75 sm:pb-3 sm:text-[28px]">/ 100</span>
          </div>
          <h1 id="result-title" ref={headingRef} tabIndex={-1} className="serif relative mt-4 text-[30px] leading-[1.12] outline-none sm:text-[38px]">
            {result.level.label}
          </h1>
        </div>

        {/* Diagnosis */}
        <div className="px-6 py-8 sm:px-10 sm:py-10">
          <p className="text-[17px] leading-[1.6] text-ink sm:text-[18px]">{lead}</p>
          {rest.map((p) => (
            <p key={p} className="mt-4 text-[16px] leading-[1.65] text-body">
              {p}
            </p>
          ))}
        </div>

        {/* Breakdown */}
        <div className="border-t border-hairline-soft px-6 py-8 sm:px-10 sm:py-10">
          <h2 className="serif text-[26px]">Your health breakdown</h2>
          <ul className="mt-6 space-y-6">
            {result.dimensions.map((d) => (
              <li key={d.id}>
                <div className="flex items-baseline justify-between gap-4">
                  <span className="text-[15px] font-medium">{d.label}</span>
                  <span className="shrink-0 text-[14px] text-muted">
                    {d.band} · <span className="font-medium text-ink">{d.percent}%</span>
                  </span>
                </div>
                <div className="bar-track mt-2" role="img" aria-label={`${d.label}: ${d.percent} percent, ${d.band}`}>
                  <div className="bar-fill" style={{ width: filled ? `${d.percent}%` : "0%" }} />
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Strengths / gaps */}
        <div className="grid gap-px border-t border-hairline-soft bg-hairline-soft md:grid-cols-2">
          <section className="bg-white px-6 py-8 sm:px-10" aria-labelledby="doing-well">
            <h2 id="doing-well" className="serif text-[24px]">What you’re doing well</h2>
            <ul className="mt-5 space-y-4">
              {result.strengths.map((s) => (
                <li key={s} className="flex gap-3 text-[15px] leading-relaxed text-body">
                  <span className="mt-0.5 grid h-6 w-6 flex-none place-items-center rounded-full bg-brand text-white">
                    <Check />
                  </span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </section>
          <section className="bg-white px-6 py-8 sm:px-10" aria-labelledby="holding-back">
            <h2 id="holding-back" className="serif text-[24px]">What’s holding you back</h2>
            <ul className="mt-5 space-y-4">
              {result.weaknesses.map((s) => (
                <li key={s} className="flex gap-3 text-[15px] leading-relaxed text-body">
                  <span className="mt-0.5 grid h-6 w-6 flex-none place-items-center rounded-full border border-brand text-brand">
                    <Compass />
                  </span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Focus next */}
        <div className="border-t border-hairline-soft px-6 py-8 sm:px-10 sm:py-10">
          <h2 className="serif text-[26px]">Where to focus next</h2>
          <ol className="mt-6 space-y-3">
            {result.recommendations.map((r, i) => (
              <li key={r.title} className="flex gap-4 rounded-[12px] border border-hairline p-5">
                <span className="serif w-8 flex-none text-[34px] leading-none text-brand" aria-hidden>
                  {i + 1}
                </span>
                <div>
                  <h3 className="text-[17px] font-semibold leading-snug">{r.title}</h3>
                  <p className="mt-1.5 text-[15px] leading-relaxed text-body">{r.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </article>

      {/* Workshop offer */}
      <section className="card px-6 py-9 sm:px-10 sm:py-11" aria-labelledby="cta-title">
        <p className="eyebrow">{CTA.eyebrow}</p>
        <h2 id="cta-title" className="serif mt-3 text-[28px] leading-[1.15] sm:text-[34px]">
          {CTA.heading}
        </h2>
        <p className="mt-4 text-[16px] leading-relaxed text-body">{CTA.body}</p>
        <ReserveButton className="mt-7" />
      </section>

      <section className="card px-6 py-9 sm:px-10 sm:py-11" aria-labelledby="pain-title">
        <h2 id="pain-title" className="serif text-[28px] leading-[1.15] sm:text-[34px]">
          {CTA.painPoint.heading}
        </h2>
        <div className="mt-5 space-y-4 text-[16px] leading-relaxed text-body">
          {CTA.painPoint.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
          <p className="font-semibold text-ink">{CTA.painPoint.closing}</p>
        </div>

        <dl className="mt-8 rounded-[12px] bg-brand-soft p-5 sm:p-6">
          <div className="flex items-baseline justify-between gap-4 text-[15px] text-muted">
            <dt>Total Value</dt>
            <dd className="line-through">{CTA.price.totalValue}</dd>
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-4">
            <dt className="text-[16px] font-medium">Your price today</dt>
            <dd className="serif text-[36px] leading-none text-brand">{CTA.price.today}</dd>
          </div>
        </dl>

        <ReserveButton className="mt-6" />
      </section>

      <div className="no-print text-center">
        <button type="button" onClick={onRetake} className="btn-text">
          Retake the health check
        </button>
      </div>
    </div>
  );
});
