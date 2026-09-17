import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, DateTime, Date, Numeric, Boolean, JSON, ForeignKey
from app.core.database import Base

class WeeklyReview(Base):
    __tablename__ = "weekly_reviews"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    week_start_date = Column(Date, nullable=False)
    planned_hours = Column(Numeric(5, 2), default=0.0)
    completed_hours = Column(Numeric(5, 2), default=0.0)
    completion_rate = Column(Numeric(5, 2), default=0.0)
    most_studied_subject = Column(String, nullable=True)
    weak_topics = Column(JSON, default=list)
    ai_insights = Column(String, nullable=True)
    next_week_goals = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    type = Column(String, default="info") # info, warning, success, reminder
    read = Column(Boolean, default=False)
    link = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
