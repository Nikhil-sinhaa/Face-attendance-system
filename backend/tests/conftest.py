"""Shared fixtures: an in-memory fake of the Supabase-backed repositories."""
import sys
from pathlib import Path

import numpy as np
import pytest
from fastapi.testclient import TestClient

REPO_ROOT = Path(__file__).resolve().parents[2]
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from backend.app.core import google_auth  # noqa: E402
from backend.app.core.config import settings  # noqa: E402
from backend.app.main import app  # noqa: E402
from backend.app.services import face_service  # noqa: E402
from backend.app.services.db import (  # noqa: E402
    enrollment_repo,
    student_repo,
    subject_repo,
    teacher_repo,
    attendance_repo,
)

DOMAIN = "iiitdwd.ac.in"


class FakeDB:
    def __init__(self):
        self.teachers = {}
        self.students = {}
        self.subjects = {}
        self.enrollments = {}  # (student_id, subject_id) -> status
        self._next = {"teacher": 1, "student": 1, "subject": 1}

    def next_id(self, kind):
        value = self._next[kind]
        self._next[kind] += 1
        return value

    def add_subject(self, teacher_id, code="CS101"):
        sid = self.next_id("subject")
        self.subjects[sid] = {
            "subject_id": sid,
            "subject_code": code,
            "name": f"Subject {code}",
            "section": "A",
            "teacher_id": teacher_id,
        }
        return self.subjects[sid]


def _install_fakes(monkeypatch, db: FakeDB):
    def public(row):
        return {k: v for k, v in row.items() if k != "password"}

    # ---- teachers
    monkeypatch.setattr(
        teacher_repo, "get_teacher_by_username",
        lambda u: next((t for t in db.teachers.values() if t["username"] == u.strip()), None),
    )
    monkeypatch.setattr(
        teacher_repo, "get_teacher_by_email",
        lambda e: next((public(t) for t in db.teachers.values() if t["email"] == e.strip().lower()), None),
    )
    monkeypatch.setattr(
        teacher_repo, "get_teacher_by_id",
        lambda i: public(db.teachers[i]) if i in db.teachers else None,
    )

    def create_teacher(username, password_hash, name, email):
        tid = db.next_id("teacher")
        db.teachers[tid] = {
            "teacher_id": tid, "username": username, "password": password_hash,
            "name": name, "email": email, "status": "pending",
        }
        return db.teachers[tid]

    monkeypatch.setattr(teacher_repo, "create_teacher", create_teacher)
    monkeypatch.setattr(
        teacher_repo, "list_teachers_by_status",
        lambda status=None: [public(t) for t in db.teachers.values() if status in (None, t["status"])],
    )

    def set_teacher_status(tid, status):
        if tid not in db.teachers:
            return None
        db.teachers[tid]["status"] = status
        return public(db.teachers[tid])

    monkeypatch.setattr(teacher_repo, "set_teacher_status", set_teacher_status)

    # ---- students
    monkeypatch.setattr(
        student_repo, "get_student_by_id", lambda i: db.students.get(i)
    )
    monkeypatch.setattr(
        student_repo, "get_student_by_email",
        lambda e: next((s for s in db.students.values() if s["email"] == e.strip().lower()), None),
    )
    monkeypatch.setattr(
        student_repo, "get_all_students",
        lambda: [s for s in db.students.values() if s["status"] != "rejected"],
    )

    def create_student(name, email, roll_no, face_embedding=None, voice_embedding=None):
        sid = db.next_id("student")
        db.students[sid] = {
            "student_id": sid, "name": name, "email": email, "roll_no": roll_no,
            "status": "pending", "face_embedding": face_embedding, "voice_embedding": voice_embedding,
        }
        return db.students[sid]

    monkeypatch.setattr(student_repo, "create_student", create_student)

    def approve_student_if_pending(sid):
        if db.students.get(sid, {}).get("status") == "pending":
            db.students[sid]["status"] = "approved"
            return True
        return False

    monkeypatch.setattr(student_repo, "approve_student_if_pending", approve_student_if_pending)

    # ---- subjects
    monkeypatch.setattr(
        subject_repo, "get_subject_by_code",
        lambda c: next((s for s in db.subjects.values() if s["subject_code"] == c.strip()), None),
    )
    monkeypatch.setattr(subject_repo, "get_subject_by_id", lambda i: db.subjects.get(i))
    monkeypatch.setattr(
        subject_repo, "get_teacher_subject_by_id",
        lambda i, t: db.subjects.get(i) if db.subjects.get(i, {}).get("teacher_id") == t else None,
    )
    monkeypatch.setattr(
        subject_repo, "get_subjects_by_teacher",
        lambda t: [s for s in db.subjects.values() if s["teacher_id"] == t],
    )

    # ---- enrollments
    monkeypatch.setattr(
        enrollment_repo, "get_enrollment_status", lambda st, su: db.enrollments.get((st, su))
    )

    def enroll_student(st, su, status="pending"):
        if (st, su) in db.enrollments:
            raise ValueError("exists")
        db.enrollments[(st, su)] = status
        return {"student_id": st, "subject_id": su, "status": status}

    monkeypatch.setattr(enrollment_repo, "enroll_student", enroll_student)

    def set_enrollment_status(st, su, status):
        if (st, su) not in db.enrollments:
            return False
        db.enrollments[(st, su)] = status
        return True

    monkeypatch.setattr(enrollment_repo, "set_enrollment_status", set_enrollment_status)
    monkeypatch.setattr(
        enrollment_repo, "get_enrolled_students",
        lambda su: [db.students[st] for (st, s), v in db.enrollments.items() if s == su and v == "approved"],
    )

    def pending_for_teacher(tid):
        rows = []
        for (st, su), status in db.enrollments.items():
            subject = db.subjects[su]
            if status == "pending" and subject["teacher_id"] == tid:
                rows.append({
                    "student_id": st, "subject_id": su, "status": status,
                    "requested_at": "2026-01-01T00:00:00Z",
                    "students": public(db.students[st]), "subjects": subject,
                })
        return rows

    monkeypatch.setattr(enrollment_repo, "get_pending_requests_for_teacher", pending_for_teacher)
    monkeypatch.setattr(
        enrollment_repo, "get_student_subjects",
        lambda st: [
            {"student_id": st, "subject_id": su, "status": v, "subjects": db.subjects[su]}
            for (s, su), v in db.enrollments.items() if s == st
        ],
    )
    monkeypatch.setattr(attendance_repo, "get_student_attendance_records", lambda st: [])


