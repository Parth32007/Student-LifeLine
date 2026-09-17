from typing import Optional, List, Any
from pydantic import BaseModel
from datetime import datetime

class SubjectUnitBase(BaseModel):
    unit_number: int
    title: str
    description: Optional[str] = None
    topics: Optional[List[str]] = []

class SubjectUnitCreate(SubjectUnitBase):
    pass

class SubjectUnitRead(SubjectUnitBase):
    id: str
    subject_id: str
    user_id: str
    created_at: datetime

    class Config:
        from_attributes = True

class SubjectBase(BaseModel):
    name: str
    code: Optional[str] = None
    color: Optional[str] = "#3B82F6"
    target_grade: Optional[str] = "A"
    credits: Optional[int] = 3
    syllabus_topics: Optional[List[Any]] = []

class SubjectCreate(BaseModel):
    name: str
    color: Optional[str] = "#3B82F6"
    target_grade: Optional[str] = "A"
    credits: Optional[int] = 3
    syllabus_topics: Optional[List[Any]] = []
    units: Optional[List[SubjectUnitCreate]] = None

class SubjectUpdate(BaseModel):
    name: Optional[str] = None
    color: Optional[str] = None
    target_grade: Optional[str] = None
    credits: Optional[int] = None
    syllabus_topics: Optional[List[Any]] = None

class SubjectRead(SubjectBase):
    id: str
    user_id: str
    created_at: datetime
    units: List[SubjectUnitRead] = []

    class Config:
        from_attributes = True
