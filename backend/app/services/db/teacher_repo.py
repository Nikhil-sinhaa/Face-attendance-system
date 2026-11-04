"""Repository functions for the ``teachers`` table."""
from typing import Any, Dict, Optional

from .client import get_supabase


def get_teacher_by_username(username: str) -> Optional[Dict[str, Any]]:
    """Return the teacher record matching ``username``, or None if not found."""
    client = get_supabase()
    result = (
        client.table("teachers")
        .select("teacher_id, username, password, name")
        .eq("username", username.strip())
        .limit(1)
        .execute()
    )
    return result.data[0] if result.data else None


def get_teacher_by_id(teacher_id: int) -> Optional[Dict[str, Any]]:
    """Return the teacher record for ``teacher_id``, or None if not found."""
    client = get_supabase()
    result = (
        client.table("teachers")
        .select("teacher_id, username, name")
        .eq("teacher_id", teacher_id)
        .limit(1)
        .execute()
    )
    return result.data[0] if result.data else None


def create_teacher(username: str, password_hash: str, name: str) -> Dict[str, Any]:
    """Insert a new teacher record and return it.

    Raises:
        RuntimeError: If the database insert returns no data.
    """
    client = get_supabase()
    payload = {
        "username": username.strip(),
        "password": password_hash,
        "name": name.strip(),
    }
    result = client.table("teachers").insert(payload).execute()
    if not result.data:
        raise RuntimeError("Failed to create teacher account.")
    return result.data[0]
