# BLA-112 — Whole-product cross-device responsiveness audit

Audit date: 2026-08-30

Audited revision: `acd23a3062016c981ec4ec5996093374c77020a3`

Scope: audit and report only; no product code was changed

Linear issue: BLA-112, **Complete Mobile Responsiveness & UX Review**

## Executive summary

The product is not ready to satisfy BLA-112 across the requested device matrix. The public landing page is well contained and produced no document-level horizontal overflow at any tested width, but the authenticated application has several shared responsive faults that recur across nearly every workflow. The most consequential are a 641–768 px navigation dead zone, a non-modal mobile sidebar, viewport breakpoints that ignore the 256 px desktop sidebar, sub-44 px interaction targets, 14 px raw form controls that trigger iOS focus zoom, and dialogs without a reliable dynamic-height scroll contract.

The static audit found **45 actionable findings: 0 blocker, 25 high, 17 medium, and 3 low**. “No blocker” does not mean the current experience is acceptable: multiple high-severity findings prevent or materially impair phone/tablet workflows such as opening navigation, completing onboarding fields, operating selected-question actions, configuring/exporting PDFs, reordering drafts, editing slide templates, cropping uploaded papers, reading analytics, checking OMR output, and administering team invitations.

The correct remediation order is shared foundations first, then page families. Fixing individual pages before the shell, controls, dialogs, and content-aware breakpoints would duplicate work and leave inconsistent behavior.

## Audit method and evidence standard

The audit began with `AGENTS.md`, the repository guidance, and the complete BLA-112 issue. The App Router and shared layouts were inventoried before page review. The code review covered 22,033 lines of TSX/CSS under `app/` and `components/`, including alternate, empty, loading, edit, preview, upload, and dialog states that are not directly reachable without account data.

Live browser verification used the local Next.js application and covered these CSS viewports:

| Class | Viewport(s) |
|---|---|
| Small phone | 320×568, 375×667 |
| Large phone | 390×844 |
| Phone landscape / awkward width | 667×375, 700×900 |
| Tablet portrait | 768×1024 |
| Tablet landscape / small laptop | 1024×768 |
| Standard laptop/desktop | 1366×768 |
| Wide/ultrawide | 2560×1080 |
| Zoom-equivalent reflow | 640×720, equivalent CSS width of a 1280 px desktop at 200% zoom |

For `/`, all tested widths had `documentElement.scrollWidth === documentElement.clientWidth`; browser console inspection found no application error overlay. The mobile navigation open state was also inspected at 320×568. Protected and onboarding URLs consistently redirected to the hosted WorkOS sign-in page. The environment's auth callback is configured for `localhost:3000` while this audit server had to run on `localhost:3012`, so the audit did not attempt to create or mutate an account. Protected-page conclusions are consequently source-backed static findings, not claimed as live visual passes.

Viewport ranges below are CSS pixels. At browser zoom, use effective CSS viewport width rather than physical panel width; for example, a 1280 px window at 200% zoom behaves approximately like 640 CSS px.

### Severity rubric

| Severity | Meaning |
|---|---|
| Blocker | A critical workflow is impossible for nearly all users in an in-scope device class, with no practical workaround. |
| High | A critical workflow becomes inaccessible, clips essential content/actions, or requires an unreasonable workaround. |
| Medium | Material crowding, excessive scrolling, poor discoverability, or reduced interaction quality; the workflow remains possible. |
| Low | Polish, density, or secondary accessibility concern with limited workflow impact. |

## Complete browser route inventory

There are 22 local UI route patterns plus four WorkOS forwarding handlers. API-only endpoints are not screens and are listed separately after the table.

| Route | Entry / primary UI | Audit status | Result |
|---|---|---|---|
| `/` | `app/page.tsx`; `components/landing/*` | Live at 320–2560 plus static | Contained at all tested widths; L01–L02. |
| `/auth/signin` | `app/auth/signin/route.ts` | Redirect boundary verified | Hosted WorkOS UI is external; GAP-01. |
| `/auth/signup` | `app/auth/signup/route.ts` | Redirect boundary verified | Hosted WorkOS UI is external; GAP-01. |
| `/auth/forgot-pass` | `app/auth/forgot-pass/route.ts` | Static/redirect boundary | Hosted WorkOS UI is external; GAP-01. |
| `/auth/callback` | `app/auth/callback/route.ts` | Static | Callback has no local UI; callback-port limitation in GAP-01. |
| `/onboarding/user-type` | `app/onboarding/user-type/page.tsx` | Static; auth redirect verified | O02–O03. |
| `/onboarding/teacher/setup` | `app/onboarding/teacher/setup/page.tsx` | Static; auth gated | O01, O03. |
| `/onboarding/institute/setup` | `app/onboarding/institute/setup/page.tsx` | Static; auth gated | O01, O03. |
| `/dashboard` | `app/(dashboard)/dashboard/page.tsx`; dashboard cards | Static; auth redirect verified | Shared S01–S09; card grids otherwise adapt cleanly. |
| `/questions` | `app/(dashboard)/[slug]/page.tsx`; `QuestionBankViewerContent` | Static; auth/data gated | Q01–Q08 plus P01–P03. |
| `/history` | catch-all page; `HistoryCard`, `PaperHistoryViewer` | Static; auth/data gated | H01 plus Q03/P01–P03 in selected/export states. |
| `/drafts` | catch-all page; `FolderList`, `FolderDetails` | Static; auth/data gated | D01–D02 plus P01–P03. |
| `/templates` | catch-all page; `QuestionTemplatePage` | Static; auth/data gated | T01 plus shared dialog/control findings. |
| `/slide-templates` | catch-all page; `SlideTemplatePage`, `SlideTemplateEditor` | Static; auth/data gated | T02–T04. |
| `/post` | `app/(dashboard)/post/page.tsx`; `QuestionForm` | Static; auth/data gated | Q08 and S05–S07; main field grid otherwise stacks at phone widths. |
| `/school-test` | `app/(dashboard)/school-test/page.tsx`; upload, verifier, preview | Static; auth/external services gated | SC01–SC03. |
| `/classes` | `app/(dashboard)/classes/page.tsx`; `ClassesPage` | Static; auth/data gated | Create form/card grid adapts; C01 applies to import/table states downstream. |
| `/classes/[classId]` | `app/(dashboard)/classes/[classId]/page.tsx`; roster | Static; auth/data gated | C01. |
| `/profile` | `app/(dashboard)/profile/page.tsx` | Static; auth/data gated | ST02 plus shared touch/header findings. |
| `/settings` | `app/(dashboard)/settings/page.tsx`; workspace/team/preferences | Static; auth/data gated | ST01–ST02. |
| `/examination` | `app/(dashboard)/examination/page.tsx`; `TestDashboard` | Static; auth/data gated | Card/action grids adapt; shared touch/header findings remain. |
| `/examination/create` | `app/(dashboard)/examination/create/page.tsx`; `TestCreator` | Static; auth/session data gated | E01–E02. |
| `/examination/omr` | `app/(dashboard)/examination/omr/page.tsx`; `OmrCheckingPage` | Static; auth/external service/data gated | E06. |
| `/examination/analytics` | `app/(dashboard)/examination/analytics/page.tsx`; index cards | Static; auth/data gated | List grid adapts; shared findings. |
| `/examination/analytics/[testId]` | detail page; `TestAnalytics` | Static; auth/data gated | E03–E05. |
| `/examination/tests/[testId]` | detail page; `TestWorkspace` | Static; auth/data gated | Horizontal tabs are contained; E02/S05 and long-content notes apply. |

