from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import get_db
from app.core.security import get_current_user, AuthenticatedUser
from app.models.subject import Subject, SubjectUnit
from app.schemas.subject import (
    SubjectCreate, SubjectUpdate, SubjectRead,
    SubjectUnitCreate, SubjectUnitRead
)

router = APIRouter()

DEFAULT_FOUR_SUBJECTS = [
    {
        "name": "DBMS",
        "color": "#3B82F6",
        "target_grade": "A",
        "credits": 4,
        "units": [
            {
                "unit_number": 1,
                "title": "Unit 1: Introduction to DBMS & Relational Model",
                "description": "Database system architectures, 3-tier schema, ER modeling, entities, relationships, relational algebra primitives.",
                "topics": ["Database Architectures", "ER Modeling & Constraints", "Relational Model & Keys", "Relational Algebra Operations"]
            },
            {
                "unit_number": 2,
                "title": "Unit 2: SQL & Advanced Query Processing",
                "description": "DDL, DML, complex joins, nested subqueries, aggregations, window functions, and views.",
                "topics": ["SQL Queries & Joins", "Subqueries & Aggregations", "Views & Integrity Constraints", "Query Evaluation Plans"]
            },
            {
                "unit_number": 3,
                "title": "Unit 3: Normalization & Schema Refinement",
                "description": "Functional dependencies, inference rules (Armstrong axioms), Normal forms (1NF, 2NF, 3NF, BCNF), lossless join, dependency preservation.",
                "topics": ["Functional Dependencies & Closure", "1NF, 2NF & 3NF Normalization", "Boyce-Codd Normal Form (BCNF)", "Lossless Join Decomposition"]
            },
            {
                "unit_number": 4,
                "title": "Unit 4: Transactions & Concurrency Control",
                "description": "ACID properties, serializability, conflict vs view serializability, Two-Phase Locking (2PL), deadlock prevention and detection.",
                "topics": ["ACID Properties", "Conflict Serializability", "Two-Phase Locking (2PL)", "Deadlock Detection & Recovery"]
            },
            {
                "unit_number": 5,
                "title": "Unit 5: Storage Structures, Indexing & Recovery",
                "description": "File organization, RAID, B-Trees and B+ Trees, hashing, write-ahead logging (WAL), ARIES recovery algorithm.",
                "topics": ["B+ Trees Indexing", "Hash Indexes", "Write-Ahead Logging (WAL)", "System Recovery Mechanisms"]
            }
        ]
    },
    {
        "name": "Data Structures and Algorithms (DSA)",
        "color": "#10B981",
        "target_grade": "A",
        "credits": 4,
        "units": [
            {
                "unit_number": 1,
                "title": "Unit 1: Arrays, Strings & Two Pointers",
                "description": "Time/space complexity analysis, array manipulations, prefix sums, sliding window, and two-pointer techniques.",
                "topics": ["Asymptotic Notations (Big-O)", "Two Pointer Technique", "Sliding Window Patterns", "Prefix Sum Arrays"]
            },
            {
                "unit_number": 2,
                "title": "Unit 2: Linked Lists, Stacks & Queues",
                "description": "Singly and doubly linked lists, fast and slow pointers, monotonic stacks, queue implementations, circular buffers.",
                "topics": ["Singly & Doubly Linked Lists", "Cycle Detection (Floyd's Algorithm)", "Monotonic Stack Patterns", "Queue & Deque Implementations"]
            },
            {
                "unit_number": 3,
                "title": "Unit 3: Trees, Binary Search Trees & Heaps",
                "description": "Binary tree traversals, lowest common ancestor (LCA), BST operations, AVL trees, and priority queues/binary heaps.",
                "topics": ["Tree Traversals (DFS/BFS)", "Lowest Common Ancestor (LCA)", "Binary Search Tree Invariants", "Min/Max Binary Heaps"]
            },
            {
                "unit_number": 4,
                "title": "Unit 4: Graph Algorithms & Traversals",
                "description": "Graph representations, BFS, DFS, cycle detection, Topological sort, Dijkstra's algorithm, Bellman-Ford, Disjoint Set Union (DSU).",
                "topics": ["Breadth-First & Depth-First Search", "Cycle Detection & Topological Sort", "Dijkstra's Shortest Path", "Disjoint Set Union (Kruskal's Algorithm)"]
            },
            {
                "unit_number": 5,
                "title": "Unit 5: Dynamic Programming & Greedy Approaches",
                "description": "Memoization vs tabulation, 1D/2D DP, 0/1 Knapsack, Longest Common Subsequence (LCS), interval scheduling, greedy choices.",
                "topics": ["1D & 2D Dynamic Programming", "0/1 Knapsack Patterns", "Longest Common Subsequence (LCS)", "Greedy Activity Selection"]
            }
        ]
    },
    {
        "name": "Artificial Intelligence (AI)",
        "color": "#8B5CF6",
        "target_grade": "A",
        "credits": 4,
        "units": [
            {
                "unit_number": 1,
                "title": "Unit 1: Foundations of AI & Problem Solving",
                "description": "History and state of AI, rational agents, PEAS framework, state space search representations, formulation of toy and real-world problems.",
                "topics": ["Rational Agents & Environments (PEAS)", "State Space Representations", "Blind Search (BFS, DFS, Uniform Cost)", "Problem Formulation Techniques"]
            },
            {
                "unit_number": 2,
                "title": "Unit 2: Informed Search & Adversarial Games",
                "description": "Heuristic functions, A* search, admissibility and consistency, IDA*, game playing, Minimax algorithm, Alpha-Beta pruning.",
                "topics": ["Heuristic Search & A* Algorithm", "Admissible & Consistent Heuristics", "Minimax Algorithm in Game Trees", "Alpha-Beta Pruning Optimization"]
            },
            {
                "unit_number": 3,
                "title": "Unit 3: Knowledge Representation & Reasoning",
                "description": "Propositional logic, First-Order Logic (FOL), inference mechanisms, forward and backward chaining, resolution, ontologies.",
                "topics": ["Propositional & First-Order Logic", "Forward & Backward Chaining", "Resolution Refutation", "Semantic Networks & Ontologies"]
            },
            {
                "unit_number": 4,
                "title": "Unit 4: Machine Learning Fundamentals & Neural Networks",
                "description": "Supervised vs unsupervised learning, linear regression, logistic regression, decision trees, perceptrons, multilayer perceptrons, backpropagation.",
                "topics": ["Supervised vs Unsupervised Paradigms", "Linear & Logistic Regression", "Decision Trees & Random Forests", "Multilayer Perceptrons & Backpropagation"]
            },
            {
                "unit_number": 5,
                "title": "Unit 5: NLP & Modern Generative AI",
                "description": "Text representation (TF-IDF, word embeddings), sequence models, Transformer architectures, attention mechanisms, LLM prompting principles.",
                "topics": ["Word Embeddings & Vector Representations", "Transformer & Attention Mechanism", "Large Language Model Architecture", "Prompt Engineering & Evaluation"]
            }
        ]
    },
    {
        "name": "Cloud Computing",
        "color": "#06B6D4",
        "target_grade": "A",
        "credits": 3,
        "units": [
            {
                "unit_number": 1,
                "title": "Unit 1: Cloud Architecture & Service Models",
                "description": "NIST cloud definitions, essential characteristics, service models (IaaS, PaaS, SaaS), deployment models (Public, Private, Hybrid, Multi-cloud).",
                "topics": ["NIST Cloud Computing Definitions", "IaaS, PaaS & SaaS Comparison", "Deployment Models (Public, Private, Hybrid)", "Cloud Economics & SLA Management"]
            },
            {
                "unit_number": 2,
                "title": "Unit 2: Virtualization & Containerization",
                "description": "Hypervisors (Type 1 and Type 2), hardware virtualization, container fundamentals (Docker), image registries, container networking and volumes.",
                "topics": ["Hypervisors & OS-level Virtualization", "Docker Container Lifecycle", "Container Images & Registries", "Resource Isolation (cgroups & namespaces)"]
            },
            {
                "unit_number": 3,
                "title": "Unit 3: Cloud Storage & Distributed Databases",
                "description": "Block storage, object storage (S3), file storage, CAP theorem, distributed consensus (Raft/Paxos), NoSQL database scaling.",
                "topics": ["Object Storage vs Block Storage", "CAP Theorem & PACELC", "Distributed Consistency Models", "NoSQL Scaling (Sharding & Replication)"]
            },
            {
                "unit_number": 4,
                "title": "Unit 4: Serverless Computing & Microservices",
                "description": "Microservices design patterns, API gateways, Function-as-a-Service (FaaS), event-driven architectures, asynchronous messaging (queues/pubsub).",
                "topics": ["Microservices vs Monolith Architecture", "Serverless & FaaS Paradigms", "API Gateways & Routing", "Event-Driven Messaging Queues"]
            },
            {
                "unit_number": 5,
                "title": "Unit 5: Cloud Security, Reliability & DevOps",
                "description": "Shared responsibility model, IAM, encryption at rest/in transit, autoscaling, load balancing, CI/CD pipelines, Infrastructure as Code (IaC).",
                "topics": ["Shared Responsibility Model", "Identity & Access Management (IAM)", "Autoscaling & Load Balancers", "CI/CD & Infrastructure as Code (Terraform)"]
            }
        ]
    }
]

