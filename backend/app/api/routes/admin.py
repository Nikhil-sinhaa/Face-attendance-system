import hmac
from typing import List, Literal
from fastapi import APIRouter, Depends, HTTPException, Query, status
from backend.app.api.deps import ADMIN_USER_ID, require_admin
from backend.app.core.config import settings
from backend.app.core.security import create_access_token
from backend.app.schemas.auth import (
    AdminLoginRequest,
    TeacherSummary,
    TokenResponse,
    UserPayload,
)
from backend.app.services.db import teacher_repo

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.post("/login", response_model=TokenResponse)
def admin_login(req: AdminLoginRequest):
    admin_email = settings.ADMIN_EMAIL.strip().lower()
    if not admin_email or not settings.ADMIN_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Admin account is not configured on the server.",
        )
    email_ok = hmac.compare_digest(
        req.email.strip().lower().encode("utf-8"), admin_email.encode("utf-8")
    )
    password_ok = hmac.compare_digest(
        req.password.encode("utf-8"), settings.ADMIN_PASSWORD.encode("utf-8")
    )
    if not (email_ok and password_ok):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin email or password.",
        )
    user = UserPayload(
        id=ADMIN_USER_ID,
        username=None,
        name="Administrator",
        role="admin",
        email=admin_email,
        status="approved",
    )
    token = create_access_token(
        data={
            "sub": str(ADMIN_USER_ID),
            "name": user.name,
            "email": admin_email,
            "role": "admin",
        }
    )
    return TokenResponse(access_token=token, user=user)


@router.get("/teachers", response_model=List[TeacherSummary])
def list_teachers(
    status_filter: Literal["pending", "approved", "rejected", "all"] = Query("pending", alias="status"),
    _admin: UserPayload = Depends(require_admin),
):
    return teacher_repo.list_teachers_by_status(None if status_filter == "all" else status_filter)


def _set_status(teacher_id: int, new_status: str) -> TeacherSummary:
    teacher = teacher_repo.set_teacher_status(teacher_id, new_status)
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found.")
    return TeacherSummary(**{k: teacher.get(k) for k in TeacherSummary.model_fields})


@router.post("/teachers/{teacher_id}/approve", response_model=TeacherSummary)
def approve_teacher(teacher_id: int, _admin: UserPayload = Depends(require_admin)):
    return _set_status(teacher_id, "approved")


@router.post("/teachers/{teacher_id}/reject", response_model=TeacherSummary)
def reject_teacher(teacher_id: int, _admin: UserPayload = Depends(require_admin)):
    return _set_status(teacher_id, "rejected")
