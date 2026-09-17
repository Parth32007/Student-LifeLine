from typing import Optional, List
from pydantic import BaseModel
from datetime import datetime

class ProfileBase(BaseModel):
    full_name: str
    avatar_url: Optional[str] = None

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None

class ProfileRead(ProfileBase):
    id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class AcademicProfileBase(BaseModel):
    education_level: Optional[str] = "Undergraduate"
    college_university: Optional[str] = None
    course: Optional[str] = None
    semester: Optional[int] = 1
    preferred_study_hours_start: Optional[str] = "09:00:00"
    preferred_study_hours_end: Optional[str] = "22:00:00"
    daily_available_hours: Optional[float] = 4.0
    break_duration_minutes: Optional[int] = 15
    goals: Optional[List[str]] = []
    onboarding_completed: Optional[bool] = False

class AcademicProfileUpdate(BaseModel):
    education_level: Optional[str] = None
    college_university: Optional[str] = None
    course: Optional[str] = None
    semester: Optional[int] = None
    preferred_study_hours_start: Optional[str] = None
    preferred_study_hours_end: Optional[str] = None
    daily_available_hours: Optional[float] = None
    break_duration_minutes: Optional[int] = None
    goals: Optional[List[str]] = None
    onboarding_completed: Optional[bool] = None

class AcademicProfileRead(AcademicProfileBase):
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class OnboardingSubmit(BaseModel):
    education_level: Optional[str] = "Undergraduate"
    college_university: Optional[str] = None
    course: Optional[str] = None
    semester: Optional[int] = 1
    daily_available_hours: Optional[float] = 4.0
    preferred_study_hours_start: Optional[str] = "09:00:00"
    preferred_study_hours_end: Optional[str] = "22:00:00"
    break_duration_minutes: Optional[int] = 15
    goals: Optional[List[str]] = []
    subjects: Optional[List[dict]] = []
