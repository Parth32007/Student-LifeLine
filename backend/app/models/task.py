import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, DateTime, Date, Integer, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Task(Base):
    __tablename__ = "tasks"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(String, ForeignKey("subjects.id", ondelete="SET NULL"), nullable=True)
    title = Column(String, nullable=False)
    topic = Column(String, nullable=True)
    learning_objective = Column(String, nullable=True)
    recommended_resource = Column(String, nullable=True)
    scheduled_date = Column(Date, default=date.today, nullable=False)
    start_time = Column(String, nullable=True)  # e.g. "09:00"
    end_time = Column(String, nullable=True)    # e.g. "10:00"
    estimated_duration_minutes = Column(Integer, default=45)
    actual_duration_minutes = Column(Integer, default=0)
    priority = Column(String, default="medium") # urgent, high, medium, low
    difficulty = Column(String, default="medium") # easy, medium, hard
    status = Column(String, default="pending")  # pending, in_progress, completed, skipped, rescheduled
    is_locked = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    profile = relationship("Profile", back_populates="tasks")
    subject = relationship("Subject", back_populates="tasks")
    study_sessions = relationship("StudySession", back_populates="task")

class StudySession(Base):
    __tablename__ = "study_sessions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    task_id = Column(String, ForeignKey("tasks.id", ondelete="SET NULL"), nullable=True)
    subject_id = Column(String, ForeignKey("subjects.id", ondelete="SET NULL"), nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    ended_at = Column(DateTime, nullable=True)
    duration_minutes = Column(Integer, default=0)
    notes = Column(String, nullable=True)
    completed_objective = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    task = relationship("Task", back_populates="study_sessions")
