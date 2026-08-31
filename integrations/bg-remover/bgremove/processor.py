"""Background removal using classical image processing.

No AI, no machine learning, no pretrained models -- just Pillow, OpenCV and
NumPy. The strategy is deliberately conservative: when the algorithm is not
sure whether a pixel belongs to the object or the background, it keeps the
pixel. Leaving a little background behind is a much smaller failure than
punching a hole in the subject.

Pipeline
--------
    load + EXIF orientation
        v
    analyse the border to estimate the background colour
        v
    CIELAB colour-distance map  ->  soft foreground ramp
        v
    keep only background that is connected to the image border
        v
    GrabCut refinement (only when the background is not uniform)
        v
    clean the mask: fill small holes, drop specks, keep the main object
        v
    guided-filter feathering against the full-resolution image
        v
    remove background colour spill from the edge pixels
        v
    composite onto white / black / transparent at the ORIGINAL resolution

Public API
----------
    load_image(data)                       -> PIL.Image (RGB-safe, upright)
    remove_background(image)               -> (foreground, mask)
    apply_background(foreground, mask, bg) -> PIL.Image
    encode_image(image, fmt)               -> bytes
"""

from __future__ import annotations

import io
import re
from dataclasses import dataclass
from typing import Iterable, Tuple

import cv2
import numpy as np
from PIL import Image, ImageOps, UnidentifiedImageError

# --------------------------------------------------------------------------
# Tunables
# --------------------------------------------------------------------------

#: Longest edge used for mask analysis and GrabCut. The mask is scaled back up
#: afterwards; the output image itself is never downscaled.
WORK_MAX_EDGE = 900

#: Pixel budget for the edge-refinement stage. Above this the guided filter
#: runs on a scaled-down copy to bound memory, then the mask is scaled back up.
REFINE_MAX_PIXELS = 8_000_000

#: Pixel budget above which colour-spill removal is skipped (memory guard).
DECONTAMINATE_MAX_PIXELS = 40_000_000

#: Reject anything larger than this many pixels.
MAX_IMAGE_PIXELS = 50_000_000

#: Formats we accept, as reported by Pillow.
SUPPORTED_FORMATS = frozenset({"JPEG", "PNG", "WEBP", "BMP", "TIFF"})

#: A border is "uniform" when at least this fraction of its pixels sit close to
#: the median border colour. Uniform backgrounds skip GrabCut.
UNIFORM_BORDER_RATIO = 0.90

#: Enclosed gaps smaller than this fraction of the object are treated as
#: mistakes and filled. Anything larger is a real hole (a chair, a bicycle
#: frame, a ring) and is left alone.
HOLE_MAX_RATIO = 0.05

#: On a busy background, detached blobs smaller than this fraction of the
#: largest blob are dropped as leftover background.
COMPONENT_MIN_RATIO = 0.05

#: On a plain backdrop nothing is judged against the largest blob -- a word on a
#: page is thousands of times smaller than a drawing beside it, and both are
#: content. Only blobs below this absolute size (at analysis scale, and as a
#: fraction of the analysed area) are dropped as sensor noise or dust.
SPECK_MIN_AREA = 10
SPECK_AREA_RATIO = 0.000_015

#: Paper whitening. The illumination field is estimated at this resolution --
#: lighting varies smoothly, so measuring it small costs nothing in accuracy.
#: REACH is the estimator's neighbourhood as a fraction of that small image; it
#: must exceed the thickest dark mark on the page or a big drawing gets read as
#: shadow and blown out. WHITE_POINT is what counts as paper: anything at or
#: above this fraction of the local paper brightness clips to pure white.
PAPER_FIELD_MAX_EDGE = 400
PAPER_FIELD_SMOOTH = 0.5

#: Normalisation passes as ``(reach, floor)``, coarse to fine.
#:
#: The first pass looks across a wide neighbourhood so a large drawing cannot be
#: mistaken for shadow, which is also why it cannot follow anything narrow. The
#: fine passes that follow catch what it missed -- the crease down a curled
#: page, a shadow along one edge.
#:
#: ``floor`` limits how far a pass may brighten any one region, as a fraction of
#: the brightest paper it found. The fine passes need a tight floor: their small
#: neighbourhood fits *inside* a large black shape, where without a floor they
#: would read the ink itself as paper and wash it out to grey.
PAPER_PASSES = ((0.14, 0.55), (0.04, 0.92), (0.04, 0.92))

#: Paper: at or above this fraction of the local paper brightness, clip to white.
PAPER_WHITE_POINT = 0.90

#: Ink: the black point is read from the image at this percentile of the pixels
#: darker than PAPER_INK_CEILING, and mapped to 0. Anchoring the dark end is
#: what keeps soft, low-contrast photographed text readable -- pinning only the
#: white end lets grey text drift up into the paper and disappear.
PAPER_INK_PERCENTILE = 8.0
PAPER_INK_CEILING = 0.85
PAPER_INK_FALLBACK = 0.35

#: Above 1 this deepens the midtones, so hatching and halftones gain contrast
#: rather than turning into flat grey.
PAPER_GAMMA = 1.25

#: How thick a structure the backdrop may leak across when deciding what is
#: "enclosed", as a fraction of the analysis image's longest edge. Big enough to
#: see through table rules, wire and hair; far too small to cross an arm.
BRIDGE_RATIO = 0.003

