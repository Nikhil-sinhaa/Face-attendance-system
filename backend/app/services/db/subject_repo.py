"""Repository functions for the ``subjects`` table."""
from typing import Any, Dict, List, Optional

from .client import get_supabase


def get_subjects_by_teacher(teacher_id: int) -> List[Dict[str, Any]]:
    """Return all subjects owned by ``teacher_id`` with enriched counts."""
    client = get_supabase()
    result = (
        client.table("subjects")
        .select("*, subject_students(count), attendance_logs(timestamp)")
        .eq("teacher_id", teacher_id)
        .execute()
    )
    subjects = result.data or []

    for subject in subjects:
        subject["total_students"] = _extract_enrolled_count(subject)
        subject["total_classes"] = _count_unique_sessions(subject.get("attendance_logs", []))
        subject.pop("subject_students", None)
        subject.pop("attendance_logs", None)

    return subjects


def _extract_enrolled_count(subject: Dict[str, Any]) -> int:
    """Return the enrolled student count embedded in a subject record."""
    enrollment_data = subject.get("subject_students")
    if enrollment_data and len(enrollment_data) > 0:
        return enrollment_data[0].get("count", 0)
    return 0


def _count_unique_sessions(attendance_logs: List[Dict[str, Any]]) -> int:
    """Count distinct attendance sessions by truncating timestamps to the minute."""
    unique_sessions = set()
    for log in attendance_logs:
        timestamp = log.get("timestamp", "")
        if timestamp:
            # "2026-10-20T10:30:45.123Z" → "2026-10-20T10:30"
            unique_sessions.add(timestamp[:16])
    return len(unique_sessions)


def get_subject_by_code(code: str) -> Optional[Dict[str, Any]]:
    """Return the subject matching ``code``, or None if not found."""
    client = get_supabase()
    result = (
        client.table("subjects")
        .select("subject_id, subject_code, name, section, teacher_id")
        .eq("subject_code", code.strip())
        .limit(1)
        .execute()
    )
    return result.data[0] if result.data else None


def get_subject_by_id(subject_id: int) -> Optional[Dict[str, Any]]:
    """Return the subject with ``subject_id``, or None if not found."""
    client = get_supabase()
    result = (
        client.table("subjects")
        .select("subject_id, subject_code, name, section, teacher_id")
        .eq("subject_id", subject_id)
        .limit(1)
        .execute()
    )
    return result.data[0] if result.data else None


def get_teacher_subject_by_id(
    subject_id: int, teacher_id: int
) -> Optional[Dict[str, Any]]:
    """Return a subject only when it belongs to the requesting teacher."""
    client = get_supabase()
    result = (
        client.table("subjects")
        .select("subject_id, subject_code, name, section, teacher_id")
        .eq("subject_id", subject_id)
        .eq("teacher_id", teacher_id)
        .limit(1)
        .execute()
    )
    return result.data[0] if result.data else None


def create_subject(
    subject_code: str, name: str, section: str, teacher_id: int
) -> Dict[str, Any]:
    """Insert a new subject and return it.

    Raises:
        RuntimeError: If the database insert returns no data.
    """
    client = get_supabase()
    payload = {
        "subject_code": subject_code.strip(),
        "name": name.strip(),
        "section": section.strip(),
        "teacher_id": teacher_id,
    }
    result = client.table("subjects").insert(payload).execute()
    if not result.data:
        raise RuntimeError("Failed to create subject.")
    return result.data[0]


def delete_subject(subject_id: int, teacher_id: int) -> bool:
    """Delete a subject and all its associated attendance logs and enrollments.

    Returns True if the subject row was deleted, False otherwise.
    """
    client = get_supabase()
    client.table("attendance_logs").delete().eq("subject_id", subject_id).execute()
    client.table("subject_students").delete().eq("subject_id", subject_id).execute()
    result = (
        client.table("subjects")
        .delete()
        .eq("subject_id", subject_id)
        .eq("teacher_id", teacher_id)
        .execute()
    )
    return bool(result.data)
