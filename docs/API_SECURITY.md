# API Security — Protecting the Question Bank

This document is the security model for the eduents API. It exists because the
product's core asset — an in-house bank of exam **questions and answer keys** —
was, before this work, extractable by anyone: a single unauthenticated `curl`
could download the entire bank, answers included. This describes the threat, the
controls now in place, how to operate them, and how to keep new endpoints safe.

> **One sentence to remember:** *login and CORS are not a moat.* Real protection
> is **auth on every read + hard page caps + rate limiting + audit logging +
> bot defense**, layered so that no single control failing exposes the bank.

---

## 1. Threat model

**Asset.** The `Question` collection: `question_text`, `options`, images, and
crucially `answer` (the answer key). It is a **global shared bank** — admin
uploads (`organizationId = null`) are meant to be readable by every signed-in
organization; that read access *is* the product. Org-uploaded questions
(`organizationId = <org>`) are private to that org.

**Adversaries.**
- **Anonymous scrapers** — a script hitting the API with no credentials.
- **Competitors who sign up** — a real account used to bulk-download the bank
  ("extract everything by just logging in").
- **A leaked service key** — one of the satellite tools' API keys escaping.
- **Abusers of expensive endpoints** — driving the paid vision APIs or the
  Puppeteer PDF renderer to run up cost or cause a DoS.

**Non-goal (be honest).** Perfect secrecy is impossible: anyone with legitimate
read access can, in principle, copy what they can see. The goal is to make mass
extraction **slow, rate-limited, logged, and attributable to a real identity** —
expensive and risky enough that it isn't worth it, and visible when it happens.

---

## 2. Why CORS and "must be logged in" are not enough

**CORS is a browser-only control.** It tells a *browser* which web origins may
read a cross-origin response. It does nothing to a direct HTTP client:

```bash
# CORS is irrelevant here — curl is not a browser and ignores it entirely.
curl 'https://<host>/api/questions?limit=100000'
```

Before this work that command returned the whole bank. The origin allowlists in
`middleware.ts` / `lib/cors.ts` / `netlify.toml` gave **zero** protection against
it. That is why authentication now lives in the route handlers and server
actions — not in the CORS layer. CORS remains only to let the legitimate
browser-based satellite tools talk to us; it is never treated as a security
boundary.

---

## 3. Endpoint posture (before → after)

| Endpoint | Before | After |
|---|---|---|
| `GET /api/questions` | **No auth**, attacker-controlled uncapped `limit`, all orgs, answers included | `requireApiActor` (session or Bearer), page size capped at **100**, org-scoped for users, rate-limited, audited |
| `GET /api/questions/get-all` | **No auth**, leaked questions + answers | **Deleted** (was redundant; no caller) |
| `POST /api/questions` | `requireApiActor` | unchanged (already safe) |
| `PUT` / `DELETE /api/questions/[id]` | `requireApiActor` + `assertCanMutateQuestion` | unchanged (already safe) |
| `getQuestions` / `searchQuestions` / `getQuestionsByIds` / `getFilterOptions` / `getAvailableSubjects` / `getQuestionCount` (server actions) | **No auth**, no org filter, **client-supplied role** trusted | `requireOrgContext`, org-scoped, role/subject **derived from session**, id-batch capped, rate-limited |
| `getQuestionsData` (dashboard count) | **No auth**, counts entire global collection | `requireOrgContext`, org-scoped |
| `POST /api/analytics/pdf` | **No auth**, renders arbitrary HTML (SSRF/DoS) | `requireApiActor`, rate-limited, renderer blocks internal/metadata hosts |
| `POST /api/school-test/process-page` | login only, unthrottled paid vision calls | login + per-user `vision` rate limit |
| `POST /api/omr/fetchTestbyId`, `/api/omr/checker` | `requireApiActor` + org check | unchanged (already safe) |
| `POST /api/webhooks/workos` | HMAC signature verify | unchanged (correct for a webhook) |
| **All `/api/*`** | middleware passed everything through (opt-in auth) | **default-deny**: anonymous (no session, no Bearer) is rejected with JSON 401 before the route runs |

---

## 4. Controls implemented (the layers)

