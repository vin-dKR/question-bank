# WorkOS AuthKit migration — approach & open decisions

**Scope agreed:** full replace of Clerk with WorkOS AuthKit; coaching centre / school = organization; existing production data on MongoDB Atlas.

**Decisions locked (2026-08-20):**

| # | Decision | Consequence |
|---|---|---|
| §2 | **Option A** — `Student` stays a roster row; nullable `userId` link added but unused | OMR/offline flows untouched. No student-account merge problem in phase 1 |
| §3 | **Students do not log in** | No student invitations. The no-email problem disappears entirely |
| §12 | **MongoDB**, not Neon | No database-engine migration. One change at a time |
| §13 | **`Question` is a global shared bank; you can edit only what you uploaded** | Zero backfill. Admin-uploaded questions are read-only to every org. No copy-on-write needed. See §14 for three unauthenticated write paths that must be closed |

**What §3 collapses.** Because students don't log in, org membership in practice means *teachers and admins only*. That removes the single ugliest part of this migration: no bulk student invites, no roster-claim flow, no consumer-domain email matching, no duplicate-identity merge. `StudentData` (the profile for self-signup students) becomes effectively dead — leave it in place, stop writing to it, drop it in phase 5.

The nullable `Student.userId` / `Student.email` columns still go in now. They cost nothing, and they are the seam that lets you switch student logins on later for the subset who take online tests — without a second migration against a table that by then holds every mark you've ever recorded.

**All blocking decisions are now made.** The work is sequencing, not design — with one caveat that came out of the `Question` decision: see §14.

---

## 0. The thing to internalise first

This is not an auth-provider swap. Clerk → WorkOS is maybe 20% of the work. The other 80% is that **your data model currently has no concept of an organization at all**, and introducing one changes the ownership rule for every resource in the app.

Today:

- `User.clerkUserId` is the join key, referenced across **37 files**
- `User.role` is a single global string — `teacher` / `student` / `coaching`
- `Folder.userId → User`, `Test.createdBy → User`, `PaperHistory`, `TemplateForm` — all owned by a *person*, never by an org
- `FolderCollaborator` is a per-folder ACL, entirely separate from any org idea
- `Student` is **not a `User`** — it's a bare roster record (`name`, `rollNumber`, `className`) with no auth link
- The onboarding gate reads `sessionClaims.metadata.onboardingComplete`, a Clerk `publicMetadata` field

Every one of those five facts breaks or bends under an org model. The cases below are ordered by how much damage they do if you get them wrong.

---

## 1. Ownership: user-owned → org-owned

**The problem.** If `Folder` stays `userId`-owned and you bolt orgs on the side, you get two ownership systems and an endless supply of "why can't the admin see this folder" bugs. You also get a data-leak class: any query that filters only by `userId` will happily return rows from the wrong org once a user belongs to two orgs.

**Recommendation.** Make **everything org-scoped, always.** Add `organizationId` to `Folder`, `Test`, `PaperHistory`, `TemplateForm`, `SchoolTestQuestion`, `Student`. Keep `userId` as *creator/author*, not as the authorization key.

**Corollary — give solo users a personal org.** A teacher who signs up alone still gets an org (`org_<their name>`). This is the standard WorkOS pattern and it's worth it: it means there is never a branch in your code for "resource with no org". It also makes the backfill trivial — every existing user gets a personal org, all their folders go into it.

**The enforcement rule.** One helper, used everywhere:

```ts
// lib/auth/context.ts
export async function requireOrgContext() {
  const { user, organizationId, role, permissions } = await withAuth({ ensureSignedIn: true });
  if (!organizationId) redirect('/onboarding/org');
  return { user, organizationId, role, permissions };
}
```

…and a hard rule that **no server action calls Prisma with only a `userId` filter**. Every read is `where: { organizationId, ... }`. Consider a Prisma extension that throws at runtime if an org-scoped model is queried without `organizationId` — cheap insurance, catches the leak in dev instead of in front of a customer.

---

## 2. The `Student` model — DECIDED: Option A

Right now students exist in two incompatible ways:

- `StudentData` — a profile hanging off a real `User` who signed up and chose "student" in onboarding
- `Student` — a roster row created by the examination/OMR flow, no email, no login, keyed by `rollNumber` + `className`, referenced by `StudentResponse` (unique on `testId, studentId`)

