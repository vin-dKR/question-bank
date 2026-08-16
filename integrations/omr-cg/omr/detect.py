"""Read one photographed OMR sheet.

Per-sheet entry point, not directory batching -- a teacher uploads sheets one at
a time from a queue worker, and upstream's batch runner assumes a folder of
images sharing one template.

    python -m omr.detect --image photo.jpg --layout out/PHY-MID-26

Returns JSON on stdout: which bubbles were detected as filled, the fill ratios
behind that call, and a confidence per question. It does **not** score. Turning
detected values into marks -- MSQ partial credit, negative marking, per-teacher
rules -- is business logic that belongs next to the grades tables in Node.

Two rules from the project's detection policy are implemented here directly:

**Sample relative to the row, never against an absolute threshold.** The median
fill across a row is the empty-bubble baseline and each bubble is measured as
excess darkness above it. This absorbs uneven phone lighting, print darkness
variation and pencil-versus-pen for free. A hardcoded cutoff fails on the first
sheet photographed near a window.

**Never silently guess.** Ambiguous fill, a double-marked MCQ, missing markers or
an unreadable QR all set flags and route the sheet to review rather than
producing a confident wrong answer.
"""

from __future__ import annotations

import argparse
import base64
import json
import sys
from dataclasses import dataclass, field
from pathlib import Path

import cv2
import numpy as np

from . import geometry as g
from .marker import marker_array

# --------------------------------------------------------------------------
# Tuning
# --------------------------------------------------------------------------

#: Working width for marker search. The photo is normalised to this before
#: anything else, so thresholds below mean the same thing on a 4000px phone
#: photo and a 1200px scan.
WORK_W = 1240
WORK_H = 1754

#: Laplacian variance below this is too soft to trust. A teacher will happily
#: re-shoot one sheet on the spot and will not enjoy discovering twenty failures
#: an hour later.
#:
#: This number is a guess until there is a real corpus behind it. Every sheet
#: photographed with known-correct answers should be kept: forty of them turn
#: this from a guess into a measurement, and without them, tuning it can make
#: accuracy worse while appearing to help.
#:
#: The upload UI reads this value from the server rather than carrying its own
#: copy, so the client-side gate and the server-side gate cannot disagree.
BLUR_FLOOR = 50.0

#: Marker template matching. Mirrors the vendored CropOnMarkers defaults.
MARKER_MATCH_FLOOR = 0.30
MARKER_SCALES = np.arange(0.55, 1.65, 0.05)

#: How dark a bubble must be, as a fraction of the local paper-to-ink range,
#: before it counts as filled. 0 is paper, 1 is printed black.
FILL_THRESHOLD = 0.30

#: If a *rejected* bubble reaches this fraction of the threshold, the row is too
#: close to call and goes to review rather than being answered confidently.
AMBIGUITY_BAND = 0.72

#: Percentile of a row's band taken as local paper white. The band is mostly
#: paper even when every bubble in it is filled, which is the property the old
#: median-of-bubbles baseline lacked.
PAPER_PERCENTILE = 80

#: Vertical padding around a row when measuring its paper reference.
ROW_BAND_PAD = 8

#: Below this paper level the row is in shadow too deep to read anything from.
MIN_PAPER_LEVEL = 35.0


@dataclass
class Detection:
    """Everything read from one sheet."""

    ok: bool
    status: str
    paper_id: str | None = None
    version: int | None = None
    page: int | None = None
    warnings: list[str] = field(default_factory=list)
    responses: list[dict] = field(default_factory=list)
    fib_crops: list[dict] = field(default_factory=list)
    quality: dict = field(default_factory=dict)
    warped_png: bytes | None = None
    overlay_png: bytes | None = None

    def to_json(self, include_images: bool = False) -> dict:
        out = {
            "ok": self.ok,
            "status": self.status,
            "paper_id": self.paper_id,
            "version": self.version,
            "page": self.page,
            "warnings": self.warnings,
            "quality": self.quality,
            "responses": self.responses,
            "needs_review": any(r.get("is_ambiguous") for r in self.responses)
            or bool(self.warnings),
        }
        if include_images:
            if self.warped_png:
                out["warped_png_b64"] = base64.b64encode(self.warped_png).decode()
            if self.overlay_png:
                out["overlay_png_b64"] = base64.b64encode(self.overlay_png).decode()
            out["fib_crops"] = self.fib_crops
        return out


