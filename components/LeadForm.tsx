"use client";

import { forwardRef, useState } from "react";
import { leadSchema } from "@/lib/assessment/validation";
import { ArrowRight, ChevronLeft } from "./icons";

export interface LeadValues {
  name: string;
  email: string;
  businessName: string;
  phone: string;
}

type Field = keyof LeadValues;

const FIELDS: { name: Field; label: string; type: string; autoComplete: string; inputMode?: "email" | "tel"; placeholder: string }[] = [
  { name: "name", label: "Name", type: "text", autoComplete: "name", placeholder: "Your full name" },
  { name: "email", label: "Email", type: "email", autoComplete: "email", inputMode: "email", placeholder: "name@company.com" },
  { name: "businessName", label: "Business name", type: "text", autoComplete: "organization", placeholder: "Your business" },
  { name: "phone", label: "Phone number", type: "tel", autoComplete: "tel", inputMode: "tel", placeholder: "+1 555 000 0000" },
];

interface Props {
  values: LeadValues;
  onChange: (v: LeadValues) => void;
  onBack: () => void;
  onSubmit: (v: LeadValues, honeypot: string) => Promise<{ fieldErrors?: Record<string, string>; error?: string } | void>;
}

export const LeadForm = forwardRef<HTMLHeadingElement, Props>(function LeadForm(
  { values, onChange, onBack, onSubmit },
  headingRef,
) {
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [honeypot, setHoneypot] = useState("");

  const validateField = (name: Field) => {
    const result = leadSchema.shape[name].safeParse(values[name]);
    setErrors((e) => ({ ...e, [name]: result.success ? undefined : result.error.issues[0].message }));
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    setFormError("");
    const parsed = leadSchema.safeParse(values);
    if (!parsed.success) {
      const next: Partial<Record<Field, string>> = {};
      for (const issue of parsed.error.issues) next[issue.path[0] as Field] ??= issue.message;
      setErrors(next);
      const first = FIELDS.find((f) => next[f.name]);
      if (first) e.currentTarget.querySelector<HTMLInputElement>(`[name="${first.name}"]`)?.focus();
      return;
    }
    setErrors({});
    setBusy(true);
    const res = await onSubmit(parsed.data, honeypot);
    setBusy(false);
    if (res) {
      if (res.fieldErrors) setErrors(res.fieldErrors as Partial<Record<Field, string>>);
      setFormError(res.error ?? "Something went wrong. Please try again.");
    }
  }

  return (
    <section className="card p-6 sm:p-10" aria-labelledby="lead-title">
      <div className="flex min-h-[44px] items-center">
        <button type="button" onClick={onBack} className="btn-text -ml-1">
          <ChevronLeft /> Previous
        </button>
      </div>
      <p className="eyebrow mt-1">Last step</p>
      <h2 id="lead-title" ref={headingRef} tabIndex={-1} className="serif mt-3 text-[32px] leading-[1.15] outline-none sm:text-[38px]">
        Your results are ready
      </h2>
      <p className="mt-3 text-[16px] leading-relaxed text-body">
        Tell us a little about you and your business to see your Business Social Media Health Check. All fields are required.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-7 space-y-5">
        {FIELDS.map((f) => (
          <div key={f.name}>
            <label htmlFor={`lead-${f.name}`} className="field-label">
              {f.label}
            </label>
            <input
              id={`lead-${f.name}`}
              name={f.name}
              type={f.type}
              inputMode={f.inputMode}
              autoComplete={f.autoComplete}
              placeholder={f.placeholder}
              required
              value={values[f.name]}
              maxLength={f.name === "businessName" ? 160 : 120}
              onChange={(e) => {
                onChange({ ...values, [f.name]: e.target.value });
                if (errors[f.name]) setErrors((x) => ({ ...x, [f.name]: undefined }));
              }}
              onBlur={() => values[f.name] && validateField(f.name)}
              aria-invalid={errors[f.name] ? true : undefined}
              aria-describedby={errors[f.name] ? `lead-${f.name}-error` : undefined}
              className="field"
            />
            {errors[f.name] ? (
              <p id={`lead-${f.name}-error`} className="field-error">
                {errors[f.name]}
              </p>
            ) : null}
          </div>
        ))}

        {/* Honeypot: hidden from people and assistive tech; bots tend to fill it. */}
        <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>
            Website
            <input type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
          </label>
        </div>

        {formError ? (
          <p role="alert" className="rounded-[8px] border border-error/40 bg-[#fdf3f0] px-4 py-3 text-[14px] text-error">
            {formError}
          </p>
        ) : null}

        <button type="submit" disabled={busy} className="btn btn-primary w-full">
          {busy ? "Preparing your results…" : (<>See My Results <ArrowRight /></>)}
        </button>
      </form>
    </section>
  );
});
