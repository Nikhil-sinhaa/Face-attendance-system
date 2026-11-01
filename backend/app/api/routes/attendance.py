from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from backend.app.api.deps import require_teacher, require_student
from backend.app.schemas.auth import UserPayload
from backend.app.schemas.attendance import (
    FaceRecognitionResponse,
    VoiceRecognitionResponse,
    AttendanceCandidateResult,
    AttendanceConfirmRequest,
    AttendanceConfirmResponse,
)
from backend.app.services import supabase_service, face_service, voice_service

router = APIRouter(prefix="/attendance", tags=["Attendance"])