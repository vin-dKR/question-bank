# Multi-org for teachers — problem framing and tickets

Companion to `docs/WORKOS_MIGRATION_APPROACH.md` §10 (which sketched this) and
`docs/ROSTER_TICKETS.md` (which this file continues — ticket numbering picks up
at T-22). The migration doc said the org switcher was "not needed until a person
belongs to two orgs, which invitations will introduce."

**Invitations shipped. That day has arrived, and it arrived without the UI.**

---

## 0. TL;DR

`inviteMember()` is live in `actions/organization/settings.ts`. The moment a
coaching-centre admin invites a teacher who already has an Eduents account, that
human has two `Membership` rows — and the app has no way to show them the second
one. `getAuthContext()` silently pins them to whichever membership is *oldest*,
which is almost always their own personal workspace. From the teacher's side the
invitation appears to have done nothing.

So this is not a "nice enhancement to add alongside invitations". **It is the
missing half of a feature that is already in production.**

There is a second, larger truth underneath it: today only the **roster** domain
filters by `organizationId`. Questions, folders, drafts, tests, paper history and
templates still filter by `userId`. An org switcher shipped on top of that would
change the label in the header and almost nothing else — same folders, same
papers, same templates, under two different institution names. The switcher is
the visible part; org-scoping the reads is the actual work.

---



## 1. Verified current state

Everything in this section was read out of the code, not assumed.


| Thing                                                          | State                        | Where                                                                           |
| -------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------- |
| Invite a teacher into an org                                   | **Works**                    | `actions/organization/settings.ts` `inviteMember`                               |
| Multiple `Membership` rows per user                            | **Supported by the schema**  | `@@unique([userId, organizationId])`                                            |
| Role is per-org, not per-person                                | **Modelled correctly**       | `Membership.role`; `User.role` already marked DEPRECATED                        |
| Choosing which org is active                                   | **Implicit and wrong**       | `lib/auth/session.ts`                                                           |
| Any UI that names the active org                               | **None outside** `/settings` | `components/dashboard/content/Header.tsx`                                       |
| `switchToOrganization` / `refreshSession({organizationId})` | **Available**                | `@workos-inc/authkit-nextjs@4.3.1` exports both                                 |
| Query cache keyed on org                                       | **No**                       | `['questions', …]`, `['tests', …]`, `['testAnalytics', …]`, `['filterOptions']` |
| Question bank, two-tier rule | **Write side built, read side missing** | `lib/auth/guard.ts`, `actions/question/questionBank.ts` |
| Leave an org yourself                                          | **No path**                  | `removeMember` is admin-only and refuses self                                   |
| Create a second org                                            | **No path**                  | only via signup/onboarding                                                      |
| See invitations addressed to you                               | **No path**                  | invitations are listed per-org, for admins                                      |




### 1.1 The silent pin

`loadAuthContext()` resolves the active org in this order:

1. `session.organizationId` — what the access token was minted against
2. else `membership.findFirst({ status: 'active' }, orderBy: { createdAt: 'asc' })`
3. else create a personal org

Step 2 is the bug. A teacher who signed up in March and got invited to a centre
in August has their **March personal workspace** as the permanent answer, and no
mechanism exists to ever produce a different one. Step 1 only helps on the single
request right after an AuthKit org-scoped sign-in; a plain re-login falls back to
step 2.

### 1.2 Invitation acceptance creates a second, junk org

A brand-new teacher accepts a centre's invitation:

1. WorkOS creates the user and the membership in the centre.
2. First request hits `app/(dashboard)/layout.tsx`, which redirects on
  `!ctx.onboardingComplete` — true, because `User.role` is empty.
3. They fill in the teacher form, typing their school's name.
4. `completeOnboarding` → `provisionOrganizationForOnboarding` →
  `findFirst({ where: { ownerUserId } })` finds nothing (they own no personal
   org — the membership came from the invite) → **creates a brand new WorkOS org
   and local** `Organization`.

The invited teacher now belongs to two orgs, one of which is an accident, and
`ensureLocalMembership` makes them its admin. This fires today, on the live
invite flow, with no switcher involved.

### 1.3 Only the roster is org-scoped

`requireOrgContext()` appears in exactly six action files, five of them roster:

```
actions/organization/settings.ts
actions/roster/{classes,enrollment,import,testRoster,attendance}.ts
```

Meanwhile:


| Read                 | Filter                          | File                                           |
| -------------------- | ------------------------------- | ---------------------------------------------- |
| Folders              | `where: { userId: ctx.userId }` | `actions/drafts/draft.ts:115`                  |
| Paper history        | `where: { userId: user.id }`    | `actions/paperHistory/paperHistory.ts:69`      |
| PDF templates        | `where: { userId }`             | `actions/templates/pdfTemplateForm.ts:91`      |
| Tests                | `where: { createdBy: user.id }` | `actions/examination/test/crudTest.ts:166`     |
| `GET /api/questions` | **no tenancy filter at all**    | `app/api/questions/route.ts:69` (this is T-07) |


Every one of those rows already *has* an `organizationId` column. Nothing reads
it. This is the ownership rule from migration doc §1 — "`organizationId` is the
authorization key, `userId` means who authored it" — stated but not yet enforced
outside the roster.

**Read this in both directions.** Not org-scoping is a leak *today* if two
teachers in one centre expect to share a question bank and don't. And it becomes
a leak in the other direction the moment one teacher belongs to two centres:
Centre A's papers listed under Centre B's header.

### 1.4 Nothing is keyed on org, including localStorage

On switch, these all survive and are wrong:

- every TanStack query key (`hooks/queries/*`)
- `qb:selectedQuestions`, `qb:showOnlySelected` (`hooks/question/usePersistentSelection.ts`)
- Command palette recents (`components/dashboard/CommandPalette.tsx`)

A teacher mid-paper in Centre A, who switches to Centre B, would carry a
selection of Centre A's question ids into Centre B's paper builder.
### 1.5 The question bank: write side built, read side missing

**Confirmed 25 Aug 2026.** Two tiers, one bank:

- **Global** (`Question.organizationId = null`) — admin-uploaded. Every org
  READS it. No org WRITES it. This is essentially the whole bank today: 5,445
  rows, all null.
- **Org-private** (`organizationId = <org>`) — uploaded by that org. Only that
  org reads or writes it.

A teacher in two institutions sees **the same global bank in both**, plus
exactly one institution's private questions depending on which org is active.
The personal workspace is an org like any other, so questions a teacher uploads
while solo stay in the personal workspace and do **not** follow them into a
centre.

This is not a new decision — it is the `DECIDED` comment on `Question` in
`prisma/schema.prisma` and migration doc §13, now confirmed as product intent.
And most of it is already built:

