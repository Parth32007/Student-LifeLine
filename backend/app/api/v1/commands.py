from datetime import date, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_current_user, AuthenticatedUser
from app.models.task import Task
from app.models.subject import Subject
from app.models.coding import MistakeNotebook
from app.schemas.command import CommandExecuteRequest, CommandExecuteResponse
from app.services.gemini_service import gemini_service
from app.services.scheduler_service import scheduler_service

router = APIRouter()

@router.post("/execute", response_model=CommandExecuteResponse)
async def execute_natural_language_command(
    payload: CommandExecuteRequest,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Standout Feature J: Natural Language Command Center.
    Interprets natural language student commands and executes validated backend functions.
    """
    cmd = payload.command.strip()

    # Fast heuristic matches for speed
    cmd_lower = cmd.lower()

    if "what should i study" in cmd_lower or "study now" in cmd_lower:
        rec = await scheduler_service.what_should_i_study_now(db, user.id)
        return CommandExecuteResponse(
            intent="study_recommendation",
            message=f"Recommended: {rec.title} ({rec.recommended_duration_minutes}m). Reason: {rec.reason}",
            action_taken=True,
            data=rec.model_dump()
        )

    if "weak" in cmd_lower or "mistake" in cmd_lower:
        m_stmt = select(MistakeNotebook).where(
            MistakeNotebook.user_id == user.id,
            MistakeNotebook.mastered == False
        )
        m_res = await db.execute(m_stmt)
        mistakes = m_res.scalars().all()
        topics = list({m.topic for m in mistakes if m.topic})
        msg = f"Your current weakest topics based on quiz mistakes: {', '.join(topics) if topics else 'None identified yet! All clear.'}"
        return CommandExecuteResponse(
            intent="query_weak_topics",
            message=msg,
            action_taken=True,
            data={"weak_topics": topics}
        )

    # Use Gemini to parse structured intent
    prompt = (
        f"You are Student Lifeline Command Parser. Interpret this user command:\n\"{cmd}\"\n\n"
        "Respond with strict JSON formatted as:\n"
        "{\n"
        "  \"intent\": \"add_task\" | \"plan_exam\" | \"general_answer\",\n"
        "  \"task_title\": \"...\",\n"
        "  \"duration_minutes\": 30,\n"
        "  \"subject_name\": \"...\",\n"
        "  \"days_until_exam\": 7,\n"
        "  \"message\": \"Concise confirmation message\"\n"
        "}"
    )
    parsed = await gemini_service.generate_json(prompt)
    if not parsed or not isinstance(parsed, dict):
        return CommandExecuteResponse(
            intent="general_answer",
            message=f"I've noted your command: '{cmd}'. Try asking to add a task, plan an exam, or check weak topics.",
            action_taken=False
        )

    intent = parsed.get("intent", "general_answer")

    if intent == "add_task":
        # Create task directly
        title = parsed.get("task_title") or cmd
        duration = parsed.get("duration_minutes") or 45

        # Check if subject matches
        subj_name = parsed.get("subject_name")
        subject_id = None
        if subj_name:
            s_stmt = select(Subject).where(Subject.user_id == user.id)
            s_res = await db.execute(s_stmt)
            for s in s_res.scalars().all():
                if subj_name.lower() in s.name.lower():
                    subject_id = s.id
                    break

        new_task = Task(
            user_id=user.id,
            subject_id=subject_id,
            title=title,
            scheduled_date=date.today(),
            estimated_duration_minutes=duration,
            priority="high",
            status="pending"
        )
        db.add(new_task)
        await db.commit()
        await db.refresh(new_task)

        return CommandExecuteResponse(
            intent="add_task",
            message=f"Successfully added task '{title}' ({duration} mins) to Today's Mission!",
            action_taken=True,
            data={"task_id": new_task.id, "title": title}
        )

    return CommandExecuteResponse(
        intent=intent,
        message=parsed.get("message", "Command processed successfully."),
        action_taken=True,
        data=parsed
    )
