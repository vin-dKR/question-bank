# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> This is the `eduents/` subproject of the `project-eduents/` workspace. See `../CLAUDE.md` for how this app relates to the satellite tools (`image-auto-cropper`, `question-extractor-tool`, `question-image-verifier`, `ws-questions-b`) and which URLs are CORS-allowlisted for cross-origin calls into this app.

## Commands

Package manager is **Bun** (`bun.lockb`). Run everything from this directory.

```bash
bun install
bun run dev                 # Next.js dev server, port 3000
bun run build               # next build (relies on generated/prisma — see below)
bun run lint                # next lint
bun run collaboration       # WS collab server on :3001 (same as `start` / `npm start`)
npx prisma db push          # push schema to MongoDB Atlas
npx prisma generate         # regenerates client into ./generated/prisma
npx tsx scripts/seed-examination-data.ts
npx tsx scripts/migrate-answer.ts
```

No test runner is configured — don't invent `bun test` / `jest` invocations. `dbTest.ts` at the repo root is an ad-hoc script, not a test suite.

### Booby traps around `start` / Prisma / build

- **`npm start` / `bun start` does NOT run `next start`.** `package.json` remaps `start` to `node scripts/start-collaboration-server.js` (the WS collab server on :3001). If you want the Next.js production server, you must invoke `next start` directly.
- **Prisma client is generated to `./generated/prisma`**, not `node_modules/@prisma/client` (see `prisma/schema.prisma` `generator.output`). Import as `from "@/generated/prisma"` — the canonical `lib/prisma.ts` does exactly that.
- **`binaryTargets = ["native", "rhel-openssl-3.0.x"]`**. `next.config.ts` has a webpack hook that (a) removes `@prisma/client` from the server externals list and (b) copies `generated/prisma/query-engine-rhel-openssl-3.0.x` into `.next/server/...` at build time. If you see "query engine not found" on Vercel/Netlify, confirm the file exists *before* `next build` runs — the copy is a no-op when missing (it only `console.warn`s).
- **CORS is configured in TWO places.** `middleware.ts` handles the general allowlist for `/api/*`. `netlify.toml` adds stricter per-path headers for `/api/omr/*` and `/api/questions` specifically. When adding a new cross-origin caller, update *both* or you'll get intermittent failures depending on deploy target.

## Architecture

### Routing shape (App Router)

- `app/(dashboard)/` — authenticated workspace. The `(dashboard)` route group shares a layout (`layout.tsx` in that folder) without adding a URL segment. Contains `dashboard/`, `examination/`, `post/`, `school-test/`, and a catch-all `[slug]/`.
- `app/onboarding/` — multi-step onboarding. `/onboarding/user-type` is the role-selection landing.
- `app/auth/` — public Clerk sign-in/up/SSO callback.
- `app/api/` — route handlers grouped by domain: `analytics/`, `examination/` (`tests/`, `analytics/`), `omr/`, `questions/`, `school-test/process/`, `students/`, `webhooks/`.

Most mutations live in `actions/<domain>/` as server actions. Only use an `app/api/` route handler when you need cross-origin access (and then the origin must be in the `middleware.ts` allowlist and — for OMR/questions — in `netlify.toml`).

### Middleware (`middleware.ts`)

Single Clerk middleware handles three concerns in one pass:

1. **CORS preflight** for every `/api/*` request. Allowed origins: `localhost:3000/3001/5173` and the deployed satellites (`question-editor.vercel.app`, `multi-crop.vercel.app`, `omr-checker.vercel.app`). Non-API requests fall through.
2. **Auth gate**: unauthenticated users redirected to Clerk sign-in, except for `isPublicRoute` (`/auth/*`, `/`, `/api`).
3. **Onboarding gate**: logged-in users without `sessionClaims.metadata.onboardingComplete === true` are bounced to `/onboarding/user-type`, *unless* already on an `/onboarding` path.

When adding new public routes or API origins, update the `isPublicRoute` matcher and `allowedOrigins` array in this one file. The CORS origin allowlist still references the pre-rename names (`question-editor`, `multi-crop`) — verify these haven't moved before relying on them.

### Server actions pattern

