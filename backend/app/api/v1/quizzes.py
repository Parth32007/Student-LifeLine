from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from app.core.database import get_db
from app.core.security import get_current_user, AuthenticatedUser
from app.models.quiz import Quiz, QuizQuestion, QuizAttempt, QuizAnswer
from app.models.subject import Subject, SubjectUnit
from app.models.document import Document
from app.models.coding import MistakeNotebook
from app.schemas.quiz import (
    QuizGenerateRequest, QuizRead, QuizQuestionRead,
    QuizSubmitRequest, QuizResultRead, EvaluatedAnswer
)
from app.services.gemini_service import gemini_service

router = APIRouter()

@router.get("/", response_model=List[QuizRead])
async def list_quizzes(
    subject_id: Optional[str] = None,
    unit_id: Optional[str] = None,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Quiz).where(Quiz.user_id == user.id)
    if subject_id:
        stmt = stmt.where(Quiz.subject_id == subject_id)
    if unit_id:
        stmt = stmt.where(Quiz.unit_id == unit_id)
    stmt = stmt.order_by(Quiz.created_at.desc())
    res = await db.execute(stmt)
    quizzes = res.scalars().all()

    results = []
    for q in quizzes:
        subj_name = None
        if q.subject_id:
            s = await db.get(Subject, q.subject_id)
            if s:
                subj_name = s.name

        unit_title = None
        if q.unit_id:
            u = await db.get(SubjectUnit, q.unit_id)
            if u:
                unit_title = u.title

        q_stmt = select(QuizQuestion).where(QuizQuestion.quiz_id == q.id)
        q_res = await db.execute(q_stmt)
        questions = q_res.scalars().all()

        results.append(QuizRead(
            id=q.id,
            user_id=q.user_id,
            subject_id=q.subject_id,
            unit_id=q.unit_id,
            title=q.title,
            topic=q.topic,
            difficulty=q.difficulty,
            time_limit_minutes=q.time_limit_minutes,
            is_mock_exam=q.is_mock_exam,
            created_at=q.created_at,
            subject_name=subj_name,
            unit_title=unit_title,
            questions=[QuizQuestionRead.model_validate(qu) for qu in questions]
        ))
    return results

