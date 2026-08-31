"""Command-line entry point, mirroring `python -m omr.generate`.

lib/omr/service.ts runs Python two ways: locally it spawns the interpreter, and
when OMR_SERVICE_URL is set it POSTs the same arguments to the Vercel function.
This module is the local half for background cleaning.

Files are passed by path rather than base64 on stdout. The HTTP contract in
api/bg-clean.py has to base64 because it is JSON over the wire, but locally that
would mean holding three copies of a 1600px page in memory and pushing the whole
thing through a pipe for no reason.

    python -m bgremove.cli --in page.png --out cleaned.png [--strength 1.0]

Prints a single JSON object on stdout, matching what the HTTP handler returns so
the TypeScript side can parse either identically.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from PIL import Image

from .pipeline import clean_diagram
from .processor import ImageError, load_image


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="bgremove.cli")
    parser.add_argument("--in", dest="src", required=True, help="image to clean")
    parser.add_argument("--out", dest="dst", required=True, help="where to write the result")
    parser.add_argument(
        "--out-restore",
        dest="restore_dst",
        default=None,
        help=(
            "also write a copy with background removal skipped. This is what the "
            "touch-up brush restores from: levelled and sharpened like the main "
            "result, but with everything the separation stage would have dropped "
            "still present. Restoring from the raw upload instead pastes the "
            "original paper cast back in as a coloured patch."
        ),
    )
    parser.add_argument(
        "--strength",
        type=float,
        default=1.0,
        help="0 leaves the image alone, 1 applies the correction fully",
    )
    # Every stage is on by default; the flags exist so a stage can be dropped
    # without a code change when a particular scan does better without it.
    parser.add_argument("--no-remove-bg", dest="remove_bg", action="store_false")
    parser.add_argument("--no-whiten", dest="whiten", action="store_false")
    parser.add_argument("--no-enhance", dest="enhance", action="store_false")
    args = parser.parse_args(argv)

    try:
        data = Path(args.src).read_bytes()
    except OSError as exc:
        json.dump({"ok": False, "error": f"Could not read the image: {exc}"}, sys.stdout)
        return 1

    try:
        image = load_image(data)
        cleaned = clean_diagram(
            image,
            remove_bg=args.remove_bg,
            whiten=args.whiten,
            enhance=args.enhance,
            strength=args.strength,
        )
        # compress_level 6 rather than the default 9: a whitened page is mostly
        # flat white and compresses well anyway, and 9 costs noticeably more time
        # for a marginal size gain on an image that is about to be uploaded once.
        Image.fromarray(cleaned).save(args.dst, format="PNG", compress_level=6)

        if args.restore_dst:
            # Same tone pipeline, separation skipped. The image is already
            # decoded, so this costs one levelling pass rather than a reload.
            restore = clean_diagram(
                image,
                remove_bg=False,
                whiten=args.whiten,
                enhance=args.enhance,
                strength=args.strength,
            )
            Image.fromarray(restore).save(args.restore_dst, format="PNG", compress_level=6)
    except ImageError as exc:
        # Message is written to be safe to show a user.
        json.dump({"ok": False, "error": str(exc)}, sys.stdout)
        return 1
    except Exception as exc:  # noqa: BLE001 - surfaced as JSON, not a traceback
        json.dump({"ok": False, "error": f"Cleaning failed: {exc}"}, sys.stdout)
        return 1

    json.dump({"ok": True, "width": image.width, "height": image.height}, sys.stdout)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
