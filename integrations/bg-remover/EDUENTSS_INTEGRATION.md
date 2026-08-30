# Integration spec — diagram cleanup for `school-test`

Hand this to whoever works in the **Eduentss** repo. It describes what to add,
where, and why. Everything here was checked against the repo as it stands, not
assumed.

---

## 1. The problem

`school-test` extracts questions from a photo of a textbook page and crops each
diagram out of it (`lib/school-test/crop.ts`). The crops inherit whatever the
camera captured: a pink or grey paper cast, uneven lighting that is bright on
one side and shadowed on the other, and a darker band where the page curls.

A cropped diagram therefore looks like a **tinted rectangle** pasted into the
test paper, instead of clean line art.

**Requirement: the page's paper must read as true white (255, 255, 255) and its
ink must stay dark, before diagrams are cropped out of it.**

This is a colour/lighting correction problem, not a cropping problem. The
existing bboxes and crop logic are fine and do not change.

---

## 2. What is being added

A small Python library, `bgremove` — classical image processing only
(Pillow + NumPy + OpenCV). **No AI, no ML, no pretrained models, no network
calls.** It is already written, tested (98 tests) and tuned against photographed
textbook pages.

Only one of its functions is needed here:

```python
whiten_paper(rgb, strength=1.0, mask=None) -> rgb
```

It estimates the paper's colour **at every pixel** and divides it out, which
removes the colour cast and the lighting gradient in one step. Then it anchors
both ends of the tone range — paper to 255, ink to 0 — so text keeps its
density instead of fading.

Measured on a simulated phone photo (soft focus, grey ink, cast, curl shadow,
sensor noise):

| | before | after |
|---|---|---|
| lit side of the page | `[223 197 200]` | `[255 255 255]` |
| shaded side | `[149 131 134]` | `[255 255 255]` |
| curl shadow | `[137 120 123]` | `[255 255 255]` |
| paper at exactly 255 | — | **100 %** |
| body text | 105 | **102** |
| hatching detail (std) | 37.9 | **73.2** |

> A plain brightness/contrast/white-balance filter cannot do this. Those apply
> one adjustment to the whole image, so setting the lit side to white leaves the
> shaded side grey. The correction has to be measured per pixel.

---

## 3. Architecture — read this first

**Python does not run alongside the Next.js app in this repo.**

`lib/omr/service.ts` posts to `process.env.OMR_SERVICE_URL` — the `api/*.py`
functions are a **separate Vercel deployment**, reached over HTTP with
`OMR_SERVICE_TOKEN`. Netlify hosts the Next.js app and does not execute
`api/*.py` at all.

Protected Vercel deployments require a second, platform-level credential. Enable
Protection Bypass for Automation on the Python-service project and expose its
`VERCEL_AUTOMATION_BYPASS_SECRET` to the Next.js caller. Requests then carry both
`x-vercel-protection-bypass` and the application-level
`x-omr-service-token`; the bypass does not replace endpoint authentication.

So the library goes into the Python service and is called over HTTP, exactly
like OMR already is:

```
Next.js (Netlify)                      Python service (Vercel)
─────────────────                      ───────────────────────
lib/school-test/pipeline.ts
        │
        │  POST /api/bg-clean          api/bg-clean.py
        │  { image_b64 }        ──────▶      │
        │                                    ▼
        │                              integrations/bg-remover/bgremove/
        │  { image_b64 }        ◀──────      whiten_paper()
        ▼
   cropDetections()  ← now cuts from a cleaned page
```

There is no `api/school-test` directory. The school-test API is
`app/api/school-test/` (TypeScript route handlers).

---

## 4. Where the files go

Mirror the existing `integrations/omr-cg/` layout exactly:

```
Eduentss/
├── integrations/
│   ├── omr-cg/                     ← existing, untouched
│   │   └── omr/
│   └── bg-remover/                 ← NEW
│       ├── bgremove/               ← copy this folder in as-is
│       │   ├── __init__.py
│       │   └── processor.py
│       └── README.md
│
├── api/
│   └── bg-clean.py                 ← NEW handler
│
├── lib/school-test/
│   ├── clean.ts                    ← NEW client
│   └── pipeline.ts                 ← one call inserted
│
└── vercel.json                     ← one entry added
```

**Copy only the `bgremove/` folder.** The source bundle also contains a `web/`
folder (a standalone Flask UI) — that is for using the library outside this
project. It is not wanted here: Next.js is the frontend, Vercel will not run a
Flask server, and it would only bloat the function bundle.

---

## 5. Dependencies — nothing to install

`bgremove` needs exactly three packages, and the root `requirements.txt`
**already has all of them**:

```
pillow>=10.0.0                     ✓ already present
numpy>=1.25.0                      ✓ already present
opencv-python-headless==4.11.0.86  ✓ already present
```