async def ensure_default_subjects(user_id: str, db: AsyncSession) -> List[Subject]:
    """Ensures a new student has exactly the 4 default subjects with complete 5-unit syllabi."""
    created_list = []
    for s_data in DEFAULT_FOUR_SUBJECTS:
        topics_flat = []
        for u in s_data["units"]:
            topics_flat.extend(u["topics"])

        subj = Subject(
            user_id=user_id,
            name=s_data["name"],
            color=s_data["color"],
            target_grade=s_data["target_grade"],
            credits=s_data["credits"],
            syllabus_topics=topics_flat
        )
        db.add(subj)
        await db.flush()

        for u in s_data["units"]:
            unit = SubjectUnit(
                subject_id=subj.id,
                user_id=user_id,
                unit_number=u["unit_number"],
                title=u["title"],
                description=u["description"],
                topics=u["topics"]
            )
            db.add(unit)

        created_list.append(subj)

    await db.commit()
    for s in created_list:
        await db.refresh(s)
    return created_list

@router.get("/", response_model=List[SubjectRead])
async def list_subjects(
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = (
        select(Subject)
        .where(Subject.user_id == user.id)
        .options(selectinload(Subject.units))
        .order_by(Subject.created_at.asc())
    )
    res = await db.execute(stmt)
    subjects = res.scalars().all()

    if len(subjects) == 0:
        # Initialize the 4 default subjects for the newly created student account
        await ensure_default_subjects(user.id, db)
        res = await db.execute(stmt)
        subjects = res.scalars().all()

    return subjects

@router.post("/", response_model=SubjectRead, status_code=status.HTTP_201_CREATED)
async def create_subject(
    payload: SubjectCreate,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    subject = Subject(
        user_id=user.id,
        name=payload.name,
        color=payload.color or "#3B82F6",
        target_grade=payload.target_grade or "A",
        credits=payload.credits or 3,
        syllabus_topics=payload.syllabus_topics or []
    )
    db.add(subject)
    await db.flush()

    # If structured units were provided in payload, persist them
    if payload.units:
        for idx, u in enumerate(payload.units):
            unit = SubjectUnit(
                subject_id=subject.id,
                user_id=user.id,
                unit_number=u.unit_number or (idx + 1),
                title=u.title,
                description=u.description,
                topics=u.topics or []
            )
            db.add(unit)
    elif payload.syllabus_topics:
        # Auto-create units from syllabus_topics if provided as list
        for idx, topic_name in enumerate(payload.syllabus_topics):
            unit = SubjectUnit(
                subject_id=subject.id,
                user_id=user.id,
                unit_number=idx + 1,
                title=f"Unit {idx + 1}: {topic_name}" if not str(topic_name).startswith("Unit") else str(topic_name),
                topics=[str(topic_name)]
            )
            db.add(unit)

    await db.commit()
    
    # Reload with units
    stmt = select(Subject).where(Subject.id == subject.id).options(selectinload(Subject.units))
    res = await db.execute(stmt)
    return res.scalar_one()

@router.get("/{subject_id}", response_model=SubjectRead)
async def get_subject(
    subject_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Subject).where(Subject.id == subject_id).options(selectinload(Subject.units))
    res = await db.execute(stmt)
    subject = res.scalar_one_or_none()
    if not subject or subject.user_id != user.id:
        raise HTTPException(status_code=404, detail="Subject not found")
    return subject

@router.put("/{subject_id}", response_model=SubjectRead)
async def update_subject(
    subject_id: str,
    payload: SubjectUpdate,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(Subject).where(Subject.id == subject_id).options(selectinload(Subject.units))
    res = await db.execute(stmt)
    subject = res.scalar_one_or_none()
    if not subject or subject.user_id != user.id:
        raise HTTPException(status_code=404, detail="Subject not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(subject, field, value)

    await db.commit()
    await db.refresh(subject)
    return subject

@router.delete("/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_subject(
    subject_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    subject = await db.get(Subject, subject_id)
    if not subject or subject.user_id != user.id:
        raise HTTPException(status_code=404, detail="Subject not found")

    await db.delete(subject)
    await db.commit()
    return None

@router.get("/{subject_id}/units", response_model=List[SubjectUnitRead])
async def list_subject_units(
    subject_id: str,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    subject = await db.get(Subject, subject_id)
    if not subject or subject.user_id != user.id:
        raise HTTPException(status_code=404, detail="Subject not found")

    stmt = select(SubjectUnit).where(SubjectUnit.subject_id == subject_id).order_by(SubjectUnit.unit_number.asc())
    res = await db.execute(stmt)
    return res.scalars().all()

@router.post("/{subject_id}/units", response_model=SubjectUnitRead, status_code=status.HTTP_201_CREATED)
async def create_subject_unit(
    subject_id: str,
    payload: SubjectUnitCreate,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    subject = await db.get(Subject, subject_id)
    if not subject or subject.user_id != user.id:
        raise HTTPException(status_code=404, detail="Subject not found")

    unit = SubjectUnit(
        subject_id=subject_id,
        user_id=user.id,
        unit_number=payload.unit_number,
        title=payload.title,
        description=payload.description,
        topics=payload.topics or []
    )
    db.add(unit)
    await db.commit()
    await db.refresh(unit)
    return unit

@router.post("/{subject_id}/syllabus", response_model=List[SubjectUnitRead])
async def update_subject_syllabus(
    subject_id: str,
    units: List[SubjectUnitCreate],
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Replaces or uploads full structured syllabus units for a subject."""
    subject = await db.get(Subject, subject_id)
    if not subject or subject.user_id != user.id:
        raise HTTPException(status_code=404, detail="Subject not found")

    # Delete existing units for clean replace
    stmt = select(SubjectUnit).where(SubjectUnit.subject_id == subject_id)
    existing = (await db.execute(stmt)).scalars().all()
    for u in existing:
        await db.delete(u)

    created_units = []
    flat_topics = []
    for idx, u_payload in enumerate(units):
        unit = SubjectUnit(
            subject_id=subject_id,
            user_id=user.id,
            unit_number=u_payload.unit_number or (idx + 1),
            title=u_payload.title,
            description=u_payload.description,
            topics=u_payload.topics or []
        )
        db.add(unit)
        created_units.append(unit)
        flat_topics.extend(u_payload.topics or [u_payload.title])

    subject.syllabus_topics = flat_topics
    await db.commit()
    for u in created_units:
        await db.refresh(u)
    return created_units
