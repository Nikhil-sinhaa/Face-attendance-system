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

@router.post("/face/recognize", response_model=FaceRecognitionResponse)
async def recognize_face_attendance(
    subject_id: int = Form(...),
    files: List[UploadFile] = File(...),
    teacher: UserPayload = Depends(require_teacher),
):
    if not files:
        raise HTTPException(status_code=400, detail="No classroom photos uploaded.")

    # 1. Fetch subject and enrolled students
    subject = supabase_service.get_subject_by_id(subject_id)
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found.")
    if subject["teacher_id"] != teacher.id:
        raise HTTPException(status_code=403, detail="Not authorized for this subject.")

    enrolled_students = supabase_service.get_enrolled_students(subject_id)
    if not enrolled_students:
        raise HTTPException(status_code=400, detail="No students are enrolled in this subject.")

    # 2. Read images bytes
    images_bytes_list = []
    for f in files:
        b = await f.read()
        if b and len(b) > 100:
            images_bytes_list.append(b)

    if not images_bytes_list:
        raise HTTPException(status_code=400, detail="Uploaded images were empty or corrupted.")

    # 3. Run face recognition pipeline
    rec_result = face_service.recognize_faces_in_images(
        images_bytes_list, enrolled_students
    )

    detected_map = rec_result["detected_student_ids"]
    candidates: List[AttendanceCandidateResult] = []

    for s in enrolled_students:
        sid = s["student_id"]
        sources = detected_map.get(sid, [])
        is_present = len(sources) > 0

        candidates.append(
            AttendanceCandidateResult(
                student_id=sid,
                name=s["name"],
                status="Present" if is_present else "Absent",
                source=", ".join(sources) if is_present else "-",
                is_present=is_present,
            )
        )

    # Sort: present first, then alphabetically
    candidates.sort(key=lambda x: (not x.is_present, x.name.lower()))

    return FaceRecognitionResponse(
        subject_id=subject_id,
        total_enrolled=len(enrolled_students),
        total_faces_found=rec_result["total_faces_found"],
        candidates=candidates,
    )

@router.post("/voice/process", response_model=VoiceRecognitionResponse)
async def process_voice_attendance(
    subject_id: int = Form(...),
    audio_file: UploadFile = File(...),
    teacher: UserPayload = Depends(require_teacher),
):
    # 1. Verify subject
    subject = supabase_service.get_subject_by_id(subject_id)
    if not subject:
        raise HTTPException(status_code=404, detail="Subject not found.")
    if subject["teacher_id"] != teacher.id:
        raise HTTPException(status_code=403, detail="Not authorized for this subject.")

    enrolled_students = supabase_service.get_enrolled_students(subject_id)
    if not enrolled_students:
        raise HTTPException(status_code=400, detail="No students are enrolled in this subject.")

    # 2. Read audio bytes
    audio_bytes = await audio_file.read()
    if not audio_bytes or len(audio_bytes) < 1000:
        raise HTTPException(status_code=400, detail="Audio recording is empty or too short.")

    # 3. Process bulk audio
    try:
        rec_result = voice_service.process_bulk_audio_attendance(
            audio_bytes, enrolled_students
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to process audio: {e}")

    detected_scores = rec_result["detected_scores"]
    candidates: List[AttendanceCandidateResult] = []

    for s in enrolled_students:
        sid = s["student_id"]
        has_voice = bool(s.get("voice_embedding") and len(s["voice_embedding"]) == 256)
        score = detected_scores.get(sid, 0.0)
        is_present = score > 0.0

        if not has_voice:
            source_label = "No voice profile"
        elif is_present:
            source_label = f"Match score: {score:.2f}"
        else:
            source_label = "-"

        candidates.append(
            AttendanceCandidateResult(
                student_id=sid,
                name=s["name"],
                status="Present" if is_present else "Absent",
                source=source_label,
                is_present=is_present,
                has_voice_profile=has_voice,
            )
        )

    candidates.sort(key=lambda x: (not x.is_present, x.name.lower()))

    return VoiceRecognitionResponse(
        subject_id=subject_id,
        total_enrolled=len(enrolled_students),
        segments_processed=rec_result["segments_processed"],
        warning=rec_result["warning"],
        candidates=candidates,
    )