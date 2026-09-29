# Business Social Media Health Check

A 10-question social-media assessment. Visitors answer one question at a time, leave their details, and get a
personalised diagnosis. Every submission is saved to Supabase and can be reviewed (and exported) in `/admin`.

Stack: Next.js 15 (App Router) · TypeScript · Tailwind CSS 4 · Supabase (Postgres + Auth) · deploys to Vercel.

## 1. Set up Supabase

1. Create a project at supabase.com.
2. **SQL editor** → paste and run [`supabase/schema.sql`](supabase/schema.sql). It creates the
   `assessment_submissions` table, locks it down with row-level security (no public access), and adds the
   `assessment_stats()` function used by the dashboard.
3. **Authentication → Users → Add user** → create your admin account (email + password, auto-confirm).
4. **Project Settings → API** → copy the project URL, anon key and service-role key.

## 2. Configure the app

```bash
cp .env.example .env.local   # then fill in the values
npm install
npm run dev                  # http://localhost:3000   (admin: /admin)
```

| Variable | Notes |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public. Used only for admin sign-in. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only.** Saves and reads submissions. Never prefix with `NEXT_PUBLIC_`. |
| `ADMIN_EMAILS` | Comma-separated list. Only these accounts get into `/admin`, even if other Supabase users exist. Empty = nobody. |
| `NEXT_PUBLIC_CTA_URL` | Destination of the "Let's Talk" button. |

On Vercel, add the same variables under Project Settings → Environment Variables.

## 3. Fonts

Inter loads automatically. **Farmhand Serif** is licensed, so it isn't bundled: put your file at
`public/fonts/FarmhandSerif.woff2` (`.woff`, `.otf` and `.ttf` also work). Until then a serif fallback is used.
To swap the font, edit the `@font-face` block and `--font-serif` in [`app/globals.css`](app/globals.css).

## 4. Where things live

| To change… | Edit |
| --- | --- |
| Question wording, answers, points, which questions feed each dimension | `lib/assessment/questions.ts` |
| Score bands, dimension maths, strongest/weakest logic | `lib/assessment/scoring.ts` |
| Diagnosis copy, pattern rules, strengths/weaknesses, recommendations | `lib/assessment/diagnosis.ts` |
| CTA copy and link | `lib/config.ts` |
| Colours, radii, shadow, fonts | `app/globals.css` (`@theme`) |

Scores are always recalculated on the server from the selected option, so the browser can't send a made-up score.
`total_score` and `percentage_score` are equal today because the maximum is exactly 100; both are stored as requested.

## 5. Security notes

- Submissions table has RLS enabled and no policies: the public anon key can neither read nor write it.
- All writes/reads go through server code using the service-role key (`server-only` import prevents bundling it into the browser).
- `/admin` is protected twice: middleware redirect + a server-side check of the Supabase session against `ADMIN_EMAILS` on every page and on the CSV route.
- Input is validated with Zod on the client and again on the server, trimmed, stripped of control characters and `<>`, and constrained again by database `check` constraints.
- Duplicate protection: each assessment carries a browser-generated key with a unique index; refreshing the results page restores the saved result instead of re-submitting. A hidden honeypot field silently drops basic bots.
- CSV export neutralises spreadsheet formulas (`=`, `+`, `-`, `@`), so phone numbers starting with `+` appear with a leading apostrophe in Excel.

## 6. Tests

```bash
npm test          # scoring, dimensions, and diagnosis scenarios
npm run typecheck
```

The tests cover: 100 max / 42 min score, Q1's three options, dimension maths, level bands, determinism, banned wording,
and eight respondent scenarios (all-first, all-last, strong strategy + weak consistency, weak strategy + strong
consistency, engaged audience + weak impact, strong content + weak audience insight, weak content system +
reasonable strategy, mixed mid-range) confirming each gets a different diagnosis and recommendations.
