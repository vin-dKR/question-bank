"""The diagram-cleaning pipeline, in the order the app runs it.

    remove_background   cut the drawing out of whatever surrounds it
            v
    composite on white  anything not recognised as the drawing becomes paper
            v
    whiten_paper        level the lighting and colour cast that remain
            v
    strengthen_ink      sharpen the strokes and deepen the black
            v
    final image

Why background removal comes first, given that `whiten_paper` alone already
drives paper to 255: a crop is not guaranteed to contain only paper. It can catch
the edge of the page, the desk beneath it, or the dark band where the page curls.
None of those are paper, so the leveller cannot correct them -- it would measure
them as very dark paper and try to brighten them. Removing them and painting
white in their place gives the leveller a clean field to work from.

On a crop that *is* all paper the removal stage is close to a no-op, which is the
expected case and costs one extra pass.

Lives outside processor.py because that file is vendored and replaced wholesale
on resync (EDUENTSS_INTEGRATION.md §15).
"""

from __future__ import annotations

import numpy as np
from PIL import Image

from . import processor
from .enhance import strengthen_ink
from .processor import apply_background, remove_background, whiten_paper

#: Where the black point is read, as a percentile of the pixels darker than
#: PAPER_INK_CEILING. This is the DOMINANT control over how black the result
#: goes: everything at or below the chosen point is subtracted to pure 0, so
#: processor.py's 8.0 crushes the darkest ~8% of ink. Dropping it to 3.0 moved
#: the mean ink from 42 to 51 on a hatched engraving, against 42 to 48 for the
#: gamma change below — nearly twice the effect, and it keeps faint pencil.
PAPER_INK_PERCENTILE = 3.0

#: Midtone curve used while levelling. Milder than the black point: it bends
#: greys down without clipping anything. processor.py ships 1.25, which suits a
#: page of text but merges fine strokes on a drawing. Together with the
#: percentile above this lands the mean ink at 59 with the most surviving
#: detail (62.9) and the least crushing (1.7%) of any combination measured.
PAPER_GAMMA = 1.0


def clean_diagram(
    image: Image.Image,
    *,
    remove_bg: bool = True,
    whiten: bool = True,
    enhance: bool = True,
    strength: float = 1.0,
    gamma: float = PAPER_GAMMA,
    ink_percentile: float = PAPER_INK_PERCENTILE,
) -> np.ndarray:
    """Run the cleaning pipeline over a diagram.

    Args:
        image: upright RGB/RGBA image, as returned by ``load_image``.
        remove_bg: cut the drawing out and repaint the surround white.
        whiten: level the lighting and colour cast.
        enhance: sharpen strokes and deepen the ink.
        strength: passed to ``whiten_paper``; 0 leaves tone alone.
        gamma: midtone curve for levelling. Above 1 deepens the ink.
        ink_percentile: where the black point is read. Lower keeps faint marks
            and is the main control over how black the result goes.

    Returns:
        ``HxWx3`` uint8 RGB at the input's resolution.
    """
    rgb = np.asarray(image.convert("RGB"), dtype=np.uint8)

    if remove_bg:
        try:
            foreground, mask = remove_background(image)
            # Composited onto white rather than kept transparent: the output goes
            # into a printed test paper, and a PNG with an alpha channel would
            # simply be flattened against white anyway.
            rgb = np.asarray(
                apply_background(foreground, mask, "white").convert("RGB"),
                dtype=np.uint8,
            )
        except Exception:
            # Separation is a best-effort improvement. If it fails, the later
            # stages still produce a usable diagram from the original pixels.
            rgb = np.asarray(image.convert("RGB"), dtype=np.uint8)

    if whiten:
        # The curve is a module-level constant in the vendored processor, so it
        # is set around the call and put back afterwards — leaving it changed
        # would silently alter every later request in the same process.
        prev_gamma = processor.PAPER_GAMMA
        prev_pct = processor.PAPER_INK_PERCENTILE
        processor.PAPER_GAMMA = gamma
        processor.PAPER_INK_PERCENTILE = ink_percentile
        try:
            rgb = whiten_paper(rgb, strength)
        finally:
            processor.PAPER_GAMMA = prev_gamma
            processor.PAPER_INK_PERCENTILE = prev_pct

    if enhance:
        # After whitening, so the sharpener works on corrected tone rather than
        # amplifying the paper's grain.
        rgb = strengthen_ink(rgb)

    return rgb