No change to `requirements.txt`.

---

## 6. The handler — `api/bg-clean.py`

Follow `api/omr-detect.py` exactly. Same `BaseHTTPRequestHandler` shape, same
`sys.path` insert, same token check, same JSON error envelope.

```python
from __future__ import annotations

import base64
import io
import sys
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
for pkg in ("bg-remover", "omr-cg"):
    root = str(PROJECT_ROOT / "integrations" / pkg)
    if root not in sys.path:
        sys.path.insert(0, root)

import numpy as np                                                  # noqa: E402
from PIL import Image                                               # noqa: E402

from bgremove import load_image, whiten_paper                       # noqa: E402
from omr.vercel_api import HttpError, read_json, require_token, write_json  # noqa: E402


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            require_token(self)
            payload = read_json(self)

            image_b64 = payload.get("image_b64")
            if not isinstance(image_b64, str):
                raise HttpError(HTTPStatus.BAD_REQUEST, "image_b64 is required")

            strength = float(payload.get("strength", 1.0))

            image = load_image(base64.b64decode(image_b64))
            cleaned = whiten_paper(np.asarray(image.convert("RGB")), strength)

            buf = io.BytesIO()
            Image.fromarray(cleaned).save(buf, format="PNG", compress_level=6)

            write_json(self, HTTPStatus.OK, {
                "ok": True,
                "image_b64": base64.b64encode(buf.getvalue()).decode("ascii"),
                "width": image.width,
                "height": image.height,
            })
        except HttpError as exc:
            write_json(self, exc.status, {"ok": False, "error": exc.message})
        except Exception as exc:
            write_json(self, HTTPStatus.INTERNAL_SERVER_ERROR,
                       {"ok": False, "error": str(exc)})

    def do_OPTIONS(self):
        write_json(self, HTTPStatus.OK, {"ok": True})
```

This handler body has been run end to end against a 1600 px page photo:
dimensions unchanged, paper `[255, 255, 255]`, ink still dark at 37, the dark
desk around the page correctly left alone, and bad bytes raising `ImageError`
with a user-safe message.

Notes:

- `omr.vercel_api` is reused for `require_token` / `read_json` / `write_json`
  rather than duplicating them. Both packages ship in the same bundle. If you
  would rather not couple them, copy those four helpers into
  `integrations/bg-remover/bgremove/http_helpers.py` instead.
- Auth is the existing `x-omr-service-token` header against `OMR_SERVICE_TOKEN`.
  The handler fails closed with 503 when the server token is not configured.
- `load_image` applies EXIF orientation and rejects corrupt or non-image bytes
  with a message safe to return to a user (`bgremove.ImageError`).

### Contract

**POST** `/api/bg-clean`

```jsonc
// request
{ "image_b64": "<base64 PNG or JPEG>", "strength": 1.0 }

// response
{ "ok": true, "image_b64": "<base64 PNG>", "width": 1600, "height": 1200 }

// error
{ "ok": false, "error": "human-readable sentence" }
```

---

## 7. `vercel.json` — easy to miss

The current config scopes function settings to `api/omr-*.py` only:

```json
"functions": { "api/omr-*.py": { "maxDuration": 300, "excludeFiles": "..." } }
```

A new `api/bg-clean.py` falls **outside** that glob. It would silently get the
default 10 s timeout and no `excludeFiles`, so `.next/`, `node_modules/` and
`.venv-omr/` get pulled into the bundle.

Either widen the glob to `api/*.py`, or add a second entry reusing the same
`excludeFiles` string.

---

## 8. The client — `lib/school-test/clean.ts`

OMR generation and background cleanup share `lib/omr/remote.ts`. It resolves
exactly one service URL: explicit `OMR_SERVICE_URL` first, the current
`VERCEL_URL` for previews, and `VERCEL_PROJECT_PRODUCTION_URL` for production.
It never retries a failed preview against production. Remote mode requires
`OMR_SERVICE_TOKEN`; protected deployments also need
`VERCEL_AUTOMATION_BYPASS_SECRET`.

Cleanup failures are not cosmetic fallbacks. The page reports a `[clean]` stage
error so a token mismatch, missing bypass secret, or unavailable service is
visible and the user is never shown an uncleaned crop as if cleanup succeeded.

---

## 9. Where it plugs in

`lib/school-test/pipeline.ts`, inside `processPage`, keeps detection, extraction,
and automatic cropping unchanged. If crops exist, it cleans the page once and
re-renders those exact crop boxes from the cleaned result. Bboxes are unaffected
because cleaning does not change dimensions. The Verifier receives and uses the
cleaned crop immediately; adjusting a crop also triggers cleanup automatically.