@pytest.fixture(autouse=True)
def db(monkeypatch, request):
    """Autouse so no test can ever reach the real Supabase database.

    Tests marked ``real_repos`` exercise the real repository code and must
    patch ``get_supabase`` themselves.
    """
    fake = FakeDB()
    if request.node.get_closest_marker("real_repos"):
        monkeypatch.setattr(
            "backend.app.services.db.client.get_supabase",
            lambda: (_ for _ in ()).throw(AssertionError("real Supabase must not be used in tests")),
        )
    else:
        _install_fakes(monkeypatch, fake)
    return fake


@pytest.fixture
def google(monkeypatch):
    """Configure Google auth; returns a setter for the claims the fake Google returns."""
    monkeypatch.setattr(settings, "GOOGLE_CLIENT_ID", "test-client-id")
    monkeypatch.setattr(settings, "ALLOWED_EMAIL_DOMAIN", DOMAIN)
    state = {}

    def fake_verify(token, request, audience, clock_skew_in_seconds=0):
        assert audience == "test-client-id"
        if token == "bad-token":
            raise ValueError("bad token")
        return dict(state[token])

    monkeypatch.setattr(google_auth.google_id_token, "verify_oauth2_token", fake_verify)

    def issue(token, email, name="Test User", hd=DOMAIN, email_verified=True):
        claims = {"email": email, "name": name, "email_verified": email_verified}
        if hd is not None:
            claims["hd"] = hd
        state[token] = claims
        return token

    return issue


@pytest.fixture
def admin(monkeypatch):
    monkeypatch.setattr(settings, "ADMIN_EMAIL", "admin@iiitdwd.ac.in")
    monkeypatch.setattr(settings, "ADMIN_PASSWORD", "s3cret-admin")


@pytest.fixture
def faces(monkeypatch):
    monkeypatch.setattr(face_service, "image_bytes_to_numpy", lambda b: None)
    monkeypatch.setattr(face_service, "extract_face_embeddings", lambda img: [np.zeros(128)])


@pytest.fixture
def client():
    return TestClient(app)


# ----------------------------------------------------------------- helpers
def admin_headers(client):
    res = client.post("/api/admin/login", json={"email": "admin@iiitdwd.ac.in", "password": "s3cret-admin"})
    assert res.status_code == 200, res.text
    return {"Authorization": f"Bearer {res.json()['access_token']}"}


def register_teacher(client, google, email="prof@iiitdwd.ac.in", username="prof", password="pass1234"):
    token = google(f"google-id-token-{username}", email)
    return client.post(
        "/api/auth/teacher/register",
        json={"username": username, "password": password, "name": "Prof X", "google_id_token": token},
    )


def login_teacher(client, username="prof", password="pass1234"):
    return client.post("/api/auth/teacher/login", json={"username": username, "password": password})


def approved_teacher_headers(client, google, db, **kwargs):
    register_teacher(client, google, **kwargs)
    tid = max(db.teachers)
    db.teachers[tid]["status"] = "approved"
    res = login_teacher(client, kwargs.get("username", "prof"), kwargs.get("password", "pass1234"))
    assert res.status_code == 200, res.text
    return tid, {"Authorization": f"Bearer {res.json()['access_token']}"}


def register_student(client, google, email="24bcs086@iiitdwd.ac.in", token_name="stu-tok"):
    token = google(token_name, email, name="Student One")
    return client.post(
        "/api/auth/student/register",
        data={"google_id_token": token, "name": "Student One"},
        files={"face_file": ("face.jpg", b"fake-image-bytes", "image/jpeg")},
    )
