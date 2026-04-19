# Perf baseline — Phase 0

This is the reference document the rest of the refactor measures against. It
is created in **Phase 0** of `REFACTOR_PLAN.md` and is intentionally a living
document: Phase 1+ fill in the dynamic numbers and update the "current"
column as wins land.

Until Phase 0 is approved, treat every dynamic number as `TBD`.

---

## How to measure

All commands run from `eduents/` (the Next.js app). Package manager is **Bun**.

### Bundle analyzer

```bash
ANALYZE=true bun run build
```

`next.config.ts` is wrapped with `@next/bundle-analyzer`; the env flag is the
only switch. The analyzer opens three HTML reports in your browser
(`client.html`, `nodejs.html`, `edge.html`) under
`.next/analyze/` once the build completes. Capture the **First Load JS** for
each route from the build summary table and the **client bundle treemap** as
screenshots into `docs/perf/<date>/`.

### Lighthouse

Run against a **production** build, not the dev server. Dev mode includes
React DevTools and HMR client and is not representative.

```bash
bun run build
npx next start                 # NOTE: `bun run start` runs the WS collab
                               # server, not Next.js. See eduents/CLAUDE.md.
# In another shell, with Chrome:
npx lighthouse http://localhost:3000/dashboard \
    --preset=desktop \
    --throttling-method=simulate \
    --emulated-form-factor=desktop \
    --output=html \
    --output-path=./docs/perf/<date>/dashboard.html
```

Repeat for each route in the list below. For mobile, drop `--preset=desktop`
and use the default mobile profile to match the success-metrics table in
`REFACTOR_PLAN.md` §6 ("Fast 3G + 4× CPU").

Record from each report: **LCP, FCP, TTFB, INP, CLS, TBT, Speed Index, JS
size shipped**.

### Web Vitals (live, in-browser)

Once the app is running, open devtools console on any page. The reporter
mounted in `app/layout.tsx` (`components/perf/WebVitalsReporter.tsx`) logs:

```
[web-vitals] LCP = 1234.50 (good)
[web-vitals] CLS = 0.02 (good)
...
```

In production these go to `navigator.sendBeacon('/api/perf/web-vitals')` —
that endpoint does **not** exist yet (intentional; tracked as a `TODO` in
`lib/perf/reportWebVitals.ts`). Phase 1+ will wire a route + persistence.

### Cold-start wall-clock

The number that matters most. Methodology:

1. Stop any running Next.js server.
2. Delete `.next/cache/` to invalidate the file-system cache.
3. Start a fresh process: `bun run build && npx next start`.
4. Use `curl -w '%{time_total}\n' -o /dev/null -s http://localhost:3000/dashboard`
   to time the **first** request after boot. Note: this requires Clerk auth;
   in practice run a headless browser flow (Playwright `page.goto`) with a
   pre-baked session cookie.
5. Record (a) wall-clock to first byte, (b) wall-clock to LCP from the
   browser perf trace.

For Vercel / Netlify, "cold" means a freshly built deploy with no warm
serverless instance; trigger a deploy, immediately hit the route, capture.

---

## Routes to measure

Capture each metric for every route below. Phase 1+ fill in the table.

- `/`                    — landing
- `/dashboard`           — authenticated dashboard landing
- `/questions`           — question bank (large list, filter UI)
- `/examination`         — test list
- `/post`                — paper-history / generated PDFs

Add `/school-test` once Phase 1's loading boundaries land — it currently has
its own streaming pipeline that needs separate measurement.

---

## Static baseline (captured now)

Captured 2026-04-20 from the `worktree-agent-a3679093` branch state.

### Client/server boundary footprint

| Metric                                                                | Value |
|-----------------------------------------------------------------------|-------|
| `"use client"` files under `app/`                                     | 7     |
| `"use client"` files under `components/`                              | 36    |
| **Total `"use client"` files (`app/` + `components/`)**               | **43**|
| `loading.tsx` files anywhere under `app/`                             | **0** |
| `useEffect(` occurrences under `components/` (19 files)               | 31    |
| `useEffect(` occurrences under `hooks/` (6 files)                     | 8     |
| **Total `useEffect(` occurrences (`components/` + `hooks/`)**         | **39**|

Methodology:

```bash
grep -rl '"use client"' app components | wc -l        # 43
find app -name 'loading.tsx' | wc -l                  # 0
grep -r 'useEffect(' components hooks | wc -l         # 39
```

