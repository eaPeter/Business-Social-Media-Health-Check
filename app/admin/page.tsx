import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { HEALTH_LEVELS } from "@/lib/assessment/scoring";
import { serviceClient } from "@/lib/supabase/service";
import {
  PAGE_SIZE,
  applyFilters,
  filtersToQuery,
  formatDay,
  parseFilters,
  type SubmissionRow,
} from "@/lib/submissions";

const COLUMNS =
  "id, created_at, name, email, business_name, phone, total_score, health_level, strongest_dimension, weakest_dimension";

interface Stats {
  total: number;
  average: number;
  this_month: number;
  strong: number;
  good: number;
  active: number;
  reactive: number;
}

export default async function AdminPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin();
  const f = parseFilters(await searchParams);
  const db = serviceClient();
  const from = (f.page - 1) * PAGE_SIZE;

  const [statsRes, listRes] = await Promise.all([
    db.rpc("assessment_stats"),
    applyFilters(db.from("assessment_submissions").select(COLUMNS, { count: "exact" }), f).range(from, from + PAGE_SIZE - 1),
  ]);

  if (statsRes.error || listRes.error) {
    return (
      <div className="card p-8">
        <h1 className="serif text-[28px]">Couldn’t load submissions</h1>
        <p className="mt-2 text-body">
          Check that the database schema in <code>supabase/schema.sql</code> has been applied and your environment
          variables are set.
        </p>
      </div>
    );
  }

  const stats = statsRes.data as Stats;
  const rows = (listRes.data ?? []) as unknown as SubmissionRow[];
  const count = listRes.count ?? 0;
  const pages = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const exportHref = `/admin/export?${filtersToQuery(f)}`;
  const filtered = !!(f.q || f.range !== "all" || f.from || f.to);

  const distribution = HEALTH_LEVELS.map((l) => ({
    label: `${l.max === 100 ? "86–100" : `${l.id === "reactive" ? 42 : l.min}–${l.max}`}`,
    name: l.label,
    count: stats[l.id],
  }));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="serif text-[36px] leading-none">Submissions</h1>
        <a href={exportHref} className="btn btn-secondary" download>
          Export CSV{filtered ? " (filtered)" : ""}
        </a>
      </div>

      <section aria-label="Summary" className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total submissions", value: stats.total },
          { label: "Average score", value: stats.total ? Number(stats.average).toFixed(1) : "–" },
          { label: "This month", value: stats.this_month },
        ].map((s) => (
          <div key={s.label} className="card p-6">
            <div className="text-[13px] font-medium text-muted">{s.label}</div>
            <div className="serif mt-2 text-[44px] leading-none text-brand">{s.value}</div>
          </div>
        ))}
      </section>

      <section aria-labelledby="dist" className="card p-6">
        <h2 id="dist" className="text-[16px] font-semibold">Score distribution</h2>
        <ul className="mt-5 space-y-3">
          {distribution.map((d) => (
            <li key={d.name} className="grid grid-cols-[92px_1fr_40px] items-center gap-3 text-[14px] sm:grid-cols-[92px_260px_1fr_40px]">
              <span className="text-muted">{d.label}</span>
              <span className="hidden sm:block">{d.name}</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${stats.total ? (d.count / stats.total) * 100 : 0}%` }} />
              </div>
              <span className="text-right font-medium">{d.count}</span>
            </li>
          ))}
        </ul>
      </section>

      <form method="get" className="card grid gap-4 p-6 md:grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] md:items-end" role="search" aria-label="Filter submissions">
        <div>
          <label htmlFor="q" className="field-label">Search name, business or email</label>
          <input id="q" name="q" defaultValue={f.q} className="field !h-12" placeholder="Search…" />
        </div>
        <div>
          <label htmlFor="range" className="field-label">Score range</label>
          <select id="range" name="range" defaultValue={f.range} className="field !h-12">
            <option value="all">All scores</option>
            {HEALTH_LEVELS.map((l) => (
              <option key={l.id} value={l.id}>
                {l.id === "reactive" ? "42" : l.min}–{l.max}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="from" className="field-label">From</label>
          <input id="from" name="from" type="date" defaultValue={f.from} className="field !h-12" />
        </div>
        <div>
          <label htmlFor="to" className="field-label">To</label>
          <input id="to" name="to" type="date" defaultValue={f.to} className="field !h-12" />
        </div>
        <div>
          <label htmlFor="sort" className="field-label">Sort</label>
          <select id="sort" name="sort" defaultValue={f.sort} className="field !h-12">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button type="submit" className="btn btn-primary !min-h-12">Apply</button>
          {filtered || f.sort !== "newest" ? (
            <Link href="/admin" className="btn btn-secondary !min-h-12">Reset</Link>
          ) : null}
        </div>
      </form>

      <section aria-label="Responses" className="card overflow-hidden">
        {rows.length === 0 ? (
          <p className="p-10 text-center text-muted">
            {filtered ? "No submissions match those filters." : "No submissions yet. They’ll appear here as people complete the health check."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-[14px]">
              <thead className="border-b border-hairline text-[12px] uppercase tracking-wide text-muted">
                <tr>
                  {["Date", "Name", "Business", "Email", "Phone", "Score", "Health level", "Strongest area", "Weakest area"].map((h) => (
                    <th key={h} scope="col" className="whitespace-nowrap px-4 py-3 font-semibold">{h}</th>
                  ))}
                  <th scope="col" className="px-4 py-3"><span className="sr-only">View</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-hairline-soft last:border-0 hover:bg-surface">
                    <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDay(r.created_at)}</td>
                    <td className="px-4 py-3 font-medium">{r.name}</td>
                    <td className="px-4 py-3">{r.business_name}</td>
                    <td className="px-4 py-3">{r.email}</td>
                    <td className="whitespace-nowrap px-4 py-3">{r.phone}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-brand-soft px-2.5 py-1 font-semibold text-brand">{r.total_score}</span>
                    </td>
                    <td className="px-4 py-3">{r.health_level}</td>
                    <td className="px-4 py-3">{r.strongest_dimension}</td>
                    <td className="px-4 py-3">{r.weakest_dimension}</td>
                    <td className="px-4 py-3 text-right">
                      <Link href={`/admin/${r.id}`} className="font-semibold text-brand underline-offset-2 hover:underline">
                        View<span className="sr-only"> {r.name}</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {pages > 1 ? (
        <nav aria-label="Pagination" className="flex items-center justify-between text-[14px]">
          <span className="text-muted">
            Page {f.page} of {pages} · {count} result{count === 1 ? "" : "s"}
          </span>
          <div className="flex gap-2">
            {f.page > 1 ? (
              <Link className="btn btn-secondary !min-h-10 !py-2" href={`/admin?${filtersToQuery(f, { page: f.page - 1 })}`}>Previous</Link>
            ) : null}
            {f.page < pages ? (
              <Link className="btn btn-secondary !min-h-10 !py-2" href={`/admin?${filtersToQuery(f, { page: f.page + 1 })}`}>Next</Link>
            ) : null}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
