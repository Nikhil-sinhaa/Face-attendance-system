import pytest

from backend.app.core import google_auth
from backend.app.services.db import enrollment_repo, student_repo

from conftest import (
    admin_headers,
    approved_teacher_headers,
    login_teacher,
    register_student,
    register_teacher,
)


# ------------------------------------------------------------ Google token
class TestGoogleToken:
    def test_valid_college_account(self, google):
        token = google("t", "24bcs086@iiitdwd.ac.in", name="Asha")
        identity = google_auth.verify_college_google_token(token)
        assert identity == {"email": "24bcs086@iiitdwd.ac.in", "name": "Asha", "roll_no": "24bcs086"}

    @pytest.mark.parametrize(
        "email,hd,verified",
        [
            ("someone@gmail.com", None, True),                       # personal account
            ("someone@gmail.com", "iiitdwd.ac.in", True),            # forged hd, wrong email
            ("24bcs086@iiitdwd.ac.in", None, True),                  # no hd claim
            ("24bcs086@iiitdwd.ac.in", "other.edu", True),           # wrong hd
            ("24bcs086@iiitdwd.ac.in", "iiitdwd.ac.in", False),      # unverified email
            ("a@evil.iiitdwd.ac.in", "iiitdwd.ac.in", True),         # subdomain
            ("a@iiitdwd.ac.in.evil.com", "iiitdwd.ac.in", True),     # suffix trick
            ("@iiitdwd.ac.in", "iiitdwd.ac.in", True),               # empty local part
        ],
    )
    def test_rejected_accounts(self, google, email, hd, verified):
        token = google("t", email, hd=hd, email_verified=verified)
        with pytest.raises(Exception) as exc:
            google_auth.verify_college_google_token(token)
        assert exc.value.status_code == 403
        assert "iiitdwd.ac.in" in exc.value.detail

    def test_invalid_token_is_400(self, google):
        with pytest.raises(Exception) as exc:
            google_auth.verify_college_google_token("bad-token")
        assert exc.value.status_code == 400

    def test_unconfigured_client_id_is_503(self, monkeypatch):
        monkeypatch.setattr(google_auth.settings, "GOOGLE_CLIENT_ID", "")
        with pytest.raises(Exception) as exc:
            google_auth.verify_college_google_token("anything")
        assert exc.value.status_code == 503


# ---------------------------------------------------------------- teachers
class TestTeacherApproval:
    def test_non_college_email_cannot_register(self, client, db, google):
        res = register_teacher(client, google, email="prof@gmail.com")
        assert res.status_code == 403
        assert db.teachers == {}

    def test_register_creates_pending_and_returns_no_token(self, client, db, google):
        res = register_teacher(client, google)
        assert res.status_code == 200, res.text
        assert "access_token" not in res.json()
        assert res.json()["status"] == "pending"
        assert next(iter(db.teachers.values()))["status"] == "pending"

    def test_pending_teacher_cannot_login_until_admin_approves(self, client, db, google, admin):
        register_teacher(client, google)
        res = login_teacher(client)
        assert res.status_code == 403
        assert "awaiting admin approval" in res.json()["detail"]

        headers = admin_headers(client)
        pending = client.get("/api/admin/teachers?status=pending", headers=headers).json()
        assert [t["username"] for t in pending] == ["prof"]
        assert "password" not in pending[0]

        assert client.post("/api/admin/teachers/1/approve", headers=headers).status_code == 200
        res = login_teacher(client)
        assert res.status_code == 200
        assert res.json()["user"]["role"] == "teacher"

    def test_wrong_password_does_not_reveal_status(self, client, db, google):
        register_teacher(client, google)
        res = login_teacher(client, password="wrong-password")
        assert res.status_code == 401

    def test_rejected_teacher_blocked_and_existing_token_revoked(self, client, db, google, admin):
        _tid, headers = approved_teacher_headers(client, google, db)
        assert client.get("/api/subjects", headers=headers).status_code == 200

        admin_h = admin_headers(client)
        assert client.post("/api/admin/teachers/1/reject", headers=admin_h).status_code == 200
        assert client.get("/api/subjects", headers=headers).status_code == 401
        assert login_teacher(client).status_code == 403

    def test_pending_teacher_token_is_not_accepted(self, client, db, google):
        register_teacher(client, google)
        from backend.app.core.security import create_access_token

        forged = create_access_token({"sub": "1", "role": "teacher", "name": "Prof X"})
        res = client.get("/api/subjects", headers={"Authorization": f"Bearer {forged}"})
        assert res.status_code == 401

    def test_duplicate_username_or_email(self, client, db, google):
        assert register_teacher(client, google).status_code == 200
        assert register_teacher(client, google, email="other@iiitdwd.ac.in").status_code == 400
        assert register_teacher(client, google, username="prof2").status_code == 400


