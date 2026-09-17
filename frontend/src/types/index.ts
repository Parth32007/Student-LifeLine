export interface Profile {
  id: string;
  full_name: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface AcademicProfile {
  user_id: string;
  education_level?: string;
  college_university?: string;
  course?: string;
  semester?: number;
  preferred_study_hours_start?: string;
  preferred_study_hours_end?: string;
  daily_available_hours?: number;
  break_duration_minutes?: number;
  goals?: string[];
  onboarding_completed?: boolean;
}

export interface SubjectUnit {
  id: string;
  subject_id: string;
  user_id?: string;
  unit_number: number;
  title: string;
  description?: string;
  topics: string[];
}

export interface Subject {
  id: string;
  user_id: string;
  name: string;
  color: string;
  target_grade?: string;
  credits?: number;
  syllabus_topics?: string[];
  units?: SubjectUnit[];
  created_at: string;
}

export interface Task {
  id: string;
  user_id: string;
  subject_id?: string;
  title: string;
  topic?: string;
  learning_objective?: string;
  recommended_resource?: string;
  scheduled_date: string;
  start_time?: string;
  end_time?: string;
  estimated_duration_minutes: number;
  actual_duration_minutes: number;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'rescheduled';
  is_locked: boolean;
  created_at: string;
  subject_name?: string;
  subject_color?: string;
}

export interface WhatToStudyNow {
  task_id?: string;
  title: string;
  subject_name?: string;
  topic?: string;
  recommended_duration_minutes: number;
  reason: string;
  action_type: string;
  resource?: string;
}

export interface StudySession {
  id: string;
  task_id?: string;
  subject_id?: string;
  started_at: string;
  ended_at?: string;
  duration_minutes: number;
  notes?: string;
  completed_objective: boolean;
}

export interface StudyPlanItem {
  id: string;
  plan_id: string;
  day_number: number;
  topics: string[];
  time_allocation_minutes: number;
  learning_objectives: string[];
  practice_questions: string[];
  is_completed: boolean;
}

export interface StudyPlan {
  id: string;
  subject_id: string;
  title: string;
  exam_date: string;
  total_days: number;
  status: string;
  items: StudyPlanItem[];
}

export interface DocumentItem {
  id: string;
  user_id: string;
  subject_id?: string;
  title: string;
  file_url?: string;
  file_type?: string;
  file_size_bytes?: number;
  status: 'uploading' | 'processing' | 'ready' | 'failed';
  summary?: string;
  key_points?: string[];
  formulas_definitions?: { name: string; description: string }[];
  created_at: string;
  subject_name?: string;
}

export interface RAGCitation {
  document_title: string;
  document_id: string;
  page_number?: number;
  snippet: string;
  similarity_score?: number;
}

export interface YouTubeResource {
  id: string;
  user_id: string;
  subject_id?: string;
  url: string;
  video_id: string;
  title: string;
  thumbnail_url?: string;
  duration_seconds: number;
  transcript?: string;
  summary?: string;
  key_concepts?: { concept: string; explanation: string }[];
  timestamps?: { time: string; topic: string }[];
  is_watched: string;
  created_at: string;
  subject_name?: string;
}

export interface Flashcard {
  id: string;
  deck_id: string;
  user_id: string;
  subject_id?: string;
  unit_id?: string;
  question: string;
  answer: string;
  difficulty: string;
  interval_days: number;
  repetition_count: number;
  ease_factor: number;
  next_review_date: string;
  last_reviewed_at?: string;
}

export interface FlashcardDeck {
  id: string;
  subject_id: string;
  unit_id?: string;
  title: string;
  description?: string;
  created_at: string;
  cards_count: number;
  due_today_count: number;
  subject_name?: string;
  unit_title?: string;
}

export interface QuizQuestion {
  id: string;
  unit_id?: string;
  question_type: string;
  question_text: string;
  options: string[];
  points: number;
  explanation?: string;
  correct_answer?: string;
}

export interface Quiz {
  id: string;
  subject_id?: string;
  unit_id?: string;
  title: string;
  topic?: string;
  difficulty: string;
  time_limit_minutes: number;
  is_mock_exam: boolean;
  created_at: string;
  subject_name?: string;
  unit_title?: string;
  questions: QuizQuestion[];
}

export interface QuizResult {
  attempt_id: string;
  quiz_id: string;
  score: number;
  max_score: number;
  percentage: number;
  time_taken_seconds: number;
  completed_at: string;
  weak_topics?: string[];

  results: {
    question_id: string;
    question_text: string;
    user_answer: string;
    correct_answer: string;
    is_correct: boolean;
    explanation?: string;
    ai_feedback?: string;
  }[];
}

export interface CodingProblem {
  id: string;
  title: string;
  platform: string;
  url?: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  language: string;
  status: 'solved' | 'attempted' | 'to_revise';
  attempts_count: number;
  notes?: string;
  solution_code?: string;
  solved_at: string;
}

export interface MistakeEntry {
  id: string;
  subject_id?: string;
  source_type: string;
  question_or_problem: string;
  user_mistake: string;
  correct_solution: string;
  explanation?: string;
  topic?: string;
  mistake_count: number;
  mastered: boolean;
  created_at: string;
  last_reviewed_at?: string;
  subject_name?: string;
}

export interface TimetableEvent {
  id: string;
  subject_id?: string;
  title: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  location?: string;
  is_recurring: boolean;
  subject_name?: string;
  subject_color?: string;
}

export interface Assignment {
  id: string;
  subject_id?: string;
  title: string;
  description?: string;
  due_date: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  status: 'todo' | 'in_progress' | 'completed';
  estimated_effort_hours: number;
  subtasks?: { title: string; completed: boolean }[];
  subject_name?: string;
  subject_color?: string;
}

export interface AcademicAnalytics {
  total_study_hours: number;
  weekly_study_hours: number;
  study_streak_days: number;
  tasks_completion_rate: number;
  coding_problems_solved: number;
  flashcards_reviewed_total: number;
  quizzes_taken: number;
  average_quiz_score: number;
  subject_progress: {
    subject_id: string;
    subject_name: string;
    color: string;
    total_tasks: number;
    completed_tasks: number;
    study_hours: number;
    mastery_score: number;
  }[];
  daily_study_history: { date: string; hours: number }[];
}

export interface ExamReadiness {
  subject_id: string;
  subject_name: string;
  exam_date?: string;
  days_remaining?: number;
  readiness_percentage: number;
  syllabus_coverage_pct: number;
  quiz_accuracy_pct: number;
  revision_completion_pct: number;
  weak_topics: string[];
  suggested_actions: string[];
  explanation: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: RAGCitation[];
  created_at: string;
}

export interface Conversation {
  id: string;
  title: string;
  mode: string;
  subject_id?: string;
  subject_name?: string;
  messages: ChatMessage[];
  updated_at: string;
}
