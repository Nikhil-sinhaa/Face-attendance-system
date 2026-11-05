"""Repository functions for the ``subject_students`` enrollment table.

Each enrollment has a ``status``: ``pending`` (waiting for the subject's
teacher), ``approved`` or ``rejected``. Only approved enrollments count as
"enrolled" for rosters and attendance.
"""
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from .client import get_supabase


def get_enrolled_students(subject_id: int) -> List[Dict[str, Any]]:
    """Return full student records for all students approved in ``subject_id``."""
    client = get_supabase()
    result = (
        client.table("subject_students")
        .select("*, students(*)")
        .eq("subject_id", subject_id)
        .eq("status", "approved")
        .execute()
    )
    enrolled = []
    for item in result.data or []:
        student = item.get("students")
        if student:
            enrolled.append(student)
    return enrolled


def get_subject_enrollment_records(subject_id: int) -> List[Dict[str, Any]]:
    """Return approved enrollment rows with student name/id for the subject roster."""
    client = get_supabase()
    result = (
        client.table("subject_students")
        .select("student_id, subject_id, students(student_id, name, roll_no)")
        .eq("subject_id", subject_id)
        .eq("status", "approved")
        .execute()
    )
    return result.data or []


def get_student_subjects(student_id: int) -> List[Dict[str, Any]]:
    """Return enrollment rows (any status) with subject details for a student."""
    client = get_supabase()
    result = (
        client.table("subject_students")
        .select("*, subjects(*)")
        .eq("student_id", student_id)
        .execute()
    )
    return result.data or []


def get_enrollment_status(student_id: int, subject_id: int) -> Optional[str]:
    """Return the enrollment status, or None if the student never requested it."""
    client = get_supabase()
    result = (
        client.table("subject_students")
        .select("status")
        .eq("student_id", student_id)
        .eq("subject_id", subject_id)
        .limit(1)
        .execute()
    )
    return result.data[0]["status"] if result.data else None


def is_student_enrolled(student_id: int, subject_id: int) -> bool:
    """Return True if the student is approved in the subject."""
    return get_enrollment_status(student_id, subject_id) == "approved"


def enroll_student(
    student_id: int, subject_id: int, status: str = "pending"
) -> Dict[str, Any]:
    """Create an enrollment row (``pending`` by default).

    Raises:
        ValueError: If an enrollment (any status) already exists.
    """
    if get_enrollment_status(student_id, subject_id) is not None:
        raise ValueError("Student has already requested or joined this subject.")
    client = get_supabase()
    payload = {"student_id": student_id, "subject_id": subject_id, "status": status}
    result = client.table("subject_students").insert(payload).execute()
    return result.data[0] if result.data else payload


def set_enrollment_status(student_id: int, subject_id: int, status: str) -> bool:
    """Update an enrollment's status. Returns True if a row changed."""
    if status not in ("pending", "approved", "rejected"):
        raise ValueError(f"Invalid status: {status}")
    client = get_supabase()
    update = {"status": status}
    if status == "pending":
        update["requested_at"] = datetime.now(timezone.utc).isoformat()
    result = (
        client.table("subject_students")
        .update(update)
        .eq("student_id", student_id)
        .eq("subject_id", subject_id)
        .execute()
    )
    return bool(result.data)


def get_pending_requests_for_teacher(teacher_id: int) -> List[Dict[str, Any]]:
    """Return pending join requests across all of a teacher's subjects."""
    client = get_supabase()
    result = (
        client.table("subject_students")
        .select(
            "student_id, subject_id, status, requested_at, "
            "students(student_id, name, roll_no, email, status), "
            "subjects!inner(subject_id, subject_code, name, section, teacher_id)"
        )
        .eq("status", "pending")
        .eq("subjects.teacher_id", teacher_id)
        .order("requested_at")
        .execute()
    )
    return result.data or []


def unenroll_student(student_id: int, subject_id: int) -> bool:
    """Remove a student from a subject (or cancel a request). True if a row was deleted."""
    client = get_supabase()
    result = (
        client.table("subject_students")
        .delete()
        .eq("student_id", student_id)
        .eq("subject_id", subject_id)
        .execute()
    )
    return bool(result.data)