The catch-all `[slug]` recognizes `questions`, `history`, `drafts`, `templates`, `slide-templates`, and redundantly `examination`; unknown slugs fall through framework handling. There is no project-specific `not-found.tsx` or `error.tsx`, so framework error/404 presentation is an audit gap and should be included in implementation verification.

API routes inspected for UI dependencies but not counted as pages: analytics PDF, OMR checker/fetch/preview/scan/sheet, questions, school-test prepare/process, student suggestions, and the WorkOS webhook.

## Findings

Each finding includes an exact source anchor, affected range, reproduction, and the intended adaptive behavior. References identify the current source line at the audited revision.

### Shared shell, navigation, controls, and global layout

#### S01 — Navigation becomes unreachable between 641 and 768 px — **High**

- **Source:** `components/dashboard/DashboardLayoutClient.tsx:22`; `components/dashboard/sidebar/HamburgerMenu.tsx:14`; `components/dashboard/sidebar/Sidebar.tsx:29`.
- **Affected:** 641–768 px, including small tablets, phone landscape, split-screen tablets, and zoom-equivalent layouts.
- **What breaks / why:** JavaScript treats widths through 768 px as mobile and converts the sidebar to an off-canvas panel, while the hamburger is hidden from Tailwind's `sm` breakpoint (640 px) upward. Once the panel is closed, no control can reopen it.
- **Reproduce:** Authenticate, set 700×900 or 768×1024, close/click outside the sidebar, and try to reach another top-level route.
- **Expected:** One shared breakpoint contract must control both panel mode and trigger visibility; an off-canvas sidebar always has a visible trigger, and a persistent sidebar never depends on it.

#### S02 — Mobile sidebar is visually off-canvas but not behaviorally modal — **High**

- **Source:** `components/dashboard/DashboardLayoutClient.tsx:51-76,127-137`; `components/dashboard/sidebar/Sidebar.tsx:23-32`.
- **Affected:** 280–768 px, touch devices, keyboard users, and 200% zoom.
- **What breaks / why:** The sidebar has no scrim, focus trap, Escape handling, inert background, focus return, or guaranteed close-on-navigation. Outside close listens to `mousedown`, not pointer/touch semantics. Background controls remain perceivable and reachable.
- **Reproduce:** Open the sidebar at 390×844; Tab through controls, press Escape, activate a route, and tap the visible page outside the panel.
- **Expected:** Use a proper modal sheet/drawer: scrim, `aria-modal`, trapped focus, Escape and scrim close, pointer support, focus return, route-change close, and a non-scrollable/inert background.

#### S03 — Full-height shells use static viewport units — **Medium**

- **Source:** `components/dashboard/DashboardLayoutClient.tsx:127-128`; `components/onboarding/FormComponents.tsx:136`; `components/question/FilterControls.tsx:380-384`; `components/slides/SlideDeckDialog.tsx:184`.
- **Affected:** phones with collapsing browser chrome, landscape phones, virtual-keyboard states, and zoomed short viewports.
- **What breaks / why:** `h-screen`, `min-h-screen`, and `vh` assume a stable layout viewport. Mobile browser chrome and the keyboard change the usable visual viewport, causing bottom actions or nested scroll regions to sit behind chrome.
- **Reproduce:** Open a long form/dialog on iOS Safari or Android Chrome, focus the last text field, rotate to landscape, and attempt to reach the footer.
- **Expected:** Use `dvh`/`svh`-aware sizing with safe-area padding and a single deliberate scroll region whose footer remains reachable.

#### S04 — Page breakpoints ignore the persistent 256 px sidebar — **High**

- **Source:** `components/dashboard/content/MainContent.tsx:6`; representative failures at `components/examination/TestCreator.tsx:182`, `components/dashboard/slide-templates/SlideTemplateEditor.tsx:228`, and `components/dashboard/questions/QuestionBankViewerContent.tsx:26`.
- **Affected:** 1024–1279 px laptop/tablet landscape, split-screen desktop, and any width where the sidebar remains open.
- **What breaks / why:** `lg` page layouts activate from viewport width even though the content region is roughly viewport minus the sidebar and shell padding. A 1024 px viewport can leave only about 700–750 px for layouts designed as two or three desktop columns.
- **Reproduce:** At 1024×768 with the desktop sidebar open, open test creation or the slide editor and compare actual column widths with the same page after collapsing/removing 256 px.
- **Expected:** Use container queries or content-width breakpoints; delay dense multi-column modes until the page container, not the window, has enough width.

#### S05 — Shared and custom interaction targets are below touch guidance — **High**

- **Source:** `components/ui/button.tsx:27-30` (36–40 px); `components/ui/input.tsx:11` (36 px); `components/ui/checkbox.tsx:17` (16 px); `components/dashboard/content/Header.tsx:147-168` (32 px); many page-specific examples in Q03, T03, SC02, and SC03.
- **Affected:** all touch devices, motor-impaired users, and zoomed interfaces.
- **What breaks / why:** Primary controls are routinely 16–40 px, with custom icon actions as small as 24–28 px. Closely packed targets increase mis-taps and make editor handles effectively unusable.
- **Reproduce:** Use touch target inspection or operate the header, checkboxes, inline delete/flag actions, and editor handles on a phone/tablet without precision zoom.
- **Expected:** Provide at least a 44×44 px hit area for primary touch controls and 24×24 px minimum WCAG target size without target overlap; visual glyphs may remain smaller inside padded hit areas.

#### S06 — Raw controls drop to 14 px and trigger iOS focus zoom — **High**

- **Source:** `app/globals.css:82,93` applies `clamp(0.875rem, 2.5vw, 1rem)` to body and raw `input`, `textarea`, `select`, and `button`.
- **Affected:** small phones, especially iOS Safari, and 200% zoom.
- **What breaks / why:** At small widths the clamp resolves to 14 px. iOS commonly zooms focused controls below 16 px, changing effective layout width and hiding adjacent actions.
- **Reproduce:** On a 320/375 px iPhone, focus a raw control in school-test question editing, OMR setup, or a custom form and observe page zoom/reflow.
- **Expected:** Interactive text inputs render at least 16 CSS px on small screens; visual density should be achieved with spacing, not sub-16 px form text.

#### S07 — Shared dialogs have no default small-screen height/scroll contract — **High**

- **Source:** `components/ui/dialog.tsx:45-69`; close target at `:66`; affected dialogs in P02 and T01.
- **Affected:** phone landscape, short laptops, virtual keyboard, 200–400% zoom, and long/localized content.
- **What breaks / why:** Shared `DialogContent` constrains width but not available height or content scrolling. Long consumers clip their header, fields, footer, or close control; the close action itself has only a 16 px glyph-sized target.
- **Reproduce:** Open a long template/PDF dialog at 667×375 or 1280-wide/200% zoom and Tab through to the footer.
- **Expected:** Default to `max-height: calc(100dvh - safe margins)`, separate fixed header/footer from one scrollable body, and provide a padded 44 px close target.

#### S08 — Header and organization switcher do not have an ultra-narrow/long-content mode — **Medium**

- **Source:** `components/dashboard/content/Header.tsx:90-177`; `components/organization/OrgSwitcher.tsx:251-262` (`max-w-[240px]`, dropdown `w-72`).
- **Affected:** 280–390 px, long organization/user/page names, German/Hindi-like expansion, and 200% zoom.
- **What breaks / why:** Hamburger, organization, breadcrumb/title, search icon, notification, and avatar share one row. The 288 px organization menu can consume nearly the entire viewport before safe margins. Truncation prevents overflow in some labels but makes identity/page context disappear.
- **Reproduce:** At 320 px, use a 40-character organization and page title, open the organization menu, then inspect both left and right collision boundaries.
- **Expected:** Define priority: always retain menu and current-page identity, condense secondary controls into an overflow menu, cap popovers to `calc(100vw - margins)`, and preserve full names inside the menu.