If students become org members, the same physical child can be **both**: a `Student` row from an OMR sheet *and* an invited `User` with a membership. Merge them wrong and marks attach to the wrong record.

**Option A — keep the roster, add a nullable link. ✅ CHOSEN.**

```prisma
model Student {
  // ...existing
  organizationId String  @db.ObjectId
  userId         String? @db.ObjectId   // null until they claim an account
  email          String?
  @@unique([organizationId, className, rollNumber])
}
```

The roster stays the durable identity for marks. Login is an *optional overlay*. An invited student who accepts gets matched to their roster row (by email if present, otherwise a teacher-confirmed "claim" step). OMR keeps working untouched for students who never log in.

*(Option B — collapsing `Student` into `User` — was rejected: you cannot create a WorkOS user without an email, and most school students don't have one.)*

**The one case that survives:** duplicate roster rows from repeated OMR uploads of the same answer sheet. This already exists in your production data today, independent of WorkOS — it just becomes blocking the moment you want a uniqueness constraint on `(org, class, roll)`. `scripts/workos/check-student-duplicates.ts` reports them; the nasty subset is where *both* rows carry marks for the *same* `testId`, because the `(testId, studentId)` unique index will refuse the merge and a human has to pick a winner.

---

## 3. Student logins — DECIDED: students don't log in

Marks are entered by the teacher via OMR. Students are roster records, not accounts. **No student invitations ship in phase 1.**

This is the decision that removes the most risk from the whole migration. Everything below stops being your problem:

- WorkOS invitations requiring an email address, for a class of 60 where half have none
- The consumer-domain rule (Gmail invitees must sign up with the *exact* invited address; corporate domains allow any address on the same domain) — a bulk-invite footgun
- Bulk-invite partial-failure UI, resend, revoke, expiry
- The roster-claim flow and its duplicate-identity merge

Invitations in phase 1 are **teacher-and-admin only**, which is a normal SaaS invite flow of maybe a dozen people per org.

**When you do want student logins later** (online tests taken on a device), the options are, in order of preference:

1. **Roster join code** — teacher generates a per-class code; student signs up with any email and enters the code to link to their roster row. Sidesteps the email problem entirely.
2. **Teacher-provisioned accounts** — `rollno@school.eduents.app` addresses created via API. Works, but you own a password-distribution problem.
3. **Phone-based via Twilio** — you already have Twilio, but AuthKit's primary identifier is email, so this needs a shim.

The nullable `Student.userId` / `Student.email` columns added in phase 1 are what make that a feature, not a migration.

---

## 4. Role: one global string → per-membership

`User.role` must die. A person can be a teacher at Coaching Centre A and a parent/student at School B. Role belongs on the **membership**, not the user.

```prisma
model Organization {
  id            String   @id @default(auto()) @map("_id") @db.ObjectId
  workosOrgId   String   @unique
  name          String
  type          String   // 'school' | 'coaching' | 'personal'
  memberships   Membership[]
  // ...
}

model Membership {
  id             String @id @default(auto()) @map("_id") @db.ObjectId
  workosMembershipId String @unique
  userId         String @db.ObjectId
  organizationId String @db.ObjectId
  role           String // mirror of the WorkOS org role slug
  status         String // 'active' | 'inactive' | 'pending'
  @@unique([userId, organizationId])
}
```

**Source of truth: WorkOS.** Roles live in the WorkOS access token, so authorization checks cost zero DB hits. Your `Membership.role` is a **mirror**, kept fresh by events, used only for joins and listing. On any conflict, WorkOS wins and you re-sync. Never let two places both write the role.

Two notes from the WorkOS docs worth respecting:

- Permission slugs go into the session JWT, which is **capped at 4 KB**. Keep slugs short (`q:edit`, not `question_bank:edit_questions`) and don't hand a role 200 permissions.
- Environment-level roles apply everywhere; the moment you create *one* custom role for an org, that org gets its own independent role set and default. Decide early whether every school gets custom roles (flexible, hard to reason about) or you ship a fixed set of environment roles: `admin`, `teacher`, `student`. **I'd start fixed.**

The `TeacherData` / `StudentData` / `CoachingData` 1:1 profile tables are keyed off `User.role`. Once role is per-membership, `CoachingData` is really *organization* data — move those fields onto `Organization`. `TeacherData.school` becomes redundant with the org itself.

---

## 5. Two permission systems colliding

You'll have org roles *and* the existing `FolderCollaborator` ACL (`owner`/`editor`/`viewer`). Without a stated rule these will contradict each other.

**Proposed rule:**

- Org role sets the **baseline**: `admin` = read/write everything in the org; `teacher` = own folders + explicitly shared; `student` = read-only, and only on assigned material.
- `FolderCollaborator` can only **add** permission within the same org — it can never grant across orgs and never grant more than the org role allows for that resource class.
- **Cross-org collaboration is forbidden.** Moot for now — folder sharing was removed on 24 Aug 2026 and folders are single-owner. Reinstate this rule if org-scoped sharing ships: an invitee must have an active membership in the folder's org, or sharing becomes a hole straight through tenant isolation.

If you later want teachers at Centre A to share a question bank with Centre B, that's a deliberate feature (an explicit share/copy), not an accident of the ACL.

---

## 6. The onboarding gate

Your middleware currently gates on `sessionClaims.metadata.onboardingComplete`, which Clerk puts in the JWT from `publicMetadata`. AuthKit's session gives you `user`, `organizationId`, `role`, `permissions` — not arbitrary app metadata by default.

**Recommendation:** stop gating in middleware. Move the check into the `(dashboard)/layout.tsx` server component, where you already have a DB connection and can read onboarding state properly. Middleware then only does "signed in / not signed in", which is what it's good at.

Bonus: `organizationId` being absent from the session is itself a perfectly good "not onboarded yet" signal — an onboarded user always has at least a personal org. That may let you drop the flag entirely.

---

## 7. Provisioning: fix the webhook race while you're here

Your current Clerk webhook does `findUnique` → `create`, and creates users with `role: ""`. Two existing bugs that will get worse with orgs:

- **Race:** the user can land on the app before the webhook fires, and `completeOnboarding` throws `"User not found in database"`.
- **Double-create:** concurrent `user.created` + `user.updated` events can both miss the `findUnique` and both insert.

**Fix as part of the migration:** provision **lazily on first authenticated request** — `prisma.user.upsert({ where: { workosUserId }, ... })` inside `requireOrgContext()`. Webhooks/events become a *reconciliation* mechanism, not the primary path. And use `upsert` everywhere, keyed on `workosUserId`.

WorkOS also offers an **Events API** (cursor-based polling) alongside webhooks, and recommends it for reliability — no missed deliveries, replayable. Worth using for the sync job even if you also take webhooks for latency.

Events you'll need to handle: `user.created/updated/deleted`, `organization.created/updated/deleted`, `organization_membership.created/updated/deleted`, `invitation.created/accepted/revoked`, plus `dsync.*` if you ever turn on Directory Sync.

---

## 8. The satellite apps — likely breakage, check early

`middleware.ts` allowlists `question-editor.vercel.app`, `multi-crop.vercel.app`, `omr-checker.vercel.app` with `Access-Control-Allow-Credentials: true`. That means those apps are calling your API **cross-origin with cookies**.

AuthKit uses a sealed session cookie. Cross-site cookie delivery requires `SameSite=None; Secure`, and browsers are progressively tightening this. **Verify this works before you commit to the approach**, and prefer moving the satellites off cookies entirely:

- Bearer the WorkOS access token, or
- Issue per-satellite API keys and validate them server-side

This is also the right time to fix it — those satellites currently ride on ambient session auth with no org scoping at all, which means once orgs exist they'll be able to read across tenants.

Reminder from `CLAUDE.md`: CORS is configured in **two** places (`middleware.ts` and `netlify.toml`). Update both.

---

## 9. Migration & cutover

**Additive first, destructive last.** Never rename `clerkUserId`.

**Phase 1 — schema, no behaviour change**
Add `User.workosUserId`, `Organization`, `Membership`, and nullable `organizationId` on every resource. Deploy. Nothing reads them yet.

> ⚠️ **`workosUserId` is deliberately NOT `@unique`.** On MongoDB, Prisma creates optional unique fields as a plain `{ unique: true }` index with no `sparse` flag. MongoDB indexes a *missing* field as null, and a unique index permits only **one** document with a null — so `prisma db push` fails on the second existing user, since none of them have the field yet. That's [prisma/prisma#23870](https://github.com/prisma/prisma/issues/23870), **closed as not planned**, so it isn't a version to wait out.
>
> Consequences: use `findFirst({ where: { workosUserId } })`, not `findUnique` — the latter requires `@unique` and won't compile. Uniqueness is guaranteed by WorkOS (its ids are unique by construction) plus upserting on the field in provisioning code. If you want a DB-level guarantee too, `scripts/workos/create-sparse-indexes.ts` adds a partial unique index by hand — but read its warning: `db push` can drop indexes Prisma doesn't know about, so it must be re-run after every push.
>
> The same trap applies to any *other* optional unique field you add later. Required unique fields (`Organization.workosOrgId`, `Membership.workosMembershipId`) are fine — their collections start empty.

**Phase 2 — backfill**
Import users into WorkOS (their user-import API takes email + optional password hash). Ask Clerk for a password-hash export so email/password users don't get locked out; Google/social users just re-link by email and need nothing. Create one personal org per existing user, one membership, and stamp `organizationId` on all their existing rows. Run it idempotently, twice, and diff.

**Phase 3 — auth swap behind a flag**
`clerkMiddleware` → `authkitMiddleware`, `auth()` → `withAuth()`, rewrite the 37 files. Keep both providers installed and switch on an env flag so rollback is one deploy, not one migration.

**Phase 4 — org features**
Invitations, member management, org switcher, role UI, directory sync.

**Phase 5 — cleanup**
Make `workosUserId` and `organizationId` required, drop `clerkUserId`, drop `User.role`, remove Clerk.

**Expect a forced logout at cutover.** Every session dies. Announce it, and do it at a low-traffic hour — for an Indian school product, that's a weekend morning, not a weekday evening.

---

## 10. Multi-org UX

Once a teacher can belong to two orgs, the session carries exactly one active `organizationId`. You need:

- An **org switcher** in the dashboard header. Switching calls `refreshAuth({ organizationId })`, which mints a new session — so any client-side cache (you're on TanStack Query) must be **fully invalidated on switch**, or the teacher sees Centre A's folders under Centre B's header. Key your query keys on `organizationId`.
- A decision on **which org is active at login**. Last-used, stored in a cookie, falling back to the only one / a picker.
- ~~The WebSocket collab server does no authorization~~ — **moot as of 24 Aug 2026: the collaboration feature was removed entirely.** It was fixed first (signed handshake token) and then deleted along with the rest of the feature. Folders are single-owner. If team sharing returns it should be org-scoped (§5), not a per-folder ACL.

---

## 11. Edge cases to have answers for

| Case | Suggested handling |
|---|---|
| Last admin leaves an org | Block removal; require promoting someone first |
| Member removed but owns 40 folders | Transfer to org admin, don't cascade-delete. Ask on removal |
| Invite sent to a typo'd email | Revoke + resend; show pending invites with status |
| Invited person already has an account | WorkOS handles it — they sign in and join. Make sure your event handler upserts rather than creates |
| Gmail-invited teacher signs up with a different address | WorkOS **rejects** it for consumer domains (exact-match required); corporate domains allow any address on the same domain. Say so in the invite email — most Indian teachers will be on Gmail, so this is the common path, not the edge |
| Teacher belongs to two coaching centres | Supported natively. Requires the org switcher in §10 and per-org query-cache keys |
| Org deleted | Soft-delete + retention window. Marks data is the kind of thing schools come back for |
| Support needs to debug a teacher's account | WorkOS impersonation — `withAuth()` returns `impersonator`. Show a banner and block writes |
| User deleted in WorkOS but has authored questions | Tombstone the `User` row, keep authorship. Don't `prisma.user.delete()` — your current webhook does |

---

## 11a. MongoDB: `null` is not the same as "field missing"

**This is the single most dangerous thing in the migration and it is not obvious.** Found by running the phase-2 dry run against production, where it silently matched **nothing** across eight collections while reporting success.

On MongoDB, Prisma's `where: { field: null }` matches documents where the field **exists and is null**. It does **not** match documents where the field is **absent**. Every pre-existing row is in the "absent" state immediately after `db push` adds a new optional field — so a filter that looks obviously correct matches zero rows.

Measured on live data (`scripts/workos/diagnose-backfill.ts`):

| Collection | total | `where: {organizationId: null}` | raw `$exists: false` |
|---|---|---|---|
| User | 34 | 0 | 34 |
| Folder | 14 | 0 | 14 |
| Test | 19 | 0 | 19 |
| PaperHistory | 14 | 0 | 14 |
| TemplateForm | 38 | 0 | 38 |
| Student | 12 | 0 | 12 |
| Question | 5445 | 0 | 5445 |
| SchoolTestQuestion | 338 | 0 | 338 |

**Two consequences, and the second is the one that will bite later:**

1. **The backfill can't filter on `organizationId: null`.** It now fetches rows unfiltered and tests `!row.organizationId` in JS, which catches both absent and null. The collections are small enough that this costs nothing.

2. **Application code can't either.** Once orgs upload their own questions, the read filter for the bank becomes `OR: [{ organizationId: null }, { organizationId: myOrg }]` — and the `null` branch would silently match **none** of the 5445 shared questions. So the backfill now **normalises `Question.organizationId` to an explicit null** (one bulk raw update). Any collection you decide not to stamp needs the same treatment, or "shared" becomes unqueryable.

**Rule going forward:** after adding an optional field to an existing MongoDB collection, either back-fill every row with an explicit value, or query it with `$exists` via `$runCommandRaw`. Never assume `null` reaches the old rows.

---

## 12. Database — RESOLVED: MongoDB

Confirmed Mongo, not Neon. Nothing to do. One useful side effect: on MongoDB, adding nullable fields is free — `prisma db push` writes no data and existing documents simply lack the key, which Prisma reads back as `null`. Phase 1 is therefore a genuinely zero-risk deploy.

The one place Mongo *does* bite is indexes: `db push` builds the `@@unique` on `Student` against live data and **fails if duplicates exist**. That's why the constraint ships commented out (§2).

---

## 13. `Question` — DECIDED: global shared bank

Good call commercially: a new coaching centre gets thousands of questions on day one instead of an empty screen. And it means **zero backfill** — every existing row keeps `organizationId = null`, which the phase-1 schema already reads as "shared".

**DECIDED: you can edit only what you uploaded.** Shared questions are read-only to everyone except admin.

| Question | Who can read it | Who can edit / delete it |
|---|---|---|
| `organizationId = null` — uploaded by admin | every org | **admin only** |
| `organizationId` set — uploaded by an org | that org only | that org |

That's the whole rule. One check on every write:

```ts
// reject if the question isn't yours
if (question.organizationId !== ctx.organizationId) throw forbidden()
// null organizationId means admin-owned — never writable by an org
```

**No copy-on-write, no forking.** An earlier draft proposed cloning a shared question when a teacher edits it. That was solving "a teacher wants to fix a typo in a shared question" — which this decision removes outright. If nobody can edit shared questions, nothing shared ever changes, and the whole class of problems (silent rewrites, tests changing after students sat them, drift between orgs) simply doesn't arise. Simpler is correct here.

**Where the typo problem goes instead.** It doesn't vanish, it becomes a support channel: a teacher spots a bad question and reports it, admin fixes the one canonical copy, and the fix reaches everybody. That's arguably better than each org quietly patching their own copy.

Which makes **`flagged` more important than it looks** — it *is* that channel. Today it's a bare boolean on the shared row gated on `userRole === "coaching"`, so you can see *that* a question was flagged but not who flagged it or why. Since flagging is now the only way an org can say "this question is wrong", it's worth a small table:

```prisma
model QuestionFlag {
  questionId     String
  organizationId String
  userId         String
  reason         String?
  resolvedAt     DateTime?
}
```

Not urgent, but it turns a boolean into an actual admin work queue.

`SchoolTestQuestion` needs no rule change — extracted from a specific school's own paper, always org-owned, always editable by them.

---

## 14. The three unauthenticated mutation paths

This is the part of the `Question` decision that needs action before you sell to a second school. **These are live today, independent of WorkOS.**

**1. `PUT /api/questions/[id]` and `DELETE /api/questions/[id]`** — `app/api/questions/[id]/route.ts` contains **no auth check of any kind**. No `auth()`, no `currentUser`, nothing. It takes an id from the URL and writes every field of that question, or deletes it. It's CORS-enabled for the satellite apps, so it's reachable cross-origin from a browser.

**2. `updateQuestionInDB`** (`actions/question/questionUpdate.ts`) — validates its input carefully with Zod, then updates any question by id with no check on *who* is asking.

**3. `updateQuestion` / `deleteQuestion`** (`actions/question/insert.ts`) — `deleteQuestion(id)` is nine lines with no authorization at all. Worth being explicit: **Next.js server actions compile to public HTTP endpoints.** "It's only called from an admin component" is not access control; anyone who can find the action id can call it.

Today the blast radius is bounded because every user is effectively one trust domain and it's all your own data. **A global bank plus multi-tenant orgs turns each of these into "any customer can delete any other customer's questions."**

### ✅ Done — 2026-08-20

`lib/auth/guard.ts` is the single place this is enforced:

- `requireUser()` / `requireAdmin()` — session-based, resolves the local `User`
- `assertCanMutateQuestion(id, user)` — the §13 ownership rule
- `requireApiActor(request)` — accepts a session **or** `Authorization: Bearer $QUESTION_API_KEY`, constant-time compared

Applied to: `actions/question/insert.ts` (create/update/delete), `actions/question/questionUpdate.ts`, `actions/question/questionBank.ts` (flag actions), `app/api/questions/[id]/route.ts` (PUT/DELETE), `app/api/questions/route.ts` (POST).

**Three further things came out of doing it:**

1. **`selectFlagged` / `toggleFlag` took `userRole` as an argument from the browser** and gated on `userRole === "coaching"`. That is not a check — it's a value the caller picks. Role is now read from the session; the parameter is retained (ignored) so existing callers compile. *Follow-up: drop the parameter from `useToggleQuestionFlag` and `useQuestionActions`.*

2. **`DELETE /api/questions/[id]` deleted first and checked second** — `prisma.delete` throws on a missing row, so the `if (!question) → 404` branch was unreachable, and an unauthorized delete had already happened before anything was validated. Now: look up, check ownership, then delete.

3. **Three mutation hooks didn't type-check** (`useCreateQuestion`, `useDeleteQuestion`, `useUpdateQuestionForm`). The actions returned `{ success: true, … }`, which TS widens to `boolean`, so the result was not a discriminated union and `res.error` was an error on every one. Fixed with `as const` on the success branches.

**Still open, deliberately:** `GET /api/questions` is unauthenticated and serves the entire question bank to any caller. That's a commercial decision rather than a bug — the bank is the product's main asset, and right now it's scrapeable. Worth a decision, but it will need coordination with the satellite tools.

**Sequencing note:** the ownership check needs `Question.organizationId`, which is phase 1. Until then `AuthedUser.organizationId` is hard-coded `null`, so non-admins can't write any question — correct today, since every question is admin-uploaded. When phase 1 lands, fill that field from the WorkOS session and org-owned questions become editable by their owner with no other change.

**New env vars:**

```bash
ADMIN_EMAILS="you@example.com"   # bootstrap: no User row has role="admin" yet
QUESTION_API_KEY="<random>"      # for the satellite tools; unset = session-only
```

---

## Suggested order of work

1. ~~Resolve the Neon/Mongo question~~ ✅ Mongo
2. ~~Decide student identity (§2) and the no-email path (§3)~~ ✅ Option A, no student logins
3. ~~Decide `Question` scoping (§13)~~ ✅ global shared bank, no backfill
4. ~~Auth checks on `actions/question/` + `app/api/questions/*` (§14)~~ ✅ done
5. ~~Phase 1 schema, deployed and idle~~ ✅ applied to Atlas; `Organization` + `Membership` exist
6. Run `check-student-duplicates.ts` against prod, merge what it finds ← **still open**
7. ~~Auth swap (the 38 files)~~ ✅ done — see §15
8. Import users + backfill, dry run first ← **still open**, scripts ready
9. Cross-origin satellite auth (§8) ← **still open** (WebSocket auth struck — feature removed)
10. Cutover
11. Invitations & org management UI (teachers/admins only)
12. *Nice-to-have:* `QuestionFlag` table, so "this question is wrong" reaches admin with a reason attached

Steps 4, 9 and 10 were the three places where multi-tenancy would otherwise leak. Step 4 is done, the WebSocket one went away with the feature, and the satellite fix remains — it doesn't depend on WorkOS and is worth doing regardless.

---

## 15. The auth swap — DONE 2026-08-23

Clerk is gone: `@clerk/nextjs` and `svix` are uninstalled and no file imports either. `bun run build` passes, `tsc --noEmit` is clean, lint reports only pre-existing warnings.

**The shape of it.** Rather than rewriting 38 bespoke Clerk call sites, everything routes through one module:

- **`lib/auth/session.ts`** — `getAuthContext()` is the single server-side answer to "who is asking, for which org". It calls `withAuth()`, upserts the local `User` **keyed on email**, resolves the active org, and returns `AuthContext`. `requireAuth()` / `requireOrgContext()` / `requireAdmin()` wrap it.
- **`lib/auth/provisionOrg.ts`** — `ensurePersonalOrg()` (silent, lazy) and `provisionOrganizationForOnboarding()` (named from the setup form). Idempotent locally via `Organization.ownerUserId` and in WorkOS via `externalId`.
- **`lib/auth/guard.ts`** — unchanged public API, now delegating to the above. `AuthedUser.organizationId` is no longer hard-coded `null`, so the §13 ownership rule is fully live.
- **`hooks/auth/useCurrentUser.ts`** — client adapter over AuthKit's `useAuth`, keeping the `isLoaded` / `user.fullName` / `user.imageUrl` shape components already used.

**Email is the cutover seam.** `getAuthContext()` matches an arriving WorkOS user to an existing local row by email and stamps `workosUserId` onto it. That means a user who simply signs in post-cutover is adopted automatically — the import script is about determinism, not correctness. It is also what makes the folder-invite placeholder rows (`clerkUserId: placeholder_…`) converge on one `User` row when the invitee finally signs up.

**Hosted AuthKit, not custom UI.** `hooks/auth.ts` (327 lines), `hooks/forgotPass.ts`, `components/auth/AuthForm.tsx`, `components/CustomAuth.tsx` (already dead), `components/authRedirect.tsx` and `app/auth/sso-callback/` are deleted. `/auth/signin`, `/auth/signup` and `/auth/forgot-pass` are now three-line redirects to the hosted page; `/auth/callback` runs `handleAuth()`. Email/password, Google, Apple, MFA and password reset are all dashboard configuration now. The Cloudflare Turnstile script went too — it was loaded on every `/auth` page and no component ever rendered a widget.

**Onboarding.** The Student card is gone from `constant/on-boarding/user-type.ts`, and `completeOnboarding` rejects `role=student` outright. `Student`, `StudentData` and `/onboarding/student/setup` are all left in place for when student logins are switched on. Both remaining paths create an org silently — a solo teacher's is named after the school they typed, `type: 'personal'`; a centre's after `centerName`, `type: 'coaching'`.

**The onboarding gate moved** (§6). Middleware only answers signed-in-or-not. `app/(dashboard)/layout.tsx` reads `ctx.onboardingComplete`, which is `User.role !== ""` — DB state, not a JWT claim.

**Webhooks inverted** (§7). `app/api/webhooks/clerk/` is replaced by `app/api/webhooks/workos/`, which is reconciliation only — every handler is an upsert or a no-op-if-missing, so replays are safe and the create/update race is structurally impossible. `user.deleted` **tombstones** via a new `User.deletedAt` rather than calling `prisma.user.delete()`, which would have cascaded away authored questions, folders and tests (§11).

### 15a. A data bug found on the way

**`TemplateForm.userId` has never held what the schema says it holds.** It is declared as a relation to `User.id`, but all 38 production rows store a *Clerk* id (`user_31Ay…`), because `actions/templates/pdfTemplateForm.ts` wrote `auth().userId` straight into it. `include: { user: … }` has therefore never resolved for any row.

That action now writes the local `User.id` — it has to, there is no Clerk id any more. **This makes the backfill mandatory rather than optional:** until step 4c of `backfill-orgs.ts` remaps those 38 rows, every pre-existing template is invisible to its owner.

### 15b. Still open, deliberately

- ~~**The WebSocket collab server does no authorization at all**~~ — resolved by deletion: the whole collaboration feature was removed on 24 Aug 2026.
- **`GET /api/questions` is unauthenticated** and serves the whole bank (§14). Commercial decision, still unmade.
- **Satellite apps** still ride on ambient cookies (§8). `QUESTION_API_KEY` and `requireApiActor` are the migration path and are ready; the satellites have not been switched over.
- **Org switcher / multi-org UX** (§10) — not needed until a person belongs to two orgs, which invitations will introduce.
- **`Student` duplicate merge** (§2, step 6) — `check-student-duplicates.ts` has still never been run against prod, so the `@@unique([organizationId, className, rollNumber])` constraint stays commented out.

---

*Sources: [WorkOS AuthKit — Invitations](https://workos.com/docs/authkit/invitations), [WorkOS — Roles and Permissions](https://workos.com/docs/user-management/roles-and-permissions), [workos/authkit-nextjs](https://github.com/workos/authkit-nextjs/blob/main/README.md)*