# ------------------------------------------------------------------- admin
class TestAdmin:
    def test_login_requires_configuration(self, client):
        res = client.post("/api/admin/login", json={"email": "a@iiitdwd.ac.in", "password": "x"})
        assert res.status_code == 503

    def test_wrong_credentials(self, client, admin):
        assert client.post("/api/admin/login", json={"email": "admin@iiitdwd.ac.in", "password": "nope"}).status_code == 401
        assert client.post("/api/admin/login", json={"email": "x@iiitdwd.ac.in", "password": "s3cret-admin"}).status_code == 401

    def test_admin_endpoints_reject_others(self, client, db, google, admin):
        assert client.get("/api/admin/teachers").status_code == 401
        _tid, teacher_headers = approved_teacher_headers(client, google, db)
        assert client.get("/api/admin/teachers", headers=teacher_headers).status_code == 403
        assert client.post("/api/admin/teachers/1/approve", headers=teacher_headers).status_code == 403

    def test_student_token_cannot_use_admin_endpoints(self, client, db, google, faces):
        student = register_student(client, google).json()
        headers = {"Authorization": f"Bearer {student['access_token']}"}
        assert client.get("/api/admin/teachers", headers=headers).status_code == 403

    def test_admin_token_cannot_use_teacher_or_student_routes(self, client, admin):
        headers = admin_headers(client)
        assert client.get("/api/subjects", headers=headers).status_code == 403
        assert client.get("/api/subjects/student/my-subjects", headers=headers).status_code == 403
        assert client.get("/api/auth/me", headers=headers).json()["role"] == "admin"

    def test_admin_token_invalid_after_email_change(self, client, admin, monkeypatch):
        headers = admin_headers(client)
        monkeypatch.setattr("backend.app.api.deps.settings.ADMIN_EMAIL", "new-admin@iiitdwd.ac.in")
        assert client.get("/api/admin/teachers", headers=headers).status_code == 401

    def test_unknown_teacher_is_404(self, client, admin):
        headers = admin_headers(client)
        assert client.post("/api/admin/teachers/999/approve", headers=headers).status_code == 404


