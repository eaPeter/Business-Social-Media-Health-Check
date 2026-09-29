import type { Dimension, Question } from "./types";

/**
 * Questions, answer options and points.
 * Options are listed best → weakest. Change wording or points here only;
 * scoring, the database mapping and the UI all read from this file.
 */
export const QUESTIONS: Question[] = [
  {
    id: 1,
    text: "If someone asked, “What is your business trying to achieve through social media?” how clearly could you answer?",
    options: [
      { label: "I have a clear goal", points: 10 },
      { label: "I have an idea, but it’s not clearly defined", points: 8 },
      { label: "Honestly, I just know I should be posting", points: 6 },
    ],
  },
  {
    id: 2,
    text: "How often does your business currently show up on social media?",
    options: [
      { label: "Consistently, according to a schedule", points: 10 },
      { label: "I post when I have something to post", points: 8 },
      { label: "Very inconsistently", points: 6 },
      { label: "I barely post", points: 4 },
    ],
  },
  {
    id: 3,
    text: "How confident are you that your social media strategy actually fits your type of business and customers?",
    options: [
      { label: "Very confident", points: 10 },
      { label: "Somewhat confident", points: 8 },
      { label: "Not very confident", points: 6 },
      { label: "I don't really have a strategy", points: 4 },
    ],
  },
  {
    id: 4,
    text: "When it’s time to create content, how easy is it for you to come up with things to post?",
    options: [
      { label: "Very easy", points: 10 },
      { label: "I have ideas sometimes", points: 8 },
      { label: "I usually struggle", points: 6 },
      { label: "I often have no idea what to post", points: 4 },
    ],
  },
  {
    id: 5,
    text: "How complicated does creating content for your business feel?",
    options: [
      { label: "Simple, I have a system that works for me", points: 10 },
      { label: "Manageable, but sometimes overwhelming", points: 8 },
      { label: "More complicated than it needs to be", points: 6 },
      { label: "So complicated that it stops me from posting", points: 4 },
    ],
  },
  {
    id: 6,
    text: "When you post on social media, how often do you know WHY you’re posting it?",
    options: [
      { label: "Almost every time", points: 10 },
      { label: "Most of the time", points: 8 },
      { label: "Sometimes", points: 6 },
      { label: "Honestly, I just need to post something", points: 4 },
    ],
  },
  {
    id: 7,
    text: "How well do you understand what your audience actually wants to see, hear, or talk about?",
    options: [
      { label: "Very well", points: 10 },
      { label: "Fairly well", points: 8 },
      { label: "I have some idea", points: 6 },
      { label: "I'm mostly guessing", points: 4 },
    ],
  },
  {
    id: 8,
    text: "Beyond likes and followers, how often does your social media help you move people toward a business goal?",
    options: [
      { label: "Regularly", points: 10 },
      { label: "Sometimes", points: 8 },
      { label: "Rarely", points: 6 },
      { label: "I don't really know how to do this", points: 4 },
    ],
  },
  {
    id: 9,
    text: "How connected do you feel to the people who follow your business online?",
    options: [
      { label: "Very connected, we actively interact", points: 10 },
      { label: "Somewhat connected", points: 8 },
      { label: "Not very connected", points: 6 },
      { label: "I mostly broadcast; we don't really interact", points: 4 },
    ],
  },
  {
    id: 10,
    text: "If you stopped posting for the next 30 days, would your customers notice your absence?",
    options: [
      { label: "Definitely, we have an active community", points: 10 },
      { label: "Probably", points: 8 },
      { label: "Maybe not", points: 6 },
      { label: "Honestly, probably not", points: 4 },
    ],
  },
];

export const QUESTION_COUNT = QUESTIONS.length;

/** Which questions feed which dimension. */
export const DIMENSIONS: Dimension[] = [
  { id: "strategy", label: "Strategy & Purpose", questionIds: [1, 3, 6] },
  { id: "consistency", label: "Consistency & Content System", questionIds: [2, 4, 5] },
  { id: "audience", label: "Audience & Community", questionIds: [7, 9, 10] },
  { id: "impact", label: "Business Impact", questionIds: [8] },
];

export function getQuestion(id: number): Question {
  const q = QUESTIONS.find((item) => item.id === id);
  if (!q) throw new Error(`Unknown question ${id}`);
  return q;
}

export function maxPointsFor(questionId: number): number {
  return Math.max(...getQuestion(questionId).options.map((o) => o.points));
}
