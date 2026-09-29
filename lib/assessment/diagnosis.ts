import { DIMENSIONS } from "./questions";
import {
  MAX_SCORE,
  dimensionScores,
  extremeDimensions,
  levelFor,
  pointsMap,
  scoreAnswers,
} from "./scoring";
import type {
  AnsweredQuestion,
  AssessmentResult,
  DimensionId,
  DimensionScore,
  HealthLevel,
  Recommendation,
} from "./types";

/* -------------------------------------------------------------------------- */
/*  Everything below is plain data + small rules. Edit the copy freely.        */
/*  Points per answer are 10 / 8 / 6 / 4 (Q1 has no 4).                        */
/* -------------------------------------------------------------------------- */

const LEVEL_INTRO: Record<HealthLevel["id"], string> = {
  strong:
    "You’re not starting from scratch. Your answers suggest that your business already has many of the foundations needed for social media to work effectively. You appear to have a good sense of why you’re showing up, who you’re speaking to and how social media fits into the wider business. The opportunity now is less about doing more and more about making what you already do more intentional, measurable and repeatable.",
  good:
    "There’s a lot here to build on. Your answers suggest that you understand the importance of social media and already have some of the right pieces in place. The challenge is that those pieces may not yet be working together consistently. Your biggest opportunity is turning good intentions and occasional wins into a simpler, repeatable system that supports clear business goals.",
  active:
    "Your business is showing up, but social media may be taking more energy than it should. Your answers suggest that some of your activity is happening without a clear enough strategy, system or connection to a business outcome. That often leads to inconsistent posting, content fatigue and the feeling that social media requires a lot of effort without producing enough in return. The problem is more likely the system than the amount you post, so posting more is unlikely to be the answer.",
  reactive:
    "Right now, social media appears to be something your business feels it should be doing rather than a system that is actively working for the business. Your answers suggest that the biggest opportunity isn’t simply creating more posts. It is creating clarity first: what social media is supposed to achieve, who you need to reach, what those people care about and what kind of content you can realistically sustain.",
};

type P = Record<number, number>;
interface Ctx {
  p: P;
  d: Record<DimensionId, number>;
  level: HealthLevel;
}

interface PatternRule {
  id: string;
  group: string; // only one rule per group is used
  priority: number; // higher is considered first
  when: (c: Ctx) => boolean;
  text: string;
}