These three numbers are the cheapest progress proxy we have. Phase 1
should drop the `"use client"` count and lift the `loading.tsx` count.
Phase 2 + Phase 6 should drive the `useEffect(` count down as fetches move
to TanStack Query.

### Server actions inventory

All files under `actions/` and what each one is for.

| File                                                          | Purpose                                                              |
|---------------------------------------------------------------|----------------------------------------------------------------------|
| `actions/collaboration/folder.ts`                             | Folder collaborator CRUD + invite emails + access checks (target C7) |
| `actions/dashboard/questionsData.ts`                          | Dashboard count widget — `prisma.question.count()` (target A2)       |
| `actions/drafts/draft.ts`                                     | Folder/draft CRUD (questions in folders) for the drafts surface      |
| `actions/examination/analytics/generateStudentAnalyticsPdf.ts`| Per-student analytics → HTML → PDF via `htmlTopdfBlob`               |
| `actions/examination/analytics/getTestAnalytics.ts`           | Aggregate test analytics with nested includes (target C6)            |
| `actions/examination/test/crudTest.ts`                        | Test CRUD on the examination domain                                  |
| `actions/htmlToPdf/htmlToPdf.ts`                              | Puppeteer + `@sparticuz/chromium` HTML→PDF (target C4)               |
| `actions/onBoarding/completeOnboarding.ts`                    | Final onboarding step — sets Clerk metadata + user role data         |
| `actions/onBoarding/getUserData.ts`                           | Fetch user + role-specific 1:1 profile (teacher/student/coaching)    |
| `actions/onBoarding/getUserRole.ts`                           | Fetch only the user's role string (validates against allowlist)      |
| `actions/onBoarding/getUserSubject.ts`                        | Fetch teacher's subject from `TeacherData` (else null)               |
| `actions/paperHistory/paperHistory.ts`                        | Persist `PaperHistory` snapshots of generated PDFs                   |
| `actions/question/insert.ts`                                  | `Question` create/update primitives                                  |
| `actions/question/questionBank.ts`                            | List + filter + search questions; `getFilterOptions` (targets C1, C9)|
| `actions/question/questionUpdate.ts`                          | Zod-validated single-question text/options update                    |
| `actions/school-test/saveExtractedQuestions.ts`               | Persist school-test pipeline output (questions + Supabase image ops) |
| `actions/school-test/updateSchoolTestCrop.ts`                 | Update an individual school-test question's crop bbox + image        |
| `actions/templates/pdfTemplateForm.ts`                        | Per-user reusable PDF layout template CRUD                           |
| `actions/user/fetchEmail.ts`                                  | Fetch the authenticated user's email                                 |

19 files total. None are paginated below the action level today (cursor +
`take` semantics live inside individual queries, not as a uniform shape).

### Top 20 heaviest deps in `package.json` `dependencies`

Methodology: I could not run `bun pm ls` in this sandbox (network + bun
calls are blocked here). The table below is a **rough ordering by typical
gzipped install footprint** based on the published npm tarball sizes I've
seen for these packages historically. Treat the ranking as approximate;
re-derive precisely with `du -sh node_modules/<dep>` and the analyzer
output once it is run.

| #  | Dependency                | Notes                                                                  |
|----|---------------------------|------------------------------------------------------------------------|
| 1  | `puppeteer`               | Bundles a full Chromium download in the install. By far the heaviest.  |
| 2  | `puppeteer-core`          | Lighter than `puppeteer` but still ships a substantial control API.    |
| 3  | `@sparticuz/chromium`     | ~50 MB serverless Chromium binary; server-only, externalized in next.   |
| 4  | `mathjax-full`            | Full MathJax tree; **flagged for removal in Phase 1 (A8) — likely dead.** |
| 5  | `mathjax`                 | The runtime CDN script is what actually ships; the npm pkg is hefty.   |
| 6  | `pdfjs-dist`              | PDF rendering / parsing; legacy build pulled in for the school-test pipeline. |
| 7  | `mongodb`                 | Atlas driver (used in raw paths alongside Prisma).                     |
| 8  | `@prisma/client`          | Prisma runtime; query engine binary lives under `generated/prisma/`.   |
| 9  | `prisma`                  | CLI + engine bundle (declared as dep, not devDep — should be devDep).  |
| 10 | `next`                    | Framework runtime.                                                     |
| 11 | `openai`                  | OpenAI SDK + types (server-only path).                                 |
| 12 | `@google/genai`           | Gemini SDK (server-only path).                                         |
| 13 | `framer-motion`           | Animation library; ships to client where imported.                     |
| 14 | `react-select`            | Heavier than the Radix select; check if both are needed.               |
| 15 | `mathjax-node-cli`        | Server CLI wrapper; **flagged for removal in Phase 1 (A8) — likely dead.** |
| 16 | `twilio`                  | Server-only SMS SDK; large surface.                                    |
| 17 | `@sparticuz/chromium`*    | (already counted; placeholder)                                         |
| 18 | `sharp`                   | Native image lib; server-only, used by school-test pipeline.           |
| 19 | `@napi-rs/canvas`         | Native canvas; server-only.                                            |
| 20 | `html2pdf.js`             | Client-side PDF; check if still in use vs. the puppeteer server path.  |

