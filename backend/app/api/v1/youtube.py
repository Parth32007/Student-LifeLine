from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_current_user, AuthenticatedUser
from app.models.document import YouTubeResource
from app.models.subject import Subject
from app.models.flashcard import FlashcardDeck, Flashcard
from app.schemas.youtube import YouTubeAnalyzeRequest, YouTubeResourceRead
from app.services.youtube_service import youtube_service

router = APIRouter()

@router.get("/", response_model=List[YouTubeResourceRead])
async def list_youtube_resources(
    subject_id: Optional[str] = None,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(YouTubeResource).where(YouTubeResource.user_id == user.id)
    if subject_id:
        stmt = stmt.where(YouTubeResource.subject_id == subject_id)
    stmt = stmt.order_by(YouTubeResource.created_at.desc())
    res = await db.execute(stmt)
    resources = res.scalars().all()

    subj_ids = {r.subject_id for r in resources if r.subject_id}
    subj_map = {}
    if subj_ids:
        s_stmt = select(Subject).where(Subject.id.in_(list(subj_ids)))
        s_res = await db.execute(s_stmt)
        subj_map = {s.id: s.name for s in s_res.scalars().all()}

    results = []
    for r in resources:
        read_obj = YouTubeResourceRead.model_validate(r)
        if r.subject_id and r.subject_id in subj_map:
            read_obj.subject_name = subj_map[r.subject_id]
        results.append(read_obj)
    return results

@router.post("/analyze", response_model=YouTubeResourceRead, status_code=status.HTTP_201_CREATED)
async def analyze_and_save_video(
    payload: YouTubeAnalyzeRequest,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    try:
        data = await youtube_service.analyze_lecture(
            url=payload.url,
            custom_notes=payload.custom_notes
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    resource = YouTubeResource(
        user_id=user.id,
        subject_id=payload.subject_id,
        url=payload.url,
        video_id=data["video_id"],
        title=data["title"],
        thumbnail_url=data["thumbnail_url"],
        transcript=data["transcript"],
        summary=data["summary"],
        key_concepts=data["key_concepts"],
        timestamps=data["timestamps"],
        is_watched="false"
    )
    db.add(resource)
    await db.flush()

    # If flashcards were generated and subject is provided, save them into a lecture deck
    if data.get("generated_flashcards") and payload.subject_id:
        deck = FlashcardDeck(
            user_id=user.id,
            subject_id=payload.subject_id,
            title=f"Flashcards: {data['title'][:40]}",
            description="Auto-generated from YouTube lecture"
        )
        db.add(deck)
        await db.flush()

        for card in data["generated_flashcards"]:
            fc = Flashcard(
                deck_id=deck.id,
                user_id=user.id,
                question=card.get("question", "Concept"),
                answer=card.get("answer", "Explanation"),
                difficulty="medium"
            )
            db.add(fc)

    await db.commit()
    await db.refresh(resource)

    read_obj = YouTubeResourceRead.model_validate(resource)
    if resource.subject_id:
        s = await db.get(Subject, resource.subject_id)
        if s:
            read_obj.subject_name = s.name
    return read_obj

@router.put("/{resource_id}/toggle-watched", response_model=YouTubeResourceRead)
async def toggle_watched_status(
    resource_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    resource = await db.get(YouTubeResource, resource_id)
    if not resource or resource.user_id != user.id:
        raise HTTPException(status_code=404, detail="Resource not found")

    resource.is_watched = "false" if resource.is_watched == "true" else "true"
    await db.commit()
    await db.refresh(resource)

    read_obj = YouTubeResourceRead.model_validate(resource)
    if resource.subject_id:
        s = await db.get(Subject, resource.subject_id)
        if s:
            read_obj.subject_name = s.name
    return read_obj

@router.delete("/{resource_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_youtube_resource(
    resource_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    resource = await db.get(YouTubeResource, resource_id)
    if not resource or resource.user_id != user.id:
        raise HTTPException(status_code=404, detail="Resource not found")

    await db.delete(resource)
    await db.commit()
    return None
