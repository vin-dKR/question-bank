"""Re-export constants from the vendored OMRChecker.

Read from their source rather than copied, so a change on their side shows up as
a test failure instead of as two tables that quietly disagree. The vendored
package uses absolute ``src.*`` imports, so its root has to be on ``sys.path``.
"""

from __future__ import annotations

import sys
from pathlib import Path

VENDOR_ROOT = Path(__file__).resolve().parent / "vendor"

if str(VENDOR_ROOT) not in sys.path:
    sys.path.insert(0, str(VENDOR_ROOT))

from src.constants.common import FIELD_TYPES  # noqa: E402
from src.constants.image_processing import QUADRANT_DIVISION  # noqa: E402

__all__ = ["FIELD_TYPES", "QUADRANT_DIVISION", "VENDOR_ROOT"]
