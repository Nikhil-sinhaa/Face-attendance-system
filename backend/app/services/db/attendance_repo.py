"""Repository functions for the ``attendance_logs`` table."""
from typing import Any, Dict, List

from .client import get_supabase


def create_attendance_logs(logs: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Bulk-insert attendance log rows and return the inserted records."""
    if not logs:
        return []
    client = get_supabase()
    result = client.table("attendance_logs").insert(logs).execute()
    return result.data or []


def get_teacher_attendance_records(teacher_id: int) -> List[Dict[str, Any]]:
    """Return all attendance logs for subjects owned by ``teacher_id``."""
    client = get_supabase()
    result = (
        client.table("attendance_logs")
        .select(
            "id, timestamp, subject_id, student_id, is_present, "
            "subjects!inner(*), students(*)"
        )
        .eq("subjects.teacher_id", teacher_id)
        .order("timestamp", desc=True)
        .execute()
    )
    return result.data or []


def get_student_attendance_records(student_id: int) -> List[Dict[str, Any]]:
    """Return all attendance logs for ``student_id``."""
    client = get_supabase()
    result = (
        client.table("attendance_logs")
        .select("id, timestamp, subject_id, student_id, is_present, subjects(*)")
        .eq("student_id", student_id)
        .order("timestamp", desc=True)
        .execute()
    )
    return result.data or []


def get_subject_attendance_logs(subject_id: int) -> List[Dict[str, Any]]:
    """Return all attendance logs for ``subject_id``."""
    client = get_supabase()
    result = (
        client.table("attendance_logs")
        .select("id, timestamp, subject_id, student_id, is_present")
        .eq("subject_id", subject_id)
        .order("timestamp", desc=True)
        .execute()
    )
    return result.data or []
