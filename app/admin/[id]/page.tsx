import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { QUESTIONS } from "@/lib/assessment/questions";
import { serviceClient } from "@/lib/supabase/service";
import { formatDate, type SubmissionRow } from "@/lib/submissions";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function SubmissionPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const { data } = await serviceClient().from("assessment_submissions").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const r = data as SubmissionRow;

  const dims = [
    { label: "Strategy & Purpose", value: r.strategy_score },
    { label: "Consistency & Content System", value: r.consistency_score },
    { label: "Audience & Community", value: r.audience_score },
    { label: "Business Impact", value: r.business_impact_score },
  ];

  const contact = [
    { label: "Name", value: r.name },
    { label: "Business", value: r.business_name },
    { label: "Email", value: r.email, href: `mailto:${r.email}` },
    { label: "Phone", value: r.phone, href: `tel:${r.phone.replace(/[^\d+]/g, "")}` },
    { label: "Submitted", value: formatDate(r.created_at) },
  ];

  return (
    <div className="space-y-6">
      <Link href="/admin" className="btn-text -ml-1">← All submissions</Link>

      <div className="card overflow-hidden">
        <div className="bg-brand px-6 py-8 text-white sm:px-9">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-white/80">{r.business_name}</p>
          <h1 className="serif mt-2 text-[34px] leading-tight sm:text-[40px]">{r.name}</h1>
          <div className="mt-5 flex flex-wrap items-end gap-x-6 gap-y-2">
            <div className="flex items-end gap-2">
              <span className="serif text-[56px] leading-none">{r.total_score}</span>
              <span className="serif pb-1 text-[20px] text-white/75">/ 100</span>
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-[14px] font-semibold text-brand">{r.health_level}</span>
          </div>
        </div>
        <dl className="grid gap-x-8 gap-y-4 p-6 sm:grid-cols-2 sm:p-9 lg:grid-cols-3">
          {contact.map((c) => (
            <div key={c.label}>
              <dt className="text-[12px] font-semibold uppercase tracking-wide text-muted">{c.label}</dt>
              <dd className="mt-1 break-words text-[15px]">
                {c.href ? <a href={c.href} className="text-brand underline-offset-2 hover:underline">{c.value}</a> : c.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>

      <section className="card p-6 sm:p-9" aria-labelledby="dims">
        <h2 id="dims" className="serif text-[26px]">Dimension scores</h2>
        <ul className="mt-5 space-y-5">
          {dims.map((d) => (
            <li key={d.label}>
              <div className="flex justify-between text-[15px]">
                <span className="font-medium">
                  {d.label}
                  {r.strongest_dimension !== r.weakest_dimension && d.label === r.strongest_dimension ? <span className="ml-2 text-[12px] font-semibold text-brand">STRONGEST</span> : null}
                  {r.strongest_dimension !== r.weakest_dimension && d.label === r.weakest_dimension ? <span className="ml-2 text-[12px] font-semibold text-muted">WEAKEST</span> : null}
                </span>
                <span className="font-medium">{d.value}%</span>
              </div>
              <div className="bar-track mt-2"><div className="bar-fill" style={{ width: `${d.value}%` }} /></div>
            </li>
          ))}
        </ul>
      </section>

      <section className="card overflow-hidden" aria-labelledby="answers">
        <h2 id="answers" className="serif px-6 pb-2 pt-6 text-[26px] sm:px-9 sm:pt-9">Answers</h2>
        <ol className="divide-y divide-hairline-soft">
          {QUESTIONS.map((q) => (
            <li key={q.id} className="grid gap-1 px-6 py-4 sm:grid-cols-[1fr_auto] sm:gap-6 sm:px-9">
              <div>
                <p className="text-[13px] text-muted">Q{q.id}. {q.text}</p>
                <p className="mt-1 text-[15px] font-medium">{r[`q${q.id}_answer`] as string}</p>
              </div>
              <span className="self-start whitespace-nowrap rounded-full bg-brand-soft px-2.5 py-1 text-[13px] font-semibold text-brand">
                {r[`q${q.id}_score`] as number} pts
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="card p-6 sm:p-9" aria-labelledby="diag">
        <h2 id="diag" className="serif text-[26px]">Generated diagnosis</h2>
        <div className="mt-4 space-y-4 text-[15px] leading-relaxed text-body">
          {r.generated_diagnosis.split("\n\n").map((p) => <p key={p}>{p}</p>)}
        </div>
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="card p-6 sm:p-9" aria-labelledby="str">
          <h2 id="str" className="serif text-[22px]">Strengths</h2>
          <ul className="mt-4 list-disc space-y-3 pl-5 text-[15px] leading-relaxed text-body marker:text-brand">
            {r.generated_strengths.map((s) => <li key={s}>{s}</li>)}
          </ul>
        </section>
        <section className="card p-6 sm:p-9" aria-labelledby="weak">
          <h2 id="weak" className="serif text-[22px]">Weaknesses</h2>
          <ul className="mt-4 list-disc space-y-3 pl-5 text-[15px] leading-relaxed text-body marker:text-brand">
            {r.generated_weaknesses.map((s) => <li key={s}>{s}</li>)}
          </ul>
        </section>
      </div>

      <section className="card p-6 sm:p-9" aria-labelledby="recs">
        <h2 id="recs" className="serif text-[26px]">Recommendations</h2>
        <ol className="mt-4 space-y-4">
          {r.generated_recommendations.map((rec, i) => (
            <li key={rec.title} className="text-[15px] leading-relaxed">
              <span className="font-semibold">{i + 1}. {rec.title}</span>
              <span className="block text-body">{rec.body}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
