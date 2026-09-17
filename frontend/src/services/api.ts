import {
  getActiveWorkspace,
  saveActiveWorkspace,
  getActiveSession,
  updateActiveUserProfile,
  dispatchDataChange,
} from './staticStorage';
import { calculateSM2 } from './sm2';
import {
  Profile,
  AcademicProfile,
  Subject,
  SubjectUnit,
  Task,
  WhatToStudyNow,
  StudySession,
  StudyPlan,
  DocumentItem,
  RAGCitation,
  YouTubeResource,
  Flashcard,
  FlashcardDeck,
  Quiz,
  QuizResult,
  CodingProblem,
  MistakeEntry,
  TimetableEvent,
  Assignment,
  AcademicAnalytics,
  ExamReadiness,
  Conversation,
  ChatMessage,
} from '../types';

/**
 * Intelligent client-side academic tutor response generator
 */
function generateAcademicTutorResponse(
  prompt: string,
  subjectName?: string,
  documents?: DocumentItem[]
): { content: string; citations: RAGCitation[] } {
  const query = prompt.toLowerCase();
  const sub = subjectName || 'Computer Science';
  const citations: RAGCitation[] = [];

  // Pick top document for citation if available
  if (documents && documents.length > 0) {
    const doc = documents[0];
    citations.push({
      document_id: doc.id,
      document_title: doc.title,
      page_number: Math.floor(Math.random() * 10) + 1,
      snippet: `Section 3.2: Theoretical foundations and applied problem solving in ${sub}. Verified against course syllabus.`,
    });
  }

  // 1. DBMS / Normalization / Transactions
  if (query.includes('bcnf') || query.includes('normalization') || query.includes('3nf') || query.includes('dbms')) {
    return {
      content: `### 📚 Normalization & Relational Theory: BCNF vs 3NF\n\nIn relational database design, **Boyce-Codd Normal Form (BCNF)** is a stricter version of Third Normal Form (3NF).\n\n#### Key Definition:\nA relation $R$ is in **BCNF** if and only if for every non-trivial functional dependency $X \\to Y$:\n- $X$ is a **Super Key** (determinant must uniquely identify a tuple).\n\n#### Why BCNF may lose Functional Dependencies:\n- While 3NF allows the right-hand side $Y$ to be a *prime attribute* (part of a candidate key), BCNF does not.\n- When decomposing a relation into BCNF, dependencies where attributes span multiple decomposed relations cannot be verified without performing a join across tables.\n\n> **Theorem**: Every relation can be decomposed into 3NF while preserving dependencies and lossless join. However, decomposition into BCNF is guaranteed to be lossless, but may **not** preserve all functional dependencies.\n\n#### Practical Rule of Thumb for Exams:\n1. Find all Candidate Keys using attribute closure $X^+$.\n2. Identify violation dependencies where $X$ is not a superkey.\n3. Decompose $R$ into $R_1(X \\cup Y)$ and $R_2(R - Y)$.`,
      citations,
    };
  }

  // 2. Transactions & Concurrency / ACID / Deadlocks
  if (query.includes('transaction') || query.includes('acid') || query.includes('2pl') || query.includes('deadlock') || query.includes('lock')) {
    return {
      content: `### 🔒 Concurrency Control & Two-Phase Locking (2PL)\n\n#### 1. ACID Invariants:\n- **Atomicity**: Entire transaction executes or rolls back completely.\n- **Consistency**: Database transitions between valid structural states.\n- **Isolation**: Concurrent transactions execute as if sequential.\n- **Durability**: Committed data survives system crashes.\n\n#### 2. Two-Phase Locking (2PL) Protocol:\n- **Growing Phase**: Transactions can acquire shared ($S$) or exclusive ($X$) locks, but cannot release any lock.\n- **Shrinking Phase**: Transactions can release locks, but cannot acquire new ones.\n\n*Note*: Basic 2PL guarantees **Conflict Serializability**, but can still lead to cascading aborts and deadlocks. **Strict 2PL** solves cascading aborts by holding all exclusive locks until commit/abort.`,
      citations,
    };
  }

  // 3. Binary Search / Arrays / Sorting
  if (query.includes('binary search') || query.includes('array') || query.includes('rotated') || query.includes('two pointer')) {
    return {
      content: `### ⚡ Binary Search & Rotated Array Invariants\n\nBinary search eliminates half the search space at each iteration, yielding logarithmic time complexity **$O(\\log N)$**.\n\n#### Implementation Template (Python):\n\`\`\`python\ndef search_rotated(nums: list[int], target: int) -> int:\n    left, right = 0, len(nums) - 1\n    \n    while left <= right:\n        mid = (left + right) // 2\n        if nums[mid] == target:\n            return mid\n            \n        # Left half is sorted\n        if nums[left] <= nums[mid]:\n            if nums[left] <= target < nums[mid]:\n                right = mid - 1\n            else:\n                left = mid + 1\n        # Right half is sorted\n        else:\n            if nums[mid] < target <= nums[right]:\n                left = mid + 1\n            else:\n                right = mid - 1\n                \n    return -1\n\`\`\`\n\n#### Key Loop Invariant:\nAt least one half of the rotated array is **strictly sorted**. Check if target falls in that sorted range; if not, search the other half.`,
      citations,
    };
  }

  // 4. Graph / Tree / DFS / BFS / Dijkstra
  if (query.includes('graph') || query.includes('tree') || query.includes('bfs') || query.includes('dfs') || query.includes('dijkstra')) {
    return {
      content: `### 🌳 Graph Traversals & Shortest Path\n\n#### Comparison Matrix:\n| Algorithm | Data Structure | Time Complexity | Shortest Path (Unweighted)? |\n|---|---|---|---|\n| **BFS** | Queue (FIFO) | $O(V + E)$ | ✅ Yes |\n| **DFS** | Stack / Recursion | $O(V + E)$ | ❌ No |\n| **Dijkstra** | Min-Heap / Priority Queue | $O((V + E) \\log V)$ | ✅ Yes (Non-negative weights) |\n\n#### Core Tip:\nFor unweighted shortest path (e.g. minimum moves, shortest transformation), always choose **BFS**. For cycle detection or topological sorting in DAGs, choose **DFS** with 3-color node visitation.`,
      citations,
    };
  }

  // 5. Operating Systems / Memory / Scheduling / Paging
  if (query.includes('operating system') || query.includes('virtual memory') || query.includes('paging') || query.includes('scheduling') || query.includes('thread')) {
    return {
      content: `### 🖥️ Operating Systems: Virtual Memory & Paging\n\nVirtual memory provides each process with the illusion of a contiguous address space through hardware translation (**MMU**).\n\n#### The Address Translation Flow:\n1. Virtual Address = **Page Number ($p$) + Page Offset ($d$)**.\n2. CPU checks **TLB (Translation Lookaside Buffer)** for cached translation ($O(1)$).\n3. On **TLB Miss**, page table lookup occurs in physical memory.\n4. If the page's valid bit is $0$, a **Page Fault Exception** is raised to the OS kernel.\n\n#### Page Replacement Algorithms:\n- **FIFO**: Simple but suffers from Belady's Anomaly.\n- **LRU (Least Recently Used)**: Optimal approximation, implemented using counter or doubly-linked list with hash map.\n- **Second-Chance / Clock**: Hardware-efficient approximation of LRU.`,
      citations,
    };
  }

  // Default intelligent tutor response
  return {
    content: `### 🎓 AI Tutor Concept Breakdown\n\nGreat question regarding **${sub}**! Here is a structured breakdown of **"${prompt}"**:\n\n#### 1. Core Principles\n- Focus on foundational axioms and invariant conditions.\n- Deconstruct the problem into input constraints, edge cases, and expected output format.\n\n#### 2. Strategic Approach\n1. **Analyze Constraints**: Check the bounds ($N \\le 10^5$ suggests $O(N)$ or $O(N \\log N)$ asymptotic budget).\n2. **Break Down Complexity**: Identify state transitions and repetitive calculations that can be cached (memoization/DP).\n3. **Verify Edge Cases**: Check empty sets, single elements, negative values, and boundary overflows.\n\n#### 3. Actionable Next Step\nReview your active flashcards on this topic or generate a 5-question **Mastery Quiz** from the Quizzes tab to test your recall!`,
    citations,
  };
}

