"""Turn an :class:`~omr.spec.ExamSpec` into positioned pages.

This module owns pagination and nothing else. It answers "where does question 37
go", and both the PDF renderer and the template emitter consume its output, so
neither of them computes a position independently.

Every coordinate here is page space (see :mod:`omr.geometry`).
"""

from __future__ import annotations

from dataclasses import dataclass, field

from . import geometry as g
from .spec import ExamSpec, Question


@dataclass
class LaidOutPage:
    number: int
    rows: list[g.BubbleRow] = field(default_factory=list)
    fib_boxes: list[g.FibBox] = field(default_factory=list)
    roll_grid: g.RollGrid | None = None

    @property
    def is_first(self) -> bool:
        return self.number == 1


@dataclass
class Layout:
    spec: ExamSpec
    pages: list[LaidOutPage]

    @property
    def page_count(self) -> int:
        return len(self.pages)

    def all_rows(self) -> list[tuple[int, g.BubbleRow]]:
        return [(p.number, r) for p in self.pages for r in p.rows]

    def all_fib_boxes(self) -> list[tuple[int, g.FibBox]]:
        return [(p.number, b) for p in self.pages for b in p.fib_boxes]


class LayoutError(RuntimeError):
    """The spec cannot be laid out on this sheet design."""


def _roll_grid_origin(spec: ExamSpec) -> tuple[float, float]:
    """Centre of the roll grid's first bubble (column 0, digit 0)."""
    return g.CONTENT_L, g.ROLL_Y + g.ROLL_LABEL_H


def _column_capacity() -> float:
    """Height of the tightest column, i.e. page 1's."""
    return g.BODY_BOTTOM - g.BODY_TOP_FIRST


def plan(spec: ExamSpec) -> Layout:
    """Lay every question out, flowing down columns then across pages.

    Page 1 carries the roll grid and instructions, so its body starts lower --
    handled by giving page 1 the same body box as every other page and simply
    letting the header furniture occupy the space above ``BODY_TOP``. Later pages
    reuse that box, which keeps one body geometry for all pages instead of two.
    """
    _validate_fits(spec)

    pages: list[LaidOutPage] = []
    page = LaidOutPage(number=1)
    page.roll_grid = g.RollGrid(
        columns=spec.roll_digits,
        origin_x=_roll_grid_origin(spec)[0],
        origin_y=_roll_grid_origin(spec)[1],
    )

    col = 0
    cursor = g.body_top(page.number)

    for question in spec.questions:
        needed = g.question_height(question.type)

        if cursor + needed > g.BODY_BOTTOM:
            # Never split a block: move to the next column, then the next page.
            col += 1
            if col >= g.BODY_COLUMNS:
                pages.append(page)
                page = LaidOutPage(number=len(pages) + 1)
                col = 0
            cursor = g.body_top(page.number)

        left = g.column_x(col)
        _place(page, question, left, cursor)
        cursor += needed

    pages.append(page)
    return Layout(spec=spec, pages=pages)


def _place(page: LaidOutPage, question: Question, left: float, top: float) -> None:
    if question.is_bubbled:
        page.rows.append(
            g.BubbleRow(
                question_no=question.no,
                qtype=question.type,
                values=question.labels,
                # ``top`` is the top of the slot; bubbles are centred in it.
                origin_x=left + g.QNO_LABEL_W + g.BUBBLE_D / 2,
                origin_y=top + g.ROW_PITCH / 2,
            )
        )
    else:
        page.fib_boxes.append(
            g.FibBox(
                question_no=question.no,
                x=left + g.QNO_LABEL_W,
                y=top,
                w=g.FIB_BOX_W,
                h=g.FIB_BOX_H,
            )
        )


def _validate_fits(spec: ExamSpec) -> None:
    """Fail loudly at generation time rather than printing a broken sheet."""
    widest = max(
        (len(q.labels) for q in spec.bubbled_questions),
        default=0,
    )
    if widest:
        needed = g.QNO_LABEL_W + g.row_width(widest)
        if needed > g.COLUMN_W:
            raise LayoutError(
                f"a {widest}-option question needs {needed:.0f}px but a body column "
                f"is only {g.COLUMN_W:.0f}px wide"
            )

    # The instructions column sits beside the roll grid, so the grid's right edge
    # is the binding constraint, not the page width.
    roll_w = g.RollGrid(spec.roll_digits, 0, 0).width
    roll_right = g.CONTENT_L + roll_w
    if roll_right > g.INSTRUCTIONS_X - 20:
        raise LayoutError(
            f"roll grid of {spec.roll_digits} digits ends at x={roll_right:.0f} and "
            f"would collide with the instructions column at x={g.INSTRUCTIONS_X}"
        )

    tallest = max(g.question_height(q.type) for q in spec.questions)
    if tallest > _column_capacity():
        raise LayoutError(
            f"a single question needs {tallest:.0f}px of height but a body column "
            f"only offers {_column_capacity():.0f}px"
        )