#### S09 — Page padding and wide-screen utilization are inconsistent — **Low**

- **Source:** shared `components/dashboard/content/MainContent.tsx:6` is combined with route-specific `px-4`, `px-6`, `p-6`, and mixed `max-w-3xl`/`max-w-7xl` containers.
- **Affected:** 280–390 px (over-nesting) and 1440–2560 px (unused or overly stretched regions).
- **What breaks / why:** Nested page padding can consume a disproportionate phone width, while dashboard/list/editor families use unrelated maximum widths on ultrawide panels.
- **Reproduce:** Compare content edges across dashboard, settings, questions, and editors at 320 and 2560 px.
- **Expected:** Establish shell spacing tokens and page-family container widths; data-entry forms stay comfortably capped while dashboards/editors intentionally use available space.

### Public landing and authentication boundary

#### L01 — Landing dashboard mock becomes decorative micro-text on phones — **Low**

- **Source:** `components/landing/Hero.tsx:190-405`, including 9–11 px labels at `:198,267,370,381,399-405`.
- **Affected:** 280–390 px and zoomed layouts.
- **What breaks / why:** The mock is contained, but its desktop-density content scales into unreadable text and tiny pseudo-controls; it no longer demonstrates a credible mobile product experience.
- **Reproduce:** Open `/` at 320×568 and inspect the dashboard mock below the hero.
- **Expected:** Swap to a simplified mobile composition or deliberately mark the mock as decorative; do not present miniature interactive-looking controls as evidence of phone usability.

#### L02 — Mobile landing navigation lacks complete menu semantics and one CTA targets a missing route — **Medium**

- **Source:** `components/landing/Header.tsx:45-79`; `components/landing/Hero.tsx:162` links to `/demo`, for which no App Router page exists.
- **Affected:** phone/tablet navigation and keyboard/screen-reader use.
- **What breaks / why:** The open menu does not close on Escape or manage focus, and its product/workflow buttons do not navigate to sections. “Watch demo” reaches framework 404.
- **Reproduce:** At 320 px open the menu, press Escape and Tab through it; activate “Watch demo.”
- **Expected:** Treat the menu as an accessible disclosure, implement real anchors/routes, close on activation/Escape, and either add `/demo` or remove/change the CTA.

### Onboarding

#### O01 — Fixed-width onboarding fields overflow phones and two-column tablet forms — **High**

- **Source:** `components/onboarding/FormComponents.tsx:41` (`w-80`); `app/onboarding/teacher/setup/page.tsx:115,139,161`; `app/onboarding/institute/setup/page.tsx:108,128,149`.
- **Affected:** roughly 280–767 px, tablet split view, long values, and zoom.
- **What breaks / why:** Each field is fixed at 320 px inside a padded card. At phone widths the available field width is below 320 px; at `sm`, two fixed 320 px fields plus gaps activate before the container can hold them.
- **Reproduce:** Enter either setup flow at 320, 640, and 700 px; inspect name/contact rows and the joined-organization field for card overflow.
- **Expected:** Fields use `w-full min-w-0`; grids remain one column until their container can hold two usable columns, then expand fluidly.

#### O02 — User-type cards are pointer-clickable containers without keyboard parity — **Medium**

- **Source:** `app/onboarding/user-type/page.tsx:112,144-153`; cards use `onClick` without a link/button role or keyboard handler.
- **Affected:** keyboard/assistive technology on every screen; also switch-control users on tablets.
- **What breaks / why:** A visually prominent responsive card cannot be focused or activated without a pointer.
- **Reproduce:** Open the user-type step and attempt to select a role using Tab and Enter/Space only.
- **Expected:** Make the full card a semantic link/button with visible focus, keyboard activation, and the same loading/prefetch behavior.

#### O03 — Onboarding spacing is excessive in short landscape viewports — **Low**

- **Source:** `components/onboarding/FormComponents.tsx:136-137` (`min-h-screen`, `py-12`, inner `px-6`).
- **Affected:** 568×320/667×375 landscape and zoomed short viewports.
- **What breaks / why:** Fixed 48 px top/bottom spacing and nested 24 px horizontal padding delay the first field and increase scrolling without improving comprehension.
- **Reproduce:** Open onboarding in phone landscape and compare the visible form content before the first scroll.
- **Expected:** Use responsive block padding and tighter card gutters on short/narrow screens while keeping comfortable desktop spacing.

### Questions, filtering, forms, selection, and images

#### Q01 — Tablet filters consume the page before questions — **Medium**

- **Source:** `components/dashboard/questions/QuestionBankViewerContent.tsx:26-32`; desktop filter panel is shown from `sm`, while the content grid remains single-column until `lg`.
- **Affected:** 640–1023 px and zoom-equivalent desktop.
- **What breaks / why:** The full multi-section filter panel stacks above the list, creating a long preamble before any question is visible. This is especially costly in tablet portrait.
- **Reproduce:** Open `/questions` at 768×1024 with normal filter data and scroll from the top to the first question.
- **Expected:** Use a compact filter summary + drawer/sheet until the content container can support a side rail; show active chips and result count without forcing the full form open.

#### Q02 — Mobile filter dialog can exceed the visual viewport — **Medium**

- **Source:** `components/question/FilterControls.tsx:373-384` (`h-[90vh]` plus an inner `max-h-[90vh]`).
- **Affected:** phones with browser chrome/keyboard, landscape, and zoom.
- **What breaks / why:** Header, dialog padding, and a 90 vh inner scroller are additive; the footer/end of filters can be obscured. The fixed filter trigger can also collide with other sticky actions and bottom chrome.
- **Reproduce:** Open filters at 390×844, focus a field near the bottom, rotate landscape, and inspect the final controls and floating trigger.
- **Expected:** Use a `100dvh` sheet with fixed header/footer, one `min-h-0` scrolling body, safe-area spacing, and coordinated bottom offsets for floating/sticky actions.

#### Q03 — Question-card selection and inline actions have 16–24 px hit areas — **High**

- **Source:** `components/question/QuestionList.tsx:178-185,210-215,245-250`; similar 16 px selections appear in history cards.
- **Affected:** phones/tablets and motor accessibility.
- **What breaks / why:** Selecting, flagging, refining, or deleting a question requires precision taps near adjacent controls.
- **Reproduce:** On a phone, select several consecutive questions and toggle flag/refine controls without zoom.
- **Expected:** Keep compact glyphs but enlarge the hit box to at least 44 px where practical, preserve spacing between destructive and routine actions, and expose accessible labels.

#### Q04 — Question media and unbreakable math can escape narrow cards — **High**

- **Source:** `components/question/QuestionList.tsx:269-286`; question image declares `width={300}` without an explicit `max-w-full`; question/answer KaTeX containers have no consistent overflow policy.
- **Affected:** 280–360 px, two-pane/split screen, long equations, and 200–400% zoom.
- **What breaks / why:** After shell/card/checkbox padding, usable content can be below 300 px. Wide equations or unbroken text can increase card scroll width and push actions out of view.
- **Reproduce:** At 320 px load a question with a 300 px image and a long display equation/unbroken URL; inspect card and document scroll widths.
- **Expected:** Media uses `max-width:100%; height:auto`; prose wraps safely; equations receive an intentional local horizontal scroller with visible affordance instead of expanding the page.

