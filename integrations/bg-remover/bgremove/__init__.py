"""Classical image processing for scanned and photographed pages.

Vendored from the bg-remover project — see EDUENTSS_INTEGRATION.md §15 for how to
resync. Only `processor.py` carries logic; this module re-exports the pieces the
app uses so callers import from the package rather than the file.

`whiten_paper` is the one that matters here: it makes photographed paper read as
a true white sheet, which is what stops cropped diagrams looking like tinted
rectangles pasted into a test paper.
"""

from .enhance import strengthen_ink
from .pipeline import clean_diagram
from .processor import (
    ImageError,
    apply_background,
    apply_strokes,
    encode_image,
    load_image,
    parse_background,
    remove_background,
    whiten_paper,
)

__all__ = [
    "ImageError",
    "apply_background",
    "apply_strokes",
    "clean_diagram",
    "encode_image",
    "load_image",
    "parse_background",
    "remove_background",
    "strengthen_ink",
    "whiten_paper",
]
