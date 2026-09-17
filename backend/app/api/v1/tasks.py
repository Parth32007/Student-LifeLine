from typing import List, Optional
from datetime import date, datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from app.core.database import get_db
from app.core.security import get_current_user, AuthenticatedUser
from app.models.task import Task
from app.models.subject import Subject
from app.models.user import AcademicProfile
from app.schemas.task import (
    TaskCreate, TaskUpdate, TaskRead,
    MissionGenerateRequest, WhatToStudyNowResponse, MissedDayRecoveryRequest
)
from app.services.scheduler_service import scheduler_service
from app.services.gemini_service import gemini_service

router = APIRouter()

async def attach_subject_info(db: AsyncSession, tasks: List[Task]) -> List[TaskRead]:
    # Collect subject IDs
    subj_ids = {t.subject_id for t in tasks if t.subject_id}
    subj_map = {}
    if subj_ids:
        s_stmt = select(Subject).where(Subject.id.in_(list(subj_ids)))
        s_res = await db.execute(s_stmt)
        subj_map = {s.id: s for s in s_res.scalars().all()}

    results = []
    for t in tasks:
        item = TaskRead.model_validate(t)
        if t.subject_id and t.subject_id in subj_map:
            item.subject_name = subj_map[t.subject_id].name
            item.subject_color = subj_map[t.subject_id].color
        results.append(item)
    return results

@router.get("/", response_model=List[TaskRead])
async def list_tasks(
    scheduled_date: Optional[date] = None,
    status_filter: Optional[str] = None,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Task).where(Task.user_id == user.id)
    if scheduled_date:
        stmt = stmt.where(Task.scheduled_date == scheduled_date)
    if status_filter:
        stmt = stmt.where(Task.status == status_filter)
    stmt = stmt.order_by(Task.start_time.asc().nulls_last(), Task.priority.desc())

    res = await db.execute(stmt)
    tasks = res.scalars().all()
    return await attach_subject_info(db, tasks)

@router.get("/today", response_model=List[TaskRead])
async def get_todays_mission(
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    today = date.today()
    stmt = select(Task).where(
        and_(Task.user_id == user.id, Task.scheduled_date == today)
    ).order_by(Task.start_time.asc().nulls_last(), Task.priority.desc())
    res = await db.execute(stmt)
    tasks = res.scalars().all()
    return await attach_subject_info(db, tasks)

@router.post("/generate-mission", response_model=List[TaskRead])
async def generate_todays_mission(
    payload: MissionGenerateRequest,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Generates or adapts Today's Mission study schedule dynamically.
    Balances tasks around fixed timetable events and preferred study hours.
    """
    target_date = payload.target_date or date.today()

    stmt = select(Task).where(
        and_(Task.user_id == user.id, Task.scheduled_date == target_date)
    )
    res = await db.execute(stmt)
    existing_tasks = res.scalars().all()

    # If no tasks exist for target_date or force_regenerate, pull from backlog or generate from syllabus
    if not existing_tasks or payload.force_regenerate:
        # Check if there are unassigned pending tasks
        pending_stmt = select(Task).where(
            and_(
                Task.user_id == user.id,
                Task.status == "pending",
                or_(Task.scheduled_date == target_date, Task.scheduled_date < target_date)
            )
        )
        p_res = await db.execute(pending_stmt)
        tasks_to_balance = p_res.scalars().all()

        if not tasks_to_balance:
            # Create starter mission tasks from user's subjects
            subj_stmt = select(Subject).where(Subject.user_id == user.id)
            s_res = await db.execute(subj_stmt)
            subjects = s_res.scalars().all()

            if subjects:
                for subj in subjects[:3]:
                    sample_task = Task(
                        user_id=user.id,
                        subject_id=subj.id,
                        title=f"{subj.name} — Core Concepts & Problem Solving",
                        topic="Unit 1 Foundations",
                        learning_objective="Master key definitions and solve 2 practice problems",
                        scheduled_date=target_date,
                        estimated_duration_minutes=45,
                        priority="high",
                        difficulty="medium"
                    )
                    db.add(sample_task)
                await db.commit()

                res_new = await db.execute(stmt)
                tasks_to_balance = res_new.scalars().all()

        existing_tasks = tasks_to_balance

    # Apply deterministic adaptive scheduling engine
    balanced = await scheduler_service.balance_tasks_for_day(
        db=db,
        user_id=user.id,
        target_date=target_date,
        tasks=existing_tasks
    )
    return await attach_subject_info(db, balanced)

@router.get("/what-to-study-now", response_model=WhatToStudyNowResponse)
async def what_to_study_now(
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Standout Feature B: Persistent AI recommendation based on current time,
    remaining hours, weak topics, and due reviews.
    """
    return await scheduler_service.what_should_i_study_now(db, user.id)

@router.post("/missed-day-recovery", response_model=List[TaskRead])
async def missed_day_recovery(
    payload: MissedDayRecoveryRequest,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Standout Feature D: Recalculates unfinished tasks from a missed day
    and distributes them smoothly over upcoming days without overloading.
    """
    stmt = select(Task).where(
        and_(
            Task.user_id == user.id,
            Task.scheduled_date == payload.missed_date,
            Task.status.in_(["pending", "skipped"])
        )
    )
    res = await db.execute(stmt)
    missed_tasks = res.scalars().all()

    today = date.today()
    days_to_distribute = max(1, payload.distribute_over_days or 3)

    for idx, t in enumerate(missed_tasks):
        offset = (idx % days_to_distribute) + 1
        t.scheduled_date = today + timedelta(days=offset)
        t.status = "pending"
        t.priority = "urgent" if t.priority == "high" else "high"

    await db.commit()
    return await attach_subject_info(db, missed_tasks)

@router.post("/", response_model=TaskRead, status_code=status.HTTP_201_CREATED)
async def create_task(
    payload: TaskCreate,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    task = Task(
        user_id=user.id,
        subject_id=payload.subject_id,
        title=payload.title,
        topic=payload.topic,
        learning_objective=payload.learning_objective,
        recommended_resource=payload.recommended_resource,
        scheduled_date=payload.scheduled_date or date.today(),
        start_time=payload.start_time,
        end_time=payload.end_time,
        estimated_duration_minutes=payload.estimated_duration_minutes or 45,
        priority=payload.priority or "medium",
        difficulty=payload.difficulty or "medium",
        status=payload.status or "pending",
        is_locked=payload.is_locked or False
    )
    db.add(task)
    await db.commit()
    await db.refresh(task)

    results = await attach_subject_info(db, [task])
    return results[0]

@router.put("/{task_id}", response_model=TaskRead)
async def update_task(
    task_id: str,
    payload: TaskUpdate,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    task = await db.get(Task, task_id)
    if not task or task.user_id != user.id:
        raise HTTPException(status_code=404, detail="Task not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(task, field, value)

    await db.commit()
    await db.refresh(task)

    results = await attach_subject_info(db, [task])
    return results[0]

@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(
    task_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    task = await db.get(Task, task_id)
    if not task or task.user_id != user.id:
        raise HTTPException(status_code=404, detail="Task not found")

    await db.delete(task)
    await db.commit()
    return None