const PATTERNS: PatternRule[] = [
  {
    id: "no-obvious-gap",
    group: "overall",
    priority: 95,
    when: ({ p }) => Object.values(p).every((v) => v >= 8),
    text: "There’s no obvious weak spot in your answers. The opportunity is refinement: tightening how you measure results, understanding your audience more deeply and making what already works easier to repeat.",
  },
  {
    id: "consistent-not-purposeful",
    group: "purpose",
    priority: 90,
    when: ({ d }) => d.consistency >= 80 && d.strategy <= 70,
    text: "You’re showing up consistently, which is valuable, but your answers suggest that the activity may not always be connected to a clear objective. Your biggest opportunity isn’t necessarily posting more. It’s making sure each piece of content has a defined purpose.",
  },
  {
    id: "strategy-without-execution",
    group: "content",
    priority: 88,
    when: ({ p, d }) => d.strategy >= 78 && p[4] + p[5] <= 14,
    text: "The strategy isn’t necessarily your biggest problem. You seem to have a reasonable idea of what social media should achieve, but turning that into regular content appears to be creating friction. A simpler content system could make a significant difference.",
  },
  {
    id: "engaged-not-converting",
    group: "impact",
    priority: 86,
    when: ({ p, d }) => d.audience >= 80 && p[8] <= 6,
    text: "You appear to have built genuine interaction with your audience, which is a strong asset. However, that attention may not yet be moving people toward meaningful business actions. The next step is creating clearer pathways between engagement and business outcomes.",
  },
  {
    id: "content-easy-audience-unclear",
    group: "audience-insight",
    priority: 84,
    when: ({ p }) => p[4] + p[5] >= 18 && p[7] <= 6,
    text: "Creating content doesn’t seem to be the biggest obstacle. The bigger question is whether the content is grounded strongly enough in what your audience actually needs, wants or cares about.",
  },
  {
    id: "broadcasting",
    group: "community",
    priority: 82,
    when: ({ p }) => p[7] <= 6 && p[9] <= 6 && p[10] <= 6,
    text: "Your social channels currently appear to function more like a broadcasting platform than an active community. Building stronger two-way interaction should be an important next step.",
  },
  {
    id: "content-effort",
    group: "content",
    priority: 80,
    when: ({ p }) => p[4] <= 6 && p[5] <= 6,
    text: "Content creation currently appears to require too much effort. Rather than constantly searching for new ideas, your business would benefit from a simpler set of repeatable content themes and formats.",
  },
  {
    id: "ideas-not-rhythm",
    group: "rhythm",
    priority: 78,
    when: ({ p }) => p[2] <= 6 && p[4] >= 8,
    text: "You don’t appear to have a shortage of ideas. The bigger issue seems to be turning those ideas into a consistent publishing rhythm.",
  },
  {
    id: "goal-undefined",
    group: "purpose",
    priority: 74,
    when: ({ p }) => p[1] <= 6 && p[6] <= 6,
    text: "It appears social media is currently something you feel you should be doing more than something with a defined job. Deciding what it is for is likely to make every later decision, from what to post to how often, easier.",
  },
  {
    id: "posting-without-why",
    group: "purpose",
    priority: 72,
    when: ({ p }) => p[6] <= 4 && p[2] >= 8,
    text: "You’re posting regularly, but it seems many posts go out because something needs to be posted rather than for a reason. The effort is clearly there. Giving it a purpose appears to be the missing piece.",
  },
  {
    id: "active-not-missed",
    group: "community",
    priority: 70,
    when: ({ p }) => p[10] <= 4 && p[2] >= 8,
    text: "You’re posting fairly regularly, yet you suspect customers might not notice if you stopped. That often means content is being published without yet becoming part of how customers experience your business.",
  },
  {
    id: "unsure-of-fit",
    group: "purpose",
    priority: 68,
    when: ({ p }) => p[3] <= 6 && p[1] >= 8,
    text: "You have a sense of what you want from social media, but you’re less sure your approach suits your customers. That’s worth settling before you invest more time, because it’s easy to work hard on the wrong things.",
  },
  {
    id: "impact-gap",
    group: "impact",
    priority: 66,
    when: ({ p }) => p[8] <= 6,
    text: "There is a gap between social-media activity and measurable business outcomes. A clearer journey from content to interest to action would make your social presence more commercially useful.",
  },
  {
    id: "guessing-audience",
    group: "audience-insight",
    priority: 60,
    when: ({ p }) => p[7] <= 4,
    text: "You may be working largely from instinct when it comes to your audience. A few simple listening habits, such as noting common customer questions and the posts that get replies, could sharpen what you create.",
  },
  {
    id: "rhythm-first",
    group: "rhythm",
    priority: 58,
    when: ({ p }) => p[2] <= 4,
    text: "Posting itself appears to be the first thing to steady. Without a regular presence, even good content struggles to be noticed or remembered, so a modest, sustainable rhythm may matter more than anything else right now.",
  },
  {
    id: "connected-and-converting",
    group: "impact",
    priority: 50,
    when: ({ p }) => p[9] >= 8 && p[10] >= 8 && p[8] >= 8,
    text: "Your answers suggest you’ve built a real connection with your audience and that it is contributing to business goals. That combination is uncommon and worth protecting as you grow.",
  },
  {
    id: "evenly-matched",
    group: "overall",
    priority: 40,
    when: ({ d }) => Math.max(...Object.values(d)) - Math.min(...Object.values(d)) <= 10,
    text: "No single area stands far out from the others, which suggests the pieces need to work together better rather than one thing needing to be fixed. A simple, consistent system usually helps most in this situation.",
  },
];

const WEAKEST_FALLBACK: Record<DimensionId, string> = {
  strategy:
    "The clearest opportunity appears to be strategy: being specific about what social media is for and how each post supports it.",
  consistency:
    "The clearest opportunity appears to be the content system: making it easier to decide what to post and to keep posting.",
  audience:
    "The clearest opportunity appears to be your audience: understanding them better and building more two-way interaction.",
  impact:
    "The clearest opportunity appears to be business impact: connecting what you post to something people can act on.",
};

const WEAKEST_WHY: Record<DimensionId, string> = {
  strategy: "Getting clearer here would likely make every other decision easier.",
  consistency: "Simplifying this would likely make it far easier to keep showing up.",
  audience: "Strengthening this would likely help your content land with the people you want to reach.",
  impact: "Closing this gap would likely make the effort easier to justify.",
};

