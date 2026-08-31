# OMR sheet generator

Turns an exam spec into a printable OMR answer sheet plus everything the checker
needs to read it back.

## Use

The visual way — compose an exam and watch the sheet regenerate as you type:

    python tools/studio.py

Opens on <http://127.0.0.1:8765>. Edit the exam, add runs of questions, toggle
the detection overlay, save the paper, download the PDF. Sheet *geometry* is
deliberately not editable there — see `tools/studio.py` for why.

Build a spec by answering prompts:

    python -m omr.new_exam --out papers/mid_term.json

Or write the JSON directly (see **Spec format** below). Then generate:

    python -m omr.generate --spec papers/mid_term.json --out out/MID-2026

From Node, per the architecture decision — files in, JSON out, no HTTP layer:

```js
execFile('python3', ['-m', 'omr.generate', '--spec', specPath, '--out', outDir],
  (err, stdout) => {
    const result = JSON.parse(stdout);   // { ok, pdf, page_count, artifacts, ... }
  });
```

Exit codes: `0` success, `2` bad spec or unlayoutable paper (the JSON carries a
teacher-readable `error`), `1` anything else.

## Output

    out/MID-2026/
      MID-2026_v1.pdf          the sheet to print
      layout.json              manifest: question types, pages, dimensions
      fib_regions.json         FIB crop rectangles, in template space
      page_1/
        template.json          OMRChecker template for this page
        config.json            processing resolution override
        omr_marker.jpg         fiducial bitmap (CropOnMarkers resolves it here)
      page_2/ ...

`layout.json` is what goes in the `omr_layout` table. It carries each question's
type, which is the only thing that lets scoring distinguish a legitimately
multi-marked MSQ from an illegally double-marked MCQ — detection reports both as
the same concatenated string.

## Spec format

```json
{
  "paper_id": "MID-2026",
  "exam_name": "Mid Term Examination",
  "subject": "Physics",
  "exam_date": "2026-08-14",
  "duration_min": 90,
  "max_marks": 50,
  "roll_digits": 6,
  "version": 1,
  "instructions": ["...", "..."],
  "questions": [
    {"no": 1, "type": "MCQ", "options": 4},
    {"no": 2, "type": "MSQ", "options": 5},
    {"no": 3, "type": "TRUEFALSE"},
    {"no": 4, "type": "FIB"}
  ]
}
```

`paper_id` and `exam_name` are required; everything else has a default.
`options` applies to MCQ and MSQ only (2–8). TRUEFALSE is always 2 bubbles, FIB
has none. `roll_digits` is 1–10. At most 6 instruction lines fit.

Bump `version` whenever the layout changes for a paper, so an old scan is always
read back with the geometry it was printed with.

## Modules

| File | Owns |
|---|---|
| `geometry.py` | **every coordinate.** Nothing else may hardcode one |
| `layout.py` | pagination — where question *n* goes |
| `spec.py` | the input contract and its validation |
| `render_pdf.py` | appearance only: fonts, line weights, labels |
| `template_emitter.py` | template.json, config.json, fib_regions.json, layout.json |
| `marker.py` | the corner fiducial design |
| `vendor_constants.py` | re-exports from vendored OMRChecker, never copies |

The split exists so the PDF and the detection template cannot disagree: both
derive from `geometry.py`, so a coordinate change moves the ink and the sample
region together.

## Verifying

    python -m pytest tests/ -v

The important one is `test_every_template_coordinate_lands_in_a_printed_circle`.
Keep it in CI. To see a failure rather than read about it:

    python tools/overlay.py out/MID-2026 --boxes

Red crosses are template coordinates plotted back onto the rendered page; each
must sit dead centre in a printed circle.

## Printing

100% scale, no "fit to page". A 4% shrink moves every bubble off its sample
region. The sheet prints a 100mm reference line for exactly this reason — if it
does not measure 100mm, the sheet is unusable.
