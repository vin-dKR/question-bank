"""Ink strengthening for cleaned line art.

Separate from `processor.py` on purpose: that file is vendored from the
bg-remover project and gets replaced wholesale when upstream changes
(EDUENTSS_INTEGRATION.md §15). Anything added there would be lost on the next
resync, so app-specific work lives here.

`whiten_paper` anchors the tone range — paper to white, ink to black — but it is
a *tone* correction and does nothing for edge definition. A diagram photographed
slightly out of focus comes out clean and correctly exposed but still soft. This
sharpens the strokes without touching the paper.
"""

from __future__ import annotations

import cv2
import numpy as np

#: Unsharp masking: how far around a pixel the "blurred" reference is taken, and
#: how strongly the difference is added back. The radius is small because line
#: art has thin strokes -- a wide radius would halo them instead of sharpening.
SHARPEN_RADIUS = 1.2
SHARPEN_AMOUNT = 0.4

#: Pixels at or above this fraction of white are treated as paper and left alone.
#: Sharpening flat paper only amplifies sensor noise into visible speckle.
PAPER_FLOOR = 0.94

#: Contrast applied to the ink range after sharpening. Above 1 pushes dark pixels
#: darker while leaving anything near paper where it is.
#:
#: Deliberately gentle. Measured on a hatched engraving, gain 1.15 with sharpen
#: 0.8 raised edge definition but crushed detail from 62.4 to 55.9 and nearly
#: doubled the pixels sitting at near-black -- fine strokes merged into solid
#: shapes and the drawing lost its texture. 1.04/0.4 keeps detail at 60.6 and
#: still gains most of the sharpening. whiten_paper already applies its own
#: midtone gamma, so this compounds with that rather than acting alone.
INK_GAIN = 1.04


def strengthen_ink(
    rgb: np.ndarray,
    sharpen: float = SHARPEN_AMOUNT,
    gain: float = INK_GAIN,
) -> np.ndarray:
    """Sharpen strokes and deepen the ink on an already-whitened page.

    Args:
        rgb: ``HxWx3`` uint8 RGB, normally the output of ``whiten_paper``. Running
            this on an uncorrected photo would sharpen the paper's grain too.
        sharpen: unsharp amount. 0 disables sharpening.
        gain: ink contrast. 1.0 disables deepening.

    Returns:
        A new ``HxWx3`` uint8 RGB array, same size.
    """
    work = rgb.astype(np.float32) / 255.0

    if sharpen > 0.0:
        blurred = cv2.GaussianBlur(work, (0, 0), SHARPEN_RADIUS)
        work = np.clip(work + sharpen * (work - blurred), 0.0, 1.0)

    if gain != 1.0:
        # Scale distance-from-white rather than the value itself, so paper stays
        # pinned at 1.0 and only the ink moves. Doing it the other way round
        # would drag the paper grey.
        ink = 1.0 - work
        ink = np.clip(ink * gain, 0.0, 1.0)
        deepened = 1.0 - ink

        # Leave true paper untouched: without this the sharpening halo around
        # every stroke gets deepened into a visible grey outline.
        luma = work.mean(axis=2, keepdims=True)
        work = np.where(luma >= PAPER_FLOOR, work, deepened)

    return np.clip(work * 255.0 + 0.5, 0.0, 255.0).astype(np.uint8)
