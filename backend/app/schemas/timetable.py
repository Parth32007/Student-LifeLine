from typing import Optional, List, Any
from pydantic import BaseModel
from datetime import datetime

class TimetableEventBase(BaseModel):
    subject_id: Optional[str] = None
    title: str
    day_of_week: int # 0=Sunday, 1=Monday...
    start_time: str  # "09:00"
    end_time: str    # "10:30"
    location: Optional[str] = None
    is_recurring: Optional[bool] = True

class TimetableEventCreate(TimetableEventBase):
    pass

class TimetableEventRead(TimetableEventBase):
    id: str
    user_id: str
    created_at: datetime
    subject_name: Optional[str] = None
    subject_color: Optional[str] = None

    class Config:
        from_attributes = True

class AssignmentBase(BaseModel):
    subject_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    due_date: datetime
    priority: Optional[str] = "high"
    status: Optional[str] = "todo"
    estimated_effort_hours: Optional[float] = 2.0
    subtasks: Optional[List[Any]] = []

class AssignmentCreate(AssignmentBase):
    pass

class AssignmentUpdate(BaseModel):
    subject_id: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    estimated_effort_hours: Optional[float] = None
    subtasks: Optional[List[Any]] = None

class AssignmentRead(AssignmentBase):
    id: str
    user_id: str
    created_at: datetime
    subject_name: Optional[str] = None
    subject_color: Optional[str] = None

    class Config:
        from_attributes = True