| Piece | State |
|---|---|
| Stamping on create | **Done.** `insert.ts:42` — `user.isAdmin ? null : user.organizationId` |
| Ownership on edit/delete | **Done.** `assertCanMutateQuestion` in `lib/auth/guard.ts` |
| Caller can't hand a question to another org | **Done.** `insert.ts:64` strips `organizationId` from the payload |
| API-route edit/delete | **Done for user actors.** `app/api/questions/[id]/route.ts` |
| Explicit-null backfill | **Done 23 Aug.** All 5,445 rows normalised (T-02 Part A) |
| **Read filter** | **Does not exist. Anywhere.** |

`buildQuestionWhere()` in `actions/question/questionBank.ts` never mentions
`organizationId` — not in `getQuestions`, not in `getQuestionCount`, not in the
three filter-option queries, and not in `GET /api/questions`.

**So the careful stamping on the write side is currently decorative.** The first
question an org uploads is correctly marked as theirs — and then shown to every
other org in the product, because nothing filters on it. The only thing
preventing a cross-tenant leak today is that no org has uploaded one yet. That
is a race against your own roadmap, not a safeguard.

It is **T-30**, and it does not wait for the switcher.


---


---



## 2. Who this is for

**Priya — teaches at two coaching centres.** Physics at one on weekday
evenings, another on weekends. Both invited her. She wants one login and a clean
line between the two: papers she builds for one must not show up at the other,
and the institution name on the PDF header must be right without her thinking
about it. *Today: she sees one of them, and it's probably neither.*

**Rakesh — centre admin who invited her.** He wants to know his invitation
landed, and that when she leaves he can cut access without losing the papers she
wrote for his centre. *Today: he can invite and remove; the removal semantics are
already right (content stays with the org).*

**Anjali — solo teacher who later joins a centre.** She has a personal
workspace with two years of her own question bank. Joining a centre must not
absorb her personal work into it, and must not hide it either. *Today: joining
does nothing visible; if the reads get org-scoped without a switcher, joining
would make her own bank vanish.*

**Vikram — starts his own centre while still teaching at another.** Needs to
create a second institution from inside the app. *Today: impossible without a
second email address.*

---



## 3. Product decisions

These are the calls I'd make. Each has the alternative written down so it can be
overruled deliberately rather than by accident.

**D1 — Which org is active at login: last used.**
Store the last active `workosOrgId` in a cookie, validated against live
memberships on read (a stale cookie pointing at an org you were removed from must
fall back, not 403). Fall back to: the only real org → most recently joined org →
personal workspace. *Alternative: an org picker screen at every login. Rejected —
punishes the 95% of users with one org to serve the 5%.*

**D2 — The personal workspace is always visible in the switcher, and named.**
`Organization.type = 'personal'` renders as "Personal — your own question bank",
visually separated from institutions. *Alternative: hide it once you join a real
org. Rejected — Anjali's two years of work would appear to have been deleted.*

**D3 — Switching changes what you SEE, never who OWNS what.**
No content moves between orgs, ever, in v1. A question authored in the personal
workspace stays there. *This closes the most expensive possible bug class before
it opens.* Copying a question between orgs is a deliberate future feature
(§5, out of scope), not a side effect of switching.

**D4 — Role is per-org and must be visible.**
Priya can be `admin` at one centre and `member` at another. The switcher shows
her role in each. `ctx.role` already comes from the session/membership, so this
is display work, not model work. `User.role` stays deprecated and is used only
for the onboarding gate until T-21.

**D5 — A teacher can create a second institution themselves.**
"Create an institution" from the switcher, reusing
`provisionOrganizationForOnboarding` with `type: 'coaching'`. Cheap, and it's the
only self-serve path for Vikram. *Alternative: invite-only org creation. Rejected
— it makes "I started my own place" a support ticket.*

**D6 — A teacher can leave an institution themselves.**
Same guard as `removeMember`: blocked if you are the last admin. Leaving does not
touch content. *Alternative: admin-removal only. Rejected — a teacher who quits a
centre should not need that centre's admin to stop seeing its data, and the
centre should not need the teacher's cooperation either.*

**D7 — One active org per session, not a merged view.**
No "all my institutions" combined dashboard. Every query stays single-tenant,
which is what keeps the authorization rule checkable by reading one `where`
clause. *Alternative: cross-org aggregate views. Rejected for v1; it defeats §1.*

---



## 4. In scope

- Correct resolution of the active organization, with a durable, validated choice
- An org switcher in the dashboard header, with role and type shown
- Full client-state reset on switch (query cache **and** localStorage)
- Org-scoping the reads that a switcher would otherwise lie about
- Invitation acceptance that does not manufacture a junk org
- A place to see and accept invitations addressed to you
- Self-serve create-institution and leave-institution
- Institution name flowing to PDF headers from the *active* org



## 5. Out of scope (write it down so it doesn't creep in)

- Moving or copying content between orgs
- Cross-org search or a merged dashboard
- Per-org billing or plans
- SSO / SAML / directory sync (WorkOS supports it; no customer asks for it)
- Students in multiple orgs — students aren't accounts (doc §3); a student in two
centres is two `Student` rows, which is correct
- Org deletion UI (soft-delete semantics exist in the webhook; no UI needed yet)

---



## 6. Flows

**F1 — Existing user is invited.** Rakesh invites `priya@gmail.com`, who has an
account. She gets the WorkOS email, clicks, signs in. She lands on the dashboard
**scoped to the centre**, with a one-time banner: "You've joined Sunrise Academy.
Switch back to your own workspace any time from the top right." Her personal
workspace is untouched and one click away.

**F2 — New user is invited.** Same, except onboarding runs first. Onboarding
**must detect the existing membership** and: skip the institution question
entirely, skip org creation, collect only the personal profile fields, and set
`User.role`. The teacher never types an institution name they don't own.

**F3 — Switching.** Header → institution name + chevron → list of memberships
with role → pick one → `switchToOrganization()` mints a new session → the client
cache and the org-scoped localStorage keys are cleared → the app reloads on the
same route if it's org-neutral (`/dashboard`), or on the domain root if it isn't
(`/classes/abc123` in the old org must not 404 in the new one — send them to
`/classes`).

**F4 — Creating an institution.** Switcher → "Create an institution" → name +
type → provisioned via the existing path with the creator as admin → switched
into automatically → lands on the invite screen, because the next thing you want
is your colleagues.

