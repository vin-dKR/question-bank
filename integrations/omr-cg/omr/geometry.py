"""Single source of truth for every coordinate on an OMR sheet.

Nothing else in this project may hardcode a coordinate. The PDF renderer and the
OMRChecker template emitter both derive from here, so the two halves cannot
drift apart.

Coordinate spaces
-----------------

There are three, and confusing them is the main hazard:

``page``
    Pixels on the printed A4 page at ``DPI``. Origin top-left, y grows down.
    This is what we lay out in.

``template``
    What OMRChecker sees. Its ``CropOnMarkers`` preprocessor warps a photo onto
    the quadrilateral spanned by the four marker *centres* and then resizes that
    to ``pageDimensions``. So template space is NOT the page -- it is the box
    between marker centres, and everything printed outside the markers is gone
    by the time the template is applied.

    We deliberately set ``pageDimensions`` to the marker box measured in page
    pixels, which makes the two spaces the same scale. Converting is then a pure
    translation::

        template_x = page_x - MARKER_INSET
        template_y = page_y - MARKER_INSET

    See :func:`page_to_template`.

``pdf``
    ReportLab points, 72 per inch, origin *bottom-left*. Converting from page
    space is a scale plus a y-flip -- see :func:`page_to_pdf`.

Because template space is integer page pixels that we chose, rounding error
lands in the PDF (where a fraction of a millimetre is invisible) instead of in
the detection coordinates (where it is not).
"""

from __future__ import annotations

from dataclasses import dataclass, field

# --------------------------------------------------------------------------
# Base units
# --------------------------------------------------------------------------

DPI = 150
MM = DPI / 25.4  # 5.9055 px per mm

PT_PER_PX = 72 / DPI  # 0.48 -- page px to PDF points


def mm(value: float) -> float:
    """Millimetres to page pixels."""
    return value * MM


# --------------------------------------------------------------------------
# Page
# --------------------------------------------------------------------------

# A4 at 150 DPI. 210x297mm -> 1240.15 x 1754.0; we round the width down so both
# axes are integers and the PDF page still lands on 595.2 x 841.9 pt.
PAGE_W = 1240
PAGE_H = 1754

PDF_PAGE_W = PAGE_W * PT_PER_PX  # 595.2 pt
PDF_PAGE_H = PAGE_H * PT_PER_PX  # 841.92 pt


# --------------------------------------------------------------------------
# Corner markers
# --------------------------------------------------------------------------
#
# Constraints read off the vendored CropOnMarkers.py (not guessed):
#
#   * Exactly four markers, one per search region. The image is split with
#     QUADRANT_DIVISION = {"height_factor": 3, "width_factor": 2}, i.e. the top
#     two regions are the top *third* of the page and the bottom two are the
#     lower two-thirds. Top markers must therefore sit inside the top third.
#     At y = 60/1754 = 3.4% ours are comfortably inside.
#   * cv2.matchTemplate is run with the same unrotated marker bitmap in all four
#     regions, so every printed marker must have the same orientation. We use a
#     rotationally symmetric design so this is impossible to get wrong.
#   * The warp is built from marker CENTRES, so the centres -- not the marker
#     outlines -- define the template box.

MARKER_SIZE = 56  # px, printed square
MARKER_INSET = 60  # px from page edge to marker CENTRE

#: Marker centres in page space, clockwise from top-left.
MARKER_CENTRES = (
    (MARKER_INSET, MARKER_INSET),
    (PAGE_W - MARKER_INSET, MARKER_INSET),
    (PAGE_W - MARKER_INSET, PAGE_H - MARKER_INSET),
    (MARKER_INSET, PAGE_H - MARKER_INSET),
)

#: OMRChecker's ``pageDimensions`` -- the marker-centre box, in page pixels.
TEMPLATE_W = PAGE_W - 2 * MARKER_INSET  # 1120
TEMPLATE_H = PAGE_H - 2 * MARKER_INSET  # 1634

#: Passed to CropOnMarkers as ``sheetToMarkerWidthRatio``. The marker bitmap is
#: resized to processing_width / ratio before matching, so this must track
#: MARKER_SIZE relative to the full page width.
SHEET_TO_MARKER_WIDTH_RATIO = round(PAGE_W / MARKER_SIZE)  # 22


# --------------------------------------------------------------------------
# Bubbles
# --------------------------------------------------------------------------
#
# ~4.5mm bubbles at ~8mm pitch. Smaller looks tidier on screen and degrades
# badly through a phone camera.

