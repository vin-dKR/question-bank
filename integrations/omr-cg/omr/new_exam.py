"""Interactive builder for an exam spec.

A convenience for testing and for teachers working from a terminal. It only
*writes a spec file* -- generation is still :mod:`omr.generate`, so there is one
code path that produces sheets and the interactive route cannot drift from what
Node does.

    python -m omr.new_exam --out papers/mid_term.json
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from . import spec as spec_mod


def _ask(prompt: str, default: str = "", required: bool = False) -> str:
    suffix = f" [{default}]" if default else ""
    while True:
        answer = input(f"{prompt}{suffix}: ").strip() or default
        if answer or not required:
            return answer
        print("  This one is required.")


def _ask_int(prompt: str, default: int | None, low: int, high: int) -> int | None:
    suffix = f" [{default}]" if default is not None else " [skip]"
    while True:
        raw = input(f"{prompt}{suffix}: ").strip()
        if not raw:
            return default
        try:
            value = int(raw)
        except ValueError:
            print("  Enter a whole number.")
            continue
        if low <= value <= high:
            return value
        print(f"  Must be between {low} and {high}.")


def _ask_questions() -> list[dict]:
    """Collect questions as runs, because papers come in runs of a type.

    Typing '20 MCQ 4' beats answering twenty near-identical prompts.
    """
    print()
    print("Now the questions. Enter one run at a time, as: COUNT TYPE [OPTIONS]")
    print("  e.g.  20 MCQ 4      twenty 4-option multiple choice")
    print("        5 MSQ 5       five 5-option multi-select")
    print("        4 TRUEFALSE   four true/false")
    print("        3 FIB         three fill-in-the-blank (no bubbles)")
    print("Blank line when done.")
    print()

    questions: list[dict] = []
    while True:
        raw = input(f"  run (next question is {len(questions) + 1}): ").strip()
        if not raw:
            if questions:
                return questions
            print("    Add at least one question.")
            continue

        parts = raw.split()
        try:
            count = int(parts[0])
        except (ValueError, IndexError):
            print("    Start with a count, e.g. '20 MCQ 4'.")
            continue
        if count < 1:
            print("    Count must be at least 1.")
            continue

        if len(parts) < 2:
            print("    Say which type, e.g. '20 MCQ 4'.")
            continue
        qtype = parts[1].upper()
        if qtype not in spec_mod.QUESTION_TYPES:
            print(f"    Type must be one of {', '.join(spec_mod.QUESTION_TYPES)}.")
            continue

        entry: dict = {"type": qtype}
        if qtype in ("MCQ", "MSQ"):
            options = spec_mod.DEFAULT_OPTIONS
            if len(parts) >= 3:
                try:
                    options = int(parts[2])
                except ValueError:
                    print("    Option count must be a number.")
                    continue
            if not spec_mod.MIN_OPTIONS <= options <= spec_mod.MAX_OPTIONS:
                print(
                    f"    Options must be {spec_mod.MIN_OPTIONS}"
                    f"-{spec_mod.MAX_OPTIONS}."
                )
                continue
            entry["options"] = options
        elif len(parts) >= 3:
            print(f"    {qtype} does not take an option count.")
            continue

        for _ in range(count):
            questions.append({"no": len(questions) + 1, **entry})

        summary = ", ".join(
            f"{q['type']}{q.get('options', '')}" for q in questions[-min(count, 3):]
        )
        print(f"    added {count} x {qtype} (now {len(questions)} total: ...{summary})")


def build_spec_interactively() -> dict:
    print("New OMR answer sheet")
    print("-" * 60)

    paper_id = _ask("Paper ID (letters, digits, - . _)", required=True)
    exam_name = _ask("Exam name", required=True)
    subject = _ask("Subject")
    exam_date = _ask("Date (free text, e.g. 2026-08-14)")
    duration = _ask_int("Duration in minutes", None, 1, 24 * 60)
    marks = _ask_int("Maximum marks", None, 1, 10_000)
    roll_digits = _ask_int(
        "Roll number digits",
        6,
        spec_mod.MIN_ROLL_DIGITS,
        spec_mod.MAX_ROLL_DIGITS,
    )

    questions = _ask_questions()

    return {
        "paper_id": paper_id,
        "exam_name": exam_name,
        "subject": subject,
        "exam_date": exam_date,
        "duration_min": duration,
        "max_marks": marks,
        "roll_digits": roll_digits,
        "version": 1,
        "instructions": list(spec_mod.DEFAULT_INSTRUCTIONS),
        "questions": questions,
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="omr.new_exam",
        description="Build an exam spec file by answering prompts.",
    )
    parser.add_argument("--out", required=True, help="where to write the spec JSON")
    args = parser.parse_args(argv)

    try:
        raw = build_spec_interactively()
    except (KeyboardInterrupt, EOFError):
        print("\nCancelled.", file=sys.stderr)
        return 1

    try:
        parsed = spec_mod.from_dict(raw)
    except spec_mod.SpecError as exc:
        print(f"\nThat spec is not valid: {exc}", file=sys.stderr)
        return 2

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(parsed.to_dict(), indent=2), encoding="utf-8")

    print()
    print(f"Wrote {out}")
    print(f"  {len(parsed.questions)} questions "
          f"({len(parsed.fib_questions)} of them FIB, graded by hand)")
    print()
    print("Generate the sheet with:")
    print(f"  python -m omr.generate --spec {out} --out out/{parsed.paper_id}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
