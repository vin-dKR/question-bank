# Eduents — Super-Refactor Plan

**Goal:** make the app feel **light-speed**. First paint in under 2 seconds on a cold start. Navigation feels instant regardless of what's loading. Scrolling a 2000-question list stays at 60 fps. PDFs generate in under a second once warm.

**Three levers, in priority order:**
1. **Cold-start surgery** — streaming, server components, deferred scripts, lazy-loaded heavy deps. Fixes the 10–15 s first-paint.
2. **Nav cancellation & transitions** — AbortController pattern + `useTransition` + per-segment `loading.tsx`. Fixes the "clicking something waits for the old page to finish."
3. **TanStack Query migration** — cache, dedupe, optimistic mutations. Fixes filter/list/dashboard request storms and the general slow-feel after the shell is on screen.

**Scope:** the `eduents/` Next.js 15 app only. Satellite tools (`image-auto-cropper`, `question-extractor-tool`, `question-image-verifier`, `ws-questions-b`) are out of scope for this pass.

---

## 1. Why the app feels slow — concrete findings

All findings below are evidence-based (file paths + line numbers). We will work through them one phase at a time.

### 1.1 Cold-start causes (the 10–15 s first-paint)

Ranked by impact.

| # | File / Location | Problem | Impact |
|---|---|---|---|
| A1 | `app/(dashboard)/layout.tsx:1` | Whole dashboard layout is `"use client"`. Forces every child to be client-rendered and blocks Next.js from streaming the shell. Sidebar + header wait in the same tree as data-heavy main content. | **HIGH** |
| A2 | `app/(dashboard)/dashboard/page.tsx:15,21` + `hooks/dashboard/questionsData.ts:7-14` | Dashboard page is a client component that `useEffect`-awaits `getQuestionsData()` *and* `getPaperHistories(5)` **serially**. User sees nothing until both finish. | **HIGH** |
| A3 | `app/layout.tsx:26-27` | Root layout injects two async external scripts: **MathJax 3.2.2 (~500 kB)** and Cloudflare Turnstile. Loaded on every route, including ones that render no math and have no auth widget. | **HIGH** |
| A4 | `lib/prisma.ts:7-9` + MongoDB Atlas | Prisma singleton is correct, but the **first** connection on a cold container pays TCP+TLS handshake to Atlas (2–5 s). Middleware's `await auth()` often triggers it. No warm-up. | **MED-HIGH** |
| A5 | `middleware.ts:23` (`await auth()`) | Clerk auth call runs on **every** request, including static-ish pages. No session caching layer. Cold-path Clerk session validation can be 200–800 ms. | **MED** |
| A6 | `app/(dashboard)/*` route segments | **Zero `loading.tsx` files.** Next.js has to wait for the whole server tree to resolve before swapping the UI. No streaming fallback anywhere. | **MED** |
| A7 | `components/dashboard/content/MainContent.tsx:1,10-17` | `"use client"` at the top → wraps `AppProviders` + `QuestionBankProvider` + `CollaborationProvider`. All three providers mount + run effects on *every* dashboard route, even ones that don't need them. | **MED** |
| A8 | `package.json` | Duplicate math deps shipped: `mathjax`, `mathjax-full`, `mathjax-node-cli`. Only `mathjax` is used. Dead weight in the server bundle + build time. | **LOW** (bundle), but easy win |
| A9 | `lib/context/QuestionBankContext.tsx:46-57` | Two independent mount effects, both call server actions. `fetchQuestions` callback identity churns on every filter/page change, causing cascading re-runs on routes where you didn't even open the question bank yet. | **MED** |
| A10 | `next.config.ts` | No `@next/bundle-analyzer`. We're flying blind on what ships to the client. Not a root cause, but we need it to prevent regressions. | INFRA |

### 1.2 Nav-blocking causes (clicking X waits for Y)

This is the classic "`useEffect` fires a server action, has no cleanup, and server actions can't be aborted" problem, compounded by missing `loading.tsx` and no `useTransition` on nav.

