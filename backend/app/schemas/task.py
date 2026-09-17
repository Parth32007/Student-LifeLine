from typing import Optional, List
from pydantic import BaseModel
from datetime import date, datetime

class TaskBase(BaseModel):
    subject_id: Optional[str] = None
    title: str
    topic: Optional[str] = None
    learning_objective: Optional[str] = None
    recommended_resource: Optional[str] = None
    scheduled_date: Optional[date] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    estimated_duration_minutes: Optional[int] = 45
    actual_duration_minutes: Optional[int] = 0
    priority: Optional[str] = "medium"  # urgent, high, medium, low
    difficulty: Optional[str] = "medium" # easy, medium, hard
    status: Optional[str] = "pending"   # pending, in_progress, completed, skipped, rescheduled
    is_locked: Optional[bool] = False

class TaskCreate(TaskBase):
    pass

class TaskUpdate(BaseModel):
    subject_id: Optional[str] = None
    title: Optional[str] = None
    topic: Optional[str] = None
    learning_objective: Optional[str] = None
    recommended_resource: Optional[str] = None
    scheduled_date: Optional[date] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    estimated_duration_minutes: Optional[int] = None
    actual_duration_minutes: Optional[int] = None
    priority: Optional[str] = None
    difficulty: Optional[str] = None
    status: Optional[str] = None
    is_locked: Optional[bool] = None

class TaskRead(TaskBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime
    subject_name: Optional[str] = None
    subject_color: Optional[str] = None

    class Config:
        from_attributes = True

class MissionGenerateRequest(BaseModel):
    target_date: Optional[date] = None
    force_regenerate: Optional[bool] = False

class WhatToStudyNowResponse(BaseModel):
    task_id: Optional[str] = None
    title: str
    subject_name: Optional[str] = None
    topic: Optional[str] = None
    recommended_duration_minutes: int
    reason: str
    action_type: str # "start_task", "quick_revision", "flashcards", "mock_quiz"
    resource: Optional[str] = None

class MissedDayRecoveryRequest(BaseModel):
    missed_date: date
    distribute_over_days: Optional[int] = 3
