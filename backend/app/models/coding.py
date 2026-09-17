import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, DateTime, Date, Integer, Boolean, ForeignKey
from app.core.database import Base

class CodingProblem(Base):
    __tablename__ = "coding_problems"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    platform = Column(String, default="LeetCode") # LeetCode, Codeforces, HackerRank, GeeksforGeeks
    url = Column(String, nullable=True)
    topic = Column(String, nullable=False)        # Arrays, Trees, DP, Graphs, etc.
    difficulty = Column(String, default="medium") # easy, medium, hard
    language = Column(String, default="Python")
    status = Column(String, default="solved")     # solved, attempted, to_revise
    attempts_count = Column(Integer, default=1)
    notes = Column(String, nullable=True)
    solution_code = Column(String, nullable=True)
    solved_at = Column(Date, default=date.today)
    created_at = Column(DateTime, default=datetime.utcnow)

class MistakeNotebook(Base):
    __tablename__ = "mistake_notebook"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(String, ForeignKey("subjects.id", ondelete="SET NULL"), nullable=True)
    source_type = Column(String, default="quiz") # quiz, coding, flashcard
    question_or_problem = Column(String, nullable=False)
    user_mistake = Column(String, nullable=False)
    correct_solution = Column(String, nullable=False)
    explanation = Column(String, nullable=True)
    topic = Column(String, nullable=True)
    mistake_count = Column(Integer, default=1)
    mastered = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_reviewed_at = Column(DateTime, nullable=True)