#: Shadow detection. A region counts as shadowed backdrop only if it keeps the
#: backdrop's hue (within this CIELAB chroma distance), stays above this
#: fraction of the backdrop's lightness, and has a soft outline -- less than
#: SHADOW_MAX_SHARP_BORDER of its border may exceed SHADOW_MAX_GRADIENT
#: lightness units per pixel. The outline test is what stops a plain grey
#: object, which satisfies the first two, from being erased as a shadow.
#: The allowance is generous because a shadow cast beside the subject borders
#: the subject along part of its edge, and that part is legitimately sharp.
SHADOW_MAX_CHROMA = 5.0
SHADOW_MIN_LIGHTNESS = 0.55
SHADOW_MAX_GRADIENT = 2.5
SHADOW_MAX_SHARP_BORDER = 0.5

Image.MAX_IMAGE_PIXELS = MAX_IMAGE_PIXELS

_HEX_RE = re.compile(r"^#?([0-9a-fA-F]{6})$")


class ImageError(Exception):
    """An input we cannot process. The message is safe to show to the user."""


@dataclass(frozen=True)
class _Background:
    """What the image border tells us about the background."""

    color: np.ndarray  # median border colour, CIELAB
    uniformity: float  # fraction of border pixels close to that colour
    spread: float      # 90th-percentile CIELAB distance across the border

    @property
    def is_uniform(self) -> bool:
        return self.uniformity >= UNIFORM_BORDER_RATIO


# --------------------------------------------------------------------------
# Loading
# --------------------------------------------------------------------------


def load_image(data: bytes) -> Image.Image:
    """Decode uploaded bytes into an upright image.

    The file's extension and declared content type are ignored -- the bytes
    themselves have to decode as a supported image format.
    """
    if not data:
        raise ImageError("The uploaded file is empty.")

    try:
        probe = Image.open(io.BytesIO(data))
        probe.verify()  # structural check; consumes the file object
        fmt = probe.format
    except UnidentifiedImageError:
        raise ImageError(
            "Unable to read this file as an image. "
            "Please upload a valid JPG, PNG, or WEBP image."
        )
    except Image.DecompressionBombError:
        raise ImageError("This image is too large to process safely.")
    except Exception:
        raise ImageError("This image appears to be corrupted or incomplete.")

    if fmt not in SUPPORTED_FORMATS:
        raise ImageError(
            f"{fmt or 'This'} files are not supported. "
            "Please upload a JPG, PNG, or WEBP image."
        )

    try:
        image = Image.open(io.BytesIO(data))
        image.load()  # force full decode so truncated files fail here
    except Image.DecompressionBombError:
        raise ImageError("This image is too large to process safely.")
    except Exception:
        raise ImageError("This image appears to be corrupted or incomplete.")

    if image.width * image.height > MAX_IMAGE_PIXELS:
        raise ImageError("This image is too large to process. Please use a smaller one.")

    # Phone and camera photos carry an orientation flag instead of rotated
    # pixels. Apply it now so everything downstream sees the upright image.
    image = ImageOps.exif_transpose(image)

    if image.mode == "P":
        image = image.convert("RGBA" if "transparency" in image.info else "RGB")
    elif image.mode in ("L", "LA", "1", "I;16", "I", "F"):
        image = image.convert("RGBA" if image.mode == "LA" else "RGB")
    elif image.mode == "CMYK":
        image = image.convert("RGB")

    if image.mode not in ("RGB", "RGBA"):
        image = image.convert("RGB")

    return image


# --------------------------------------------------------------------------
# Background analysis
# --------------------------------------------------------------------------


def _to_lab(rgb: np.ndarray) -> np.ndarray:
    """Convert RGB uint8 to true CIELAB, so distances are perceptual.

    OpenCV packs 8-bit Lab into 0..255 per channel; undo that packing here so a
    distance of 10 means roughly the same thing it does in the literature.
    """
    lab = cv2.cvtColor(rgb, cv2.COLOR_RGB2LAB).astype(np.float32)
    lab[..., 0] *= 100.0 / 255.0
    lab[..., 1] -= 128.0
    lab[..., 2] -= 128.0
    return lab


def _analyse_border(lab: np.ndarray) -> _Background:
    """Estimate the background colour from a band around the image edge."""
    h, w = lab.shape[:2]
    band = max(3, int(round(0.03 * min(h, w))))

    edges = np.concatenate(
        [
            lab[:band].reshape(-1, 3),
            lab[-band:].reshape(-1, 3),
            lab[:, :band].reshape(-1, 3),
            lab[:, -band:].reshape(-1, 3),
        ]
    )

    # Median, not mean: a subject poking into the border must not drag the
    # estimate towards the subject's colour.
    color = np.median(edges, axis=0).astype(np.float32)
    dist = np.linalg.norm(edges - color, axis=1)

    return _Background(
        color=color,
        uniformity=float(np.mean(dist < 12.0)),
        spread=float(np.percentile(dist, 90)),
    )


def _thresholds(bg: _Background) -> Tuple[float, float]:
    """Pick the "definitely background" and "definitely object" distances.

    Both scale with how noisy the border is: a clean studio backdrop gets tight
    thresholds, a textured wall gets loose ones.
    """
    t_low = float(np.clip(max(6.0, bg.spread * 1.6), 6.0, 22.0))
    t_high = float(np.clip(t_low * 2.6, 16.0, 55.0))
    return t_low, t_high


# --------------------------------------------------------------------------
# Mask building blocks
# --------------------------------------------------------------------------