# --------------------------------------------------------------------------
# Quality gate
# --------------------------------------------------------------------------


def blur_score(gray: np.ndarray) -> float:
    """Laplacian variance. Higher is sharper."""
    return float(cv2.Laplacian(gray, cv2.CV_64F).var())


# --------------------------------------------------------------------------
# Marker location and warp
# --------------------------------------------------------------------------


def _best_scale_match(gray: np.ndarray, marker: np.ndarray) -> tuple[np.ndarray, float]:
    """Resize the marker across a range and keep the best-responding size."""
    best, best_score = None, -1.0
    for scale in MARKER_SCALES:
        size = int(round(g.MARKER_SIZE * scale))
        if size < 12 or size >= min(gray.shape[:2]) // 4:
            continue
        resized = cv2.resize(marker, (size, size), interpolation=cv2.INTER_AREA)
        res = cv2.matchTemplate(gray, resized, cv2.TM_CCOEFF_NORMED)
        score = float(res.max())
        if score > best_score:
            best, best_score = resized, score
    if best is None:
        raise RuntimeError("marker could not be scaled into this image")
    return best, best_score


def find_markers(gray: np.ndarray) -> tuple[list[tuple[float, float]], list[float]]:
    """Locate one fiducial in each of the four search regions.

    The regions match the vendored ``QUADRANT_DIVISION`` -- top markers must be
    in the top third, since that is where CropOnMarkers looks. Keeping the same
    split here means a sheet that reads with our detector also reads with theirs.
    """
    marker = marker_array()
    scaled, _ = _best_scale_match(gray, marker)
    mh, mw = scaled.shape[:2]

    h, w = gray.shape[:2]
    mid_h, mid_w = h // 3, w // 2

    regions = {
        "top-left": (0, 0, mid_h, mid_w),
        "top-right": (0, mid_w, mid_h, w),
        "bottom-left": (mid_h, 0, h, mid_w),
        "bottom-right": (mid_h, mid_w, h, w),
    }

    centres: list[tuple[float, float]] = []
    scores: list[float] = []

    for name, (y0, x0, y1, x1) in regions.items():
        patch = gray[y0:y1, x0:x1]
        if patch.shape[0] < mh or patch.shape[1] < mw:
            raise RuntimeError(f"{name} search region is smaller than the marker")

        res = cv2.matchTemplate(patch, scaled, cv2.TM_CCOEFF_NORMED)
        _, score, _, loc = cv2.minMaxLoc(res)
        if score < MARKER_MATCH_FLOOR:
            raise RuntimeError(
                f"no corner marker found in the {name} of the photo "
                f"(match {score:.2f}, need {MARKER_MATCH_FLOOR:.2f})"
            )
        centres.append((x0 + loc[0] + mw / 2.0, y0 + loc[1] + mh / 2.0))
        scores.append(float(score))

    return centres, scores


def _order_corners(points: list[tuple[float, float]]) -> np.ndarray:
    """Order as top-left, top-right, bottom-right, bottom-left."""
    pts = np.array(points, dtype=np.float32)
    total = pts.sum(axis=1)
    diff = np.diff(pts, axis=1).ravel()
    return np.array(
        [
            pts[np.argmin(total)],  # smallest x+y
            pts[np.argmin(diff)],  # smallest y-x
            pts[np.argmax(total)],
            pts[np.argmax(diff)],
        ],
        dtype=np.float32,
    )


def warp_to_template(gray: np.ndarray, centres: list[tuple[float, float]]) -> np.ndarray:
    """Map the marker-centre quadrilateral onto template space.

    The destination is exactly ``templateDimensions``, so the generated
    template.json coordinates apply to the result without further transformation.
    """
    src = _order_corners(centres)
    dst = np.array(
        [
            [0, 0],
            [g.TEMPLATE_W - 1, 0],
            [g.TEMPLATE_W - 1, g.TEMPLATE_H - 1],
            [0, g.TEMPLATE_H - 1],
        ],
        dtype=np.float32,
    )
    matrix = cv2.getPerspectiveTransform(src, dst)
    return cv2.warpPerspective(gray, matrix, (g.TEMPLATE_W, g.TEMPLATE_H))


# --------------------------------------------------------------------------
# Identity
# --------------------------------------------------------------------------