| # | File / Location | Problem | Impact |
|---|---|---|---|
| B1 | `hooks/dashboard/questionsData.ts:7-14` | `useEffect` awaits `getQuestionsData()`. **No AbortSignal, no cleanup.** Old fetch resolves after navigation, stomps state on the new page. | **HIGH** |
| B2 | `app/(dashboard)/dashboard/page.tsx:18-31` | Awaits `getPaperHistories(5)` in a client effect. No abort. Nav clicks stall until it finishes. | **HIGH** |
| B3 | `lib/context/QuestionBankContext.tsx:46-57` | Two uncancelled fetches. If user leaves the questions route mid-load, they keep running and setting state. | **HIGH** |
| B4 | `components/dashboard/history/PaperHistoryPage.tsx:33-48` | `fetchPaperHistories` with `getPaperHistories(50)`. No AbortController. | **MED** |
| B5 | `components/dashboard/sidebar/SidebarItem.tsx:19-33` | Plain `<Link>`, no `useTransition`. Clicks are "sticky" while the current route's client work is still running. | **MED** |
| B6 | All route segments | No `loading.tsx`. Even if we abort properly, without a loading boundary Next.js holds the old UI until the new tree resolves, reinforcing the "blocked" feel. | **MED** |
| B7 | **Fundamental:** server actions cannot be aborted by client `AbortController` | Next.js limitation. Any long server action awaited in a client effect will run to completion on the server even if we abort on the client. We must **split long server actions into cheap + deferred parts** (e.g., via `useInfiniteQuery` pagination) so nothing single awaited call ever takes more than ~300 ms. | ARCHITECTURAL |

### 1.3 Data-fetching / render bottlenecks (post-shell slowness)

| # | File / Location | Problem | Impact |
|---|---|---|---|
| C1 | `actions/question/questionBank.ts:217-243` (`getFilterOptions`) | 5 parallel `findMany` distinct queries on every filter-option refresh. Scans the filtered Question set 5 ×. | **HIGH** |
| C2 | `components/question/FilterControls.tsx:43-100` | Every filter click re-runs C1. No debounce. No dedupe. Rapid clicks = 5 × N queries in flight. | **HIGH** |
| C3 | `components/question/QuestionList.tsx:39-465` | Renders **all** questions, no virtualization. `renderMixedLatex()` fires per row per render. MathJax re-runs on scroll. | **HIGH** |
| C4 | `actions/htmlToPdf/htmlToPdf.ts:21-26` | `puppeteer.launch()` + `chromium.executablePath()` on every call. 3–5 s cold start blocks the server action. | **HIGH** |
| C5 | `components/examination/TestDashboard.tsx:29-43` | `useEffect([])` → `getTests()` with no limit. Renders every card. Breaks past ~50 tests. | **MED** |
| C6 | `actions/examination/analytics/getTestAnalytics.ts:22-63` | Nested `include` pulls full graph even when only a preview is shown. Grows as students × questions. | **MED** |
| C7 | `actions/collaboration/folder.ts:80-120` | Fetches all collaborators + full `FolderChangeLog` on folder open. Log grows unbounded. | **MED** |
| C8 | `hooks/question/useFetchQuestions.ts:14-75` | Manual reducer + `useCallback` dispatch. Re-implements TanStack Query for free (cache, dedupe, retry, SWR, pagination). | MED (dev-velocity HIGH) |
| C9 | `actions/question/questionBank.ts:334-351` (`searchQuestions`) | Hardcoded `take: 50`, no cursor. Silently truncates. | LOW |

### 1.4 Surprises found during audit

- **`AppProviders` is orphaned** — defined in `components/providers/AppProviders.tsx`, imported only by `MainContent`. Whatever was intended, it's wired in a half-done state.
- **Dashboard page is hardcoded `"use client"`** — there is no reason for this; it only reads data. Converting to an async server component is both the correctness and the perf fix.
- **Triple MathJax dependency** — we ship `mathjax` + `mathjax-full` + `mathjax-node-cli`. Only one is used. Remove the other two.
- **MainContent's `"use client"` wrapper** infects every child route with the client boundary.

