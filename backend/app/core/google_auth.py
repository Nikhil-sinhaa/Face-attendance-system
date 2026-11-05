"""Verification of Google Sign-In ID tokens, restricted to the college domain."""
from typing import Dict

from fastapi import HTTPException, status
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token

from backend.app.core.config import settings

_request = google_requests.Request()


def normalize_email(email: str) -> str:
    return (email or "").strip().lower()


def is_college_email(email: str) -> bool:
    """True only for ``<local>@<ALLOWED_EMAIL_DOMAIN>`` (exact domain, no subdomains)."""
    email = normalize_email(email)
    local, sep, domain = email.rpartition("@")
    return bool(sep and local and domain == settings.ALLOWED_EMAIL_DOMAIN.lower())


def verify_college_google_token(token: str) -> Dict[str, str]:
    """Verify a Google ID token and return ``{email, name, roll_no}``.

    Raises HTTPException when the token is invalid, the email is unverified,
    or the account is not an ``@ALLOWED_EMAIL_DOMAIN`` account.
    """
    domain = settings.ALLOWED_EMAIL_DOMAIN.lower()
    deny = HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail=f"Only @{domain} accounts are allowed.",
    )

    if not settings.GOOGLE_CLIENT_ID:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Google sign-in is not configured on the server.",
        )
    if not token:
        raise HTTPException(status_code=400, detail="Google sign-in is required.")

    try:
        claims = google_id_token.verify_oauth2_token(
            token, _request, settings.GOOGLE_CLIENT_ID, clock_skew_in_seconds=10
        )
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail="Google sign-in expired or invalid. Please sign in with Google again.",
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not reach Google to verify your sign-in. Please try again.",
        )

    email = normalize_email(claims.get("email", ""))
    if not claims.get("email_verified") or not is_college_email(email):
        raise deny
    # ``hd`` is only present for Google Workspace accounts of that domain.
    if (claims.get("hd") or "").lower() != domain:
        raise deny

    roll_no = email.rpartition("@")[0]
    return {
        "email": email,
        "name": (claims.get("name") or roll_no).strip(),
        "roll_no": roll_no,
    }
