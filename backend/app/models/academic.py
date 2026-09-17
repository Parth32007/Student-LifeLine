import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, DateTime, Date, Integer, Numeric, Boolean, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class TimetableEvent(Base):
    __tablename__ = "timetable_events"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(String, ForeignKey("subjects.id", ondelete="SET NULL"), nullable=True)
    title = Column(String, nullable=False)
    day_of_week = Column(Integer, nullable=False) # 0=Sunday, 1=Monday...
    start_time = Column(String, nullable=False)   # "09:00"
    end_time = Column(String, nullable=False)     # "10:30"
    location = Column(String, nullable=True)
    is_recurring = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(String, ForeignKey("subjects.id", ondelete="SET NULL"), nullable=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    due_date = Column(DateTime, nullable=False)
    priority = Column(String, default="high") # urgent, high, medium, low
    status = Column(String, default="todo")    # todo, in_progress, completed
    estimated_effort_hours = Column(Numeric(4, 2), default=2.0)
    subtasks = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

class StudyPlan(Base):
    __tablename__ = "study_plans"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(String, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    exam_date = Column(Date, nullable=False)
    total_days = Column(Integer, nullable=False)
    status = Column(String, default="active")
    created_at = Column(DateTime, default=datetime.utcnow)

    items = relationship("StudyPlanItem", back_populates="plan", cascade="all, delete-orphan")

class StudyPlanItem(Base):
    __tablename__ = "study_plan_items"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    plan_id = Column(String, ForeignKey("study_plans.id", ondelete="CASCADE"), nullable=False)
    day_number = Column(Integer, nullable=False)
    topics = Column(JSON, default=list)
    time_allocation_minutes = Column(Integer, default=120)
    learning_objectives = Column(JSON, default=list)
    practice_questions = Column(JSON, default=list)
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    plan = relationship("StudyPlan", back_populates="items")