### 1.5 What is NOT the problem (don't waste time here)

- **Prisma `select` discipline** — mostly good (e.g. `actions/examination/crudTest.ts:56-93` is tight).
- **Indexes** — `prisma/schema.prisma` has `@@index` on the right fields.
- **Server actions pattern** — clean. Don't restructure.
- **Zustand** — only holds lightweight UI state. Not a cache. Leave it alone.
- **Collaboration WS server** — pure in-memory broadcast hub. Correct shape.
- **School-test pipeline** — sequential-per-page is **by design** (see `eduents/CLAUDE.md`). Do NOT parallelize.
- **Puppeteer is server-only** — `next.config.ts` has it in `serverExternalPackages`. Good.

---

## 2. Target architecture

```
┌──────────────────────────────────────────────────────────────────┐
│  Root layout (SERVER)                                            │
│  ├─ ClerkProvider (client leaf only where needed)                │
│  ├─ QueryProvider (client, thin)                                 │
│  └─ MathJax / Turnstile scripts — only on routes that need them  │
│                                                                   │
│  (dashboard) layout (SERVER)                                     │
│  ├─ Sidebar (server component, statically rendered)              │
│  ├─ Header (server component)                                    │
│  └─ <Suspense fallback={<Skeleton/>}>                            │
│       {children}  ← streams independently                        │
│                                                                   │
│     Each leaf page:                                              │
│     - SERVER component where it only reads                       │
│     - Client island only where interaction lives                 │
│     - loading.tsx in every route segment                         │
│                                                                   │
│  Client islands use:                                             │
│  ├─ TanStack Query for all server-state reads                    │
│  ├─ useTransition() on nav triggers                              │
│  ├─ AbortController for any effect that fetches non-action data  │
│  ├─ TanStack Virtual for big lists                               │
│  └─ Zustand for UI-only state (selections, toggles, open panels) │
└──────────────────────────────────────────────────────────────────┘
```

**Holding rules:**
- Server state → TanStack Query. UI state → Zustand / local. No overlap.
- No top-level `"use client"` on a *layout*. Only on the smallest leaf that needs it.
- No data-fetch awaited inline in a layout. Everything streams through `Suspense` + `loading.tsx`.
- Every client `useEffect` that does async work uses an AbortController OR is replaced with TanStack Query.
- Every nav interaction is wrapped in `useTransition` so clicks are never "stuck."

---

## 3. Why TanStack Query (and what exactly it buys us)

- **Automatic request deduplication** — multiple components asking for the same key get one in-flight request. Fixes C2 immediately.
- **Stale-while-revalidate** — filter options can have `staleTime: 15min`; users see instant UI, background refresh keeps it fresh. Fixes C1 for repeat visits.
- **`useInfiniteQuery`** — clean pagination/infinite-scroll. Fixes C5, C9.
- **Optimistic updates** — mutations feel instant; rollback on error is free.
- **Query invalidation** — after a mutation, mark related keys stale; only affected views refetch.
- **Devtools** — see every query, every cache hit, every refetch. Makes perf work objective.
- **Works with server actions directly** — `queryFn: () => getQuestions(filters)` is valid. No REST/tRPC layer needed.

Cost: ~7 kB gzipped + one provider at the root. Acceptable.

---

## 4. Phased roadmap — one bottleneck at a time

Each phase is a **separate PR**, ships independently, and has a measurable win. We stop after each phase, measure, and only then move to the next.

### Phase 0 — Baseline & instrumentation *(before any refactor)*
- Add `@next/bundle-analyzer`. Run once, commit the report path to `.gitignore`, note the "first-load JS" number per route.
- Add `web-vitals` capture on dashboard, question-bank, and examination routes.
- Record: TTFB, LCP, INP, JS bundle size, **cold-start wall-clock** (first request after container boot), and # network requests on a typical filter change.
- Screenshot React DevTools Profiler of `QuestionBankViewer` on 500+ questions.
- **Deliverable:** `docs/perf-baseline.md`. Every later phase must cite an improvement against this file.