#### Q05 — The virtualized list creates a viewport-height nested scroll area — **Medium**

- **Source:** `components/question/QuestionList.tsx:495-500` (`max-h-[calc(100vh-8rem)] overflow-y-auto`) inside the already scrolling `MainContent`.
- **Affected:** phones, short laptops, browser-chrome changes, keyboard, and zoom.
- **What breaks / why:** Two vertical scroll owners compete; sticky selected actions and load-more state can appear detached or become difficult to reach.
- **Reproduce:** At 390×844 select questions, scroll the page and inner list separately, then focus a control while the keyboard is open.
- **Expected:** Prefer window/main-content virtualization, or give the page an explicit `dvh` flex layout with exactly one list scroller and sticky regions inside that owner.

#### Q06 — Selected-question action rows are forced into three equal phone columns — **High**

- **Source:** `components/question/SelectedQuestionsActions.tsx:63-77,113-136`; nested `flex-row` groups contain select/unselect/create and PDF/slides/save actions.
- **Affected:** 280–639 px, long/localized labels, and zoom.
- **What breaks / why:** Six text actions are split into two no-wrap rows; labels compress, wrap internally, or overflow, and the sticky block consumes a large fraction of a phone viewport.
- **Reproduce:** Select at least one question at 320 px and inspect both action rows using long labels.
- **Expected:** Keep the primary next action visible; move secondary operations to an overflow menu or 2-column grid, allow stable wrapping, and use a compact safe-area-aware bottom action sheet on phones.

#### Q07 — Pagination component has no narrow-screen wrapping strategy — **High**

- **Source:** `components/question/question-list/PaginationControls.tsx:20-51`.
- **Affected:** 280–640 px and localized labels whenever this uncommon pagination state is rendered.
- **What breaks / why:** Navigation, range text, page-size, and count controls share one unwrapped row.
- **Reproduce:** Render the pagination state at 320 px with multi-digit page counts and inspect horizontal overflow.
- **Expected:** Stack summary/page-size below primary previous/next controls, collapse individual page controls, or provide a compact pager.

#### Q08 — Logo/file input has no robust long-filename phone state — **Medium**

- **Source:** `components/question/LogoUploader.tsx:51-69`.
- **Affected:** 280–390 px, long filenames, localized file-input pseudo-buttons, and zoom.
- **What breaks / why:** Native file button + filename are placed in a fixed-height one-line input; platform pseudo-elements can overflow or hide the selected name. The image-remove action is also a small padded icon.
- **Reproduce:** At 320 px select a file with a 100-character name using a browser whose file control label is localized.
- **Expected:** Use a responsive upload dropzone/button with filename in a separate truncating/wrapping row, and a full-size accessible remove action.

### PDF configuration, previews, dialogs, and export

#### P01 — PDF detail fields are always two columns on phones — **High**

- **Source:** `components/pdf/PDFDetailsForm.tsx:304` and action region around `:419-452`.
- **Affected:** 280–639 px, zoom, and long field labels/values.
- **What breaks / why:** Ten configuration fields are forced into `grid-cols-2`, leaving roughly 110–145 px per control on common phones after dialog padding. Bottom actions do not define a stable phone stack.
- **Reproduce:** Open PDF settings at 320/375 px and enter long institution/exam text in each field.
- **Expected:** One column on phones, two only after the content container is wide enough, full-width controls, and a footer whose primary/secondary actions stack or wrap predictably.

#### P02 — PDF form and preview dialogs can clip content and footer — **High**

- **Source:** `components/pdf/components/PDFFormDialog.tsx:83`; `components/pdf/components/PDFPreviewDialog.tsx:37`; preview body `components/pdf/components/PDFPreviewContent.tsx:51` uses 70/80 vh.
- **Affected:** phone landscape, tablet split view, short laptops, keyboard, and 200–400% zoom.
- **What breaks / why:** `max-h-[100vh]` is applied without an outer overflow contract; the preview body plus dialog title/footer can exceed the viewport.
- **Reproduce:** Open settings/preview at 667×375 and at 1280-wide/200% zoom; attempt to reach every footer action without scrolling the page behind the modal.
- **Expected:** Fit within `100dvh` minus margins/safe areas, reserve header/footer, and scroll only the body. Preview canvas/iframe should flex to remaining height.

#### P03 — PDF preview support is selected by user agent instead of capability and space — **High**

- **Source:** `components/pdf/pdfPreview.tsx:51-58` matches Android/iPad/iPhone; `components/pdf/components/PDFPreviewContent.tsx:35-52` removes the preview for all matched devices.
- **Affected:** all iPads/Android tablets including large landscape screens; desktop narrow/zoomed layouts; hybrid devices.
- **What breaks / why:** A capable 12.9-inch tablet gets download-only behavior, while a constrained desktop iframe is still forced. This removes workflow parity based on device label rather than rendering ability.
- **Reproduce:** Open the same PDF preview at 1024 px using iPad and desktop user agents, then at 390 px desktop emulation; compare available actions.
- **Expected:** Detect PDF rendering/capability, size the viewer from its container, offer fit/zoom/page controls, and retain download/open-in-new-tab as fallbacks on every device.

### Draft folders and history

#### D01 — Folder action header overflows with export actions — **High**

- **Source:** `components/drafts/FolderHeader.tsx:42,55-56,91-108`.
- **Affected:** 280–640 px, long folder names/role labels, and zoom.
- **What breaks / why:** Add/rename/delete and create-test/PDF actions use nested `flex-nowrap` rows. PDF itself contributes multiple text buttons, producing an action strip wider than the card.
- **Reproduce:** Open a populated editable folder at 320/375 px and enable all owner actions.
- **Expected:** Put folder identity on its own line, retain one primary action, place destructive/secondary exports in a menu or wrapping grid, and never require page-level horizontal scroll.

#### D02 — Draft question reordering is mouse-drag-only — **High**

- **Source:** `components/drafts/QuestionItem.tsx:63-66`; reorder/save flow in `components/drafts/QuestionList.tsx:65-97`.
- **Affected:** phones, touch tablets, keyboard, and assistive technology.
- **What breaks / why:** HTML `draggable` has no touch/keyboard alternative or explicit handle semantics, so users cannot complete the intended order-and-save workflow reliably.
- **Reproduce:** On iOS/Android or using keyboard only, attempt to move the third draft question to first position and save.
- **Expected:** Provide accessible move up/down controls and/or a tested pointer/touch drag system with a large handle, announcements, focus management, and deterministic keyboard reordering.

#### H01 — Paper-history title and action header has no long-content phone mode — **Medium**

- **Source:** `components/dashboard/history/PaperHistoryViewer.tsx:92-145`; title is `text-3xl` in a fixed justify-between row at `:136-145`.
- **Affected:** 280–640 px, long paper titles, localized action labels, and zoom.
- **What breaks / why:** Back/title and action regions compete in one row; title has no `min-w-0`/responsive size contract. Selected export actions add another dense block.
- **Reproduce:** Open a paper with a 100-character title at 320 px, select questions, and expose all PDF/create actions.
- **Expected:** Stack navigation/title/actions at narrow content widths, wrap or line-clamp the title without covering actions, and reuse the compact selected-action pattern from Q06.

### Question templates and slide templates

#### T01 — Question-template editor dialog is clipped and cramped — **High**

