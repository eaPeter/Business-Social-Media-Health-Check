import { NextResponse } from "next/server";
import { generateResult } from "@/lib/assessment/diagnosis";
import { submissionSchema } from "@/lib/assessment/validation";
import { serviceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const parsed = submissionSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] === "lead" ? String(issue.path[1]) : String(issue.path[0]);
      fieldErrors[key] ??= issue.message;
    }
    return NextResponse.json({ error: "Please check the highlighted details.", fieldErrors }, { status: 422 });
  }

  const { submissionKey, answers, lead, website } = parsed.data;

  // Scores are always recomputed here from option indexes. Nothing score-related is trusted from the browser.
  const { answered, total, percentage, result } = generateResult(answers);

  // Honeypot filled: pretend success without storing.
  if (website) return NextResponse.json({ result });

  const row: Record<string, unknown> = {
    submission_key: submissionKey,
    name: lead.name,
    email: lead.email,
    business_name: lead.businessName,
    phone: lead.phone,
    total_score: total,
    percentage_score: percentage,
    health_level: result.level.label,
    strategy_score: result.dimensions[0].percent,
    consistency_score: result.dimensions[1].percent,
    audience_score: result.dimensions[2].percent,
    business_impact_score: result.dimensions[3].percent,
    strongest_dimension: result.dimensions.find((d) => d.id === result.strongest)!.label,
    weakest_dimension: result.dimensions.find((d) => d.id === result.weakest)!.label,
    generated_diagnosis: result.diagnosis.join("\n\n"),
    generated_strengths: result.strengths,
    generated_weaknesses: result.weaknesses,
    generated_recommendations: result.recommendations,
  };
  for (const a of answered) {
    row[`q${a.id}_answer`] = a.answer;
    row[`q${a.id}_score`] = a.points;
  }

  try {
    const { error } = await serviceClient().from("assessment_submissions").insert(row);
    // 23505 = unique violation on submission_key: this exact assessment was already saved.
    if (error && error.code !== "23505") {
      console.error("Failed to save submission", error.message);
      return NextResponse.json({ error: "We couldn't save your results. Please try again." }, { status: 500 });
    }
  } catch (e) {
    console.error("Submission error", e);
    return NextResponse.json({ error: "We couldn't save your results. Please try again." }, { status: 503 });
  }

  return NextResponse.json({ result });
}
