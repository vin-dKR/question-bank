from __future__ import annotations

import base64
import io
import sys
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
# Both packages ship in the same function bundle, so the OMR HTTP helpers are
# reused rather than duplicated. See EDUENTSS_INTEGRATION.md §6.
for _pkg in ("bg-remover", "omr-cg"):
    _root = str(PROJECT_ROOT / "integrations" / _pkg)
    if _root not in sys.path:
        sys.path.insert(0, _root)

from PIL import Image  # noqa: E402

from bgremove import ImageError, clean_diagram, load_image  # noqa: E402
from omr.vercel_api import HttpError, read_json, require_token, write_json  # noqa: E402


class handler(BaseHTTPRequestHandler):
    """Whiten photographed paper so cropped diagrams stop looking tinted.

    Same shape as api/omr-detect.py: token check, JSON in, JSON out, and errors
    returned as a readable sentence rather than a traceback.
    """

    def do_POST(self):
        try:
            require_token(self)
            payload = read_json(self)

            image_b64 = payload.get("image_b64")
            if not isinstance(image_b64, str):
                raise HttpError(HTTPStatus.BAD_REQUEST, "image_b64 is required")

            try:
                raw = base64.b64decode(image_b64, validate=True)
            except Exception:
                raise HttpError(HTTPStatus.BAD_REQUEST, "image_b64 is not valid base64")

            try:
                strength = float(payload.get("strength", 1.0))
            except (TypeError, ValueError):
                raise HttpError(HTTPStatus.BAD_REQUEST, "strength must be a number")

            image = load_image(raw)
            cleaned = clean_diagram(
                image,
                remove_bg=bool(payload.get("remove_bg", True)),
                whiten=bool(payload.get("whiten", True)),
                enhance=bool(payload.get("enhance", True)),
                strength=strength,
            )

            buf = io.BytesIO()
            Image.fromarray(cleaned).save(buf, format="PNG", compress_level=6)

            body = {
                "ok": True,
                "image_b64": base64.b64encode(buf.getvalue()).decode("ascii"),
                "width": image.width,
                "height": image.height,
            }

            # What the touch-up brush restores from: same tone pipeline, with
            # separation skipped, so a restored patch lands on white paper
            # instead of pasting the original paper cast back in.
            if payload.get("with_restore"):
                restore = clean_diagram(
                    image,
                    remove_bg=False,
                    whiten=bool(payload.get("whiten", True)),
                    enhance=bool(payload.get("enhance", True)),
                    strength=strength,
                )
                rbuf = io.BytesIO()
                Image.fromarray(restore).save(rbuf, format="PNG", compress_level=6)
                body["restore_b64"] = base64.b64encode(rbuf.getvalue()).decode("ascii")

            write_json(self, HTTPStatus.OK, body)
        except HttpError as exc:
            write_json(self, exc.status, {"ok": False, "error": exc.message})
        except ImageError as exc:
            # load_image's messages are written to be shown to a user.
            write_json(self, HTTPStatus.BAD_REQUEST, {"ok": False, "error": str(exc)})
        except Exception as exc:  # noqa: BLE001
            write_json(
                self,
                HTTPStatus.INTERNAL_SERVER_ERROR,
                {"ok": False, "error": f"Cleaning failed: {exc}"},
            )

    def do_OPTIONS(self):
        write_json(self, HTTPStatus.OK, {"ok": True})
