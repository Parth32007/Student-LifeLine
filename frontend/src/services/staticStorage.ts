import { StaticDataStore, initialStaticData } from './staticData';

export interface RegisteredUser {
  id: string;
  email: string;
  password?: string;
  full_name: string;
  university?: string;
  course?: string;
  semester?: number;
  education_level?: string;
  daily_hours?: number;
  goals?: string;
  created_at: string;
}

export interface UserSession {
  user: {
    id: string;
    email: string;
    full_name?: string;
    university?: string;
    course?: string;
    semester?: number;
  };
  access_token: string;
}

const REGISTRY_KEY = 'lifeos_users_registry_v1';
const ACTIVE_SESSION_KEY = 'lifeos_local_user_session';
const LOGOUT_FLAG_KEY = 'lifeos_explicit_logout';
const WORKSPACE_PREFIX = 'lifeos_workspace_';

// Seed demo student Alex Rivera
export const DEMO_USER: RegisteredUser = {
  id: '00000000-0000-0000-0000-000000000001',
  email: 'alex.rivera@lifeos.academic',
  password: 'password123',
  full_name: 'Alex Rivera',
  university: 'Stanford University / State Tech',
  course: 'B.Tech Computer Science',
  semester: 4,
  education_level: 'Undergraduate',
  daily_hours: 4.5,
  goals: 'Master Tree & Graph Algorithms, Maintain 3.88 GPA',
  created_at: '2026-01-01T00:00:00.000Z',
};

/**
 * Get all registered accounts from localStorage
 */
export function getRegisteredUsers(): RegisteredUser[] {
  try {
    const raw = localStorage.getItem(REGISTRY_KEY);
    if (!raw) {
      const initial = [DEMO_USER];
      localStorage.setItem(REGISTRY_KEY, JSON.stringify(initial));
      return initial;
    }
    const list: RegisteredUser[] = JSON.parse(raw);
    if (!list.some((u) => u.email.toLowerCase() === DEMO_USER.email.toLowerCase())) {
      list.unshift(DEMO_USER);
      localStorage.setItem(REGISTRY_KEY, JSON.stringify(list));
    }
    return list;
  } catch {
    return [DEMO_USER];
  }
}

/**
 * Save the users registry
 */
