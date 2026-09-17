from typing import List
from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_current_user, AuthenticatedUser
from app.models.academic import StudyPlan, StudyPlanItem
from app.models.subject import Subject
from app.models.task import Task
from app.schemas.planner import StudyPlanRead, StudyPlanGenerateRequest, StudyPlanItemRead
from app.services.gemini_service import gemini_service

router = APIRouter()

@router.get("/", response_model=List[StudyPlanRead])
async def list_study_plans(
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(StudyPlan).where(StudyPlan.user_id == user.id).order_by(StudyPlan.created_at.desc())
    res = await db.execute(stmt)
    plans = res.scalars().all()

    results = []
    for p in plans:
        item_stmt = select(StudyPlanItem).where(StudyPlanItem.plan_id == p.id).order_by(StudyPlanItem.day_number.asc())
        i_res = await db.execute(item_stmt)
        items = i_res.scalars().all()
        p_read = StudyPlanRead(
            id=p.id,
            user_id=p.user_id,
            subject_id=p.subject_id,
            title=p.title,
            exam_date=p.exam_date,
            total_days=p.total_days,
            status=p.status,
            created_at=p.created_at,
            items=[StudyPlanItemRead.model_validate(it) for it in items]
        )
        results.append(p_read)
    return results

@router.get("/{plan_id}", response_model=StudyPlanRead)
async def get_study_plan(
    plan_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    plan = await db.get(StudyPlan, plan_id)
    if not plan or plan.user_id != user.id:
        raise HTTPException(status_code=404, detail="Study plan not found")

    item_stmt = select(StudyPlanItem).where(StudyPlanItem.plan_id == plan.id).order_by(StudyPlanItem.day_number.asc())
    i_res = await db.execute(item_stmt)
    items = i_res.scalars().all()

    return StudyPlanRead(
        id=plan.id,
        user_id=plan.user_id,
        subject_id=plan.subject_id,
        title=plan.title,
        exam_date=plan.exam_date,
        total_days=plan.total_days,
        status=plan.status,
        created_at=plan.created_at,
        items=[StudyPlanItemRead.model_validate(it) for it in items]
    )

@router.post("/generate", response_model=StudyPlanRead, status_code=status.HTTP_201_CREATED)
async def generate_study_plan(
    payload: StudyPlanGenerateRequest,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    subject = await db.get(Subject, payload.subject_id)
    if not subject or subject.user_id != user.id:
        raise HTTPException(status_code=404, detail="Subject not found")

    today = date.today()
    days_until_exam = (payload.exam_date - today).days
    if days_until_exam <= 0:
        days_until_exam = 7
        exam_date = today + timedelta(days=7)
    else:
        exam_date = payload.exam_date

    # Prepare prompt for Gemini
    syllabus_str = str(subject.syllabus_topics or ["Foundations", "Intermediate Problems", "Advanced Applications"])
    prompt = (
        f"You are the Student Lifeline Academic Planning Engine. Create an intensive, day-by-day exam preparation schedule.\n\n"
        f"Subject: {subject.name} (Code: {subject.code or 'N/A'})\n"
        f"Days Remaining: {days_until_exam} days\n"
        f"Daily Study Hours Available: {payload.daily_available_hours or 3.0} hours\n"
        f"Known Syllabus Topics: {syllabus_str}\n"
        f"Prioritized Topics: {payload.prioritized_topics or 'None specified'}\n\n"
        f"Generate a strict JSON array of {days_until_exam} items, one for each day. Format:\n"
        "[\n"
        "  {\n"
        "    \"day_number\": 1,\n"
        "    \"topics\": [\"Topic Name 1\", \"Topic Name 2\"],\n"
        "    \"time_allocation_minutes\": 180,\n"
        "    \"learning_objectives\": [\"Master definition of X\", \"Solve 3 numericals on Y\"],\n"
        "    \"practice_questions\": [\"Explain difference between A and B\", \"Derive formula for C\"]\n"
        "  }\n"
        "]\n"
        "Distribute syllabus logically: concept mastery -> problem solving -> mock test/revision on final 2 days."
    )

    ai_plan_items = await gemini_service.generate_json(prompt)

    # Fallback deterministic schedule if AI is unavailable
    if not ai_plan_items or not isinstance(ai_plan_items, list):
        ai_plan_items = []
        topics_list = subject.syllabus_topics or ["Foundations & Architecture", "Core Models & Algorithms", "Queries & Transactions", "Complex Applications & Mock Exam"]
        for d in range(1, days_until_exam + 1):
            curr_topic = topics_list[(d - 1) % len(topics_list)]
            ai_plan_items.append({
                "day_number": d,
                "topics": [str(curr_topic)],
                "time_allocation_minutes": int((payload.daily_available_hours or 3.0) * 60),
                "learning_objectives": [f"Deep dive into {curr_topic}", "Complete active recall questions"],
                "practice_questions": [f"Explain the primary mechanism of {curr_topic}"]
            })

    # Save StudyPlan
    new_plan = StudyPlan(
        user_id=user.id,
        subject_id=subject.id,
        title=f"{subject.name} — {days_until_exam}-Day Exam Countdown Plan",
        exam_date=exam_date,
        total_days=days_until_exam,
        status="active"
    )
    db.add(new_plan)
    await db.flush()

    created_items = []
    for item_data in ai_plan_items:
        plan_item = StudyPlanItem(
            plan_id=new_plan.id,
            day_number=item_data.get("day_number", 1),
            topics=item_data.get("topics", []),
            time_allocation_minutes=item_data.get("time_allocation_minutes", 120),
            learning_objectives=item_data.get("learning_objectives", []),
            practice_questions=item_data.get("practice_questions", [])
        )
        db.add(plan_item)
        created_items.append(plan_item)

    # If convert_to_tasks requested, convert upcoming days into real tasks in Today's Mission / calendar
    if payload.convert_to_tasks:
        for it in created_items:
            task_date = today + timedelta(days=it.day_number - 1)
            first_topic = it.topics[0] if it.topics else "Exam Prep"
            new_task = Task(
                user_id=user.id,
                subject_id=subject.id,
                title=f"Day {it.day_number}: {first_topic}",
                topic=str(first_topic),
                learning_objective="; ".join(it.learning_objectives) if it.learning_objectives else "Exam preparation",
                scheduled_date=task_date,
                estimated_duration_minutes=it.time_allocation_minutes,
                priority="high" if it.day_number >= (days_until_exam - 2) else "medium",
                difficulty="hard" if it.day_number >= (days_until_exam - 2) else "medium"
            )
            db.add(new_task)

    await db.commit()
    await db.refresh(new_plan)

    return StudyPlanRead(
        id=new_plan.id,
        user_id=new_plan.user_id,
        subject_id=new_plan.subject_id,
        title=new_plan.title,
        exam_date=new_plan.exam_date,
        total_days=new_plan.total_days,
        status=new_plan.status,
        created_at=new_plan.created_at,
        items=[StudyPlanItemRead.model_validate(it) for it in created_items]
    )
