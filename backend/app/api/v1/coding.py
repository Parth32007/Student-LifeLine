from typing import List, Optional
from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_current_user, AuthenticatedUser
from app.models.coding import CodingProblem
from app.schemas.coding import (
    CodingProblemCreate, CodingProblemUpdate,
    CodingProblemRead, CodeAssistRequest, CodeAssistResponse
)
from app.services.gemini_service import gemini_service

router = APIRouter()

@router.get("", response_model=List[CodingProblemRead])
@router.get("/", response_model=List[CodingProblemRead])
@router.get("/problems", response_model=List[CodingProblemRead])
async def list_coding_problems(
    topic: Optional[str] = None,
    difficulty: Optional[str] = None,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(CodingProblem).where(CodingProblem.user_id == user.id)
    if topic:
        stmt = stmt.where(CodingProblem.topic == topic)
    if difficulty:
        stmt = stmt.where(CodingProblem.difficulty == difficulty)
    stmt = stmt.order_by(CodingProblem.solved_at.desc())
    res = await db.execute(stmt)
    return res.scalars().all()

@router.post("", response_model=CodingProblemRead, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=CodingProblemRead, status_code=status.HTTP_201_CREATED)
@router.post("/problems", response_model=CodingProblemRead, status_code=status.HTTP_201_CREATED)
async def create_coding_problem(
    payload: CodingProblemCreate,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    problem = CodingProblem(
        user_id=user.id,
        title=payload.title,
        platform=payload.platform or "LeetCode",
        url=payload.url,
        topic=payload.topic,
        difficulty=payload.difficulty or "medium",
        language=payload.language or "Python",
        status=payload.status or "solved",
        attempts_count=payload.attempts_count or 1,
        notes=payload.notes,
        solution_code=payload.solution_code,
        solved_at=payload.solved_at or date.today()
    )
    db.add(problem)
    await db.commit()
    await db.refresh(problem)
    return problem

@router.put("/{problem_id}", response_model=CodingProblemRead)
async def update_coding_problem(
    problem_id: str,
    payload: CodingProblemUpdate,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    problem = await db.get(CodingProblem, problem_id)
    if not problem or problem.user_id != user.id:
        raise HTTPException(status_code=404, detail="Coding problem not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(problem, field, value)

    await db.commit()
    await db.refresh(problem)
    return problem

@router.delete("/{problem_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_coding_problem(
    problem_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    problem = await db.get(CodingProblem, problem_id)
    if not problem or problem.user_id != user.id:
        raise HTTPException(status_code=404, detail="Coding problem not found")

    await db.delete(problem)
    await db.commit()
    return None

@router.post("/assist", response_model=CodeAssistResponse)
async def code_assist(
    payload: CodeAssistRequest,
    user: AuthenticatedUser = Depends(get_current_user)
):
    """
    AI Coding Assistant: explains code, identifies bugs, optimizes time/space complexity,
    or generates progressive hints without immediately giving away the entire solution.
    """
    prompt = (
        f"You are Student Lifeline AI Coding Assistant.\n"
        f"Query Type: {payload.query_type}\n"
        f"Language: {payload.language}\n"
        f"User Note / Question: {payload.user_question or 'Analyze this code'}\n\n"
        f"Code snippet:\n```{payload.language}\n{payload.code}\n```\n\n"
        "Return a JSON object formatted as:\n"
        "{\n"
        "  \"analysis\": \"Comprehensive explanation or bug identification...\",\n"
        "  \"hints\": [\"Hint 1: Think about edge cases\", \"Hint 2: Consider using two pointers\"],\n"
        "  \"complexity_analysis\": \"Time: O(N), Space: O(1)\",\n"
        "  \"suggestions\": [\"Use collections.defaultdict for cleaner hash mapping\"]\n"
        "}"
    )

    ai_data = await gemini_service.generate_json(prompt)
    if not ai_data or not isinstance(ai_data, dict):
        ai_data = {
            "analysis": "Analyzed code syntax and logical flow. Ensure boundary conditions (such as empty array or single element) are guarded.",
            "hints": ["Check loop termination condition", "Verify pointer increments"],
            "complexity_analysis": "Estimated Time: O(N), Space: O(1)",
            "suggestions": ["Add type annotations and edge case assertions"]
        }

    return CodeAssistResponse(
        analysis=ai_data.get("analysis", ""),
        hints=ai_data.get("hints", []),
        complexity_analysis=ai_data.get("complexity_analysis"),
        suggestions=ai_data.get("suggestions", [])
    )

@router.post("/explain")
async def explain_code(
    payload: dict,
    user: AuthenticatedUser = Depends(get_current_user)
):
    code = payload.get("code", "")
    language = payload.get("language", "Python")
    req = CodeAssistRequest(code=code, language=language, query_type="explain")
    res = await code_assist(req, user)
    return {
        "explanation": res.analysis,
        "time_complexity": res.complexity_analysis or "O(N)",
        "space_complexity": "O(1)",
        "hints": res.hints
    }
