from typing import Optional, List, Any
from pydantic import BaseModel
from datetime import date, datetime

class StudyPlanItemRead(BaseModel):
    id: str
    plan_id: str
    day_number: int
    topics: List[Any]
    time_allocation_minutes: int
    learning_objectives: List[str]
    practice_questions: List[Any]
    is_completed: bool

    class Config:
        from_attributes = True

class StudyPlanRead(BaseModel):
    id: str
    user_id: str
    subject_id: str
    title: str
    exam_date: date
    total_days: int
    status: str
    created_at: datetime
    items: List[StudyPlanItemRead] = []

    class Config:
        from_attributes = True

class StudyPlanGenerateRequest(BaseModel):
    subject_id: str
    exam_date: date
    daily_available_hours: Optional[float] = 3.0
    prioritized_topics: Optional[List[str]] = []
    excluded_days: Optional[List[int]] = [] # day numbers to leave as rest/light
    convert_to_tasks: Optional[bool] = True
