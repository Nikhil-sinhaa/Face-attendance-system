"""Repository functions for the ``subject_students`` enrollment table."""
from typing import Any, Dict, List

from .client import get_supabase


def get_enrolled_students(subject_id: int) -> List[Dict[str, Any]]:
    """Return full student records for all students enrolled in ``subject_id``."""
    client = get_supabase()
    result = (
        client.table("subject_students")
        .select("*, students(*)")
        .eq("subject_id", subject_id)
        .execute()
    )
    enrolled = []
    for item in result.data or []:
        student = item.get("students")
        if student:
            enrolled.append(student)
    return enrolled


def get_subject_enrollment_records(subject_id: int) -> List[Dict[str, Any]]:
    """Return enrollment rows with student name/id for the subject roster."""
    client = get_supabase()
    result = (
        client.table("subject_students")
        .select("student_id, subject_id, students(student_id, name)")
        .eq("subject_id", subject_id)
        .execute()
    )
    return result.data or []


def get_student_subjects(student_id: int) -> List[Dict[str, Any]]:
    """Return enrollment rows with subject details for a student."""
    client = get_supabase()
    result = (
        client.table("subject_students")
        .select("*, subjects(*)")
        .eq("student_id", student_id)
        .execute()
    )
    return result.data or []


def is_student_enrolled(student_id: int, subject_id: int) -> bool:
    """Return True if the student is already enrolled in the subject."""
    client = get_supabase()
    result = (
        client.table("subject_students")
        .select("subject_id")
        .eq("student_id", student_id)
        .eq("subject_id", subject_id)
        .limit(1)
        .execute()
    )
    return bool(result.data)


def enroll_student(student_id: int, subject_id: int) -> Dict[str, Any]:
    """Enroll a student in a subject.

    Raises:
        ValueError: If the student is already enrolled.
    """
    if is_student_enrolled(student_id, subject_id):
        raise ValueError("Student is already enrolled in this subject.")
    client = get_supabase()
    payload = {"student_id": student_id, "subject_id": subject_id}
    result = client.table("subject_students").insert(payload).execute()
    return result.data[0] if result.data else payload


def unenroll_student(student_id: int, subject_id: int) -> bool:
    """Remove a student from a subject. Returns True if a row was deleted."""
    client = get_supabase()
    result = (
        client.table("subject_students")
        .delete()
        .eq("student_id", student_id)
        .eq("subject_id", subject_id)
        .execute()
    )
    return bool(result.data)