/** Short observations per question and answer score. */
const STRENGTHS: Record<number, Partial<Record<number, string>>> = {
  1: {
    10: "You can say clearly what social media is meant to do for the business, which makes every other decision easier.",
    8: "You appear to have a sense of what you want social media to achieve, even if it isn’t fully defined yet.",
  },
  2: {
    10: "You show up on a schedule, which builds familiarity and trust over time.",
    8: "You do post when you have something to say, which is a base a steady rhythm can be built on.",
  },
  3: {
    10: "You feel confident that your approach fits your business and your customers.",
    8: "You feel reasonably confident that your approach suits your business and customers.",
  },
  4: {
    10: "Coming up with content ideas comes easily to you, which is a real advantage.",
    8: "Ideas do come to you some of the time, so you’re not starting from nothing.",
  },
  5: {
    10: "You have a content process that feels simple and works for you.",
    8: "Creating content feels manageable for you most of the time.",
  },
  6: {
    10: "You almost always know why you’re posting, so your content is more likely to serve a purpose.",
    8: "Most of your posts appear to have a reason behind them.",
  },
  7: {
    10: "You understand what your audience wants to see and talk about, which helps your content land.",
    8: "You have a fairly good read on what your audience cares about.",
  },
  8: {
    10: "Social media regularly moves people toward a business goal, which is the step many businesses miss.",
    8: "Social media sometimes moves people toward a business goal, so a path from attention to action already exists.",
  },
  9: {
    10: "You have real two-way interaction with the people who follow you.",
    8: "You feel somewhat connected to your followers, which gives you something to build on.",
  },
  10: {
    10: "Your customers would definitely notice if you stopped posting, a sign of a genuine community.",
    8: "Your customers would probably notice if you stopped, which suggests your content has some value to them.",
  },
};

const GAPS: Record<number, Partial<Record<number, string>>> = {
  1: {
    8: "The goal for social media seems only partly defined, which can make it hard to judge what is worth posting.",
    6: "Social media may be something you feel you should do rather than something with a defined job.",
  },
  2: {
    8: "Posting depends on when there is something to share, so your presence may feel uneven to followers.",
    6: "Posting appears very inconsistent, which makes it harder for people to remember you or expect to hear from you.",
    4: "You barely post at the moment, so social media has had little chance to work for the business yet.",
  },
  3: {
    8: "Your confidence that the strategy fits your customers is moderate, which may be worth testing.",
    6: "You’re not very confident that your approach fits your business and customers, which is worth checking before doing more.",
    4: "There isn’t a clear strategy behind your social media yet, so decisions may be made one post at a time.",
  },
  4: {
    8: "Ideas arrive in bursts rather than reliably, which can leave gaps when you’re busy.",
    6: "Finding things to post is usually a struggle, which tends to make posting feel like a chore.",
    4: "Often having no idea what to post usually points to a missing set of go-to topics rather than a lack of ability.",
  },
  5: {
    8: "Content creation is manageable but sometimes overwhelming, so the process may need trimming.",
    6: "Creating content feels more complicated than it needs to be, which is likely draining time and energy.",
    4: "Content creation is complicated enough to stop you posting, which suggests the process, not motivation, is the barrier.",
  },
  6: {
    8: "A few posts may still go out without a clear purpose.",
    6: "You only sometimes know why you’re posting, so some content may not be pulling its weight.",
    4: "Many posts seem to go out because something has to be posted rather than for a reason.",
  },
  7: {
    8: "Your read on your audience is fairly good but may rest on impressions rather than evidence.",
    6: "You have only some idea of what your audience wants, so content may be based partly on assumption.",
    4: "You’re mostly guessing what your audience wants, which makes it hard to know whether content is hitting the mark.",
  },
  8: {
    8: "Social media only sometimes leads to business action, so the path from content to customer may be uneven.",
    6: "Social media rarely moves people toward a business goal, so attention may not be turning into results.",
    4: "There may be a gap between your activity and your outcomes, since it isn’t yet clear how to move people toward a business goal.",
  },
  9: {
    8: "You feel somewhat connected, but interaction may be limited to a small group of followers.",
    6: "You don’t feel very connected to your followers, so your channels may feel one-directional.",
    4: "Your channels mostly broadcast with little interaction, so followers may see you as a source of posts rather than a community.",
  },
  10: {
    8: "Customers might notice a gap if you stopped, but perhaps not strongly.",
    6: "Customers may not notice a 30-day break, which suggests content isn’t yet an essential part of their experience.",
    4: "You suspect customers wouldn’t notice a break, an honest signal that content isn’t yet central to how they experience you.",
  },
};

interface RecModule extends Recommendation {
  id: string;
  dimension: DimensionId;
  /** question id → weight applied to (10 − points) */
  weights: Record<number, number>;
  /** baseline need added at a given level, so high scorers still get useful next steps */
  bonus?: Partial<Record<HealthLevel["id"], number>>;
}

