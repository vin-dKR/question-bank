"""Render an OMR layout as directly previewable HTML.

The preview deliberately consumes the same :class:`omr.layout.Layout` instance
as the ReportLab renderer and detection-template emitter.  Its inline SVG uses
the canonical 150-DPI page coordinate system as the ``viewBox``; the browser
therefore scales the already-laid-out sheet instead of recomputing positions.

At print time each SVG is fixed to the exact physical page size derived by
``geometry.py`` (595.2 x 841.92 ReportLab points), so the HTML remains useful as
an independent geometry check even though production PDFs stay on ReportLab.
"""

from __future__ import annotations

import argparse
import base64
import html
import io
import json
import sys
from pathlib import Path

import qrcode

from . import geometry as g
from . import spec as spec_mod
from .layout import Layout, LayoutError, LaidOutPage, plan
from .marker import ring_spec_px
from .spec import DEFAULT_INSTRUCTIONS, ExamSpec


def _text(value: object) -> str:
    return html.escape(str(value), quote=False)


def _attr(value: object) -> str:
    return html.escape(str(value), quote=True)


def _qr_data_uri(spec: ExamSpec, page: LaidOutPage) -> str:
    payload = f"OMR|{spec.paper_id}|v{spec.version}|p{page.number}"
    qr = qrcode.QRCode(
        box_size=10,
        border=1,
        error_correction=qrcode.constants.ERROR_CORRECT_M,
    )
    qr.add_data(payload)
    qr.make(fit=True)
    image = qr.make_image(fill_color="black", back_color="white").convert("RGB")

    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buffer.getvalue()).decode("ascii")


def _svg_text(
    x: float,
    y: float,
    value: object,
    *,
    size: float,
    weight: int = 400,
    anchor: str = "start",
) -> str:
    return (
        f'<text x="{x:g}" y="{y:g}" font-size="{size:g}" '
        f'font-weight="{weight}" text-anchor="{anchor}">{_text(value)}</text>'
    )


def _markers() -> list[str]:
    output: list[str] = []
    for cx, cy in g.MARKER_CENTRES:
        for outer, inner in ring_spec_px(g.MARKER_SIZE):
            output.append(f'<circle cx="{cx:g}" cy="{cy:g}" r="{outer:g}" fill="#000"/>')
            if inner > 0:
                output.append(f'<circle cx="{cx:g}" cy="{cy:g}" r="{inner:g}" fill="#fff"/>')
    return output


def _bubble(cx: float, cy: float, label: str = "") -> list[str]:
    output = [
        f'<circle cx="{cx:g}" cy="{cy:g}" r="{g.BUBBLE_D / 2:g}" '
        'fill="none" stroke="#737373" stroke-width="1.6"/>'
    ]
    if label:
        output.append(_svg_text(cx, cy + 5.5, label, size=15, anchor="middle"))
    return output


def _header(spec: ExamSpec, page: LaidOutPage, pages: int) -> list[str]:
    bits = [bit for bit in (spec.subject, spec.exam_date) if bit]
    if spec.duration_min:
        bits.append(f"{spec.duration_min} min")
    if spec.max_marks:
        bits.append(f"Max marks: {spec.max_marks:g}")

    return [
        _svg_text(g.CONTENT_L, g.HEADER_Y + 26, spec.exam_name, size=30, weight=700),
        _svg_text(g.CONTENT_L, g.HEADER_Y + 54, "   |   ".join(bits), size=17),
        _svg_text(
            g.CONTENT_L,
            g.HEADER_Y + 78,
            f"Paper {spec.paper_id}  ·  layout v{spec.version}  ·  page {page.number} of {pages}",
            size=15,
        ),
        (
            f'<image x="{g.QR_X:g}" y="{g.QR_Y:g}" width="{g.QR_SIZE:g}" '
            f'height="{g.QR_SIZE:g}" href="{_attr(_qr_data_uri(spec, page))}"/>'
        ),
    ]


def _roll_grid(grid: g.RollGrid) -> list[str]:
    output = [_svg_text(g.CONTENT_L, g.ROLL_Y + 16, "ROLL NUMBER", size=17, weight=700)]
    box_top = g.ROLL_Y + g.ROLL_TITLE_H
    for column in range(grid.columns):
        box_x = grid.origin_x + column * g.BUBBLE_PITCH - g.BUBBLE_D / 2
        output.append(
            f'<rect x="{box_x:g}" y="{box_top:g}" width="{g.BUBBLE_D:g}" '
            f'height="{g.ROLL_WRITEIN_H:g}" fill="none" stroke="#737373" stroke-width="1.4"/>'
        )
    for digit, x, y in grid.bubble_centres():
        output.extend(_bubble(x, y, str(digit)))
    return output


def _instructions(spec: ExamSpec) -> list[str]:
    lines = spec.instructions or DEFAULT_INSTRUCTIONS
    output = [
        _svg_text(g.INSTRUCTIONS_X, g.INSTRUCTIONS_Y + 16, "INSTRUCTIONS", size=17, weight=700)
    ]
    for index, line in enumerate(lines[: g.MAX_INSTRUCTION_LINES]):
        output.append(
            _svg_text(
                g.INSTRUCTIONS_X,
                g.INSTRUCTIONS_Y + g.INSTRUCTIONS_HEADER_H + index * g.INSTRUCTION_LINE_H,
                f"·  {line}",
                size=14,
            )
        )
    return output


