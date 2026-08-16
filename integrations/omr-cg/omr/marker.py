"""Corner fiducial marker generation.

OMRChecker's ``CropOnMarkers`` locates the sheet by running ``cv2.matchTemplate``
with a marker bitmap against four regions of the photo. Two properties matter:

1. The *same unrotated bitmap* is matched in all four regions, so every printed
   marker must share one orientation. A concentric-ring design is symmetric under
   90-degree rotation and under reflection, which makes that impossible to get
   wrong.
2. ``apply_erode_subtract`` (on by default) subtracts an eroded copy before
   matching, which emphasises edges. Concentric rings are almost entirely edge,
   so they survive the transform with a strong response.

This is the same shape upstream ships as ``omr_marker.jpg``; we generate it
instead of vendoring the bitmap so the design stays inspectable and stays tied to
``geometry.MARKER_SIZE``.
"""

from __future__ import annotations

from pathlib import Path

import numpy as np

#: Rendered at high resolution regardless of printed size -- CropOnMarkers
#: rescales it to processing_width / sheetToMarkerWidthRatio before matching.
MARKER_BITMAP_SIZE = 160

#: Ring boundaries as fractions of the marker's half-width, outside in.
#: (outer_edge, inner_edge) pairs of filled black annuli.
_RINGS = (
    (1.00, 0.76),  # outer ring
    (0.56, 0.32),  # middle ring
    (0.16, 0.00),  # centre dot
)


def marker_array(size: int = MARKER_BITMAP_SIZE) -> np.ndarray:
    """Render the marker as a grayscale ndarray, black shapes on white."""
    img = np.full((size, size), 255, dtype=np.uint8)
    centre = (size - 1) / 2.0
    half = size / 2.0

    yy, xx = np.mgrid[0:size, 0:size]
    radius = np.sqrt((xx - centre) ** 2 + (yy - centre) ** 2) / half

    for outer, inner in _RINGS:
        img[(radius <= outer) & (radius >= inner)] = 0

    return img


def write_marker(path: str | Path, size: int = MARKER_BITMAP_SIZE) -> Path:
    """Write the marker bitmap next to a template as ``omr_marker.jpg``.

    CropOnMarkers resolves ``relativePath`` against the template's own directory,
    so this must be written into the same folder as template.json.
    """
    import cv2

    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(path), marker_array(size))
    return path


def ring_spec_px(printed_size: int) -> list[tuple[float, float]]:
    """Ring radii in page pixels for a marker printed at ``printed_size``.

    The PDF renderer draws the marker as vector rings from this, so the printed
    sheet and the matched bitmap describe the same shape.
    """
    half = printed_size / 2.0
    return [(outer * half, inner * half) for outer, inner in _RINGS]