const RECOMMENDATIONS: RecModule[] = [
  {
    id: "purpose",
    dimension: "strategy",
    title: "Clarify the job of social media",
    body: "Define the one or two most important outcomes your business needs social media to support. When the goal is clear, deciding what to post gets much easier.",
    weights: { 1: 2, 3: 1, 6: 1 },
  },
  {
    id: "why",
    dimension: "strategy",
    title: "Give every post a job",
    body: "Before publishing, decide whether a post is there to build trust, start a conversation, teach something or prompt an enquiry. One clear purpose per post is enough.",
    weights: { 6: 2.2 },
  },
  {
    id: "fit",
    dimension: "strategy",
    title: "Check the strategy against your customers",
    body: "Look back over your last 20 posts and note which ones led to a message, an enquiry or a sale. That shows which topics and formats suit your customers, and which are habit.",
    weights: { 3: 2.2, 8: 0.5 },
  },
  {
    id: "rhythm",
    dimension: "consistency",
    title: "Set a rhythm you can keep",
    body: "Choose a posting frequency that fits your week, even if it is modest, and protect it. A steady rhythm you can sustain beats occasional bursts of effort.",
    weights: { 2: 2.4 },
  },
  {
    id: "themes",
    dimension: "consistency",
    title: "Build repeatable content themes",
    body: "Instead of starting from a blank page every week, develop three to five themes you can return to, such as customer questions, behind the scenes, results and offers.",
    weights: { 4: 2, 5: 1 },
  },
  {
    id: "simplify",
    dimension: "consistency",
    title: "Simplify how content gets made",
    body: "Plan in one sitting and create several posts in one or two formats you find easy. A smaller process you follow will outperform an ambitious one you abandon.",
    weights: { 5: 2.2, 2: 0.4 },
  },
  {
    id: "listen",
    dimension: "audience",
    title: "Learn what your audience actually wants",
    body: "Collect the questions customers ask, the comments that get replies and the posts that get saved or shared. Let those patterns shape what you make next.",
    weights: { 7: 2.2 },
  },
  {
    id: "converse",
    dimension: "audience",
    title: "Start conversations, not just posts",
    body: "Ask real questions, reply promptly and engage with the people who comment. Two-way interaction is what turns followers into a community.",
    weights: { 9: 2, 10: 1.6 },
  },
  {
    id: "action",
    dimension: "impact",
    title: "Turn attention into action",
    body: "Make it clear what you want someone to do after engaging with your content, and make that step easy: a message, a link or a booking. Then keep an eye on how often it happens.",
    weights: { 8: 2.6 },
  },
  {
    id: "measure",
    dimension: "impact",
    title: "Track what moves people to act",
    body: "Pick one or two measures beyond likes, such as enquiries, clicks or bookings that start on social, and review them monthly to see what is really working.",
    weights: {},
    bonus: { strong: 3, good: 0.5 },
  },
  {
    id: "system",
    dimension: "consistency",
    title: "Write down what already works",
    body: "Note the formats, themes and routines behind your best content so the system is repeatable and could be handed to someone else.",
    weights: {},
    bonus: { strong: 2.5, good: 1.5 },
  },
  {
    id: "deepen",
    dimension: "audience",
    title: "Go deeper on your audience",
    body: "Ask your best customers what made them follow you and what they wish you posted more of. Direct answers are worth more than any analytics screen.",
    weights: {},
    bonus: { strong: 2 },
  },
];

/* -------------------------------------------------------------------------- */
/*  Rule engine                                                                */
/* -------------------------------------------------------------------------- */

function pickPatterns(ctx: Ctx, limit = 2): string[] {
  const used = new Set<string>();
  const out: string[] = [];
  for (const rule of [...PATTERNS].sort((a, b) => b.priority - a.priority)) {
    if (out.length >= limit) break;
    if (used.has(rule.group) || !rule.when(ctx)) continue;
    used.add(rule.group);
    out.push(rule.text);
  }
  return out;
}

function questionDimension(id: number): DimensionId {
  return DIMENSIONS.find((d) => d.questionIds.includes(id))!.id;
}