BUBBLE_D = round(mm(4.5))  # 27 px
BUBBLE_PITCH = round(mm(8.0))  # 47 px -- centre to centre within a row
ROW_PITCH = round(mm(8.5))  # 50 px -- centre to centre between rows

#: ``bubbleDimensions`` for the template. OMRChecker samples an axis-aligned box
#: of this size; keeping it equal to the printed diameter means the sample region
#: is the inscribed square of the circle plus a little margin.
BUBBLE_BOX = (BUBBLE_D, BUBBLE_D)


# --------------------------------------------------------------------------
# Page furniture, in page space
# --------------------------------------------------------------------------

#: Nothing may be printed within this distance of a marker centre. Stray ink
#: touching a fiducial lowers its template-match score, and a marker that drops
#: below CropOnMarkers' 0.3 floor fails the whole sheet rather than one question.
MARKER_CLEARANCE = MARKER_SIZE / 2 + 16  # 44

CONTENT_L = round(MARKER_INSET + MARKER_CLEARANCE)  # 104
CONTENT_R = round(PAGE_W - MARKER_INSET - MARKER_CLEARANCE)  # 1136
CONTENT_W = CONTENT_R - CONTENT_L

#: Top of the header band, kept below the corner markers so the exam title and
#: the QR code cannot touch them.
HEADER_Y = round(MARKER_INSET + MARKER_CLEARANCE - 6)  # 98
HEADER_H = 96

QR_SIZE = 130
QR_X = CONTENT_R - QR_SIZE
QR_Y = HEADER_Y

#: Printed reference line the checker measures as a print-scale sanity check.
#: If a sheet was printed "fit to page" this line will not measure 100mm and
#: every bubble will have moved off its sample region.
REF_LINE_MM = 100.0
REF_LINE_LEN = mm(REF_LINE_MM)
REF_LINE_X = CONTENT_L
REF_LINE_Y = PAGE_H - MARKER_INSET - 30
REF_LINE_CAPTION_DY = 14  # caption sits above the line, not off the right edge

#: Roll number grid: one column per digit position, ten bubbles down each.
ROLL_DIGITS = 10  # 0-9 down a column
ROLL_Y = HEADER_Y + HEADER_H + 40

#: Vertical structure above the first roll bubble: a title, then a row of
#: write-in boxes so the student can read back what they filled. ROLL_LABEL_H is
#: the distance from ROLL_Y to the CENTRE of the first (digit 0) bubble.
ROLL_TITLE_H = 24
ROLL_WRITEIN_H = BUBBLE_D
ROLL_WRITEIN_GAP = 10
ROLL_LABEL_H = round(
    ROLL_TITLE_H + ROLL_WRITEIN_H + ROLL_WRITEIN_GAP + BUBBLE_D / 2
)

#: Instructions sit to the RIGHT of the roll grid rather than below it. Stacking
#: them cost ~150px of body height for no reason; the roll grid is narrow and the
#: space beside it was empty. MAX_ROLL_DIGITS bounds the grid width so this
#: column start is safe for any valid spec.
INSTRUCTIONS_X = CONTENT_L + 10 * BUBBLE_PITCH + 50
INSTRUCTIONS_Y = ROLL_Y

#: The instructions block is variable-length, so its height is *reserved* rather
#: than measured. Spec validation caps the line count at MAX_INSTRUCTION_LINES so
#: the block can never grow into the first question row -- an overlap the
#: renderer would happily draw and which puts stray ink inside a sample region.
INSTRUCTIONS_HEADER_H = 38  # clears the bold "INSTRUCTIONS" heading itself
INSTRUCTION_LINE_H = 19
MAX_INSTRUCTION_LINES = 6
INSTRUCTIONS_W = CONTENT_R - INSTRUCTIONS_X

#: Bottom edge of the roll grid's last bubble.
ROLL_BOTTOM = (
    ROLL_Y + ROLL_LABEL_H + (ROLL_DIGITS - 1) * ROW_PITCH + BUBBLE_D / 2
)

#: Where question blocks may live. Bottom stops short of the reference line.
#:
#: Page 1 carries the roll grid and instructions, so its body starts below them.
#: Later pages carry only the header, and reserving page 1's furniture on every
#: page would waste roughly a third of the paper on a long exam.
BODY_TOP_FIRST = round(ROLL_BOTTOM + 40)
BODY_TOP_CONTINUATION = HEADER_Y + HEADER_H + 40
BODY_BOTTOM = REF_LINE_Y - 40

