from typing import Optional, List, Any
from pydantic import BaseModel
from datetime import datetime

class QuizQuestionRead(BaseModel):
    id: str
    unit_id: Optional[str] = None
    question_type: str
    question_text: str
    options: List[str] = []
    points: int = 1
    # correct_answer and explanation hidden during taking quiz unless review mode

    class Config:
        from_attributes = True

class QuizRead(BaseModel):
    id: str
    user_id: str
    subject_id: Optional[str] = None
    unit_id: Optional[str] = None
    title: str
    topic: Optional[str] = None
    difficulty: str
    time_limit_minutes: int
    is_mock_exam: bool
    created_at: datetime
    questions: List[QuizQuestionRead] = []
    subject_name: Optional[str] = None
    unit_title: Optional[str] = None

    class Config:
        from_attributes = True

class QuizGenerateRequest(BaseModel):
    subject_id: str
    unit_id: Optional[str] = None
    topic: Optional[str] = None
    document_id: Optional[str] = None
    difficulty: Optional[str] = "medium"
    num_questions: Optional[int] = 5
    question_types: Optional[List[str]] = ["mcq", "true_false", "short_answer"]
    time_limit_minutes: Optional[int] = 15
    is_mock_exam: Optional[bool] = False

class QuizAnswerSubmission(BaseModel):
    question_id: str
    user_answer: str

class QuizSubmitRequest(BaseModel):
    quiz_id: Optional[str] = None
    time_taken_seconds: int
    answers: List[QuizAnswerSubmission]

class EvaluatedAnswer(BaseModel):
    question_id: str
    question_text: str
    user_answer: str
    correct_answer: str
    is_correct: bool
    explanation: Optional[str] = None
    ai_feedback: Optional[str] = None

class QuizResultRead(BaseModel):
    attempt_id: str
    quiz_id: str
    score: float
    max_score: float
    percentage: float
    time_taken_seconds: int
    completed_at: datetime
    results: List[EvaluatedAnswer] = []
    weak_topics: Optional[List[str]] = []