### Layer 1 — Default-deny middleware (`middleware.ts`)
Every `/api/*` request that isn't on `PUBLIC_API_PATHS` (only
`/api/webhooks/workos`, which verifies its own HMAC signature) must present a
WorkOS session **or** an `Authorization: Bearer` header, or it gets a JSON 401
*before the route executes*. This makes "a route forgot its guard" fail closed —
the class of bug that exposed the bank in the first place. Routes still do
fine-grained authz on top.

### Layer 2 — Auth + org scoping + server-derived role
- **API reads** use `requireApiActor` (session or service key).
- **Server-action reads** use `requireOrgContext` (session + non-null org).
- **Tenancy** (`lib/auth/session.ts`, `actions/question/questionBank.ts`): every
  read is filtered `{ OR: [{ organizationId: null }, { organizationId: <caller org> }] }`
  — the shared bank plus the caller's own org, never another org's private
  questions.
- **Role is derived from the session, never the client.** A teacher's subject
  lock comes from their `TeacherData` row, so sending `role:"student"` from the
  browser no longer bypasses it. (The old `role`/`subject` params are still
  accepted but ignored — see the `_userRole` convention in `questionBank.ts`.)
- **Page caps**: `MAX_PAGE_SIZE = 100`; `getQuestionsByIds` batch capped at
  `MAX_IDS = 100`.
- **Error hygiene**: read failures return a generic message; raw `error.message`
  (which can leak schema detail) is logged server-side only.

### Layer 3 — Rate limiting (`lib/ratelimit.ts`)
Upstash Redis sliding windows, keyed by user id (or IP for service callers).
Tiers: `read` (240/min), `pdf` (20/min), `vision` (100/5min), `service`
(1200/min). Exceeding a limit throws `RateLimitError` (HTTP 429 with
`Retry-After`). **No-ops safely when the Upstash env vars are absent** (dev /
preview), and logs a warning in production so a missing config can't silently
disable it. Applied to: the questions read path (route *and* session action),
`/api/analytics/pdf`, `/api/school-test/process-page`.

### Layer 4 — Bot defense (`lib/turnstile.ts`)
Cloudflare Turnstile keys are provisioned. **Account sign-up is on WorkOS-hosted
AuthKit pages**, so signup bot defense is configured in the **WorkOS dashboard**,
not in-app. `verifyTurnstile()` is ready for surfaces we control (a custom form,
or a step-up challenge when an actor trips the bulk-read ceiling).

### Layer 5 — Service keys with rotation + attribution (`lib/auth/guard.ts`)
`requireApiActor` accepts multiple named keys from `SERVICE_API_KEYS` (JSON
`label → secret`) plus the legacy single `QUESTION_API_KEY`. Each tool can get
its own key, so one can be **rotated or revoked without touching the others**,
and the matched **`keyLabel`** lets audit logs and rate limits attribute traffic
to a specific tool. Comparison is constant-time. (Durable end-state — per-key
scopes/expiry/DB revocation — is the `ApiKey` model in §7.)

### Layer 6 — CORS consolidation (`lib/cors.ts`)
One `allowedOrigins` list, imported by `middleware.ts`; localhost gated to
non-production; `Access-Control-Allow-Credentials` dropped (satellites use Bearer
tokens, not cookies). The invalid comma-joined `netlify.toml` rules were removed.

### Layer 7 — Audit logging (`lib/audit.ts`)
Bulk reads and (recommended) mutations emit single-line structured JSON
(`actorType`, `actorId`, `organizationId`, `ip`, `endpoint`, `count`, `meta`).
A read returning ≥ `BULK_READ_THRESHOLD` (50) rows is elevated to
`event: question.bulk_read` at `console.warn`, so a log-drain alert can fire on
`level=warn` + `event=question.bulk_read`. This is the detection/attribution
layer — the honest last line of defense.

---

## 5. Environment variables

