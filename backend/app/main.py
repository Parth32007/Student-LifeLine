import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.core.database import engine, Base
import app.models # Register all models

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("lifeos.main")

# Import all API routers
from app.api.v1.profile import router as profile_router
from app.api.v1.subjects import router as subjects_router
from app.api.v1.tasks import router as tasks_router
from app.api.v1.study_sessions import router as study_sessions_router
from app.api.v1.planner import router as planner_router
from app.api.v1.tutor import router as tutor_router
from app.api.v1.documents import router as documents_router
from app.api.v1.youtube import router as youtube_router
from app.api.v1.flashcards import router as flashcards_router
from app.api.v1.quizzes import router as quizzes_router
from app.api.v1.coding import router as coding_router
from app.api.v1.mistakes import router as mistakes_router
from app.api.v1.timetable import router as timetable_router
from app.api.v1.assignments import router as assignments_router
from app.api.v1.analytics import router as analytics_router
from app.api.v1.commands import router as commands_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables if running on local SQLite fallback
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database initialized successfully.")
    except Exception as e:
        logger.warning(f"Database initialization notice: {e}")
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Student Lifeline API: Powering adaptive student planning, spaced repetition, RAG document tutoring, and exam readiness.",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global error on {request.url}: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": f"Internal Server Error: {str(exc)}"}
    )

# Register API Routers
v1_str = settings.API_V1_STR
app.include_router(profile_router, prefix=f"{v1_str}/profile", tags=["Profile & Onboarding"])
app.include_router(subjects_router, prefix=f"{v1_str}/subjects", tags=["Subjects"])
app.include_router(tasks_router, prefix=f"{v1_str}/tasks", tags=["Tasks & Today's Mission"])
app.include_router(study_sessions_router, prefix=f"{v1_str}/study-sessions", tags=["Focus & Study Sessions"])
app.include_router(planner_router, prefix=f"{v1_str}/planner", tags=["AI Academic Planner"])
app.include_router(tutor_router, prefix=f"{v1_str}/tutor", tags=["AI Tutor (Gemini RAG)"])
app.include_router(documents_router, prefix=f"{v1_str}/documents", tags=["Knowledge Vault"])
app.include_router(youtube_router, prefix=f"{v1_str}/youtube", tags=["YouTube Intelligence"])
app.include_router(flashcards_router, prefix=f"{v1_str}/flashcards", tags=["Spaced Repetition Flashcards"])
app.include_router(quizzes_router, prefix=f"{v1_str}/quizzes", tags=["AI Quizzes & Mock Exams"])
app.include_router(coding_router, prefix=f"{v1_str}/coding", tags=["Coding Tracker & Assistant"])
app.include_router(mistakes_router, prefix=f"{v1_str}/mistakes", tags=["Mistake Notebook"])
app.include_router(timetable_router, prefix=f"{v1_str}/timetable", tags=["Timetable"])
app.include_router(assignments_router, prefix=f"{v1_str}/assignments", tags=["Assignments"])
app.include_router(analytics_router, prefix=f"{v1_str}/analytics", tags=["Analytics & Exam Readiness"])
app.include_router(commands_router, prefix=f"{v1_str}/commands", tags=["Natural Language Command Center"])

@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "healthy",
        "app": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "gemini_configured": bool(settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "your-google-gemini-api-key"),
        "database_connected": bool(settings.DATABASE_URL)
    }

@app.get("/", tags=["System"])
async def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API",
        "docs_url": "/docs",
        "version": settings.VERSION
    }
