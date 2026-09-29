import { DIMENSIONS, QUESTIONS, QUESTION_COUNT, getQuestion, maxPointsFor } from "./questions";
import type {
  AnsweredQuestion,
  DimensionBand,
  DimensionId,
  DimensionScore,
  HealthLevel,
} from "./types";

export const MAX_SCORE = QUESTIONS.reduce((sum, q) => sum + maxPointsFor(q.id), 0);
export const MIN_SCORE = QUESTIONS.reduce(
  (sum, q) => sum + Math.min(...q.options.map((o) => o.points)),
  0,
);

/** Score bands. Adjust ranges here to change how results are grouped. */
export const HEALTH_LEVELS: HealthLevel[] = [
  { id: "strong", label: "Strong Foundation", min: 86, max: 100 },
  { id: "good", label: "Good Intentions, Inconsistent System", min: 71, max: 85 },
  { id: "active", label: "Active, But Without Enough Direction", min: 56, max: 70 },
  { id: "reactive", label: "Social Media Is Mostly Reactive", min: 0, max: 55 },
];

export function levelFor(totalScore: number): HealthLevel {
  return HEALTH_LEVELS.find((l) => totalScore >= l.min && totalScore <= l.max) ?? HEALTH_LEVELS[3];
}

/** Turns option indexes (one per question) into full answer records with points. */
export function scoreAnswers(optionIndexes: number[]): {
  answered: AnsweredQuestion[];
  total: number;
  percentage: number;
} {
  if (optionIndexes.length !== QUESTION_COUNT) {
    throw new Error(`Expected ${QUESTION_COUNT} answers, received ${optionIndexes.length}`);
  }
  const answered = QUESTIONS.map((q, i) => {
    const option = q.options[optionIndexes[i]];
    if (!option) throw new Error(`Invalid option ${optionIndexes[i]} for question ${q.id}`);
    return {
      id: q.id,
      question: q.text,
      optionIndex: optionIndexes[i],
      answer: option.label,
      points: option.points,
    };
  });
  const total = answered.reduce((sum, a) => sum + a.points, 0);
  return { answered, total, percentage: Math.round((total / MAX_SCORE) * 100) };
}

export function bandFor(percent: number): DimensionBand {
  if (percent >= 86) return "Strong";
  if (percent >= 71) return "Solid";
  if (percent >= 56) return "Developing";
  return "Emerging";
}

/** Points by question id → dimension scores (percent of the maximum available in that dimension). */
export function dimensionScores(pointsByQuestion: Record<number, number>): DimensionScore[] {
  return DIMENSIONS.map((d) => {
    const points = d.questionIds.reduce((s, id) => s + pointsByQuestion[id], 0);
    const maxPoints = d.questionIds.reduce((s, id) => s + maxPointsFor(id), 0);
    const percent = Math.round((points / maxPoints) * 100);
    return { id: d.id, label: d.label, points, maxPoints, percent, band: bandFor(percent) };
  });
}

/**
 * Strongest / weakest dimension. Ties fall back to the order in DIMENSIONS,
 * except that the weakest tie-break prefers the dimension holding the single lowest answer.
 */
export function extremeDimensions(
  dims: DimensionScore[],
  pointsByQuestion: Record<number, number>,
): { strongest: DimensionId; weakest: DimensionId } {
  const lowestAnswer = (id: DimensionId) => {
    const d = DIMENSIONS.find((x) => x.id === id)!;
    return Math.min(...d.questionIds.map((q) => pointsByQuestion[q]));
  };
  const strongest = dims.reduce((best, d) => (d.percent > best.percent ? d : best));
  const weakest = dims.reduce((worst, d) => {
    if (d.percent < worst.percent) return d;
    if (d.percent === worst.percent && lowestAnswer(d.id) < lowestAnswer(worst.id)) return d;
    return worst;
  });
  return { strongest: strongest.id, weakest: weakest.id };
}

export function pointsMap(answered: AnsweredQuestion[]): Record<number, number> {
  return Object.fromEntries(answered.map((a) => [a.id, a.points]));
}

export { getQuestion };
