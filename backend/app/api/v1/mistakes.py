from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_current_user, AuthenticatedUser
from app.models.coding import MistakeNotebook
from app.models.subject import Subject
from app.models.quiz import Quiz, QuizQuestion
from app.schemas.mistake import MistakeNotebookRead, MistakeNotebookUpdate
from app.schemas.quiz import QuizRead, QuizQuestionRead

router = APIRouter()

@router.get("/", response_model=List[MistakeNotebookRead])
async def list_mistakes(
    mastered: Optional[bool] = None,
    subject_id: Optional[str] = None,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(MistakeNotebook).where(MistakeNotebook.user_id == user.id)
    if mastered is not None:
        stmt = stmt.where(MistakeNotebook.mastered == mastered)
    if subject_id:
        stmt = stmt.where(MistakeNotebook.subject_id == subject_id)
    stmt = stmt.order_by(MistakeNotebook.created_at.desc())
    res = await db.execute(stmt)
    mistakes = res.scalars().all()

    subj_ids = {m.subject_id for m in mistakes if m.subject_id}
    subj_map = {}
    if subj_ids:
        s_stmt = select(Subject).where(Subject.id.in_(list(subj_ids)))
        s_res = await db.execute(s_stmt)
        subj_map = {s.id: s.name for s in s_res.scalars().all()}

    results = []
    for m in mistakes:
        read_obj = MistakeNotebookRead.model_validate(m)
        if m.subject_id and m.subject_id in subj_map:
            read_obj.subject_name = subj_map[m.subject_id]
        results.append(read_obj)
    return results

@router.put("/{mistake_id}", response_model=MistakeNotebookRead)
async def update_mistake(
    mistake_id: str,
    payload: MistakeNotebookUpdate,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    mistake = await db.get(MistakeNotebook, mistake_id)
    if not mistake or mistake.user_id != user.id:
        raise HTTPException(status_code=404, detail="Mistake entry not found")

    if payload.mastered is not None:
        mistake.mastered = payload.mastered
        if payload.mastered:
            mistake.last_reviewed_at = datetime.utcnow()

    await db.commit()
    await db.refresh(mistake)

    read_obj = MistakeNotebookRead.model_validate(mistake)
    if mistake.subject_id:
        s = await db.get(Subject, mistake.subject_id)
        if s:
            read_obj.subject_name = s.name
    return read_obj

@router.post("/generate-targeted-quiz", response_model=QuizRead)
async def generate_quiz_from_mistakes(
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Creates a targeted reinforcement quiz focusing specifically on past unmastered mistakes.
    """
    stmt = select(MistakeNotebook).where(
        MistakeNotebook.user_id == user.id,
        MistakeNotebook.mastered == False
    ).limit(6)
    res = await db.execute(stmt)
    mistakes = res.scalars().all()

    if not mistakes:
        raise HTTPException(status_code=400, detail="No active mistakes in notebook to generate a quiz from. Great job!")

    quiz = Quiz(
        user_id=user.id,
        subject_id=mistakes[0].subject_id,
        title="Targeted Weak-Topic Reinforcement Quiz",
        topic="Mistake Notebook Concepts",
        difficulty="hard",
        time_limit_minutes=15,
        is_mock_exam=False
    )
    db.add(quiz)
    await db.flush()

    saved_questions = []
    for m in mistakes:
        qq = QuizQuestion(
            quiz_id=quiz.id,
            question_type="mcq",
            question_text=f"Reviewing past mistake on '{m.topic or 'Concept'}': {m.question_or_problem}",
            options=[
                f"Correct Approach: {m.correct_solution[:70]}",
                f"Previous Common Pitfall: {m.user_mistake[:70]}",
                "None of the above"
            ],
            correct_answer=f"Correct Approach: {m.correct_solution[:70]}",
            explanation=m.explanation or "Reinforce understanding of this core concept.",
            points=1
        )
        db.add(qq)
        saved_questions.append(qq)

    await db.commit()
    await db.refresh(quiz)

    return QuizRead(
        id=quiz.id,
        user_id=quiz.user_id,
        subject_id=quiz.subject_id,
        title=quiz.title,
        topic=quiz.topic,
        difficulty=quiz.difficulty,
        time_limit_minutes=quiz.time_limit_minutes,
        is_mock_exam=quiz.is_mock_exam,
        created_at=quiz.created_at,
        subject_name="Mistake Recovery",
        questions=[QuizQuestionRead.model_validate(qu) for qu in saved_questions]
    )
