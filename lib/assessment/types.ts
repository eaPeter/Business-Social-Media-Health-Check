export type DimensionId = "strategy" | "consistency" | "audience" | "impact";

export interface QuestionOption {
  label: string;
  points: number;
}

export interface Question {
  id: number; // 1-based, matches the q1…q10 database columns
  text: string;
  options: QuestionOption[];
}

export interface Dimension {
  id: DimensionId;
  label: string;
  questionIds: number[];
}

export type DimensionBand = "Strong" | "Solid" | "Developing" | "Emerging";

export interface DimensionScore {
  id: DimensionId;
  label: string;
  points: number;
  maxPoints: number;
  percent: number;
  band: DimensionBand;
}

export interface HealthLevel {
  id: "strong" | "good" | "active" | "reactive";
  label: string;
  min: number;
  max: number;
}

export interface AnsweredQuestion {
  id: number;
  question: string;
  optionIndex: number;
  answer: string;
  points: number;
}

export interface Recommendation {
  title: string;
  body: string;
}

export interface AssessmentResult {
  totalScore: number;
  percentage: number;
  level: HealthLevel;
  dimensions: DimensionScore[];
  strongest: DimensionId;
  weakest: DimensionId;
  diagnosis: string[];
  strengths: string[];
  weaknesses: string[];
  recommendations: Recommendation[];
}