function saveRegisteredUsers(users: RegisteredUser[]): void {
  try {
    localStorage.setItem(REGISTRY_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Failed to save users registry:', e);
  }
}

/**
 * Derive a friendly student name from email (e.g. john123@gmail.com -> "John")
 */
export function deriveNameFromEmail(email: string): string {
  const namePart = email.split('@')[0] || 'Student';
  const clean = namePart.replace(/[._\d]+/g, ' ').trim();
  if (!clean) return 'Student';
  return clean
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Get current active session
 */
export function getActiveSession(): UserSession | null {
  if (localStorage.getItem(LOGOUT_FLAG_KEY)) {
    return null;
  }
  try {
    const raw = localStorage.getItem(ACTIVE_SESSION_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return null;
}

/**
 * Set active session and notify subscribers
 */
export function setActiveSession(session: UserSession | null): void {
  if (session) {
    localStorage.removeItem(LOGOUT_FLAG_KEY);
    localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(ACTIVE_SESSION_KEY);
    localStorage.setItem(LOGOUT_FLAG_KEY, 'true');
  }
  dispatchAuthChange();
}

/**
 * Dispatches global auth change event
 */
export function dispatchAuthChange(): void {
  window.dispatchEvent(new CustomEvent('lifeos:auth-change'));
  window.dispatchEvent(new Event('storage'));
}

/**
 * Dispatches global data change event
 */
export function dispatchDataChange(): void {
  window.dispatchEvent(new CustomEvent('lifeos:data-change'));
  window.dispatchEvent(new Event('storage'));
}

/**
 * Create a personalized workspace for a new student
 */
function createNewUserWorkspace(user: RegisteredUser, customSubjects?: Array<{ name: string; code?: string; color?: string; target_grade?: string }>): StaticDataStore {
  const userId = user.id;
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Colors palette for subjects
  const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#06B6D4', '#6366F1'];

  // Subjects setup (Four default subjects)
  let subjectList: any[] = [];
  if (customSubjects && customSubjects.length > 0) {
    subjectList = customSubjects.map((s, idx) => ({
      id: `sub-${userId}-${idx + 1}`,
      user_id: userId,
      name: s.name,
      color: s.color || colors[idx % colors.length],
      target_grade: s.target_grade || 'A',
      credits: 4,
      syllabus_topics: [
        `Unit 1: Fundamentals of ${s.name}`,
        `Unit 2: Architecture & Core Invariants in ${s.name}`,
        `Unit 3: Applied Systems & Problem Solving in ${s.name}`,
        `Unit 4: Advanced Optimizations in ${s.name}`,
        `Unit 5: Real-World Case Studies in ${s.name}`,
      ],
      created_at: now.toISOString(),
    }));
  } else {
    subjectList = [
      {
        id: `sub-${userId}-1`,
        user_id: userId,
        name: 'DBMS',
        color: '#3B82F6',
        target_grade: 'A+',
        credits: 4,
        syllabus_topics: [
          'Unit 1: Introduction to DBMS & Relational Model',
          'Unit 2: SQL & Advanced Query Processing',
          'Unit 3: Normalization & Schema Refinement',
          'Unit 4: Transactions & Concurrency Control',
          'Unit 5: Storage Structures, Indexing & Recovery',
        ],
        created_at: now.toISOString(),
      },
      {
        id: `sub-${userId}-2`,
        user_id: userId,
        name: 'Data Structures and Algorithms (DSA)',
        color: '#10B981',
        target_grade: 'A+',
        credits: 4,
        syllabus_topics: [
          'Unit 1: Arrays, Strings & Two Pointers',
          'Unit 2: Linked Lists, Stacks & Queues',
          'Unit 3: Trees, Binary Search Trees & Heaps',
          'Unit 4: Graph Algorithms & Traversals',
          'Unit 5: Dynamic Programming & Greedy Approaches',
        ],
        created_at: now.toISOString(),
      },
      {
        id: `sub-${userId}-3`,
        user_id: userId,
        name: 'Artificial Intelligence (AI)',
        color: '#8B5CF6',
        target_grade: 'A',
        credits: 4,
        syllabus_topics: [
          'Unit 1: Foundations of AI & Problem Solving',
          'Unit 2: Informed Search & Adversarial Games',
          'Unit 3: Knowledge Representation & Reasoning',
          'Unit 4: Machine Learning Fundamentals & Neural Networks',
          'Unit 5: NLP & Modern Generative AI',
        ],
        created_at: now.toISOString(),
      },
      {
        id: `sub-${userId}-4`,
        user_id: userId,
        name: 'Cloud Computing',
        color: '#06B6D4',
        target_grade: 'A',
        credits: 3,
        syllabus_topics: [
          'Unit 1: Cloud Architecture & Service Models',
          'Unit 2: Virtualization & Containerization',
          'Unit 3: Cloud Storage & Distributed Databases',
          'Unit 4: Serverless Computing & Microservices',
          'Unit 5: Cloud Security, Reliability & DevOps',
        ],
        created_at: now.toISOString(),
      },
    ];
  }

  // Initial tasks for Today's Mission tailored to this user's subjects
  const tasks = subjectList.slice(0, 3).map((sub, idx) => ({
    id: `task-${userId}-${idx + 1}`,
    user_id: userId,
    subject_id: sub.id,
    subject_name: sub.name,
    subject_color: sub.color,
    title: `${sub.name.split(' ')[0]} — Study ${sub.syllabus_topics[0] || 'Unit 1 Fundamentals'}`,
    topic: sub.syllabus_topics[0] || 'Core Theory',
    learning_objective: `Master fundamental concepts and key exam principles of ${sub.name}.`,
    scheduled_date: todayStr,
    start_time: idx === 0 ? '09:00' : idx === 1 ? '11:00' : '14:30',
    end_time: idx === 0 ? '10:00' : idx === 1 ? '12:00' : '15:30',
    estimated_duration_minutes: 60,
    actual_duration_minutes: idx === 0 ? 60 : 0,
    priority: idx === 0 ? 'urgent' : idx === 1 ? 'high' : 'medium',
    difficulty: idx === 0 ? 'hard' : 'medium',
    status: idx === 0 ? 'completed' : 'pending',
    is_locked: idx === 0,
    created_at: now.toISOString(),
  }));

  // Initial Timetable events for the weekly schedule
  const timetable = subjectList.map((sub, idx) => ({
    id: `tt-${userId}-${idx + 1}`,
    subject_id: sub.id,
    title: `${sub.name} Lecture`,
    day_of_week: (idx % 5) + 1, // Mon-Fri
    start_time: '10:00',
    end_time: '11:30',
    location: `Academic Hall ${100 + idx * 5}`,
    is_recurring: true,
  }));

  // Initial Flashcards
  const flashcardDecks = subjectList.map((sub, idx) => ({
    id: `deck-${userId}-${idx + 1}`,
    subject_id: sub.id,
    subject_name: sub.name,
    title: `${sub.name} Core Flashcards`,
    description: `High-yield definitions and exam equations for ${sub.name}.`,
    cards_count: 2,
    due_today_count: 2,
    created_at: now.toISOString(),
  }));

  const flashcards: any[] = [];
  subjectList.forEach((sub, sIdx) => {
    const deckId = `deck-${userId}-${sIdx + 1}`;
    flashcards.push(
      {
        id: `card-${userId}-${sIdx}-1`,
        deck_id: deckId,
        user_id: userId,
        question: `What is the primary objective of ${sub.name}?`,
        answer: `To model, analyze, and build robust systems adhering to industry design benchmarks and theoretical accuracy.`,
        difficulty: 'medium',
        ease_factor: 2.5,
        interval_days: 1,
        repetition_count: 1,
        next_review_date: todayStr,
        last_reviewed_at: null,
      },
      {
        id: `card-${userId}-${sIdx}-2`,
        deck_id: deckId,
        user_id: userId,
        question: `State a fundamental theorem or rule in ${sub.name}.`,
        answer: `Ensure ACID invariants, invariant correctness, and optimal algorithmic asymptotic complexity.`,
        difficulty: 'medium',
        ease_factor: 2.5,
        interval_days: 2,
        repetition_count: 2,
        next_review_date: todayStr,
        last_reviewed_at: null,
      }
    );
  });

  // Initial Assignments
  const assignments = subjectList.slice(0, 2).map((sub, idx) => ({
    id: `as-${userId}-${idx + 1}`,
    subject_id: sub.id,
    title: `${sub.name} Lab Project & Problem Set`,
    due_date: new Date(Date.now() + 86400000 * (4 + idx * 3)).toISOString().split('T')[0],
    priority: idx === 0 ? ('high' as const) : ('medium' as const),
    status: 'in_progress' as const,
    estimated_effort_hours: 4,
    subtasks: [
      { title: 'Review problem guidelines & write skeleton', completed: true },
      { title: 'Implement core functionality & test cases', completed: false },
      { title: 'Prepare documentation & final submission', completed: false },
    ],
  }));

  // Initial Coding Problems
  const codingProblems = [
    {
      id: `prob-${userId}-1`,
      title: 'Two Sum & Hash Map Lookup',
      difficulty: 'easy',
      platform: 'LeetCode',
      url: 'https://leetcode.com/problems/two-sum/',
      topic: 'Arrays',
      language: 'Python',
      status: 'solved',
      attempts_count: 1,
      notes: 'Optimal single-pass hash table with O(N) time and O(N) space.',
      solution_code: 'def twoSum(nums, target):\n    seen = {}\n    for i, n in enumerate(nums):\n        diff = target - n\n        if diff in seen:\n            return [seen[diff], i]\n        seen[n] = i',
      solved_at: now.toISOString(),
    },
    {
      id: `prob-${userId}-2`,
      title: 'Binary Search on Rotated Sorted Array',
      difficulty: 'medium',
      platform: 'LeetCode',
      url: 'https://leetcode.com/problems/search-in-rotated-sorted-array/',
      topic: 'Binary Search',
      language: 'Python',
      status: 'solved',
      attempts_count: 2,
      notes: 'Check which half is normally ordered and narrow boundaries accordingly.',
      solution_code: 'def search(nums, target):\n    l, r = 0, len(nums) - 1\n    while l <= r:\n        mid = (l + r) // 2\n        if nums[mid] == target: return mid\n        if nums[l] <= nums[mid]:\n            if nums[l] <= target < nums[mid]: r = mid - 1\n            else: l = mid + 1\n        else:\n            if nums[mid] < target <= nums[r]: l = mid + 1\n            else: r = mid - 1\n    return -1',
      solved_at: now.toISOString(),
    },
  ];

  // Initial Documents in Vault
  const documents = [
    {
      id: `doc-${userId}-1`,
      user_id: userId,
      subject_id: subjectList[0]?.id || 'sub-1',
      title: `${subjectList[0]?.name || 'Course'} Complete Lecture Notes.pdf`,
      file_url: 'https://mock.storage/lecture-notes.pdf',
      file_type: 'pdf',
      file_size_bytes: 1024 * 1420,
      status: 'ready',
      summary: `Comprehensive semester lecture material for ${subjectList[0]?.name || 'Core Subjects'} covering key definitions, theorems, and exam formulas.`,
      key_points: ['Core Definitions', 'Relational Invariants', 'Asymptotic Complexity', 'Exam Highlights'],
      created_at: now.toISOString(),
    },
  ];

  // Initial Quizzes
  const quizzes = [
    {
      id: `quiz-${userId}-1`,
      subject_id: subjectList[0]?.id || 'sub-1',
      title: `${subjectList[0]?.name || 'Core'} Midterm Readiness Assessment`,
      difficulty: 'medium',
      time_limit_minutes: 15,
      is_mock_exam: false,
      created_at: now.toISOString(),
      questions: [
        {
          id: 'q-1',
          question_type: 'multiple_choice',
          question_text: `What is the key goal of ${subjectList[0]?.name || 'the system'}?`,
          options: [
            'Maintain data consistency and optimal performance',
            'Maximize memory overhead',
            'Eliminate all indexing structures',
            'None of the above',
          ],
          points: 1,
        },
        {
          id: 'q-2',
          question_type: 'multiple_choice',
          question_text: 'Which property guarantees that all transactions complete fully or not at all?',
          options: ['Atomicity', 'Consistency', 'Isolation', 'Durability'],
          points: 1,
        },
      ],
    },
  ];

  // Initial Mistakes
  const mistakes = [
    {
      id: `mis-${userId}-1`,
      subject_id: subjectList[0]?.id || 'sub-1',
      source_type: 'quiz',
      question_or_problem: 'Difference between optimistic and pessimistic concurrency control',
      user_mistake: 'Confused timestamp ordering validation with two-phase locking phase rules.',
      correct_solution: 'Pessimistic concurrency control locks resources upfront; optimistic concurrency validates conflicts before commit phase.',
      explanation: 'Optimistic CC assumes collisions are rare and verifies serializability during commit validation.',
      topic: 'Concurrency Control',
      mistake_count: 1,
      mastered: false,
      created_at: now.toISOString(),
    },
  ];

  // Initial Study Plan (7-Day Sprint)
  const studyPlans = [
    {
      id: `plan-${userId}-1`,
      subject_id: subjectList[0]?.id || 'sub-1',
      title: `${subjectList[0]?.name || 'Course'} 7-Day Final Exam Sprint`,
      exam_date: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0],
      total_days: 7,
      status: 'active',
      items: [
        { id: `pi-1`, plan_id: `plan-${userId}-1`, day_number: 1, topics: ['Unit 1 Overview & Core Architecture'], time_allocation_minutes: 180, learning_objectives: ['Master foundational concepts'], practice_questions: ['Explain core architectural principles'], is_completed: true },
        { id: `pi-2`, plan_id: `plan-${userId}-1`, day_number: 2, topics: ['Unit 2 Functional Properties & Algorithms'], time_allocation_minutes: 180, learning_objectives: ['Solve algorithm questions and verify complexity'], practice_questions: ['Trace sample execution flow'], is_completed: true },
        { id: `pi-3`, plan_id: `plan-${userId}-1`, day_number: 3, topics: ['Unit 3 Optimization & Indexing'], time_allocation_minutes: 240, learning_objectives: ['Understand performance bottlenecks and tree balancing'], practice_questions: ['Calculate worst-case traversal cost'], is_completed: false },
        { id: `pi-4`, plan_id: `plan-${userId}-1`, day_number: 4, topics: ['Full Mock Assessment & Mistake Review'], time_allocation_minutes: 150, learning_objectives: ['Score > 85% on mock questions'], practice_questions: ['Re-test previously missed flashcards'], is_completed: false },
      ],
    },
  ];

  // Initial Conversations
  const conversations = [
    {
      id: `conv-${userId}-1`,
      title: `${subjectList[0]?.name || 'Study'} Orientation & Roadmap`,
      mode: 'notes_rag',
      subject_id: subjectList[0]?.id || 'sub-1',
      subject_name: subjectList[0]?.name || 'Academic Core',
      updated_at: now.toISOString(),
      messages: [
        {
          id: `msg-${userId}-1`,
          conversation_id: `conv-${userId}-1`,
          role: 'user',
          content: `Hi AI Tutor! What is our study strategy for ${subjectList[0]?.name || 'this semester'}?`,
          created_at: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: `msg-${userId}-2`,
          conversation_id: `conv-${userId}-1`,
          role: 'assistant',
          content: `Hello **${user.full_name}**! 🎓\n\nWelcome to your personalized **Student Lifeline Academic Workspace** for **${user.university || 'your university'}**!\n\nHere is our recommended strategy:\n1. **Active Recall & Spaced Repetition**: We have initialized your SM-2 flashcard decks for *${subjectList[0]?.name}*.\n2. **Daily Focused Missions**: Target 1 to 2 high-priority concepts every morning.\n3. **Mistake Notebook**: Any quiz question or coding error you record will be prioritized in your targeted reviews.\n\nFeel free to ask me anything about your syllabus, exam questions, or code optimization!`,
          citations: [
            {
              document_title: `${subjectList[0]?.name || 'Course'} Complete Lecture Notes.pdf`,
              document_id: `doc-${userId}-1`,
              page_number: 1,
              snippet: `Student Lifeline syllabus roadmap configured for ${user.course || 'Computer Science'}.`,
            },
          ],
          created_at: new Date(Date.now() - 3500000).toISOString(),
        },
      ],
    },
  ];

  return {
    profile: {
      id: userId,
      full_name: user.full_name,
      avatar_url: null,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    },
    academicProfile: {
      user_id: userId,
      education_level: user.education_level || 'Undergraduate',
      college_university: user.university || 'University of Technology',
      course: user.course || 'Computer Science',
      semester: Number(user.semester || 1),
      preferred_study_hours_start: '09:00:00',
      preferred_study_hours_end: '22:00:00',
      daily_available_hours: Number(user.daily_hours || 4.0),
      break_duration_minutes: 15,
      goals: user.goals ? [user.goals] : ['Master course curriculum and achieve 4.0 GPA'],
      onboarding_completed: true,
    },
    subjects: subjectList,
    tasks,
    studySessions: [],
    timetable,
    assignments,
    flashcardDecks,
    flashcards,
    mistakes,
    codingProblems,
    documents,
    quizzes,
    studyPlans,
    conversations,
  };
}

/**
 * Get the isolated workspace for a given user ID.
 * If user is Demo User and no workspace exists, clones initialStaticData.
 * If new user and no workspace exists, creates a fresh personalized workspace.
 */
export function getUserWorkspace(userId: string): StaticDataStore {
  const key = `${WORKSPACE_PREFIX}${userId}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to parse user workspace:', e);
  }

  // Find user in registry
  const users = getRegisteredUsers();
  const user = users.find((u) => u.id === userId);

  if (userId === DEMO_USER.id || user?.email.toLowerCase() === DEMO_USER.email.toLowerCase()) {
    // Clone initial demo data
    const demoData = JSON.parse(JSON.stringify(initialStaticData));
    saveUserWorkspace(userId, demoData);
    return demoData;
  }

  // Fresh user workspace
  const freshUser: RegisteredUser = user || {
    id: userId,
    email: 'student@studentlifeline.local',
    full_name: 'Student',
    university: 'Stanford University',
    course: 'Computer Science',
    semester: 4,
    created_at: new Date().toISOString(),
  };

  const newWorkspace = createNewUserWorkspace(freshUser);
  saveUserWorkspace(userId, newWorkspace);
  return newWorkspace;
}

/**
 * Save user workspace
 */
export function saveUserWorkspace(userId: string, data: StaticDataStore): void {
  const key = `${WORKSPACE_PREFIX}${userId}`;
  try {
    localStorage.setItem(key, JSON.stringify(data));
    // Also update legacy live cache key for immediate compatibility
    localStorage.setItem('lifeos_live_data_cache_v3', JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save user workspace:', e);
  }
}

/**
 * Get active user's workspace
 */
export function getActiveWorkspace(): StaticDataStore {
  const session = getActiveSession();
  const userId = session?.user?.id || DEMO_USER.id;
  return getUserWorkspace(userId);
}

/**
 * Save active user's workspace
 */
export function saveActiveWorkspace(data: StaticDataStore): void {
  const session = getActiveSession();
  const userId = session?.user?.id || DEMO_USER.id;
  saveUserWorkspace(userId, data);
  dispatchDataChange();
}

/**
 * Register a new user on the spot
 */
export function registerUser(payload: {
  fullName: string;
  email: string;
  password?: string;
  university?: string;
  course?: string;
  semester?: number;
  educationLevel?: string;
  dailyHours?: number;
  goals?: string;
  subjects?: Array<{ name: string; code?: string; color?: string; target_grade?: string }>;
}): { user: RegisteredUser; session: UserSession } {
  const cleanEmail = payload.email.trim().toLowerCase();
  const finalName = payload.fullName.trim() || deriveNameFromEmail(cleanEmail);
  const users = getRegisteredUsers();

  // Check if user already exists
  let existing = users.find((u) => u.email.toLowerCase() === cleanEmail);
  let user: RegisteredUser;

  if (existing) {
    // Update existing user details
    existing.full_name = finalName;
    if (payload.password) existing.password = payload.password;
    if (payload.university) existing.university = payload.university;
    if (payload.course) existing.course = payload.course;
    if (payload.semester) existing.semester = Number(payload.semester);
    if (payload.educationLevel) existing.education_level = payload.educationLevel;
    if (payload.dailyHours) existing.daily_hours = Number(payload.dailyHours);
    if (payload.goals) existing.goals = payload.goals;
    saveRegisteredUsers(users);
    user = existing;
  } else {
    // Generate new unique ID
    const newId = 'usr_' + Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
    user = {
      id: newId,
      email: cleanEmail,
      password: payload.password || 'password123',
      full_name: finalName,
      university: payload.university || 'State Tech / Stanford CS',
      course: payload.course || 'B.Tech Computer Science',
      semester: Number(payload.semester || 4),
      education_level: payload.educationLevel || 'Undergraduate',
      daily_hours: Number(payload.dailyHours || 4.0),
      goals: payload.goals || 'Maintain high GPA and master core concepts',
      created_at: new Date().toISOString(),
    };
    users.push(user);
    saveRegisteredUsers(users);

    // Initialize their custom workspace with custom subjects
    const workspace = createNewUserWorkspace(user, payload.subjects);
    saveUserWorkspace(user.id, workspace);
  }

  // Create active session
  const session: UserSession = {
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      university: user.university,
      course: user.course,
      semester: user.semester,
    },
    access_token: `token_${user.id}_${Date.now()}`,
  };

  setActiveSession(session);
  return { user, session };
}

/**
 * Sign in a user with email and password
 */
export function loginUser(email: string, password?: string): UserSession {
  const cleanEmail = email.trim().toLowerCase();
  const users = getRegisteredUsers();

  // Match existing user
  let user = users.find((u) => u.email.toLowerCase() === cleanEmail);

  if (!user) {
    // If user signs in with a new email on the spot, automatically register them!
    const res = registerUser({
      fullName: deriveNameFromEmail(cleanEmail),
      email: cleanEmail,
      password: password || 'password123',
    });
    return res.session;
  }

  const session: UserSession = {
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      university: user.university,
      course: user.course,
      semester: user.semester,
    },
    access_token: `token_${user.id}_${Date.now()}`,
  };

  setActiveSession(session);
  return session;
}

/**
 * Log out active user
 */
export function logoutCurrentUser(): void {
  setActiveSession(null);
}

/**
 * Update active student's profile information
 */
export function updateActiveUserProfile(data: Partial<RegisteredUser>): UserSession | null {
  const session = getActiveSession();
  if (!session) return null;

  const users = getRegisteredUsers();
  const user = users.find((u) => u.id === session.user.id);
  if (user) {
    if (data.full_name) user.full_name = data.full_name;
    if (data.email) user.email = data.email;
    if (data.university) user.university = data.university;
    if (data.course) user.course = data.course;
    if (data.semester) user.semester = Number(data.semester);
    if (data.daily_hours) user.daily_hours = Number(data.daily_hours);
    if (data.goals) user.goals = data.goals;
    saveRegisteredUsers(users);
  }

  // Update session
  session.user.full_name = data.full_name || session.user.full_name;
  session.user.email = data.email || session.user.email;
  session.user.university = data.university || session.user.university;
  session.user.course = data.course || session.user.course;
  session.user.semester = data.semester !== undefined ? Number(data.semester) : session.user.semester;
  setActiveSession(session);

  // Update workspace
  const workspace = getUserWorkspace(session.user.id);
  if (data.full_name) workspace.profile.full_name = data.full_name;
  if (data.university) workspace.academicProfile.college_university = data.university;
  if (data.course) workspace.academicProfile.course = data.course;
  if (data.semester) workspace.academicProfile.semester = Number(data.semester);
  if (data.daily_hours) workspace.academicProfile.daily_available_hours = Number(data.daily_hours);
  if (data.goals) workspace.academicProfile.goals = [data.goals];
  saveUserWorkspace(session.user.id, workspace);

  dispatchDataChange();
  return session;
}