- **Source:** `components/dashboard/templates/QuestionTemplatePage.tsx:282-420`; fields are unconditional `grid-cols-2` at `:292`.
- **Affected:** 280–639 px, short landscape, keyboard, long labels, and zoom.
- **What breaks / why:** A long ten-field create/edit dialog has neither a max-height scrolling body nor a phone single-column mode.
- **Reproduce:** Open create/edit at 320×568 and 667×375, focus the last field, and attempt to reach Save/Cancel and Close.
- **Expected:** One column on narrow containers; fixed accessible header/footer; scrollable body sized to `dvh`; preserve unsaved input on orientation change.

#### T02 — Slide editor enters a three-column desktop layout before content fits — **High**

- **Source:** `components/dashboard/slide-templates/SlideTemplateEditor.tsx:228` (`150px + minmax canvas + 260px` at `lg`).
- **Affected:** 1024–1279 px with sidebar, tablet landscape, split-screen desktop, and zoom.
- **What breaks / why:** At 1024 px the sidebar and padding leave a canvas column too narrow for useful slide editing while both rails remain fixed.
- **Reproduce:** Open a template at 1024×768 with the sidebar open and compare canvas/rail usability with a 1440 px window.
- **Expected:** Switch based on editor container width; collapse rails into tabs/drawers until the canvas can retain a usable minimum width.

#### T03 — Slide editor's precision controls are not touch-operable — **High**

- **Source:** resize handle `components/dashboard/slide-templates/SlideCanvas.tsx:468`; format buttons `components/dashboard/slide-templates/FormatBar.tsx:63`; duplicate/delete glyphs `components/dashboard/slide-templates/SlideTemplateEditor.tsx:264-282`.
- **Affected:** all phones/tablets and motor-impaired pointer users.
- **What breaks / why:** The resize handle is 12 px, format buttons 32 px, and thumbnail actions effectively glyph-sized. The canvas has pointer handlers but no clear touch gesture/scroll arbitration contract.
- **Reproduce:** On a touch tablet, select, move, resize, duplicate, delete, and format a small element without pinch-zooming the browser.
- **Expected:** Large contextual handles/hit areas, `touch-action` scoped by gesture, keyboard/numeric alternatives for position/size, and touch-safe thumbnail/action controls.

#### T04 — Slide/slide-deck mobile workflow scatters controls and can crowd theme/footer rows — **Medium**

- **Source:** stack order in `components/dashboard/slide-templates/SlideTemplateEditor.tsx:228-290`; deck dialog sizing/footer `components/slides/SlideDeckDialog.tsx:179-185,263,401-420`.
- **Affected:** 280–767 px, landscape, multiple themes, and zoom.
- **What breaks / why:** Canvas, slide rail, and inspector become a long serial page, so selecting an element can require substantial scrolling to edit it. Theme choices and final actions lack a fully defined narrow wrapping/overflow model.
- **Reproduce:** At 390 px select a lower slide and an element, change typography, select a theme, preview, and generate the deck.
- **Expected:** Use persistent mobile tabs or bottom sheets for Slides/Canvas/Inspector; horizontally scroll theme chips with affordance; stack footer actions with the primary action last and visible.

### School-test upload, verification, crop, and touch-up

#### SC01 — Phone verifier makes the editable list follow a tall source preview — **Medium**

- **Source:** `components/school-test/Verifier.tsx:278-292,601-631`; source is `order-1`, question list `order-2`, image region up to 72 vh.
- **Affected:** 280–1023 px, especially phone portrait and long multi-page uploads.
- **What breaks / why:** Users may scroll through most of a large page image before reaching extracted questions, then scroll back to compare source and edits.
- **Reproduce:** Upload a multi-page paper at 390×844, select a page, edit its first extracted question, and cross-check the source repeatedly.
- **Expected:** Provide Source/Questions tabs, a collapsible sticky thumbnail, or a split mode selected by container width; preserve page context while editing.

#### SC02 — Crop editor header and 12 px handles are not viable on phones — **High**

- **Source:** `components/school-test/CropEditor.tsx:389-447,491,535-548`.
- **Affected:** phones, touch tablets, landscape, and motor accessibility.
- **What breaks / why:** Title, Fit, Reset, and Close compete in one header; corner handles are 12 px even though the canvas is `touch-none`. Fine crop adjustments are error-prone and may obscure the intended boundary under a finger.
- **Reproduce:** At 320/390 px open crop, set all four corners precisely, use Fit/Reset, rotate, and confirm.
- **Expected:** Move secondary controls into an overflow row, provide 44 px invisible hit regions around visible handles, support pan/zoom and numeric/edge alternatives, and keep Cancel/Apply safe-area visible.

#### SC03 — Verification/editing toolbars use 27–28 px controls — **High**

- **Source:** page controls `components/school-test/Verifier.tsx:731`; marks/refine/delete/options `components/school-test/QuestionCard.tsx:57-72,123,209-224`; touch-up toolbar `components/school-test/TouchUpEditor.tsx:253-348`.
- **Affected:** phones/tablets and accessibility zoom.
- **What breaks / why:** Repeated, adjacent editing targets are below comfortable touch size; several labels are 10–13 px. Accidental delete/refine/mark changes are plausible in a critical verification workflow.
- **Reproduce:** On a phone, change marks, refine a question, add/delete options, switch pages, erase/undo a touch-up, and save.
- **Expected:** Enlarge hit areas and control text, separate destructive actions, use context menus where density is necessary, and keep core actions usable with touch and keyboard.

### Examination creation, workspace, OMR, and analytics

#### E01 — Test creator's form/preview split activates too early — **High**

- **Source:** `components/examination/TestCreator.tsx:182,246`.
- **Affected:** 1024–1279 px with sidebar, tablet landscape, small laptops, split view, and zoom.
- **What breaks / why:** Two columns activate at viewport `lg`; with the sidebar open each column is around 340 px. Form labels/actions and the sticky preview become narrow while consuming full viewport height.
- **Reproduce:** Open `/examination/create` at 1024×768 with selected-question session data and sidebar open; edit details while viewing preview.
- **Expected:** Keep one column until the content container can support both form and a meaningful preview; on smaller widths make preview a tab/sheet or collapsible full-width section.

#### E02 — Real-time PDF preview imposes tall minimums on small screens — **Medium**

- **Source:** `components/examination/test-creator/RealTimePDFPreview.tsx:413-456` (400/500 px minimums); `components/examination/test-creator/PDFBlobViewer.tsx:62` (600 px minimum).
- **Affected:** 280–767 px, phone landscape, short laptops, and zoom.
- **What breaks / why:** Preview/error/loading regions force 400–600 px heights regardless of available viewport, extending the page and separating configuration from actions. Preview tabs are only 28 px tall.
- **Reproduce:** Open create/workspace preview at 390×844 and 667×375 in loading, error, HTML, and PDF states.
- **Expected:** Size preview to remaining `dvh`, offer compact tabs with valid targets, and allow open/download/full-screen fallback without imposing desktop minimum height on the page.

#### E03 — Analytics header collides on phones — **High**

- **Source:** `components/examination/TestAnalytics.tsx:177-197`.
- **Affected:** 280–639 px, long test titles, localized Export label, and zoom.
- **What breaks / why:** Back/title block and Export PDF are forced into a `flex-row justify-between`; the left block only partially adapts internally.
- **Reproduce:** Open analytics for a long-titled test at 320/375 px and increase text to 200%.
- **Expected:** Stack header actions by container width; let the title wrap/line-clamp with `min-w-0`; make export full-width or place it in an action menu.

#### E04 — Ten-column score distribution is unreadable on phones — **Medium**

