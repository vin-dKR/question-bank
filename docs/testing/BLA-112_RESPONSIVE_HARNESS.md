# BLA-112 responsive regression harness

This Playwright harness implements Workstream I / Phase 0 measurement without changing product UI or weakening WorkOS authentication. It currently proves the public landing page, long/localized public content, and the anonymous API boundary. Protected tests are executable but intentionally skip until safe non-production personas are supplied.

The harness is evidence for remediation work; it does **not** mark BLA-112 complete.

## Commands

Install the one browser used by the suite after `bun install`:

```bash
bun run test:e2e:install
```

Run the stable public/non-auth suite, including the complete viewport matrix:

```bash
bun run test:e2e:public
```

Run everything. Authenticated tests report as skipped when `E2E_AUTH_MANIFEST` is absent:

```bash
bun run test:e2e
```

Run against an already deployed or separately started app:

```bash
PLAYWRIGHT_BASE_URL=https://preview.example.test bun run test:e2e:public
```

The default command starts `next dev` at `127.0.0.1:3012` (override with `PLAYWRIGHT_PORT`). It refuses to reuse an existing listener so evidence cannot silently come from an unrelated local app. Public tests provide test-only placeholder AuthKit configuration to let middleware initialize; these values are scoped to the spawned process and cannot authenticate. Authenticated runs must supply real **non-production** app environment variables to the separately started app or preview deployment.

## Acceptance projects

`playwright.config.ts` is the source of truth. Named Chromium projects cover:

- 320×568, 375×667, and 390×844 phone portrait;
- 568×320, 667×375, and 844×390 phone landscape;
- 700×900 awkward/small tablet, 768×1024 tablet portrait, and 1024×768 tablet landscape;
- 1280×720 small laptop, 1366×768 and 1440×900 desktop;
- 1920×1080 wide and 2560×1080 ultrawide;
- 640×720 and 480×600 effective CSS widths, representing 1280 at 200% and 1440 at 300% zoom. The 320 project also supplies the 1280-at-400% reflow width.

CSS-width projects reliably automate reflow. They do not emulate browser UI scaling, text-only zoom, a virtual keyboard, safe areas, or mobile browser chrome; those remain real-browser/device checks.

## Assertions and durable evidence

Reusable helpers in `e2e/support/assertions.ts` provide:

- document-level horizontal overflow measurement, including a short offender list on failure;
- viewport containment for dialogs, menus, listboxes, and popovers;
- critical-action visibility, enabled state, viewport containment, and center-point hit testing;
- full-page viewport-labelled screenshot attachments.

`e2e/support/diagnostics.ts` records every `console.error` and uncaught `pageerror`, attaches the records as `browser-issues.json`, and fails the test if the list is not empty.

Every local run writes ignored artifacts to:

- `test-results/BLA-112-summary.md` — concise pass/fail/flaky/skipped totals by named viewport;
- `test-results/**/evidence/` — clearly named screenshots and browser-issue JSON retained for passing and failing tests;
- `test-results/**/trace.zip` and failure screenshots when a test fails;
- `playwright-report/index.html` — browsable detail.

The public CI workflow uploads both directories as `bla-112-responsive-evidence-<run id>` even when tests fail. Artifacts are evidence candidates for a later Linear update, but must be read with the scope note in the Markdown summary.

Intentional visual baselines may be added later only after authenticated data is stable. Generated screenshots and reports stay out of git.

## Authenticated fixture contract

Never commit Playwright storage state: it contains session cookies. Never add an auth bypass, reuse production tenants, embed a WorkOS API key in tests, or make production authentication conditional on an E2E flag.

Use a dedicated WorkOS staging environment, a dedicated database, and normal WorkOS login/provisioning:

