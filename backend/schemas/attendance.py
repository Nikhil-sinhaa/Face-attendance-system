from typing import List, Optional, Any
from pydantic import BaseModel


class AttendanceCandidateResult(BaseModel):
    student_id: int
    name: str
    status: str  # "Present" or "Absent"
    source: str  # e.g. "Photo 1, Photo 2" or "Score: 0.82" or "-"
    is_present: bool
    has_voice_profile: Optional[bool] = None

    