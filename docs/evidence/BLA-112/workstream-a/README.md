# BLA-112 Workstream A — shell foundation evidence

This is foundation evidence for findings S01–S04 and S08–S09. It does **not** mark BLA-112 complete and does not represent a full authenticated workflow pass.

## Capture method

- Baseline source: `5f8e4b654b1ab621af5a5d5a65a602f088aff812` (the completed audit commit).
- After source: the Workstream A implementation in this commit.
- Browser: automated Chromium via `agent-browser`.
- Fixture: a temporary public route rendered the real `DashboardLayoutClient`, `MainContent`, `Header`, `OrgSwitcher`, and sidebar components with a deliberately long organization name and representative cards. The route and temporary middleware allowance were removed before commit.
- The small circular controls at the bottom corners and the red development issue badge visible in some screenshots are local TanStack/Next.js development tooling, not product shell controls.

## Durable captures

Every filename encodes the exact CSS viewport used.

| State | CSS viewport | Files |
|---|---:|---|
| Baseline phone, closed/open | 320×568 | `before/320x568-closed.png`, `before/320x568-open.png` |
| Baseline phone, closed/open | 390×844 | `before/390x844-closed.png`, `before/390x844-open.png` |
| Baseline zoom-equivalent, closed/forced-open | 640×720 | `before/640x720-closed.png`, `before/640x720-open.png` |
| Baseline landscape, closed/forced-open | 667×375 | `before/667x375-closed.png`, `before/667x375-open.png` |
| Baseline awkward tablet, closed/forced-open | 700×900 | `before/700x900-closed.png`, `before/700x900-open.png` |
| Baseline tablet portrait, closed/forced-open | 768×1024 | `before/768x1024-closed.png`, `before/768x1024-open.png` |
| Baseline desktop, collapsed/expanded | 1024×768 | `before/1024x768-collapsed.png`, `before/1024x768-expanded.png` |
| Baseline desktop, collapsed/expanded | 1366×768 | `before/1366x768-collapsed.png`, `before/1366x768-expanded.png` |
| After phone drawer, closed/open | 320×568 | `after/320x568-closed.png`, `after/320x568-open.png` |
| After phone drawer, closed/open | 390×844 | `after/390x844-closed.png`, `after/390x844-open.png` |
| After organization menu | 390×844 | `after/390x844-org-menu.png` |
| After zoom-equivalent drawer, closed/open | 640×720 | `after/640x720-closed.png`, `after/640x720-open.png` |
| After landscape drawer, closed/open | 667×375 | `after/667x375-closed.png`, `after/667x375-open.png` |
| After awkward tablet drawer, closed/open | 700×900 | `after/700x900-closed.png`, `after/700x900-open.png` |
| After tablet portrait drawer, closed/open | 768×1024 | `after/768x1024-closed.png`, `after/768x1024-open.png` |
| After short landscape drawer, closed/open | 844×390 | `after/844x390-closed.png`, `after/844x390-open.png` |
| After desktop, collapsed/expanded | 1024×768 | `after/1024x768-collapsed.png`, `after/1024x768-expanded.png` |
| After short desktop, collapsed/expanded | 1280×720 | `after/1280x720-collapsed.png`, `after/1280x720-expanded.png` |
| After desktop, collapsed/expanded | 1366×768 | `after/1366x768-collapsed.png`, `after/1366x768-expanded.png` |
| After ultrawide, collapsed/expanded | 2560×1080 | `after/2560x1080-collapsed.png`, `after/2560x1080-expanded.png` |

## Observed behavior

Baseline reproduction:

- At 640×720, 667×375, 700×900, and 768×1024 the closed sidebar had no visible reopen trigger. The corresponding `open` images were forced by opening at 390 px and resizing while open.
- Escape left the old sidebar open at every compact baseline width, including 320 and 390.
- Closed baseline sidebar content remained in the accessibility tree, so background and off-canvas controls were simultaneously reachable.

After verification:

- A visible `Open main navigation` trigger existed at every compact width from 320 through 844 CSS px; the persistent desktop sidebar began at 1024 CSS px.
- The open surface rendered `role="dialog"` and `aria-modal="true"`; focus remained inside, the background was aria-hidden, and body scrolling was locked.
- Both outside pointer activation and Escape closed the drawer and returned focus to `Open main navigation`.
- A Next-observed pathname change closed the drawer while keeping the trigger available.
- Document overflow was `0` at all after capture sizes.
- At 390×844 the organization menu measured `left=56`, `right=344`, `width=288` in a 390 px viewport, keeping at least 8 px margins and exposing the full long organization name inside the menu.
- With the desktop sidebar expanded, the shared page container measured 719 px at 1024×768, 975 px at 1280×720, 1061 px at 1366×768, and the intentional 1600 px cap at 2560×1080. The fixture grid consequently used two columns at 1024/1280 and waited for three until the usable container exceeded 1024 px at 1366; the representative dense page layouts use the same named container contract.

## Authentication limitation

No authenticated WorkOS session, seeded organization roles, or stable teacher/institute data fixture was available. These screenshots therefore validate the real shared shell components in a controlled public fixture, not an authenticated end-to-end workflow. WorkOS sign-in redirects were left unchanged, and authenticated teacher/institute/role states still require Workstream I or QA fixture coverage.
