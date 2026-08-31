from __future__ import annotations

import base64
import sys
import tempfile
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
OMR_ROOT = PROJECT_ROOT / "integrations" / "omr-cg"
if str(OMR_ROOT) not in sys.path:
    sys.path.insert(0, str(OMR_ROOT))

from omr.detect import detect  # noqa: E402
from omr.vercel_api import HttpError, read_json, require_token, safe_relative_path, write_json, write_remote_files  # noqa: E402


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            require_token(self)
            payload = read_json(self)

            image_b64 = payload.get("image_b64")
            if not isinstance(image_b64, str):
                raise HttpError(HTTPStatus.BAD_REQUEST, "image_b64 is required")

            layout_files = payload.get("layout_files")
            if not isinstance(layout_files, list):
                raise HttpError(HTTPStatus.BAD_REQUEST, "layout_files must be an array")

            include_images = bool(payload.get("include_images"))
            page = payload.get("page")
            if page is not None:
                page = int(page)

            work_dir = Path(tempfile.mkdtemp(prefix="question-bank-omr-detect-"))
            layout_dir = work_dir / "layout"
            image_dir = work_dir / "scan"
            layout_dir.mkdir(parents=True, exist_ok=True)
            image_dir.mkdir(parents=True, exist_ok=True)

            write_remote_files(layout_dir, layout_files)

            filename = payload.get("filename") if isinstance(payload.get("filename"), str) else "scan.png"
            image_path = image_dir / safe_relative_path(Path(filename).name or "scan.png")
            image_path.write_bytes(base64.b64decode(image_b64))

            result = detect(image_path, layout_dir, page, include_images)
            write_json(self, HTTPStatus.OK, result.to_json(include_images))
        except HttpError as exc:
            write_json(self, exc.status, {"ok": False, "error": exc.message})
        except Exception as exc:
            write_json(self, HTTPStatus.INTERNAL_SERVER_ERROR, {"ok": False, "error": str(exc)})

    def do_OPTIONS(self):
        write_json(self, HTTPStatus.OK, {"ok": True})