| Var | Purpose | Required |
|---|---|---|
| `WORKOS_API_KEY`, `WORKOS_CLIENT_ID`, `WORKOS_COOKIE_PASSWORD`, `WORKOS_WEBHOOK_SECRET` | AuthKit + webhook verification | Yes |
| `ADMIN_EMAILS` | Bootstrap admin allowlist | Recommended |
| `SERVICE_API_KEYS` | JSON map of `label → secret` for satellite tools (rotation + attribution) | Recommended |
| `QUESTION_API_KEY` | Legacy single service key (still accepted; retire after migration) | Transitional |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` | Rate limiting. **If unset, rate limiting is disabled** (warns in prod) | **Yes in production** |
| `TURNSTILE_SECRET_KEY`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Turnstile bot defense | Optional |
| `CLERK_*`, `NEXT_PUBLIC_CLERK_*`, `NEXTAUTH_*` | **Dead** (migrated off Clerk/NextAuth) — safe to remove | No |

---

## 6. Operational runbook

**Rotate / revoke a service key.** Edit `SERVICE_API_KEYS` (add the new secret
under a new or existing label, remove the old), redeploy, update the satellite to
send the new key. Because keys are per-label you can rotate one tool without
disturbing the others. To kill a compromised key immediately, remove it from
`SERVICE_API_KEYS` (and `QUESTION_API_KEY` if it was the legacy one) and redeploy.

**Read the audit log.** Filter your log drain for `level:"audit"`. A scrape looks
like many `question.read` / `question.bulk_read` lines from one `actorId` or
`ip` in a short window. `count` is rows returned per call.

**Respond to a suspected scrape.** (1) Identify the `actorId` / `keyLabel` / `ip`
from the audit lines. (2) If a user: suspend the WorkOS account. If a service
key: rotate it (above). (3) Tighten the `read` tier in `lib/ratelimit.ts` if
needed. (4) Consider a Turnstile step-up on the read path for flagged actors.

**Tune rate limits.** Edit the `TIERS` table in `lib/ratelimit.ts`. Start
generous, watch the audit `count`s and any user complaints, tighten toward the
smallest window that still fits real browsing.

**If behind Cloudflare / a WAF.** Add an edge rate-limiting rule on `/api/*` as a
complementary outer layer — it stops floods before they reach the function.

---

## 7. Known follow-ups (residual risk)

- **Durable `ApiKey` model.** Promote `SERVICE_API_KEYS` to a Prisma model for
  per-key **scopes** (e.g. omr-checker may read OMR but not edit questions),
  expiry, and DB-backed revocation:
  ```prisma
  model ApiKey {
    id             String    @id @default(auto()) @map("_id") @db.ObjectId
    label          String
    hashedSecret   String    @unique   // store a hash, never the secret
    scopes         String[]            // e.g. ["questions:read","omr:read"]
    organizationId String?   @db.ObjectId
    lastUsedAt     DateTime?
    revokedAt      DateTime?
    createdAt      DateTime  @default(now())
  }
  ```
  Then have `requireApiActor` look up by key id, compare the hash constant-time,
  and enforce `scopes` per route.
- **Durable audit store.** Promote `lib/audit.ts` to also write an `AccessLog`
  collection so bulk reads are queryable in-app, not just in the log drain.
- **Service-key blast radius.** A valid service key is still trusted across all
  orgs on the routes that accept it (`/api/omr/fetchTestbyId`, `[id]` writes).
  Per-key scopes (above) close this.
- **Mutation audit.** Add `audit()` calls to question create/update/delete for
  full write attribution (reads are covered today).
- **OMR CORS.** A couple of `/api/omr/*` routes still hardcode their origin;
  fold them into `lib/cors.ts` when convenient.

---

## 8. Checklist — adding a new API endpoint safely

Default-deny (Layer 1) means an anonymous caller is already blocked. On top of
that, every new route/action MUST:

1. **Authenticate.** `requireOrgContext()` (session-only, app UI) or
   `requireApiActor(request)` (also allows a service key, for satellites).
2. **Authorize by org, not user.** Scope every query by `organizationId`
   (`{ OR: [{ organizationId: null }, { organizationId: ctx.organizationId }] }`
   for the shared bank; a plain `organizationId: ctx.organizationId` for
   org-private data). Never filter on `userId` alone.
3. **Derive role/permissions from the session** — never trust a role, subject, or
   org id sent in the request body/query.
4. **Cap pagination.** Clamp any `limit`/`take`/id-array to a hard maximum.
5. **Rate-limit** if the endpoint is expensive or returns bulk data
   (`enforceRateLimit(tier, key)`).
6. **Audit** bulk reads and mutations (`audit({...})`).
7. **Return generic errors.** Log detail server-side; never return raw
   `error.message` to the client.
8. **If it must be public**, add it to `PUBLIC_API_PATHS` in `middleware.ts` and
   give it its own verification (like the webhook's HMAC signature).
