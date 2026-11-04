"""Repository functions for the ``students`` table."""
from typing import Any, Dict, List, Optional

from .client import get_supabase


def get_all_students() -> List[Dict[str, Any]]:
    """Return all student records."""
    client = get_supabase()
    result = client.table("students").select("*").execute()
    return result.data or []


def get_student_by_id(student_id: int) -> Optional[Dict[str, Any]]:
    """Return the student record for ``student_id``, or None if not found."""
    client = get_supabase()
    result = (
        client.table("students")
        .select("student_id, name, face_embedding, voice_embedding")
        .eq("student_id", student_id)
        .limit(1)
        .execute()
    )
    return result.data[0] if result.data else None


def create_student(
    student_id: int,
    name: str,
    face_embedding: Optional[List[float]] = None,
    voice_embedding: Optional[List[float]] = None,
) -> Dict[str, Any]:
    """Insert a new student record and return it.

    Raises:
        RuntimeError: If the database insert returns no data.
    """
    client = get_supabase()
    payload = {
        "student_id": student_id,
        "name": name.strip(),
        "face_embedding": face_embedding,
        "voice_embedding": voice_embedding,
    }
    result = client.table("students").insert(payload).execute()
    if not result.data:
        raise RuntimeError("Failed to register student profile.")
    return result.data[0]