def _border_labels(labels: np.ndarray) -> np.ndarray:
    """Component labels that touch the image frame."""
    return np.unique(
        np.concatenate(
            [labels[0], labels[-1], labels[:, 0], labels[:, -1]]
        )
    )


def _border_connected(mask: np.ndarray, bridge: int = 0) -> np.ndarray:
    """Keep only the parts of ``mask`` that reach the image border.

    This is what saves the white-shirt-on-a-white-background case. The shirt is
    the same colour as the backdrop, but it is fenced in by the face, hair and
    arms, so it never connects to the frame and is therefore kept.

    ``bridge`` lets the backdrop leak across structures up to about ``2*bridge``
    pixels thick before connectivity is measured, which separates two cases that
    are otherwise identical:

    * A table cell, the gap between hair strands, the space between bicycle
      spokes -- fenced in by something *thin*. The backdrop reaches them, so
      they are removed like any other backdrop.
    * A backdrop-coloured shirt fenced in by a person's arms and face --
      something *thick*. The backdrop cannot reach it, so it is kept.

    The result is intersected back with the original mask, so the widening can
    only ever change which backdrop pixels are reachable. It can never remove a
    pixel that did not already look like backdrop.
    """
    probe = mask.astype(np.uint8)
    if bridge > 0:
        size = 2 * bridge + 1
        probe = cv2.dilate(
            probe, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (size, size))
        )

    count, labels = cv2.connectedComponents(probe, connectivity=4)
    keep = np.zeros(count, dtype=bool)
    touching = _border_labels(labels)
    keep[touching[touching > 0]] = True

    return keep[labels] & mask.astype(bool)


def _fill_small_holes(binary: np.ndarray, max_ratio: float) -> np.ndarray:
    """Fill enclosed gaps that are too small to be real openings."""
    fg_area = int(binary.sum())
    if fg_area == 0:
        return binary

    count, labels, stats, _ = cv2.connectedComponentsWithStats(
        (1 - binary).astype(np.uint8), connectivity=4
    )
    if count <= 1:
        return binary

    fill = np.zeros(count, dtype=bool)
    areas = stats[:, cv2.CC_STAT_AREA]
    fill[1:] = areas[1:] <= max_ratio * fg_area
    fill[_border_labels(labels)] = False  # outside is not a hole
    fill[0] = False

    return (binary | fill[labels]).astype(np.uint8)


def _drop_components(binary: np.ndarray, min_area: float) -> np.ndarray:
    """Remove connected components smaller than ``min_area`` pixels."""
    count, labels, stats, _ = cv2.connectedComponentsWithStats(
        binary.astype(np.uint8), connectivity=8
    )
    if count <= 2:
        return binary

    keep = np.zeros(count, dtype=bool)
    keep[1:] = stats[1:, cv2.CC_STAT_AREA] >= min_area

    return keep[labels].astype(np.uint8)


def _clean_mask(binary: np.ndarray, dominant_subject: bool) -> np.ndarray:
    """Tidy a binary mask without eating into the object.

    Only a single small closing is used. Repeated erode/dilate cycles are what
    destroy fingers, antennas and hair, so there are none here.

    ``dominant_subject`` says how to judge detached blobs, and the distinction
    matters a lot:

    * ``False`` (plain backdrop) -- anything that is not the backdrop is real
      content. Only true noise is dropped, by absolute size. A photographed page
      is dozens of separate marks, and a word is thousands of times smaller than
      a drawing on the same page; judging blobs against the biggest one would
      delete every word on the page.
    * ``True`` (busy backdrop, after GrabCut) -- the mask is speckled with
      leftover background, so blobs are judged against the largest one.
    """
    h, w = binary.shape
    k = max(3, int(round(0.004 * max(h, w))) | 1)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k))

    closed = cv2.morphologyEx(binary.astype(np.uint8), cv2.MORPH_CLOSE, kernel)
    closed = _fill_small_holes(closed, HOLE_MAX_RATIO)

    if dominant_subject:
        count, _, stats, _ = cv2.connectedComponentsWithStats(closed, connectivity=8)
        if count > 2:
            largest = float(stats[1:, cv2.CC_STAT_AREA].max())
            closed = _drop_components(closed, max(COMPONENT_MIN_RATIO * largest, 16.0))
    else:
        closed = _drop_components(
            closed, max(SPECK_MIN_AREA, SPECK_AREA_RATIO * binary.size)
        )

    return closed


# --------------------------------------------------------------------------
# Mask strategies
# --------------------------------------------------------------------------