### Phase 1 — Cold-start surgery (targets A1, A2, A3, A6, A7, A8, A9)
This is the biggest perceived win. Do this first; it unblocks everything else.

1. **Strip `"use client"` from `app/(dashboard)/layout.tsx`.** Convert it to a server component. Sidebar and header become server components too (they don't have onClick on the static bits — the interactive fragments become small client islands).
2. **Convert `app/(dashboard)/dashboard/page.tsx` to an async server component.** `await` the two reads on the server, in parallel via `Promise.all`. Wrap each data block in its own `<Suspense>` so the shell streams before the slow one finishes.
3. **Delete the `useEffect`-based data loading in `hooks/dashboard/questionsData.ts`.** The data now comes from the server component. The hook disappears.
4. **Add `loading.tsx` to every route segment** under `app/(dashboard)/`: `dashboard/`, `history/`, `questions/`, `examination/`, `post/`, `school-test/`, `[slug]/`. Each renders a lightweight skeleton matching the route's layout. This alone makes navigation feel instant.
5. **Defer MathJax + Turnstile scripts.**
   - MathJax moves from `app/layout.tsx:26-27` to **only** the routes that render math (question bank, examination, PDF preview). Use `next/script` with `strategy="lazyOnload"` on those routes' layouts.
   - Turnstile moves to `app/auth/` only.
6. **Tree-shake dead math deps.** Remove `mathjax-full` and `mathjax-node-cli` from `package.json` if confirmed unused. Keep only `mathjax` + `react-katex`.
7. **Route-scope the providers.** `MainContent`'s `AppProviders` / `QuestionBankProvider` / `CollaborationProvider` must each wrap only the routes they serve.
   - `QuestionBankProvider` → wraps only `app/(dashboard)/questions/*`.
   - `CollaborationProvider` → wraps only routes that open a folder.
   - Leaves the dashboard landing page provider-free → zero unnecessary effects on cold-start.
8. **Stub out `MainContent`'s `"use client"`.** It becomes a server component; only the interactive fragments inside it are client islands.

**Expected win:** cold-start LCP drops from 10–15 s to **< 3 s**. Probably **< 2 s** once Phase 2 lands.

### Phase 2 — Nav cancellation & transitions (targets B1–B7 + A4, A5)
1. **Introduce `lib/hooks/useAbortableEffect.ts`** — an effect wrapper that creates an AbortController per effect run, passes `signal` to async work, and aborts on unmount. Migrate every `useEffect`-fetch listed in §1.2 to it (where we haven't already deleted the hook in Phase 1).
2. **`useTransition` on every nav trigger.** `components/dashboard/sidebar/SidebarItem.tsx` wraps the `<Link>` click in `startTransition`; the sidebar reads `isPending` and renders a subtle spinner on the clicked item. The new route's shell appears immediately (thanks to Phase 1's `loading.tsx`), pending work on the old route doesn't block it.
3. **Split long server actions** — anything over ~300 ms of server work gets paginated/split so client cancellation via AbortController is meaningful. Concretely: `getTestAnalytics` → summary + detail (also in Phase 6); `getFolders` with many collaborators → collaborator list separate from change-log (Phase 8).
4. **Prisma connection warm-up (A4)** — on `lib/prisma.ts` import, fire-and-forget a `prisma.$runCommandRaw({ ping: 1 })` so the TLS handshake happens before the first real query. Negligible code, real wall-clock win on cold containers.
5. **Clerk session caching sanity check (A5)** — verify `@clerk/nextjs` middleware config has `debug: false` and the `authorizedParties` list is tight. Document in a short note the cost of `await auth()` in middleware and whether any route can skip middleware via the `matcher` config.

**Expected win:** clicks feel instant. No more "stuck on old page." INP drops well below 200 ms.

### Phase 3 — Install TanStack Query + provider
- `bun add @tanstack/react-query @tanstack/react-query-devtools`
- Add `provider/QueryProvider.tsx` (thin client component). Defaults: `staleTime: 30s`, `gcTime: 5m`, `retry: 1`, `refetchOnWindowFocus: false` (this is a work tool, not a live dashboard).
- Wrap in `app/layout.tsx` next to `ClerkProvider`.
- `<ReactQueryDevtools />` in dev only.
- **No behavior change.** Plumbing only.

### Phase 4 — Kill C1 & C2 (filter options)
1. **Server-side:** rewrite `getFilterOptions` in `actions/question/questionBank.ts:217-243` as a single MongoDB `$group` aggregation. One round-trip instead of five.
2. **Client-side:** `hooks/queries/useFilterOptions.ts` using `useQuery` with `staleTime: 15 * 60 * 1000` and `queryKey: ['filterOptions', activeFilters]`. Replace the call in `FilterControls.tsx:43-100`.

**Expected win:** filter clicks ~0 ms on repeat, ~60 % faster on first hit.

### Phase 5 — Virtualize QuestionList (C3)
- `@tanstack/react-virtual` for windowed rendering in `components/question/QuestionList.tsx`.
- Memoize `renderMixedLatex(question.question_text)` output per-question (stable key), so MathJax does not re-run on scroll.
- Target: 60 fps scroll at 2000 questions. Current: stutters at ~150.

### Phase 6 — Question bank fetching (C8, A9)
- Replace `useFetchQuestions` + reducer + `QuestionBankContext`'s fetch effects with `useInfiniteQuery`:
  - `queryKey: ['questions', filters]`, `queryFn: ({ pageParam }) => getQuestions({ ...filters, cursor: pageParam })`
  - `getNextPageParam` reads cursor returned by the server action
- `QuestionBankContext` shrinks to UI state only (selected question IDs, open panels). Server state leaves the context.
- Server action returns `{ items, nextCursor }` — server-side pagination real, not client-side slicing.

### Phase 7 — Mutations with optimistic updates
- All write paths under `actions/question/` wrapped in `useMutation` with:
  - `onMutate` → snapshot cache, apply optimistic change
  - `onError` → rollback
  - `onSettled` → `queryClient.invalidateQueries({ queryKey: ['questions'] })`
- Expands to `actions/drafts/`, `actions/templates/`, `actions/paperHistory/`, `actions/examination/` in a follow-up PR.

### Phase 8 — Examination surface (C5, C6)
- `TestDashboard.tsx:29-43` → `useQuery` + pagination. Page size 20, load-more.
- `getTestAnalytics.ts:22-63` → split into `getTestAnalyticsSummary` (counts, averages, top-10) + `getTestAnalyticsDetail(testId, { cursor })`. Both wired through TanStack Query; drill-down uses `useInfiniteQuery`.

### Phase 9 — Puppeteer singleton (C4)
- `lib/pdf/browserSingleton.ts` lazily launches Chromium once, reuses across calls. SIGTERM handler to clean up.
- On serverless (Netlify / Vercel) the process is short-lived; win there comes from warm-lambda reuse. For long-running cold Lambdas, document the trade-off and consider a dedicated PDF worker (Phase 11 option).
- Target: second-and-later PDF generations in the same process drop from ~4 s to ~600 ms.

### Phase 10 — Folder collaboration surface (C7)
- `actions/collaboration/folder.ts:80-120` → split collaborator list (cacheable, `staleTime: 60s`) from change-log (paginated `useInfiniteQuery`, newest first).
- Invalidate `['folder', folderId, 'collaborators']` from the WS `onMessage` handler when a collaboration event arrives — the websocket becomes the **invalidation signal**, TanStack Query does the refetch. Cleanest possible integration.

### Phase 11 — Super-scale options *(only if we actually need it)*
Everything up to Phase 10 should be enough for 10× current load. For 100×:
- **Redis cache layer** in front of aggregation queries (filter options, dashboard counts). TTL 5–15 min.
- **MongoDB Atlas read replicas** + route analytics reads to replica.
- **Edge-cache server action responses** on anonymous-safe routes.
- **Materialize filter options** on write — every Question create/edit/delete updates a `FilterOptionsCache` collection. Removes the aggregation entirely.
- **Dedicated PDF worker** — Gotenberg or a Puppeteer Lambda pool called asynchronously; user gets a notification when ready, not a blocking await.
- **CDN for generated PDFs** (Supabase storage already configured; wire the output URL back through instead of streaming bytes).

Do not adopt these pre-emptively. Measure after Phase 10, then decide.

---

## 5. File-by-file migration table (reference while executing)

| Current file | Action in refactor | Phase |
|---|---|---|
| `app/(dashboard)/layout.tsx` | Remove `"use client"`, convert to server component | 1 |
| `app/(dashboard)/dashboard/page.tsx` | Convert to async server component, parallel awaits, Suspense | 1 |
| `hooks/dashboard/questionsData.ts` | Delete (data lives on server now) | 1 |
| `components/dashboard/content/MainContent.tsx` | Remove `"use client"`, route-scope providers | 1 |
| `components/providers/AppProviders.tsx` | Split; each provider wraps only its own route group | 1 |
| `app/(dashboard)/*/loading.tsx` | **Create** for every segment | 1 |
| `app/layout.tsx` | Move MathJax + Turnstile scripts out | 1 |
| `package.json` | Remove `mathjax-full`, `mathjax-node-cli` (if unused) | 1 |
| `lib/prisma.ts` | Add warm-up ping on module load | 2 |
| `middleware.ts` | Verify Clerk config, tighten matcher if possible | 2 |
| `lib/hooks/useAbortableEffect.ts` | **Create** | 2 |
| `components/dashboard/sidebar/SidebarItem.tsx` | Wrap nav in `useTransition`, show `isPending` | 2 |
| `components/dashboard/history/PaperHistoryPage.tsx` | Migrate to `useAbortableEffect` or `useQuery` | 2 |
| `lib/context/QuestionBankContext.tsx` | Slim to UI-state only | 2 → 6 |
| `provider/QueryProvider.tsx` | **Create** | 3 |
| `actions/question/questionBank.ts → getFilterOptions` | Rewrite as single aggregation | 4 |
| `hooks/queries/useFilterOptions.ts` | **Create** | 4 |
| `components/question/FilterControls.tsx` | Use `useFilterOptions` | 4 |
| `components/question/QuestionList.tsx` | Virtualize + memoize LaTeX render | 5 |
| `hooks/question/useFetchQuestions.ts` | Delete, replace with `useInfiniteQuery` | 6 |
| `hooks/question/useFetchFilterOptions.ts` | Delete | 4 |
| `components/examination/TestDashboard.tsx` | `useQuery` + pagination | 8 |
| `actions/examination/analytics/getTestAnalytics.ts` | Split into summary + detail | 8 |
| `actions/htmlToPdf/htmlToPdf.ts` | Use `browserSingleton` | 9 |
| `actions/collaboration/folder.ts` | Split collaborators / change-log | 10 |
| `store/*` | **Untouched.** UI state only. | — |

---

## 6. Success metrics

Measured on a dataset of ~2000 questions and ~200 tests, throttled "Fast 3G + 4× CPU" Lighthouse profile, cold container.

| Metric | Baseline (tbd in Phase 0) | Target after Phase 2 | Target after Phase 10 |
|---|---|---|---|
| **Cold-start LCP (first-ever open)** | ~10–15 s | **< 3 s** | **< 2 s** |
| **Warm LCP (dashboard)** | ? | **< 1.2 s** | **< 1.0 s** |
| **Nav click → new shell visible** | feels "stuck" | **< 100 ms** | **< 100 ms** |
| **INP on any interaction** | ? | **< 200 ms** | **< 100 ms** |
| **Question-bank LCP** | ? | — | **< 1.8 s** |
| **Filter click → list updated** | ? | — | **< 150 ms** (cache hit) / **< 400 ms** (miss) |
| **QuestionList scroll FPS (500 items)** | stutter ~30 | — | **≥ 55 fps sustained** |
| **PDF generation (warm)** | ~4 s | — | **< 800 ms** |
| **JS first-load (dashboard route)** | ? | **-30 %** | **-40 %** |

---

## 7. Non-goals (explicit)

- No migration to tRPC / REST. Server actions stay.
- No rewrite of the Prisma schema. No data migration.
- No change to Clerk / auth flow (beyond config hardening in Phase 2).
- No change to the real-time WS protocol (keeps `ws-questions-b` in sync by construction).
- No UI/visual redesign. Visuals frozen; only fetching/rendering changes.
- No new testing framework in this refactor.
- No `"use client"` on any layout file. Ever.

---

## 8. How we work through this

1. Read this doc → agree on scope.
2. Execute Phase 0 first. Nothing else starts without baseline numbers.
3. One phase = one PR = one merged improvement with metrics.
4. After each phase, update §6 with measured numbers and reconfirm the next phase is still the right priority.
5. Phases 1 and 2 are where the "light-speed feel" comes from. Phases 3–10 are the throughput and scalability layer. Do not skip 1→2; the order matters (streaming + loading.tsx must exist before `useTransition` is meaningful).
6. When we hit "good enough," stop. Phase 11 items are opt-in, not mandatory.

---

## 9. Execution log (live)

Filled in as each phase merges into `main`. Numbers come from `bun run build` output on the merged commit.

### Wave 1 (parallel worktrees; merged in order: 0 → 9 → 3 → 5 → 1)

| Phase | Status | Commit | Notes |
|---|---|---|---|
| 0 — perf baseline | ✅ merged | `1e58966` | Bundle analyzer behind `ANALYZE=true`, web-vitals reporter in root layout, `docs/perf-baseline.md` with static + template-for-dynamic numbers |
| 9 — Puppeteer singleton | ✅ merged | `bb5ef8a` | `lib/pdf/browserSingleton.ts`; `htmlToPdf` closes pages, not browser; SIGTERM/SIGINT cleanup. Agent kept original `puppeteer.launch({ args, executablePath })` 2-key shape because `@sparticuz/chromium` v138 dropped `headless`/`defaultViewport` from its public types |
| 3 — TanStack Query install | ✅ merged | `5a5b18d` | `provider/QueryProvider.tsx` mounted inside `ClerkProvider`. Defaults: staleTime 30s, gcTime 5m, retry 1, no `refetchOnWindowFocus` |
| 5 — virtualize QuestionList | ✅ merged | `cbc47cc` | `@tanstack/react-virtual`, dynamic measurement, overscan 5; `selectedIdSet` swaps O(n·m) selection lookup for O(1). Discovery: list uses **react-katex (KaTeX)**, not MathJax — no imperative typeset call needed when virtual rows mount |
| 1 — cold-start surgery | ✅ merged | `ba6446f` | Layout/page → server components, 6 `loading.tsx` files added, MathJax + Turnstile moved off root layout to route-scoped layouts (`lazyOnload`), `mathjax-full` + `mathjax-node-cli` removed, `AppProviders` deleted and replaced with route-scoped `QuestionWorkspaceProviders`. Required `export const dynamic = "force-dynamic"` on `dashboard/page.tsx` because `auth()` reads `headers()` |

### Wave 2a (parallel; merged in order: 8 → 10 → 4 → 2)

| Phase | Status | Notes |
|---|---|---|
| 8 — examination useQuery + analytics split | ✅ merged | `getTests({ skip, take })` returns `{ items, total, hasMore }`; `getTestAnalyticsSummary` (cheap counts + top-10) and `getTestAnalyticsDetail` (paginated `useInfiniteQuery`); original `getTestAnalytics` kept `@deprecated` |
| 10 — folder collab split | ✅ merged | `getFolderChangeLogPage` cursor-paginated; `useFolderCollaborators` (staleTime 60s) + `useFolderChangeLog` (`useInfiniteQuery`); WS events trigger `queryClient.invalidateQueries` — websocket becomes the invalidation signal, TanStack does the refetch |
| 4 — filter aggregation | ✅ merged | Single MongoDB `$group` aggregation replaces 5 parallel distinct queries; regex inputs `escapeRegex`'d; `useFilterOptions` hook with staleTime 15min; `useFetchFilterOptions` deleted |
| 2 — nav cancellation | ✅ merged | `lib/hooks/useAbortableEffect.ts`; SidebarItem wraps `router.push` in `startTransition` with opacity + spinner pending state; `lib/prisma.ts` fires-and-forgets `$runCommandRaw({ ping: 1 })` on module load to warm TLS handshake. **Caveat:** server actions can't be aborted server-side — the AbortController only stops the client from applying stale state |

### Wave 2b (sequential)

| Phase | Status | Notes |
|---|---|---|
| 6 — question bank `useInfiniteQuery` | ✅ merged | `getQuestions` adds cursor pagination (`{ cursor, take }` → `{ items, nextCursor }`) with backwards-compat `skip/limit` branch for `/api/questions/get-all`; `buildQuestionWhere` helper dedup'd between `getQuestions` + `getQuestionCount`; `QuestionBankContext` slimmed to UI-state only; `useQuestionsList()` wrapper exposes server state with TanStack semantics; `useFetchQuestions`, `hooks/question/questionBank.ts`, `components/question/PaginationControls.tsx` (orphan) deleted |

### Wave 2c (sequential)

| Phase | Status | Notes |
|---|---|---|
| 7 — question mutations | ✅ merged | Question-bank slice: `useUpdateQuestion`, `useUpdateQuestionForm`, `useToggleQuestionFlag` (optimistic flip), `useCreateQuestion` (no optimistic — server-assigned id), `useDeleteQuestion` (optimistic remove), `useRefineQuestionText` (no DB write); all under `hooks/queries/mutations/`. `useQuestionActions` rewritten internally to compose the new hooks while keeping its 4-callback external API stable (zero churn at consumers). Reducer dispatches `TOGGLE_FLAG` / `UPDATE_QUESTION` alongside the mutation so `selectedQuestions` overlay flips in lock-step with the cache. **Follow-ups**: drafts, templates, examination, paperHistory mutations + `selectFlagged` orphan + `QuestionList`'s direct `refineTextWithAI` Promise.all callsite all left for later PRs |

### Follow-up TS fixes after Phase 7 merge

- `useUpdateQuestionForm`: guard `data.answer` / `data.flagged` against `null` (form input shape wider than `Question` cache shape).
- `QuestionBankContextType`: `toggleQuestionFlag` is now `(id) => void` (mutation is fire-and-forget); `updateQuestion` narrowed to `Pick<Question, 'id' | 'question_text' | 'options'>` to match the actual signature.

### Measured wins (so far)

Captured from `bun run build` after each merge. "Baseline" is pre-Wave-1 main (`97fb637`).

| Route | Baseline first-load JS | Post-Wave-2b first-load JS | Δ |
|---|---|---|---|
| `/dashboard` | 117 kB (3.73 kB route bundle) | **106 kB (167 B route bundle)** | route bundle −96%, FLJS −9% |
| `/[slug]` (catch-all) | 336 kB | 336 kB | unchanged at build (runtime perf wins from virtualization come from Phase 5 — measure with React DevTools) |
| Shared chunks | ~102 kB | ~102 kB | stable |
| Middleware | 84.4 kB | 84.4 kB | stable |

Cold-start LCP, dashboard warm LCP, INP, scroll FPS, PDF generation wall-clock — to be captured by user with the perf-baseline doc's methodology and filled in here.

### Worktree branches (still alive on local repo)

For audit / rollback if needed; safe to delete after a release cut.

```
worktree-agent-a3679093  Phase 0
worktree-agent-a3deea8a  Phase 1
worktree-agent-afdeec14  Phase 3
worktree-agent-af50f28d  Phase 5
worktree-agent-a8e0b6cd  Phase 9
worktree-agent-ad52906c  Phase 2
worktree-agent-a64e01bc  Phase 4
worktree-agent-a7afb578  Phase 8
worktree-agent-a4860a71  Phase 10
worktree-agent-ac164e30  Phase 6
worktree-agent-<phase7>  Phase 7 (in flight)
backup-pre-wave1         safety branch at 97fb637
```

---

**Next action after this doc is approved:** start Phase 0 — instrument and capture baseline numbers.
