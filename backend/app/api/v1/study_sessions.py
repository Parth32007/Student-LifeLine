from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_current_user, AuthenticatedUser
from app.models.task import StudySession, Task
from app.schemas.study_session import StudySessionCreate, StudySessionEnd, StudySessionRead

router = APIRouter()

@router.post("/start", response_model=StudySessionRead)
async def start_study_session(
    payload: StudySessionCreate,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    session = StudySession(
        user_id=user.id,
        task_id=payload.task_id,
        subject_id=payload.subject_id,
        started_at=datetime.utcnow(),
        notes=payload.notes
    )
    db.add(session)

    # If task is attached, mark status as in_progress
    if payload.task_id:
        task = await db.get(Task, payload.task_id)
        if task and task.user_id == user.id:
            task.status = "in_progress"

    await db.commit()
    await db.refresh(session)
    return session

@router.post("/{session_id}/end", response_model=StudySessionRead)
async def end_study_session(
    session_id: str,
    payload: StudySessionEnd,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    session = await db.get(StudySession, session_id)
    if not session or session.user_id != user.id:
        raise HTTPException(status_code=404, detail="Session not found")

    session.ended_at = datetime.utcnow()
    session.duration_minutes = payload.duration_minutes
    if payload.notes:
        session.notes = payload.notes
    session.completed_objective = payload.completed_objective if payload.completed_objective is not None else True

    # If task attached, add duration and mark completed if objective met
    if session.task_id:
        task = await db.get(Task, session.task_id)
        if task and task.user_id == user.id:
            task.actual_duration_minutes = (task.actual_duration_minutes or 0) + payload.duration_minutes
            if session.completed_objective:
                task.status = "completed"

    await db.commit()
    await db.refresh(session)
    return session

@router.get("/", response_model=List[StudySessionRead])
async def list_study_sessions(
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(StudySession).where(StudySession.user_id == user.id).order_by(StudySession.started_at.desc()).limit(50)
    res = await db.execute(stmt)
    return res.scalars().all()
