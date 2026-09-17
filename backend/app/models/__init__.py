from app.core.database import Base
from app.models.user import Profile, AcademicProfile
from app.models.subject import Subject, SubjectUnit
from app.models.task import Task, StudySession
from app.models.academic import TimetableEvent, Assignment, StudyPlan, StudyPlanItem
from app.models.document import Document, DocumentChunk, YouTubeResource
from app.models.flashcard import FlashcardDeck, Flashcard, FlashcardReview
from app.models.quiz import Quiz, QuizQuestion, QuizAttempt, QuizAnswer
from app.models.coding import CodingProblem, MistakeNotebook
from app.models.tutor import Conversation, Message
from app.models.analytics import WeeklyReview, Notification

__all__ = [
    "Base",
    "Profile",
    "AcademicProfile",
    "Subject",
    "Task",
    "StudySession",
    "TimetableEvent",
    "Assignment",
    "StudyPlan",
    "StudyPlanItem",
    "Document",
    "DocumentChunk",
    "YouTubeResource",
    "FlashcardDeck",
    "Flashcard",
    "FlashcardReview",
    "Quiz",
    "QuizQuestion",
    "QuizAttempt",
    "QuizAnswer",
    "CodingProblem",
    "MistakeNotebook",
    "Conversation",
    "Message",
    "WeeklyReview",
    "Notification",
]
