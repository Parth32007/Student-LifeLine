import uuid
from datetime import datetime, time
from sqlalchemy import Column, String, DateTime, Time, Integer, Numeric, Boolean, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.core.database import Base

class Profile(Base):
    __tablename__ = "profiles"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    full_name = Column(String, nullable=False, default="Student")
    avatar_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    academic_profile = relationship("AcademicProfile", back_populates="profile", uselist=False, cascade="all, delete-orphan")
    subjects = relationship("Subject", back_populates="profile", cascade="all, delete-orphan")
    tasks = relationship("Task", back_populates="profile", cascade="all, delete-orphan")

class AcademicProfile(Base):
    __tablename__ = "academic_profiles"

    user_id = Column(String, ForeignKey("profiles.id", ondelete="CASCADE"), primary_key=True)
    education_level = Column(String, default="Undergraduate")
    college_university = Column(String, nullable=True)
    course = Column(String, nullable=True)
    semester = Column(Integer, default=1)
    preferred_study_hours_start = Column(String, default="09:00:00")
    preferred_study_hours_end = Column(String, default="22:00:00")
    daily_available_hours = Column(Numeric(4, 2), default=4.0)
    break_duration_minutes = Column(Integer, default=15)
    goals = Column(JSON, default=list)
    onboarding_completed = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    profile = relationship("Profile", back_populates="academic_profile")
