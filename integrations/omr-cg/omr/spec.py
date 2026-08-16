"""The exam spec: what a teacher describes, before any geometry exists.

This is the interface Node calls across. ``generate.py`` takes one of these as
JSON on disk and emits a PDF plus the detection artifacts. Keeping it a plain
document -- rather than CLI flags -- means the same file can be stored against
the paper, re-rendered later, and diffed when someone asks why last term's sheet
looked different.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from pathlib import Path

#: Question types and their sheet representation. Scoring lives in Node; this
#: table only says what gets printed.
QUESTION_TYPES = ("MCQ", "MSQ", "TRUEFALSE", "FIB")

DEFAULT_OPTIONS = 4
MIN_OPTIONS = 2
#: OMRChecker reports a field's value by concatenating every detected bubble's
#: value, so option labels must be single characters to stay unambiguous.
MAX_OPTIONS = 8

OPTION_LABELS = "ABCDEFGH"
TRUEFALSE_LABELS = ("T", "F")

MIN_ROLL_DIGITS = 1
#: Bounded by the instructions column, which sits beside the roll grid.
#: :func:`omr.layout._validate_fits` enforces the actual geometric limit.
MAX_ROLL_DIGITS = 10


class SpecError(ValueError):
    """The spec is malformed. Raised with a message meant for a teacher."""


@dataclass(frozen=True)
class Question:
    no: int
    type: str
    options: int = DEFAULT_OPTIONS

    @property
    def labels(self) -> tuple[str, ...]:
        """Bubble labels printed left to right. Empty for FIB, which has none."""
        if self.type == "TRUEFALSE":
            return TRUEFALSE_LABELS
        if self.type == "FIB":
            return ()
        return tuple(OPTION_LABELS[: self.options])

    @property
    def is_bubbled(self) -> bool:
        return self.type != "FIB"


@dataclass(frozen=True)
class ExamSpec:
    paper_id: str
    exam_name: str
    questions: tuple[Question, ...]
    subject: str = ""
    exam_date: str = ""
    duration_min: int | None = None
    max_marks: int | None = None
    roll_digits: int = 6
    instructions: tuple[str, ...] = ()
    #: Bumped whenever the layout changes for a paper, so an old scan is always
    #: read back with the geometry it was printed with.
    version: int = 1

    @property
    def bubbled_questions(self) -> tuple[Question, ...]:
        return tuple(q for q in self.questions if q.is_bubbled)

    @property
    def fib_questions(self) -> tuple[Question, ...]:
        return tuple(q for q in self.questions if not q.is_bubbled)

    def to_dict(self) -> dict:
        """Serialise back to a spec document.

        Must round-trip through :func:`from_dict`. In particular TRUEFALSE and
        FIB carry an implied option count that the parser *rejects* if written
        out explicitly, so those keys are omitted rather than emitted.
        """
        questions = []
        for q in self.questions:
            entry: dict = {"no": q.no, "type": q.type}
            if q.type in ("MCQ", "MSQ"):
                entry["options"] = q.options
            questions.append(entry)

        return {
            "paper_id": self.paper_id,
            "exam_name": self.exam_name,
            "subject": self.subject,
            "exam_date": self.exam_date,
            "duration_min": self.duration_min,
            "max_marks": self.max_marks,
            "roll_digits": self.roll_digits,
            "version": self.version,
            "instructions": list(self.instructions),
            "questions": questions,
        }


_PAPER_ID_RE = re.compile(r"^[A-Za-z0-9._-]{1,64}$")


def _require(condition: bool, message: str) -> None:
    if not condition:
        raise SpecError(message)


def parse_question(raw: object, index: int) -> Question:
    _require(isinstance(raw, dict), f"questions[{index}] must be an object")
    assert isinstance(raw, dict)

    unknown = set(raw) - {"no", "type", "options"}
    _require(not unknown, f"questions[{index}] has unknown keys: {sorted(unknown)}")

    no = raw.get("no", index + 1)
    _require(
        isinstance(no, int) and no > 0,
        f"questions[{index}].no must be a positive integer",
    )

    qtype = raw.get("type")
    _require(
        isinstance(qtype, str) and qtype.upper() in QUESTION_TYPES,
        f"questions[{index}].type must be one of {', '.join(QUESTION_TYPES)}",
    )
    assert isinstance(qtype, str)
    qtype = qtype.upper()

    if qtype == "TRUEFALSE":
        options = 2
    elif qtype == "FIB":
        options = 0
    else:
        options = raw.get("options", DEFAULT_OPTIONS)
        _require(
            isinstance(options, int) and MIN_OPTIONS <= options <= MAX_OPTIONS,
            f"questions[{index}].options must be between {MIN_OPTIONS} "
            f"and {MAX_OPTIONS} for {qtype}",
        )

    if "options" in raw and qtype in ("TRUEFALSE", "FIB"):
        raise SpecError(f"questions[{index}]: {qtype} does not take an options count")

    return Question(no=no, type=qtype, options=int(options))


def from_dict(raw: dict) -> ExamSpec:
    """Validate a spec document. Raises :class:`SpecError` with a usable message."""
    _require(isinstance(raw, dict), "spec must be a JSON object")

    paper_id = raw.get("paper_id")
    _require(
        isinstance(paper_id, str) and bool(_PAPER_ID_RE.match(paper_id)),
        "paper_id is required: letters, digits, dot, dash or underscore, max 64",
    )

    exam_name = raw.get("exam_name")
    _require(
        isinstance(exam_name, str) and exam_name.strip() != "",
        "exam_name is required",
    )

    raw_questions = raw.get("questions")
    _require(
        isinstance(raw_questions, list) and len(raw_questions) > 0,
        "questions must be a non-empty list",
    )
    assert isinstance(raw_questions, list)

    questions = tuple(parse_question(q, i) for i, q in enumerate(raw_questions))

    numbers = [q.no for q in questions]
    duplicates = sorted({n for n in numbers if numbers.count(n) > 1})
    _require(not duplicates, f"duplicate question numbers: {duplicates}")

    roll_digits = raw.get("roll_digits", 6)
    _require(
        isinstance(roll_digits, int) and MIN_ROLL_DIGITS <= roll_digits <= MAX_ROLL_DIGITS,
        f"roll_digits must be between {MIN_ROLL_DIGITS} and {MAX_ROLL_DIGITS}",
    )

    duration = raw.get("duration_min")
    _require(
        duration is None or (isinstance(duration, int) and duration > 0),
        "duration_min must be a positive integer if given",
    )

    marks = raw.get("max_marks")
    _require(
        marks is None or (isinstance(marks, (int, float)) and marks > 0),
        "max_marks must be a positive number if given",
    )

    version = raw.get("version", 1)
    _require(
        isinstance(version, int) and version > 0, "version must be a positive integer"
    )

    instructions = raw.get("instructions", [])
    _require(
        isinstance(instructions, list)
        and all(isinstance(line, str) for line in instructions),
        "instructions must be a list of strings",
    )
    # The instructions block sits directly above the first question row and its
    # height is reserved, not measured. More lines than fit would be drawn over
    # the first bubbles, putting stray ink inside a sample region.
    from .geometry import MAX_INSTRUCTION_LINES

    _require(
        len(instructions) <= MAX_INSTRUCTION_LINES,
        f"at most {MAX_INSTRUCTION_LINES} instruction lines fit on the sheet "
        f"({len(instructions)} given)",
    )

    return ExamSpec(
        paper_id=paper_id,
        exam_name=exam_name.strip(),
        subject=str(raw.get("subject", "") or "").strip(),
        exam_date=str(raw.get("exam_date", "") or "").strip(),
        duration_min=duration,
        max_marks=marks,
        roll_digits=roll_digits,
        instructions=tuple(instructions),
        version=version,
        questions=questions,
    )


def load(path: str | Path) -> ExamSpec:
    """Read and validate a spec file."""
    path = Path(path)
    try:
        raw = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise SpecError(f"{path} is not valid JSON: {exc}") from exc
    return from_dict(raw)


DEFAULT_INSTRUCTIONS = (
    "Use a blue or black ballpoint pen. Fill each bubble completely.",
    "Do not make any stray marks on this sheet.",
    "Erasing or overwriting a filled bubble may be read as an answer.",
    "PRINT AT 100% SCALE. Do not use 'fit to page' or 'shrink to fit'.",
)
