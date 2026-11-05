"""Repository functions for the ``teachers`` table."""
from typing import Any, Dict, List, Optional

from .client import get_supabase

TEACHER_STATUSES = ("pending", "approved", "rejected")


def get_teacher_by_username(username: str) -> Optional[Dict[str, Any]]:
    """Return the teacher record matching ``username``, or None if not found."""
    client = get_supabase()
    result = (
        client.table("teachers")
        .select("teacher_id, username, password, name, email, status")
        .eq("username", username.strip())
        .limit(1)
        .execute()
    )
    return result.data[0] if result.data else None


def get_teacher_by_email(email: str) -> Optional[Dict[str, Any]]:
    """Return the teacher record matching ``email`` (case-insensitive), or None."""
    client = get_supabase()
    result = (
        client.table("teachers")
        .select("teacher_id, username, name, email, status")
        .eq("email", email.strip().lower())
        .limit(1)
        .execute()
    )
    return result.data[0] if result.data else None


def get_teacher_by_id(teacher_id: int) -> Optional[Dict[str, Any]]:
    """Return the teacher record for ``teacher_id``, or None if not found."""
    client = get_supabase()
    result = (
        client.table("teachers")
        .select("teacher_id, username, name, email, status")
        .eq("teacher_id", teacher_id)
        .limit(1)
        .execute()
    )
    return result.data[0] if result.data else None


def create_teacher(
    username: str, password_hash: str, name: str, email: str
) -> Dict[str, Any]:
    """Insert a new teacher in the ``pending`` state and return it.

    Raises:
        RuntimeError: If the database insert returns no data.
    """
    client = get_supabase()
    payload = {
        "username": username.strip(),
        "password": password_hash,
        "name": name.strip(),
        "email": email.strip().lower(),
        "status": "pending",
    }
    result = client.table("teachers").insert(payload).execute()
    if not result.data:
        raise RuntimeError("Failed to create teacher account.")
    return result.data[0]


def list_teachers_by_status(status: Optional[str] = None) -> List[Dict[str, Any]]:
    """Return teachers (without password hashes), optionally filtered by ``status``."""
    client = get_supabase()
    query = client.table("teachers").select("teacher_id, username, name, email, status")
    if status:
        query = query.eq("status", status)
    result = query.order("teacher_id").execute()
    return result.data or []


def set_teacher_status(teacher_id: int, status: str) -> Optional[Dict[str, Any]]:
    """Set a teacher's verification status. Returns the updated row or None."""
    if status not in TEACHER_STATUSES:
        raise ValueError(f"Invalid status: {status}")
    client = get_supabase()
    result = (
        client.table("teachers")
        .update({"status": status})
        .eq("teacher_id", teacher_id)
        .execute()
    )
    return result.data[0] if result.data else None
