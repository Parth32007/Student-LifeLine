import math
from datetime import datetime, date, time, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from app.models.task import Task
from app.models.user import AcademicProfile
from app.models.subject import Subject
from app.models.academic import TimetableEvent
from app.models.flashcard import Flashcard
from app.models.coding import MistakeNotebook
from app.schemas.task import WhatToStudyNowResponse

class AdaptiveSchedulerService:

    @staticmethod
    def parse_time_str(t_str: str) -> time:
        parts = t_str.split(":")
        return time(int(parts[0]), int(parts[1]))

    @staticmethod
    def time_to_minutes(t: time) -> int:
        return t.hour * 60 + t.minute

    @staticmethod
    def minutes_to_time_str(minutes: int) -> str:
        h = (minutes // 60) % 24
        m = minutes % 60
        return f"{h:02d}:{m:02d}"

    async def get_today_timetable(
        self,
        db: AsyncSession,
        user_id: str,
        target_date: date
    ) -> List[Dict[str, Any]]:
        # Sunday=0, Monday=1, ..., Saturday=6 in Python weekday(): Monday=0, Sunday=6
        # Let's map Python weekday: (weekday + 1) % 7 gives Sunday=0, Monday=1...
        py_weekday = target_date.weekday()
        day_of_week = (py_weekday + 1) % 7

        stmt = select(TimetableEvent).where(
            and_(
                TimetableEvent.user_id == user_id,
                TimetableEvent.day_of_week == day_of_week
            )
        ).order_by(TimetableEvent.start_time)
        res = await db.execute(stmt)
        events = res.scalars().all()
        return [
            {
                "title": e.title,
                "start_time": e.start_time,
                "end_time": e.end_time,
                "start_min": self.time_to_minutes(self.parse_time_str(e.start_time)),
                "end_min": self.time_to_minutes(self.parse_time_str(e.end_time))
            }
            for e in events
        ]

    async def balance_tasks_for_day(
        self,
        db: AsyncSession,
        user_id: str,
        target_date: date,
        tasks: List[Task]
    ) -> List[Task]:
        """
        Takes tasks and schedules them into non-overlapping time slots
        around fixed timetable events and preferred study hours.
        """
        # Fetch academic profile for study hours
        profile_stmt = select(AcademicProfile).where(AcademicProfile.user_id == user_id)
        p_res = await db.execute(profile_stmt)
        profile = p_res.scalar_one_or_none()

        start_h_str = profile.preferred_study_hours_start if profile and profile.preferred_study_hours_start else "09:00:00"
        end_h_str = profile.preferred_study_hours_end if profile and profile.preferred_study_hours_end else "22:00:00"
        break_mins = profile.break_duration_minutes if profile and profile.break_duration_minutes else 15

        start_min = self.time_to_minutes(self.parse_time_str(start_h_str[:5]))
        end_min = self.time_to_minutes(self.parse_time_str(end_h_str[:5]))

        # Get timetable fixed commitments
        fixed_events = await self.get_today_timetable(db, user_id, target_date)

        # Sort tasks: locked first, then urgent, high, medium, low
        priority_weight = {"urgent": 4, "high": 3, "medium": 2, "low": 1}
        tasks_sorted = sorted(
            tasks,
            key=lambda t: (1 if t.is_locked else 0, priority_weight.get(t.priority, 1)),
            reverse=True
        )

        current_cursor = start_min

        for t in tasks_sorted:
            if t.status == "completed":
                continue

            duration = t.estimated_duration_minutes or 45
            task_assigned = False

            while current_cursor + duration <= end_min:
                slot_start = current_cursor
                slot_end = current_cursor + duration

                # Check conflict with fixed timetable events
                conflict = False
                for ev in fixed_events:
                    if max(slot_start, ev["start_min"]) < min(slot_end, ev["end_min"]):
                        conflict = True
                        current_cursor = ev["end_min"] + 10
                        break

                if not conflict:
                    if not t.is_locked:
                        t.start_time = self.minutes_to_time_str(slot_start)
                        t.end_time = self.minutes_to_time_str(slot_end)
                    current_cursor = slot_end + break_mins
                    task_assigned = True
                    break

            if not task_assigned and not t.is_locked:
                # If cannot fit in today's window, leave slot unassigned for spillover
                pass

        await db.commit()
        return tasks_sorted

    async def what_should_i_study_now(
        self,
        db: AsyncSession,
        user_id: str
    ) -> WhatToStudyNowResponse:
        """
        Standout Feature B: Computes the single best academic action right now.
        """
        today = date.today()
        now_time = datetime.now().time()
        now_mins = self.time_to_minutes(now_time)

        # 1. Check if there is an in-progress or scheduled task right now
        task_stmt = select(Task).where(
            and_(
                Task.user_id == user_id,
                Task.scheduled_date == today,
                Task.status.in_(["pending", "in_progress"])
            )
        )
        t_res = await db.execute(task_stmt)
        tasks = t_res.scalars().all()

        for t in tasks:
            if t.start_time and t.end_time:
                s_min = self.time_to_minutes(self.parse_time_str(t.start_time[:5]))
                e_min = self.time_to_minutes(self.parse_time_str(t.end_time[:5]))
                if s_min - 15 <= now_mins <= e_min:
                    subject_name = "Academic"
                    if t.subject_id:
                        s_obj = await db.get(Subject, t.subject_id)
                        if s_obj:
                            subject_name = s_obj.name
                    return WhatToStudyNowResponse(
                        task_id=t.id,
                        title=t.title,
                        subject_name=subject_name,
                        topic=t.topic,
                        recommended_duration_minutes=t.estimated_duration_minutes or 45,
                        reason=f"This task is scheduled in your mission right now ({t.start_time} - {t.end_time}).",
                        action_type="start_task",
                        resource=t.recommended_resource
                    )

        # 2. Check for due flashcards
        fc_stmt = select(Flashcard).where(
            and_(
                Flashcard.user_id == user_id,
                Flashcard.next_review_date <= today
            )
        )
        fc_res = await db.execute(fc_stmt)
        due_cards = fc_res.scalars().all()
        if len(due_cards) >= 5:
            return WhatToStudyNowResponse(
                title=f"Spaced Repetition Review ({len(due_cards)} cards due)",
                subject_name="Memory Retention",
                recommended_duration_minutes=15,
                reason=f"You have {len(due_cards)} flashcards due for SM-2 review today to prevent memory decay.",
                action_type="flashcards"
            )

        # 3. Check for high priority unfinished task today
        if tasks:
            high_p_tasks = [t for t in tasks if t.priority in ["urgent", "high"]]
            chosen = high_p_tasks[0] if high_p_tasks else tasks[0]
            subject_name = "Core Subject"
            if chosen.subject_id:
                s_obj = await db.get(Subject, chosen.subject_id)
                if s_obj:
                    subject_name = s_obj.name
            return WhatToStudyNowResponse(
                task_id=chosen.id,
                title=chosen.title,
                subject_name=subject_name,
                topic=chosen.topic,
                recommended_duration_minutes=chosen.estimated_duration_minutes or 45,
                reason="High priority uncompleted mission task for today.",
                action_type="start_task",
                resource=chosen.recommended_resource
            )

        # 4. Check mistake notebook for targeted practice
        mistake_stmt = select(MistakeNotebook).where(
            and_(
                MistakeNotebook.user_id == user_id,
                MistakeNotebook.mastered == False
            )
        )
        m_res = await db.execute(mistake_stmt)
        mistakes = m_res.scalars().all()
        if mistakes:
            m = mistakes[0]
            return WhatToStudyNowResponse(
                title=f"Revise Weak Concept: {m.topic or 'Past Mistakes'}",
                subject_name="Mistake Notebook",
                recommended_duration_minutes=20,
                reason="Reviewing concepts you recently got wrong in quizzes reinforces high-yield exam areas.",
                action_type="quick_revision"
            )

        return WhatToStudyNowResponse(
            title="Syllabus Exploration or Coding Practice",
            subject_name="Open Practice",
            recommended_duration_minutes=30,
            reason="You have finished all immediate tasks! Great job. Solidify your progress with coding problems or notes review.",
            action_type="quick_revision"
        )

scheduler_service = AdaptiveSchedulerService()
