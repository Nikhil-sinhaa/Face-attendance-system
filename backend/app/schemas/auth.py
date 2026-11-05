from typing import Optional, Literal
from pydantic import BaseModel, Field


class TeacherRegisterRequest(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=4, max_length=100)
    name: str = Field(..., min_length=2, max_length=100)
    google_id_token: str = Field(..., min_length=10)


class TeacherLoginRequest(BaseModel):
    username: str
    password: str


class AdminLoginRequest(BaseModel):
    email: str = Field(..., min_length=3, max_length=200)
    password: str = Field(..., min_length=1, max_length=200)


class UserPayload(BaseModel):
    id: int
    username: Optional[str] = None
    name: str
    role: Literal["teacher", "student", "admin"]
    email: Optional[str] = None
    roll_no: Optional[str] = None
    status: Optional[str] = None


class RegistrationPendingResponse(BaseModel):
    message: str
    status: str = "pending"


class TeacherSummary(BaseModel):
    teacher_id: int
    username: str
    name: str
    email: Optional[str] = None
    status: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPayload

