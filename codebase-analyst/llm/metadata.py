"""Safe parsing for metadata serialized by the local vector store."""

import ast
import json
from typing import Any


def parse_metadata(value: Any) -> dict:
    """Return metadata dictionaries without executing serialized input."""
    if isinstance(value, dict):
        return value
    if not isinstance(value, str) or not value.strip():
        return {}

    try:
        parsed = json.loads(value)
    except (json.JSONDecodeError, TypeError):
        try:
            parsed = ast.literal_eval(value)
        except (ValueError, SyntaxError, TypeError):
            return {}
    return parsed if isinstance(parsed, dict) else {}