def read_qr(warped: np.ndarray) -> dict | None:
    """Decode the sheet's QR: paper id, layout version, page number."""
    detector = cv2.QRCodeDetector()
    for image in (warped, cv2.resize(warped, None, fx=2, fy=2)):
        try:
            text, points, _ = detector.detectAndDecode(image)
        except cv2.error:
            continue
        if not text or not text.startswith("OMR|"):
            continue
        parts = text.split("|")
        if len(parts) != 4:
            continue
        try:
            return {
                "paper_id": parts[1],
                "version": int(parts[2].lstrip("v")),
                "page": int(parts[3].lstrip("p")),
            }
        except ValueError:
            continue
    return None


# --------------------------------------------------------------------------
# Bubble sampling
# --------------------------------------------------------------------------


def _expand_field_labels(raw_labels: list[str]) -> list[str]:
    out = []
    for label in raw_labels:
        if ".." in label:
            head, tail = label.split("..")
            prefix = head.rstrip("0123456789")
            start, end = int(head[len(prefix):]), int(tail)
            out.extend(f"{prefix}{i}" for i in range(start, end + 1))
        else:
            out.append(label)
    return out


def iter_fields(template: dict):
    """Yield (field_label, [(value, x, y)]) for every field in a template.

    Mirrors the vendored ``generate_bubble_grid`` traversal so our reading and
    OMRChecker's agree about which bubble is which.
    """
    from .vendor_constants import FIELD_TYPES

    box_w, box_h = template["bubbleDimensions"]

    for block in template["fieldBlocks"].values():
        if "fieldType" in block:
            ftype = FIELD_TYPES[block["fieldType"]]
            values, direction = ftype["bubbleValues"], ftype["direction"]
        else:
            values, direction = block["bubbleValues"], block["direction"]

        h_axis, v_axis = (1, 0) if direction == "vertical" else (0, 1)
        lead = [float(block["origin"][0]), float(block["origin"][1])]

        for label in _expand_field_labels(block["fieldLabels"]):
            point = lead.copy()
            bubbles = []
            for value in values:
                bubbles.append((value, point[0], point[1], box_w, box_h))
                point[h_axis] += block["bubblesGap"]
            yield label, bubbles
            lead[v_axis] += block["labelsGap"]


def sample_bubble(warped: np.ndarray, x: float, y: float, w: int, h: int) -> float:
    """Mean intensity inside a bubble's sample box. Lower means darker."""
    # Inset slightly so the printed ring itself does not dominate the reading.
    inset = max(1, int(round(min(w, h) * 0.18)))
    x0, y0 = int(round(x)) + inset, int(round(y)) + inset
    x1, y1 = int(round(x + w)) - inset, int(round(y + h)) - inset

    x0, y0 = max(0, x0), max(0, y0)
    x1 = min(warped.shape[1], max(x1, x0 + 1))
    y1 = min(warped.shape[0], max(y1, y0 + 1))

    return float(warped[y0:y1, x0:x1].mean())


def row_paper_white(warped: np.ndarray, bubbles: list) -> float:
    """Local paper brightness beside one row of bubbles.

    Measured from a band around the row rather than from the bubbles themselves.
    Bubbles occupy well under half that band, so a high percentile lands on paper
    even when every bubble in the row is filled -- which is precisely the case
    that broke the previous median-of-bubbles baseline: a fully-marked MSQ made
    the baseline dark, every bubble then measured as "no darker than typical",
    and the row read as blank.

    Still local, so a shadow lying across the sheet moves the reference with it.
    """
    xs = [b[1] for b in bubbles]
    ys = [b[2] for b in bubbles]
    w, h = bubbles[0][3], bubbles[0][4]

    x0 = max(0, int(min(xs)) - ROW_BAND_PAD)
    x1 = min(warped.shape[1], int(max(xs) + w) + ROW_BAND_PAD)
    y0 = max(0, int(min(ys)) - ROW_BAND_PAD)
    y1 = min(warped.shape[0], int(max(ys) + h) + ROW_BAND_PAD)

    band = warped[y0:y1, x0:x1]
    if band.size == 0:
        return float(warped.max())
    return float(np.percentile(band, PAPER_PERCENTILE))