Refresh this list in Phase 1 once `ANALYZE=true bun run build` has run and
we can sort by **actual client-bundle contribution** (the only number that
affects perceived perf).

---

## Dynamic baseline (to capture)

Engineers running the steps in **How to measure** above should fill these
in. Leave blank cells as `TBD — capture via <method>` and date the row when
you fill it.

| Metric                                              | Route(s)         | Value | Captured | Method |
|-----------------------------------------------------|------------------|-------|----------|--------|
| Cold-start LCP (first request after fresh boot)     | `/dashboard`     | TBD   | —        | curl + browser perf trace, see "Cold-start wall-clock" |
| Warm LCP                                            | `/dashboard`     | TBD   | —        | Lighthouse desktop, second run |
| Warm LCP                                            | `/questions`     | TBD   | —        | Lighthouse desktop, second run |
| INP — sidebar item click                            | any dashboard    | TBD   | —        | web-vitals reporter, click sidebar item once warm |
| Filter click → list updated (ms)                    | `/questions`     | TBD   | —        | DevTools Performance, mark click → list re-render |
| Scroll FPS — 500-question list                      | `/questions`     | TBD   | —        | DevTools Performance, "Frames" track during scroll |
| PDF generation wall-clock (warm)                    | post / examination PDF | TBD | —      | server log: time `htmlTopdfBlob()` start → return |
| First-load JS — `/`                                 | `/`              | TBD   | —        | `next build` summary table |
| First-load JS — `/dashboard`                        | `/dashboard`     | TBD   | —        | `next build` summary table |
| First-load JS — `/questions`                        | `/questions`     | TBD   | —        | `next build` summary table |
| First-load JS — `/examination`                      | `/examination`   | TBD   | —        | `next build` summary table |
| First-load JS — `/post`                             | `/post`          | TBD   | —        | `next build` summary table |

---

## Known hot-spot files

Copied verbatim from `REFACTOR_PLAN.md` §1.1, §1.2, §1.3 — this is the
**reference to beat**. Update only by editing `REFACTOR_PLAN.md` and
re-syncing here.

### Cold-start (§1.1)

| #  | File / Location | Problem | Impact |
|----|-----------------|---------|--------|
| A1 | `app/(dashboard)/layout.tsx:1` | Whole dashboard layout is `"use client"`. Forces every child to be client-rendered and blocks Next.js from streaming the shell. Sidebar + header wait in the same tree as data-heavy main content. | HIGH |
| A2 | `app/(dashboard)/dashboard/page.tsx:15,21` + `hooks/dashboard/questionsData.ts:7-14` | Dashboard page is a client component that `useEffect`-awaits `getQuestionsData()` *and* `getPaperHistories(5)` serially. User sees nothing until both finish. | HIGH |
| A3 | `app/layout.tsx:26-27` | Root layout injects two async external scripts: MathJax 3.2.2 (~500 kB) and Cloudflare Turnstile. Loaded on every route, including ones that render no math and have no auth widget. | HIGH |
| A4 | `lib/prisma.ts:7-9` + MongoDB Atlas | Prisma singleton is correct, but the first connection on a cold container pays TCP+TLS handshake to Atlas (2–5 s). Middleware's `await auth()` often triggers it. No warm-up. | MED-HIGH |
| A5 | `middleware.ts:23` (`await auth()`) | Clerk auth call runs on every request, including static-ish pages. No session caching layer. Cold-path Clerk session validation can be 200–800 ms. | MED |
| A6 | `app/(dashboard)/*` route segments | Zero `loading.tsx` files. Next.js has to wait for the whole server tree to resolve before swapping the UI. No streaming fallback anywhere. | MED |
| A7 | `components/dashboard/content/MainContent.tsx:1,10-17` | `"use client"` at the top → wraps `AppProviders` + `QuestionBankProvider` + `CollaborationProvider`. All three providers mount + run effects on every dashboard route, even ones that don't need them. | MED |
| A8 | `package.json` | Duplicate math deps shipped: `mathjax`, `mathjax-full`, `mathjax-node-cli`. Only `mathjax` is used. Dead weight in the server bundle + build time. | LOW (bundle), but easy win |
| A9 | `lib/context/QuestionBankContext.tsx:46-57` | Two independent mount effects, both call server actions. `fetchQuestions` callback identity churns on every filter/page change, causing cascading re-runs on routes where you didn't even open the question bank yet. | MED |
| A10| `next.config.ts` | No `@next/bundle-analyzer`. We're flying blind on what ships to the client. Not a root cause, but we need it to prevent regressions. | INFRA — **resolved in Phase 0** |