#: Kept for callers that only care about the tightest case.
BODY_TOP = BODY_TOP_FIRST


def body_top(page_number: int) -> int:
    """Top of the question area for a given 1-based page number."""
    return BODY_TOP_FIRST if page_number == 1 else BODY_TOP_CONTINUATION

#: Two columns of questions per page.
BODY_COLUMNS = 2
COLUMN_GUTTER = 40
COLUMN_W = (CONTENT_W - COLUMN_GUTTER * (BODY_COLUMNS - 1)) // BODY_COLUMNS

#: Space reserved left of the first bubble for the "Q12" label.
QNO_LABEL_W = 62

#: A FIB answer box, sized to fit a handwritten short answer.
FIB_BOX_H = round(mm(12))
FIB_BOX_W = COLUMN_W - QNO_LABEL_W

#: Vertical space each question type consumes in a column, including the gap
#: below it. A block is never split across a page boundary.
QUESTION_GAP = 12


# --------------------------------------------------------------------------
# Space conversions
# --------------------------------------------------------------------------


def page_to_template(x: float, y: float) -> tuple[int, int]:
    """Page pixels -> OMRChecker template pixels.

    A pure translation by the marker inset, because ``pageDimensions`` is set to
    the marker box measured in page pixels. Rounded to int: template coordinates
    are exact integers we chose.
    """
    return round(x - MARKER_INSET), round(y - MARKER_INSET)


def page_to_pdf(x: float, y: float) -> tuple[float, float]:
    """Page pixels -> ReportLab points, flipping to a bottom-left origin."""
    return x * PT_PER_PX, (PAGE_H - y) * PT_PER_PX


def px_to_pt(value: float) -> float:
    """A length (not a position) in page pixels -> PDF points."""
    return value * PT_PER_PX


# --------------------------------------------------------------------------
# Laid-out primitives
# --------------------------------------------------------------------------


@dataclass(frozen=True)
class BubbleRow:
    """One question's answer row: N bubbles, left to right."""

    question_no: int
    qtype: str
    values: tuple[str, ...]
    #: Centre of the FIRST bubble, in page space.
    origin_x: float
    origin_y: float

    @property
    def height(self) -> float:
        return ROW_PITCH

    def bubble_centres(self) -> list[tuple[float, float]]:
        return [
            (self.origin_x + i * BUBBLE_PITCH, self.origin_y)
            for i in range(len(self.values))
        ]


@dataclass(frozen=True)
class FibBox:
    """A fill-in-the-blank answer rectangle. Deliberately has no bubbles.

    OMRChecker's fieldBlocks schema assumes regular bubble grids and sets
    ``additionalProperties: False`` at the template root, so these cannot live in
    template.json at all. They are emitted to our own fib_regions.json and the
    checker crops them out of the aligned image for manual grading.
    """

    question_no: int
    x: float
    y: float
    w: float
    h: float

    @property
    def height(self) -> float:
        return self.h + 10


@dataclass(frozen=True)
class RollGrid:
    """Roll-number bubble grid: ``columns`` digit positions, 0-9 down each."""

    columns: int
    origin_x: float
    origin_y: float

    def bubble_centres(self) -> list[tuple[int, float, float]]:
        """(digit, x, y) for every bubble, column-major."""
        out = []
        for col in range(self.columns):
            x = self.origin_x + col * BUBBLE_PITCH
            for digit in range(ROLL_DIGITS):
                out.append((digit, x, self.origin_y + digit * ROW_PITCH))
        return out

    @property
    def width(self) -> float:
        return (self.columns - 1) * BUBBLE_PITCH + BUBBLE_D


@dataclass
class Page:
    """One laid-out page of a sheet."""

    number: int
    rows: list[BubbleRow] = field(default_factory=list)
    fib_boxes: list[FibBox] = field(default_factory=list)
    roll_grid: RollGrid | None = None


def column_x(index: int) -> float:
    """Left edge of body column ``index``."""
    return CONTENT_L + index * (COLUMN_W + COLUMN_GUTTER)


def question_height(qtype: str) -> float:
    """Vertical space a question consumes, including the gap below it."""
    if qtype == "FIB":
        return FIB_BOX_H + 10 + QUESTION_GAP
    return ROW_PITCH + QUESTION_GAP


def row_width(n_bubbles: int) -> float:
    return (n_bubbles - 1) * BUBBLE_PITCH + BUBBLE_D