def _shadow_mask(lab: np.ndarray, bg: _Background) -> np.ndarray:
    """Find backdrop that is merely in shadow rather than part of the subject.

    A cast shadow darkens the background without tinting it, and it fades in
    gradually. So it is identified by three things at once: the colour keeps
    the backdrop's hue, it is darker than the backdrop, and it has no crisp
    boundary anywhere.

    The gradient test is what makes this safe for a plain grey object, which
    also has the backdrop's hue and is also darker. An object has a sharp
    outline, so its outline fails the test, stays out of the background set,
    and fences the object's interior off from the image border -- which is what
    keeps it in the picture.
    """
    lightness = lab[..., 0]

    # Same hue as the backdrop, and darker than it, but not so dark it is
    # obviously an object.
    chroma_shift = np.linalg.norm(lab[..., 1:] - bg.color[1:], axis=2)
    candidate = (
        (chroma_shift < SHADOW_MAX_CHROMA)
        & (lightness < bg.color[0])
        & (lightness > SHADOW_MIN_LIGHTNESS * bg.color[0])
    ).astype(np.uint8)

    if not candidate.any():
        return candidate.astype(bool)

    count, labels = cv2.connectedComponents(candidate, connectivity=8)
    if count <= 1:
        return candidate.astype(bool)

    gx = cv2.Sobel(lightness, cv2.CV_32F, 1, 0, ksize=3)
    gy = cv2.Sobel(lightness, cv2.CV_32F, 0, 1, ksize=3)
    sharp = cv2.GaussianBlur(cv2.magnitude(gx, gy), (0, 0), 1.5) >= SHADOW_MAX_GRADIENT

    # The deciding test, applied per region rather than per pixel: does this
    # region have a crisp outline? A shadow fades into the backdrop, so almost
    # none of its border is sharp. A plain grey object shares the backdrop's hue
    # and is darker too, but every millimetre of its outline is crisp.
    #
    # Judging whole regions matters. Per pixel, a grey object's flat middle
    # looks exactly like shadow, and only the few pixels at its rim disagree --
    # far too thin a distinction to rest on.
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    outside = cv2.dilate(labels.astype(np.float32), kernel).astype(np.int32)
    ring = (candidate == 0) & (outside > 0)

    ids = outside[ring]
    border_px = np.bincount(ids, minlength=count).astype(np.float32)
    sharp_px = np.bincount(
        ids, weights=sharp[ring].astype(np.float32), minlength=count
    )

    is_shadow = np.zeros(count, dtype=bool)
    is_shadow[1:] = (
        sharp_px[1:] / np.maximum(border_px[1:], 1.0)
    ) < SHADOW_MAX_SHARP_BORDER

    return is_shadow[labels]


def _bridge_width(shape: Tuple[int, int]) -> int:
    """How thick a fence the backdrop may see through, in pixels."""
    return max(1, int(round(BRIDGE_RATIO * max(shape))))


def _colour_mask(dist: np.ndarray, t_low: float, shadow: np.ndarray) -> np.ndarray:
    """Separate foreground from a reasonably uniform background by colour.

    Only background that reaches the image frame is removed, which is what
    protects a region inside the subject that happens to match the backdrop.
    """
    looks_like_bg = ((dist < t_low) | shadow).astype(np.uint8)
    removable = _border_connected(looks_like_bg, _bridge_width(dist.shape))
    return (~removable).astype(np.uint8)


def _soft_alpha(
    dist: np.ndarray, binary: np.ndarray, raw: np.ndarray, t_low: float
) -> np.ndarray:
    """Turn a binary mask into a soft alpha that matches the real edge blend.

    A pixel on the boundary is a mixture of the object and the backdrop:
    ``I = a*F + (1-a)*B``. Taking colour distances from the backdrop gives
    ``a = |I-B| / |F-B|``, so the pixel's own distance is normalised by how far
    the *nearby object* sits from the backdrop.

    Scaling against a fixed threshold instead would saturate far too early --
    a strongly contrasting subject would reach alpha 1.0 while the pixel was
    still a quarter background, and that leftover backdrop colour is exactly
    what shows up as a halo once the image is placed on a darker background.
    """
    h, w = binary.shape
    k = max(3, int(round(0.006 * max(h, w))) | 1)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k))
    interior = cv2.erode(binary, kernel).astype(bool)

    if not interior.any():
        interior = binary.astype(bool)
    if not interior.any():
        return np.zeros_like(dist, dtype=np.float32)

    # How far the object sits from the backdrop, measured locally so a
    # multi-coloured subject gets a per-region estimate rather than one average.
    weight = interior.astype(np.float32)
    kb = max(9, int(round(0.06 * max(h, w))) | 1)
    total = cv2.blur(dist * weight, (kb, kb))
    count = cv2.blur(weight, (kb, kb))

    global_reach = float(dist[interior].mean())
    reach = np.where(count > 1e-3, total / np.maximum(count, 1e-6), global_reach)

    # Never let the denominator collapse; that would turn faint noise into
    # fully-opaque pixels.
    reach = np.maximum(reach, t_low + 1.0)

    alpha = np.clip((dist - t_low) / (reach - t_low), 0.0, 1.0).astype(np.float32)
    alpha[binary == 0] = 0.0

    # Force opacity only where the mask was solid *before* tidying. Closing and
    # hole-filling bridge narrow gaps -- between strands of hair, between the
    # spokes of a wheel -- and those gaps are backdrop. Forcing them opaque
    # would paste stripes of backdrop into the cut-out, so they keep their ramp
    # value instead, which is near zero because they match the backdrop.
    #
    # A region that was never removable in the first place, such as a
    # backdrop-coloured shirt fenced in by the subject, is in `raw` and does
    # get forced opaque.
    alpha[interior & raw.astype(bool)] = 1.0

    return alpha


