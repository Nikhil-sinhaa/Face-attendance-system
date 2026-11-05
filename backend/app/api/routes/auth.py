from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.security import HTTPAuthorizationCredentials
from typing import Optional
from backend.app.core.google_auth import verify_college_google_token
from backend.app.core.security import hash_password, verify_password, create_access_token, revoke_access_token
from backend.app.schemas.auth import (
    TeacherRegisterRequest,
    TeacherLoginRequest,
    TeacherGoogleLoginRequest,
    RegistrationPendingResponse,
    TokenResponse,
    UserPayload,
)
from backend.app.services import face_service, voice_service
from backend.app.services.db import teacher_repo, student_repo
from backend.app.api.deps import get_current_user, security

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _student_payload(student: dict) -> UserPayload:
    return UserPayload(
        id=student["student_id"],
        username=None,
        name=student["name"],
        role="student",
        email=student.get("email"),
        roll_no=student.get("roll_no"),
        status=student.get("status"),
    )


def _student_token(user_payload: UserPayload) -> TokenResponse:
    token = create_access_token(
        data={"sub": str(user_payload.id), "name": user_payload.name, "role": "student"}
    )
    return TokenResponse(access_token=token, user=user_payload)


def _teacher_session(teacher: dict) -> TokenResponse:
    """Issue a token for an approved teacher; reject pending/rejected accounts."""
    if teacher.get("status") == "pending":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is awaiting admin approval. Please try again later.",
        )
    if teacher.get("status") != "approved":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your registration was rejected by the admin.",
        )
    user_payload = UserPayload(
        id=teacher["teacher_id"],
        username=teacher["username"],
        name=teacher["name"],
        role="teacher",
        email=teacher.get("email"),
        status=teacher.get("status"),
    )
    token = create_access_token(
        data={
            "sub": str(user_payload.id),
            "username": user_payload.username,
            "name": user_payload.name,
            "role": "teacher",
        }
    )
    return TokenResponse(access_token=token, user=user_payload)


@router.post("/teacher/register", response_model=RegistrationPendingResponse)
def register_teacher(req: TeacherRegisterRequest):
    identity = verify_college_google_token(req.google_id_token)

    username = req.username.strip()
    name = req.name.strip()
    if len(username) < 3:
        raise HTTPException(status_code=400, detail="Username must be at least 3 characters.")
    if len(name) < 2:
        raise HTTPException(status_code=400, detail="Please enter your full name.")

    if teacher_repo.get_teacher_by_username(username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken. Please choose another.",
        )
    if teacher_repo.get_teacher_by_email(identity["email"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A teacher account with this college email already exists.",
        )

    password_hash = hash_password(req.password)
    try:
        teacher_repo.create_teacher(username, password_hash, name, identity["email"])
    except Exception:
        # A concurrent request may have won the unique-constraint race.
        if teacher_repo.get_teacher_by_username(username) or teacher_repo.get_teacher_by_email(identity["email"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This username or college email is already registered.",
            )
        raise

    return RegistrationPendingResponse(
        message="Registration submitted. You can sign in once the admin approves your account.",
        status="pending",
    )


@router.post("/teacher/login", response_model=TokenResponse)
def login_teacher(req: TeacherLoginRequest):
    teacher = teacher_repo.get_teacher_by_username(req.username)
    if not teacher or not verify_password(req.password, teacher.get("password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password.",
        )
    return _teacher_session(teacher)


@router.post("/teacher/google-login", response_model=TokenResponse)
def login_teacher_google(req: TeacherGoogleLoginRequest):
    identity = verify_college_google_token(req.google_id_token)
    teacher = teacher_repo.get_teacher_by_email(identity["email"])
    if not teacher:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No teacher account found for this Google account. Please register first.",
        )
    return _teacher_session(teacher)


@router.post("/student/face-login", response_model=TokenResponse)
async def login_student_face(file: UploadFile = File(...)):
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Empty image uploaded.")

    all_students = student_repo.get_all_students()
    student, num_faces, msg = face_service.identify_student_for_login(contents, all_students)

    if num_faces == 0:
        raise HTTPException(status_code=400, detail="No face detected. Please face the camera.")
    if num_faces > 1:
        raise HTTPException(status_code=400, detail="Multiple faces detected. Please be alone in frame.")
    if not student:
        raise HTTPException(
            status_code=404,
            detail="Face not recognized. You may need to create an account first.",
        )

    return _student_token(_student_payload(student))


@router.post("/student/register", response_model=TokenResponse)
async def register_student(
    google_id_token: str = Form(...),
    name: str = Form(""),
    face_file: UploadFile = File(...),
    voice_file: Optional[UploadFile] = File(None),
):
    identity = verify_college_google_token(google_id_token)

    name = name.strip() or identity["name"]
    if not name:
        raise HTTPException(status_code=400, detail="Student name is required.")
    if student_repo.get_student_by_email(identity["email"]):
        raise HTTPException(
            status_code=400,
            detail="This college email is already registered. Sign in with your face instead.",
        )

    face_bytes = await face_file.read()
    if not face_bytes:
        raise HTTPException(status_code=400, detail="Face image is required.")

    try:
        img_np = face_service.image_bytes_to_numpy(face_bytes)
        encodings = face_service.extract_face_embeddings(img_np)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process face image: {e}")

    if len(encodings) == 0:
        raise HTTPException(
            status_code=400,
            detail="No face found in registration image. Please position your face clearly.",
        )
    if len(encodings) > 1:
        raise HTTPException(
            status_code=400,
            detail="Multiple faces found in registration image. Only one person should be in frame.",
        )

    face_embedding = [float(x) for x in encodings[0].tolist()]

    voice_embedding = None
    if voice_file:
        voice_bytes = await voice_file.read()
        if voice_bytes and len(voice_bytes) > 1000:
            voice_embedding = voice_service.get_voice_embedding(voice_bytes)

    try:
        student = student_repo.create_student(
            name=name,
            email=identity["email"],
            roll_no=identity["roll_no"],
            face_embedding=face_embedding,
            voice_embedding=voice_embedding,
        )
    except Exception:
        # A concurrent request may have won the unique-constraint race.
        if student_repo.get_student_by_email(identity["email"]):
            raise HTTPException(
                status_code=400,
                detail="This college email is already registered. Sign in with your face instead.",
            )
        raise

    return _student_token(_student_payload(student))


@router.get("/me", response_model=UserPayload)
def get_me(current_user: UserPayload = Depends(get_current_user)):
    return current_user


@router.post("/logout")
def logout(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    _current_user: UserPayload = Depends(get_current_user),
):
    if credentials:
        revoke_access_token(credentials.credentials)
    return {"message": "Logged out successfully."}
