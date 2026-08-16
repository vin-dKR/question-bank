from __future__ import annotations

import base64
import json
import os
from http import HTTPStatus
from http.server import BaseHTTPRequestHandler
from pathlib import Path
from typing import Any

TOKEN_HEADER = "x-omr-service-token"


class HttpError(Exception):
    def __init__(self, status: int, message: str):
        super().__init__(message)
        self.status = status
        self.message = message


def require_token(handler: BaseHTTPRequestHandler) -> None:
    expected = os.environ.get("OMR_SERVICE_TOKEN")
    if not expected:
        return

    provided = handler.headers.get(TOKEN_HEADER)
    if provided != expected:
        raise HttpError(HTTPStatus.UNAUTHORIZED, "Unauthorized")


def read_json(handler: BaseHTTPRequestHandler, max_bytes: int = 12 * 1024 * 1024) -> dict[str, Any]:
    try:
        length = int(handler.headers.get("content-length", "0"))
    except ValueError as exc:
        raise HttpError(HTTPStatus.BAD_REQUEST, "Invalid content-length") from exc

    if length <= 0:
        raise HttpError(HTTPStatus.BAD_REQUEST, "Request body is required")

    if length > max_bytes:
        raise HttpError(HTTPStatus.REQUEST_ENTITY_TOO_LARGE, "OMR request body is too large")

    try:
        payload = json.loads(handler.rfile.read(length).decode("utf-8"))
    except json.JSONDecodeError as exc:
        raise HttpError(HTTPStatus.BAD_REQUEST, "Invalid JSON body") from exc

    if not isinstance(payload, dict):
        raise HttpError(HTTPStatus.BAD_REQUEST, "JSON body must be an object")

    return payload


def write_json(handler: BaseHTTPRequestHandler, status: int, payload: dict[str, Any]) -> None:
    body = json.dumps(payload).encode("utf-8")
    handler.send_response(status)
    handler.send_header("content-type", "application/json")
    handler.send_header("content-length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


def safe_relative_path(raw_path: str) -> Path:
    relative = Path(raw_path)
    if relative.is_absolute() or ".." in relative.parts or not relative.parts:
        raise HttpError(HTTPStatus.BAD_REQUEST, f"Unsafe file path: {raw_path}")
    return relative


def write_remote_files(root: Path, files: list[dict[str, Any]]) -> None:
    for file in files:
        if not isinstance(file, dict) or not isinstance(file.get("path"), str):
            raise HttpError(HTTPStatus.BAD_REQUEST, "layout_files entries must include path")

        relative = safe_relative_path(file["path"])
        content_b64 = file.get("content_b64")
        if not isinstance(content_b64, str):
            raise HttpError(HTTPStatus.BAD_REQUEST, f"{file['path']} is missing content_b64")

        target = root / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(base64.b64decode(content_b64))


def encode_files(paths: list[Path], root: Path) -> list[dict[str, str]]:
    files: list[dict[str, str]] = []
    for file_path in paths:
        if not file_path.exists() or not file_path.is_file():
            continue

        relative = file_path.relative_to(root).as_posix()
        files.append(
            {
                "path": relative,
                "content_b64": base64.b64encode(file_path.read_bytes()).decode("ascii"),
            }
        )
    return files