### Nav-blocking (§1.2)

| #  | File / Location | Problem | Impact |
|----|-----------------|---------|--------|
| B1 | `hooks/dashboard/questionsData.ts:7-14` | `useEffect` awaits `getQuestionsData()`. No AbortSignal, no cleanup. Old fetch resolves after navigation, stomps state on the new page. | HIGH |
| B2 | `app/(dashboard)/dashboard/page.tsx:18-31` | Awaits `getPaperHistories(5)` in a client effect. No abort. Nav clicks stall until it finishes. | HIGH |
| B3 | `lib/context/QuestionBankContext.tsx:46-57` | Two uncancelled fetches. If user leaves the questions route mid-load, they keep running and setting state. | HIGH |
| B4 | `components/dashboard/history/PaperHistoryPage.tsx:33-48` | `fetchPaperHistories` with `getPaperHistories(50)`. No AbortController. | MED |
| B5 | `components/dashboard/sidebar/SidebarItem.tsx:19-33` | Plain `<Link>`, no `useTransition`. Clicks are "sticky" while the current route's client work is still running. | MED |
| B6 | All route segments | No `loading.tsx`. Even if we abort properly, without a loading boundary Next.js holds the old UI until the new tree resolves, reinforcing the "blocked" feel. | MED |
| B7 | Fundamental: server actions cannot be aborted by client `AbortController` | Next.js limitation. Any long server action awaited in a client effect will run to completion on the server even if we abort on the client. We must split long server actions into cheap + deferred parts so nothing single awaited call ever takes more than ~300 ms. | ARCHITECTURAL |

### Data-fetching / render bottlenecks (§1.3)

| #  | File / Location | Problem | Impact |
|----|-----------------|---------|--------|
| C1 | `actions/question/questionBank.ts:217-243` (`getFilterOptions`) | 5 parallel `findMany` distinct queries on every filter-option refresh. Scans the filtered Question set 5×. | HIGH |
| C2 | `components/question/FilterControls.tsx:43-100` | Every filter click re-runs C1. No debounce. No dedupe. Rapid clicks = 5 × N queries in flight. | HIGH |
| C3 | `components/question/QuestionList.tsx:39-465` | Renders all questions, no virtualization. `renderMixedLatex()` fires per row per render. MathJax re-runs on scroll. | HIGH |
| C4 | `actions/htmlToPdf/htmlToPdf.ts:21-26` | `puppeteer.launch()` + `chromium.executablePath()` on every call. 3–5 s cold start blocks the server action. | HIGH |
| C5 | `components/examination/TestDashboard.tsx:29-43` | `useEffect([])` → `getTests()` with no limit. Renders every card. Breaks past ~50 tests. | MED |
| C6 | `actions/examination/analytics/getTestAnalytics.ts:22-63` | Nested `include` pulls full graph even when only a preview is shown. Grows as students × questions. | MED |
| C7 | `actions/collaboration/folder.ts:80-120` | Fetches all collaborators + full `FolderChangeLog` on folder open. Log grows unbounded. | MED |
| C8 | `hooks/question/useFetchQuestions.ts:14-75` | Manual reducer + `useCallback` dispatch. Re-implements TanStack Query for free (cache, dedupe, retry, SWR, pagination). | MED (dev-velocity HIGH) |
| C9 | `actions/question/questionBank.ts:334-351` (`searchQuestions`) | Hardcoded `take: 50`, no cursor. Silently truncates. | LOW |