def _grabcut_mask(
    rgb: np.ndarray,
    dist: np.ndarray,
    t_low: float,
    t_high: float,
    shadow: np.ndarray,
) -> np.ndarray | None:
    """Refine a busy background with GrabCut, seeded from the colour analysis.

    Returns ``None`` if the image gives GrabCut nothing to work with, in which
    case the caller falls back to the pure colour mask.
    """
    looks_like_bg = ((dist < t_low) | shadow).astype(np.uint8)
    removable = _border_connected(looks_like_bg, _bridge_width(dist.shape))

    gc = np.full(dist.shape, cv2.GC_PR_FGD, dtype=np.uint8)
    gc[removable] = cv2.GC_PR_BGD

    # Definite background: border-connected, and clearly the background colour.
    sure_bg = removable & (dist < t_low * 0.6)
    gc[sure_bg] = cv2.GC_BGD

    # Definite foreground: nothing like the background colour, and not just a
    # patch of backdrop lying in shadow.
    sure_fg = (dist > t_high * 1.6) & ~shadow
    gc[sure_fg] = cv2.GC_FGD

    # Seed the outermost ring as background, but only where it actually looks
    # like background -- a subject cropped by the frame must not be seeded away.
    ring = np.zeros(dist.shape, dtype=bool)
    ring[:2, :] = ring[-2:, :] = ring[:, :2] = ring[:, -2:] = True
    gc[ring & (dist < t_high)] = cv2.GC_BGD

    if not np.any(gc == cv2.GC_FGD):
        # Nothing stands out by colour. Fall back to the most distant pixels so
        # GrabCut still has a foreground seed to grow from.
        cutoff = float(np.percentile(dist, 99.0))
        if cutoff <= t_low:
            return None
        gc[dist >= cutoff] = cv2.GC_FGD

    if not np.any((gc == cv2.GC_BGD) | (gc == cv2.GC_PR_BGD)):
        return None

    bgr = cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)
    bgd_model = np.zeros((1, 65), np.float64)
    fgd_model = np.zeros((1, 65), np.float64)

    try:
        cv2.grabCut(bgr, gc, None, bgd_model, fgd_model, 3, cv2.GC_INIT_WITH_MASK)
    except cv2.error:
        return None

    binary = ((gc == cv2.GC_FGD) | (gc == cv2.GC_PR_FGD)).astype(np.uint8)

    if binary.sum() < 0.005 * binary.size:
        # GrabCut collapsed and erased the subject. Preserving the foreground
        # matters more than a clean background, so discard this result.
        return None

    return binary


# --------------------------------------------------------------------------
# Edge refinement
# --------------------------------------------------------------------------


def _guided_filter(guide: np.ndarray, src: np.ndarray, radius: int, eps: float) -> np.ndarray:
    """Edge-preserving filter (He, Sun & Tang, 2010).

    Pulls the mask boundary onto the real edges in the photograph and produces
    a naturally anti-aliased alpha ramp instead of a stair-stepped one. This is
    ordinary linear filtering -- box filters and per-pixel arithmetic.
    """
    ksize = (2 * radius + 1, 2 * radius + 1)

    def box(x: np.ndarray) -> np.ndarray:
        return cv2.boxFilter(x, -1, ksize, normalize=True, borderType=cv2.BORDER_REFLECT)

    mean_g = box(guide)
    mean_s = box(src)
    var_g = box(guide * guide) - mean_g * mean_g
    cov_gs = box(guide * src) - mean_g * mean_s

    a = cov_gs / (var_g + eps)
    b = mean_s - a * mean_g

    return box(a) * guide + box(b)


def _refine_alpha(rgb: np.ndarray, alpha: np.ndarray) -> np.ndarray:
    """Feather the mask against the full-resolution image."""
    h, w = rgb.shape[:2]

    scale = 1.0
    if h * w > REFINE_MAX_PIXELS:
        scale = float(np.sqrt(REFINE_MAX_PIXELS / (h * w)))
    rw, rh = max(1, int(round(w * scale))), max(1, int(round(h * scale)))

    guide_src = rgb if scale == 1.0 else cv2.resize(rgb, (rw, rh), interpolation=cv2.INTER_AREA)
    guide = cv2.cvtColor(guide_src, cv2.COLOR_RGB2GRAY).astype(np.float32) / 255.0

    work = alpha if (rw, rh) == (w, h) else cv2.resize(alpha, (rw, rh), interpolation=cv2.INTER_LINEAR)

    radius = max(2, int(round(0.004 * max(rh, rw))))
    refined = _guided_filter(guide, work.astype(np.float32), radius, eps=1e-3)
    refined = np.clip(refined, 0.0, 1.0)

    if (rw, rh) != (w, h):
        refined = cv2.resize(refined, (w, h), interpolation=cv2.INTER_LINEAR)

    # Snap only the very extremes, so flat areas are genuinely solid or
    # genuinely gone. The cut-offs are deliberately tight: rounding a 0.97 pixel
    # up to opaque keeps the backdrop colour that is mixed into it, and that
    # leftover is what reads as a halo against a darker background.
    refined[refined < 0.02] = 0.0
    refined[refined > 0.995] = 1.0

    return np.clip(refined, 0.0, 1.0)


