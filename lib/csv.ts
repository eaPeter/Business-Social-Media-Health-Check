import "server-only";
import { QUESTIONS } from "./assessment/questions";
import type { SubmissionRow } from "./submissions";

const HEADERS = [
  "Submission date (UTC)",
  "Name",
  "Email",
  "Business name",
  "Phone",
  ...QUESTIONS.flatMap((q) => [`Q${q.id} answer`, `Q${q.id} points`]),
  "Total score",
  "Percentage score",
  "Assessment category",
  "Strategy & Purpose (%)",
  "Consistency & Content System (%)",
  "Audience & Community (%)",
  "Business Impact (%)",
  "Strongest area",
  "Weakest area",
];

/** Quotes a cell, and neutralises spreadsheet formulas (=, +, -, @) in user-supplied text. */
function cell(value: unknown): string {
  let s = value == null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function csvHeader(): string {
  return HEADERS.map(cell).join(",") + "\r\n";
}

export function csvRows(rows: SubmissionRow[]): string {
  return rows
    .map((r) =>
      [
        r.created_at,
        r.name,
        r.email,
        r.business_name,
        r.phone,
        ...QUESTIONS.flatMap((q) => [r[`q${q.id}_answer`], r[`q${q.id}_score`]]),
        r.total_score,
        r.percentage_score,
        r.health_level,
        r.strategy_score,
        r.consistency_score,
        r.audience_score,
        r.business_impact_score,
        r.strongest_dimension,
        r.weakest_dimension,
      ]
        .map(cell)
        .join(","),
    )
    .join("\r\n")
    .concat(rows.length ? "\r\n" : "");
}