- **Source:** `components/examination/analytics/ScoreDistribution.tsx:14-22`.
- **Affected:** 280–767 px and zoom.
- **What breaks / why:** Ten columns plus gaps and range labels such as `90–99` are squeezed into a narrow card, causing label overlap or illegible bars.
- **Reproduce:** Populate every score bucket and open analytics at 320 px/200% zoom.
- **Expected:** Use fewer responsive ticks, a horizontally scrollable chart with explicit minimum width, or a mobile list/compact histogram with accessible values.

#### E05 — Student performance rows have no long-name/long-topic layout — **Medium**

- **Source:** `components/examination/analytics/StudentPerformance.tsx:33-53,64-86`.
- **Affected:** 280–640 px, long student/class/chapter/topic names, localized text, and zoom.
- **What breaks / why:** Identity and score/PDF controls share a row; expanded detail rows use `justify-between`, so long labels compete with metrics.
- **Reproduce:** Use 50-character student/chapter names at 320 px, expand a student, and inspect the PDF control and topic metrics.
- **Expected:** Stack identity/actions on narrow containers, clamp with a way to reveal full text, and use definition-list/grid rows whose values do not overlap labels.

#### E06 — OMR setup and result table squeeze instead of adapting — **High**

- **Source:** `components/examination/OmrCheckingPage.tsx:470,505,567,642-687`; table is `w-full` without a useful minimum width.
- **Affected:** 280–900 px, long names/IDs, and zoom.
- **What breaks / why:** Setup/name/roll and action areas are always two columns on phones. The six-column results table has an overflow wrapper but no minimum table width, so cells compress to unreadable slivers rather than producing intentional local scrolling.
- **Reproduce:** At 320/375 px enter long student details, run a scan with mixed results, and inspect all table columns and actions.
- **Expected:** Stack setup/actions on phones; give the table semantic minimum column widths and local horizontal scroll with a sticky identity column, or render mobile result cards.

### Classes, roster, profile, settings, and command palette

#### C01 — Roster and import tables do not define a mobile column strategy — **Medium**

- **Source:** `components/roster/RosterTable.tsx:82-167`; import preview `components/roster/RosterImport.tsx:165-176`.
- **Affected:** 280–767 px, long names/IDs/notes, and zoom.
- **What breaks / why:** The roster wrapper can scroll, but the table has no explicit minimum width/column priorities; view mode may squeeze while edit mode expands unpredictably. Import preview has vertical overflow but no dedicated horizontal containment.
- **Reproduce:** Load 20 students with long names/IDs/notes at 320 px; view, edit, then import a CSV and inspect every preview column.
- **Expected:** Define mobile cards or a table minimum width with local x-scroll, sticky key column/header, explicit wrapping/truncation, and controls with valid touch targets.

#### ST01 — Pending team invitation rows cannot fit phone widths — **High**

- **Source:** `components/settings/TeamSection.tsx:277-336`.
- **Affected:** 280–767 px, long email addresses, multiple invitation actions, localized labels, and zoom.
- **What breaks / why:** Icon, email/detail, status chip, and Resend/Copy link/Revoke controls are held in one row. Even with email truncation, the fixed trailing controls consume most phone width.
- **Reproduce:** At 320/375 px open Settings → Team with a pending invitation using a long email; expose every available action.
- **Expected:** Stack identity/status and actions, make the email revealable/copyable, and consolidate secondary/destructive actions into a labeled overflow menu.

#### ST02 — Profile/preferences rows lose information at narrow and zoomed widths — **Medium**

- **Source:** `components/settings/PreferencesSection.tsx:57-90` (fixed 128 px selects); profile label/value rows in `app/(dashboard)/profile/page.tsx`; member rows `components/settings/TeamSection.tsx:221-266`.
- **Affected:** 280–390 px, long emails/names/IDs, localization, and 200–400% zoom.
- **What breaks / why:** Fixed labels/selects and trailing membership controls compete with identity text. Truncation prevents page overflow but can remove the only visible version of an ID/email.
- **Reproduce:** At 320 px/200% text, use long identity values, inspect profile fields, change both preferences, and inspect member role/leave actions.
- **Expected:** Stack label/control rows at narrow container widths, allow copy/reveal of truncated values, and keep membership actions in a touch-safe secondary row/menu.

#### CP01 — Command palette height and footer assume a hardware keyboard — **Medium**

- **Source:** `components/dashboard/CommandPalette.tsx:186-203,265-278`; shared dialog behavior in S07.
- **Affected:** phone virtual keyboard, landscape, zoom, and touch-only devices.
- **What breaks / why:** Results use a fixed 360 px maximum plus header/footer; the virtual keyboard can cover results. Footer space is devoted to Enter/arrow shortcuts even on touch devices.
- **Reproduce:** Open search at 390×844 and 667×375, focus input with virtual keyboard, scroll to the last result, and activate it by touch.
- **Expected:** Size results from remaining visual viewport, keep focused results visible, hide/replace keyboard hints on coarse pointers, and retain a large touch row.

## Page-by-page disposition and positive evidence

This section makes explicit what was reviewed even where no unique defect was filed.

- **Landing:** header disclosure, hero, dashboard mock, workflow/how-it-works content, feature grids, CTA and footer were reviewed. The grid/CTA/footer stack correctly and the page had zero horizontal overflow in every live viewport. Findings L01–L02 remain.
- **Auth handlers:** local routes contain no UI; hosted WorkOS presentation is out of repository scope and unverified (GAP-01).
- **Onboarding:** user-type selection and both teacher/institute paths were inspected, including join/create organization branches, subject/class grids, validation, loading and submit states. O01–O03 cover the responsive failures.
- **Dashboard:** greeting/stat cards/recent papers/quick actions and empty/loading states were inspected. The card grids adapt from one to multiple columns; the shared shell S01–S09 is the limiting factor.
- **Questions:** filter rail/drawer, selected state, virtualized list, flags/refinement, images/options, loading/empty/error/load-more, PDF and slide generation were reviewed. Q01–Q08, P01–P03, and T04 apply.
- **Post:** question editor fields, dynamic options, marks/difficulty/type, image/logo inputs, validation and submit were inspected. The main grids stack, but S05–S07 and Q08 apply; rich/math content needs the Q04 overflow contract.
- **History:** history cards/list and paper detail/selection/export were inspected. List grids stack correctly; H01 and shared selection/PDF issues apply.
- **Drafts:** empty folders, folder cards, detail header, selection, role-gated actions, reorder/save, delete dialogs and exports were inspected. D01–D02 apply.
- **Question templates:** responsive card list/empty states are adequate; create/edit/delete dialogs produce T01.
- **Slide templates:** list, create/duplicate/delete, editor slide rail, canvas, selection/resize, layers/formatting, and deck generation/preview were inspected. T02–T04 apply.
- **School test:** upload dropzone, preparing/processing status, page tabs, source regions, extraction review, refine/delete/marks, crop/touch-up, preview, error and create-test handoff were inspected. Upload dropzone and modal body containment are generally sound; SC01–SC03 apply.
- **Classes:** list/create/empty states adapt correctly. Class detail roster view/edit/add and CSV mapping/validation/preview/import are covered by C01.
- **Profile:** identity hero, detail rows and sign-out were inspected; ST02/shared targets apply.
- **Settings:** workspace, members, invitations, preferences, destructive/leave and loading states were inspected. ST01–ST02 apply.
- **Examination dashboard:** list/empty/status cards and create/open/analytics/OMR action grids adapt. Shared touch/header findings apply.
- **Test creator:** session-data empty state, details, selected questions, template, live HTML/PDF preview and navigation were inspected. E01–E02 apply.
- **Test workspace:** summary cards, horizontally scrolling tabs, questions, answer key, settings and previews were inspected. Tabs remain locally contained; E02/S05 apply, and long question math requires Q04's policy.
- **OMR:** setup, upload/camera inputs, processing, result stats, scan image, detected values and results table were inspected. E06 applies.
- **Analytics index/detail:** cards, overview statistics, score distribution, chapter/topic analysis, student accordions and export were inspected. Index grids adapt; E03–E05 apply to detail.
- **Loading states:** dashboard catch-all, post, school-test, examination and onboarding loading files were reviewed; simple skeleton stacks do not introduce a unique overflow fault, but must be regression-tested within the corrected shell.
- **404/error states:** no custom project UI exists; verify framework output and add product-specific states if required by the product definition.