def _remove_colour_spill(rgb: np.ndarray, alpha: np.ndarray) -> np.ndarray:
    """Undo the background colour mixed into semi-transparent edge pixels.

    An edge pixel is a blend of object and background: ``I = a*F + (1-a)*B``.
    Solving for ``F`` recovers the object's own colour. Without this, cutting a
    subject off a white backdrop and dropping it on black leaves a bright
    outline around it.
    """
    h, w = rgb.shape[:2]
    if h * w > DECONTAMINATE_MAX_PIXELS:
        return rgb

    # Every non-background pixel is corrected. The formula is an exact identity
    # where alpha is 1, so covering the solid interior costs nothing and avoids
    # an arbitrary cut-off that would leave partly-mixed pixels untouched.
    band = alpha > 0.02
    if not band.any():
        return rgb

    img = rgb.astype(np.float32)

    # Local background colour: a weighted blur of the pixels we believe are
    # background. It varies smoothly, so estimating it small and scaling up
    # costs nothing in quality and saves a lot of memory.
    bs = float(np.sqrt(min(1.0, 1_000_000 / max(h * w, 1))))
    sw, sh = max(8, int(w * bs)), max(8, int(h * bs))

    small_img = cv2.resize(img, (sw, sh), interpolation=cv2.INTER_AREA)
    small_w = cv2.resize(1.0 - alpha, (sw, sh), interpolation=cv2.INTER_AREA)

    k = max(5, int(round(0.05 * max(sw, sh))) | 1)
    num = cv2.blur(small_img * small_w[..., None], (k, k))
    den = cv2.blur(small_w, (k, k))[..., None]

    # Deep inside a large subject there may be no background pixel within reach.
    # Fall back to the overall backdrop colour rather than dividing by ~zero.
    weight_sum = float(small_w.sum())
    fallback = (
        (small_img * small_w[..., None]).sum(axis=(0, 1)) / weight_sum
        if weight_sum > 1e-6
        else np.zeros(3, np.float32)
    )
    local_bg = np.where(den > 1e-3, num / np.maximum(den, 1e-6), fallback)

    bg = cv2.resize(local_bg, (w, h), interpolation=cv2.INTER_LINEAR)
    del small_img, small_w, num, den, local_bg

    a = np.clip(alpha, 0.15, 1.0)[..., None]
    fg = np.clip((img - (1.0 - alpha[..., None]) * bg) / a, 0.0, 255.0)
    del bg

    out = img
    np.copyto(out, fg, where=band[..., None])
    del fg

    # Round rather than truncate. Truncating would darken every corrected pixel
    # by up to one level, which is a visible shift across a large edge band.
    return np.clip(out + 0.5, 0.0, 255.0).astype(np.uint8)


# --------------------------------------------------------------------------
# Public API
# --------------------------------------------------------------------------


def remove_background(image: Image.Image) -> Tuple[np.ndarray, np.ndarray]:
    """Separate the main object from its background.

    Args:
        image: An upright RGB or RGBA image, as returned by :func:`load_image`.
            It is never modified.

    Returns:
        ``(foreground, mask)`` where ``foreground`` is an ``HxWx3`` uint8 RGB
        array and ``mask`` is an ``HxW`` float32 alpha map in ``[0, 1]``. Both
        are at the image's original resolution.
    """
    rgb = np.asarray(image.convert("RGB"), dtype=np.uint8)
    h, w = rgb.shape[:2]

    # Analysis runs on a scaled copy for speed. Only the mask is computed here;
    # the picture itself is never downscaled.
    scale = min(1.0, WORK_MAX_EDGE / max(h, w))
    if scale < 1.0:
        sw, sh = max(1, int(round(w * scale))), max(1, int(round(h * scale)))
        small = cv2.resize(rgb, (sw, sh), interpolation=cv2.INTER_AREA)
    else:
        small = rgb

    lab = _to_lab(small)
    bg = _analyse_border(lab)
    t_low, t_high = _thresholds(bg)

    dist = np.linalg.norm(lab - bg.color, axis=2).astype(np.float32)
    shadow = _shadow_mask(lab, bg)
    del lab

    raw = _colour_mask(dist, t_low, shadow)
    binary, use_ramp = raw, True

    if not bg.is_uniform:
        # Busy or textured background: colour distance alone is not enough.
        refined = _grabcut_mask(small, dist, t_low, t_high, shadow)
        if refined is not None:
            binary, raw, use_ramp = refined, refined, False

    binary = _clean_mask(binary, dominant_subject=not use_ramp)

    if binary.sum() == 0:
        # Nothing separated cleanly. Keeping the whole picture is the honest
        # outcome -- far better than handing back an empty cut-out.
        alpha_small = np.ones(binary.shape, dtype=np.float32)
    elif use_ramp:
        alpha_small = _soft_alpha(dist, binary, raw, t_low)
    else:
        # After GrabCut the colour distances mean little, so the binary edge is
        # feathered by the guided filter instead.
        alpha_small = binary.astype(np.float32)

    del dist, binary, raw, shadow

    if small is not rgb:
        alpha = cv2.resize(alpha_small, (w, h), interpolation=cv2.INTER_LINEAR)
        del small
    else:
        alpha = alpha_small

    alpha = _refine_alpha(rgb, alpha.astype(np.float32))

    # An upload that already had transparency has told us where its background
    # is; respect it rather than second-guessing it.
    if image.mode == "RGBA":
        source_alpha = np.asarray(image.getchannel("A"), dtype=np.float32) / 255.0
        alpha = np.minimum(alpha, source_alpha)

    foreground = _remove_colour_spill(rgb, alpha)

    return foreground, alpha


