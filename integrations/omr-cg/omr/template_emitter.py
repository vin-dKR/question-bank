"""Emit OMRChecker template.json (and our parallel FIB file) from a layout.

Never hand-edit the output of this module. If a coordinate is wrong, it is wrong
in :mod:`omr.geometry` or :mod:`omr.layout`, and fixing it there fixes the PDF at
the same time -- which is the entire point of the arrangement.

Schema facts taken from the vendored source, not from the wiki:

* The root key is ``pageDimensions``. The vendored revision predates the
  ``templateDimensions`` rename, and ``additionalProperties`` is ``False``, so
  emitting the newer name fails validation outright.
* ``origin`` is the **top-left corner of a bubble's sample box**, not the bubble
  centre (``core.py``: ``rect = [y, y+box_h, x, x+box_w]``).
* For ``direction: horizontal`` bubbles step along x by ``bubblesGap`` and
  successive field labels step along y by ``labelsGap``. For ``vertical`` the two
  axes swap.
* A field whose row has several filled bubbles comes back as the concatenation of
  their values (``core.py``: ``omr_response[label] + field_value``), which is how
  MSQ is represented -- see :func:`field_block_for_row`.
"""

from __future__ import annotations

import json
from pathlib import Path

from . import geometry as g
from .layout import Layout, LaidOutPage
from .marker import write_marker

#: Raised from the vendored default of 666x820, which is far below our 1120px
#: template width and would throw away bubble detail before the template is even
#: applied.
PROCESSING_WIDTH = 1240
PROCESSING_HEIGHT = 1754


def _origin(centre_x: float, centre_y: float) -> list[int]:
    """Bubble centre in page space -> template-space top-left of its sample box."""
    tx, ty = g.page_to_template(centre_x - g.BUBBLE_D / 2, centre_y - g.BUBBLE_D / 2)
    return [tx, ty]


def field_block_for_row(row: g.BubbleRow) -> tuple[str, dict]:
    """One field block per question row.

    MCQ, MSQ and TRUEFALSE all emit the same shape. The difference between "one
    bubble expected" and "zero to N expected" is not something the template can
    express and does not need to be: detection returns whichever bubbles are
    filled, and Node decides whether that is a valid answer for the question's
    type. Encoding the distinction here would put scoring policy in the geometry
    layer, where it does not belong.
    """
    name = f"q{row.question_no}"
    block = {
        "origin": _origin(row.origin_x, row.origin_y),
        "bubbleValues": list(row.values),
        "direction": "horizontal",
        "fieldLabels": [name],
        "bubblesGap": g.BUBBLE_PITCH,
        "labelsGap": g.ROW_PITCH,
    }
    return f"{name}_block", block


def field_block_for_roll(grid: g.RollGrid) -> tuple[str, dict]:
    """The roll-number grid as a single vertical field block.

    ``QTYPE_INT`` supplies bubbleValues 0-9 and ``direction: vertical``. Vertical
    means bubbles step down by ``bubblesGap`` and each successive field label --
    each digit column -- steps right by ``labelsGap``.
    """
    block = {
        "origin": _origin(grid.origin_x, grid.origin_y),
        "fieldType": "QTYPE_INT",
        "fieldLabels": [f"roll1..{grid.columns}"],
        "bubblesGap": g.ROW_PITCH,
        "labelsGap": g.BUBBLE_PITCH,
    }
    return "Roll", block


def build_template(page: LaidOutPage) -> dict:
    """The full template.json document for one page."""
    field_blocks: dict[str, dict] = {}

    if page.roll_grid is not None:
        name, block = field_block_for_roll(page.roll_grid)
        field_blocks[name] = block

    for row in page.rows:
        name, block = field_block_for_row(row)
        field_blocks[name] = block

    return {
        "pageDimensions": [g.TEMPLATE_W, g.TEMPLATE_H],
        "bubbleDimensions": list(g.BUBBLE_BOX),
        "fieldBlocks": field_blocks,
        "preProcessors": [
            {
                "name": "CropOnMarkers",
                "options": {
                    "relativePath": "omr_marker.jpg",
                    "sheetToMarkerWidthRatio": g.SHEET_TO_MARKER_WIDTH_RATIO,
                },
            }
        ],
        "emptyValue": "",
    }


