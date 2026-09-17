import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, DateTime, Date, Integer, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base

class FlashcardDeck(Base):
    __tablename__ = "flashcard_decks"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(String, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=False)
    unit_id = Column(String, ForeignKey("subject_units.id", ondelete="SET NULL"), nullable=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    flashcards = relationship("Flashcard", back_populates="deck", cascade="all, delete-orphan")

class Flashcard(Base):
    __tablename__ = "flashcards"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    deck_id = Column(String, ForeignKey("flashcard_decks.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    subject_id = Column(String, ForeignKey("subjects.id", ondelete="CASCADE"), nullable=True)
    unit_id = Column(String, ForeignKey("subject_units.id", ondelete="SET NULL"), nullable=True)
    question = Column(String, nullable=False)
    answer = Column(String, nullable=False)
    difficulty = Column(String, default="medium") # easy, medium, hard
    interval_days = Column(Integer, default=1)
    repetition_count = Column(Integer, default=0)
    ease_factor = Column(Numeric(4, 2), default=2.50)
    next_review_date = Column(Date, default=date.today, nullable=False)
    last_reviewed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    deck = relationship("FlashcardDeck", back_populates="flashcards")

class FlashcardReview(Base):
    __tablename__ = "flashcard_reviews"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    flashcard_id = Column(String, ForeignKey("flashcards.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(String, ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    rating = Column(Integer, nullable=False) # 0 to 5 (SM-2 quality)
    review_date = Column(DateTime, default=datetime.utcnow)
