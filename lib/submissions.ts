import "server-only";
import { HEALTH_LEVELS } from "./assessment/scoring";

export interface SubmissionRow {
  id: string;
  created_at: string;
  name: string;
  email: string;
  business_name: string;
  phone: string;
  total_score: number;
  percentage_score: number;
  health_level: string;
  strategy_score: number;
  consistency_score: number;
  audience_score: number;
  business_impact_score: number;
  strongest_dimension: string;
  weakest_dimension: string;
  generated_diagnosis: string;
  generated_strengths: string[];
  generated_weaknesses: string[];
  generated_recommendations: { title: string; body: string }[];
  [key: string]: unknown; // q1_answer … q10_score
}

export interface Filters {
  q: string;
  range: "all" | "strong" | "good" | "active" | "reactive";
  from: string;
  to: string;
  sort: "newest" | "oldest";
  page: number;
}

export const PAGE_SIZE = 25;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

type Params = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export function parseFilters(params: Params): Filters {
  const range = one(params.range);
  const from = one(params.from);
  const to = one(params.to);
  return {
    // Characters that have meaning inside PostgREST filter strings are removed.
    q: one(params.q).replace(/[,()%*\\"'`]/g, " ").replace(/\s+/g, " ").trim().slice(0, 100),
    range: (["strong", "good", "active", "reactive"] as const).find((r) => r === range) ?? "all",
    from: DATE.test(from) ? from : "",
    to: DATE.test(to) ? to : "",
    sort: one(params.sort) === "oldest" ? "oldest" : "newest",
    page: Math.max(1, parseInt(one(params.page), 10) || 1),
  };
}

export function filtersToQuery(f: Filters, extra: Record<string, string | number> = {}): string {
  const sp = new URLSearchParams();
  if (f.q) sp.set("q", f.q);
  if (f.range !== "all") sp.set("range", f.range);
  if (f.from) sp.set("from", f.from);
  if (f.to) sp.set("to", f.to);
  if (f.sort !== "newest") sp.set("sort", f.sort);
  for (const [k, v] of Object.entries(extra)) sp.set(k, String(v));
  return sp.toString();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyFilters<T extends { or: any; gte: any; lte: any; order: any }>(query: T, f: Filters): T {
  let qb = query;
  if (f.q) {
    const term = `%${f.q}%`;
    qb = qb.or(`name.ilike.${term},business_name.ilike.${term},email.ilike.${term}`);
  }
  if (f.range !== "all") {
    const level = HEALTH_LEVELS.find((l) => l.id === f.range)!;
    qb = qb.gte("total_score", level.min).lte("total_score", level.max);
  }
  if (f.from) qb = qb.gte("created_at", `${f.from}T00:00:00.000Z`);
  if (f.to) qb = qb.lte("created_at", `${f.to}T23:59:59.999Z`);
  return qb.order("created_at", { ascending: f.sort === "oldest" }).order("id");
}

export const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(iso)) + " UTC";

export const formatDay = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeZone: "UTC" }).format(new Date(iso));
