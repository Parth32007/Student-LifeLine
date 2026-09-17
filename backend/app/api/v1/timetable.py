from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_current_user, AuthenticatedUser
from app.models.academic import TimetableEvent
from app.models.subject import Subject
from app.schemas.timetable import TimetableEventCreate, TimetableEventRead

router = APIRouter()

@router.get("/", response_model=List[TimetableEventRead])
async def list_timetable_events(
    day_of_week: Optional[int] = None,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(TimetableEvent).where(TimetableEvent.user_id == user.id)
    if day_of_week is not None:
        stmt = stmt.where(TimetableEvent.day_of_week == day_of_week)
    stmt = stmt.order_by(TimetableEvent.day_of_week.asc(), TimetableEvent.start_time.asc())
    res = await db.execute(stmt)
    events = res.scalars().all()

    subj_ids = {e.subject_id for e in events if e.subject_id}
    subj_map = {}
    if subj_ids:
        s_stmt = select(Subject).where(Subject.id.in_(list(subj_ids)))
        s_res = await db.execute(s_stmt)
        subj_map = {s.id: s for s in s_res.scalars().all()}

    results = []
    for e in events:
        read_obj = TimetableEventRead.model_validate(e)
        if e.subject_id and e.subject_id in subj_map:
            read_obj.subject_name = subj_map[e.subject_id].name
            read_obj.subject_color = subj_map[e.subject_id].color
        results.append(read_obj)
    return results

@router.post("/", response_model=TimetableEventRead, status_code=status.HTTP_201_CREATED)
async def create_timetable_event(
    payload: TimetableEventCreate,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    event = TimetableEvent(
        user_id=user.id,
        subject_id=payload.subject_id,
        title=payload.title,
        day_of_week=payload.day_of_week,
        start_time=payload.start_time,
        end_time=payload.end_time,
        location=payload.location,
        is_recurring=payload.is_recurring if payload.is_recurring is not None else True
    )
    db.add(event)
    await db.commit()
    await db.refresh(event)

    read_obj = TimetableEventRead.model_validate(event)
    if event.subject_id:
        s = await db.get(Subject, event.subject_id)
        if s:
            read_obj.subject_name = s.name
            read_obj.subject_color = s.color
    return read_obj

@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_timetable_event(
    event_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    event = await db.get(TimetableEvent, event_id)
    if not event or event.user_id != user.id:
        raise HTTPException(status_code=404, detail="Timetable event not found")

    await db.delete(event)
    await db.commit()
    return None
