from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class StudySessionCreate(BaseModel):
    task_id: Optional[str] = None
    subject_id: Optional[str] = None
    notes: Optional[str] = None

class StudySessionEnd(BaseModel):
    duration_minutes: int
    notes: Optional[str] = None
    completed_objective: Optional[bool] = True

class StudySessionRead(BaseModel):
    id: str
    user_id: str
    task_id: Optional[str] = None
    subject_id: Optional[str] = None
    started_at: datetime
    ended_at: Optional[datetime] = None
    duration_minutes: int
    notes: Optional[str] = None
    completed_objective: bool
    created_at: datetime

    class Config:
        from_attributes = True