# ---------------------------------------------------------------- students
class TestStudentVerification:
    def test_non_college_email_cannot_register(self, client, db, google, faces):
        res = register_student(client, google, email="me@gmail.com")
        assert res.status_code == 403
        assert db.students == {}

    def test_register_creates_pending_student(self, client, db, google, faces):
        res = register_student(client, google)
        assert res.status_code == 200, res.text
        user = res.json()["user"]
        assert user["role"] == "student"
        assert user["status"] == "pending"
        assert user["roll_no"] == "24bcs086"
        assert user["email"] == "24bcs086@iiitdwd.ac.in"

    def test_duplicate_email_rejected(self, client, db, google, faces):
        assert register_student(client, google).status_code == 200
        assert register_student(client, google, token_name="again").status_code == 400
        assert len(db.students) == 1

    def test_join_creates_pending_request_not_enrollment(self, client, db, google, faces):
        teacher_id, _ = approved_teacher_headers(client, google, db)
        subject = db.add_subject(teacher_id)
        student = register_student(client, google).json()
        headers = {"Authorization": f"Bearer {student['access_token']}"}

        res = client.post("/api/subjects/join", json={"invite_code": subject["subject_code"]}, headers=headers)
        assert res.status_code == 200, res.text
        assert res.json()["pending"] is True
        assert db.enrollments[(student["user"]["id"], subject["subject_id"])] == "pending"
        # pending students never show up for attendance
        assert enrollment_repo.get_enrolled_students(subject["subject_id"]) == []

        # joining again does not duplicate or approve
        again = client.post("/api/subjects/enroll", json={"subject_code": subject["subject_code"]}, headers=headers)
        assert again.json()["status"] == "pending"

        mine = client.get("/api/subjects/student/my-subjects", headers=headers).json()
        assert mine[0]["enrollment_status"] == "pending"
        assert mine[0]["total_classes"] == 0

    def test_teacher_approves_and_student_becomes_verified(self, client, db, google, faces):
        teacher_id, t_headers = approved_teacher_headers(client, google, db)
        subject = db.add_subject(teacher_id)
        student = register_student(client, google).json()
        sid = student["user"]["id"]
        s_headers = {"Authorization": f"Bearer {student['access_token']}"}
        client.post("/api/subjects/join", json={"invite_code": subject["subject_code"]}, headers=s_headers)

        requests_ = client.get("/api/subjects/requests", headers=t_headers).json()
        assert len(requests_) == 1
        assert requests_[0]["roll_no"] == "24bcs086"
        assert requests_[0]["subject_code"] == "CS101"

        res = client.post(f"/api/subjects/{subject['subject_id']}/requests/{sid}/approve", headers=t_headers)
        assert res.status_code == 200, res.text
        assert db.enrollments[(sid, subject["subject_id"])] == "approved"
        assert db.students[sid]["status"] == "approved"
        assert [s["student_id"] for s in enrollment_repo.get_enrolled_students(subject["subject_id"])] == [sid]
        assert client.get("/api/subjects/requests", headers=t_headers).json() == []
        assert client.get("/api/auth/me", headers=s_headers).json()["status"] == "approved"

    def test_reject_then_request_again(self, client, db, google, faces):
        teacher_id, t_headers = approved_teacher_headers(client, google, db)
        subject = db.add_subject(teacher_id)
        student = register_student(client, google).json()
        sid = student["user"]["id"]
        s_headers = {"Authorization": f"Bearer {student['access_token']}"}
        client.post("/api/subjects/join", json={"invite_code": "CS101"}, headers=s_headers)

        assert client.post(f"/api/subjects/{subject['subject_id']}/requests/{sid}/reject", headers=t_headers).status_code == 200
        assert db.enrollments[(sid, subject["subject_id"])] == "rejected"
        assert db.students[sid]["status"] == "pending"  # one rejection does not verify
        assert enrollment_repo.get_enrolled_students(subject["subject_id"]) == []

        again = client.post("/api/subjects/join", json={"invite_code": "CS101"}, headers=s_headers)
        assert again.json()["status"] == "pending"
        assert len(client.get("/api/subjects/requests", headers=t_headers).json()) == 1

    def test_other_teacher_cannot_decide(self, client, db, google, faces):
        owner_id, _ = approved_teacher_headers(client, google, db)
        _other_id, other_headers = approved_teacher_headers(
            client, google, db, email="other@iiitdwd.ac.in", username="other"
        )
        subject = db.add_subject(owner_id)
        student = register_student(client, google).json()
        sid = student["user"]["id"]
        s_headers = {"Authorization": f"Bearer {student['access_token']}"}
        client.post("/api/subjects/join", json={"invite_code": "CS101"}, headers=s_headers)

        for action in ("approve", "reject"):
            res = client.post(f"/api/subjects/{subject['subject_id']}/requests/{sid}/{action}", headers=other_headers)
            assert res.status_code == 404
        assert db.enrollments[(sid, subject["subject_id"])] == "pending"
        assert client.get("/api/subjects/requests", headers=other_headers).json() == []

    def test_student_cannot_approve_or_list_requests(self, client, db, google, faces):
        teacher_id, _ = approved_teacher_headers(client, google, db)
        subject = db.add_subject(teacher_id)
        student = register_student(client, google).json()
        s_headers = {"Authorization": f"Bearer {student['access_token']}"}
        sid = student["user"]["id"]
        client.post("/api/subjects/join", json={"invite_code": "CS101"}, headers=s_headers)
        assert client.get("/api/subjects/requests", headers=s_headers).status_code == 403
        res = client.post(f"/api/subjects/{subject['subject_id']}/requests/{sid}/approve", headers=s_headers)
        assert res.status_code == 403
        assert db.enrollments[(sid, subject["subject_id"])] == "pending"

    def test_approving_unknown_request_is_404(self, client, db, google):
        teacher_id, t_headers = approved_teacher_headers(client, google, db)
        subject = db.add_subject(teacher_id)
        res = client.post(f"/api/subjects/{subject['subject_id']}/requests/99/approve", headers=t_headers)
        assert res.status_code == 404

    def test_roster_requires_owning_teacher(self, client, db, google, faces):
        owner_id, owner_headers = approved_teacher_headers(client, google, db)
        _o, other_headers = approved_teacher_headers(client, google, db, email="o@iiitdwd.ac.in", username="other")
        subject = db.add_subject(owner_id)
        student = register_student(client, google).json()
        s_headers = {"Authorization": f"Bearer {student['access_token']}"}
        url = f"/api/subjects/{subject['subject_id']}/students"
        assert client.get(url, headers=owner_headers).status_code == 200
        assert client.get(url, headers=other_headers).status_code == 404
        assert client.get(url, headers=s_headers).status_code == 403

    def test_rejected_account_token_is_invalid(self, client, db, google, faces):
        student = register_student(client, google).json()
        headers = {"Authorization": f"Bearer {student['access_token']}"}
        db.students[student["user"]["id"]]["status"] = "rejected"
        assert client.get("/api/auth/me", headers=headers).status_code == 401