1. Create the four stable staging users/organizations below through WorkOS and let the application provision their local `User`, `Organization`, and `Membership` rows normally.
2. Seed application rows idempotently against those already-provisioned IDs. Seeders must target only the dedicated test database, upsert by a `BLA112_E2E_` fixture key, and never delete records without that key.
3. Start the app with its staging WorkOS callback registered at the exact `PLAYWRIGHT_BASE_URL`.
4. Capture each session interactively. For example:

   ```bash
   mkdir -p e2e/.auth
   bunx playwright codegen --save-storage=e2e/.auth/teacher-owner.json http://127.0.0.1:3012/auth/signin
   ```

5. Copy `e2e/auth-manifest.example.json` to the ignored `e2e/.auth/manifest.json`, update only visible fixture expectations, and capture the other three storage states named by it.
6. Validate and execute:

   ```bash
   E2E_AUTH_MANIFEST=e2e/.auth/manifest.json bun run test:e2e:validate-fixtures
   E2E_AUTH_MANIFEST=e2e/.auth/manifest.json bun run test:e2e:auth
   ```

The executable manifest requires these personas:

| Persona | Product kind | Organization role | Dataset |
|---|---|---|---|
| `teacherOwner` | teacher | teacher/owner-equivalent | populated questions, drafts, tests |
| `instituteAdmin` | institute | admin | long/localized names, pending invitations |
| `organizationMember` | teacher | member | populated but permission-limited |
| `organizationViewer` | teacher | viewer | empty/read-only |

Each persona supplies its storage-state path, home path, expected identity/organization text, a critical navigation action, and dataset label. The authenticated smoke test applies the same viewport, overflow, error, overlay, action-reachability, and screenshot contract to every persona.

Storage state expires and must be rotated. In CI, restore it from a restricted short-lived secret artifact into `e2e/.auth/`; do not serialize cookie JSON into source-controlled workflow YAML. Keep authenticated CI separate from the secret-free public workflow.

## Deterministic state and content strategy

`e2e/fixtures/content.ts` is the shared data catalog. It includes German/Devanagari expansion, a long organization, invitation email, upload filename, and wide math. `e2e/assets/roster-long-localized.csv` and `public/placeholder.svg` are safe deterministic upload/image inputs.

The future authenticated seeder must create both empty and populated organizations and tag records so tests can select these states deterministically:

- questions: long math, prose, options, solution, and local/remote image cases;
- folders/drafts/history: empty and populated, plus reorderable questions;
- school tests: a synthetic multi-page PDF and stable extracted/cropped results;
- examinations: tests with questions, roster, responses, analytics, answer key, and PDF data;
- OMR: generated sheet plus clean, skewed, partial, and rejected scan fixtures;
- organization: long/localized identity plus pending, expired, and revoked invitations;
- UI states: empty/populated from seeded data; loading/error via deterministic request interception or a staging failure adapter that cannot be enabled in production.

Do not persist generated production-derived PDFs, scans, uploads, email addresses, or question text as fixtures. Use synthetic assets with documented licenses/provenance.

## Protected and external gaps

Until the manifest and staging dataset exist, no live pass is claimed for:

- sign-in/sign-up/forgot-password hosted WorkOS presentation, callback, onboarding, or session rotation;
- a visual product 404/error page (unknown page URLs currently cross the protected WorkOS boundary, no custom `not-found.tsx`/`error.tsx` exists, and missing asset-like slugs can reach the authenticated catch-all without AuthKit middleware);
- teacher/institute dashboards and organization admin/member/viewer permissions;
- questions, history, drafts, templates, slide authoring, classes, settings/profile, and invitations;
- examination creation/workspace/analytics, PDF/slide export, school-test processing, and OMR generation/scanning;
- OpenAI/Gemini, Supabase images, email delivery, camera/file-picker behavior, and browser-native PDF viewers;
- iOS Safari, Android Chrome, iPadOS, desktop Safari/Firefox, virtual keyboards, safe areas, offline behavior, and text-only scaling.

Public green results close none of these gaps. When a fixture becomes available, remove no assertions to obtain a pass; fix the product or document a narrowly reviewed platform limitation.
