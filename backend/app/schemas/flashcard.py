from typing import Optional, List
from pydantic import BaseModel
from datetime import date, datetime

class FlashcardDeckBase(BaseModel):
    subject_id: str
    unit_id: Optional[str] = None
    title: str
    description: Optional[str] = None

class FlashcardDeckCreate(FlashcardDeckBase):
    pass

class FlashcardBase(BaseModel):
    question: str
    answer: str
    difficulty: Optional[str] = "medium"

class FlashcardCreate(FlashcardBase):
    deck_id: str
    subject_id: Optional[str] = None
    unit_id: Optional[str] = None

class FlashcardRead(FlashcardBase):
    id: str
    deck_id: str
    user_id: str
    subject_id: Optional[str] = None
    unit_id: Optional[str] = None
    interval_days: int
    repetition_count: int
    ease_factor: float
    next_review_date: date
    last_reviewed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

class FlashcardDeckRead(FlashcardDeckBase):
    id: str
    user_id: str
    created_at: datetime
    cards_count: int = 0
    due_today_count: int = 0
    subject_name: Optional[str] = None
    unit_title: Optional[str] = None

    class Config:
        from_attributes = True

class FlashcardReviewSubmit(BaseModel):
    rating: int # 0 to 5 for SuperMemo SM-2 algorithm

class GenerateFlashcardsRequest(BaseModel):
    subject_id: str
    unit_id: Optional[str] = None
    document_id: Optional[str] = None
    topic: Optional[str] = None
    count: Optional[int] = 10
    difficulty: Optional[str] = "mixed"
