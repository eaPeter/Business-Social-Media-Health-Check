import { NextResponse } from "next/server";
import { currentAdmin } from "@/lib/admin";
import { csvHeader, csvRows } from "@/lib/csv";
import { serviceClient } from "@/lib/supabase/service";
import { applyFilters, parseFilters, type SubmissionRow } from "@/lib/submissions";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!(await currentAdmin())) return new NextResponse("Unauthorized", { status: 401 });

  const filters = parseFilters(Object.fromEntries(new URL(request.url).searchParams));
  const db = serviceClient();
  const batch = 1000;
  let out = "﻿" + csvHeader(); // BOM so Excel reads UTF-8 correctly

  for (let from = 0; ; from += batch) {
    const { data, error } = await applyFilters(db.from("assessment_submissions").select("*"), filters).range(from, from + batch - 1);
    if (error) return new NextResponse("Export failed", { status: 500 });
    const rows = (data ?? []) as unknown as SubmissionRow[];
    out += csvRows(rows);
    if (rows.length < batch) break;
  }

  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(out, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="health-check-submissions-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