# ------------------------------------------------- repository query filters
class _Recorder:
    """Minimal stand-in for the Supabase query builder that records calls."""

    def __init__(self, data):
        self.calls = []
        self._data = data

    def __getattr__(self, name):
        def method(*args, **kwargs):
            self.calls.append((name, args))
            return self

        return method

    def execute(self):
        class R:
            data = self._data

        return R


class _FakeClient:
    def __init__(self, data):
        self.recorder = _Recorder(data)

    def table(self, name):
        self.recorder.calls.append(("table", (name,)))
        return self.recorder


@pytest.mark.real_repos
class TestRepositoryFilters:
    def test_roster_and_attendance_only_include_approved(self, monkeypatch):
        for fn_name, call in (
            ("get_enrolled_students", lambda: enrollment_repo.get_enrolled_students(1)),
            ("get_subject_enrollment_records", lambda: enrollment_repo.get_subject_enrollment_records(1)),
        ):
            fake = _FakeClient([])
            monkeypatch.setattr(enrollment_repo, "get_supabase", lambda fake=fake: fake)
            call()
            assert ("eq", ("status", "approved")) in fake.recorder.calls, fn_name

    def test_face_login_excludes_rejected_students(self, monkeypatch):
        fake = _FakeClient([])
        monkeypatch.setattr(student_repo, "get_supabase", lambda: fake)
        student_repo.get_all_students()
        assert ("neq", ("status", "rejected")) in fake.recorder.calls

    def test_pending_requests_are_scoped_to_teacher(self, monkeypatch):
        fake = _FakeClient([])
        monkeypatch.setattr(enrollment_repo, "get_supabase", lambda: fake)
        enrollment_repo.get_pending_requests_for_teacher(7)
        assert ("eq", ("status", "pending")) in fake.recorder.calls
        assert ("eq", ("subjects.teacher_id", 7)) in fake.recorder.calls
