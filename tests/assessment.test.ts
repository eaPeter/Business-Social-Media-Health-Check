import { describe, expect, it } from "vitest";
import { QUESTIONS } from "@/lib/assessment/questions";
import { MAX_SCORE, MIN_SCORE, scoreAnswers } from "@/lib/assessment/scoring";
import { generateResult } from "@/lib/assessment/diagnosis";

/** Build answers by points, e.g. pts(10,10,8,...) — Q1 index for 4 points falls back to its last option. */
const idx = (q: number, points: number) => {
  const opts = QUESTIONS[q - 1].options;
  const i = opts.findIndex((o) => o.points === points);
  return i === -1 ? opts.length - 1 : i;
};
const answers = (pts: number[]) => pts.map((p, i) => idx(i + 1, p));

const SCENARIOS: Record<string, number[]> = {
  allFirst: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
  allLast: [6, 4, 4, 4, 4, 4, 4, 4, 4, 4],
  strongStrategyWeakConsistency: [10, 4, 10, 4, 4, 10, 8, 8, 8, 8],
  weakStrategyStrongConsistency: [6, 10, 4, 10, 10, 4, 8, 8, 8, 8],
  engagedButNoImpact: [8, 8, 8, 8, 8, 8, 10, 4, 10, 10],
  contentStrongAudienceWeak: [8, 8, 8, 10, 10, 8, 4, 8, 6, 6],
  weakContentSystemReasonableStrategy: [10, 8, 8, 4, 4, 8, 8, 8, 8, 8],
  mixedMid: [8, 6, 6, 8, 6, 6, 8, 6, 6, 8],
};

describe("scoring", () => {
  it("has a maximum of 100 and minimum of 42", () => {
    expect(MAX_SCORE).toBe(100);
    expect(MIN_SCORE).toBe(42);
  });

  it("Q1 has exactly three options scoring 10, 8, 6", () => {
    expect(QUESTIONS[0].options.map((o) => o.points)).toEqual([10, 8, 6]);
  });

  it("every other question scores 10, 8, 6, 4 in order", () => {
    for (const q of QUESTIONS.slice(1)) expect(q.options.map((o) => o.points)).toEqual([10, 8, 6, 4]);
  });

  it("scores the first option of every question as 100 and the last as 42", () => {
    expect(scoreAnswers(QUESTIONS.map(() => 0)).total).toBe(100);
    expect(scoreAnswers(QUESTIONS.map((q) => q.options.length - 1)).total).toBe(42);
  });

  it("rejects invalid option indexes and wrong lengths", () => {
    expect(() => scoreAnswers([0, 0, 0])).toThrow();
    expect(() => scoreAnswers([3, 0, 0, 0, 0, 0, 0, 0, 0, 0])).toThrow(); // Q1 has no 4th option
  });
});

describe("dimensions", () => {
  it("calculates each dimension from its questions", () => {
    const { result } = generateResult(answers(SCENARIOS.strongStrategyWeakConsistency));
    const by = Object.fromEntries(result.dimensions.map((d) => [d.id, d.percent]));
    expect(by.strategy).toBe(100); // 10+10+10 of 30
    expect(by.consistency).toBe(40); // 4+4+4 of 30 → 40%
    expect(by.audience).toBe(80); // 8+8+8 of 30 → 80%
    expect(by.impact).toBe(80); // Q8 = 8/10
  });
});

describe("result levels", () => {
  it("maps totals to the four levels", () => {
    const level = (pts: number[]) => generateResult(answers(pts)).result.level.id;
    expect(level(SCENARIOS.allFirst)).toBe("strong");
    expect(level(SCENARIOS.allLast)).toBe("reactive");
    expect(level(SCENARIOS.mixedMid)).toBe("active"); // 68
  });
});

describe("diagnosis engine", () => {
  const results = Object.fromEntries(
    Object.entries(SCENARIOS).map(([k, v]) => [k, generateResult(answers(v)).result]),
  );

  it("is deterministic", () => {
    const a = generateResult(answers(SCENARIOS.mixedMid)).result;
    const b = generateResult(answers(SCENARIOS.mixedMid)).result;
    expect(a).toEqual(b);
  });

  it("returns 1–3 strengths and weaknesses and exactly 3 recommendations", () => {
    for (const r of Object.values(results)) {
      expect(r.strengths.length).toBeGreaterThanOrEqual(1);
      expect(r.strengths.length).toBeLessThanOrEqual(3);
      expect(r.weaknesses.length).toBeGreaterThanOrEqual(1);
      expect(r.weaknesses.length).toBeLessThanOrEqual(3);
      expect(r.recommendations).toHaveLength(3);
    }
  });

  it("gives every scenario a different diagnosis body and recommendation set", () => {
    const bodies = new Set(Object.values(results).map((r) => r.diagnosis.slice(1).join("|")));
    expect(bodies.size).toBe(Object.keys(SCENARIOS).length);
    const recs = new Set(Object.values(results).map((r) => r.recommendations.map((x) => x.title).join("|")));
    expect(recs.size).toBeGreaterThanOrEqual(6);
  });

  it("speaks to the specific pattern in each scenario", () => {
    const text = (k: string) => results[k].diagnosis.join(" ");
    expect(text("strongStrategyWeakConsistency")).toMatch(/simpler content system|repeatable content themes/);
    expect(text("weakStrategyStrongConsistency")).toMatch(/defined purpose|clear objective|reason/);
    expect(text("engagedButNoImpact")).toMatch(/genuine interaction/);
    expect(text("contentStrongAudienceWeak")).toMatch(/audience actually needs|instinct/);
    expect(text("weakContentSystemReasonableStrategy")).toMatch(/too much effort|simpler content system/);
    expect(text("allLast")).toMatch(/broadcasting|too much effort/);
    expect(text("allFirst")).toMatch(/no obvious weak spot/);
  });

  it("does not use banned labels or cliches", () => {
    const banned = /\b(bad|poor|failing|terrible|unhealthy|unlock|skyrocket|dominate|level up|crushing|game changer|supercharge)\b/i;
    for (const r of Object.values(results)) {
      const all = [...r.diagnosis, ...r.strengths, ...r.weaknesses, ...r.recommendations.map((x) => x.body + x.title)].join(" ");
      expect(all).not.toMatch(banned);
    }
  });

  it("prints a summary for review", () => {
    for (const [k, r] of Object.entries(results)) {
      console.log(
        `${k.padEnd(38)} ${String(r.totalScore).padStart(3)}  ${r.level.label}  | +${r.strongest} −${r.weakest} | ${r.recommendations.map((x) => x.title).join(" / ")}`,
      );
    }
  });
});
