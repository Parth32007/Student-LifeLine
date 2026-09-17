from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_current_user, AuthenticatedUser
from app.models.tutor import Conversation, Message
from app.models.subject import Subject
from app.schemas.tutor import ConversationRead, MessageCreate, MessageRead
from app.services.gemini_service import gemini_service
from app.services.rag_service import rag_service

router = APIRouter()

@router.get("/conversations", response_model=List[ConversationRead])
async def list_conversations(
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Conversation).where(Conversation.user_id == user.id).order_by(Conversation.updated_at.desc())
    res = await db.execute(stmt)
    convs = res.scalars().all()

    results = []
    for c in convs:
        subj_name = None
        if c.subject_id:
            s = await db.get(Subject, c.subject_id)
            if s:
                subj_name = s.name

        msg_stmt = select(Message).where(Message.conversation_id == c.id).order_by(Message.created_at.asc())
        m_res = await db.execute(msg_stmt)
        msgs = m_res.scalars().all()

        results.append(ConversationRead(
            id=c.id,
            user_id=c.user_id,
            subject_id=c.subject_id,
            title=c.title,
            mode=c.mode,
            created_at=c.created_at,
            updated_at=c.updated_at,
            subject_name=subj_name,
            messages=[MessageRead.model_validate(m) for m in msgs]
        ))
    return results

@router.post("/chat", response_model=MessageRead)
async def send_chat_message(
    payload: MessageCreate,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Sends a message to the Gemini AI Tutor.
    Supports general chat, notes RAG grounding with source citations,
    step-by-step explanations, exam preparation, and coding assistance.
    """
    # 1. Get or create conversation
    conv = None
    if payload.conversation_id:
        conv = await db.get(Conversation, payload.conversation_id)

    if not conv:
        # Title will be auto-generated from first message snippet
        title = payload.content[:40] + ("..." if len(payload.content) > 40 else "")
        conv = Conversation(
            user_id=user.id,
            subject_id=payload.subject_id,
            title=title,
            mode=payload.mode or "general"
        )
        db.add(conv)
        await db.flush()

    # 2. Save user message
    user_msg = Message(
        conversation_id=conv.id,
        user_id=user.id,
        role="user",
        content=payload.content
    )
    db.add(user_msg)
    await db.flush()

    # 3. Retrieve context if RAG mode is active
    citations = []
    rag_context = ""
    if payload.mode == "notes_rag" or "note" in payload.content.lower() or "pdf" in payload.content.lower():
        relevant_chunks = await rag_service.search_relevant_chunks(
            db=db,
            user_id=user.id,
            query=payload.content,
            subject_id=payload.subject_id,
            top_k=4
        )
        if relevant_chunks:
            citations = [c.model_dump() for c in relevant_chunks]
            snippets = [
                f"[Source: {c.document_title}, Page {c.page_number or 'N/A'}]\n{c.snippet}"
                for c in relevant_chunks
            ]
            rag_context = (
                "Ground your answer in these retrieved passages from the student's uploaded materials. "
                "Explicitly cite the source document and page number in your explanation. "
                "If the information is not contained in these materials, state that clearly and then provide an answer using general academic principles.\n\n"
                + "\n---\n".join(snippets)
            )

    # 4. Fetch subject context if available
    subject_context = ""
    if conv.subject_id:
        s = await db.get(Subject, conv.subject_id)
        if s:
            subject_context = f"The student is asking in the context of the course: '{s.name}'."

    pedagogical_rules = (
        "\n\nFormatting & Teaching Guidelines for College Students:\n"
        "1. VISUAL HIERARCHY: Structure every response with bold markdown headings (##, ###), clean bullet lists, and highlight boxes (>).\n"
        "2. TABLES: Whenever showing database tables, datasets, schemas, or comparisons, ALWAYS format them as proper Markdown tables where EVERY ROW is on its own separate line. Never put multiple table rows on the same line.\n"
        "3. STEP-BY-STEP EXPLANATION: Use the Feynman technique—start with a vivid real-world analogy, give the formal definition, show the exact transformation step-by-step with before/after tables, and explain WHY the change happened.\n"
        "4. ACCESSIBLE LANGUAGE: Explain complex terms intuitively. Use bold text for key terms and backticks (`ColumnName`) for attributes and keys.\n"
        "5. SYMBOLS & FORMULAS: Use clean Unicode symbols (such as →, ⇒, ∈, ∪, ∩, ≠, ≤, ≥) instead of raw LaTeX dollar-sign syntax ($...$) so that arrows and relations display legibly in standard markdown.\n"
        "6. WRAP-UP: End with a concise summary table or takeaway and an encouraging question to test understanding."
    )

    mode_instructions = {
        "general": f"You are Student Lifeline AI Tutor, a brilliant, patient, and engaging university professor and mentor.{pedagogical_rules}",
        "notes_rag": f"You are Student Lifeline Document Tutor. Answer the student's question grounded in their uploaded notes. Quote or reference specific sections and page numbers.{pedagogical_rules}",
        "explain": f"You are Student Lifeline Concept Teacher. Break down difficult concepts into simple, intuitive steps. Avoid unnecessary jargon.{pedagogical_rules}",
        "exam_prep": f"You are Student Lifeline Exam Coach. Focus on high-yield exam concepts, common student traps, memory mnemonics, and marking schemes.{pedagogical_rules}",
        "coding": f"You are Student Lifeline Coding Mentor. Analyze algorithms, explain time & space complexity, and provide constructive hints before revealing the full code.{pedagogical_rules}",
        "quiz_me": f"You are Student Lifeline Socratic Quizzer. Test the student with active recall questions. Provide progressive hints rather than immediately giving the solution.{pedagogical_rules}"
    }

    system_inst = f"{mode_instructions.get(payload.mode or 'general', mode_instructions['general'])}\n{subject_context}\n{rag_context}"

    # 6. Generate AI response using Gemini
    ai_response_text = await gemini_service.generate_text(
        prompt=payload.content,
        system_instruction=system_inst,
        temperature=0.4 if payload.mode in ["notes_rag", "coding"] else 0.7
    )

    # Post-process markdown to ensure tables have clean newlines
    if ai_response_text:
        import re
        ai_response_text = re.sub(r'\|\s*\|', '|\n|', ai_response_text)
        ai_response_text = re.sub(r'([^\n])\n\|', r'\1\n\n|', ai_response_text)

    # 7. Save assistant message
    ai_msg = Message(
        conversation_id=conv.id,
        user_id=user.id,
        role="assistant",
        content=ai_response_text,
        citations=citations
    )
    db.add(ai_msg)

    from datetime import datetime
    conv.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(ai_msg)

    return MessageRead.model_validate(ai_msg)

@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    conv = await db.get(Conversation, conversation_id)
    if not conv or conv.user_id != user.id:
        raise HTTPException(status_code=404, detail="Conversation not found")

    await db.delete(conv)
    await db.commit()
    return None