## Cross-screen component-family assessment

| Family | Current risk | Required contract | Findings |
|---|---|---|---|
| Navigation/sidebar/header | Breakpoint mismatch, non-modal drawer, crowded identity/actions | One content-aware breakpoint source; accessible sheet; priority/overflow model | S01, S02, S08 |
| Page containers/cards | Nested gutters and viewport-based columns | Standard gutters, container queries, deliberate wide caps | S04, S09 |
| Forms | Fixed widths, premature 2-col grids, 14 px raw controls | `w-full min-w-0`; 16 px fields; container-based grids | S06, O01, P01, T01, E06 |
| Tables | Squeeze despite overflow wrappers | Minimum column widths or mobile cards; local x-scroll; sticky identity | E06, C01 |
| Filters/toolbars/action groups | Dense no-wrap rows, competing sticky/FAB regions | Primary-action priority, overflow menus, stable wrap/grid, safe areas | Q01, Q02, Q06, D01, E03 |
| Dialogs/dropdowns | Width-only constraint; fixed vh; oversized popovers | `dvh` envelope; fixed header/footer + one body scroller; viewport-capped popovers | S07, S08, P02, T01, CP01 |
| Rich text/math editors | No global wide-content policy | Wrap prose; local equation/code scroll; visible affordance; preserve actions | Q04, H01 |
| Precision editors | Tiny handles/actions; uncertain touch gestures | Large hit areas, touch-action design, keyboard/numeric alternatives | T03, SC02, SC03 |
| Images/PDF/OMR previews | Fixed intrinsic widths/heights and UA gating | Fluid media; fit/zoom/full-screen/download; capability detection | Q04, P03, SC01, E02, E06 |
| Uploads | Long native filename and dense post-upload editing | Dedicated filename row, responsive dropzone, touch-safe edit/crop | Q08, SC02, SC03 |
| Reordering | HTML5 mouse drag only | Touch/pointer drag plus keyboard move controls and announcements | D02 |
| Charts/analytics | Fixed dense labels/rows | Responsive ticks, local scroll or alternate mobile representation | E04, E05 |

## Phased remediation plan

### Phase 0 — Measurement and regression harness

1. Add authenticated seed fixtures for teacher and institute roles, populated/empty organizations, long localized data, representative images/math, multi-page uploads, tests, OMR scans, and pending invites.
2. Add Playwright projects for the acceptance matrix below, console/page-error capture, overflow assertions, screenshots, and critical-workflow checks.
3. Record baseline screenshots only after stable authenticated fixtures exist; the public-only captures from this audit are not sufficient regression baselines.

### Phase 1 — Shared responsive foundations

1. Unify sidebar mode/trigger breakpoints and implement an accessible sheet (S01–S02).
2. Replace static viewport height assumptions with a `dvh`/safe-area layout contract (S03).
3. Introduce page-container spacing and content-width/container-query primitives (S04, S09).
4. Raise shared target sizes and phone input text size (S05–S06).
5. Give dialogs/popovers a reusable viewport envelope, scroll-body, close target, and collision padding (S07–S08).
6. Define reusable responsive action-bar, data-table, media/math-overflow, and file-upload primitives.

### Phase 2 — Core question and document workflows

1. Questions filters/list/selection/pagination/media (Q01–Q07).
2. Post/question inputs and logo/file upload (Q08).
3. PDF field grids, dialog structure, preview sizing and capability selection (P01–P03).
4. History and draft headers, selection reuse, and accessible reordering (D01–D02, H01).

### Phase 3 — Authoring and extraction editors

1. Question-template dialog (T01).
2. Slide editor container breakpoints, mobile inspector, touch handles and deck dialog (T02–T04).
3. School-test verifier information architecture, crop, touch-up and question controls (SC01–SC03).

### Phase 4 — Examination, analytics, and roster/settings families

1. Test creator/workspace preview layout (E01–E02).
2. Analytics header, charts, long-content rows (E03–E05).
3. OMR setup and result presentation (E06).
4. Roster/import responsive table strategy (C01).
5. Team/profile/preferences and command-palette narrow states (ST01–ST02, CP01).

### Phase 5 — Edge states and full matrix verification

1. Long/localized/RTL-like expansion, 200–400% zoom, text resizing, keyboard open, orientation changes and safe areas.
2. Loading, empty, error, permission/role, offline/external-service failure, and 404 states.
3. Real iOS Safari, Android Chrome, iPadOS Safari and desktop browser spot checks after automated coverage passes.

## Acceptance matrix

Every row must be exercised with both default and long/localized fixture content where the workflow contains user text.

| Device/context | CSS viewport | Orientation/input | Required assertions |
|---|---:|---|---|
| Small phone | 320×568 | portrait, touch | No page x-overflow; 44 px primary targets; forms one column; all dialog footers/actions reachable; safe-area bottom actions. |
| Common phone | 375×667, 390×844 | portrait, touch | Shell/navigation, keyboard-open forms, question selection/export, upload/crop, OMR and team actions complete. |
| Phone landscape | 568×320, 667×375, 844×390 | landscape, touch | `dvh` dialogs/sheets; no clipped close/footer; one deliberate vertical scroller; orientation preserves state. |
| Small tablet / awkward | 600×960, 700×900 | portrait, touch/keyboard | No S01 dead zone; correct filter/sidebar mode; no premature dense grids. |
| Tablet portrait | 768×1024 | touch/keyboard | Navigation remains reopenable; dialogs/tables/editors fit; long content does not hide context. |
| Tablet landscape | 1024×768 | touch/mouse/keyboard | Sidebar-aware container breakpoints; editors/test creator do not enter cramped desktop mode. |
| Small laptop | 1280×720 | keyboard/mouse | Short-height dialogs/previews fit; sticky regions do not cover content; full workflow with 200% zoom equivalent. |
| Standard desktop | 1366×768, 1440×900 | keyboard/mouse | Expected multi-column layouts, clear focus order, no unnecessary nested scrolling. |
| Wide/ultrawide | 1920×1080, 2560×1080 | keyboard/mouse | Readable line lengths; forms capped; dashboards/editors use space intentionally; popovers remain anchored. |
| Browser zoom | 1280 at 200%, 1440 at 300%, 1280 at 400% where applicable | keyboard/mouse | Reflow without page x-overflow except intentional local data/media scrollers; no lost functionality or overlapping controls. |
| Text-only scaling | 200% text | all | Labels/values/actions wrap or stack; no clipping; long titles and invitations remain operable. |
| Virtual keyboard | phone portrait/landscape | touch | Focused control is visible; submit/footer remains reachable; layout uses visual viewport. |

### Interaction and accessibility checks for every applicable matrix cell

