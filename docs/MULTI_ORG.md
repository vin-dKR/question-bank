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
| 1. `switchToOrganization` / `refreshSession({organizationId})` | **Available**                | `@workos-inc/authkit-nextjs@4.3.1` exports both                                 |
| Query cache keyed on org                                       | **No**                       | `['questions', …]`, `['tests', …]`, `['testAnalytics', …]`, `['filterOptions']` |
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

**R8** Every read of Folder, Question, Test, PaperHistory and TemplateForm must
filter on `organizationId`, not on `userId` / `createdBy` alone.

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

---



## 8. Tickets

Continuing the numbering in `docs/ROSTER_TICKETS.md`. Sizes: `S` under half a
day · `M` one to two days · `L` three to five days.

### T-22 — Stop onboarding from creating a junk org for invitees

`S` · **Blocks:** nothing · **Depends on:** nothing · **Satisfies:** R7

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



## 9. Sequencing

```
T-22  ── ship now, independently. It is a live bug.
   │
T-23  ── explicit active org
   │
   ├── T-24 switcher ──┬── T-28 create
   │                   └── T-29 leave
   ├── T-26 query keys
   └── T-27 invitations for you

T-25  ── org-scope the reads   (parallel track, gated on the T-09 backfill)
```

**The one ordering call that matters:** do not ship T-24 before T-25 lands. A
switcher over `userId`-scoped reads changes the header and the roster and leaves
folders, papers, tests and templates identical in both institutions. Teachers
would reasonably conclude the separation doesn't work — and they'd be right.

If T-25 slips, ship T-22 + T-23 anyway. They fix real defects and are invisible
to anyone with one org.

---



## 10. How we'll know it worked

- Invited teachers who actually land in the inviting org: target ~100%, currently
effectively 0 for anyone with a pre-existing account
- Orgs created per invitation accepted: target 0, currently 1
- Users with ≥2 active memberships who switch at least once in their first week
- Support contacts containing "can't see my" / "wrong school name": down
- Zero cross-org content sightings — worth an explicit assertion in the T-25
acceptance pass rather than waiting to hear about it

---



## 11. Open questions

1. **Does a teacher's personal question bank stay personal?** D3 says yes, and
  D2 keeps it visible. Confirm this is the intent — the alternative (joining a
   centre contributes your bank to it) is a very different product and needs to
   be opt-in and explicit if it's ever wanted.
2. **Can a centre admin see what a teacher authored before joining?** Under D3,
  no. Reasonable, but say it in the invite UI so admins don't expect otherwise.
3. **Should** `type: 'personal'` **orgs be creatable more than once?** Currently one
  per user, keyed on `ownerUserId`. T-28 creates `coaching`/`school` orgs only.
   Keeping personal singular is simpler; confirm.
4. **Do we need per-org PDF templates now, or is per-user acceptable?** T-25
  moves templates to the org. A teacher at two centres almost certainly wants
   different headers, so I've assumed org — flag if templates are meant to be
   personal presets that follow the teacher.
5. **What happens to a teacher's in-flight draft when they switch?** Currently
  `qb:selectedQuestions` is a flat localStorage array with no org dimension.
   Cheapest answer is to clear it on switch (T-24) and accept the loss; the
   nicer answer is to namespace the key by org and keep both drafts alive. I'd
   start with clearing plus a warning if a selection is non-empty.