function buildWeaknesses(p: P): { text: string; ids: number[] }[] {
  const ranked = Object.keys(p)
    .map(Number)
    .sort((a, b) => p[a] - p[b] || a - b);
  const pick = (candidates: number[], max: number) => {
    const perDim: Partial<Record<DimensionId, number>> = {};
    const chosen: number[] = [];
    for (const id of candidates) {
      const dim = questionDimension(id);
      if ((perDim[dim] ?? 0) >= 2) continue;
      perDim[dim] = (perDim[dim] ?? 0) + 1;
      chosen.push(id);
      if (chosen.length === max) break;
    }
    return chosen;
  };
  let ids = pick(ranked.filter((id) => p[id] <= 6), 3);
  if (ids.length === 0) ids = pick(ranked.filter((id) => p[id] === 8), 2);
  if (ids.length === 0) {
    return [
      {
        text: "Nothing in your answers stands out as a gap. What could still hold you back is complacency: the habits that work today need measuring and refreshing as your audience changes.",
        ids: [],
      },
    ];
  }
  return ids.map((id) => ({ text: GAPS[id][p[id]] as string, ids: [id] }));
}

function buildStrengths(p: P, excluded: number[]): string[] {
  const ranked = Object.keys(p)
    .map(Number)
    .filter((id) => p[id] >= 8 && !excluded.includes(id))
    .sort((a, b) => p[b] - p[a] || a - b);
  const perDim: Partial<Record<DimensionId, number>> = {};
  const out: string[] = [];
  for (const id of ranked) {
    const dim = questionDimension(id);
    if ((perDim[dim] ?? 0) >= 2) continue;
    perDim[dim] = (perDim[dim] ?? 0) + 1;
    out.push(STRENGTHS[id][p[id]] as string);
    if (out.length === 3) break;
  }
  if (out.length === 0) {
    out.push(
      "You’ve been candid about where things stand, which makes it much easier to decide what to fix first.",
    );
    const best = Object.keys(p)
      .map(Number)
      .sort((a, b) => p[b] - p[a] || a - b)[0];
    if (p[best] === 6 && best === 2) {
      out.push("Some content is already going out, so there is something to build a rhythm around.");
    }
  }
  return out;
}

function pickRecommendations(p: P, level: HealthLevel): Recommendation[] {
  const scored = RECOMMENDATIONS.map((m, order) => {
    const need =
      Object.entries(m.weights).reduce((s, [q, w]) => s + w * (10 - p[Number(q)]), 0) +
      (m.bonus?.[level.id] ?? 0);
    return { m, order, need };
  }).sort((a, b) => b.need - a.need || a.order - b.order);

  const perDim: Partial<Record<DimensionId, number>> = {};
  const out: Recommendation[] = [];
  for (const { m } of scored) {
    if ((perDim[m.dimension] ?? 0) >= 2) continue;
    perDim[m.dimension] = (perDim[m.dimension] ?? 0) + 1;
    out.push({ title: m.title, body: m.body });
    if (out.length === 3) break;
  }
  return out;
}

function dimensionParagraph(dims: DimensionScore[], strongest: DimensionId, weakest: DimensionId): string {
  const by = (id: DimensionId) => dims.find((d) => d.id === id)!;
  const spread = by(strongest).percent - by(weakest).percent;
  if (spread < 15) {
    return "Your four areas are fairly evenly matched, so improvement is likely to come from tightening the whole system rather than fixing one thing.";
  }
  return `Across the four areas, ${by(strongest).label} appears to be your strongest, while ${by(weakest).label} is where the clearest opportunity sits. ${WEAKEST_WHY[weakest]}`;
}

/** Builds the full result from scored answers. Deterministic: same answers, same output. */
export function buildResult(answered: AnsweredQuestion[]): AssessmentResult {
  const p = pointsMap(answered);
  const total = answered.reduce((s, a) => s + a.points, 0);
  const level = levelFor(total);
  const dimensions = dimensionScores(p);
  const { strongest, weakest } = extremeDimensions(dimensions, p);
  const d = Object.fromEntries(dimensions.map((x) => [x.id, x.percent])) as Record<DimensionId, number>;
  const ctx: Ctx = { p, d, level };

  const patterns = pickPatterns(ctx);
  const diagnosis = [
    LEVEL_INTRO[level.id],
    patterns.length ? patterns.join(" ") : WEAKEST_FALLBACK[weakest],
    dimensionParagraph(dimensions, strongest, weakest),
  ];

  const weak = buildWeaknesses(p);
  return {
    totalScore: total,
    percentage: Math.round((total / MAX_SCORE) * 100),
    level,
    dimensions,
    strongest,
    weakest,
    diagnosis,
    strengths: buildStrengths(p, weak.flatMap((w) => w.ids)),
    weaknesses: weak.map((w) => w.text),
    recommendations: pickRecommendations(p, level),
  };
}

/** Convenience: option indexes (one per question) → complete result plus per-question detail. */
export function generateResult(optionIndexes: number[]) {
  const scored = scoreAnswers(optionIndexes);
  return { ...scored, result: buildResult(scored.answered) };
}
