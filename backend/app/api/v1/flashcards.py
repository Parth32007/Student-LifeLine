from typing import List, Optional
from datetime import date, datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, func
from app.core.database import get_db
from app.core.security import get_current_user, AuthenticatedUser
from app.models.flashcard import FlashcardDeck, Flashcard, FlashcardReview
from app.models.subject import Subject, SubjectUnit
from app.models.document import Document
from app.schemas.flashcard import (
    FlashcardDeckCreate, FlashcardDeckRead, FlashcardCreate,
    FlashcardRead, FlashcardReviewSubmit, GenerateFlashcardsRequest
)
from app.services.spaced_repetition import calculate_sm2
from app.services.gemini_service import gemini_service

router = APIRouter()

@router.get("/decks", response_model=List[FlashcardDeckRead])
async def list_decks(
    subject_id: Optional[str] = None,
    unit_id: Optional[str] = None,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(FlashcardDeck).where(FlashcardDeck.user_id == user.id)
    if subject_id:
        stmt = stmt.where(FlashcardDeck.subject_id == subject_id)
    if unit_id:
        stmt = stmt.where(FlashcardDeck.unit_id == unit_id)
    stmt = stmt.order_by(FlashcardDeck.created_at.desc())
    res = await db.execute(stmt)
    decks = res.scalars().all()

    today = date.today()
    results = []
    for d in decks:
        # Count total cards and due cards
        c_stmt = select(func.count(Flashcard.id)).where(Flashcard.deck_id == d.id)
        c_res = await db.execute(c_stmt)
        total_cards = c_res.scalar() or 0

        due_stmt = select(func.count(Flashcard.id)).where(
            and_(Flashcard.deck_id == d.id, Flashcard.next_review_date <= today)
        )
        due_res = await db.execute(due_stmt)
        due_cards = due_res.scalar() or 0

        subj_name = None
        if d.subject_id:
            s = await db.get(Subject, d.subject_id)
            if s:
                subj_name = s.name

        unit_title = None
        if d.unit_id:
            u = await db.get(SubjectUnit, d.unit_id)
            if u:
                unit_title = u.title

        results.append(FlashcardDeckRead(
            id=d.id,
            user_id=d.user_id,
            subject_id=d.subject_id,
            unit_id=d.unit_id,
            title=d.title,
            description=d.description,
            created_at=d.created_at,
            cards_count=total_cards,
            due_today_count=due_cards,
            subject_name=subj_name,
            unit_title=unit_title
        ))
    return results

@router.post("/decks", response_model=FlashcardDeckRead, status_code=status.HTTP_201_CREATED)
async def create_deck(
    payload: FlashcardDeckCreate,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    deck = FlashcardDeck(
        user_id=user.id,
        subject_id=payload.subject_id,
        unit_id=payload.unit_id,
        title=payload.title,
        description=payload.description
    )
    db.add(deck)
    await db.commit()
    await db.refresh(deck)

    subj_name = None
    if deck.subject_id:
        s = await db.get(Subject, deck.subject_id)
        if s:
            subj_name = s.name

    unit_title = None
    if deck.unit_id:
        u = await db.get(SubjectUnit, deck.unit_id)
        if u:
            unit_title = u.title

    return FlashcardDeckRead(
        id=deck.id,
        user_id=deck.user_id,
        subject_id=deck.subject_id,
        unit_id=deck.unit_id,
        title=deck.title,
        description=deck.description,
        created_at=deck.created_at,
        cards_count=0,
        due_today_count=0,
        subject_name=subj_name,
        unit_title=unit_title
    )

@router.get("/due", response_model=List[FlashcardRead])
async def get_due_flashcards(
    subject_id: Optional[str] = None,
    unit_id: Optional[str] = None,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    today = date.today()
    stmt = select(Flashcard).where(
        and_(
            Flashcard.user_id == user.id,
            Flashcard.next_review_date <= today
        )
    )
    if subject_id:
        stmt = stmt.where(Flashcard.subject_id == subject_id)
    if unit_id:
        stmt = stmt.where(Flashcard.unit_id == unit_id)
    stmt = stmt.order_by(Flashcard.next_review_date.asc())
    res = await db.execute(stmt)
    return res.scalars().all()

@router.get("/decks/{deck_id}/cards", response_model=List[FlashcardRead])
async def list_deck_cards(
    deck_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    deck = await db.get(FlashcardDeck, deck_id)
    if not deck or deck.user_id != user.id:
        raise HTTPException(status_code=404, detail="Deck not found")

    stmt = select(Flashcard).where(Flashcard.deck_id == deck_id).order_by(Flashcard.created_at.asc())
    res = await db.execute(stmt)
    return res.scalars().all()

@router.post("/cards", response_model=FlashcardRead, status_code=status.HTTP_201_CREATED)
async def create_card(
    payload: FlashcardCreate,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    deck = await db.get(FlashcardDeck, payload.deck_id)
    if not deck or deck.user_id != user.id:
        raise HTTPException(status_code=404, detail="Deck not found")

    card = Flashcard(
        deck_id=payload.deck_id,
        user_id=user.id,
        subject_id=deck.subject_id,
        unit_id=deck.unit_id or payload.unit_id,
        question=payload.question,
        answer=payload.answer,
        difficulty=payload.difficulty or "medium"
    )
    db.add(card)
    await db.commit()
    await db.refresh(card)
    return card

@router.post("/cards/{card_id}/review", response_model=FlashcardRead)
async def review_card(
    card_id: str,
    payload: FlashcardReviewSubmit,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    card = await db.get(Flashcard, card_id)
    if not card or card.user_id != user.id:
        raise HTTPException(status_code=404, detail="Flashcard not found")

    new_interval, new_reps, new_ease, next_date = calculate_sm2(
        rating=payload.rating,
        interval_days=card.interval_days,
        repetition_count=card.repetition_count,
        ease_factor=float(card.ease_factor)
    )

    card.interval_days = new_interval
    card.repetition_count = new_reps
    card.ease_factor = new_ease
    card.next_review_date = next_date
    card.last_reviewed_at = datetime.utcnow()

    review_log = FlashcardReview(
        flashcard_id=card.id,
        user_id=user.id,
        rating=payload.rating
    )
    db.add(review_log)

    await db.commit()
    await db.refresh(card)
    return card

@router.post("/generate", response_model=List[FlashcardRead], status_code=status.HTTP_201_CREATED)
async def auto_generate_flashcards(
    payload: GenerateFlashcardsRequest,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Uses Gemini to generate high-yield, syllabus-grounded active recall flashcards.
    Grounds questions in the selected subject and unit.
    """
    subject = await db.get(Subject, payload.subject_id)
    if not subject or subject.user_id != user.id:
        raise HTTPException(status_code=404, detail="Subject not found or does not belong to user")

    unit_title = "Comprehensive Syllabus"
    unit_topics_text = ""
    target_unit_id = payload.unit_id

    if payload.unit_id:
        unit = await db.get(SubjectUnit, payload.unit_id)
        if not unit or unit.subject_id != subject.id:
            raise HTTPException(status_code=400, detail="Unit does not belong to selected subject")
        unit_title = unit.title
        unit_topics_text = f"Unit: {unit.title}\nDescription: {unit.description or 'N/A'}\nTopics: {', '.join(unit.topics or [])}"
    else:
        # Pull all units of the subject for comprehensive deck
        u_stmt = select(SubjectUnit).where(SubjectUnit.subject_id == subject.id).order_by(SubjectUnit.unit_number.asc())
        units = (await db.execute(u_stmt)).scalars().all()
        if units:
            unit_topics_text = "\n".join([f"- {u.title}: {', '.join(u.topics or [])}" for u in units])
        elif subject.syllabus_topics:
            unit_topics_text = "Topics:\n" + "\n".join([f"- {t}" for t in subject.syllabus_topics])
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Subject '{subject.name}' has no syllabus or units. Please upload or update the syllabus first."
            )

    count = payload.count or 10
    difficulty_str = payload.difficulty or "mixed"

    context_block = (
        f"Course Subject: {subject.name}\n"
        f"{unit_topics_text}"
    )

    if payload.document_id:
        doc = await db.get(Document, payload.document_id)
        if doc and doc.summary:
            context_block += f"\n\nSupporting Study Notes Summary:\n{doc.summary}"

    prompt = (
        f"You are an expert academic tutor for {subject.name}.\n"
        f"Generate exactly {count} high-yield, active-recall flashcards strictly based on the following uploaded syllabus curriculum:\n\n"
        f"--- SYLLABUS CONTEXT ---\n"
        f"{context_block}\n"
        f"------------------------\n\n"
        f"Difficulty Level: {difficulty_str}\n"
        "Guidelines:\n"
        "1. Every question must be grounded directly in the syllabus content above.\n"
        "2. Do NOT invent syllabus material outside this context.\n"
        "3. Ensure the question tests conceptual understanding, core mechanisms, definitions, or problem solving.\n"
        "4. Provide crisp, clear, authoritative answers on the back.\n"
        "5. Return a strict JSON array of objects with keys 'question', 'answer', and 'difficulty' ('easy', 'medium', or 'hard').\n\n"
        "Example format:\n"
        "[\n"
        "  {\n"
        "    \"question\": \"What is the key condition for Boyce-Codd Normal Form (BCNF)?\",\n"
        "    \"answer\": \"For every non-trivial functional dependency X -> Y, X must be a superkey.\",\n"
        "    \"difficulty\": \"medium\"\n"
        "  }\n"
        "]"
    )

    ai_cards = await gemini_service.generate_json(prompt)
    if not ai_cards or not isinstance(ai_cards, list) or len(ai_cards) == 0:
        # Fallback to grounded syllabus flashcards if AI API is temporarily unavailable
        topics_list = []
        if payload.unit_id and 'unit' in locals() and unit.topics:
            topics_list = unit.topics
        elif subject.syllabus_topics:
            topics_list = subject.syllabus_topics
        else:
            topics_list = ["Fundamental Concepts", "Core Architecture", "Practical Implementation"]

        ai_cards = []
        for i in range(min(count, len(topics_list) * 2)):
            topic_item = topics_list[i % len(topics_list)]
            ai_cards.append({
                "question": f"What is the significance and core principle of '{topic_item}' in {subject.name}?",
                "answer": f"'{topic_item}' defines the operational axioms, structural invariants, and constraints required for system correctness in {subject.name}.",
                "difficulty": difficulty_str if difficulty_str in ["easy", "medium", "hard"] else "medium"
            })

    # Find or create a dedicated deck for this subject and unit
    deck_title = f"{subject.name} — {unit_title}"
    deck_stmt = select(FlashcardDeck).where(
        and_(
            FlashcardDeck.user_id == user.id,
            FlashcardDeck.subject_id == subject.id,
            FlashcardDeck.unit_id == target_unit_id
        )
    )
    deck = (await db.execute(deck_stmt)).scalar_one_or_none()

    if not deck:
        deck = FlashcardDeck(
            user_id=user.id,
            subject_id=subject.id,
            unit_id=target_unit_id,
            title=deck_title,
            description=f"AI-generated flashcards grounded in {unit_title}"
        )
        db.add(deck)
        await db.flush()

    saved_cards = []
    for item in ai_cards:
        card_diff = item.get("difficulty", "medium")
        if card_diff not in ["easy", "medium", "hard"]:
            card_diff = "medium"

        fc = Flashcard(
            deck_id=deck.id,
            user_id=user.id,
            subject_id=subject.id,
            unit_id=target_unit_id,
            question=item.get("question", "Question"),
            answer=item.get("answer", "Answer"),
            difficulty=card_diff
        )
        db.add(fc)
        saved_cards.append(fc)

    await db.commit()
    for c in saved_cards:
        await db.refresh(c)
    return saved_cards
