from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_current_user, AuthenticatedUser
from app.models.academic import Assignment
from app.models.subject import Subject
from app.schemas.assignment import AssignmentCreate, AssignmentUpdate, AssignmentRead

router = APIRouter()

@router.get("/", response_model=List[AssignmentRead])
async def list_assignments(
    status_filter: Optional[str] = None,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Assignment).where(Assignment.user_id == user.id)
    if status_filter:
        stmt = stmt.where(Assignment.status == status_filter)
    stmt = stmt.order_by(Assignment.due_date.asc())
    res = await db.execute(stmt)
    assignments = res.scalars().all()

    subj_ids = {a.subject_id for a in assignments if a.subject_id}
    subj_map = {}
    if subj_ids:
        s_stmt = select(Subject).where(Subject.id.in_(list(subj_ids)))
        s_res = await db.execute(s_stmt)
        subj_map = {s.id: s for s in s_res.scalars().all()}

    results = []
    for a in assignments:
        read_obj = AssignmentRead.model_validate(a)
        if a.subject_id and a.subject_id in subj_map:
            read_obj.subject_name = subj_map[a.subject_id].name
            read_obj.subject_color = subj_map[a.subject_id].color
        results.append(read_obj)
    return results

@router.post("/", response_model=AssignmentRead, status_code=status.HTTP_201_CREATED)
async def create_assignment(
    payload: AssignmentCreate,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    assignment = Assignment(
        user_id=user.id,
        subject_id=payload.subject_id,
        title=payload.title,
        description=payload.description,
        due_date=payload.due_date,
        priority=payload.priority or "high",
        status=payload.status or "todo",
        estimated_effort_hours=payload.estimated_effort_hours or 2.0,
        subtasks=payload.subtasks or []
    )
    db.add(assignment)
    await db.commit()
    await db.refresh(assignment)

    read_obj = AssignmentRead.model_validate(assignment)
    if assignment.subject_id:
        s = await db.get(Subject, assignment.subject_id)
        if s:
            read_obj.subject_name = s.name
            read_obj.subject_color = s.color
    return read_obj

@router.put("/{assignment_id}", response_model=AssignmentRead)
async def update_assignment(
    assignment_id: str,
    payload: AssignmentUpdate,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    assignment = await db.get(Assignment, assignment_id)
    if not assignment or assignment.user_id != user.id:
        raise HTTPException(status_code=404, detail="Assignment not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(assignment, field, value)

    await db.commit()
    await db.refresh(assignment)

    read_obj = AssignmentRead.model_validate(assignment)
    if assignment.subject_id:
        s = await db.get(Subject, assignment.subject_id)
        if s:
            read_obj.subject_name = s.name
            read_obj.subject_color = s.color
    return read_obj

@router.delete("/{assignment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_assignment(
    assignment_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    assignment = await db.get(Assignment, assignment_id)
    if not assignment or assignment.user_id != user.id:
        raise HTTPException(status_code=404, detail="Assignment not found")

    await db.delete(assignment)
    await db.commit()
    return None