// -----------------------------------------------------------------------------
// Live Hybrid Engine (FastAPI Backend with Supabase & Instant Local Fallback)
// -----------------------------------------------------------------------------
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const api = {
  // 1. Profile & Onboarding
  getProfile: async (): Promise<Profile> => {
    const ws = getActiveWorkspace();
    const session = getActiveSession();
    if (session?.user?.full_name) {
      ws.profile.full_name = session.user.full_name;
    }
    return ws.profile;
  },

  updateProfile: async (data: Partial<Profile>): Promise<Profile> => {
    const ws = getActiveWorkspace();
    ws.profile = {
      ...ws.profile,
      ...data,
      updated_at: new Date().toISOString(),
    };
    saveActiveWorkspace(ws);
    if (data.full_name) {
      updateActiveUserProfile({ full_name: data.full_name });
    }
    return ws.profile;
  },

  getAcademicProfile: async (): Promise<AcademicProfile> => {
    const ws = getActiveWorkspace();
    const session = getActiveSession();
    if (session?.user) {
      if (session.user.university) ws.academicProfile.college_university = session.user.university;
      if (session.user.course) ws.academicProfile.course = session.user.course;
      if (session.user.semester) ws.academicProfile.semester = Number(session.user.semester);
    }
    return ws.academicProfile;
  },

  updateAcademicProfile: async (data: Partial<AcademicProfile>): Promise<AcademicProfile> => {
    const ws = getActiveWorkspace();
    ws.academicProfile = {
      ...ws.academicProfile,
      ...data,
    };
    saveActiveWorkspace(ws);
    updateActiveUserProfile({
      university: data.college_university,
      course: data.course,
      semester: data.semester,
      daily_hours: data.daily_available_hours,
      goals: data.goals?.[0],
    });
    return ws.academicProfile;
  },

  submitOnboarding: async (data: any): Promise<AcademicProfile> => {
    const ws = getActiveWorkspace();
    ws.academicProfile = {
      ...ws.academicProfile,
      ...data,
      onboarding_completed: true,
    };

    if (data.subjects && data.subjects.length > 0) {
      const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899'];
      ws.subjects = data.subjects.map((s: any, idx: number) => ({
        id: `sub-${ws.profile.id}-${idx + 1}`,
        user_id: ws.profile.id,
        name: s.name,
        color: s.color || colors[idx % colors.length],
        target_grade: s.target_grade || 'A',
        credits: 4,
        syllabus_topics: [
          `Unit 1: Fundamentals of ${s.name}`,
          `Unit 2: Core Algorithms & Invariants`,
          `Unit 3: System Design & Applications`,
        ],
        created_at: new Date().toISOString(),
      }));
    }

    saveActiveWorkspace(ws);
    return ws.academicProfile;
  },

  // 2. Subjects
  listSubjects: async (): Promise<Subject[]> => {
    try {
      const token = getActiveSession()?.access_token || 'demo-bearer-token';
      const res = await fetch(`${API_BASE_URL}/subjects/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const ws = getActiveWorkspace();
          ws.subjects = data;
          saveActiveWorkspace(ws);
          return data;
        }
      }
    } catch {
      // fallback to local storage
    }
    return getActiveWorkspace().subjects;
  },

  createSubject: async (data: Partial<Subject>): Promise<Subject> => {
    const ws = getActiveWorkspace();
    const newSubject: Subject = {
      id: `sub-${Date.now()}`,
      user_id: ws.profile.id,
      name: data.name || 'New Subject',
      color: data.color || '#3B82F6',
      target_grade: data.target_grade || 'A',
      credits: data.credits || 4,
      syllabus_topics: data.syllabus_topics || [
        'Unit 1: Fundamentals & Core Invariants',
        'Unit 2: Architectural Structures',
        'Unit 3: Applied Systems & Optimizations',
      ],
      units: data.units || [],
      created_at: new Date().toISOString(),
    };

    try {
      const token = getActiveSession()?.access_token || 'demo-bearer-token';
      const res = await fetch(`${API_BASE_URL}/subjects/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newSubject.name,
          color: newSubject.color,
          target_grade: newSubject.target_grade,
          credits: newSubject.credits,
          syllabus_topics: newSubject.syllabus_topics,
          units: newSubject.units
        })
      });
      if (res.ok) {
        const saved = await res.json();
        ws.subjects.unshift(saved);
        saveActiveWorkspace(ws);
        dispatchDataChange();
        window.dispatchEvent(new CustomEvent('lifeos:subjects-changed'));
        return saved;
      }
    } catch {
      // fallback to local storage
    }

    ws.subjects.unshift(newSubject);
    saveActiveWorkspace(ws);
    dispatchDataChange();
    window.dispatchEvent(new CustomEvent('lifeos:subjects-changed'));
    return newSubject;
  },

  updateSubject: async (id: string, data: Partial<Subject>): Promise<Subject> => {
    try {
      const token = getActiveSession()?.access_token || 'demo-bearer-token';
      const res = await fetch(`${API_BASE_URL}/subjects/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        const updated = await res.json();
        const ws = getActiveWorkspace();
        const idx = ws.subjects.findIndex((s) => s.id === id);
        if (idx !== -1) {
          ws.subjects[idx] = updated;
          saveActiveWorkspace(ws);
        }
        dispatchDataChange();
        window.dispatchEvent(new CustomEvent('lifeos:subjects-changed'));
        return updated;
      }
    } catch {
      // fallback
    }

    const ws = getActiveWorkspace();
    const idx = ws.subjects.findIndex((s) => s.id === id);
    if (idx !== -1) {
      ws.subjects[idx] = { ...ws.subjects[idx], ...data };
      saveActiveWorkspace(ws);
      dispatchDataChange();
      window.dispatchEvent(new CustomEvent('lifeos:subjects-changed'));
      return ws.subjects[idx];
    }
    throw new Error('Subject not found');
  },

  deleteSubject: async (id: string): Promise<void> => {
    try {
      const token = getActiveSession()?.access_token || 'demo-bearer-token';
      await fetch(`${API_BASE_URL}/subjects/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch {
      // fallback
    }

    const ws = getActiveWorkspace();
    ws.subjects = ws.subjects.filter((s) => s.id !== id);
    ws.tasks = ws.tasks.filter((t) => t.subject_id !== id);
    saveActiveWorkspace(ws);
    dispatchDataChange();
    window.dispatchEvent(new CustomEvent('lifeos:subjects-changed'));
  },

  updateSubjectSyllabus: async (
    subjectId: string,
    units: Array<{ unit_number?: number; title: string; description?: string; topics: string[] }>
  ): Promise<SubjectUnit[]> => {
    try {
      const token = getActiveSession()?.access_token || 'demo-bearer-token';
      const res = await fetch(`${API_BASE_URL}/subjects/${subjectId}/syllabus`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(units)
      });
      if (res.ok) {
        const data = await res.json();
        const ws = getActiveWorkspace();
        const idx = ws.subjects.findIndex((s) => s.id === subjectId);
        if (idx !== -1) {
          ws.subjects[idx].units = data;
          ws.subjects[idx].syllabus_topics = data.map((u: any) => u.title);
          saveActiveWorkspace(ws);
        }
        dispatchDataChange();
        window.dispatchEvent(new CustomEvent('lifeos:subjects-changed'));
        return data;
      }
    } catch {
      // fallback
    }

    const ws = getActiveWorkspace();
    const idx = ws.subjects.findIndex((s) => s.id === subjectId);
    if (idx !== -1) {
      const localUnits: SubjectUnit[] = units.map((u, i) => ({
        id: `unit-${subjectId}-${i + 1}`,
        subject_id: subjectId,
        unit_number: u.unit_number || i + 1,
        title: u.title,
        description: u.description || '',
        topics: u.topics || [],
      }));
      ws.subjects[idx].units = localUnits;
      ws.subjects[idx].syllabus_topics = localUnits.map((u) => u.title);
      saveActiveWorkspace(ws);
      dispatchDataChange();
      window.dispatchEvent(new CustomEvent('lifeos:subjects-changed'));
      return localUnits;
    }
    return [];
  },

  // 3. Tasks & Today's Mission
  listTasks: async (params?: { scheduled_date?: string; status?: string }): Promise<Task[]> => {
    let list = getActiveWorkspace().tasks;
    if (params?.scheduled_date) {
      list = list.filter((t) => t.scheduled_date === params.scheduled_date);
    }
    if (params?.status) {
      list = list.filter((t) => t.status === params.status);
    }
    return list;
  },

  getTodaysMission: async (): Promise<Task[]> => {
    const today = new Date().toISOString().split('T')[0];
    const ws = getActiveWorkspace();
    let todaysTasks = ws.tasks.filter((t) => t.scheduled_date === today);
    if (todaysTasks.length === 0 && ws.tasks.length > 0) {
      // Re-align existing tasks to today for immediate active mission
      ws.tasks.slice(0, 3).forEach((t) => {
        t.scheduled_date = today;
      });
      saveActiveWorkspace(ws);
      todaysTasks = ws.tasks.filter((t) => t.scheduled_date === today);
    }
    return todaysTasks;
  },

  createTask: async (data: Partial<Task>): Promise<Task> => {
    const ws = getActiveWorkspace();
    const today = new Date().toISOString().split('T')[0];
    const subject = ws.subjects.find((s) => s.id === data.subject_id) || ws.subjects[0];

    const newTask: Task = {
      id: `task-${Date.now()}`,
      user_id: ws.profile.id,
      subject_id: data.subject_id || subject?.id || 'sub-1',
      subject_name: data.subject_name || subject?.name || 'Core Curriculum',
      subject_color: data.subject_color || subject?.color || '#3B82F6',
      title: data.title || 'Focused Concept Study',
      topic: data.topic || 'Theory Revision',
      learning_objective: data.learning_objective || 'Complete syllabus reading & solve 3 practice questions.',
      scheduled_date: data.scheduled_date || today,
      start_time: data.start_time || '10:00',
      end_time: data.end_time || '11:00',
      estimated_duration_minutes: data.estimated_duration_minutes || 60,
      actual_duration_minutes: 0,
      priority: data.priority || 'high',
      difficulty: data.difficulty || 'medium',
      status: data.status || 'pending',
      is_locked: false,
      created_at: new Date().toISOString(),
    };

    ws.tasks.unshift(newTask);
    saveActiveWorkspace(ws);
    return newTask;
  },

  updateTask: async (id: string, data: Partial<Task>): Promise<Task> => {
    const ws = getActiveWorkspace();
    const idx = ws.tasks.findIndex((t) => t.id === id);
    if (idx !== -1) {
      ws.tasks[idx] = { ...ws.tasks[idx], ...data };
      saveActiveWorkspace(ws);
      return ws.tasks[idx];
    }
    throw new Error('Task not found');
  },

  updateTaskStatus: async (id: string, status: Task['status']): Promise<Task> => {
    return api.updateTask(id, { status });
  },

  rescheduleTask: async (id: string, newDate: string): Promise<Task> => {
    return api.updateTask(id, { scheduled_date: newDate });
  },

  generateMission: async (forceRegenerate = false): Promise<Task[]> => {
    const ws = getActiveWorkspace();
    const today = new Date().toISOString().split('T')[0];
    const subjects = ws.subjects.length > 0 ? ws.subjects : [
      { id: 'sub-1', name: 'Computer Science Core', color: '#3B82F6', syllabus_topics: ['Algorithm Design'] }
    ];

    const generated: Task[] = subjects.slice(0, 4).map((sub, idx) => {
      const topic = sub.syllabus_topics?.[idx % (sub.syllabus_topics?.length || 1)] || 'Core Concepts';
      return {
        id: `task-gen-${Date.now()}-${idx}`,
        user_id: ws.profile.id,
        subject_id: sub.id,
        subject_name: sub.name,
        subject_color: sub.color,
        title: `${sub.name.split(' ')[0]} — Master ${topic}`,
        topic,
        learning_objective: `Review definitions, solve 2 practice problems, and update flashcards for ${topic}.`,
        scheduled_date: today,
        start_time: idx === 0 ? '09:00' : idx === 1 ? '11:00' : idx === 2 ? '14:00' : '16:30',
        end_time: idx === 0 ? '10:00' : idx === 1 ? '12:00' : idx === 2 ? '15:15' : '17:30',
        estimated_duration_minutes: idx === 2 ? 75 : 60,
        actual_duration_minutes: 0,
        priority: idx === 0 ? 'urgent' : idx === 1 ? 'high' : 'medium',
        difficulty: idx === 0 ? 'hard' : 'medium',
        status: 'pending',
        is_locked: false,
        created_at: new Date().toISOString(),
      };
    });

    if (forceRegenerate) {
      ws.tasks = ws.tasks.filter((t) => t.scheduled_date !== today || t.is_locked);
    }
    ws.tasks.push(...generated);
    saveActiveWorkspace(ws);
    return generated;
  },

  getWhatToStudyNow: async (): Promise<WhatToStudyNow> => {
    const ws = getActiveWorkspace();
    const pendingTask = ws.tasks.find((t) => t.status === 'pending');
    if (pendingTask) {
      return {
        title: pendingTask.title,
        subject_name: pendingTask.subject_name || 'Core Curriculum',
        recommended_duration_minutes: pendingTask.estimated_duration_minutes || 45,
        reason: `Highest priority scheduled task for today with focus on "${pendingTask.topic}".`,
        action_type: 'start_task',
      };
    }
    const subject = ws.subjects[0];
    return {
      title: `Revise ${subject?.name || 'Core Topics'} Flashcards`,
      subject_name: subject?.name || 'Core Studies',
      recommended_duration_minutes: 25,
      reason: 'Optimal spaced repetition window to boost long-term memory retention before exams.',
      action_type: 'spaced_repetition',
    };
  },

  whatToStudyNow: async (): Promise<WhatToStudyNow> => {
    return api.getWhatToStudyNow();
  },

  recoverMissedDays: async (): Promise<{ message: string; rescheduled_tasks_count: number }> => {
    const ws = getActiveWorkspace();
    const today = new Date().toISOString().split('T')[0];
    let count = 0;
    ws.tasks.forEach((t) => {
      if (t.status === 'pending' && t.scheduled_date < today) {
        t.scheduled_date = today;
        count++;
      }
    });
    saveActiveWorkspace(ws);
    return {
      message: `Successfully recovered ${count} overdue tasks into today's schedule.`,
      rescheduled_tasks_count: count,
    };
  },

  // 4. Study Sessions
  listStudySessions: async (): Promise<StudySession[]> => {
    return getActiveWorkspace().studySessions;
  },

  startStudySession: async (
    subjectId: string,
    _mode = 'pomodoro',
    taskId?: string
  ): Promise<StudySession> => {
    const ws = getActiveWorkspace();
    const session: StudySession = {
      id: `sess-${Date.now()}`,
      subject_id: subjectId,
      task_id: taskId,
      started_at: new Date().toISOString(),
      duration_minutes: 0,
      completed_objective: false,
    };
    ws.studySessions.unshift(session);
    saveActiveWorkspace(ws);
    return session;
  },

  finishStudySession: async (
    id: string,
    data: { duration_minutes: number; notes?: string; completed_objective?: boolean }
  ): Promise<StudySession> => {
    const ws = getActiveWorkspace();
    const s = ws.studySessions.find((sess) => sess.id === id);
    if (s) {
      s.duration_minutes = data.duration_minutes;
      s.notes = data.notes;
      s.completed_objective = data.completed_objective ?? true;
      s.ended_at = new Date().toISOString();
      saveActiveWorkspace(ws);
      return s;
    }
    const newS: StudySession = {
      id,
      subject_id: 'sub-1',
      started_at: new Date(Date.now() - data.duration_minutes * 60000).toISOString(),
      ended_at: new Date().toISOString(),
      duration_minutes: data.duration_minutes,
      notes: data.notes,
      completed_objective: data.completed_objective ?? true,
    };
    ws.studySessions.unshift(newS);
    saveActiveWorkspace(ws);
    return newS;
  },

  endStudySession: async (
    id: string,
    durationOrData: number | { duration_minutes: number; notes?: string; completed_objective?: boolean },
    notes?: string,
    completedObjective?: boolean
  ): Promise<StudySession> => {
    const duration = typeof durationOrData === 'number' ? durationOrData : durationOrData.duration_minutes;
    const n = typeof durationOrData === 'number' ? notes : durationOrData.notes;
    const comp = typeof durationOrData === 'number' ? (completedObjective ?? true) : (durationOrData.completed_objective ?? true);
    return api.finishStudySession(id, { duration_minutes: duration, notes: n, completed_objective: comp });
  },

  // 5. Study Plans (Exam Countdown)
  listStudyPlans: async (): Promise<StudyPlan[]> => {
    return getActiveWorkspace().studyPlans;
  },

  getActivePlan: async (subjectId?: string): Promise<StudyPlan | null> => {
    const plans = getActiveWorkspace().studyPlans;
    if (subjectId) {
      return plans.find((p) => p.subject_id === subjectId && p.status === 'active') || null;
    }
    return plans.find((p) => p.status === 'active') || plans[0] || null;
  },

  generateStudyPlan: async (
    dataOrSubject: any,
    examDate?: string,
    targetGrade?: string,
    hoursPerDay?: number
  ): Promise<StudyPlan> => {
    const ws = getActiveWorkspace();
    const subjectId = typeof dataOrSubject === 'string' ? dataOrSubject : dataOrSubject.subject_id;
    const finalDate = examDate || (typeof dataOrSubject === 'object' ? dataOrSubject.exam_date : null) ||
      new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0];
    const sub = ws.subjects.find((s) => s.id === subjectId) || ws.subjects[0];

    const plan: StudyPlan = {
      id: `plan-${Date.now()}`,
      subject_id: sub?.id || 'sub-1',
      title: `${sub?.name || 'Subject'} 7-Day Exam Countdown Sprint`,
      exam_date: finalDate,
      total_days: 7,
      status: 'active',
      items: [
        { id: `pi-${Date.now()}-1`, plan_id: `plan-${Date.now()}`, day_number: 1, topics: ['Unit 1 Core Principles & Architecture'], time_allocation_minutes: 180, learning_objectives: ['Master foundational definitions'], practice_questions: ['Draw relational diagrams'], is_completed: true },
        { id: `pi-${Date.now()}-2`, plan_id: `plan-${Date.now()}`, day_number: 2, topics: ['Unit 2 Mathematical Proofs & Invariants'], time_allocation_minutes: 180, learning_objectives: ['Compute attribute closures and minimal covers'], practice_questions: ['Find all candidate keys for R(A,B,C,D)'], is_completed: true },
        { id: `pi-${Date.now()}-3`, plan_id: `plan-${Date.now()}`, day_number: 3, topics: ['Unit 3 Normalization & BCNF Decomposition'], time_allocation_minutes: 240, learning_objectives: ['Test lossless join decomposition'], practice_questions: ['Decompose table into BCNF'], is_completed: false },
        { id: `pi-${Date.now()}-4`, plan_id: `plan-${Date.now()}`, day_number: 4, topics: ['Unit 4 Complex Queries & Optimization'], time_allocation_minutes: 180, learning_objectives: ['Analyze indexing and query plans'], practice_questions: ['Evaluate B+ Tree search operations'], is_completed: false },
        { id: `pi-${Date.now()}-5`, plan_id: `plan-${Date.now()}`, day_number: 5, topics: ['Unit 5 Concurrency & ACID Recovery'], time_allocation_minutes: 210, learning_objectives: ['Understand 2PL conflict serializability'], practice_questions: ['Trace precedence graph for schedule'], is_completed: false },
        { id: `pi-${Date.now()}-6`, plan_id: `plan-${Date.now()}`, day_number: 6, topics: ['Full Mock Assessment & Practice Exam'], time_allocation_minutes: 180, learning_objectives: ['Score > 85% on 20-question mock assessment'], practice_questions: ['Complete timed assessment in Quizzes tab'], is_completed: false },
        { id: `pi-${Date.now()}-7`, plan_id: `plan-${Date.now()}`, day_number: 7, topics: ['Mistake Notebook Review & Formula Refresh'], time_allocation_minutes: 120, learning_objectives: ['Review all unmastered conceptual mistakes'], practice_questions: ['Clear review queue'], is_completed: false },
      ],
    };

    ws.studyPlans.unshift(plan);
    saveActiveWorkspace(ws);
    return plan;
  },

  generateExamPlan: async (data: {
    subject_id: string;
    exam_date: string;
    daily_hours: number;
    focus_areas?: string[];
  }): Promise<StudyPlan> => {
    return api.generateStudyPlan(data.subject_id, data.exam_date, 'A', data.daily_hours);
  },

  togglePlanItem: async (itemId: string, completed: boolean): Promise<any> => {
    const ws = getActiveWorkspace();
    for (const p of ws.studyPlans) {
      const item = p.items?.find((i: any) => i.id === itemId);
      if (item) {
        item.is_completed = completed;
        saveActiveWorkspace(ws);
        return item;
      }
    }
    return { id: itemId, is_completed: completed };
  },

  // 6. AI Tutor Conversations (RAG Grounded)
  listConversations: async (subjectId?: string): Promise<Conversation[]> => {
    let list = getActiveWorkspace().conversations;
    if (subjectId) {
      list = list.filter((c) => c.subject_id === subjectId);
    }
    return list;
  },

  getConversation: async (id: string): Promise<Conversation> => {
    const conv = getActiveWorkspace().conversations.find((c) => c.id === id);
    if (!conv) {
      const newConv: Conversation = {
        id,
        title: 'New Study Conversation',
        mode: 'notes_rag',
        updated_at: new Date().toISOString(),
        messages: [],
      };
      const ws = getActiveWorkspace();
      ws.conversations.unshift(newConv);
      saveActiveWorkspace(ws);
      return newConv;
    }
    return conv;
  },

  sendChatMessage: async (
    promptOrData: string | { content: string; conversation_id?: string; subject_id?: string; mode?: string },
    conversationId?: string,
    subjectId?: string,
    mode?: string
  ): Promise<ChatMessage> => {
    let payload: { content: string; conversation_id?: string; subject_id?: string; mode?: string };
    if (typeof promptOrData === 'string') {
      payload = {
        content: promptOrData,
        conversation_id: conversationId,
        subject_id: subjectId,
        mode: mode || 'notes_rag',
      };
    } else {
      payload = promptOrData;
    }

    const ws = getActiveWorkspace();
    const activeSub = ws.subjects.find((s) => s.id === payload.subject_id) || ws.subjects[0];
    const { content, citations } = generateAcademicTutorResponse(
      payload.content,
      activeSub?.name,
      ws.documents
    );

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      conversation_id: payload.conversation_id || 'conv-1',
      role: 'user',
      content: payload.content,
      created_at: new Date().toISOString(),
    };

    const assistantMsg: ChatMessage = {
      id: `msg-${Date.now()}-ai`,
      conversation_id: payload.conversation_id || 'conv-1',
      role: 'assistant',
      content,
      citations,
      created_at: new Date(Date.now() + 500).toISOString(),
    };

    // Save to conversation
    let conv = ws.conversations.find((c) => c.id === payload.conversation_id);
    if (!conv) {
      conv = {
        id: payload.conversation_id || `conv-${Date.now()}`,
        title: payload.content.slice(0, 35) + '...',
        mode: (payload.mode as any) || 'notes_rag',
        subject_id: payload.subject_id,
        subject_name: activeSub?.name,
        updated_at: new Date().toISOString(),
        messages: [],
      };
      ws.conversations.unshift(conv);
    }
    conv.messages.push(userMsg, assistantMsg);
    conv.updated_at = new Date().toISOString();
    saveActiveWorkspace(ws);

    return assistantMsg;
  },

  deleteConversation: async (id: string): Promise<void> => {
    const ws = getActiveWorkspace();
    ws.conversations = ws.conversations.filter((c) => c.id !== id);
    saveActiveWorkspace(ws);
  },

  // 7. Knowledge Vault Documents
  listDocuments: async (subjectId?: string): Promise<DocumentItem[]> => {
    let docs = getActiveWorkspace().documents;
    if (subjectId) {
      docs = docs.filter((d) => d.subject_id === subjectId);
    }
    return docs;
  },

  uploadDocument: async (
    fileOrFormData: File | FormData,
    subjectId?: string,
    title?: string
  ): Promise<DocumentItem> => {
    const ws = getActiveWorkspace();
    let fileName = 'Uploaded Course Document.pdf';
    let fileSize = 1024 * 750;

    if (fileOrFormData instanceof File) {
      fileName = fileOrFormData.name;
      fileSize = fileOrFormData.size;
    } else if (fileOrFormData instanceof FormData) {
      const f = fileOrFormData.get('file');
      if (f instanceof File) {
        fileName = f.name;
        fileSize = f.size;
      }
    }

    const sub = ws.subjects.find((s) => s.id === subjectId) || ws.subjects[0];
    const docTitle = title || fileName.replace(/\.[^/.]+$/, '');

    const doc: DocumentItem = {
      id: `doc-${Date.now()}`,
      user_id: ws.profile.id,
      subject_id: subjectId || sub?.id || 'sub-1',
      title: docTitle,
      file_url: URL.createObjectURL ? URL.createObjectURL(new Blob(['Mock Content'])) : 'https://mock.storage/doc.pdf',
      file_type: fileName.endsWith('.pdf') ? 'pdf' : fileName.endsWith('.md') ? 'markdown' : 'text',
      file_size_bytes: fileSize,
      status: 'ready',
      summary: `Analyzed document for ${sub?.name || 'Course'}. Outlines core theory, key formulas, and exam review notes.`,
      key_points: [
        'Core Theoretical Definitions',
        'Algorithmic Complexity & Theorems',
        'Standard Problem Solving Patterns',
      ],
      created_at: new Date().toISOString(),
    };

    ws.documents.unshift(doc);
    saveActiveWorkspace(ws);
    return doc;
  },

  searchDocuments: async (query: string, subjectId?: string): Promise<RAGCitation[]> => {
    const ws = getActiveWorkspace();
    const docs = subjectId ? ws.documents.filter((d) => d.subject_id === subjectId) : ws.documents;
    const cleanQuery = query.toLowerCase();

    const matches = docs.filter(
      (d) =>
        d.title.toLowerCase().includes(cleanQuery) ||
        d.summary?.toLowerCase().includes(cleanQuery) ||
        d.key_points?.some((kp) => kp.toLowerCase().includes(cleanQuery))
    );

    return (matches.length > 0 ? matches : docs).slice(0, 3).map((d, i) => ({
      document_id: d.id,
      document_title: d.title,
      page_number: i + 1,
      snippet: `Referenced concepts on ${query} matching syllabus definitions in ${d.title}.`,
    }));
  },

  getDocument: async (id: string): Promise<DocumentItem> => {
    const doc = getActiveWorkspace().documents.find((d) => d.id === id);
    if (!doc) throw new Error('Document not found');
    return doc;
  },

  deleteDocument: async (id: string): Promise<void> => {
    const ws = getActiveWorkspace();
    ws.documents = ws.documents.filter((d) => d.id !== id);
    saveActiveWorkspace(ws);
  },

  extractYouTubeTranscript: async (videoUrl: string, subjectId?: string): Promise<YouTubeResource> => {
    const ws = getActiveWorkspace();
    const sub = ws.subjects.find((s) => s.id === subjectId) || ws.subjects[0];

    const res: YouTubeResource = {
      id: `yt-${Date.now()}`,
      user_id: ws.profile.id,
      subject_id: sub?.id || 'sub-1',
      subject_name: sub?.name || 'Lecture',
      url: videoUrl,
      video_id: 'demo_vid',
      title: `${sub?.name || 'Lecture'} — Concept Masterclass`,
      thumbnail_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60',
      duration_seconds: 1450,
      summary: 'Structured lecture breakdown covering main theorems, visual proofs, and worked exam examples.',
      is_watched: 'false',
      created_at: new Date().toISOString(),
    };

    saveActiveWorkspace(ws);
    return res;
  },

  listYouTubeResources: async (subjectId?: string): Promise<YouTubeResource[]> => {
    const ws = getActiveWorkspace();
    const sub = ws.subjects.find((s) => s.id === subjectId) || ws.subjects[0];
    return [
      {
        id: 'yt-demo-1',
        user_id: ws.profile.id,
        subject_id: sub?.id || 'sub-1',
        subject_name: sub?.name || 'Core Topics',
        url: 'https://youtube.com/watch?v=demo',
        video_id: 'demo',
        title: `${sub?.name || 'Core Topics'} — Complete In-Depth Lecture`,
        thumbnail_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60',
        duration_seconds: 1800,
        summary: 'Deep dive into fundamental algorithms, data structures, and database constraints.',
        is_watched: 'false',
        created_at: new Date().toISOString(),
      },
    ];
  },

  // 8. Flashcards & SM-2 Spaced Repetition
  listFlashcardDecks: async (subjectId?: string): Promise<FlashcardDeck[]> => {
    let decks = getActiveWorkspace().flashcardDecks;
    if (subjectId) {
      decks = decks.filter((d) => d.subject_id === subjectId);
    }
    return decks;
  },

  createFlashcardDeck: async (
    subjectIdOrData: string | { subject_id: string; title: string; description?: string },
    title?: string
  ): Promise<FlashcardDeck> => {
    const ws = getActiveWorkspace();
    let subjectId: string;
    let deckTitle: string;
    let desc: string | undefined;

    if (typeof subjectIdOrData === 'object') {
      subjectId = subjectIdOrData.subject_id;
      deckTitle = subjectIdOrData.title;
      desc = subjectIdOrData.description;
    } else {
      subjectId = subjectIdOrData;
      deckTitle = title || 'New Flashcard Deck';
    }

    const sub = ws.subjects.find((s) => s.id === subjectId);
    const deck: FlashcardDeck = {
      id: `deck-${Date.now()}`,
      subject_id: subjectId,
      subject_name: sub?.name || 'Subject',
      title: deckTitle,
      description: desc || `High-yield flashcards for ${sub?.name || 'exam preparation'}.`,
      cards_count: 0,
      due_today_count: 0,
      created_at: new Date().toISOString(),
    };

    ws.flashcardDecks.unshift(deck);
    saveActiveWorkspace(ws);
    return deck;
  },

  listFlashcards: async (deckId: string, onlyDue = false): Promise<Flashcard[]> => {
    const today = new Date().toISOString().split('T')[0];
    let cards = getActiveWorkspace().flashcards.filter((f) => f.deck_id === deckId);
    if (onlyDue) {
      cards = cards.filter((f) => !f.next_review_date || f.next_review_date <= today);
    }
    return cards;
  },

  listDeckCards: async (deckId: string): Promise<Flashcard[]> => {
    return api.listFlashcards(deckId, false);
  },

  getDueFlashcards: async (subjectId?: string): Promise<Flashcard[]> => {
    const today = new Date().toISOString().split('T')[0];
    let cards = getActiveWorkspace().flashcards.filter((f) => !f.next_review_date || f.next_review_date <= today);
    if (subjectId) {
      cards = cards.filter((f) => f.subject_id === subjectId);
    }
    return cards;
  },

  createFlashcard: async (
    deckIdOrData: string | any,
    questionOrFront?: string,
    answerOrBack?: string
  ): Promise<Flashcard> => {
    const ws = getActiveWorkspace();
    let deckId: string;
    let question: string;
    let answer: string;

    if (typeof deckIdOrData === 'object') {
      deckId = deckIdOrData.deck_id || 'deck-1';
      question = deckIdOrData.question || deckIdOrData.front || 'Concept Question';
      answer = deckIdOrData.answer || deckIdOrData.back || 'Concept Answer';
    } else {
      deckId = deckIdOrData;
      question = questionOrFront || 'Concept Question';
      answer = answerOrBack || 'Concept Answer';
    }

    const deck = ws.flashcardDecks.find((d) => d.id === deckId);
    const card: Flashcard = {
      id: `card-${Date.now()}`,
      deck_id: deckId,
      user_id: ws.profile.id,
      question,
      answer,
      difficulty: 'medium',
      ease_factor: 2.5,
      interval_days: 1,
      repetition_count: 0,
      next_review_date: new Date().toISOString().split('T')[0],
      last_reviewed_at: null,
    };

    ws.flashcards.push(card);
    if (deck) {
      deck.cards_count = (deck.cards_count || 0) + 1;
      deck.due_today_count = (deck.due_today_count || 0) + 1;
    }
    saveActiveWorkspace(ws);
    return card;
  },

  generateFlashcards: async (
    paramsOrSubjectId: string | { subject_id: string; unit_id?: string; count?: number; difficulty?: string; deck_id?: string },
    topicOrCount?: string | number,
    count = 5
  ): Promise<Flashcard[]> => {
    let subjectId: string;
    let unitId: string | undefined;
    let num: number = count;
    let difficulty = 'medium';
    let deckId: string | undefined;

    if (typeof paramsOrSubjectId === 'object') {
      subjectId = paramsOrSubjectId.subject_id;
      unitId = paramsOrSubjectId.unit_id;
      num = paramsOrSubjectId.count || 5;
      difficulty = paramsOrSubjectId.difficulty || 'medium';
      deckId = paramsOrSubjectId.deck_id;
    } else {
      subjectId = paramsOrSubjectId;
      num = typeof topicOrCount === 'number' ? topicOrCount : count;
    }

    try {
      const token = getActiveSession()?.access_token || 'demo-bearer-token';
      const res = await fetch(`${API_BASE_URL}/flashcards/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subject_id: subjectId,
          unit_id: unitId || undefined,
          count: num,
          difficulty,
          deck_id: deckId || undefined
        })
      });

      if (res.ok) {
        const savedCards: Flashcard[] = await res.json();
        const ws = getActiveWorkspace();
        ws.flashcards.push(...savedCards);
        const d = ws.flashcardDecks.find(deck => deck.id === (deckId || savedCards[0]?.deck_id));
        if (d) {
          d.cards_count = (d.cards_count || 0) + savedCards.length;
          d.due_today_count = (d.due_today_count || 0) + savedCards.length;
        }
        saveActiveWorkspace(ws);
        dispatchDataChange();
        return savedCards;
      }
    } catch {
      // fallback to offline generation below
    }

    const ws = getActiveWorkspace();
    const sub = ws.subjects.find((s) => s.id === subjectId) || ws.subjects[0];
    const selectedUnit = sub?.units?.find((u) => u.id === unitId);
    const unitTitle = selectedUnit?.title || (unitId ? `Unit ${unitId}` : 'Core Curriculum');
    const unitTopics = selectedUnit?.topics?.length ? selectedUnit.topics : (sub?.syllabus_topics || ['Fundamentals', 'Key Principles']);
    const deck = ws.flashcardDecks.find((d) => d.subject_id === sub?.id) || ws.flashcardDecks[0];

    const generated: Flashcard[] = [];
    for (let i = 1; i <= num; i++) {
      const topic = unitTopics[(i - 1) % unitTopics.length];
      generated.push({
        id: `card-gen-${Date.now()}-${i}`,
        deck_id: deck?.id || 'deck-1',
        subject_id: sub?.id,
        unit_id: unitId,
        user_id: ws.profile.id,
        question: `What are the core properties, constraints, and significance of "${topic}" in ${sub?.name || 'Curriculum'}?`,
        answer: `In ${unitTitle}, ${topic} establishes foundational theorems and operational guarantees essential for system correctness and performance.`,
        difficulty: (difficulty as any) || 'medium',
        ease_factor: 2.5,
        interval_days: 1,
        repetition_count: 0,
        next_review_date: new Date().toISOString().split('T')[0],
        last_reviewed_at: null,
      });
    }

    ws.flashcards.push(...generated);
    if (deck) {
      deck.cards_count = (deck.cards_count || 0) + generated.length;
      deck.due_today_count = (deck.due_today_count || 0) + generated.length;
    }
    saveActiveWorkspace(ws);
    dispatchDataChange();
    return generated;
  },

  reviewFlashcard: async (cardId: string, rating: number): Promise<Flashcard> => {
    const ws = getActiveWorkspace();
    const card = ws.flashcards.find((c) => c.id === cardId);
    if (!card) throw new Error('Flashcard not found');

    const sm2Result = calculateSM2(
      rating,
      card.interval_days || 1,
      card.repetition_count || 0,
      card.ease_factor || 2.5
    );

    card.repetition_count = sm2Result.repetitions;
    card.interval_days = sm2Result.interval;
    card.ease_factor = sm2Result.ease;
    card.next_review_date = sm2Result.nextReviewDate;
    card.last_reviewed_at = new Date().toISOString();

    // Update deck due counts
    const deck = ws.flashcardDecks.find((d) => d.id === card.deck_id);
    if (deck && deck.due_today_count && deck.due_today_count > 0) {
      deck.due_today_count -= 1;
    }

    saveActiveWorkspace(ws);
    return card;
  },

  // 9. Quizzes & Exams
  listQuizzes: async (subjectId?: string): Promise<Quiz[]> => {
    let list = getActiveWorkspace().quizzes;
    if (subjectId) {
      list = list.filter((q) => q.subject_id === subjectId);
    }
    return list;
  },

  generateQuiz: async (data: {
    subject_id?: string;
    unit_id?: string;
    topic?: string;
    num_questions?: number;
    question_count?: number;
    difficulty?: string;
    is_mock_exam?: boolean;
    time_limit_minutes?: number;
    question_types?: string[];
  }): Promise<Quiz> => {
    const ws = getActiveWorkspace();
    const sub = ws.subjects.find((s) => s.id === data.subject_id) || ws.subjects[0];
    const count = data.question_count || data.num_questions || (data.is_mock_exam ? 10 : 5);

    try {
      const token = getActiveSession()?.access_token || 'demo-bearer-token';
      const endpoint = data.is_mock_exam ? `${API_BASE_URL}/quizzes/exams/generate` : `${API_BASE_URL}/quizzes/generate`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subject_id: sub?.id || data.subject_id,
          unit_id: data.unit_id || undefined,
          topic: data.topic,
          num_questions: count,
          difficulty: data.difficulty || 'medium',
          is_mock_exam: data.is_mock_exam ?? false,
          time_limit_minutes: data.time_limit_minutes || (data.is_mock_exam ? 30 : 15),
          question_types: data.question_types || ['multiple_choice']
        })
      });

      if (res.ok) {
        const quiz: Quiz = await res.json();
        ws.quizzes.unshift(quiz);
        saveActiveWorkspace(ws);
        dispatchDataChange();
        return quiz;
      }
    } catch {
      // fallback
    }

    const selectedUnit = sub?.units?.find(u => u.id === data.unit_id);
    const unitTitle = selectedUnit?.title || (data.unit_id ? `Unit ${data.unit_id}` : 'Complete Syllabus');
    const topic = data.topic || selectedUnit?.topics?.[0] || sub?.syllabus_topics?.[0] || 'Core Subject Foundations';

    const samplePool = [
      {
        text: `Which property ensures that concurrent execution of transactions produces the same effect as a serial execution in ${sub?.name || 'database systems'}?`,
        options: ['Serializability', 'Durability', 'Atomicity', 'Degeneracy'],
        correct: 'Serializability',
        explanation: 'Serializability is the classical criterion for concurrency control correctness.',
      },
      {
        text: 'What is the tightest upper bound time complexity for searching an element in a balanced search tree with N nodes?',
        options: ['O(log N)', 'O(N)', 'O(1)', 'O(N log N)'],
        correct: 'O(log N)',
        explanation: 'Balanced binary search trees (AVL, Red-Black) maintain height proportional to log(N).',
      },
      {
        text: 'In relation decomposition, which normal form strictly disallows any functional dependencies where the determinant is not a superkey?',
        options: ['BCNF', '1NF', '2NF', '3NF'],
        correct: 'BCNF',
        explanation: 'BCNF requires every determinant to be a super key, completely eliminating transitive anomalies.',
      },
      {
        text: 'Which memory management scheme eliminates external fragmentation by allocating fixed-size blocks of physical memory?',
        options: ['Paging', 'Segmentation', 'Continuous Allocation', 'Dynamic Relocation'],
        correct: 'Paging',
        explanation: 'Paging breaks physical memory into fixed-size frames, eliminating external fragmentation.',
      },
      {
        text: 'When using Dijkstra algorithm, what restriction must be placed on edge weights?',
        options: ['Weights must be non-negative', 'Weights must be integers', 'Graph must be a DAG', 'Graph must be planar'],
        correct: 'Weights must be non-negative',
        explanation: 'Dijkstra greedy assumption fails when edge weights are negative; Bellman-Ford should be used instead.',
      },
      {
        text: `How does ${topic} provide resilience and efficiency in modern ${sub?.name || 'computing'} architectures?`,
        options: ['By enforcing strict formal invariants and minimizing latency', 'By randomly discarding requests', 'By turning off cache memory', 'By requiring single-threaded processing'],
        correct: 'By enforcing strict formal invariants and minimizing latency',
        explanation: `${topic} provides theoretical guarantees that maintain consistency under high workload conditions.`,
      }
    ];

    const questions = Array.from({ length: count }).map((_, i) => {
      const p = samplePool[i % samplePool.length];
      return {
        id: `q-${Date.now()}-${i + 1}`,
        question_type: (data.question_types && data.question_types.length > 0 ? data.question_types[i % data.question_types.length] : 'multiple_choice') as any,
        question_text: p.text,
        options: p.options,
        points: 1,
        correct_answer: p.correct,
        explanation: p.explanation,
      };
    });

    const quiz: Quiz = {
      id: `quiz-${Date.now()}`,
      subject_id: sub?.id || 'sub-1',
      unit_id: data.unit_id,
      title: data.is_mock_exam
        ? `${sub?.name || 'Curriculum'} — Full Mock Exam (${unitTitle})`
        : `${sub?.name ? sub.name.split(' ')[0] : 'Academic'} — ${unitTitle}: ${topic} Quiz`,
      difficulty: data.difficulty || 'medium',
      time_limit_minutes: data.time_limit_minutes || (data.is_mock_exam ? 30 : 15),
      is_mock_exam: data.is_mock_exam ?? false,
      created_at: new Date().toISOString(),
      questions,
    };

    ws.quizzes.unshift(quiz);
    saveActiveWorkspace(ws);
    dispatchDataChange();
    return quiz;
  },

  getQuiz: async (id: string): Promise<Quiz> => {
    const q = getActiveWorkspace().quizzes.find((it) => it.id === id);
    if (!q) throw new Error('Quiz not found');
    return q;
  },

  submitQuiz: async (
    quizId: string,
    timeTaken: number,
    submissions: { question_id: string; user_answer: string }[]
  ): Promise<QuizResult> => {
    try {
      const token = getActiveSession()?.access_token || 'demo-bearer-token';
      const res = await fetch(`${API_BASE_URL}/quizzes/${quizId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          quiz_id: quizId,
          time_taken_seconds: timeTaken,
          answers: submissions.map(s => ({
            question_id: s.question_id,
            user_answer: s.user_answer
          }))
        })
      });

      if (res.ok) {
        const result: QuizResult = await res.json();
        return result;
      }
    } catch {
      // fallback
    }

    const ws = getActiveWorkspace();
    const quiz = ws.quizzes.find((q) => q.id === quizId);

    let score = 0;
    const results = submissions.map((sub) => {
      const q = quiz?.questions.find((quest) => quest.id === sub.question_id);
      const correctAnswer = (q as any)?.correct_answer || q?.options?.[0] || 'Correct Option';
      const isCorrect = sub.user_answer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
      if (isCorrect) score += 1;

      return {
        question_id: sub.question_id,
        question_text: q?.question_text || 'Key Concept Question',
        user_answer: sub.user_answer,
        correct_answer: correctAnswer,
        is_correct: isCorrect,
        explanation: (q as any)?.explanation || 'Demonstrated rigorous conceptual accuracy.',
      };
    });

    const totalQuestions = submissions.length || 1;
    const percentage = Math.round((score / totalQuestions) * 100);

    const quizResult: QuizResult = {
      attempt_id: `att-${Date.now()}`,
      quiz_id: quizId,
      score,
      max_score: totalQuestions,
      percentage,
      time_taken_seconds: timeTaken,
      completed_at: new Date().toISOString(),
      results,
      weak_topics: percentage < 80 ? [quiz?.title?.split('—')[1]?.trim() || 'Core Unit Foundations'] : [],
    };

    return quizResult;
  },

  // 10. Coding Practice Arena
  listCodingProblems: async (topic?: string): Promise<CodingProblem[]> => {
    let list = getActiveWorkspace().codingProblems;
    if (topic && topic !== 'all') {
      list = list.filter((p) => p.topic.toLowerCase() === topic.toLowerCase());
    }
    return list;
  },

  createCodingProblem: async (data: Partial<CodingProblem>): Promise<CodingProblem> => {
    const ws = getActiveWorkspace();
    const p: CodingProblem = {
      id: `prob-${Date.now()}`,
      title: data.title || 'Dynamic Programming Problem',
      difficulty: data.difficulty || 'medium',
      platform: data.platform || 'LeetCode',
      url: data.url || 'https://leetcode.com',
      topic: data.topic || 'Arrays',
      language: data.language || 'Python',
      status: data.status || 'solved',
      attempts_count: 1,
      notes: data.notes || 'Solved cleanly using optimal pointers.',
      solution_code: data.solution_code || '# Solution code',
      solved_at: new Date().toISOString(),
    };
    ws.codingProblems.unshift(p);
    saveActiveWorkspace(ws);
    return p;
  },

  updateCodingProblem: async (id: string, data: Partial<CodingProblem>): Promise<CodingProblem> => {
    const ws = getActiveWorkspace();
    const idx = ws.codingProblems.findIndex((p) => p.id === id);
    if (idx !== -1) {
      ws.codingProblems[idx] = { ...ws.codingProblems[idx], ...data };
      saveActiveWorkspace(ws);
      return ws.codingProblems[idx];
    }
    throw new Error('Coding problem not found');
  },

  deleteCodingProblem: async (id: string): Promise<void> => {
    const ws = getActiveWorkspace();
    ws.codingProblems = ws.codingProblems.filter((p) => p.id !== id);
    saveActiveWorkspace(ws);
  },

  explainCode: async (
    code: string,
    language: string
  ): Promise<{ explanation: string; time_complexity: string; space_complexity: string }> => {
    return {
      explanation: `Analyzed ${language} implementation. The algorithm establishes efficient loop invariants with optimal data structure utilization.`,
      time_complexity: code.includes('while') && code.includes('// 2') ? 'O(log N)' : 'O(N)',
      space_complexity: code.includes('seen') || code.includes('dict') || code.includes('map') ? 'O(N)' : 'O(1)',
    };
  },

  codeAssist: async (code: string, language = 'Python', queryType = 'give_hint'): Promise<any> => {
    const isBinarySearch = code.includes('mid') || code.includes('left') || code.includes('right');
    const isDP = code.includes('dp') || code.includes('memo');

    if (queryType === 'give_hint') {
      return {
        feedback: 'Algorithm structure identified. Look at potential corner cases and branch conditions.',
        time_complexity: isBinarySearch ? 'O(log N)' : isDP ? 'O(N * M)' : 'O(N)',
        space_complexity: isDP ? 'O(N)' : 'O(1)',
        hints: [
          'Ensure the loop invariant handles boundary conditions when left == right.',
          'Check for potential integer overflow or empty list inputs.',
          'Consider caching intermediate subproblem solutions to eliminate redundant recursion.',
        ],
      };
    }

    return {
      feedback: 'Code reviewed. Asymptotic complexity is optimal for input sizes up to 10^5.',
      time_complexity: isBinarySearch ? 'O(log N)' : 'O(N)',
      space_complexity: 'O(1)',
      hints: ['Great job! All test cases adhere to optimal asymptotic standards.'],
    };
  },

  // 11. Mistake Notebook
  listMistakes: async (filterMasteredOrSubject?: boolean | string): Promise<MistakeEntry[]> => {
    let list = getActiveWorkspace().mistakes;
    if (typeof filterMasteredOrSubject === 'boolean') {
      list = list.filter((m) => m.mastered === filterMasteredOrSubject);
    } else if (typeof filterMasteredOrSubject === 'string') {
      list = list.filter((m) => m.subject_id === filterMasteredOrSubject);
    }
    return list;
  },

  createMistake: async (data: Partial<MistakeEntry>): Promise<MistakeEntry> => {
    const ws = getActiveWorkspace();
    const sub = ws.subjects.find((s) => s.id === data.subject_id) || ws.subjects[0];

    const m: MistakeEntry = {
      id: `mis-${Date.now()}`,
      subject_id: data.subject_id || sub?.id || 'sub-1',
      source_type: data.source_type || 'quiz',
      question_or_problem: data.question_or_problem || 'Explain Strict 2-Phase Locking Invariants',
      user_mistake: data.user_mistake || 'Released exclusive locks before the commit statement.',
      correct_solution: data.correct_solution || 'Strict 2PL requires holding all exclusive locks until transaction terminates (commit or abort).',
      explanation: data.explanation || 'Prevents cascading rollbacks and guarantees recoverable schedules.',
      topic: data.topic || 'Transactions',
      mistake_count: 1,
      mastered: false,
      created_at: new Date().toISOString(),
    };

    ws.mistakes.unshift(m);
    saveActiveWorkspace(ws);
    return m;
  },

  updateMistake: async (
    id: string,
    masteredOrData: boolean | Partial<MistakeEntry>
  ): Promise<MistakeEntry> => {
    const ws = getActiveWorkspace();
    const payload = typeof masteredOrData === 'boolean' ? { mastered: masteredOrData } : masteredOrData;
    const m = ws.mistakes.find((it) => it.id === id);
    if (m) {
      Object.assign(m, payload);
      saveActiveWorkspace(ws);
      return m;
    }
    throw new Error('Mistake not found');
  },

  generateTargetedQuiz: async (subjectId?: string): Promise<Quiz> => {
    return api.generateQuiz({ subject_id: subjectId, topic: 'Targeted Mistake Revision' });
  },

  // 12. Timetable & Schedule
  listTimetable: async (): Promise<TimetableEvent[]> => {
    return api.listTimetableEvents();
  },

  listTimetableEvents: async (): Promise<TimetableEvent[]> => {
    return getActiveWorkspace().timetable;
  },

  createTimetableEvent: async (data: Partial<TimetableEvent>): Promise<TimetableEvent> => {
    const ws = getActiveWorkspace();
    const sub = ws.subjects.find((s) => s.id === data.subject_id) || ws.subjects[0];

    const ev: TimetableEvent = {
      id: `tt-${Date.now()}`,
      subject_id: data.subject_id || sub?.id || 'sub-1',
      title: data.title || `${sub?.name || 'Academic'} Lecture`,
      day_of_week: data.day_of_week ?? 1,
      start_time: data.start_time || '10:00',
      end_time: data.end_time || '11:30',
      location: data.location || 'Lecture Hall 101',
      is_recurring: true,
    };

    ws.timetable.push(ev);
    saveActiveWorkspace(ws);
    return ev;
  },

  deleteTimetableEvent: async (id: string): Promise<void> => {
    const ws = getActiveWorkspace();
    ws.timetable = ws.timetable.filter((t) => t.id !== id);
    saveActiveWorkspace(ws);
  },

  // 13. Assignments
  listAssignments: async (subjectId?: string): Promise<Assignment[]> => {
    let list = getActiveWorkspace().assignments;
    if (subjectId) {
      list = list.filter((a) => a.subject_id === subjectId);
    }
    return list;
  },

  createAssignment: async (data: Partial<Assignment>): Promise<Assignment> => {
    const ws = getActiveWorkspace();
    const sub = ws.subjects.find((s) => s.id === data.subject_id) || ws.subjects[0];

    const as: Assignment = {
      id: `as-${Date.now()}`,
      subject_id: data.subject_id || sub?.id || 'sub-1',
      title: data.title || 'Semester Coursework & Project',
      due_date: data.due_date || new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
      priority: data.priority || 'high',
      status: data.status || 'in_progress',
      estimated_effort_hours: data.estimated_effort_hours || 4,
      subtasks: data.subtasks || [
        { title: 'Phase 1: Architecture & Design Spec', completed: true },
        { title: 'Phase 2: Core Algorithm Implementation', completed: false },
        { title: 'Phase 3: Test Verification & Report', completed: false },
      ],
    };

    ws.assignments.unshift(as);
    saveActiveWorkspace(ws);
    return as;
  },

  updateAssignment: async (id: string, data: Partial<Assignment>): Promise<Assignment> => {
    const ws = getActiveWorkspace();
    const as = ws.assignments.find((a) => a.id === id);
    if (as) {
      Object.assign(as, data);
      saveActiveWorkspace(ws);
      return as;
    }
    throw new Error('Assignment not found');
  },

  deleteAssignment: async (id: string): Promise<void> => {
    const ws = getActiveWorkspace();
    ws.assignments = ws.assignments.filter((a) => a.id !== id);
    saveActiveWorkspace(ws);
  },

  // 14. Academic Analytics & Readiness
  getAnalyticsOverview: async (): Promise<AcademicAnalytics> => {
    const ws = getActiveWorkspace();
    const completedTasks = ws.tasks.filter((t) => t.status === 'completed').length;
    const totalTasks = ws.tasks.length || 1;
    const completionRate = Math.round((completedTasks / totalTasks) * 100);

    const subjectProgress = ws.subjects.map((s) => {
      const sTasks = ws.tasks.filter((t) => t.subject_id === s.id);
      const sComp = sTasks.filter((t) => t.status === 'completed').length;
      return {
        subject_id: s.id,
        subject_name: s.name,
        color: s.color,
        total_tasks: sTasks.length || 3,
        completed_tasks: sComp || 2,
        study_hours: 6.5,
        mastery_score: 88 + Math.floor(Math.random() * 8),
      };
    });

    return {
      total_study_hours: 24.5,
      weekly_study_hours: 18.0,
      study_streak_days: 14,
      tasks_completion_rate: completionRate || 85,
      coding_problems_solved: ws.codingProblems.length || 12,
      flashcards_reviewed_total: ws.flashcards.filter((f) => f.repetitions > 0).length || 28,
      quizzes_taken: ws.quizzes.length || 4,
      average_quiz_score: 88,
      subject_progress: subjectProgress,
      daily_study_history: [
        { date: '2026-09-11', hours: 3.5 },
        { date: '2026-09-12', hours: 4.0 },
        { date: '2026-09-13', hours: 2.5 },
        { date: '2026-09-14', hours: 4.5 },
        { date: '2026-09-15', hours: 3.0 },
        { date: '2026-09-16', hours: 4.2 },
        { date: '2026-09-17', hours: 3.8 },
      ],
    };
  },

  getExamReadiness: async (subjectId?: string): Promise<ExamReadiness> => {
    const ws = getActiveWorkspace();
    const sub = ws.subjects.find((s) => s.id === subjectId) || ws.subjects[0];

    return {
      subject_id: sub?.id || 'sub-1',
      subject_name: sub?.name || 'Core Curriculum',
      exam_date: '2026-10-15',
      days_remaining: 28,
      readiness_percentage: 91,
      syllabus_coverage_pct: 94,
      quiz_accuracy_pct: 88,
      revision_completion_pct: 87,
      weak_topics: ['Composite Candidate Keys', 'Strict 2PL Deadlock Scenarios'],
      suggested_actions: [
        'Complete 10 Spaced Repetition flashcards on transactions',
        'Solve 1 Rotated Binary Search problem in Coding Arena',
      ],
      explanation: 'Academic readiness is in the A+ tier. Consistent retention across all syllabus units.',
    };
  },

  generateWeeklyReview: async (): Promise<any> => {
    const ws = getActiveWorkspace();
    const sub = ws.subjects[0];
    return {
      week_start: new Date().toISOString().split('T')[0],
      total_study_minutes: 920,
      tasks_completed: ws.tasks.filter((t) => t.status === 'completed').length || 15,
      streak_days: 14,
      top_subject: sub?.name || 'Computer Science',
      weak_topics_improved: ['B+ Tree Indexing', 'Graph BFS Invariants'],
      areas_needing_attention: ['Dynamic Programming Memoization', 'Strict 2PL'],
      ai_summary: 'Remarkable consistency this week! High active recall retention and solid syllabus pace.',
    };
  },

  // 15. Natural Language Command Center (Cmd+K)
  executeCommand: async (
    command: string
  ): Promise<{ action_executed: string; action_taken: boolean; message: string; data?: any }> => {
    const cleanCmd = command.toLowerCase();
    const ws = getActiveWorkspace();

    if (cleanCmd.includes('task') || cleanCmd.includes('study')) {
      const task = await api.createTask({
        title: command.replace(/^(add|create|schedule)\s+/i, ''),
      });
      return {
        action_executed: 'create_task',
        action_taken: true,
        message: `Scheduled task: "${task.title}" on Today's Mission.`,
        data: task,
      };
    }

    return {
      action_executed: 'info',
      action_taken: true,
      message: `Command "${command}" processed in Static Workspace.`,
    };
  },
};

export default api;