def read_field(warped: np.ndarray, bubbles: list, expect_single: bool) -> dict:
    """Decide which bubbles in one row are filled.

    Each bubble is scored as ``1 - mean / local_paper``: what fraction of the
    light the paper returns is swallowed by the mark. Camera illumination is
    multiplicative -- a pixel is reflectance times light -- so dividing by the
    paper level beside the row cancels the lighting outright. A bubble filled in
    shadow and the same bubble filled in sunlight score the same.

    Nothing here assumes how many bubbles in a row are marked, which is what
    makes a fully-marked MSQ read correctly.
    """
    values = [b[0] for b in bubbles]
    means = [sample_bubble(warped, b[1], b[2], b[3], b[4]) for b in bubbles]

    paper = row_paper_white(warped, bubbles)

    if paper < MIN_PAPER_LEVEL:
        return {
            "detected": "",
            "filled": [],
            "fill_ratios": {v: 0.0 for v in values},
            "paper": round(paper, 2),
            "confidence": 0.0,
            "is_ambiguous": True,
            "reason": "this row is too deep in shadow to read",
        }

    ratios = [float(np.clip(1.0 - m / paper, 0.0, 1.0)) for m in means]

    filled = [v for v, r in zip(values, ratios) if r >= FILL_THRESHOLD]
    rejected = [r for r in ratios if r < FILL_THRESHOLD]
    runner_up = max(rejected) if rejected else 0.0

    ambiguous = runner_up >= FILL_THRESHOLD * AMBIGUITY_BAND
    reason = "a second bubble is too close to call" if ambiguous else ""

    if filled:
        # Distance of the weakest accepted and strongest rejected bubble from the
        # threshold: a row where everything sits far from the line is trustworthy.
        weakest = min(r for r in ratios if r >= FILL_THRESHOLD)
        margin = min(weakest - FILL_THRESHOLD, FILL_THRESHOLD - runner_up)
        confidence = float(np.clip(margin / FILL_THRESHOLD, 0.0, 1.0))
    else:
        confidence = float(np.clip((FILL_THRESHOLD - runner_up) / FILL_THRESHOLD, 0.0, 1.0))
        if expect_single:
            ambiguous = True
            reason = "no bubble filled"

    if expect_single and len(filled) > 1:
        ambiguous = True
        reason = f"{len(filled)} bubbles marked where one is expected"

    return {
        "detected": "".join(filled),
        "filled": filled,
        "fill_ratios": {v: round(r, 3) for v, r in zip(values, ratios)},
        "paper": round(paper, 2),
        "confidence": round(confidence, 3),
        "is_ambiguous": ambiguous,
        "reason": reason,
    }


# --------------------------------------------------------------------------
# Overlay
# --------------------------------------------------------------------------


def build_overlay(warped: np.ndarray, responses: list[dict], template: dict) -> bytes:
    """Draw what was detected onto the aligned image.

    Stored permanently: exam disputes arrive months later and "the software said
    so" is not an answer a parent accepts.
    """
    canvas = cv2.cvtColor(warped, cv2.COLOR_GRAY2BGR)
    by_field = {r["field"]: r for r in responses}

    for label, bubbles in iter_fields(template):
        result = by_field.get(label)
        for value, x, y, w, h in bubbles:
            p1 = (int(round(x)), int(round(y)))
            p2 = (int(round(x + w)), int(round(y + h)))
            if result and value in result["filled"]:
                colour = (0, 0, 216) if not result["is_ambiguous"] else (0, 168, 232)
                cv2.rectangle(canvas, p1, p2, colour, 2)
            elif result and result["is_ambiguous"]:
                cv2.rectangle(canvas, p1, p2, (0, 168, 232), 1)

    ok, buf = cv2.imencode(".png", canvas)
    return buf.tobytes() if ok else b""


def _png(image: np.ndarray) -> bytes:
    ok, buf = cv2.imencode(".png", image)
    return buf.tobytes() if ok else b""


# --------------------------------------------------------------------------
# Orchestration
# --------------------------------------------------------------------------