All write paths live under `actions/<domain>/`: `question/`, `drafts/`, `templates/`, `paperHistory/`, `onBoarding/`, `examination/`, `dashboard/`, `user/`, `collaboration/`, `htmlToPdf/`, `school-test/`. Components import these directly via `"use server"`. Prefer adding a new file under `actions/<domain>/` over an API route unless cross-origin access is needed.

Server actions have a raised body limit: `experimental.serverActions.bodySizeLimit: '10mb'` in `next.config.ts` — set because generated HTML/PDF payloads are large.

### Data model (`prisma/schema.prisma`, MongoDB)

Two loosely coupled domains in one schema:

1. **Question bank + collaboration**: `User` → `Folder` → `FolderQuestion` → `Question`. Collaboration via `FolderCollaborator` (roles: `owner`/`editor`/`viewer`) + `FolderChangeLog` (append-only audit; `details` is a JSON string). `FolderQuestion.position: Float` is a **fractional-index ordering** — when reordering, pick a float *between* neighbors; don't renumber the whole list. Role-specific profiles (`TeacherData`, `StudentData`, `CoachingData`) are 1:1 with `User` keyed off `User.role`.

2. **Examination**: `Test` → `TestQuestion` (→ shared `Question`) → `StudentResponse` → `TestAnswer`. **`Student` is a separate model, not a `User` with `role=student`** — examination flows create bare `Student` records not tied to Clerk auth. `StudentResponse` is uniquely indexed on `(testId, studentId)`.

`PaperHistory` + `PaperHistoryQuestion` snapshot generated PDFs with their question list and metadata (marks, institution, session, …). `TemplateForm` stores reusable PDF layout presets per user.

The shared `Question` model is referenced by folders, tests, paper history, *and* test answers — four distinct Prisma relation names: `QuestionToFolderQuestion`, `QuestionToTestQuestion`, `QuestionToAnswer`, `QuestionToPaperHistory`. Prisma requires the names because of the multiple back-references; match the existing convention when adding new references.

### Real-time collaboration

Folder-scoped collab uses a plain `ws` `WebSocketServer` on port 3001 (`scripts/start-collaboration-server.js`). Clients connect with `?folderId=&userId=&userName=` query params; missing any → `ws.close(1008)`. The server is a pure in-memory broadcast hub keyed by `folderId` — **no DB writes happen in the socket**. Durable audit is `FolderChangeLog`, written by the relevant server actions under `actions/collaboration/`.

The standalone `../ws-questions-b/` project is a near-duplicate of this script; if you change the protocol (message shapes, close codes, query params), change both.

### PDF generation

Server-side via Puppeteer + `@sparticuz/chromium` (serverless-compatible binary). Math rendering: **MathJax 3 + `mathjax-node-cli` server-side**, **`react-katex` client-side** — keep server/client rendering consistent when touching math markup. Entry point is `actions/htmlToPdf/`. The 10 MB server-action body limit above exists primarily for this flow.

### School-test pipeline (`lib/school-test/`)

Takes a PDF or image and yields a streamed `ProcessEvent` sequence (`page-count`, `page-start`, `page-detected`, `page-extracted`, `page-done`, `error`, `complete`) from `runPipeline()` in `pipeline.ts`. The `app/api/school-test/process/` route is the public surface.

- Processing is **sequential per page** by design (UI timeline + OpenAI rate limits). Don't parallelize without also handling backpressure.
- For raw image uploads, `pageImagesFromInput()` does `sharp(...).rotate().png()` to bake in EXIF orientation. Skipping `.rotate()` silently misaligns the vision model's bbox coordinates against sharp's pixel layout → crops point at the wrong region. Don't remove it.
- Provider switch (`"openai" | "gemini"`) is per-call; clients live in `lib/school-test/openai.ts` and `lib/school-test/gemini.ts`. The detector path uses a different model (`"gpt-5.4"`) from the extractor path (`"gpt-4o"`-equivalent) — matches the Python reference implementations in the sibling `image-auto-cropper` and `question-extractor-tool` projects.
- Persistence of extracted questions goes through `actions/school-test/saveExtractedQuestions.ts`.

### External services

Clerk (auth), MongoDB Atlas (via Prisma + a raw `mongodb` client on some paths), OpenAI + Gemini (vision extraction, LaTeX refinement), Resend (email), Twilio (SMS), Supabase (image storage — **two** project URLs allowlisted in `next.config.ts` `images.remotePatterns`, indicating an in-progress migration between Supabase projects).