def whiten_paper(
    image: np.ndarray, strength: float = 1.0, mask: np.ndarray | None = None
) -> np.ndarray:
    """Make photographed paper read as a real white sheet.

    A phone photo of a page is never evenly lit: one side catches the lamp, the
    other falls off into shadow, the curl of the page adds a gradient, and the
    whole thing usually carries a colour cast. Brightening the image globally
    cannot fix that -- it turns the bright side white and leaves the dark side
    grey, so a page composited onto a white background still shows a seam.

    So the paper colour is estimated *at every pixel* and divided out. Dividing
    normalises the lighting and the colour cast in one step, because the cast is
    in the estimate too: pink paper over pink estimate is 1.0, which is white.

    Args:
        image: ``HxWx3`` uint8 RGB. Not modified.
        strength: 0 leaves the image alone, 1 applies the correction fully.
        mask: optional ``HxW`` alpha map. When given, only the pixels it keeps
            are used to judge how dark the ink is. Without it, a page shot
            against a dark desk would have its ink level read off the desk,
            which is far darker than any ink and leaves the text under-corrected.

    Returns:
        A new ``HxWx3`` uint8 RGB array, same size.
    """
    strength = float(np.clip(strength, 0.0, 1.0))
    if strength <= 0.0:
        return image

    work = image.astype(np.float32)

    # Stage one: flatten the lighting and the colour cast, coarse then fine.
    for reach, floor in PAPER_PASSES:
        field = _paper_field(np.clip(work, 0, 255).astype(np.uint8), reach, floor)

        # 1.0 on paper, lower on ink. Dividing by the white point pushes paper
        # past 1.0 so it clips to a solid 255 rather than hovering a few levels
        # below, where sensor noise would speckle against a white background.
        work = np.clip(work / field / PAPER_WHITE_POINT, 0.0, 1.0) * 255.0
        del field

    # Stage two: anchor the dark end as well. Paper is already pinned at 1.0, so
    # only the black point is left to place, and placing it is what stops soft
    # grey text from fading into the page.
    work /= 255.0
    black = _ink_point(work, mask)

    corrected = np.clip((work - black) / max(1.0 - black, 0.05), 0.0, 1.0)
    del work

    np.power(corrected, PAPER_GAMMA, out=corrected)
    corrected *= 255.0

    if strength < 1.0:
        corrected = image.astype(np.float32) * (1.0 - strength) + corrected * strength

    return np.clip(corrected + 0.5, 0.0, 255.0).astype(np.uint8)


def _ink_point(ratio: np.ndarray, mask: np.ndarray | None = None) -> float:
    """Find how dark the ink actually is, as a fraction of the paper.

    Read from the image rather than assumed, because ink in a photograph is
    never black -- soft focus and a dim room can leave body text sitting at
    two-thirds of the paper's brightness.
    """
    h, w = ratio.shape[:2]
    scale = min(1.0, PAPER_FIELD_MAX_EDGE / max(h, w))
    size = (max(16, int(w * scale)), max(16, int(h * scale)))

    if scale < 1.0:
        ratio = cv2.resize(ratio, size, interpolation=cv2.INTER_AREA)

    if mask is not None:
        keep = mask if scale >= 1.0 else cv2.resize(
            mask.astype(np.float32), size, interpolation=cv2.INTER_AREA
        )
        ratio = ratio[keep > 0.5]
        if ratio.size == 0:
            return PAPER_INK_FALLBACK

    dark = ratio[ratio < PAPER_INK_CEILING]
    if dark.size < 0.0005 * max(ratio.size, 1):
        return PAPER_INK_FALLBACK  # a blank page: nothing to anchor against

    return float(np.clip(np.percentile(dark, PAPER_INK_PERCENTILE), 0.02, 0.75))


def _paper_field(image: np.ndarray, reach_ratio: float, floor: float) -> np.ndarray:
    """Estimate the paper's colour and brightness at every pixel."""
    h, w = image.shape[:2]

    # Lighting varies smoothly, so it can be measured on a small copy and scaled
    # back up. Measuring it at full resolution costs a great deal and finds
    # exactly the same thing.
    scale = min(1.0, PAPER_FIELD_MAX_EDGE / max(h, w))
    sw, sh = max(16, int(round(w * scale))), max(16, int(round(h * scale)))
    small = cv2.resize(image, (sw, sh), interpolation=cv2.INTER_AREA)

    # Dilating keeps the brightest pixel in each neighbourhood, which on a page
    # is the paper -- ink simply disappears.
    reach = max(3, int(round(reach_ratio * max(sw, sh))) | 1)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (reach, reach))

    field = cv2.dilate(small, kernel).astype(np.float32)
    field = cv2.GaussianBlur(field, (0, 0), max(1.0, reach * PAPER_FIELD_SMOOTH))

    # Bound how far this pass may brighten anything, measured while the estimate
    # is still small and cheap to take a percentile of.
    if floor > 0.0:
        np.maximum(field, floor * float(np.percentile(field, 98)), out=field)

    field = cv2.resize(field, (w, h), interpolation=cv2.INTER_LINEAR)

    return np.maximum(field, 1.0)