def detect(
    image_path: str | Path,
    layout_dir: str | Path,
    page_hint: int | None = None,
    want_images: bool = False,
) -> Detection:
    """Read one sheet against a generated layout."""
    layout_dir = Path(layout_dir)
    manifest = json.loads((layout_dir / "layout.json").read_text(encoding="utf-8"))

    image = cv2.imread(str(image_path), cv2.IMREAD_GRAYSCALE)
    if image is None:
        return Detection(ok=False, status="unreadable_file",
                         warnings=["that file could not be opened as an image"])

    work = cv2.resize(image, (WORK_W, WORK_H), interpolation=cv2.INTER_AREA)
    sharpness = blur_score(work)
    quality = {"blur_score": round(sharpness, 1), "blur_floor": BLUR_FLOOR}

    if sharpness < BLUR_FLOOR:
        return Detection(
            ok=False,
            status="too_blurry",
            quality=quality,
            warnings=[
                f"photo is too soft to read (sharpness {sharpness:.0f}, "
                f"need {BLUR_FLOOR:.0f}). Re-shoot with more light and hold still."
            ],
        )

    try:
        centres, scores = find_markers(work)
    except RuntimeError as exc:
        return Detection(
            ok=False,
            status="markers_not_found",
            quality=quality,
            warnings=[str(exc), "Make sure all four corner targets are in frame."],
        )

    quality["marker_scores"] = [round(s, 3) for s in scores]
    warped = warp_to_template(work, centres)

    identity = read_qr(warped)
    warnings: list[str] = []

    page = page_hint
    if identity:
        page = identity["page"]
        if identity["paper_id"] != manifest["paper_id"]:
            return Detection(
                ok=False,
                status="wrong_paper",
                quality=quality,
                paper_id=identity["paper_id"],
                page=page,
                warnings=[
                    f"this sheet is for paper {identity['paper_id']}, "
                    f"not {manifest['paper_id']}"
                ],
            )
        if identity["version"] != manifest["version"]:
            warnings.append(
                f"sheet was printed from layout v{identity['version']} but "
                f"v{manifest['version']} is current — reading with v{identity['version']} "
                "geometry is not possible"
            )
    else:
        if page is None:
            page = 1
        warnings.append(
            "QR code could not be read; assuming page "
            f"{page}. Confirm before accepting the result."
        )

    page_dir = layout_dir / f"page_{page}"
    if not page_dir.exists():
        return Detection(
            ok=False,
            status="unknown_page",
            quality=quality,
            page=page,
            warnings=[f"this layout has no page {page}"],
        )

    template = json.loads((page_dir / "template.json").read_text(encoding="utf-8"))

    #: Only the question type says whether several filled bubbles is legal.
    #: Detection reports an MSQ and a double-marked MCQ identically.
    types = {f"q{q['no']}": q["type"] for q in manifest["questions"] if q["field"]}

    responses: list[dict] = []
    roll_digits: list[str] = []

    for label, bubbles in iter_fields(template):
        is_roll = label.startswith("roll")
        expect_single = is_roll or types.get(label) in ("MCQ", "TRUEFALSE")
        result = read_field(warped, bubbles, expect_single)
        result["field"] = label

        if is_roll:
            roll_digits.append(result["detected"] or "?")
            if result["is_ambiguous"]:
                warnings.append(f"roll digit {label} is unclear")
            continue

        result["question_no"] = int(label[1:])
        result["type"] = types.get(label, "MCQ")
        responses.append(result)

    responses.sort(key=lambda r: r["question_no"])

    fib_crops = []
    fib = json.loads((layout_dir / "fib_regions.json").read_text(encoding="utf-8"))
    for region in fib["regions"]:
        if region["page"] != page:
            continue
        crop = warped[
            region["y"] : region["y"] + region["h"],
            region["x"] : region["x"] + region["w"],
        ]
        entry = {"question_no": region["question_no"]}
        if want_images and crop.size:
            entry["png_b64"] = base64.b64encode(_png(crop)).decode()
        fib_crops.append(entry)

    detection = Detection(
        ok=True,
        status="read",
        paper_id=manifest["paper_id"],
        version=manifest["version"],
        page=page,
        warnings=warnings,
        responses=responses,
        fib_crops=fib_crops,
        quality=quality,
    )
    detection.quality["roll_number"] = "".join(roll_digits)

    if want_images:
        detection.warped_png = _png(warped)
        detection.overlay_png = build_overlay(warped, responses, template)

    return detection


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="omr.detect", description="Read one photographed OMR sheet."
    )
    parser.add_argument("--image", required=True)
    parser.add_argument("--layout", required=True, help="a directory from omr.generate")
    parser.add_argument("--page", type=int, default=None)
    parser.add_argument("--images", action="store_true", help="include base64 images")
    args = parser.parse_args(argv)

    result = detect(args.image, args.layout, args.page, args.images)
    json.dump(result.to_json(args.images), sys.stdout, indent=2)
    sys.stdout.write("\n")
    return 0 if result.ok else 2


if __name__ == "__main__":
    raise SystemExit(main())
