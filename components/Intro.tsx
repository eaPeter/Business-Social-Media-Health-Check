import { ArrowRight } from "./icons";

const stats = [
  { value: "10", label: "Questions" },
  { value: "2", label: "Minutes" },
  { value: "4", label: "Areas reviewed" },
];

export function Intro({ onStart }: { onStart: () => void }) {
  return (
    <section className="card overflow-hidden" aria-labelledby="intro-title">
      <div className="relative overflow-hidden bg-brand px-6 pb-10 pt-10 text-white sm:px-10 sm:pb-12 sm:pt-12">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/[0.07]" aria-hidden />
        <div className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-white/[0.06]" aria-hidden />
        <h1 id="intro-title" className="serif relative max-w-[16ch] text-[38px] leading-[1.08] sm:text-[48px]">
          How healthy is your business on social media?
        </h1>
        <p className="relative mt-5 max-w-[46ch] text-[17px] leading-relaxed text-white/90">
          Answer 10 quick questions to find out what’s working, what’s holding your business back, and where you should
          focus next.
        </p>
      </div>

      <div className="px-6 pb-8 pt-6 sm:px-10 sm:pb-10 sm:pt-8">
        <ul className="grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <li key={s.label} className="rounded-[12px] border border-hairline px-2 py-4 text-center">
              <div className="serif text-[30px] leading-none text-brand">{s.value}</div>
              <div className="mt-2 text-[12px] font-semibold uppercase tracking-wide text-muted">{s.label}</div>
            </li>
          ))}
        </ul>

        <p className="mt-6 rounded-[12px] bg-surface p-4 text-[15px] leading-relaxed text-body">
          Answer based on what your business actually does today, not what sounds right. The more honest you are, the more
          useful your results will be.
        </p>

        <button type="button" onClick={onStart} className="btn btn-primary mt-6 w-full">
          Start the Health Check <ArrowRight />
        </button>
        <p className="mt-3 text-center text-[13px] text-muted">10 questions · Takes about 2 minutes</p>
      </div>
    </section>
  );
}
