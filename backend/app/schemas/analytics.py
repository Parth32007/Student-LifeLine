from typing import Optional, List, Dict, Any
from pydantic import BaseModel
from datetime import date, datetime

class SubjectProgress(BaseModel):
    subject_id: str
    subject_name: str
    color: str
    total_tasks: int
    completed_tasks: int
    study_hours: float
    mastery_score: float # 0 to 100

class AcademicAnalyticsRead(BaseModel):
    total_study_hours: float
    weekly_study_hours: float
    study_streak_days: int
    tasks_completion_rate: float
    coding_problems_solved: int
    flashcards_reviewed_total: int
    quizzes_taken: int
    average_quiz_score: float
    subject_progress: List[SubjectProgress] = []
    daily_study_history: List[Dict[str, Any]] = [] # [{ "date": "2026-09-10", "hours": 2.5 }]

class ExamReadinessRead(BaseModel):
    subject_id: str
    subject_name: str
    exam_date: Optional[date] = None
    days_remaining: Optional[int] = None
    readiness_percentage: float # 0 to 100
    syllabus_coverage_pct: float
    quiz_accuracy_pct: float
    revision_completion_pct: float
    weak_topics: List[str] = []
    suggested_actions: List[str] = []
    explanation: str

class WeeklyReviewRead(BaseModel):
    id: str
    user_id: str
    week_start_date: date
    planned_hours: float
    completed_hours: float
    completion_rate: float
    most_studied_subject: Optional[str] = None
    weak_topics: List[str] = []
    ai_insights: Optional[str] = None
    next_week_goals: List[str] = []
    created_at: datetime

    class Config:
        from_attributes = True

class NotificationRead(BaseModel):
    id: str
    user_id: str
    title: str
    message: str
    type: str
    read: bool
    link: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
