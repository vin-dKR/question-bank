# Roster & scale — implementation tickets

Companion to `docs/roster-problem.html` (the why) and `docs/WORKOS_MIGRATION_APPROACH.md` (the auth migration). This file is the **what**, in order.

**How this is ordered.** Waves run in sequence; tickets *within* a wave can run in parallel. Every ticket is self-contained — files, traps and acceptance criteria are listed inline so you never have to reconstruct context. Nothing later in the list is a prerequisite for anything earlier.

**Sizes:** `S` under half a day · `M` one to two days · `L` three to five days.

| Wave | Theme | Why it's at this position |
|---|---|---|
| 0 | Finish the WorkOS cutover | **Done 24 Aug** (bar T-04's sign-in config). Org scoping is live. |
| 1 | Close the tenancy holes | Cross-origin auth and the open questions API. The WebSocket leak went away with the feature. |
| 2 | The roster model | The structural fix. Waves 3–5 are all consequences of it. |
| 3 | OMR on the roster | The daily-use payoff. |
| 4 | Year rollover | Has a hard deadline: the first April with customers. |
| 5 | Student accounts | Nearly free once wave 2 lands. |
| 6 | Cleanup | Parallelizable filler; pick up whenever. |

---

## Standing rules — read once, remember throughout

These have already cost real debugging time on this codebase. They apply to every ticket.

**MongoDB: `null` is not "missing".** Prisma's `where: { field: null }` matches documents where the field *exists and is null*. It does **not** match documents where the field is absent — which is the state of every pre-existing row right after `db push` adds an optional field. A filter that looks obviously correct will match zero rows and report success. Either backfill an explicit value for every row, or query with `$exists` via `$runCommandRaw`. Verified against production across eight collections.

**Optional unique fields break `db push` on Mongo.** Prisma creates them as a plain `{ unique: true }` index with no `sparse` flag. Mongo indexes a missing field as null and a unique index allows only one null, so the push fails on the second existing row. This is [prisma#23870](https://github.com/prisma/prisma/issues/23870), closed as not planned. Consequences: use `findFirst`, not `findUnique`, on such fields; if you need a DB-level guarantee, `scripts/workos/create-sparse-indexes.ts` adds a partial index by hand — and must be re-run after **every** `db push`, because push drops indexes it doesn't know about.

**`"use server"` files may only export async functions.** A stray `export const` makes the whole module invalid and `next build` fails with an opaque *"Failed to collect page data for /_not-found"*. Types are erased so they're fine; constants are not. Put shared constants in a sibling non-server module (see `actions/organization/types.ts`).

**`withAuth()` throws if middleware didn't run.** It does not fall back to the session cookie. Any route that calls `getAuthContext()` must be covered by the `middleware.ts` matcher — including API routes. Never short-circuit `/api/*` before `authkit()`.

**Never hand AuthKit's headers to `NextResponse.next({ headers })`.** Some are *request* headers for downstream server components (`x-workos-session`, `x-workos-middleware`). Setting them as response headers leaks the sealed session to the browser and starves `withAuth()`. Always use `handleAuthkitProxy(request, headers)`.

**`findUnique` then `create` is not atomic.** A page navigation and its RSC prefetch render the same layout concurrently; both miss, both insert, one gets P2002. Use `upsert`.

**CORS lives in two places.** `middleware.ts` (general allowlist) and `netlify.toml` (stricter per-path for `/api/omr/*` and `/api/questions`). Update both or you get failures that depend on deploy target.

**The collab protocol is duplicated.** `scripts/start-collaboration-server.js` here, and the separate `../ws-questions-b` repo. Message shapes, close codes and query params must change in lockstep.

**Ownership rule.** `organizationId` is the authorization key. `userId` on a resource means *who authored it*, never *who may see it*. No server action should filter on `userId` alone.

**Server actions are public HTTP endpoints.** "Only the admin UI calls it" is not access control. Anything exported from `actions/` authorizes itself.

---

# Wave 0 — Finish the WorkOS cutover

Production is mid-migration: auth is swapped and working, but no data has been backfilled. Until this wave lands, some existing users cannot see their own content.

---

### T-01 — Import existing users into WorkOS
`S` · **Blocks:** T-02 · **Depends on:** nothing

> **DONE — 24 Aug 2026.** All 37 users imported into the **production** WorkOS
> environment, `workosUserId` stamped on every row, zero failures.
>
> One trap hit first: one row still carried a `workosUserId` from the *sandbox*
> environment (yesterday's testing), so the import skipped it as "already
> linked" and would have left that user wired to a dead environment. Cleared the
> stale pointer, plus the sandbox Organization and Membership, before running.

**Why now.** 36 local users have no `workosUserId`. Lazy provisioning adopts them by email on first sign-in, so the app works without this — but until a user signs in, the backfill can't create their membership. Importing up front makes the cutover deterministic instead of trickling in over weeks.

**Do**
1. Dry run: `npx tsx scripts/workos/import-users.ts`
2. Review the skip counts. `skipped.noEmail` is expected for folder-invite placeholder rows.
3. `npx tsx scripts/workos/import-users.ts --commit`
4. Re-run without `--commit`; everything should report `skipped.alreadyLinked`.

**Traps**
- Creates users **without password hashes** — exporting them from Clerk needs a support request.
  **Magic Auth changes what this means for users.** Confirmed enabled 24 Aug alongside
  Google, Email+Password and Enterprise SSO. So nobody has to do a password reset:
  they enter their email and get a six-digit code. For Gmail users — nearly all 36 —
  that is the smoothest path, and Google sign-in is seamless regardless. Tell users
  about Magic Auth rather than about resetting passwords.
- Uses the `sk_test_` key currently in `.env` — that imports into the *test* environment. For production, swap to the live key first (see T-04).
- `emailVerified: true` is set deliberately; these are existing accounts.

**Done when**
- [ ] Every non-placeholder `User` row has a `workosUserId`
- [ ] A second dry run reports zero work
- [ ] A heads-up email has gone out (lead with Magic Auth / Google, not password reset)

---

### T-02 — Run the phase-2 backfill
`M` · **Blocks:** T-03, and all of wave 2 · **Depends on:** T-01

> **PART A DONE — 23 Aug 2026.** Ran `--local-only --commit`, the two steps that
> touch no WorkOS. All 38 `TemplateForm.userId` values remapped from Clerk ids to
> local `User.id` (16 distinct owners, all resolving to real rows — that relation
> had never resolved before), and all 5,445 `Question.organizationId` fields
> normalised to explicit null so the shared bank is queryable. Re-run reports
> zero work. **The live "templates invisible to their owners" bug is fixed.**
>
> **PART B DONE — 24 Aug 2026**, against production WorkOS. 37 orgs created,
> 37 memberships, and `organizationId` stamped on 14 folders, 19 tests, 14 paper
> histories, 38 templates and 338 school-test questions. Re-run reports zero new
> work. Verified: **zero unstamped rows** in all five collections.
>
> **A bug was found and fixed mid-run.** Part A had already remapped
> `TemplateForm.userId` from Clerk ids to local ids, but the stamping step still
> resolved them *as* Clerk ids — so all 38 reported `orphaned` and would have
> been silently left without an `organizationId` while the run declared success.
> The resolver now detects the id shape instead of assuming the step order.

**Why now.** This is the one genuinely broken thing in production right now. All 38 `TemplateForm` rows store a **Clerk id** in a column the schema declares as a relation to `User.id`. `actions/templates/pdfTemplateForm.ts` now writes the local id (it has to — there are no Clerk ids any more), so until these rows are remapped **every pre-existing template is invisible to its owner.**

It also stamps `organizationId` across Folder, Test, PaperHistory, TemplateForm, SchoolTestQuestion and Student, which every later wave depends on.

**Do**
1. Take a database snapshot. Restore it somewhere and dry-run against the restore first.
2. `npx tsx scripts/workos/backfill-orgs.ts` — read the `orphaned` / `ambiguous` / `no-signal` counts.
3. Decide the ambiguous-student policy: default `skip` leaves them unstamped; `--ambiguous-students=earliest` assigns the earliest test's org.
4. `npx tsx scripts/workos/backfill-orgs.ts --commit`
5. Re-run without `--commit`. Should report zero new work.

**Files**
- `scripts/workos/backfill-orgs.ts` (step 4c does the TemplateForm remap)
- `scripts/workos/diagnose-backfill.ts` (if counts look wrong)

**Traps**
- The script deliberately does **not** filter on `organizationId: null` — see the standing rule. Don't "optimize" that back in.
- Step 5 normalizes `Question.organizationId` to an *explicit* null across ~5,445 rows. Without it, the shared-bank read filter matches nothing.
- Idempotent via `Organization.ownerUserId`, **not** via Membership. Don't re-key it.

**Done when**
- [ ] Zero rows with an absent/null `organizationId` in the six stamped collections
- [x] All 38 `TemplateForm.userId` values are 24-char ObjectIds — *done, Part A*
- [x] `Question.organizationId` normalised across 5,445 rows — *done, Part A*
- [ ] A user with pre-existing templates can see them in the app
- [ ] Second run reports zero work

**Known from the dry run.** Five students have marks in two orgs and are left
unstamped by default (`Alice Johnson`, `New Student`, `Notin`, `Ram`, `Shayam`).
That is expected while every teacher has a personal org — one child sat tests set
by two different teachers. Decide between `--ambiguous-students=earliest` and
placing them by hand once real school orgs exist.

---

### T-03 — Enable the Student uniqueness constraint
`S` · **Depends on:** T-02

> **DONE — 24 Aug 2026.** `@@unique([organizationId, className, rollNumber])` is
> live: `Student_organizationId_className_rollNumber_key`. Built against an empty
> collection — the 12 seeded/manual test students were deleted first (snapshot at
> `scratchpad/pre-backfill-snapshot.json`), which also removed the five
> ambiguous-org rows entirely.

**Why now.** `@@unique([organizationId, className, rollNumber])` sits commented out in `prisma/schema.prisma` because production was assumed to hold duplicates. **It doesn't** — `check-student-duplicates.ts` was run on 23 Aug and found 0 duplicates across 12 rows. This is the DB-level guarantee that the roster can't fork.

**Do**
1. Re-run `npx tsx scripts/workos/check-student-duplicates.ts` — confirm still zero.
2. Uncomment the `@@unique` in `prisma/schema.prisma` (and keep `schema.phase1.prisma` in sync).
3. `npx prisma db push` then `npx prisma generate`.
4. Re-run `scripts/workos/create-sparse-indexes.ts` — push drops indexes it doesn't know about.

**Traps**
- Do this **after** T-02, so `organizationId` is populated. Ordering matters: with all rows unstamped the constraint still holds (class+roll differ), but you'd be validating the wrong shape.
- `db push` builds the index against live data and **fails if duplicates exist**. Re-check immediately before pushing, not just now.

**Done when**
- [ ] Constraint live in the database
- [ ] Sparse indexes re-applied
- [ ] Scanning the same sheet twice updates rather than duplicating

---

### T-04 — Stand up the production WorkOS environment
`S` · **Depends on:** nothing · **NOW BLOCKING T-01 AND T-02 PART B**

**Why now.** Everything so far is configured against `sk_test_`. The webhook I created (`we_01M0PKTW1S5RZRTV6X2GV57R32`) points at `https://eduents.com` **from the test environment** — that mismatch will not work in production.

**Do**
1. In the WorkOS dashboard, switch to Production. Copy the live API key and client id.
2. **Redirects** — add `https://eduents.com/auth/callback`, and set the **Sign-in URL** (`initiate_login_uri`) to `https://eduents.com/auth/signin`. Impersonation and other WorkOS-initiated flows fail the PKCE check without the latter.
3. **Authentication** — enable Email + Password and Google.
4. **Branding** — logo and colours.
5. `npx tsx scripts/workos/setup-webhook.ts https://eduents.com --commit` with the live key. Copy the printed secret into production env.
6. Set on the host: `WORKOS_API_KEY`, `WORKOS_CLIENT_ID`, `WORKOS_COOKIE_PASSWORD`, `WORKOS_WEBHOOK_SECRET`, `NEXT_PUBLIC_WORKOS_REDIRECT_URI`, `ADMIN_EMAILS`.

**Traps**
- `WORKOS_COOKIE_PASSWORD` must be ≥32 chars and **stable**. Changing it invalidates every live session.
- Test and production are entirely separate directories — users do not carry over. Run T-01 against whichever environment you're actually launching on.
- Expect a forced logout at cutover. Do it at a low-traffic hour: for an Indian school product that's a weekend morning, not a weekday evening.

**Done when**
- [ ] Sign-in works end to end on production
- [ ] Webhook shows deliveries in the dashboard
- [ ] A new signup gets a `User`, `Organization` and `Membership`

---

# Wave 1 — Close the tenancy holes

Neither depends on the roster work. Both are the difference between "single trust
domain" and "multi-tenant SaaS". (T-05 was the third; it was struck when the
collaboration feature was removed.)

---

### ~~T-05 — Authorize the collaboration WebSocket~~ · STRUCK

> **NOT DOING — 24 Aug 2026. The collaboration feature was removed entirely.**
>
> This ticket existed to close the last outright cross-tenant leak: the WebSocket
> server trusted `folderId`, `userId` and `userName` straight from the query string,
> so anyone who knew a folder id joined that room as anyone.
>
> It was fixed (HMAC-signed handshake token, verified by integration test) and then
> the whole feature was deleted, so the fix is moot. Folders are single-owner now.
>
> **What went with it:** `actions/collaboration/`, `components/collaboration/`,
> `lib/collaboration/`, `CollaborationContext`, `useFolderCollaborators`,
> `useFolderChangeLog`, `types/collaboration-errors.ts`, the WS server, the
> `FolderCollaborator` and `FolderChangeLog` models, the `ws` dependency, and the
> `suraj-markup/eduents-collab-ws` repo.
>
> **What was deliberately kept:** `checkFolderAccess` and
> `updateFolderQuestionsWithOrder`, moved to `actions/drafts/folderAccess.ts`. They
> lived in `actions/collaboration/folder.ts` but had nothing to do with
> collaboration — the first is the authorization check for every folder operation.
> Deleting them would have silently stripped auth from folder access.
>
> **If team sharing comes back**, it should be org-scoped (doc §5) rather than a
> per-folder ACL — org membership grants the baseline, and `FolderCollaborator`
> only ever added to it. The orphaned `FolderCollaborator` (4 docs) and
> `FolderChangeLog` (36 docs) collections are still in MongoDB, unreferenced, if
> that history is ever wanted.

---

### T-06 — Move the satellite apps onto `QUESTION_API_KEY`
`M` · **Depends on:** T-04

**Why now.** `question-editor`, `multi-crop` and `omr-checker` call this app cross-origin **with cookies** (`Access-Control-Allow-Credentials: true`). AuthKit uses a sealed session cookie; cross-site cookie delivery needs `SameSite=None; Secure` and browsers keep tightening it. This will break on its own schedule. `requireApiActor()` already accepts a bearer token — the server side is done, the satellites just haven't adopted it.

**Do**
1. Generate a strong `QUESTION_API_KEY`; set it here and in each satellite.
2. Update each satellite to send `Authorization: Bearer $QUESTION_API_KEY`.
3. Once all three are migrated, drop `Access-Control-Allow-Credentials` from `middleware.ts` and `netlify.toml`.

**Traps**
- Update CORS in **both** places.
- `requireApiActor` compares the key in constant time and length-checks first — don't "simplify" that.
- A service token has no organization. `/api/students/suggest` deliberately returns nothing for service callers because it serves roster PII; keep that shape when adding new endpoints.

**Done when**
- [ ] All three satellites authenticate by bearer token
- [ ] Cookie-credentialed CORS removed
- [ ] Rotating the key breaks and then restores them

---

### T-07 — Decide and enforce access to `GET /api/questions`
`S` · **Depends on:** T-06

**Why now.** It is unauthenticated and serves the entire 5,445-question bank to any caller. That's the product's main commercial asset, currently scrapeable. This is a business decision, not a bug — but it's an unmade one.

**Do**
1. Decide: fully authenticated / authenticated-with-rate-limit / open but paginated and watermarked.
2. Apply `requireApiActor()` to the GET handler if gating.
3. Coordinate with the satellites (T-06) — they read this endpoint.

**Done when**
- [ ] Decision written down in `WORKOS_MIGRATION_APPROACH.md` §14
- [ ] Endpoint behaves accordingly
- [ ] Satellites still work

---

# Wave 2 — The roster model

The structural fix. Waves 3–5 are consequences; do not start them first.

---

### T-08 — Add `AcademicYear`, `Class` and `Enrollment`
`M` · **Blocks:** T-09 → T-18 · **Depends on:** nothing (revised)

> **DONE — 24 Aug 2026.** Models added to `prisma/schema.prisma` (and the
> phase1 copy, verified byte-identical), client regenerated, `db push` applied.
> Indexes live; all existing data untouched (37 users, 12 students, 5,445
> questions, 14 folders, 19 tests). Typecheck and build clean.
>
> **Dependency was wrong.** This did not need T-02. The models are new and empty,
> so there are no rows to violate a constraint and nothing to backfill yet.
>
> **`Student.admissionNumber` was added WITHOUT its `@@unique`.** A compound
> unique on `[organizationId, admissionNumber]` would currently see 12 rows that
> are all `(null, null)` and refuse to build — the same MongoDB null-handling
> trap as `User.workosUserId`. Add the constraint once admission numbers are
> actually populated, then re-run `create-sparse-indexes.ts`.
>
> Next: **T-09** backfills classes and enrollments from the existing
> `Student.className` / `rollNumber` strings — but it needs `organizationId`
> stamped, so it waits on T-02 Part B.

**Why now.** `Student.className` and `Student.rollNumber` are strings on the person. A class has no existence until someone types it on a sheet. This ticket adds the models; nothing reads them yet, so it's a zero-risk deploy.

**Do** — add to `prisma/schema.prisma`, all new fields nullable:

```prisma
model AcademicYear {
  id             String   @id @default(auto()) @map("_id") @db.ObjectId
  organizationId String   @db.ObjectId
  name           String   // "2026-27"
  startsOn       DateTime?
  endsOn         DateTime?
  isCurrent      Boolean  @default(false)
  classes        Class[]
  @@unique([organizationId, name])
  @@index([organizationId, isCurrent])
}

model Class {
  id             String   @id @default(auto()) @map("_id") @db.ObjectId
  organizationId String   @db.ObjectId
  academicYearId String   @db.ObjectId
  name           String   // "10"
  section        String?  // "A"
  classTeacherId String?  @db.ObjectId
  enrollments    Enrollment[]
  @@unique([organizationId, academicYearId, name, section])
  @@index([organizationId])
}

model Enrollment {
  id         String @id @default(auto()) @map("_id") @db.ObjectId
  studentId  String @db.ObjectId
  classId    String @db.ObjectId
  rollNumber String
  status     String @default("active") // active | promoted | transferred | left
  @@unique([classId, rollNumber])
  @@unique([classId, studentId])
  @@index([studentId])
}
```

Add to `Student`: `admissionNumber String?` with `@@unique([organizationId, admissionNumber])`, plus an `enrollments Enrollment[]` back-relation. **Leave `className` / `rollNumber` in place** — they're removed in T-10, not here.

**Traps**
- `admissionNumber` is an *optional unique* field — read the standing rule before adding the constraint. Consider leaving `@@unique` off until T-09 populates it, or use the sparse-index script.
- Keep `prisma/schema.phase1.prisma` byte-identical; the repo relies on that.
- Prisma needs explicit relation names when a model is referenced more than once — match the existing convention.

**Done when**
- [ ] `db push` + `generate` clean
- [ ] `tsc --noEmit` and `bun run build` pass
- [ ] Nothing reads the new models yet

---

### T-09 — Backfill classes and enrollments
`M` · **Depends on:** T-08

> **NOTHING TO BACKFILL — 24 Aug 2026.** The roster was cleared with the test
> data, so `Student` is empty and there are no `className`/`rollNumber` strings to
> convert. Classes and enrollments will be created through the UI (T-11) instead.
> Keep this ticket only if real roster rows are ever imported ahead of T-11.

**Why now.** Turns 12 existing students into real enrollments so nothing is orphaned when reads switch over.

**Do** — write `scripts/roster/backfill-enrollments.ts`, dry-run by default:
1. Create one `AcademicYear` per org, named for the current session, `isCurrent: true`.
2. For each distinct `(organizationId, className)` on `Student`, create a `Class`. Split `"10A"` into name `10` + section `A` where the pattern is unambiguous; leave the whole string as `name` where it isn't, and log those for review.
3. For each `Student`, create an `Enrollment` linking them to their class at their existing `rollNumber`.
4. Report students whose `organizationId` is null — they can't be placed.

**Traps**
- Use the normalizers in `lib/examination/studentRoster.ts` so backfilled classes match what live scanning produces. Diverging here silently creates duplicate classes.
- `@@unique([classId, rollNumber])` will reject genuine collisions — log and stop rather than skipping.
- Same `null`-vs-missing rule: fetch unfiltered, test in JS.

**Done when**
- [ ] Every org-stamped `Student` has exactly one active `Enrollment`
- [ ] Class count matches distinct `className` values
- [ ] Idempotent — second run reports zero work

---

### T-10 — Move reads onto `Enrollment`
`L` · **Depends on:** T-09

> **SCANNING PATH DONE — 24 Aug 2026.** `resolveOrCreateStudent()` now takes an
> optional `classId`. When the test is linked to a class, identity resolves
> through `Enrollment`; when it isn't, the original string match runs unchanged.
> Both OMR entry points (`lib/omr/service.ts`, `app/api/omr/checker/route.ts`)
> pass `test.classId`.
>
> **This is the fix that closes the rollover hole in scanning.** Matching on the
> denormalised `Student.className` cache breaks the moment a student is promoted:
> the cache follows them to the new class, so re-scanning an old test resolved to
> the wrong record. Roll 1 in class A and roll 1 in class B are now provably
> different students.
>
> Verified against the database, both branches, with cleanup:
> `legacy path creates` · `name variant + roll padding → same row` ·
> `enrollment path adopts an existing student` · `adoption creates the enrollment` ·
> `roster wins over the className string` · `clearer read corrects the name in place` ·
> `same roll in another class is a different student` · `re-resolving does not duplicate`.
>
> **Still to do:** analytics in `actions/examination/analytics/` still group by the
> `className` string, and `Student.className`/`rollNumber` remain as a write-through
> cache. Both are safe today; drop the columns only once analytics move across.

**Why now.** Until reads go through enrollments, the old strings are still the source of truth and the year-rollover bug is still live.

**Do**
1. Extend `resolveOrCreateStudent()` in `lib/examination/studentRoster.ts` to resolve via `Class` + `Enrollment` for the current academic year, keeping the legacy-adoption path.
2. Update `/api/students/suggest` to query enrollments for a class rather than `Student.className`.
3. Update analytics in `actions/examination/analytics/` to scope by class through enrollments, filtered to the year the test belongs to.
4. Keep `Student.className` / `rollNumber` updated as a denormalized cache for one release, then drop them in a follow-up.

**Files**
- `lib/examination/studentRoster.ts`, `lib/omr/service.ts`, `app/api/omr/checker/route.ts`, `app/api/students/suggest/route.ts`, `actions/examination/analytics/*`

**Traps**
- `StudentResponse.studentId` must keep pointing at `Student`. Do **not** re-point it at `Enrollment` — that's what preserves history across promotion.
- "How did 10A do last year" becomes a join through enrollments scoped to that year, not a stored field.
- `@@unique([testId, studentId])` on `StudentResponse` stays as-is.

**Done when**
- [ ] Scanning resolves through enrollments
- [ ] Class analytics match pre-change numbers for the current year
- [ ] No read path filters on `Student.className`

---

### T-11 — Class management UI
`L` · **Depends on:** T-09

> **DONE — 24 Aug 2026.** `/classes` and `/classes/[classId]`, plus
> `actions/roster/{classes,enrollment,types}.ts`. Create classes, add/edit/remove
> students with roll and admission numbers, switch academic years. Added to the
> sidebar.
>
> **The academic year self-creates** on first use, deriving an Indian
> April–March session label, so nobody has to configure a year before making a
> class. **Class names go through the same normalizer as OMR scanning**, or the
> roster you build here and the class a scanner infers from a sheet would be
> different records. **Removing a student sets `status`, never deletes** — the
> enrollment is what explains which class a mark was earned in.
>
> Still open from the original scope: **CSV import is T-12**, and reads still use
> the legacy `Student.className`/`rollNumber` cache until **T-10**.

**Why now.** The first moment a teacher can set things up *before* scanning — the shift from roster-as-byproduct to roster-as-record.

**Do**
1. `/classes` — list classes for the current year with student counts.
2. Create/edit a class (name, section, class teacher).
3. Class detail — roster table, add/edit/remove a student, assign roll numbers.
4. Academic year switcher; view past years read-only.

**Traps**
- Every action goes through `requireOrgContext()`, never `requireAuth()` alone.
- Removing a student from a class should set enrollment `status`, not delete the row — deleting orphans their marks.
- Follow the pattern in `actions/organization/settings.ts`: admin checks server-side, constants in a separate non-server module.

**Done when**
- [ ] A teacher can create a class and enroll students with no test involved
- [ ] Past years are visible and read-only
- [ ] Non-admins get a sensible reduced view

---

### T-12 — CSV roster import
`M` · **Depends on:** T-11

**Why now.** Nobody types 200 students by hand. This is what makes T-11 usable for a real institution.

**Do**
1. Upload CSV → column mapping UI (name, roll, admission number, guardian phone).
2. Preview with per-row validation: duplicate rolls, missing names, existing students.
3. Match existing students by `admissionNumber` first, then `(class, roll)`; create the rest.
4. Import summary — created / matched / skipped, with reasons.

**Traps**
- Excel exports from Indian schools are frequently `windows-1252`, not UTF-8. Detect and transcode or names get mangled.
- Normalize roll numbers through `normalizeRollNumber()` so `007` and `7` don't both import.
- Import inside a transaction, or make it resumable — a half-finished import of 200 rows is worse than a failed one.

**Done when**
- [ ] A 200-row CSV imports in one pass
- [ ] Re-importing the same file creates nothing new
- [ ] Bad rows are reported without blocking good ones

---

# Wave 3 — OMR on the roster

---

### T-13 — Link `Test` to a `Class`
`S` · **Blocks:** T-14, T-15 · **Depends on:** T-08

> **DONE — 24 Aug 2026.** `Test.classId` added (nullable, indexed) and pushed.
> The picker lives on the scanning screen rather than the test creator: that is
> where the value lands, and it means existing tests can be linked without
> reopening them. Old tests keep working unlinked.

**Why now.** `Test` has no class link, so "who should have sat this?" is unanswerable — which is why the roster can't pre-populate.

**Do**
1. Add `classId String?` and `academicYearId String?` to `Test`.
2. Add a class picker to the test creator (`components/examination/TestCreator.tsx`).
3. Backfill existing tests from the creator's org where a single class is unambiguous; leave null otherwise.

**Traps**
- Keep it nullable — old tests legitimately have no class.
- A test may later span multiple classes. Don't over-fit to one now, but don't design it out either.

**Done when**
- [ ] New tests carry a class
- [ ] Existing tests still open and grade correctly

---

### T-14 — Roster-driven OMR scanning
`L` · **Depends on:** T-13 (T-10 not required)

> **CORE DONE — 24 Aug 2026.** Selecting a test loads its class roster. A
> detected or typed roll number resolves to a student and fills the name; the
> class field becomes read-only; an unmatched roll is called out by name
> ("Roll 19 isn't in 10 A") instead of silently creating a student. A test with
> no class linked shows a one-click picker, and until it is linked every field
> behaves exactly as before.
>
> **Deliberately additive.** `classId` is nullable and the manual path is intact,
> so nothing that worked before can break.
>
> **Still to do:** the roster side-panel with per-student scanned/pending state,
> which is really T-15's progress work. Batch scanning still processes one sheet
> at a time.

**Why now.** The daily pain. A teacher currently retypes name, class and roll for **every sheet** — 42 sheets is 42 rounds of manual entry and 42 chances to fork a roster row.

**Do**
1. On opening the scanner for a test, load its class roster once.
2. Detected roll number → match to an enrollment → auto-fill the name; teacher confirms rather than types.
3. Unmatched roll → clear prompt ("Roll 19 isn't in 10A") with add-to-class or correct-the-roll.
4. Show the roster alongside the scan queue with per-student state: pending / scanned / needs review.

**Files**
- `components/examination/OmrCheckingPage.tsx` (~700 lines — the three `useState`s for name/class/roll are what's being replaced)
- `lib/omr/service.ts`, `app/api/students/suggest/route.ts` (already accepts `?className=`)

**Traps**
- Keep manual entry as a fallback — sheets get damaged and rolls get misread.
- OMR detection already auto-fills roll (`detectedRoll`); build on it, don't duplicate it.
- Processing is **sequential per page by design** (UI timeline + OpenAI rate limits). Don't parallelize without handling backpressure.

**Done when**
- [ ] A full class is scanned without typing a single name
- [ ] Unmatched rolls are surfaced, never silently inserted
- [ ] Manual entry still available

---

### T-15 — Attendance and scan progress
`M` · **Depends on:** T-14

**Why now.** Right now an absent student is indistinguishable from an unscanned one, so a teacher can't tell when they're finished.

**Do**
1. "28 of 42 scanned · 14 pending" on the scanning screen.
2. Mark a student absent explicitly; exclude from averages but show in the roster.
3. Completion summary before finalising, listing anyone unaccounted for.

**Traps**
- Absent ≠ zero. Excluding from the mean vs scoring zero changes every class statistic — pick one, document it, apply it consistently in `actions/examination/analytics/`.

**Done when**
- [ ] Progress is accurate live
- [ ] Absentees excluded from averages but visible
- [ ] Finalising warns about unaccounted students

---

# Wave 4 — Year rollover

---

### T-16 — Academic year rollover
`M` · **Depends on:** T-11

**Why now.** **This has a real deadline: the first April you have paying customers.** Today, promoting a student either rewrites their history (update `className` and last year's marks claim the new class) or forks them into two disconnected rows. There is no correct option in the current model.

**Do**
1. Create the next `AcademicYear` and clone the class structure into it.
2. Promotion screen: pick a source class, choose the destination, select students, assign new roll numbers.
3. Write new `Enrollment` rows; set the previous ones to `status: "promoted"`.
4. Handle leavers (`left`) and repeaters (new enrollment in the same class name, new year).

**Traps**
- **Never touch `Student` or `StudentResponse`.** Promotion is purely additive on `Enrollment`. If a rollover migration ever updates a student's class, the model has been misunderstood.
- Rollover must be idempotent and reversible for at least a term — someone will run it against the wrong class.
- Preserve `admissionNumber` — it's the durable key across years.

**Done when**
- [ ] Promoting a class leaves all prior marks intact and correctly attributed to the old class
- [ ] Last year's analytics are unchanged after rollover
- [ ] A promoted student's full multi-year history resolves from one `Student`

---

# Wave 5 — Student accounts

---

### T-17 — Join-code claim flow
`M` · **Depends on:** T-16

**Why now.** The `Student.userId` / `Student.email` seam already exists. Once identity is durable, claiming a roster row inherits the entire history automatically.

**Do**
1. Teacher generates a per-class join code (short, expiring, revocable).
2. Student signs up with **any** email, enters the code, picks their name/roll from the class list.
3. Teacher confirms the claim before it links (prevents a student claiming someone else's marks).
4. On confirmation set `Student.userId` and `Student.email`, and create a WorkOS membership with a `student` role.

**Traps**
- The join code sidesteps WorkOS's consumer-domain rule — Gmail invitees must otherwise sign up with the *exact* invited address, which is unworkable for a class of 60. This is precisely why the doc recommends join codes over invitations for students (§3).
- Teacher confirmation is not optional. Without it, anyone with the code claims any classmate's results.
- A `student` role must not inherit teacher permissions. Keep the permission slugs short — they go in the session JWT, which is capped at 4 KB.

**Done when**
- [ ] A student can claim their row with any email address
- [ ] Claims require teacher confirmation
- [ ] A claimed student sees their full history across every year

---

### T-18 — Student result portal
`M` · **Depends on:** T-17

**Why now.** The payoff — and it's mostly a read-only view over data that already exists.

**Do**
1. `/student` — tests taken, scores, percentile within class.
2. Per-test breakdown reusing the analytics components in `components/examination/analytics/`.
3. Progress over time, across academic years.

**Traps**
- Strictly read-only. A student must never reach a teacher mutation — server actions are public endpoints, so check the role on every one.
- A student sees **only their own** responses. Class rank is fine; a classmate's marks are not.

**Done when**
- [ ] A student sees only their own results
- [ ] Multi-year history renders correctly
- [ ] No teacher action is reachable with a student session

---

# Wave 6 — Cleanup

Independent of everything above. Pick up between larger tickets.

---

### T-19 — `UserPreference` model, finish Settings
`M`

Theme, language and all three notification toggles on `/settings` are currently disabled and badged "Coming soon" because there is nowhere to persist them and the notification emails don't exist. Add a `UserPreference` model, load it in the settings server component, save through a server action — the same shape the Institution and Team sections already use. `next-themes` is already installed and unused, so dark mode is closer than it looks.

---

### T-20 — Retire `TeacherData.school`
`S`

Duplicates `Organization.name` and will drift. Migrate readers to the org, drop the field. Same applies to `CoachingData` — those fields are organization data, not user data (§4); most have already been lifted onto `Organization`.

---

### T-21 — Phase-5 schema cleanup
`M` · **Depends on:** T-02, plus a few weeks of stable production

Make `workosUserId` and `organizationId` required. Drop `clerkUserId` and the global `User.role`. Remove `prisma/schema.prisma.bak` and `schema.phase1.prisma`. Delete `StudentData` if student self-signup is definitively gone. **Do not start until the cutover has been stable long enough that rollback is off the table** — this is the irreversible one.