@router.post("/generate", response_model=QuizRead, status_code=status.HTTP_201_CREATED)
async def generate_quiz(
    payload: QuizGenerateRequest,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Generates a syllabus-grounded academic assessment or timed mock exam using Gemini.
    """
    subject = await db.get(Subject, payload.subject_id)
    if not subject or subject.user_id != user.id:
        raise HTTPException(status_code=404, detail="Subject not found or does not belong to user")

    unit_title = "Comprehensive Syllabus"
    syllabus_context = ""
    target_unit_id = payload.unit_id

    if payload.unit_id:
        unit = await db.get(SubjectUnit, payload.unit_id)
        if not unit or unit.subject_id != subject.id:
            raise HTTPException(status_code=400, detail="Unit does not belong to selected subject")
        unit_title = unit.title
        syllabus_context = f"Unit: {unit.title}\nDescription: {unit.description or 'N/A'}\nTopics: {', '.join(unit.topics or [])}"
    else:
        # Multi-unit / full syllabus
        u_stmt = select(SubjectUnit).where(SubjectUnit.subject_id == subject.id).order_by(SubjectUnit.unit_number.asc())
        units = (await db.execute(u_stmt)).scalars().all()
        if units:
            syllabus_context = "\n".join([f"- {u.title} (Topics: {', '.join(u.topics or [])})" for u in units])
        elif subject.syllabus_topics:
            syllabus_context = "Syllabus Topics:\n" + "\n".join([f"- {t}" for t in subject.syllabus_topics])
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Subject '{subject.name}' has no syllabus or units. Please upload or update the syllabus first."
            )

    count = payload.num_questions or (15 if payload.is_mock_exam else 5)
    types_str = ", ".join(payload.question_types or ["mcq", "true_false", "short_answer"])
    exam_type = "Mock Exam" if payload.is_mock_exam else "Quiz"

    prompt = (
        f"You are the Student Lifeline Academic Assessment Generator for {subject.name}.\n"
        f"Generate a rigorous {exam_type} consisting of exactly {count} questions strictly grounded in this uploaded syllabus:\n\n"
        f"--- SYLLABUS CURRICULUM ---\n"
        f"Subject: {subject.name}\n"
        f"{syllabus_context}\n"
        f"---------------------------\n\n"
        f"Difficulty: {payload.difficulty}\n"
        f"Allowed Question Types: {types_str}\n\n"
        "Requirements:\n"
        "1. Every question must test real knowledge directly from the syllabus context above.\n"
        "2. Do NOT hallucinate topics outside this subject.\n"
        "3. For Mock Exams, distribute questions across the units.\n"
        "4. Return a strict JSON array of question objects formatted exactly like:\n"
        "[\n"
        "  {\n"
        "    \"question_type\": \"mcq\",\n"
        "    \"question_text\": \"Which of the following describes ... ?\",\n"
        "    \"options\": [\"Option A text\", \"Option B text\", \"Option C text\", \"Option D text\"],\n"
        "    \"correct_answer\": \"Option A text\",\n"
        "    \"explanation\": \"Clear conceptual reason why this answer is correct.\",\n"
        "    \"points\": 1\n"
        "  },\n"
        "  {\n"
        "    \"question_type\": \"true_false\",\n"
        "    \"question_text\": \"Statement testing an invariant or rule.\",\n"
        "    \"options\": [\"True\", \"False\"],\n"
        "    \"correct_answer\": \"True\",\n"
        "    \"explanation\": \"Why it is True.\",\n"
        "    \"points\": 1\n"
        "  },\n"
        "  {\n"
        "    \"question_type\": \"short_answer\",\n"
        "    \"question_text\": \"Explain briefly how ... works.\",\n"
        "    \"options\": [],\n"
        "    \"correct_answer\": \"Concise reference solution covering key principles.\",\n"
        "    \"explanation\": \"Key points expected in student explanation.\",\n"
        "    \"points\": 2\n"
        "  }\n"
        "]"
    )

    ai_questions = await gemini_service.generate_json(prompt)
    if not ai_questions or not isinstance(ai_questions, list) or len(ai_questions) == 0:
        # Fallback to grounded questions from topics
        topics_pool = []
        if payload.unit_id and 'unit' in locals() and unit.topics:
            topics_pool = unit.topics
        elif subject.syllabus_topics:
            topics_pool = subject.syllabus_topics
        else:
            topics_pool = ["Core Concepts", "Structural Mechanisms", "Optimization"]

        ai_questions = []
        for i in range(count):
            t = topics_pool[i % len(topics_pool)]
            if i % 3 == 0:
                ai_questions.append({
                    "question_type": "mcq",
                    "question_text": f"In {subject.name}, what is a primary property of {t}?",
                    "options": [f"Consistent state guarantee in {t}", "Unbounded space overhead", "O(N!) computational cost", "Random execution order"],
                    "correct_answer": f"Consistent state guarantee in {t}",
                    "explanation": f"{t} enforces structural correctness and consistency.",
                    "points": 1
                })
            elif i % 3 == 1:
                ai_questions.append({
                    "question_type": "true_false",
                    "question_text": f"In {subject.name}, {t} can operate without maintaining structural invariants.",
                    "options": ["True", "False"],
                    "correct_answer": "False",
                    "explanation": "Structural invariants must be maintained for deterministic correctness.",
                    "points": 1
                })
            else:
                ai_questions.append({
                    "question_type": "short_answer",
                    "question_text": f"Define the primary architectural purpose of {t} in {subject.name}.",
                    "options": [],
                    "correct_answer": f"{t} organizes execution flow and guarantees integrity under standard system constraints.",
                    "explanation": "Expects mention of execution flow and system constraints.",
                    "points": 2
                })

    quiz_title = f"{exam_type}: {subject.name} — {unit_title}"
    time_limit = payload.time_limit_minutes or (45 if payload.is_mock_exam else 15)

    quiz = Quiz(
        user_id=user.id,
        subject_id=subject.id,
        unit_id=target_unit_id,
        title=quiz_title,
        topic=unit_title,
        difficulty=payload.difficulty or "medium",
        time_limit_minutes=time_limit,
        is_mock_exam=payload.is_mock_exam or False
    )
    db.add(quiz)
    await db.flush()

    saved_questions = []
    for q_data in ai_questions:
        q_type = q_data.get("question_type", "mcq")
        if q_type not in ["mcq", "true_false", "short_answer", "coding"]:
            q_type = "mcq"

        qq = QuizQuestion(
            quiz_id=quiz.id,
            unit_id=target_unit_id,
            question_type=q_type,
            question_text=q_data.get("question_text", "Question text"),
            options=q_data.get("options", []),
            correct_answer=q_data.get("correct_answer", ""),
            explanation=q_data.get("explanation", ""),
            points=q_data.get("points", 1)
        )
        db.add(qq)
        saved_questions.append(qq)

    await db.commit()
    await db.refresh(quiz)

    return QuizRead(
        id=quiz.id,
        user_id=quiz.user_id,
        subject_id=quiz.subject_id,
        unit_id=quiz.unit_id,
        title=quiz.title,
        topic=quiz.topic,
        difficulty=quiz.difficulty,
        time_limit_minutes=quiz.time_limit_minutes,
        is_mock_exam=quiz.is_mock_exam,
        created_at=quiz.created_at,
        subject_name=subject.name,
        unit_title=unit_title,
        questions=[QuizQuestionRead.model_validate(qu) for qu in saved_questions]
    )

@router.post("/{quiz_id}/submit", response_model=QuizResultRead)
async def submit_quiz(
    quiz_id: str,
    payload: QuizSubmitRequest,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Evaluates submitted answers, scores objective questions, evaluates short answers with Gemini,
    identifies weak topics, and logs mistakes to the Mistake Notebook.
    """
    quiz = await db.get(Quiz, quiz_id)
    if not quiz or quiz.user_id != user.id:
        raise HTTPException(status_code=404, detail="Quiz not found")

    q_stmt = select(QuizQuestion).where(QuizQuestion.quiz_id == quiz.id)
    q_res = await db.execute(q_stmt)
    questions = {qu.id: qu for qu in q_res.scalars().all()}

    total_score = 0.0
    max_score = sum(qu.points for qu in questions.values()) or 1.0

    attempt = QuizAttempt(
        quiz_id=quiz.id,
        user_id=user.id,
        time_taken_seconds=payload.time_taken_seconds,
        completed_at=datetime.utcnow()
    )
    db.add(attempt)
    await db.flush()

    evaluated_list = []
    user_answers_map = {ans.question_id: ans.user_answer for ans in payload.answers}
    weak_topics_set = set()

    for q_id, question in questions.items():
        user_ans = user_answers_map.get(q_id, "").strip()
        is_correct = False
        ai_feedback = None

        if question.question_type in ["mcq", "true_false"]:
            clean_correct = question.correct_answer.strip().lower()
            clean_user = user_ans.lower()
            if clean_user and (clean_user == clean_correct or clean_correct.startswith(clean_user[:2]) or clean_user.startswith(clean_correct[:2])):
                is_correct = True
        else:
            # Short answer / conceptual question: Gemini AI Evaluation
            if user_ans:
                grading_prompt = (
                    f"Question: {question.question_text}\n"
                    f"Model Solution: {question.correct_answer}\n"
                    f"Student Response: {user_ans}\n\n"
                    "Determine whether student response demonstrates conceptual understanding. "
                    "Respond with a strict JSON object: {\"is_correct\": true/false, \"feedback\": \"1-sentence feedback explaining what was correct or missing.\"}"
                )
                eval_res = await gemini_service.generate_json(grading_prompt)
                if eval_res and isinstance(eval_res, dict):
                    is_correct = bool(eval_res.get("is_correct", False))
                    ai_feedback = eval_res.get("feedback")
                else:
                    is_correct = len(user_ans) > 10
                    ai_feedback = "Answer recorded."
            else:
                is_correct = False
                ai_feedback = "No answer provided."

        if is_correct:
            total_score += question.points
        else:
            weak_topics_set.add(quiz.topic or "Key Syllabus Concepts")
            # Auto-log mistake into Mistake Notebook
            mistake = MistakeNotebook(
                user_id=user.id,
                subject_id=quiz.subject_id,
                source_type="quiz",
                question_or_problem=question.question_text,
                user_mistake=user_ans or "Unanswered",
                correct_solution=question.correct_answer,
                explanation=question.explanation or ai_feedback,
                topic=quiz.topic
            )
            db.add(mistake)

        db_answer = QuizAnswer(
            attempt_id=attempt.id,
            question_id=question.id,
            user_answer=user_ans,
            is_correct=is_correct,
            ai_feedback=ai_feedback
        )
        db.add(db_answer)

        evaluated_list.append(EvaluatedAnswer(
            question_id=question.id,
            question_text=question.question_text,
            user_answer=user_ans,
            correct_answer=question.correct_answer,
            is_correct=is_correct,
            explanation=question.explanation,
            ai_feedback=ai_feedback
        ))

    pct = round((total_score / max_score) * 100, 1)
    attempt.score = total_score
    attempt.max_score = max_score
    attempt.percentage = pct

    await db.commit()

    return QuizResultRead(
        attempt_id=attempt.id,
        quiz_id=quiz.id,
        score=total_score,
        max_score=max_score,
        percentage=pct,
        time_taken_seconds=payload.time_taken_seconds,
        completed_at=attempt.completed_at,
        results=evaluated_list,
        weak_topics=list(weak_topics_set)
    )

@router.post("/submit", response_model=QuizResultRead)
@router.post("/assessments/submit", response_model=QuizResultRead)
async def submit_assessment(
    payload: QuizSubmitRequest,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not payload.quiz_id:
        raise HTTPException(status_code=400, detail="quiz_id is required in request body")
    return await submit_quiz(quiz_id=payload.quiz_id, payload=payload, user=user, db=db)

@router.post("/exams/generate", response_model=QuizRead, status_code=status.HTTP_201_CREATED)
async def generate_exam(
    payload: QuizGenerateRequest,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    payload.is_mock_exam = True
    return await generate_quiz(payload=payload, user=user, db=db)

