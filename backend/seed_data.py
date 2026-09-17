import asyncio
from datetime import date, datetime, timedelta
from app.core.database import AsyncSessionLocal, engine, Base
from app.models.user import Profile, AcademicProfile
from app.models.subject import Subject
from app.models.task import Task, StudySession
from app.models.academic import TimetableEvent, Assignment, StudyPlan, StudyPlanItem
from app.models.flashcard import FlashcardDeck, Flashcard, FlashcardReview
from app.models.quiz import Quiz, QuizQuestion, QuizAttempt, QuizAnswer
from app.models.coding import CodingProblem, MistakeNotebook
from app.models.document import Document, DocumentChunk
from app.models.tutor import Conversation, Message
from app.models.analytics import WeeklyReview

DEMO_USER_ID = "00000000-0000-0000-0000-000000000001"

async def seed():
    # Ensure tables exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        print(">>> Seeding LifeOS Demo Academic Data...")

        # 1. Profile & Academic Profile
        profile = await db.get(Profile, DEMO_USER_ID)
        if not profile:
            profile = Profile(
                id=DEMO_USER_ID,
                full_name="Alex Rivera",
                avatar_url=None
            )
            db.add(profile)

        acad_profile = await db.get(AcademicProfile, DEMO_USER_ID)
        if not acad_profile:
            acad_profile = AcademicProfile(
                user_id=DEMO_USER_ID,
                education_level="Undergraduate",
                college_university="Stanford University / State Tech",
                course="B.Tech Computer Science",
                semester=4,
                preferred_study_hours_start="09:00:00",
                preferred_study_hours_end="22:00:00",
                daily_available_hours=4.5,
                break_duration_minutes=15,
                goals=["Master DSA Tree & Graph Algorithms", "Achieve 4.0 GPA in DBMS & Operating Systems"],
                onboarding_completed=True
            )
            db.add(acad_profile)

        await db.commit()

        # 2. Subjects (Exactly the 4 default subjects)
        from app.models.subject import SubjectUnit

        subjects_data = [
            {
                "name": "DBMS",
                "color": "#3B82F6",
                "target_grade": "A+",
                "credits": 4,
                "units": [
                    ("Unit 1: Introduction to DBMS & Relational Model", ["Database Architectures", "ER Modeling", "Relational Model"]),
                    ("Unit 2: SQL & Advanced Query Processing", ["SQL Queries & Joins", "Subqueries & Aggregations", "Views"]),
                    ("Unit 3: Normalization & Schema Refinement", ["Functional Dependencies", "1NF, 2NF, 3NF", "BCNF Decomposition"]),
                    ("Unit 4: Transactions & Concurrency Control", ["ACID Properties", "2PL Protocol", "Deadlocks"]),
                    ("Unit 5: Storage Structures, Indexing & Recovery", ["B+ Trees Indexing", "Hashing", "WAL & ARIES"])
                ]
            },
            {
                "name": "Data Structures and Algorithms (DSA)",
                "color": "#10B981",
                "target_grade": "A+",
                "credits": 4,
                "units": [
                    ("Unit 1: Arrays, Strings & Two Pointers", ["Big-O Complexity", "Two Pointers", "Sliding Window"]),
                    ("Unit 2: Linked Lists, Stacks & Queues", ["Linked Lists", "Monotonic Stacks", "Queues"]),
                    ("Unit 3: Trees, Binary Search Trees & Heaps", ["Tree Traversals", "Lowest Common Ancestor", "Heaps"]),
                    ("Unit 4: Graph Algorithms & Traversals", ["BFS/DFS", "Dijkstra Algorithm", "Topological Sort"]),
                    ("Unit 5: Dynamic Programming & Greedy Approaches", ["1D/2D DP", "Knapsack", "Greedy Activity Selection"])
                ]
            },
            {
                "name": "Artificial Intelligence (AI)",
                "color": "#8B5CF6",
                "target_grade": "A",
                "credits": 4,
                "units": [
                    ("Unit 1: Foundations of AI & Problem Solving", ["Rational Agents", "State Space Search", "BFS/DFS"]),
                    ("Unit 2: Informed Search & Adversarial Games", ["A* Search", "Heuristics", "Minimax", "Alpha-Beta"]),
                    ("Unit 3: Knowledge Representation & Reasoning", ["Propositional Logic", "First-Order Logic", "Resolution"]),
                    ("Unit 4: Machine Learning Fundamentals & Neural Networks", ["Supervised Learning", "Regression", "Backpropagation"]),
                    ("Unit 5: NLP & Modern Generative AI", ["Word Embeddings", "Transformers", "LLM Prompting"])
                ]
            },
            {
                "name": "Cloud Computing",
                "color": "#06B6D4",
                "target_grade": "A",
                "credits": 3,
                "units": [
                    ("Unit 1: Cloud Architecture & Service Models", ["IaaS/PaaS/SaaS", "Public/Private Cloud", "SLAs"]),
                    ("Unit 2: Virtualization & Containerization", ["Hypervisors", "Docker", "Container Runtimes"]),
                    ("Unit 3: Cloud Storage & Distributed Databases", ["S3 Object Storage", "CAP Theorem", "NoSQL Scaling"]),
                    ("Unit 4: Serverless Computing & Microservices", ["Microservices", "AWS Lambda/FaaS", "API Gateways"]),
                    ("Unit 5: Cloud Security, Reliability & DevOps", ["Shared Responsibility", "IAM", "Autoscaling", "Terraform"])
                ]
            }
        ]

        created_subjects = []
        for s in subjects_data:
            all_topics = []
            for _, tops in s["units"]:
                all_topics.extend(tops)

            subj = Subject(
                user_id=DEMO_USER_ID,
                name=s["name"],
                color=s["color"],
                target_grade=s["target_grade"],
                credits=s["credits"],
                syllabus_topics=all_topics
            )
            db.add(subj)
            await db.flush()

            for u_idx, (u_title, u_tops) in enumerate(s["units"]):
                unit = SubjectUnit(
                    subject_id=subj.id,
                    user_id=DEMO_USER_ID,
                    unit_number=u_idx + 1,
                    title=u_title,
                    topics=u_tops
                )
                db.add(unit)

            created_subjects.append(subj)

        await db.commit()
        for s in created_subjects:
            await db.refresh(s)

        s_dbms = created_subjects[0]
        s_dsa = created_subjects[1]
        s_ai = created_subjects[2]
        s_cloud = created_subjects[3]
        s_os = s_ai
        s_cn = s_cloud

        # 3. Today's Mission Tasks
        today = date.today()
        tasks_data = [
            {
                "subject_id": s_dbms.id,
                "title": "DBMS — Master BCNF Decomposition",
                "topic": "Normalization",
                "learning_objective": "Determine candidate keys and test lossless join decomposition",
                "start_time": "09:00",
                "end_time": "10:00",
                "estimated_duration_minutes": 60,
                "priority": "urgent",
                "difficulty": "hard",
                "status": "completed",
                "is_locked": True
            },
            {
                "subject_id": s_dsa.id,
                "title": "DSA — Solve 2 Binary Search Problems",
                "topic": "Binary Search",
                "learning_objective": "Implement search in rotated sorted array without recursion",
                "start_time": "10:15",
                "end_time": "11:00",
                "estimated_duration_minutes": 45,
                "priority": "high",
                "difficulty": "medium",
                "status": "pending",
                "is_locked": False
            },
            {
                "subject_id": s_os.id,
                "title": "OS — Page Replacement Simulations",
                "topic": "Virtual Memory",
                "learning_objective": "Calculate page faults for LRU and FIFO algorithms",
                "start_time": "14:00",
                "end_time": "15:00",
                "estimated_duration_minutes": 60,
                "priority": "medium",
                "difficulty": "medium",
                "status": "pending",
                "is_locked": False
            },
            {
                "subject_id": s_cn.id,
                "title": "CN — TCP Three-Way Handshake Review",
                "topic": "Transport Layer",
                "learning_objective": "Diagram sequence numbers and SYN/ACK flags",
                "start_time": "17:00",
                "end_time": "17:45",
                "estimated_duration_minutes": 45,
                "priority": "low",
                "difficulty": "easy",
                "status": "pending",
                "is_locked": False
            }
        ]

        for td in tasks_data:
            t = Task(
                user_id=DEMO_USER_ID,
                subject_id=td["subject_id"],
                title=td["title"],
                topic=td["topic"],
                learning_objective=td["learning_objective"],
                scheduled_date=today,
                start_time=td["start_time"],
                end_time=td["end_time"],
                estimated_duration_minutes=td["estimated_duration_minutes"],
                priority=td["priority"],
                difficulty=td["difficulty"],
                status=td["status"],
                is_locked=td["is_locked"]
            )
            db.add(t)

        # 4. College Timetable (Lectures)
        # Monday to Friday classes
        timetable_data = [
            {"day": 1, "title": "DBMS Lecture (Prof. Miller)", "start": "11:15", "end": "12:45", "loc": "Hall 101", "sub": s_dbms.id},
            {"day": 1, "title": "DSA Lab Session", "start": "15:15", "end": "16:45", "loc": "Lab 4", "sub": s_dsa.id},
            {"day": 2, "title": "Operating Systems Core", "start": "10:00", "end": "11:30", "loc": "Hall 204", "sub": s_os.id},
            {"day": 3, "title": "Computer Networks Lecture", "start": "09:00", "end": "10:30", "loc": "Hall 102", "sub": s_cn.id},
            {"day": 4, "title": "DBMS Advanced Query Workshop", "start": "13:00", "end": "14:30", "loc": "Hall 101", "sub": s_dbms.id},
            {"day": 5, "title": "DSA Algorithms Seminar", "start": "11:00", "end": "12:30", "loc": "Auditorium C", "sub": s_dsa.id},
        ]
        for tt in timetable_data:
            event = TimetableEvent(
                user_id=DEMO_USER_ID,
                subject_id=tt["sub"],
                title=tt["title"],
                day_of_week=tt["day"],
                start_time=tt["start"],
                end_time=tt["end"],
                location=tt["loc"],
                is_recurring=True
            )
            db.add(event)

        # 5. Assignments (Kanban)
        assignments_data = [
            {
                "sub": s_dbms.id,
                "title": "Hospital Management Database Schema & SQL Queries",
                "desc": "Design schema with at least 5 tables in 3NF and provide 10 analytical SQL queries.",
                "due": datetime.utcnow() + timedelta(days=2),
                "priority": "urgent",
                "status": "in_progress",
                "hours": 4.0
            },
            {
                "sub": s_dsa.id,
                "title": "Binary Tree Serialization & Traversal Project",
                "desc": "Implement serialize and deserialize binary tree using preorder traversal.",
                "due": datetime.utcnow() + timedelta(days=5),
                "priority": "high",
                "status": "todo",
                "hours": 3.0
            },
            {
                "sub": s_os.id,
                "title": "Multi-threaded Producer-Consumer Implementation",
                "desc": "Write thread-safe buffer using POSIX mutex and condition variables.",
                "due": datetime.utcnow() - timedelta(days=1),
                "priority": "medium",
                "status": "completed",
                "hours": 2.5
            }
        ]
        for a in assignments_data:
            asgn = Assignment(
                user_id=DEMO_USER_ID,
                subject_id=a["sub"],
                title=a["title"],
                description=a["desc"],
                due_date=a["due"],
                priority=a["priority"],
                status=a["status"],
                estimated_effort_hours=a["hours"]
            )
            db.add(asgn)

        # 6. Spaced Repetition Flashcards Deck (SM-2)
        deck = FlashcardDeck(
            user_id=DEMO_USER_ID,
            subject_id=s_dbms.id,
            title="DBMS: Normalization & Indexing Essentials",
            description="High-yield exam definitions and functional dependency rules"
        )
        db.add(deck)
        await db.flush()

        flashcards_data = [
            {
                "q": "What is the primary condition for 2nd Normal Form (2NF)?",
                "a": "Table must be in 1NF and have NO partial dependency (every non-prime attribute must be fully functionally dependent on the primary key)."
            },
            {
                "q": "What is Boyce-Codd Normal Form (BCNF)?",
                "a": "For every functional dependency X -> Y, X must be a super key."
            },
            {
                "q": "What is the difference between Clustered and Non-Clustered Index?",
                "a": "Clustered index defines the physical order of data rows (only 1 per table). Non-clustered index creates a separate pointer structure to rows."
            },
            {
                "q": "What does ACID stand for in DBMS transactions?",
                "a": "Atomicity, Consistency, Isolation, Durability."
            }
        ]
        for fc in flashcards_data:
            card = Flashcard(
                deck_id=deck.id,
                user_id=DEMO_USER_ID,
                question=fc["q"],
                answer=fc["a"],
                difficulty="medium",
                interval_days=1,
                repetition_count=1,
                ease_factor=2.5,
                next_review_date=today
            )
            db.add(card)

        # 7. AI Mistake Notebook
        mistakes_data = [
            {
                "sub": s_dbms.id,
                "source": "quiz",
                "prob": "Does BCNF always preserve functional dependencies during decomposition?",
                "mistake": "Yes, all normal forms preserve dependencies.",
                "solution": "No! BCNF is guaranteed to be lossless, but it may NOT preserve functional dependencies (unlike 3NF).",
                "exp": "Classic trade-off: 3NF guarantees dependency preservation; BCNF eliminates all redundancy but can lose dependencies.",
                "topic": "BCNF Decomposition"
            },
            {
                "sub": s_dsa.id,
                "source": "coding",
                "prob": "Finding loop in linked list without extra space",
                "mistake": "Used a hash set of node pointers.",
                "solution": "Floyd's Cycle-Finding Algorithm (Fast & Slow Pointers) uses O(1) space.",
                "exp": "Slow pointer moves 1 step, fast pointer moves 2 steps. If they meet, a cycle exists.",
                "topic": "Linked Lists"
            }
        ]
        for m in mistakes_data:
            mistake_entry = MistakeNotebook(
                user_id=DEMO_USER_ID,
                subject_id=m["sub"],
                source_type=m["source"],
                question_or_problem=m["prob"],
                user_mistake=m["mistake"],
                correct_solution=m["solution"],
                explanation=m["exp"],
                topic=m["topic"],
                mistake_count=1,
                mastered=False
            )
            db.add(mistake_entry)

        # 8. Coding Problems Solved
        coding_data = [
            {
                "title": "33. Search in Rotated Sorted Array",
                "platform": "LeetCode",
                "url": "https://leetcode.com/problems/search-in-rotated-sorted-array/",
                "topic": "Binary Search",
                "difficulty": "medium",
                "notes": "Key insight: at least one half (left or right) is always sorted. Check if target lies within sorted half."
            },
            {
                "title": "15. 3Sum",
                "platform": "LeetCode",
                "url": "https://leetcode.com/problems/3sum/",
                "topic": "Two Pointers",
                "difficulty": "medium",
                "notes": "Sort array first, fix one element, use two pointers for remaining two. Guard against duplicate triplets."
            },
            {
                "title": "236. Lowest Common Ancestor of a Binary Tree",
                "platform": "LeetCode",
                "url": "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/",
                "topic": "Trees",
                "difficulty": "medium",
                "notes": "Postorder traversal: return root if matching p or q, otherwise aggregate left and right recursive answers."
            }
        ]
        for cp in coding_data:
            problem = CodingProblem(
                user_id=DEMO_USER_ID,
                title=cp["title"],
                platform=cp["platform"],
                url=cp["url"],
                topic=cp["topic"],
                difficulty=cp["difficulty"],
                notes=cp["notes"],
                status="solved"
            )
            db.add(problem)

        # 9. Knowledge Vault Document
        doc = Document(
            user_id=DEMO_USER_ID,
            subject_id=s_dbms.id,
            title="DBMS Unit 2 — Normalization & Relational Theory.pdf",
            file_type="pdf",
            file_size_bytes=2450000,
            status="ready",
            summary="Covers functional dependencies, Armstrong axioms, canonical cover, and normal forms from 1NF to BCNF with step-by-step lossless join proof.",
            key_points=[
                "A relation is in 1NF if all domain attributes are atomic.",
                "2NF removes partial key dependencies using candidate key closure.",
                "3NF allows transitive dependencies only when right side is prime attribute.",
                "BCNF requires determinant X to be a superkey for every non-trivial X -> Y."
            ],
            formulas_definitions=[
                {"name": "Armstrong Axiom: Transitivity", "description": "If X -> Y and Y -> Z, then X -> Z."},
                {"name": "Lossless Join Decomposition", "description": "R1 ∩ R2 -> R1 or R1 ∩ R2 -> R2 must hold in F+."}
            ]
        )
        db.add(doc)

        # 10. Focus Study Sessions for Analytics
        for days_ago in range(6, -1, -1):
            s_date = datetime.utcnow() - timedelta(days=days_ago)
            session = StudySession(
                user_id=DEMO_USER_ID,
                subject_id=s_dbms.id if days_ago % 2 == 0 else s_dsa.id,
                started_at=s_date,
                ended_at=s_date + timedelta(minutes=45 + (days_ago * 10)),
                duration_minutes=45 + (days_ago * 10),
                notes="Solved practice problem set and flashcards.",
                completed_objective=True
            )
            db.add(session)

        # 11. Exam Countdown Plan
        plan = StudyPlan(
            user_id=DEMO_USER_ID,
            subject_id=s_dbms.id,
            title="DBMS 7-Day Final Exam Sprint",
            exam_date=today + timedelta(days=7),
            total_days=7,
            status="active"
        )
        db.add(plan)
        await db.flush()

        plan_items = [
            {"d": 1, "topics": ["ER Models & Relational Algebra"], "mins": 180},
            {"d": 2, "topics": ["Functional Dependencies & Closure"], "mins": 180},
            {"d": 3, "topics": ["Normalization: 2NF, 3NF, BCNF Decomposition"], "mins": 240},
            {"d": 4, "topics": ["SQL Joins, Aggregations & Subqueries"], "mins": 180},
            {"d": 5, "topics": ["Transactions, Isolation Levels & 2PL Locking"], "mins": 210},
            {"d": 6, "topics": ["B+ Trees, Indexing & Query Optimization"], "mins": 180},
            {"d": 7, "topics": ["Full Mock Exam & Mistake Notebook Clearance"], "mins": 150},
        ]
        for pi in plan_items:
            item = StudyPlanItem(
                plan_id=plan.id,
                day_number=pi["d"],
                topics=pi["topics"],
                time_allocation_minutes=pi["mins"],
                learning_objectives=[f"Master high-yield questions for {pi['topics'][0]}"],
                practice_questions=["Explain mechanism and solve 2 numericals"]
            )
            db.add(item)

        await db.commit()
        print("[SUCCESS] Demo Data Seeding Complete!")

async def reset_and_seed():
    print(">>> Dropping all existing tables for a clean reset...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    await seed()

if __name__ == "__main__":
    import sys
    if "--reset" in sys.argv:
        asyncio.run(reset_and_seed())
    else:
        asyncio.run(seed())