def build_config() -> dict:
    """Per-template OMRChecker config.

    The only thing we override is the processing resolution. The vendored default
    downsamples a phone photo to 666px wide before any cropping happens, which
    leaves a 27px bubble about 14px across and throws away the signal we need.
    """
    return {
        "dimensions": {
            "processing_width": PROCESSING_WIDTH,
            "processing_height": PROCESSING_HEIGHT,
        },
        "outputs": {
            "show_image_level": 0,
            "save_image_level": 0,
        },
    }


def build_fib_regions(layout: Layout) -> dict:
    """FIB rectangles, in our own file.

    These cannot live in template.json: ``fieldBlocks`` models regular bubble
    grids only, and the template root sets ``additionalProperties: False`` so
    there is nowhere to put them. The checker crops these rectangles out of the
    aligned image and hands them to a teacher for manual grading.

    Coordinates are template space, so they can be applied directly to the warped
    image OMRChecker produces.
    """
    regions = []
    for page_no, box in layout.all_fib_boxes():
        x, y = g.page_to_template(box.x, box.y)
        regions.append(
            {
                "question_no": box.question_no,
                "page": page_no,
                "x": x,
                "y": y,
                "w": round(box.w),
                "h": round(box.h),
            }
        )
    return {
        "paper_id": layout.spec.paper_id,
        "version": layout.spec.version,
        "template_dimensions": [g.TEMPLATE_W, g.TEMPLATE_H],
        "regions": regions,
    }


def build_layout_manifest(layout: Layout, pdf_name: str) -> dict:
    """What Node stores in ``omr_layout`` and what the checker reads back.

    Carries the question types so scoring can tell a legitimately multi-marked
    MSQ from an illegally double-marked MCQ -- OMRChecker reports both
    identically, as a concatenated string.
    """
    spec = layout.spec
    return {
        "paper_id": spec.paper_id,
        "version": spec.version,
        "exam_name": spec.exam_name,
        "subject": spec.subject,
        "pdf": pdf_name,
        "page_count": layout.page_count,
        "template_dimensions": [g.TEMPLATE_W, g.TEMPLATE_H],
        "page_dimensions_px": [g.PAGE_W, g.PAGE_H],
        "dpi": g.DPI,
        "reference_line_mm": g.REF_LINE_MM,
        "roll_digits": spec.roll_digits,
        "questions": [
            {
                "no": q.no,
                "type": q.type,
                "options": q.options,
                "labels": list(q.labels),
                "field": f"q{q.no}" if q.is_bubbled else None,
            }
            for q in spec.questions
        ],
        "pages": [
            {
                "page": p.number,
                "template": f"page_{p.number}/template.json",
                "questions": [r.question_no for r in p.rows]
                + [b.question_no for b in p.fib_boxes],
            }
            for p in layout.pages
        ],
    }


def write_all(layout: Layout, out_dir: str | Path, pdf_name: str) -> list[Path]:
    """Write every detection artifact. Returns the paths written."""
    out_dir = Path(out_dir)
    written: list[Path] = []

    for page in layout.pages:
        page_dir = out_dir / f"page_{page.number}"
        page_dir.mkdir(parents=True, exist_ok=True)

        template_path = page_dir / "template.json"
        template_path.write_text(
            json.dumps(build_template(page), indent=2), encoding="utf-8"
        )
        written.append(template_path)

        config_path = page_dir / "config.json"
        config_path.write_text(json.dumps(build_config(), indent=2), encoding="utf-8")
        written.append(config_path)

        # CropOnMarkers resolves relativePath against the template's own
        # directory, so every page directory needs its own copy.
        written.append(write_marker(page_dir / "omr_marker.jpg"))

    fib_path = out_dir / "fib_regions.json"
    fib_path.write_text(
        json.dumps(build_fib_regions(layout), indent=2), encoding="utf-8"
    )
    written.append(fib_path)

    manifest_path = out_dir / "layout.json"
    manifest_path.write_text(
        json.dumps(build_layout_manifest(layout, pdf_name), indent=2), encoding="utf-8"
    )
    written.append(manifest_path)

    return written
