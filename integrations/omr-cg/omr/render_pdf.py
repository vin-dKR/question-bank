"""Draw the OMR sheet PDF.

Every position here comes from :mod:`omr.geometry` via :mod:`omr.layout`. This
module owns *appearance* -- line weights, fonts, labels -- and owns no
coordinates of its own.

ReportLab's origin is bottom-left while ours is top-left, so all positioning goes
through :func:`omr.geometry.page_to_pdf`, which scales by 72/150 and flips y.
"""

from __future__ import annotations

import io
from pathlib import Path

import qrcode
from reportlab.lib.colors import Color, black, white
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas

from . import geometry as g
from .layout import Layout, LaidOutPage
from .marker import ring_spec_px
from .spec import DEFAULT_INSTRUCTIONS, ExamSpec

#: Bubble outlines are grey, not black. A black ring is hard to distinguish from
#: a filled bubble once a phone camera has had its way with the contrast.
BUBBLE_STROKE = Color(0.45, 0.45, 0.45)
RULE_COLOR = Color(0.75, 0.75, 0.75)

FONT = "Helvetica"
FONT_BOLD = "Helvetica-Bold"


def _pt(value: float) -> float:
    return g.px_to_pt(value)


def draw_markers(c: canvas.Canvas) -> None:
    """Four concentric-ring fiducials, one per corner.

    Drawn as vectors from the same ring spec the matched bitmap is generated
    from, so the printed shape and the template bitmap describe one design.
    """
    rings = ring_spec_px(g.MARKER_SIZE)
    for cx, cy in g.MARKER_CENTRES:
        px, py = g.page_to_pdf(cx, cy)
        for outer, inner in rings:
            # Filled black annulus: black disc, then a white disc punched out.
            c.setFillColor(black)
            c.circle(px, py, _pt(outer), stroke=0, fill=1)
            if inner > 0:
                c.setFillColor(white)
                c.circle(px, py, _pt(inner), stroke=0, fill=1)
    c.setFillColor(black)


def draw_bubble(c: canvas.Canvas, cx: float, cy: float, label: str = "") -> None:
    px, py = g.page_to_pdf(cx, cy)
    r = _pt(g.BUBBLE_D / 2)

    c.setStrokeColor(BUBBLE_STROKE)
    c.setLineWidth(_pt(1.6))
    c.circle(px, py, r, stroke=1, fill=0)

    if label:
        c.setFillColor(BUBBLE_STROKE)
        c.setFont(FONT, _pt(15))
        # Nudge down by ~0.35 of cap height to centre the glyph optically.
        c.drawCentredString(px, py - _pt(5.5), label)
        c.setFillColor(black)


def draw_header(c: canvas.Canvas, spec: ExamSpec, page: LaidOutPage, pages: int) -> None:
    x, y = g.page_to_pdf(g.CONTENT_L, g.HEADER_Y + 26)
    c.setFillColor(black)
    c.setFont(FONT_BOLD, _pt(30))
    c.drawString(x, y, spec.exam_name)

    bits = [b for b in (spec.subject, spec.exam_date) if b]
    if spec.duration_min:
        bits.append(f"{spec.duration_min} min")
    if spec.max_marks:
        bits.append(f"Max marks: {spec.max_marks:g}")

    x2, y2 = g.page_to_pdf(g.CONTENT_L, g.HEADER_Y + 54)
    c.setFont(FONT, _pt(17))
    c.drawString(x2, y2, "   |   ".join(bits))

    x3, y3 = g.page_to_pdf(g.CONTENT_L, g.HEADER_Y + 78)
    c.setFont(FONT, _pt(15))
    c.drawString(
        x3,
        y3,
        f"Paper {spec.paper_id}  ·  layout v{spec.version}  ·  "
        f"page {page.number} of {pages}",
    )


def draw_qr(c: canvas.Canvas, spec: ExamSpec, page: LaidOutPage) -> None:
    """QR encoding paper id, layout version and page number.

    Deliberately not the student identity -- the roll grid carries that, and a QR
    that varies per student would mean rendering one PDF per student.
    """
    payload = f"OMR|{spec.paper_id}|v{spec.version}|p{page.number}"
    qr = qrcode.QRCode(box_size=10, border=1, error_correction=qrcode.ERROR_CORRECT_M)
    qr.add_data(payload)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white").convert("RGB")

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    buf.seek(0)

    px, py = g.page_to_pdf(g.QR_X, g.QR_Y + g.QR_SIZE)
    c.drawImage(
        ImageReader(buf), px, py, width=_pt(g.QR_SIZE), height=_pt(g.QR_SIZE), mask=None
    )


