import { z } from "zod";
import { QUESTIONS } from "./questions";

/** Trim, collapse whitespace, strip control characters and angle brackets. */
export function clean(value: string): string {
  return value
    .replace(/[\u0000-\u001f\u007f<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const text = (label: string, min: number, max: number) =>
  z
    .string({ error: `${label} is required` })
    .transform(clean)
    .pipe(
      z
        .string()
        .min(1, `${label} is required`)
        .min(min, `${label} looks too short`)
        .max(max, `${label} is too long`),
    );

const PHONE_CHARS = /^\+?[0-9\s().\-]+$/;

export const leadSchema = z.object({
  name: text("Name", 2, 120),
  email: z
    .string({ error: "Email is required" })
    .transform((v) => clean(v).toLowerCase())
    .pipe(
      z
        .string()
        .min(1, "Email is required")
        .max(254, "Email is too long")
        .regex(/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/, "Enter a valid email address, like name@company.com"),
    ),
  businessName: text("Business name", 2, 160),
  phone: z
    .string({ error: "Phone number is required" })
    .transform(clean)
    .pipe(
      z
        .string()
        .min(1, "Phone number is required")
        .max(30, "Phone number is too long")
        .refine((v) => PHONE_CHARS.test(v), "Use digits only, with an optional + at the start")
        .refine((v) => {
          const digits = v.replace(/\D/g, "").length;
          return digits >= 7 && digits <= 15;
        }, "Enter a valid phone number, including area or country code"),
    ),
});

export type LeadInput = z.input<typeof leadSchema>;
export type Lead = z.output<typeof leadSchema>;

export const submissionSchema = z.object({
  submissionKey: z.string().uuid(),
  answers: z
    .array(z.number().int().min(0))
    .length(QUESTIONS.length, "All questions must be answered")
    .refine(
      (a) => a.every((v, i) => v < QUESTIONS[i].options.length),
      "One or more answers are invalid",
    ),
  lead: leadSchema,
  /** Honeypot. Real visitors never see or fill this. */
  website: z.string().max(200).optional(),
});
