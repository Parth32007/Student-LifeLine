import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, Integer, Numeric, Boolean, JSON, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class Quiz(Base):
    __tablename__ = "quizzes"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(String, ForeignKey("subjects.id", ondelete="SET NULL"), nullable=True)
    unit_id = Column(String, ForeignKey("subject_units.id", ondelete="SET NULL"), nullable=True)
    title = Column(String, nullable=False)
    topic = Column(String, nullable=True)
    difficulty = Column(String, default="medium") # easy, medium, hard
    time_limit_minutes = Column(Integer, default=15)
    is_mock_exam = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    questions = relationship("QuizQuestion", back_populates="quiz", cascade="all, delete-orphan")
    attempts = relationship("QuizAttempt", back_populates="quiz", cascade="all, delete-orphan")

class QuizQuestion(Base):
    __tablename__ = "quiz_questions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    quiz_id = Column(String, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    unit_id = Column(String, ForeignKey("subject_units.id", ondelete="SET NULL"), nullable=True)
    question_type = Column(String, default="mcq") # mcq, true_false, short_answer, coding
    question_text = Column(String, nullable=False)
    options = Column(JSON, default=list) # e.g. ["Option A", "Option B", ...]
    correct_answer = Column(String, nullable=False)
    explanation = Column(String, nullable=True)
    points = Column(Integer, default=1)

    quiz = relationship("Quiz", back_populates="questions")

class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    quiz_id = Column(String, ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    score = Column(Numeric(5, 2), default=0.0)
    max_score = Column(Numeric(5, 2), default=0.0)
    percentage = Column(Numeric(5, 2), default=0.0)
    time_taken_seconds = Column(Integer, default=0)
    completed_at = Column(DateTime, default=datetime.utcnow)

    quiz = relationship("Quiz", back_populates="attempts")
    answers = relationship("QuizAnswer", back_populates="attempt", cascade="all, delete-orphan")

class QuizAnswer(Base):
    __tablename__ = "quiz_answers"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    attempt_id = Column(String, ForeignKey("quiz_attempts.id", ondelete="CASCADE"), nullable=False)
    question_id = Column(String, ForeignKey("quiz_questions.id", ondelete="CASCADE"), nullable=False)
    user_answer = Column(String, nullable=True)
    is_correct = Column(Boolean, default=False)
    ai_feedback = Column(String, nullable=True)

    attempt = relationship("QuizAttempt", back_populates="answers")
