import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Integer, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Subject(Base):
    __tablename__ = "subjects"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    code = Column(String, nullable=True)
    color = Column(String, default="#3B82F6")
    target_grade = Column(String, default="A")
    credits = Column(Integer, default=3)
    syllabus_topics = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

    profile = relationship("Profile", back_populates="subjects")
    tasks = relationship("Task", back_populates="subject")
    units = relationship("SubjectUnit", back_populates="subject", cascade="all, delete-orphan", order_by="SubjectUnit.unit_number")

class SubjectUnit(Base):
    __tablename__ = "subject_units"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    subject_id = Column(String, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    unit_number = Column(Integer, nullable=False, default=1)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    topics = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

    subject = relationship("Subject", back_populates="units")

