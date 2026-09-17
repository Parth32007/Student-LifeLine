from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class MistakeNotebookRead(BaseModel):
    id: str
    user_id: str
    subject_id: Optional[str] = None
    source_type: str
    question_or_problem: str
    user_mistake: str
    correct_solution: str
    explanation: Optional[str] = None
    topic: Optional[str] = None
    mistake_count: int
    mastered: bool
    created_at: datetime
    last_reviewed_at: Optional[datetime] = None
    subject_name: Optional[str] = None

    class Config:
        from_attributes = True

class MistakeNotebookUpdate(BaseModel):
    mastered: Optional[bool] = None
