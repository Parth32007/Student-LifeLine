export interface StaticDataStore {
  profile: any;
  academicProfile: any;
  subjects: any[];
  tasks: any[];
  studySessions: any[];
  timetable: any[];
  assignments: any[];
  flashcardDecks: any[];
  flashcards: any[];
  mistakes: any[];
  codingProblems: any[];
  documents: any[];
  quizzes: any[];
  studyPlans: any[];
  conversations: any[];
}

export const initialStaticData: StaticDataStore = {
  profile: {
    id: "00000000-0000-0000-0000-000000000001",
    full_name: "Alex Rivera",
    avatar_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  academicProfile: {
    user_id: "00000000-0000-0000-0000-000000000001",
    education_level: "Undergraduate",
    college_university: "State Tech / Stanford CS",
    course: "B.Tech Computer Science",
    semester: 4,
    preferred_study_hours_start: "09:00:00",
    preferred_study_hours_end: "22:00:00",
    daily_available_hours: 4.5,
    break_duration_minutes: 15,
    goals: ["Master Tree & Graph Algorithms", "Achieve 4.0 GPA in DBMS & OS"],
    onboarding_completed: true
  },
  subjects: [
    {
      id: "sub-1",
      user_id: "00000000-0000-0000-0000-000000000001",
      name: "DBMS",
      color: "#3B82F6",
      target_grade: "A+",
      credits: 4,
      syllabus_topics: [
        "Unit 1: Introduction to DBMS & Relational Model",
        "Unit 2: SQL & Advanced Query Processing",
        "Unit 3: Normalization & Schema Refinement",
        "Unit 4: Transactions & Concurrency Control",
        "Unit 5: Storage Structures, Indexing & Recovery"
      ],
      units: [
        {
          id: "unit-sub-1-1",
          subject_id: "sub-1",
          unit_number: 1,
          title: "Unit 1: Introduction to DBMS & Relational Model",
          description: "Database architectures, ER modeling, relational algebra primitives.",
          topics: ["Database Architectures", "ER Modeling", "Relational Algebra"]
        },
        {
          id: "unit-sub-1-2",
          subject_id: "sub-1",
          unit_number: 2,
          title: "Unit 2: SQL & Advanced Query Processing",
          description: "Joins, subqueries, aggregations, window functions, and views.",
          topics: ["SQL Queries & Joins", "Subqueries & Aggregations", "Views"]
        },
        {
          id: "unit-sub-1-3",
          subject_id: "sub-1",
          unit_number: 3,
          title: "Unit 3: Normalization & Schema Refinement",
          description: "Functional dependencies, 1NF to BCNF, lossless join decomposition.",
          topics: ["Functional Dependencies", "1NF, 2NF, 3NF", "BCNF Normalization"]
        },
        {
          id: "unit-sub-1-4",
          subject_id: "sub-1",
          unit_number: 4,
          title: "Unit 4: Transactions & Concurrency Control",
          description: "ACID properties, serializability, 2PL protocol, deadlock detection.",
          topics: ["ACID Properties", "2PL Protocol", "Deadlocks & Recovery"]
        },
        {
          id: "unit-sub-1-5",
          subject_id: "sub-1",
          unit_number: 5,
          title: "Unit 5: Storage Structures, Indexing & Recovery",
          description: "B+ Trees indexing, hash indexes, WAL and ARIES recovery.",
          topics: ["B+ Trees Indexing", "Hashing", "WAL & ARIES Recovery"]
        }
      ],
      created_at: new Date().toISOString()
    },
    {
      id: "sub-2",
      user_id: "00000000-0000-0000-0000-000000000001",
      name: "Data Structures and Algorithms (DSA)",
      color: "#10B981",
      target_grade: "A+",
      credits: 4,
      syllabus_topics: [
        "Unit 1: Arrays, Strings & Two Pointers",
        "Unit 2: Linked Lists, Stacks & Queues",
        "Unit 3: Trees, Binary Search Trees & Heaps",
        "Unit 4: Graph Algorithms & Traversals",
        "Unit 5: Dynamic Programming & Greedy Approaches"
      ],
      units: [
        {
          id: "unit-sub-2-1",
          subject_id: "sub-2",
          unit_number: 1,
          title: "Unit 1: Arrays, Strings & Two Pointers",
          description: "Time/space complexity analysis, two-pointer techniques, sliding window.",
          topics: ["Big-O Complexity", "Two Pointers", "Sliding Window"]
        },
        {
          id: "unit-sub-2-2",
          subject_id: "sub-2",
          unit_number: 2,
          title: "Unit 2: Linked Lists, Stacks & Queues",
          description: "Fast/slow pointers, monotonic stacks, circular buffers.",
          topics: ["Linked Lists", "Monotonic Stacks", "Queues"]
        },
        {
          id: "unit-sub-2-3",
          subject_id: "sub-2",
          unit_number: 3,
          title: "Unit 3: Trees, Binary Search Trees & Heaps",
          description: "Tree traversals, lowest common ancestor, BST invariants, min/max heaps.",
          topics: ["Tree Traversals", "Lowest Common Ancestor", "Binary Heaps"]
        },
        {
          id: "unit-sub-2-4",
          subject_id: "sub-2",
          unit_number: 4,
          title: "Unit 4: Graph Algorithms & Traversals",
          description: "BFS, DFS, Dijkstra, topological sort, Disjoint Set Union.",
          topics: ["BFS & DFS", "Dijkstra Algorithm", "Topological Sort"]
        },
        {
          id: "unit-sub-2-5",
          subject_id: "sub-2",
          unit_number: 5,
          title: "Unit 5: Dynamic Programming & Greedy Approaches",
          description: "1D/2D DP, 0/1 Knapsack, LCS, greedy interval scheduling.",
          topics: ["1D/2D DP", "0/1 Knapsack", "Greedy Intervals"]
        }
      ],
      created_at: new Date().toISOString()
    },
    {
      id: "sub-3",
      user_id: "00000000-0000-0000-0000-000000000001",
      name: "Artificial Intelligence (AI)",
      color: "#8B5CF6",
      target_grade: "A",
      credits: 4,
      syllabus_topics: [
        "Unit 1: Foundations of AI & Problem Solving",
        "Unit 2: Informed Search & Adversarial Games",
        "Unit 3: Knowledge Representation & Reasoning",
        "Unit 4: Machine Learning Fundamentals & Neural Networks",
        "Unit 5: NLP & Modern Generative AI"
      ],
      units: [
        {
          id: "unit-sub-3-1",
          subject_id: "sub-3",
          unit_number: 1,
          title: "Unit 1: Foundations of AI & Problem Solving",
          description: "Rational agents, PEAS framework, state space search.",
          topics: ["Rational Agents", "State Space Search", "BFS/DFS"]
        },
        {
          id: "unit-sub-3-2",
          subject_id: "sub-3",
          unit_number: 2,
          title: "Unit 2: Informed Search & Adversarial Games",
          description: "Heuristic search, A* algorithm, Minimax, Alpha-Beta pruning.",
          topics: ["A* Search", "Heuristic Functions", "Minimax & Alpha-Beta"]
        },
        {
          id: "unit-sub-3-3",
          subject_id: "sub-3",
          unit_number: 3,
          title: "Unit 3: Knowledge Representation & Reasoning",
          description: "Propositional logic, First-Order Logic, resolution.",
          topics: ["Propositional Logic", "First-Order Logic", "Resolution"]
        },
        {
          id: "unit-sub-3-4",
          subject_id: "sub-3",
          unit_number: 4,
          title: "Unit 4: Machine Learning Fundamentals & Neural Networks",
          description: "Supervised learning, regression, decision trees, backpropagation.",
          topics: ["Supervised Learning", "Regression & Trees", "Neural Networks"]
        },
        {
          id: "unit-sub-3-5",
          subject_id: "sub-3",
          unit_number: 5,
          title: "Unit 5: NLP & Modern Generative AI",
          description: "Word embeddings, Transformers, attention mechanisms, LLMs.",
          topics: ["Word Embeddings", "Transformers", "LLM Prompting"]
        }
      ],
      created_at: new Date().toISOString()
    },
    {
      id: "sub-4",
      user_id: "00000000-0000-0000-0000-000000000001",
      name: "Cloud Computing",
      color: "#06B6D4",
      target_grade: "A",
      credits: 3,
      syllabus_topics: [
        "Unit 1: Cloud Architecture & Service Models",
        "Unit 2: Virtualization & Containerization",
        "Unit 3: Cloud Storage & Distributed Databases",
        "Unit 4: Serverless Computing & Microservices",
        "Unit 5: Cloud Security, Reliability & DevOps"
      ],
      units: [
        {
          id: "unit-sub-4-1",
          subject_id: "sub-4",
          unit_number: 1,
          title: "Unit 1: Cloud Architecture & Service Models",
          description: "NIST cloud definitions, IaaS, PaaS, SaaS, cloud deployment models.",
          topics: ["IaaS/PaaS/SaaS", "Deployment Models", "SLAs & Metrics"]
        },
        {
          id: "unit-sub-4-2",
          subject_id: "sub-4",
          unit_number: 2,
          title: "Unit 2: Virtualization & Containerization",
          description: "Hypervisors, Docker containers, container orchestration.",
          topics: ["Hypervisors", "Docker Containers", "Resource Isolation"]
        },
        {
          id: "unit-sub-4-3",
          subject_id: "sub-4",
          unit_number: 3,
          title: "Unit 3: Cloud Storage & Distributed Databases",
          description: "Block vs object storage (S3), CAP theorem, distributed databases.",
          topics: ["Object Storage (S3)", "CAP Theorem", "NoSQL Scaling"]
        },
        {
          id: "unit-sub-4-4",
          subject_id: "sub-4",
          unit_number: 4,
          title: "Unit 4: Serverless Computing & Microservices",
          description: "Microservices design patterns, API gateways, AWS Lambda / FaaS.",
          topics: ["Microservices", "Serverless & FaaS", "API Gateways"]
        },
        {
          id: "unit-sub-4-5",
          subject_id: "sub-4",
          unit_number: 5,
          title: "Unit 5: Cloud Security, Reliability & DevOps",
          description: "Shared responsibility, IAM, autoscaling, CI/CD, Terraform.",
          topics: ["Shared Responsibility", "IAM", "Autoscaling & IaC"]
        }
      ],
      created_at: new Date().toISOString()
    }
  ],
  tasks: [
    {
      id: "task-1",
      user_id: "00000000-0000-0000-0000-000000000001",
      subject_id: "sub-1",
      subject_name: "Database Management Systems",
      subject_color: "#3B82F6",
      title: "DBMS — Master BCNF Decomposition",
      topic: "Normalization",
      learning_objective: "Determine candidate keys and test lossless join decomposition",
      scheduled_date: new Date().toISOString().split('T')[0],
      start_time: "09:00",
      end_time: "10:00",
      estimated_duration_minutes: 60,
      actual_duration_minutes: 60,
      priority: "urgent",
      difficulty: "hard",
      status: "completed",
      is_locked: true,
      created_at: new Date().toISOString()
    },
    {
      id: "task-2",
      user_id: "00000000-0000-0000-0000-000000000001",
      subject_id: "sub-2",
      subject_name: "Data Structures & Algorithms",
      subject_color: "#10B981",
      title: "DSA — Solve 2 Binary Search Problems",
      topic: "Binary Search",
      learning_objective: "Implement search in rotated sorted array without recursion",
      scheduled_date: new Date().toISOString().split('T')[0],
      start_time: "10:15",
      end_time: "11:00",
      estimated_duration_minutes: 45,
      actual_duration_minutes: 0,
      priority: "high",
      difficulty: "medium",
      status: "pending",
      is_locked: false,
      created_at: new Date().toISOString()
    },
    {
      id: "task-3",
      user_id: "00000000-0000-0000-0000-000000000001",
      subject_id: "sub-3",
      subject_name: "Operating Systems",
      subject_color: "#8B5CF6",
      title: "OS — Page Replacement Simulations",
      topic: "Virtual Memory",
      learning_objective: "Calculate page faults for LRU and FIFO algorithms",
      scheduled_date: new Date().toISOString().split('T')[0],
      start_time: "14:00",
      end_time: "15:00",
      estimated_duration_minutes: 60,
      actual_duration_minutes: 0,
      priority: "medium",
      difficulty: "medium",
      status: "pending",
      is_locked: false,
      created_at: new Date().toISOString()
    },
    {
      id: "task-4",
      user_id: "00000000-0000-0000-0000-000000000001",
      subject_id: "sub-4",
      subject_name: "Computer Networks",
      subject_color: "#F59E0B",
      title: "CN — TCP Three-Way Handshake Review",
      topic: "Transport Layer",
      learning_objective: "Diagram sequence numbers and SYN/ACK flags",
      scheduled_date: new Date().toISOString().split('T')[0],
      start_time: "17:00",
      end_time: "17:45",
      estimated_duration_minutes: 45,
      actual_duration_minutes: 0,
      priority: "low",
      difficulty: "easy",
      status: "pending",
      is_locked: false,
      created_at: new Date().toISOString()
    }
  ],
  studySessions: [
    {
      id: "sess-1",
      task_id: "task-1",
      subject_id: "sub-1",
      started_at: new Date(Date.now() - 3600000 * 3).toISOString(),
      ended_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      duration_minutes: 60,
      notes: "Solved BCNF decomposition proofs. Understood that BCNF may not preserve functional dependencies.",
      completed_objective: true
    },
    {
      id: "sess-2",
      task_id: "task-2",
      subject_id: "sub-2",
      started_at: new Date(Date.now() - 86400000).toISOString(),
      ended_at: new Date(Date.now() - 86400000 + 2700000).toISOString(),
      duration_minutes: 45,
      notes: "Coded search in rotated sorted array in O(log N).",
      completed_objective: true
    },
    {
      id: "sess-3",
      task_id: "task-3",
      subject_id: "sub-3",
      started_at: new Date(Date.now() - 86400000 * 2).toISOString(),
      ended_at: new Date(Date.now() - 86400000 * 2 + 3600000).toISOString(),
      duration_minutes: 60,
      notes: "Practiced FIFO vs LRU page fault counters.",
      completed_objective: true
    }
  ],
  timetable: [
    { id: "tt-1", subject_id: "sub-1", subject_name: "DBMS", subject_color: "#3B82F6", title: "DBMS Lecture (Prof. Miller)", day_of_week: 1, start_time: "11:15", end_time: "12:45", location: "Hall 101", is_recurring: true },
    { id: "tt-2", subject_id: "sub-2", subject_name: "DSA", subject_color: "#10B981", title: "DSA Lab Session", day_of_week: 1, start_time: "15:15", end_time: "16:45", location: "Lab 4", is_recurring: true },
    { id: "tt-3", subject_id: "sub-3", subject_name: "OS", subject_color: "#8B5CF6", title: "Operating Systems Core", day_of_week: 2, start_time: "10:00", end_time: "11:30", location: "Hall 204", is_recurring: true },
    { id: "tt-4", subject_id: "sub-4", subject_name: "CN", subject_color: "#F59E0B", title: "Computer Networks Lecture", day_of_week: 3, start_time: "09:00", end_time: "10:30", location: "Hall 102", is_recurring: true },
    { id: "tt-5", subject_id: "sub-1", subject_name: "DBMS", subject_color: "#3B82F6", title: "DBMS Advanced Workshop", day_of_week: 4, start_time: "13:00", end_time: "14:30", location: "Hall 101", is_recurring: true },
    { id: "tt-6", subject_id: "sub-2", subject_name: "DSA", subject_color: "#10B981", title: "DSA Algorithms Seminar", day_of_week: 5, start_time: "11:00", end_time: "12:30", location: "Auditorium C", is_recurring: true }
  ],
  assignments: [
    {
      id: "asg-1",
      subject_id: "sub-1",
      subject_name: "Database Management Systems",
      subject_color: "#3B82F6",
      title: "Hospital Management Database Schema & SQL",
      description: "Design schema with at least 5 tables in 3NF and provide 10 analytical SQL queries.",
      due_date: new Date(Date.now() + 86400000 * 2).toISOString(),
      priority: "urgent",
      status: "in_progress",
      estimated_effort_hours: 4.0
    },
    {
      id: "asg-2",
      subject_id: "sub-2",
      subject_name: "Data Structures & Algorithms",
      subject_color: "#10B981",
      title: "Binary Tree Serialization & Traversal Project",
      description: "Implement serialize and deserialize binary tree using preorder traversal.",
      due_date: new Date(Date.now() + 86400000 * 5).toISOString(),
      priority: "high",
      status: "todo",
      estimated_effort_hours: 3.0
    },
    {
      id: "asg-3",
      subject_id: "sub-3",
      subject_name: "Operating Systems",
      subject_color: "#8B5CF6",
      title: "Multi-threaded Producer-Consumer Implementation",
      description: "Write thread-safe buffer using POSIX mutex and condition variables.",
      due_date: new Date(Date.now() - 86400000).toISOString(),
      priority: "medium",
      status: "completed",
      estimated_effort_hours: 2.5
    }
  ],
  flashcardDecks: [
    {
      id: "deck-1",
      subject_id: "sub-1",
      subject_name: "Database Management Systems",
      title: "DBMS: Normalization & Indexing Essentials",
      description: "High-yield exam definitions and functional dependency rules",
      created_at: new Date().toISOString(),
      cards_count: 4,
      due_today_count: 4
    }
  ],
  flashcards: [
    {
      id: "card-1",
      deck_id: "deck-1",
      user_id: "00000000-0000-0000-0000-000000000001",
      question: "What is the primary condition for 2nd Normal Form (2NF)?",
      answer: "Table must be in 1NF and have NO partial dependency (every non-prime attribute must be fully functionally dependent on the primary key).",
      difficulty: "medium",
      interval_days: 1,
      repetition_count: 1,
      ease_factor: 2.5,
      next_review_date: new Date().toISOString().split('T')[0]
    },
    {
      id: "card-2",
      deck_id: "deck-1",
      user_id: "00000000-0000-0000-0000-000000000001",
      question: "What is Boyce-Codd Normal Form (BCNF)?",
      answer: "For every functional dependency X -> Y, X must be a super key.",
      difficulty: "medium",
      interval_days: 1,
      repetition_count: 1,
      ease_factor: 2.5,
      next_review_date: new Date().toISOString().split('T')[0]
    },
    {
      id: "card-3",
      deck_id: "deck-1",
      user_id: "00000000-0000-0000-0000-000000000001",
      question: "What is the difference between Clustered and Non-Clustered Index?",
      answer: "Clustered index defines the physical order of data rows (only 1 per table). Non-clustered index creates a separate pointer structure to rows.",
      difficulty: "medium",
      interval_days: 1,
      repetition_count: 1,
      ease_factor: 2.5,
      next_review_date: new Date().toISOString().split('T')[0]
    },
    {
      id: "card-4",
      deck_id: "deck-1",
      user_id: "00000000-0000-0000-0000-000000000001",
      question: "What does ACID stand for in DBMS transactions?",
      answer: "Atomicity, Consistency, Isolation, Durability.",
      difficulty: "medium",
      interval_days: 1,
      repetition_count: 1,
      ease_factor: 2.5,
      next_review_date: new Date().toISOString().split('T')[0]
    }
  ],
  mistakes: [
    {
      id: "mstk-1",
      subject_id: "sub-1",
      subject_name: "Database Management Systems",
      source_type: "quiz",
      question_or_problem: "Does BCNF always preserve functional dependencies during decomposition?",
      user_mistake: "Yes, all normal forms preserve dependencies.",
      correct_solution: "No! BCNF is guaranteed to be lossless, but it may NOT preserve functional dependencies (unlike 3NF).",
      explanation: "Classic trade-off: 3NF guarantees dependency preservation; BCNF eliminates all redundancy but can lose dependencies.",
      topic: "BCNF Decomposition",
      mistake_count: 1,
      mastered: false,
      created_at: new Date().toISOString()
    },
    {
      id: "mstk-2",
      subject_id: "sub-2",
      subject_name: "Data Structures & Algorithms",
      source_type: "coding",
      question_or_problem: "Finding loop in linked list without extra space",
      user_mistake: "Used a hash set of node pointers.",
      correct_solution: "Floyd's Cycle-Finding Algorithm (Fast & Slow Pointers) uses O(1) space.",
      explanation: "Slow pointer moves 1 step, fast pointer moves 2 steps. If they meet, a cycle exists.",
      topic: "Linked Lists",
      mistake_count: 1,
      mastered: false,
      created_at: new Date().toISOString()
    }
  ],
  codingProblems: [
    {
      id: "cp-1",
      title: "33. Search in Rotated Sorted Array",
      platform: "LeetCode",
      url: "https://leetcode.com/problems/search-in-rotated-sorted-array/",
      topic: "Binary Search",
      difficulty: "medium",
      language: "Python",
      status: "solved",
      attempts_count: 1,
      notes: "Key insight: at least one half (left or right) is always sorted. Check if target lies within sorted half.",
      solved_at: new Date().toISOString().split('T')[0]
    },
    {
      id: "cp-2",
      title: "15. 3Sum",
      platform: "LeetCode",
      url: "https://leetcode.com/problems/3sum/",
      topic: "Two Pointers",
      difficulty: "medium",
      language: "Python",
      status: "solved",
      attempts_count: 1,
      notes: "Sort array first, fix one element, use two pointers for remaining two. Guard against duplicate triplets.",
      solved_at: new Date().toISOString().split('T')[0]
    },
    {
      id: "cp-3",
      title: "236. Lowest Common Ancestor of a Binary Tree",
      platform: "LeetCode",
      url: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/",
      topic: "Trees",
      difficulty: "medium",
      language: "Python",
      status: "solved",
      attempts_count: 1,
      notes: "Postorder traversal: return root if matching p or q, otherwise aggregate left and right recursive answers.",
      solved_at: new Date().toISOString().split('T')[0]
    }
  ],
  documents: [
    {
      id: "doc-1",
      user_id: "00000000-0000-0000-0000-000000000001",
      subject_id: "sub-1",
      subject_name: "Database Management Systems",
      title: "DBMS Unit 2 — Normalization & Relational Theory.pdf",
      file_type: "pdf",
      file_size_bytes: 2450000,
      status: "ready",
      summary: "Covers functional dependencies, Armstrong axioms, canonical cover, and normal forms from 1NF to BCNF with step-by-step lossless join proof.",
      key_points: [
        "A relation is in 1NF if all domain attributes are atomic.",
        "2NF removes partial key dependencies using candidate key closure.",
        "3NF allows transitive dependencies only when right side is prime attribute.",
        "BCNF requires determinant X to be a superkey for every non-trivial X -> Y."
      ],
      formulas_definitions: [
        { name: "Armstrong Axiom: Transitivity", description: "If X -> Y and Y -> Z, then X -> Z." },
        { name: "Lossless Join Decomposition", description: "R1 ∩ R2 -> R1 or R1 ∩ R2 -> R2 must hold in F+." }
      ],
      created_at: new Date().toISOString()
    }
  ],
  quizzes: [
    {
      id: "quiz-1",
      subject_id: "sub-1",
      subject_name: "Database Management Systems",
      title: "DBMS: Normalization & Transactions Check",
      topic: "Unit 2 Concepts",
      difficulty: "medium",
      time_limit_minutes: 15,
      is_mock_exam: false,
      created_at: new Date().toISOString(),
      questions: [
        {
          id: "q-1",
          question_type: "mcq",
          question_text: "Which normal form strictly requires every determinant to be a super key?",
          options: ["1NF", "2NF", "3NF", "BCNF"],
          points: 1
        },
        {
          id: "q-2",
          question_type: "true_false",
          question_text: "3NF decomposition always preserves both lossless join and functional dependencies.",
          options: ["True", "False"],
          points: 1
        },
        {
          id: "q-3",
          question_type: "mcq",
          question_text: "What isolation level in SQL prevents phantom reads?",
          options: ["Read Uncommitted", "Read Committed", "Repeatable Read", "Serializable"],
          points: 1
        }
      ]
    }
  ],
  studyPlans: [
    {
      id: "plan-1",
      subject_id: "sub-1",
      title: "DBMS 7-Day Final Exam Sprint",
      exam_date: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
      total_days: 7,
      status: "active",
      items: [
        { id: "pi-1", plan_id: "plan-1", day_number: 1, topics: ["ER Models & Relational Schema"], time_allocation_minutes: 180, learning_objectives: ["Draw ER diagrams & map cardinality constraints"], practice_questions: ["Convert weak entity set into relational table"], is_completed: true },
        { id: "pi-2", plan_id: "plan-1", day_number: 2, topics: ["Functional Dependencies & Closure"], time_allocation_minutes: 180, learning_objectives: ["Compute attribute closures & minimal cover"], practice_questions: ["Find candidate keys for R(A,B,C,D,E) given F"], is_completed: true },
        { id: "pi-3", plan_id: "plan-1", day_number: 3, topics: ["Normalization: 2NF, 3NF & BCNF"], time_allocation_minutes: 240, learning_objectives: ["Decompose relation into BCNF & test lossless join"], practice_questions: ["Is decomposition of R into R1, R2 lossless?"], is_completed: false },
        { id: "pi-4", plan_id: "plan-1", day_number: 4, topics: ["SQL Joins & Complex Queries"], time_allocation_minutes: 180, learning_objectives: ["Write correlated subqueries & window functions"], practice_questions: ["Find second highest salary in department"], is_completed: false },
        { id: "pi-5", plan_id: "plan-1", day_number: 5, topics: ["Transactions & 2PL Concurrency"], time_allocation_minutes: 210, learning_objectives: ["Understand conflict serializability & deadlock detection"], practice_questions: ["Draw precedence graph for schedule S"], is_completed: false },
        { id: "pi-6", plan_id: "plan-1", day_number: 6, topics: ["B+ Tree Indexing & Query Optimization"], time_allocation_minutes: 180, learning_objectives: ["Trace B+ tree insert/delete operations"], practice_questions: ["Insert keys 10, 20, 30 into B+ tree of order 3"], is_completed: false },
        { id: "pi-7", plan_id: "plan-1", day_number: 7, topics: ["Full Mock Exam & Mistake Notebook Revision"], time_allocation_minutes: 150, learning_objectives: ["Score > 85% on full practice assessment"], practice_questions: ["Clear all unmastered mistakes in notebook"], is_completed: false }
      ]
    }
  ],
  conversations: [
    {
      id: "conv-1",
      title: "DBMS Normalization & BCNF Query",
      mode: "notes_rag",
      subject_id: "sub-1",
      subject_name: "Database Management Systems",
      updated_at: new Date().toISOString(),
      messages: [
        {
          id: "m-1",
          conversation_id: "conv-1",
          role: "user",
          content: "Why can BCNF lose functional dependencies?",
          created_at: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: "m-2",
          conversation_id: "conv-1",
          role: "assistant",
          content: "In relational database design, **BCNF** enforces the strict rule that for every non-trivial functional dependency $X \\to Y$, $X$ must be a **super key**.\n\nWhen decomposing a relation to satisfy this, dependencies whose attributes are split across distinct tables can no longer be checked within a single table without an expensive join. Therefore, 3NF guarantees dependency preservation, while BCNF eliminates all update anomalies at the potential cost of cross-table dependencies.",
          citations: [
            {
              document_title: "DBMS Unit 2 — Normalization & Relational Theory.pdf",
              document_id: "doc-1",
              page_number: 4,
              snippet: "BCNF requires determinant X to be a superkey. Dependency preservation is guaranteed in 3NF, but not always in BCNF."
            }
          ],
          created_at: new Date(Date.now() - 3550000).toISOString()
        }
      ]
    }
  ]
};