- Keyboard: logical Tab order; visible focus; Enter/Space activation; Escape dismissal; focus trap/return for modal surfaces; keyboard reorder and editor alternatives.
- Touch: no hover-only action; targets meet the product's 44 px policy; no overlapping targets; drag/crop/resize works without unintended page pan.
- Mouse/trackpad: hover is supplementary; nested scrolling is clear; sticky content does not trap wheel/trackpad input.
- Overflow: assert `scrollWidth <= clientWidth` for the document; allow only named local scrollers for tables, equations, tabs, and canvases; give each a visible cue.
- Zoom/reflow: 200% and 400% checks; no two-dimensional page scrolling; dialogs and dropdowns remain inside the visual viewport.
- Accessibility: semantic headings/landmarks, names for icon actions, status announcements, contrast/focus visibility, reduced-motion compatibility, and screen-reader reading order matching visual order.

### Core end-to-end workflows that must pass

1. Sign up/sign in/forgot password → choose user type → create or join organization → reach dashboard.
2. Browse/filter/search questions → select/refine/flag → create test → configure details → preview/export PDF and slides.
3. Create a question with long math, options, solution, and image/logo upload.
4. Open history → inspect paper → select/export questions.
5. Create folder → add/reorder/remove questions → save order → export/create test.
6. Create/edit/delete question template; create/edit/duplicate/delete slide template; touch/keyboard edit a slide element.
7. Upload a multi-page school test → process → navigate pages → crop/touch-up → edit/refine questions → preview → create test.
8. Create/open an examination → edit details/questions/answer key → preview → run OMR scan → inspect every result field.
9. Open analytics → export PDF → read overview/distribution/topics → expand student detail.
10. Create class → add/edit/delete roster member → import CSV with warnings/errors/long values.
11. Edit workspace/preferences → invite/resend/copy/revoke member → leave/destructive states → profile/sign out.
12. Use sidebar, organization switcher, command palette and account menu at every breakpoint, with keyboard and touch.

## Recommended bounded implementation workstreams

The following can be sequential or parallel once the shared contracts are agreed. Workstreams A and B should land first; C–H can then proceed in parallel with limited overlap.

| Workstream | Scope | Dependencies / safe boundary |
|---|---|---|
| A. Shell and viewport primitives | S01–S04, S08–S09; sidebar sheet, header priorities, `dvh`, page containers | First; owns dashboard shell/shared layout only. |
| B. Controls and overlays | S05–S07; Button/Input/Checkbox/Dialog/Popover/action-bar primitives | First or parallel with A; coordinate UI primitive API changes. |
| C. Questions and PDF | Q01–Q08, P01–P03, H01 | After A/B; owns question, PDF, history components. |
| D. Drafts and templates | D01–D02, T01 | After B; reuse action/dialog/reorder primitives; avoid slide editor files. |
| E. Slide authoring | T02–T04 | After A/B; isolated to slide-template/deck components. |
| F. School-test | SC01–SC03 | After A/B; isolated upload/verifier/editor family; external-service fixtures required. |
| G. Examination/analytics/OMR | E01–E06 | After A/B; coordinate PDF primitive usage with C. |
| H. Roster/settings/profile/search | C01, ST01–ST02, CP01 | After A/B; mostly isolated page families. |
| I. Test fixtures and matrix automation | Phase 0 plus full acceptance matrix | Starts immediately; updates assertions as A–H land; should not change product behavior. |

Avoid splitting by arbitrary viewport (“mobile team” vs “desktop team”): every component needs one adaptive contract, and separate device implementations would drift.

## Known audit gaps and limitations

### GAP-01 — Authentication and callback configuration

Protected/onboarding URLs redirected successfully to WorkOS, but no audit account/session was supplied. The local environment generated `redirect_uri=http://localhost:3000/auth/callback` while the audited server ran at port 3012 because port 3000 was occupied by an unrelated application. Hosted sign-in/sign-up/forgot-password presentation and the post-callback state were not visually audited. No account, invitation, organization, or external state was created.

### GAP-02 — Seed data and role coverage

There was no guaranteed fixture set for teacher vs institute, owner/admin/member/viewer, joined vs new organization, populated vs empty folders/classes/tests, pending/expired invitations, long/localized content, or large datasets. Static branch/state review was used, but runtime measurements and screenshots for these states remain required.

### GAP-03 — External processing and browser-native viewers

School-test preparation/extraction, PDF rendering/download behavior, analytics export, OMR generation/scanning, image sources, and camera/file-picker behavior depend on external services, browser plugins, or realistic files. Their layout code was reviewed, but end-to-end results need stable test fixtures and real-device verification.

### GAP-04 — Real-device/browser coverage

Live evidence used a Chromium automation viewport, not physical iOS Safari, iPadOS Safari, Android Chrome, Firefox, or Safari desktop. UA-specific PDF behavior (P03), safe areas, mobile browser chrome, virtual keyboards, file inputs, touch drag and camera capture particularly require physical/browser coverage.

### GAP-05 — Error, 404, latency, and offline states

No custom `error.tsx`/`not-found.tsx` UI was found, and authenticated API failures could not be induced safely without fixtures. Network latency, partial data, retry, offline and external-service error presentations were statically sampled where present but not exhaustively live-tested.

### GAP-06 — Screenshot artifacts

Public-page screenshots were captured transiently for 320, 375, 640 zoom-equivalent, 667 landscape, 700, 768, 1024, 1366, and 2560 widths. They were not committed because they only document the public landing page—which passed containment—and would not substantiate the protected-page findings. Durable authenticated baselines should be generated by Workstream I.

## Final definition of done for BLA-112

BLA-112 is done only when all of the following are true across the **whole project**, not only Questions and not only phones:

1. Every route and state in the inventory has a live audit result at applicable matrix viewports; GAP-01–GAP-05 are closed or explicitly accepted by product/engineering with rationale.
2. All blocker/high findings in this report are fixed; medium findings are fixed or consciously accepted with documented evidence; no new responsive regression is introduced.
3. The sidebar/header/navigation remains discoverable, operable, and accessible at every width and orientation, including 641–768 px and browser zoom.
4. The document never horizontally scrolls at 320 CSS px or at 200–400% zoom. Any table/equation/tab/canvas horizontal scroller is local, intentional, keyboard-operable, and visually discoverable.
5. Forms reflow without clipped labels/values/actions; phone input text does not trigger focus zoom; virtual keyboards and orientation changes do not hide the focused field or submit action.
6. Dialogs, dropdowns, sheets and command palette fit the visual viewport, preserve safe areas, have one clear scroll owner, and support keyboard focus/Escape/return.
7. Touch targets and precision editor operations meet the adopted target policy; every drag/crop/resize/reorder action has usable touch and keyboard behavior.
8. Images, rich text, long math, PDFs, slide previews, upload previews and OMR scans adapt without page overflow and retain a functional view/open/download path on phones, tablets and desktops.
9. Tables, charts, cards, filters, toolbars and action groups use a documented mobile/tablet/desktop representation rather than merely shrinking desktop content.
10. All 12 critical workflows above pass automated Chromium coverage and targeted real-device checks on iPhone Safari, Android Chrome, iPad portrait/landscape, small laptop, desktop and ultrawide.
11. Automated checks cover document overflow, console/page errors, critical action reachability, keyboard focus, screenshots at stable fixtures, and long/localized content.
12. Product/QA sign-off confirms both teacher and institute roles, relevant organization roles, empty/populated/error/loading states, and external-service workflows; the BLA-112 acceptance evidence is linked before the Linear issue is closed.
