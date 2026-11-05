import hmac
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from backend.app.core.config import settings
from backend.app.core.security import decode_access_token, is_access_token_revoked
from backend.app.schemas.auth import UserPayload
from backend.app.services.db import teacher_repo, student_repo

security = HTTPBearer(auto_error=False)

ADMIN_USER_ID = 0


def _unauthorized(detail: str) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def _admin_from_payload(payload: dict) -> UserPayload | None:
    """Build the admin user if the token matches the configured admin account."""
    admin_email = settings.ADMIN_EMAIL.strip().lower()
    token_email = str(payload.get("email", "")).strip().lower()
    if not admin_email or not hmac.compare_digest(
        token_email.encode("utf-8"), admin_email.encode("utf-8")
    ):
        return None
    return UserPayload(
        id=ADMIN_USER_ID,
        username=None,
        name="Administrator",
        role="admin",
        email=admin_email,
        status="approved",
    )


def get_current_user(
    auth: HTTPAuthorizationCredentials = Depends(security),
) -> UserPayload:
    if not auth or not auth.credentials:
        raise _unauthorized("Missing authentication credentials.")
    payload = decode_access_token(auth.credentials)
    if not payload or is_access_token_revoked(auth.credentials):
        raise _unauthorized("Invalid or expired authentication token.")
    try:
        user_id = int(payload["sub"])
    except (KeyError, TypeError, ValueError):
        raise _unauthorized("Could not validate credentials.")

    claimed_role = payload.get("role")
    user = None
    if claimed_role == "admin":
        user = _admin_from_payload(payload) if user_id == ADMIN_USER_ID else None
    elif claimed_role == "teacher":
        account = teacher_repo.get_teacher_by_id(user_id)
        if account:
            if account.get("status") != "approved":
                raise _unauthorized("Your teacher account is not approved by the admin.")
            user = UserPayload(
                id=user_id,
                username=account["username"],
                name=account["name"],
                role="teacher",
                email=account.get("email"),
                status=account.get("status"),
            )
    elif claimed_role == "student":
        account = student_repo.get_student_by_id(user_id)
        if account:
            if account.get("status") == "rejected":
                raise _unauthorized("Your student account has been rejected.")
            user = UserPayload(
                id=user_id,
                username=None,
                name=account["name"],
                role="student",
                email=account.get("email"),
                roll_no=account.get("roll_no"),
                status=account.get("status"),
            )

    if not user:
        raise _unauthorized("Account no longer exists or credentials are invalid.")
    return user


def require_teacher(user: UserPayload = Depends(get_current_user)) -> UserPayload:
    if user.role != "teacher":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Teacher privileges required.",
        )
    return user


def require_student(user: UserPayload = Depends(get_current_user)) -> UserPayload:
    if user.role != "student":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Student privileges required.",
        )
    return user


def require_admin(user: UserPayload = Depends(get_current_user)) -> UserPayload:
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access forbidden: Admin privileges required.",
        )
    return user