### Scope decision

Cleaning **only for cropping** keeps the blast radius minimal: the preview shown
to the user, the diagram-detection vision call and the question-extraction call
all still see the original image, so OCR behaviour cannot regress.

Moving the call to the top of `processPage` instead would also whiten the page
preview in the left pane and give the vision calls higher contrast — plausibly
better OCR, but it changes what the models see. Evaluate that separately.

---

## 10. Clean the page, not the crops

This matters and is not obvious. The illumination estimator needs surrounding
paper to measure. A tight crop is mostly ink, so cleaning crops individually
degrades as they get tighter:

| crop tightness | ink coverage | clean page → crop | crop → clean |
|---|---|---|---|
| loose | 32 % | ink 66 | ink 41 |
| normal | 54 % | ink 64 | ink 51 |
| tight | 74 % | ink 64 | ink 60 |
| flush | 84 % | ink 63 | **ink 76** ← washed out |

Page-first stays stable regardless of how the bbox was drawn, and costs **one
call per page** instead of one per diagram.

---

## 11. Do not do these

- **Do not run `remove_background()` on the crops.** It makes the paper
  transparent, which sounds appealing but is the wrong tool here: it treats
  detached marks as separate objects and can drop a caption like
  "(A) Hippocampus" that sits below the drawing. `whiten_paper()` cannot remove
  content — it only remaps tone.
- **Do not copy the `web/` folder.** Standalone Flask UI, not wanted here.
- **Do not add the three packages to `requirements.txt`.** Already there.
- **Do not clean before `detectDiagrams` / `extractQuestions`** without
  evaluating OCR impact first (see §9).

---

## 12. Acceptance

1. Upload the textbook photo that currently produces pink crops.
2. The cropped diagram's paper is `[255, 255, 255]` — sample a corner.
3. Line art and captions are still dark and legible; nothing is missing that was
   present before.
4. Crop dimensions and bbox overlays in the Verifier are unchanged.
5. With a configured remote service unreachable or misconfigured, the page
   reports an actionable `[clean]` error and does not produce an uncleaned crop.
6. Page count and question extraction results are identical to before.

### Payload size — check this against a real page

`processPage` receives a buffer already at preview resolution (≤ 1600 px longest
side). Measured on a 1600 × 1108 test page:

```
request  : 2347 KB base64   (noisy synthetic PNG — a real photo compresses better)
response :  516 KB base64   (cleaned page: flat white paper compresses well)
```

The response is small because whitening flattens the paper, which is exactly
what PNG compresses well. **The request is the side to watch.** Vercel's
serverless request-body limit is 4.5 MB and `read_json` caps at 12 MB, so a
grainy phone photo at 1600 px is under the limit but not by a wide margin.

If you see 413s, send the request as **JPEG q92 instead of PNG** — it is the
input to a tone correction, so JPEG artefacts at that quality are irrelevant,
and it cuts the body by roughly 5×. Do not do the same for the response; the
cleaned page should stay lossless.

If the legacy full-res `runPipeline` path is ever revived, JPEG is mandatory.

### Timing

`whiten_paper` measured at **~0.5 s for a 1600 px page**, plus one HTTP round
trip and Vercel cold start. Netlify's 30 s sync-function cap applies per page
and is not at risk, but this is one more hop inside that budget.

---

## 13. Tuning

Settings are module-level constants; set them once at handler start-up:

```python
from bgremove import processor
processor.PAPER_GAMMA = 1.0          # gentler tone curve
processor.PAPER_INK_PERCENTILE = 4.0 # keep fainter pencil marks
```

| Constant | Default | Effect |
|---|---|---|
| `PAPER_GAMMA` | `1.25` | Above 1 deepens midtones |
| `PAPER_INK_PERCENTILE` | `8.0` | Where the black point is read. Lower keeps faint marks |
| `PAPER_WHITE_POINT` | `0.90` | What counts as paper |
| `MAX_IMAGE_PIXELS` | `50_000_000` | Decompression-bomb guard |

Every constant in `processor.py` carries a comment explaining what moving it
costs.

---

## 14. Known limits

- The tone curve is a **document** curve — it pulls everything toward white or
  black. A photograph printed on the page loses mid-grey subtlety, and a very
  faint pencil mark can clip to white.
- Very large solid black areas lift slightly, because inside them there is no
  nearby paper for the estimator to sample.
- It is meant for paper. Running it on a portrait or product shot would flatten
  the lighting that gives the subject its shape.

---

## 15. Keeping the copy current

`bgremove/` is vendored, so upstream fixes do not arrive on their own. To
resync, replace one file:

```bash
cp <source>/processor.py  integrations/bg-remover/bgremove/processor.py
```

`__init__.py` only re-exports, so nothing else changes.