**F5 — Leaving.** Settings → your membership row → "Leave institution" →
confirm dialog naming what happens to content ("Papers and questions you created
stay with Sunrise Academy") → membership deleted in WorkOS then locally →
switched to the fallback org.
## 6a. The invitation flow, screen by screen

### Who sends the email — WorkOS, and it should stay that way

`inviteMember()` calls `userManagement.sendInvitation()`, and **WorkOS sends the
email**. There is no suppression flag on that call (`SendInvitationOptions` is
`email`, `organizationId`, `expiresInDays`, `inviterUserId`, `roleSlug`,
`locale`), so sending our own on top would mean the invitee gets two emails with
two links. WorkOS also owns the token and the accept URL, so our copy would have
to embed a link only WorkOS can mint.

**Recommendation: brand the WorkOS template in the WorkOS dashboard. Write no
email-sending code for this.**

For the record, the two email paths already in the repo are both traps:

- `lib/email/emailService.ts` — nodemailer over Gmail SMTP, **zero callers**, and
  it sets `from` to the *signed-in user's* address while authenticating as
  `EMAIL_USER`. That fails SPF/DKIM and lands in spam. Don't reach for it.
- `resend` is in `package.json` and is **never imported** anywhere.

Neither should be wired up for invitations. Clean them up separately, or delete.

### What the two sides see today

| Moment | Inviter sees | Invitee sees |
|---|---|---|
| Invite sent | Toast + a pending row: email, expiry date | WorkOS's unbranded email |
| Invitee is already a member | "That person is already a member." | — |
| Invited twice | **A second invitation, silently** | Two emails |
| Invitee accepts | **Nothing. Row vanishes from the pending list.** | `/dashboard`, no acknowledgment at all |
| Invitee is new | Nothing | Onboarding, asking them to name an institution they're joining (T-22) |
| Invite expires | **Nothing. Row vanishes.** | A dead link, WorkOS's error page, no next step |
| Wrong Gmail address used | Nothing | WorkOS rejects; our warning was in the invite form the admin saw, not in the email they got |

The pattern: `getOrganizationSettings` filters `state === 'pending'`, so **every
terminal state is invisible**. An admin cannot distinguish "they accepted",
"it expired", and "I never actually sent it". That is the whole complaint.

### What we're not using

`Invitation` already carries `roleSlug`, `inviterUserId`, `acceptedAt`,
`createdAt`, `state` and `acceptInvitationUrl`. We map four fields and throw the
rest away. `userManagement.resendInvitation(id)` exists — no revoke-and-resend
dance needed. And WorkOS emits `invitation.created` / `.accepted` / `.revoked` /
`.resent`; our webhook's `HandledEvent` union lists none of them.

Nearly all of the fix is displaying data we already fetch.

### The invitee's landing problem

`handleAuth({ returnPathname: "/dashboard" })` is static, and the accept URL is
WorkOS's — we cannot thread `?joined=<org>` through it. So the welcome state has
to be inferred: on first authenticated request, if the active org is a real
(non-personal) org and its `Membership.createdAt` is within the last few minutes,
show a one-time welcome. `Membership.createdAt` already exists; nothing new is
needed in the schema.

**Copy it should carry:** which institution they joined, what role they have,
that their own workspace still exists and how to get back to it. That last
sentence is what stops "joining a centre deleted my question bank" support
tickets before they happen.

---



---



## 7. Requirements

Numbered so tickets and tests can cite them.

**R1** The active organization must be an explicit, persisted choice, not the
oldest membership by `createdAt`.

**R2** The persisted choice must be validated against active memberships on
every read; an invalid one falls back silently rather than erroring.

**R3** Every dashboard page must name the active institution somewhere
persistent, whether or not the user has more than one.

**R4** The switcher must be hidden for users with exactly one membership, except
for its "Create an institution" entry.

**R5** Switching must fully reset client state: `queryClient.clear()` plus the
org-scoped localStorage keys. No query key may outlive a switch.

**R6** Query keys for org-scoped data must include the org id, so that a missed
reset degrades to a cache miss rather than to cross-tenant display.

**R7** Onboarding must not create an organization for a user who already has an
active membership.

**R8** Every read of Folder, Test, PaperHistory and TemplateForm must filter on
`organizationId`, not on `userId` / `createdBy` alone.

**R8a** Every read of Question must filter on
`organizationId IN (null, <active org>)` — the global bank plus this org's own
uploads, and nothing else. This is the one model where a null org is a grant,
not a gap.

**R9** Every write to those models must stamp `organizationId` from the auth
context, never from client input.

**R10** A user must be able to see invitations addressed to their email from
inside the app, not only from the invitation email.

**R11** A user must be able to leave any org where they are not the last admin.

**R12** A user must be able to create a new institution and become its admin.

**R13** Role must be displayed per-org wherever a membership is listed.

**R14** The institution name on generated PDFs must come from the active org.

**R15** Removing a member, or a member leaving, must never delete or reassign
content. (Already true in `removeMember`; must stay true.)

**R16** No org may write a global question. Flagging is the sole exception and
must be recorded per-org, not as a shared boolean.

**R17** A service-key API actor must resolve to an explicit organization before
it may create a question, or it will silently publish an org's private uploads
into the global bank.

**R18** The invitation email is sent by WorkOS. No second email path may be
added for invitations.

**R19** An admin must be able to see every invitation's terminal state —
accepted, expired, revoked — not only pending ones.

**R20** An admin must be able to resend and to copy an invite link without
revoking first.

**R21** Inviting an address with an invitation already pending must offer to
resend rather than silently creating a second invitation.

**R22** A user who has just joined an organization must be told which one, in
what role, and that their own workspace still exists.

---



## 8. Tickets

Continuing the numbering in `docs/ROSTER_TICKETS.md`. Sizes: `S` under half a
day · `M` one to two days · `L` three to five days.

### T-22 — Stop onboarding from creating a junk org for invitees

`S` · **Blocks:** nothing · **Depends on:** nothing · **Satisfies:** R7

> **DONE — 25 Aug 2026.** The guard is `findJoinedOrg()` in
> `lib/auth/provisionOrg.ts`: if the user has an active membership in an org
> they do not own, `provisionOrganizationForOnboarding` adopts it and returns
> instead of creating. That is the whole fix — an invitee owns no personal org,
> so the existing `findFirst({ ownerUserId })` found nothing and fell through to
> "create", handing them a spurious second organization named after whatever
> they typed and making them its admin.
>
> **The ownership test is done in JS on purpose.** `ownerUserId` is absent on
> real school/coaching orgs, and a Prisma `{ not: userId }` filter against an
> ABSENT field on MongoDB is exactly the null-is-not-missing trap that made the
> phase-2 backfill match nothing (doc §11a). A user has a handful of
> memberships; filtering in memory means the trap cannot fire.
>
> The UI stopped asking too, via `getJoinedOrganization()`:
> `/onboarding/user-type` shows invitees a single "You've been invited to X"
> card instead of the two account-type choices, and the teacher setup form
> replaces the School/Institution input with a read-only line and drops it from
> validation. `TeacherData.school` is filled from the real institution name, so
> the profile stays truthful.
>
> Routing an invitee straight to the teacher form also avoids a loop: the setup
> page bounces anyone whose store role isn't `teacher` back to `/user-type`, so
> a redirect from the layout would have ping-ponged. The join card sets the role
> before navigating.

**Why now.** This fires on the live invite flow today, before any switcher
exists. Every teacher invited to a centre right now gets a spurious second
organization and is made its admin.

**Do**

1. In `completeOnboarding`, check for an existing active `Membership` before
  provisioning. If one exists, set `User.role` and the profile row, and return.
2. In the onboarding UI, when the user arrived via an invitation, drop the
  institution/centre-name step and say which institution they're joining.
3. Add the same guard inside `provisionOrganizationForOnboarding` — it is a
  `"use server"`-adjacent helper reachable from more than one caller, so the
   check belongs there too, not only at the call site.

**Traps**

- The guard must be "has an active membership", not "has a personal org".
`ensurePersonalOrg` never ran for an invitee, so `ownerUserId` finds nothing —
which is exactly why the current code creates a second org.
- Don't skip `User.role`: it is the onboarding gate in
`app/(dashboard)/layout.tsx`, and an invitee who skips it loops forever.

**Done when**

- [ ] Accepting an invitation as a brand-new user produces exactly one `Organization`
- [ ] That user's membership role is what the inviter chose, not `admin`
- [ ] Solo signup is unchanged

---



### T-23 — Explicit active-org resolution

`M` · **Blocks:** T-24 · **Depends on:** nothing · **Satisfies:** R1, R2

> **DONE — 26 Aug 2026.** `lib/auth/activeOrg.ts` holds the `eduents_last_org`
> cookie (httpOnly, lax, one year); `loadAuthContext()` resolves in order:
> session org → **validated** cookie → the only org → most recently joined REAL
> institution → personal. Step 4 is the actual fix — the old code stopped at
> `findFirst({ orderBy: { createdAt: 'asc' } })`, the OLDEST membership, so
> anyone invited after signing up was pinned to their own personal workspace
> permanently.
>
> **The cookie is a hint, never a grant.** Every candidate is selected from the
> membership list loaded in the same request, so a tampered or stale value can
> only pick between orgs the caller already belongs to, and one naming an org
> they were removed from falls through silently instead of 403ing every page.
>
> **Cookies can only be WRITTEN from a server action or route handler**, and
> `getAuthContext()` runs in layouts — so it only ever reads, and the write lives
> in `handleAuth({ onSuccess })` at `/auth/callback`. That is what makes
> accepting an invitation stick: WorkOS scopes *that* sign-in to the inviting
> org, so the id arrives there; ordinary sign-ins carry none.
> `rememberLastOrg` / `forgetLastOrg` are exported ready for T-24 and T-29.
>
> `AuthContext.memberships[]` now carries every org with its per-org role, from
> one indexed query — what the switcher needs, minus a second fetch. It contains
> `workosOrgId`, so don't hand it to a client component wholesale.
>
> One subtlety worth keeping: when we resolve to an org the session didn't name,
> `ctx.role` comes from the MEMBERSHIP, not the session. The session's role was
> minted against a different org, and carrying it across would grant this org's
> pages the other org's role.

**Why now.** Nothing else in this doc can be built on `orderBy: createdAt asc`.

**Do**

1. Add a `last_org` cookie (httpOnly, sameSite lax) written on switch and on
  sign-in.
2. Rewrite the resolution order in `loadAuthContext()`: session org →
  validated cookie → single active membership → most recent real (non-personal)
   membership → personal → create personal.
3. Return `memberships[]` on `AuthContext` (id, name, type, role) — the switcher
  and the header both need it and it's one indexed query.

**Traps**

- Validate the cookie against a live membership query every request. A user
removed from an org must not keep its id as their active context.
- `getAuthContext` is wrapped in `cache()` — the extra query is per-request, not
per-call. Keep it inside.
- Don't widen `AuthContext` with anything a client component receives directly;
it carries the WorkOS org id.

**Done when**

- [ ] A user in two orgs lands in the one they last used
- [ ] Deleting the cookie is harmless
- [ ] A cookie naming an org you were removed from falls back silently

---



### T-24 — Org switcher in the header

`M` · **Depends on:** T-23 · **Satisfies:** R3, R4, R5, R13

> **DONE — 26 Aug 2026.** `components/organization/OrgSwitcher.tsx`, in the
> header where the breadcrumb previously read the hardcoded word "Workspace" —
> accurate only while nobody could belong to two institutions. Grouped
> Institutions / Personal, each row showing the per-org role, a check on the
> active one.
>
> **`switchToOrganization` redirects by default** — it calls Next's `redirect()`,
> which throws — so the cookie write and the response after it would never have
> run. `revalidationStrategy: 'none'` hands control back, which is required for
> both halves of a correct switch: `rememberLastOrg()` server-side, and the
> CLIENT clearing its state before navigating.
>
> The client does `queryClient.clear()`, removes the three localStorage keys that
> are not namespaced by org (`qb:selectedQuestions`, `qb:showOnlySelected`, the
> command-palette recents), then does a **full page load** — not `router.push`.
> A soft navigation keeps the TanStack cache and the React tree alive across a
> session change, which is exactly how Centre A's folders end up under Centre B's
> name.
>
> Destination is always `/dashboard`, never the current path: ids in the URL
> (`/classes/[classId]`, `/examination/tests/[testId]`) belong to the org being
> left and 404 in the one being entered, which reads as the switch having failed.
>
> Membership is proved from the SERVER's list, not the caller's claim — this is a
> public endpoint, and without that check an org id in the request body would be
> enough to enter any organization in the system.
>
> **Deviation from R4.** The requirement said hide the switcher for
> single-membership users. It renders regardless, because it is also the only
> route to "Create an institution"; with one org the trigger reads as a label
> until opened.

**Why now.** The visible feature. Deliberately sequenced *after* T-23 and
alongside T-25 — see §9.

**Do**

1. Org name + chevron in `components/dashboard/content/Header.tsx`, next to the
  avatar menu. Single-membership users see the name as plain text.
2. Dropdown: memberships grouped as Institutions / Personal, each with role;
  "Create an institution"; "Institution settings".
3. `switchOrganization(orgId)` server action → verify membership →
  `switchToOrganization()` → set `last_org` → redirect.
4. Client: `queryClient.clear()` and clear `qb:selectedQuestions`,
  `qb:showOnlySelected`, and the command-palette recents key before the reload.

**Traps**

- `switchToOrganization` and `refreshSession` are both exported from
`@workos-inc/authkit-nextjs@4.3.1`. Do not hand-roll a token refresh.
- The action is a public endpoint: verify the caller's membership in the target
org server-side. "Only the dropdown calls it" is not access control.
- Redirect off any id-bearing route (`/classes/[classId]`, `/examination/[id]`)
to its domain root. Those ids do not exist in the new org.
- A `"use server"` module may only export async functions — put the org-shape
types in a sibling module, as `actions/organization/types.ts` already does.

**Done when**

- [ ] Switching changes the roster, the class list and the header name together
- [ ] No stale data from the previous org is visible after a switch
- [ ] A user with one org sees a name, not a dropdown

---



### T-25 — Org-scope the remaining reads and writes

`L` · **Depends on:** T-08/T-09 backfill · **Satisfies:** R8, R9, R14

> **DONE — 26 Aug 2026.** `organizationId` is now the access key for every one
> of these. Tests and the analytics reads were already migrated in the working
> tree; this change did paper history, templates and folders, plus the
> institution-name default.
>
> **Drafts are the deliberate exception: org-scoped AND author-private.**
> `draftScope()` in `draft.ts` filters on BOTH, and the two halves do different
> jobs — the org is the authorization boundary (without it, a teacher in two
> institutions sees the drafts they built at one while working in the other),
> and `userId` is a visibility rule *inside* that boundary. Papers, templates and
> the question bank are shared between colleagues; a half-built paper isn't the
> same artefact as a finished one. If drafts ever become shareable, relax the
> `userId` half — the org half stays either way.
>
> **The guards all had to be tightened from `if (!ctx)` to
> `if (!ctx?.organizationId)`.** This is not defensive padding: an `undefined` in
> a Prisma `where` is DROPPED, not treated as null, so a caller with no
> organization would have had the condition silently removed and received **every
> row in the collection**. The failure mode of getting this wrong is the exact
> leak the ticket exists to close.
>
> Two smaller things: `folder.create` had to use `organization: { connect }`
> rather than the scalar FK, because Prisma rejects a scalar FK alongside a
> nested `connect` in the same create; and `TemplateForm.institution` /
> `PaperHistory.institution` now default to the active org's name, which finishes
> **T-20**.
>
> The only `userId`-keyed reads left in `actions/` are the `TeacherData` /
> `CoachingData` upserts in `completeOnboarding` — per-person profile rows, which
> is correct.
>
> **NOT VERIFIED against real data.** T-02 Part B reports zero unstamped rows
> across folders, tests, paper histories and templates, so this should be clean —
> but any row the backfill missed is now invisible to its owner. Count each
> collection before and after on production before trusting it.

**Why now.** **This is the real prerequisite for the whole feature**, and it is
worth more than the switcher on its own — it is also what makes a shared
question bank actually shared between colleagues in one centre.

**Do**

1. `actions/drafts/draft.ts` — folders by `organizationId`.
2. `actions/paperHistory/paperHistory.ts` — paper history by `organizationId`.
3. `actions/templates/pdfTemplateForm.ts` — templates by `organizationId`.
4. `actions/examination/test/crudTest.ts` — tests by `organizationId`, not
  `createdBy`.
5. Every corresponding write stamps `organizationId` from `requireOrgContext()`.
6. PDF/template institution name reads from the active org (finishes T-20).

**Traps**

- **Mongo** `null` **is not "missing".** `where: { organizationId: null }` matches
zero pre-backfill rows. Confirm the T-09 backfill actually stamped these
collections before flipping any read, or teachers lose sight of their own
content on deploy.
- Switch from `getAuthContext()` to `requireOrgContext()` in these files so the
null-org case is a clear error rather than an unfiltered query.
- `GET /api/questions` has no tenancy filter at all — that is **T-07**, and it
must land with this, or the satellite tools become the leak instead.
- Satellite apps ride ambient cookies (doc §8). Once a teacher can switch orgs,
"which org is the cropper writing into" becomes a real question. T-06's
`QUESTION_API_KEY` path is the answer; note it, don't solve it here.

**Done when**

- [ ] Two teachers in one centre see the same folders, questions and papers
- [ ] A teacher in two centres sees neither one's content in the other
- [ ] No read path in `actions/` filters on `userId` alone except profile rows

---



### T-26 — Key query caches on organization

`S` · **Depends on:** T-23 · **Satisfies:** R6

> **DONE — 26 Aug 2026.** `provider/ActiveOrgProvider.tsx` carries the active
> org id to client components; `useOrgKey()` feeds it into the five query hooks.
>
> **The org segment sits LAST in every key, and that placement is load-bearing.**
> TanStack matches invalidation keys by PREFIX, and every mutation in
> `hooks/queries/mutations/*` invalidates with `{ queryKey: ["questions"] }`.
> Putting the org id in front — which is what reads naturally, and what I wrote
> first — makes that prefix stop matching, so every optimistic update silently
> stops refetching. No error, no symptom, until stale data is on screen.
>
> Only the local `Organization.id` crosses to the client. The WorkOS org id stays
> server-side.

**Do** Thread the active org id into every org-scoped query key in
`hooks/queries/*` (`['questions', orgId, …]`, `['tests', orgId, …]`,
`['testAnalytics', orgId, …]`, `['filterOptions', orgId]`) and into the
matching `invalidateQueries` calls in `hooks/queries/mutations/*`.

**Traps**

- This is belt *and* braces with T-24's `queryClient.clear()`. Keep both: the
clear handles the switch, the key handles everything that forgets to clear.
- The mutation files match on prefix (`{ queryKey: ["questions"] }`), which keeps
working with a longer key — verify rather than assume, especially in the
optimistic `setQueriesData` paths.

**Done when**

- [ ] Every org-scoped key contains the org id
- [ ] Devtools show no cross-org key reuse after a switch

---



### T-27 — "Invitations for you"

`M` · **Depends on:** T-23 · **Satisfies:** R10

**Why now.** Right now an invitation exists only as an email. Lost email, dead
end — and the invitee has no way to tell whether they were invited at all.

**Do**

1. Server action listing WorkOS invitations for the signed-in email across orgs.
2. Surface on `/settings` and as a dismissible dashboard banner when pending.
3. Accept in place → membership → switch into the org.

**Traps**

- Consumer-domain rule (doc §11): a Gmail invitee must sign up with the *exact*
invited address. An invitation to a different address of the same person will
not appear here, and the empty state should say so rather than implying no
invitation was sent.
- Don't mirror invitations into the DB. `getOrganizationSettings` deliberately
reads them live so a revoked invite leaves no stale address behind.

**Done when**

- [ ] A signed-in user with a pending invitation sees it without the email
- [ ] Accepting lands them in the right org
- [ ] A revoked invitation disappears

---



### T-28 — Create an institution

`S` · **Depends on:** T-24 · **Satisfies:** R12

> **DONE — 26 Aug 2026.** "Create an institution" in the switcher →
> `createOrganization()` → provisioned with the caller as admin → switched into
> → lands on `/settings`, because the next thing anyone wants is to invite
> people.
>
> **The externalId trap the ticket warned about was real, and there was a second
> one underneath it.** `provisionOrganizationForOnboarding` is built to REUSE the
> caller's existing org — that is the whole point during onboarding — so calling
> it here would have renamed the caller's personal workspace into the new
> institution instead of creating one. It now takes `forceNew`, which skips both
> adoption paths and uses `namedOrgExternalId(userId, name)` rather than
> `personalOrgExternalId(userId)`, whose key is already claimed by the personal
> workspace and would have made `createOrGetWorkosOrg` hand it straight back.
>
> The second trap: a force-new org must NOT set `ownerUserId`. That field means
> "this is that user's implicit personal workspace" and is what `findJoinedOrg`
> and the leave guard read. An institution claiming it would have blocked its
> creator from ever leaving it, and made invitees look like its owner.

**Do** Switcher entry → dialog (name, school/coaching) →
`provisionOrganizationForOnboarding` with the caller as admin → switch into it →
land on the invite screen.

**Traps**

- `personalOrgExternalId(userId)` is a per-*user* external id and is already
taken by their personal org. A second org needs a different external id or
none, or WorkOS conflicts and `createOrGetWorkosOrg` silently adopts the
personal org instead of creating a new one.
- Don't let this path rename or re-type the personal org — that's what the
onboarding path does, and reusing it here would convert Anjali's personal
workspace into the new centre.

**Done when**

- [ ] A user with a personal org can create a coaching org and switch to it
- [ ] The personal org is unchanged, still `type: 'personal'`

---



### T-29 — Leave an institution

`S` · **Depends on:** T-24 · **Satisfies:** R11, R15

> **DONE — 26 Aug 2026.** `leaveOrganization()` in
> `actions/organization/membership.ts`, surfaced as a **Leave** control on your
> own row in `/settings`. Three guards, not one: last admin (same wording as
> `removeMember`), your own personal workspace (leaving it strands every resource
> stamped with it), and your only organization (you'd have nowhere to work).
> WorkOS first then local, and `forgetLastOrg()` if the org being left is the
> remembered one. The confirm dialog says content stays with the institution
> before they commit.

**Do** "Leave institution" on your own membership row in `/settings`; last-admin
guard reusing `removeMember`'s check; delete in WorkOS then locally; switch to
the fallback org.

**Traps**

- Confirm dialog must state that content stays with the institution. It's the
moment a teacher decides whether to copy anything out first.
- Last-admin block needs the same "promote someone first" wording as
`removeMember`, or it reads as a bug.
- Clear the `last_org` cookie if it names the org being left.

**Done when**

- [ ] A member can leave; an only-admin cannot
- [ ] Content authored by the leaver is still visible to the org
- [ ] The leaver lands somewhere valid

---

### T-30 — The shared-bank read filter

`M` · **Blocks:** nothing · **Depends on:** T-02 (done) · **Satisfies:** R8a, R16, R17

> **MOSTLY DONE — 26 Aug 2026.** The leak is closed. `lib/auth/questionScope.ts`
> is the single source of the clause; every question read now composes it with
> **AND**, never by assigning `where.OR` — several callers build their own
> top-level `OR` for text search, and a second assignment silently REPLACES the
> first rather than erroring.
>
> Scoped: `getQuestions`, `getQuestionCount`, `searchQuestions`,
> `getQuestionsByIds`, `getAvailableSubjects`, `getFilterOptions`,
> `GET /api/questions`, the dashboard total, and the folder id-validation reads
> in `draft.ts` / `folderAccess.ts` (unscoped, those let you pull another org's
> question into your own folder by id and read it through the folder forever).
> These now call `requireOrgContext()` — the org comes from the session, never
> from the caller, since server actions are public endpoints and `userRole` /
> `userSubject` are already values the browser chose.
>
> **`getFilterOptions` needed different code.** It is `aggregateRaw`, so the
> clause is raw MongoDB: the org id must be wrapped as `{ $oid }` extended JSON
> (a bare string matches nothing and every facet list comes back empty), and raw
> Mongo's `{ field: null }` matches null AND missing — the *opposite* of Prisma's
> behaviour. That works in our favour here and is commented so nobody "fixes" it.
>
> **A third leak was found while doing this, running the other way.**
> `POST /api/questions` wrote **no `organizationId` at all**. Not null — absent.
> So a satellite upload of one school's private paper landed in the global bank
> for every customer, and being absent-not-null it wouldn't even have matched the
> shared-bank filter, so it would have been invisible to everyone including its
> author. Both create paths now stamp explicitly, and `resolveApiActorOrg()` in
> `lib/auth/guard.ts` makes the service key name its org via `x-organization-id`
> or `QUESTION_API_ORG_ID`. Reads may fall back to the shared tier
> (`allowGlobal`); writes may not — an unnamed service write is refused.
>
> **BEHAVIOUR CHANGES TO KNOW ABOUT.** `GET /api/questions` and
> `/api/questions/get-all` were completely unauthenticated and now require a
> session or the API key; both return a truthful 401/403 instead of a 500. Any
> satellite calling them without credentials breaks. This is the read half of
> **T-07**, arriving with this ticket.
>
> **NOT DONE — flagging is still a shared boolean (now T-33).** `selectFlagged` /
> `toggleFlag` deliberately skip the ownership guard so orgs can report bad
> shared questions, which means Org A's flag still mutates a row Org B reads.
> Fixing it means a new `QuestionFlag` model, a data migration for existing
> flags, and a decision about what `filters.flagged` means once a flag is
> per-org — a schema change with a `db push` against production, which wants its
> own review rather than riding along here.
>
> **NOT VERIFIED: that all 5,445 shared questions are still visible.** That needs
> a query against the real database. The T-02 Part A normalisation makes it true
> on paper; confirm before this reaches anyone.

**Why now.** Independent of everything else in this doc, and ahead of it. The
write side already stamps org ownership correctly (§1.5) and **no read honours
it**. Today that is harmless only because no org has uploaded a private question.
It stops being harmless on the first upload — which is a product goal, not a
hypothetical.

**Do**

1. Add the tenancy clause to `buildQuestionWhere()` in
   `actions/question/questionBank.ts`, so `getQuestions`, `getQuestionCount` and
   all three filter-option queries inherit it:
   `OR: [{ organizationId: null }, { organizationId: ctx.organizationId }]`
2. The same clause in `GET /api/questions` — this is the read half of **T-07**.
3. Bind the service-key actor to an org. `requireApiActor` returns
   `{ kind: "service" }` with no org, so a satellite POST that creates a question
   stamps nothing and it lands in the **global bank**. Either scope the key
   per-org or require an explicit org on write.
4. Replace the `flagged` boolean with a `QuestionFlag` row (question, org, user,
   reason). `selectFlagged` / `toggleFlag` deliberately skip
   `assertCanMutateQuestion` so orgs can report bad shared questions — which
   means Org A's flag currently mutates a row Org B reads.
5. UI: a source facet in the question bank — "Shared bank" vs
   "<Institution>'s questions" — and a read-only affordance on shared rows, so
   "you can't edit this" is visible before the click instead of arriving as a
   403 toast.

**Traps**

- **The Mongo null trap is disarmed, but only just.** T-02 Part A normalised all
  5,445 rows to an *explicit* null on 23 Aug precisely so this filter can match
  them. Verify before deploying: any Question row where the field is still
  absent is skipped by `{ organizationId: null }` and vanishes from the product
  for everyone. Any row created since by a path that omits the field is in
  exactly that state.
- **Two top-level `OR`s clobber each other.** `GET /api/questions` already builds
  `query.OR` for text search. Nest them: `AND: [{ OR: tenancy }, { OR: search }]`.
  The failure mode is silently returning the wrong rows, not an error.
- The count query and the list query must use the identical clause, or pagination
  reports totals the list can't produce.
- Move these reads to `requireOrgContext()`, so a null org is a clear error
  rather than an unfiltered query.

**Done when**

- [ ] An org-uploaded question is invisible to every other org, including via `/api/questions`
- [ ] All 5,445 shared questions are still visible to everyone
- [ ] A satellite tool's upload lands in a named org, never in the shared bank
- [ ] Flagging is per-org and does not mutate a shared row
- [ ] Filter facets (subject/chapter/exam) list values from the visible set only

---

### T-31 — Invitation states the admin can actually read

`M` · **Depends on:** nothing · **Satisfies:** R19, R20, R21

> **DONE — 25 Aug 2026.** `getOrganizationSettings` stops filtering to
> `pending` and maps the fields WorkOS was already returning and we were
> throwing away — `state`, `roleSlug`, `createdAt`, `acceptedAt`,
> `acceptInvitationUrl`. `TeamSection` renders a state chip per row with a
> plain-English line under it ("Invited as Teacher on 25 Aug — expires 8 Sep",
> "Joined as Teacher on 25 Aug"). Pending rows get Resend / Copy link / Revoke;
> expired and revoked rows get Invite again, which prefills the form.
>
> `resendInvitation()` uses WorkOS's first-class resend, not revoke-then-invite
> — revoking would kill a link the invitee may already have open, and
> re-inviting would reset the clock and the role. Both it and `revokeInvitation`
> now go through one `requireOwnInvitation()` helper; resend is the more
> dangerous of the two id-from-the-browser paths, since it re-delivers a live
> accept link.
>
> `inviteMember` checks pending invitations as well as memberships and returns
> `code: "already_invited"`, which the UI turns into a Resend action in the
> toast. `expiresInDays` is now explicit at 14 (WorkOS defaults to 7).
>
> **A latent bug was found and fixed while doing this.** WorkOS list endpoints
> page at TEN by default, and this call passed no limit — so a busy org was
> already silently dropping pending invitations, and including terminal states
> would have made it much worse (a pending invite that isn't listed can't be
> resent). Now `limit: 100, order: "desc"`.
>
> `acceptUrl` is carried for pending invitations only. It is a bearer
> credential — whoever holds it joins as the invited address — so an accepted or
> revoked invite must not keep handing it out.

**Why now.** The invite button works; the feedback loop around it doesn't. An
admin who invites a colleague has no way to learn whether it landed, and no
recovery when it didn't. It is independent of the switcher.

**Do**

1. Stop filtering `listInvitations` to `pending` in `getOrganizationSettings`.
   Map the fields already on the response: `state`, `roleSlug`, `createdAt`,
   `acceptedAt`, `expiresAt`, `acceptInvitationUrl`.
2. `TeamSection` renders a state chip per row — Pending / Accepted / Expired /
   Revoked — plus the role invited at and when it was sent.
3. Resend, via `userManagement.resendInvitation(id)`. No revoke-first dance.
4. Copy invite link, from `acceptInvitationUrl` — the escape hatch for a teacher
   whose spam filter ate the email, which on Indian school domains is common.
5. `inviteMember` checks pending invitations, not just memberships, and returns a
   distinguishable "already invited" so the UI can offer Resend.
6. Set `expiresInDays` explicitly. WorkOS defaults to 7; 14 suits a teacher who
   checks email weekly.

**Traps**

- Same org-ownership check as `revokeInvitation` on the resend path: the id comes
  from the browser, so confirm the invitation belongs to this org before acting
  on it or any admin can resend any other org's invitation.
- Don't mirror invitations into the DB. `getOrganizationSettings` reads them live
  on purpose, so a revoked invite leaves no stale address behind.
- Terminal-state rows should age out of the list (say, 30 days), or the settings
  page becomes an append-only log.
- A WorkOS blip already degrades to an empty invitation list rather than blanking
  the page. Keep that.

**Done when**

- [ ] An admin can tell accepted from expired from never-sent
- [ ] Resend works without revoking
- [ ] Inviting an already-invited address offers Resend instead of duplicating
- [ ] Invite links can be copied and pasted into WhatsApp

---

### T-32 — The invitee's arrival

`M` · **Depends on:** T-22, T-23 · **Satisfies:** R22

> **DONE — 25 Aug 2026.** `getJoinWelcome()` +
> `components/dashboard/JoinWelcome.tsx`, mounted in the dashboard layout so the
> banner is part of the first paint. Detection is `findJoinedOrg()` matching the
> ACTIVE org, within 24 hours of `Membership.createdAt` — the wide window is
> deliberate: a teacher who accepts on their phone at night and opens the
> dashboard next morning would miss a five-minute one, and this is the only
> acknowledgement they get. Dismissal is localStorage keyed by org.
>
> The banner names the institution, the role, and states that their own
> workspace is untouched and nothing was shared into the institution. It does
> **not** offer a way back — there is no switcher until T-24. That sentence
> becomes a link then.
>
> The webhook now handles all four `invitation.*` events (`created`,
> `accepted`, `revoked`, `resent`), revalidating `/settings` so an accepted
> invite flips off Pending without a hard refresh. **There is no
> `invitation.expired` event** — WorkOS emits none, because expiry is the
> passage of time; reading invitations live means an expired one simply reports
> `state: "expired"` on the next load.
>
> **NOT DONE: the expired-link recovery page.** The accept link is on WorkOS's
> domain and an expired one renders WorkOS's own error page — we cannot
> intercept it, and a page nothing can link to is worth nothing. The recovery
> that does work is on the admin's side, and shipped with T-31: the invitation
> now shows as **Expired** with an **Invite again** button.

**Why now.** Today, accepting an invitation lands you on an unchanged dashboard.
Nothing tells you it worked, which org you're in, or that your own workspace is
still there. For an existing user it is worse than silent — under the current
`orderBy: createdAt asc` pin they land back in their personal workspace, and the
invitation looks broken.

**Do**

1. Welcome state on first load after joining: infer from active org being
   non-personal with `Membership.createdAt` inside a few minutes. Name the
   institution, the role, and the way back to their own workspace.
2. Dismissible once, per membership. Don't re-show it on every reload.
3. Expired-link recovery: a page saying who to ask, since WorkOS's error page is
   a dead end.
4. Handle `invitation.accepted` in the WorkOS webhook — none of the four
   `invitation.*` events are in the `HandledEvent` union today. Minimum: the
   admin's pending row flips to Accepted without waiting for a page refresh.

**Traps**

- `handleAuth({ returnPathname: "/dashboard" })` is static and the accept URL
  belongs to WorkOS, so you cannot pass state through the invitation link.
  Inferring from `Membership.createdAt` is the workable path — don't burn a day
  trying to thread a query param.
- A brand-new invitee hits the onboarding gate first. T-32 is meaningless until
  T-22 stops that flow from minting them a second organization.
- Every webhook handler is an upsert or a no-op-if-missing so replays are safe.
  Keep any new handler in that shape.

**Done when**

- [ ] An invited teacher knows, on screen, which institution they just joined
- [ ] They can find their own workspace from that screen
- [ ] An expired link explains what to do next
- [ ] The admin's list shows Accepted without a manual refresh
### T-33 — Flagging is a per-org record, not a shared boolean

`M` · **Split out of T-30** · **Depends on:** nothing · **Satisfies:** R16

**Why now.** `Question.flagged` is one boolean on a row every organization
reads. `selectFlagged` / `toggleFlag` deliberately skip
`assertCanMutateQuestion` — orgs can't edit shared questions, so flagging is
their only way to report a bad one — which means it is the single remaining path
where **one customer's action changes what another customer sees.**

It was split out of T-30 because it is a schema change with a data migration and
a semantics question, not a filter fix. T-30 closed the read leak without it.

**Do**

1. `QuestionFlag` model: question, organization, user, reason, createdAt,
   resolvedAt. Unique on (questionId, organizationId) so one org flags once.
2. Migrate the existing `flagged: true` rows into flags. **Whose flag are they?**
   The rows predate multi-tenancy, so there is no answer in the data — most
   likely they belong to the admin/global bank. Decide it explicitly.
3. `filters.flagged` becomes "flagged **by my org**". Today it means "flagged by
   anyone", and that difference is visible in the question bank filter.
4. Admin surface: a flag is a report to whoever owns the shared bank, and
   nothing reads them today.

**Traps**

- Needs `prisma db push` + `prisma generate`. `db push` **drops indexes it does
  not know about**, so re-run `scripts/workos/create-sparse-indexes.ts` after.
- Don't drop `Question.flagged` in the same change. Keep it written for one
  release so a rollback doesn't lose the reports.
- The flag mutations must stay open to non-owners — that is the point of them.
  Only the STORAGE becomes per-org.

**Done when**

- [ ] Org A flagging a shared question doesn't change what Org B sees
- [ ] Existing flags survive, under a deliberate owner
- [ ] The bank filter's "flagged" means "flagged by us"

---



---



---



---



## 9. Sequencing

```
DONE  T-22 · T-31 · T-32          (25 Aug)   the invitation flow
DONE  T-23 · T-30                 (26 Aug)   active org, and the question-bank leak
DONE  T-25                        (26 Aug)   org-scope the remaining reads
DONE  T-24 · T-26 · T-28 · T-29   (26 Aug)   the switcher and everything on it

T-27  ── invitations for you   (independent)
T-33  ── per-org flagging      (independent; needs a schema push)
```

**Multi-org is functionally complete.** A teacher can belong to two
institutions, switch between them, create one, and leave one, and the data on
screen belongs to exactly the institution named in the header.

Two tickets remain and neither blocks anything. What DOES block trusting any of
this is verification against production data — see below.

**The one ordering call that matters:** do not ship T-24 before T-25 and T-30 land. A
switcher over `userId`-scoped reads changes the header and the roster and leaves
folders, papers, tests and templates identical in both institutions. Teachers
would reasonably conclude the separation doesn't work — and they'd be right.

T-25 is the last prerequisite. Everything ahead of it in the original sequence
has shipped.

---



## 10. How we'll know it worked

- Invited teachers who actually land in the inviting org: target ~100%, currently
effectively 0 for anyone with a pre-existing account
- Orgs created per invitation accepted: target 0, currently 1
- Users with ≥2 active memberships who switch at least once in their first week
- Support contacts containing "can't see my" / "wrong school name": down
- **Invitation acceptance rate**, which we currently cannot measure at all
  because terminal states are filtered out before they reach us
- Invitations resent per invitation sent — a proxy for how often the email lands
  in spam, and the number that tells you whether branding the WorkOS template
  was worth doing
- Zero cross-org content sightings — worth an explicit assertion in the T-25
acceptance pass rather than waiting to hear about it

---



## 11. Open questions

**Answered 25 Aug 2026 — the question-bank model.** Global questions are served
to everyone regardless of org; an org's own uploads stay inside that org; a
teacher in two institutions sees the same global bank in both and only the
active institution's private questions. A teacher's own uploads live in their
personal workspace, which is an org like any other, so those do not follow them
into a centre either. This confirms §13 and the `DECIDED` schema comment. Q1 and
Q2 below are closed by it. See §1.5 and T-30.

Still open:

1. ~~Does a teacher's personal question bank stay personal?~~ **Answered: yes.**
2. ~~Can a centre admin see what a teacher authored before joining?~~
   **Answered: no.** Still worth saying so in the invite UI, so admins don't
   expect a teacher to arrive carrying their bank.
3. **Who can publish into the global bank, and how?** Today it is
   `user.isAdmin` — `User.role === 'admin'` or the `ADMIN_EMAILS` env allowlist —
   and there is no UI for it. If the global bank is meant to grow, this needs a
   real admin surface and a real answer to "who is an admin". If it is a fixed
   seed corpus, say so and the question closes.
4. **Should a global question ever become org-private, or vice versa?** The
   schema says no forking and no copy-on-write, so a shared row can never drift
   between customers. That's the right default. But it means a teacher who wants
   to tweak one word of a shared question has no path at all — not even
   "duplicate into my org". Worth deciding deliberately rather than discovering
   through a support ticket.
5. **Does branding the WorkOS invitation email need a verified sending domain?**
   It will — WorkOS sends from its own domain by default, and an unbranded
   `workos.com` email asking an Indian schoolteacher to click a link is a spam
   folder waiting to happen. Worth checking what your WorkOS plan allows before
   T-31 assumes it.
6. **Should `type: 'personal'` orgs be creatable more than once?** Currently one
   per user, keyed on `ownerUserId`. T-28 creates `coaching`/`school` orgs only.
   Keeping personal singular is simpler; confirm.
7. **Per-org PDF templates, or per-teacher?** T-25 moves templates to the org. A
   teacher at two centres almost certainly wants different headers, so I've
   assumed org — flag it if templates are meant to be personal presets that
   follow the teacher between institutions.
8. **What happens to an in-flight question selection when they switch?**
   `qb:selectedQuestions` is a flat localStorage array with no org dimension, and
   it can now hold a mix of global and org-private ids. Cheapest answer: clear it
   on switch (T-24) and warn if it's non-empty. Nicer: namespace the key by org
   and keep both drafts alive. Global ids would survive either way; the org ones
   are what must not cross.