def _question_row(row: g.BubbleRow) -> list[str]:
    output = [
        _svg_text(
            row.origin_x - g.BUBBLE_D / 2 - 14,
            row.origin_y + 6,
            f"{row.question_no}.",
            size=16,
            anchor="end",
        )
    ]
    for (cx, cy), label in zip(row.bubble_centres(), row.values):
        output.extend(_bubble(cx, cy, label))
    return output


def _fib_box(box: g.FibBox) -> list[str]:
    return [
        _svg_text(box.x - 14, box.y + box.h / 2 + 6, f"{box.question_no}.", size=16, anchor="end"),
        (
            f'<rect x="{box.x:g}" y="{box.y:g}" width="{box.w:g}" height="{box.h:g}" '
            'fill="none" stroke="#737373" stroke-width="1.4"/>'
        ),
    ]


def _reference_line() -> list[str]:
    x1 = g.REF_LINE_X
    x2 = g.REF_LINE_X + g.REF_LINE_LEN
    y = g.REF_LINE_Y
    return [
        f'<line x1="{x1:g}" y1="{y:g}" x2="{x2:g}" y2="{y:g}" stroke="#000" stroke-width="2"/>',
        f'<line x1="{x1:g}" y1="{y - 6:g}" x2="{x1:g}" y2="{y + 6:g}" stroke="#000" stroke-width="2"/>',
        f'<line x1="{x2:g}" y1="{y - 6:g}" x2="{x2:g}" y2="{y + 6:g}" stroke="#000" stroke-width="2"/>',
        _svg_text(
            x1,
            y - g.REF_LINE_CAPTION_DY,
            f"{g.REF_LINE_MM:g} mm reference — if this does not measure exactly "
            f"{g.REF_LINE_MM:g} mm, the sheet was not printed at 100% scale.",
            size=13,
        ),
    ]


def _page_svg(layout: Layout, page: LaidOutPage) -> str:
    elements = _markers()
    elements.extend(_header(layout.spec, page, layout.page_count))
    if page.roll_grid is not None:
        elements.extend(_roll_grid(page.roll_grid))
        elements.extend(_instructions(layout.spec))
    for row in page.rows:
        elements.extend(_question_row(row))
    for box in page.fib_boxes:
        elements.extend(_fib_box(box))
    elements.extend(_reference_line())

    return (
        f'<section class="omr-page" data-page="{page.number}" '
        f'data-page-width="{g.PAGE_W}" data-page-height="{g.PAGE_H}">'
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {g.PAGE_W} {g.PAGE_H}" '
        f'role="img" aria-label="OMR sheet page {page.number} of {layout.page_count}">'
        '<rect width="100%" height="100%" fill="#fff"/>'
        + "".join(elements)
        + "</svg></section>"
    )


def render(layout: Layout) -> str:
    """Return a complete, script-free HTML document for ``layout``."""
    page_width_pt = g.PDF_PAGE_W
    page_height_pt = g.PDF_PAGE_H
    title = _text(f"{layout.spec.exam_name} — OMR answer sheet")
    pages = "".join(_page_svg(layout, page) for page in layout.pages)
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{title}</title>
  <style>
    :root {{ color-scheme: light; }}
    * {{ box-sizing: border-box; }}
    html, body {{ margin: 0; min-height: 100%; background: #f4f4f5; }}
    body {{ display: grid; justify-items: center; gap: 16px; padding: 16px; font-family: Helvetica, Arial, sans-serif; }}
    .omr-page {{ width: min(100%, {page_width_pt:g}pt); aspect-ratio: {g.PAGE_W} / {g.PAGE_H}; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,.12); overflow: hidden; }}
    .omr-page svg {{ display: block; width: 100%; height: 100%; font-family: Helvetica, Arial, sans-serif; text-rendering: geometricPrecision; shape-rendering: geometricPrecision; }}
    @page {{ size: {page_width_pt:g}pt {page_height_pt:g}pt; margin: 0; }}
    @media print {{
      html, body {{ background: #fff; }}
      body {{ display: block; padding: 0; }}
      .omr-page {{ width: {page_width_pt:g}pt; height: {page_height_pt:g}pt; box-shadow: none; break-after: page; page-break-after: always; }}
      .omr-page:last-child {{ break-after: auto; page-break-after: auto; }}
    }}
  </style>
</head>
<body>{pages}</body>
</html>"""


def write(layout: Layout, html_path: str | Path) -> Path:
    html_path = Path(html_path)
    html_path.parent.mkdir(parents=True, exist_ok=True)
    html_path.write_text(render(layout), encoding="utf-8")
    return html_path


def generate(exam_spec: ExamSpec, out_dir: str | Path) -> dict:
    """Plan and render HTML only; no ReportLab work occurs on this path."""
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    layout = plan(exam_spec)
    html_path = write(layout, out_dir / f"{exam_spec.paper_id}_v{exam_spec.version}.html")
    return {
        "ok": True,
        "paper_id": exam_spec.paper_id,
        "version": exam_spec.version,
        "html": str(html_path),
        "page_count": layout.page_count,
        "question_count": len(exam_spec.questions),
        "fib_count": len(exam_spec.fib_questions),
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="omr.render_html", description="Render an OMR HTML preview.")
    parser.add_argument("--spec", required=True, help="path to the exam spec JSON")
    parser.add_argument("--out", required=True, help="output directory")
    args = parser.parse_args(argv)

    try:
        exam_spec = spec_mod.load(args.spec)
        summary = generate(exam_spec, args.out)
    except (spec_mod.SpecError, LayoutError) as exc:
        json.dump({"ok": False, "error": str(exc)}, sys.stdout)
        sys.stdout.write("\n")
        return 2

    json.dump(summary, sys.stdout, indent=2)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
