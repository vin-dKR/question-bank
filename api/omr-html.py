from __future__ import annotations

import json
import sys
import tempfile
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
OMR_ROOT = PROJECT_ROOT / "integrations" / "omr-cg"
if str(OMR_ROOT) not in sys.path:
    sys.path.insert(0, str(OMR_ROOT))

from omr import spec as spec_mod  # noqa: E402
from omr.layout import LayoutError  # noqa: E402
from omr.render_html import generate  # noqa: E402
from omr.vercel_api import HttpError, encode_files, read_json, require_token, write_json  # noqa: E402


class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            require_token(self)
            payload = read_json(self)
            spec = payload.get("spec")
            if not isinstance(spec, dict):
                raise HttpError(HTTPStatus.BAD_REQUEST, "spec must be an object")

            work_dir = Path(tempfile.mkdtemp(prefix="question-bank-omr-html-"))
            spec_path = work_dir / "spec.json"
            spec_path.write_text(json.dumps(spec), encoding="utf-8")

            summary = generate(spec_mod.load(spec_path), work_dir)
            write_json(
                self,
                HTTPStatus.OK,
                {
                    "ok": True,
                    "summary": summary,
                    "files": encode_files([Path(summary["html"])], work_dir),
                },
            )
        except HttpError as exc:
            write_json(self, exc.status, {"ok": False, "error": exc.message})
        except (spec_mod.SpecError, LayoutError) as exc:
            write_json(self, HTTPStatus.BAD_REQUEST, {"ok": False, "error": str(exc)})
        except Exception as exc:
            write_json(self, HTTPStatus.INTERNAL_SERVER_ERROR, {"ok": False, "error": str(exc)})

    def do_OPTIONS(self):
        write_json(self, HTTPStatus.OK, {"ok": True})
