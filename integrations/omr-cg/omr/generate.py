"""Entry point: exam spec in, OMR sheet plus detection artifacts out.

Called from Node as a subprocess, per the architecture decision::

    execFile('python3', ['omr/generate.py', '--spec', specPath, '--out', outDir])

Prints a JSON summary to stdout and nothing else, so the caller can parse it
directly. Diagnostics go to stderr. Exit code is 0 on success, 2 on a bad spec,
1 on anything else.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from . import spec as spec_mod
from .layout import LayoutError, plan
from .render_pdf import render
from .template_emitter import write_all


def generate(exam_spec: spec_mod.ExamSpec, out_dir: str | Path) -> dict:
    """Lay out, render and emit. Returns the summary written to stdout."""
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    layout = plan(exam_spec)

    pdf_name = f"{exam_spec.paper_id}_v{exam_spec.version}.pdf"
    pdf_path = render(layout, out_dir / pdf_name)
    written = write_all(layout, out_dir, pdf_name)

    return {
        "ok": True,
        "paper_id": exam_spec.paper_id,
        "version": exam_spec.version,
        "pdf": str(pdf_path),
        "page_count": layout.page_count,
        "question_count": len(exam_spec.questions),
        "fib_count": len(exam_spec.fib_questions),
        "artifacts": [str(p) for p in written],
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="omr.generate",
        description="Generate an OMR answer sheet and its detection template.",
    )
    parser.add_argument("--spec", required=True, help="path to the exam spec JSON")
    parser.add_argument("--out", required=True, help="output directory")
    args = parser.parse_args(argv)

    try:
        exam_spec = spec_mod.load(args.spec)
    except spec_mod.SpecError as exc:
        json.dump({"ok": False, "error": str(exc)}, sys.stdout)
        sys.stdout.write("\n")
        return 2

    try:
        summary = generate(exam_spec, args.out)
    except LayoutError as exc:
        json.dump({"ok": False, "error": str(exc)}, sys.stdout)
        sys.stdout.write("\n")
        return 2

    json.dump(summary, sys.stdout, indent=2)
    sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