def apply_strokes(
    mask: np.ndarray,
    image: np.ndarray,
    strokes: Iterable[dict],
    snap_to_edges: bool = True,
) -> np.ndarray:
    """Apply manual erase/restore brush strokes to an alpha mask.

    Strokes arrive in normalised coordinates, so the browser can paint on a
    small preview while the edit lands on the full-resolution mask. They are
    always applied to the *original* mask in order, which makes undo trivial --
    the caller just resends a shorter list.

    Args:
        mask: ``HxW`` float32 alpha map to edit. Not modified.
        image: ``HxWx3`` uint8 RGB, used as the guide when snapping.
        strokes: dicts of ``{"mode": "erase"|"restore", "radius": float,
            "points": [[x, y], ...]}``, with every coordinate and the radius
            given as a fraction (radius is relative to the longest edge).
        snap_to_edges: pull the painted boundary onto real edges in the photo,
            so a rough stroke still lands on the subject's outline.

    Returns:
        A new ``HxW`` float32 alpha map in ``[0, 1]``.
    """
    out = mask.astype(np.float32, copy=True)
    h, w = out.shape
    longest = float(max(h, w))
    guide: np.ndarray | None = None

    for stroke in strokes:
        mode = stroke.get("mode")
        points = stroke.get("points") or []
        if mode not in ("erase", "restore") or not points:
            continue

        radius = max(1.0, float(stroke.get("radius", 0.02)) * longest)
        xs = np.clip(np.asarray([p[0] for p in points], np.float32), 0.0, 1.0) * (w - 1)
        ys = np.clip(np.asarray([p[1] for p in points], np.float32), 0.0, 1.0) * (h - 1)

        # Work inside the stroke's own bounding box. A brush dab on a 12-megapixel
        # mask should cost what the dab covers, not what the image covers.
        pad = int(radius * 1.6) + 3
        x0, x1 = max(0, int(xs.min()) - pad), min(w, int(xs.max()) + pad + 1)
        y0, y1 = max(0, int(ys.min()) - pad), min(h, int(ys.max()) + pad + 1)
        if x1 <= x0 or y1 <= y0:
            continue

        stamp = np.zeros((y1 - y0, x1 - x0), np.float32)
        poly = np.stack([xs - x0, ys - y0], axis=1).round().astype(np.int32)

        if len(poly) > 1:
            cv2.polylines(
                stamp, [poly], False, 1.0, max(1, int(round(radius * 2))), cv2.LINE_AA
            )
        for end in (poly[0], poly[-1]):  # round caps
            cv2.circle(stamp, (int(end[0]), int(end[1])), max(1, int(radius)), 1.0, -1, cv2.LINE_AA)

        # A soft edge, so a stroke blends instead of leaving a cut-out circle.
        feather = max(3, int(radius * 0.5) | 1)
        stamp = np.clip(cv2.GaussianBlur(stamp, (feather, feather), 0), 0.0, 1.0)

        box = out[y0:y1, x0:x1]
        if mode == "erase":
            box *= 1.0 - stamp
        else:
            box += stamp * (1.0 - box)

        if snap_to_edges:
            if guide is None:
                guide = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY).astype(np.float32) / 255.0

            radius_px = max(2, int(round(0.004 * longest)))
            radius_px = min(radius_px, max(1, min(box.shape) // 2))
            refined = np.clip(
                _guided_filter(guide[y0:y1, x0:x1], box.copy(), radius_px, 1e-3), 0.0, 1.0
            )
            # Only where the brush actually landed; the rest of the box is
            # somebody else's work and must not be disturbed.
            np.copyto(box, box * (1.0 - stamp) + refined * stamp)

    return np.clip(out, 0.0, 1.0)


def parse_background(background: str) -> Tuple[int, int, int] | None:
    """Resolve a background choice to an RGB triple, or ``None`` for transparent."""
    key = (background or "white").strip().lower()

    if key == "transparent":
        return None
    if key == "white":
        return (255, 255, 255)
    if key == "black":
        return (0, 0, 0)

    match = _HEX_RE.match(key)
    if match:
        value = match.group(1)
        return (int(value[0:2], 16), int(value[2:4], 16), int(value[4:6], 16))

    raise ImageError(
        "Unrecognised background. Choose white, black, transparent, or a hex colour."
    )


def apply_background(
    foreground: np.ndarray, mask: np.ndarray, background: str = "white"
) -> Image.Image:
    """Composite the cut-out onto the chosen background.

    Args:
        foreground: ``HxWx3`` uint8 RGB array from :func:`remove_background`.
        mask: ``HxW`` float32 alpha map in ``[0, 1]``.
        background: ``"white"``, ``"black"``, ``"transparent"``, or ``"#RRGGBB"``.

    Returns:
        An RGB image, or an RGBA image with a real alpha channel when the
        background is transparent. Always at the input's resolution.
    """
    if foreground.shape[:2] != mask.shape[:2]:
        raise ValueError("foreground and mask must have the same dimensions")

    colour = parse_background(background)
    alpha8 = np.clip(mask * 255.0 + 0.5, 0, 255).astype(np.uint8)

    if colour is None:
        rgba = np.dstack([foreground, alpha8])
        return Image.fromarray(rgba, mode="RGBA")

    # result = foreground * alpha + background * (1 - alpha)
    a = mask[..., None].astype(np.float32)
    bg = np.array(colour, dtype=np.float32)
    composite = foreground.astype(np.float32) * a + bg * (1.0 - a)

    return Image.fromarray(np.clip(composite + 0.5, 0, 255).astype(np.uint8), mode="RGB")


def encode_image(image: Image.Image, fmt: str = "png") -> bytes:
    """Serialise an image once, at high quality.

    PNG is lossless and is the only format that can carry the alpha channel, so
    it is the default. JPEG is written at quality 95 with 4:4:4 chroma to avoid
    the colour smearing that the usual 4:2:0 default causes on hard edges.
    """
    fmt = (fmt or "png").lower()
    buffer = io.BytesIO()

    if fmt == "png":
        image.save(buffer, format="PNG", compress_level=6, optimize=False)
    elif fmt in ("jpg", "jpeg"):
        if image.mode == "RGBA":
            raise ImageError("JPEG cannot store transparency. Use PNG instead.")
        image.save(buffer, format="JPEG", quality=95, subsampling=0, optimize=True)
    elif fmt == "webp":
        image.save(buffer, format="WEBP", quality=95, method=4)
    else:
        raise ImageError(f"Unsupported output format: {fmt}")

    return buffer.getvalue()