def draw_roll_grid(c: canvas.Canvas, grid: g.RollGrid) -> None:
    lx, ly = g.page_to_pdf(g.CONTENT_L, g.ROLL_Y + 16)
    c.setFillColor(black)
    c.setFont(FONT_BOLD, _pt(17))
    c.drawString(lx, ly, "ROLL NUMBER")

    # Write-in boxes above the grid so the student can read back what they filled.
    # Bottom edge stops ROLL_WRITEIN_GAP short of the first bubble.
    box_top = g.ROLL_Y + g.ROLL_TITLE_H
    for col in range(grid.columns):
        bx = grid.origin_x + col * g.BUBBLE_PITCH - g.BUBBLE_D / 2
        px, py = g.page_to_pdf(bx, box_top + g.ROLL_WRITEIN_H)
        c.setStrokeColor(BUBBLE_STROKE)
        c.setLineWidth(_pt(1.4))
        c.rect(px, py, _pt(g.BUBBLE_D), _pt(g.ROLL_WRITEIN_H), stroke=1, fill=0)

    for digit, x, y in grid.bubble_centres():
        draw_bubble(c, x, y, str(digit))


def draw_instructions(c: canvas.Canvas, spec: ExamSpec) -> None:
    lines = spec.instructions or DEFAULT_INSTRUCTIONS
    x, y = g.page_to_pdf(g.INSTRUCTIONS_X, g.INSTRUCTIONS_Y + 16)
    c.setFillColor(black)
    c.setFont(FONT_BOLD, _pt(17))
    c.drawString(x, y, "INSTRUCTIONS")

    c.setFont(FONT, _pt(14))
    for i, line in enumerate(lines[: g.MAX_INSTRUCTION_LINES]):
        lx, ly = g.page_to_pdf(
            g.INSTRUCTIONS_X,
            g.INSTRUCTIONS_Y + g.INSTRUCTIONS_HEADER_H + i * g.INSTRUCTION_LINE_H,
        )
        c.drawString(lx, ly, f"·  {line}")


def draw_question_row(c: canvas.Canvas, row: g.BubbleRow) -> None:
    lx, ly = g.page_to_pdf(row.origin_x - g.BUBBLE_D / 2 - 14, row.origin_y + 6)
    c.setFillColor(black)
    c.setFont(FONT, _pt(16))
    c.drawRightString(lx, ly, f"{row.question_no}.")

    for (cx, cy), label in zip(row.bubble_centres(), row.values):
        draw_bubble(c, cx, cy, label)


def draw_fib_box(c: canvas.Canvas, box: g.FibBox) -> None:
    lx, ly = g.page_to_pdf(box.x - 14, box.y + box.h / 2 + 6)
    c.setFillColor(black)
    c.setFont(FONT, _pt(16))
    c.drawRightString(lx, ly, f"{box.question_no}.")

    px, py = g.page_to_pdf(box.x, box.y + box.h)
    c.setStrokeColor(BUBBLE_STROKE)
    c.setLineWidth(_pt(1.4))
    c.rect(px, py, _pt(box.w), _pt(box.h), stroke=1, fill=0)


def draw_reference_line(c: canvas.Canvas) -> None:
    """A printed 100mm line the checker measures as a print-scale sanity check."""
    x1, y1 = g.page_to_pdf(g.REF_LINE_X, g.REF_LINE_Y)
    x2, _ = g.page_to_pdf(g.REF_LINE_X + g.REF_LINE_LEN, g.REF_LINE_Y)

    c.setStrokeColor(black)
    c.setLineWidth(_pt(2))
    c.line(x1, y1, x2, y1)
    for end in (x1, x2):
        c.line(end, y1 - _pt(6), end, y1 + _pt(6))

    # Caption above the line rather than after it, so it cannot run off the page.
    tx, ty = g.page_to_pdf(g.REF_LINE_X, g.REF_LINE_Y - g.REF_LINE_CAPTION_DY)
    c.setFillColor(black)
    c.setFont(FONT, _pt(13))
    c.drawString(
        tx,
        ty,
        f"{g.REF_LINE_MM:g} mm reference — if this does not measure exactly "
        f"{g.REF_LINE_MM:g} mm, the sheet was not printed at 100% scale.",
    )


def render(layout: Layout, pdf_path: str | Path) -> Path:
    """Draw every page of ``layout`` to ``pdf_path``."""
    pdf_path = Path(pdf_path)
    pdf_path.parent.mkdir(parents=True, exist_ok=True)

    c = canvas.Canvas(str(pdf_path), pagesize=(g.PDF_PAGE_W, g.PDF_PAGE_H))
    c.setTitle(f"{layout.spec.exam_name} — OMR answer sheet")
    c.setAuthor("IMS OMR module")

    for page in layout.pages:
        draw_markers(c)
        draw_header(c, layout.spec, page, layout.page_count)
        draw_qr(c, layout.spec, page)

        if page.roll_grid is not None:
            draw_roll_grid(c, page.roll_grid)
            draw_instructions(c, layout.spec)

        for row in page.rows:
            draw_question_row(c, row)
        for box in page.fib_boxes:
            draw_fib_box(c, box)

        draw_reference_line(c)
        c.showPage()

    c.save()
    return pdf_path
