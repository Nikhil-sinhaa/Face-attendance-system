"""Shared utility functions for the FaceVPlus backend."""
from datetime import datetime
from typing import Optional


def format_iso_timestamp(timestamp: Optional[str]) -> Optional[str]:
    """Normalise an ISO-8601 timestamp string to a consistent format.

    Returns the timestamp as-is if it cannot be parsed.
    Returns None if the input is falsy.
    """
    if not timestamp:
        return None
    try:
        return datetime.fromisoformat(timestamp.replace("Z", "+00:00")).isoformat()
    except ValueError:
        return timestamp
