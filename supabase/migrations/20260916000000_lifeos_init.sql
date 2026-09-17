-- =============================================================================
-- LifeOS — AI Second Brain Database Schema
-- Supabase PostgreSQL + pgvector Migration
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- -----------------------------------------------------------------------------
-- 1. Profiles & Academic Profiles
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.academic_profiles (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    education_level TEXT DEFAULT 'Undergraduate',
    college_university TEXT,
    course TEXT,
    semester INT DEFAULT 1,
    preferred_study_hours_start TIME DEFAULT '09:00:00',
    preferred_study_hours_end TIME DEFAULT '22:00:00',
    daily_available_hours NUMERIC(4, 2) DEFAULT 4.0,
    break_duration_minutes INT DEFAULT 15,
    goals TEXT[] DEFAULT ARRAY[]::TEXT[],
    onboarding_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- -----------------------------------------------------------------------------
-- 2. Subjects
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT,
    color TEXT DEFAULT '#3B82F6',
    target_grade TEXT DEFAULT 'A',
    credits INT DEFAULT 3,
    syllabus_topics JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_subjects_user_id ON public.subjects(user_id);

-- -----------------------------------------------------------------------------
-- 3. Tasks & Today's Mission
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    topic TEXT,
    learning_objective TEXT,
    recommended_resource TEXT,
    scheduled_date DATE NOT NULL DEFAULT CURRENT_DATE,
    start_time TIME,
    end_time TIME,
    estimated_duration_minutes INT DEFAULT 45,
    actual_duration_minutes INT DEFAULT 0,
    priority TEXT CHECK (priority IN ('urgent', 'high', 'medium', 'low')) DEFAULT 'medium',
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
    status TEXT CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped', 'rescheduled')) DEFAULT 'pending',
    is_locked BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON public.tasks(user_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);

-- -----------------------------------------------------------------------------
-- 4. Study Sessions (Focus Mode & Time Tracking)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.study_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    ended_at TIMESTAMPTZ,
    duration_minutes INT DEFAULT 0,
    notes TEXT,
    completed_objective BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_study_sessions_user ON public.study_sessions(user_id);

-- -----------------------------------------------------------------------------
-- 5. Timetable & Calendar Events
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.timetable_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 1=Monday...
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location TEXT,
    is_recurring BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_timetable_user_day ON public.timetable_events(user_id, day_of_week);

-- -----------------------------------------------------------------------------
-- 6. Assignments & Deadlines
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ NOT NULL,
    priority TEXT CHECK (priority IN ('urgent', 'high', 'medium', 'low')) DEFAULT 'high',
    status TEXT CHECK (status IN ('todo', 'in_progress', 'completed')) DEFAULT 'todo',
    estimated_effort_hours NUMERIC(4, 2) DEFAULT 2.0,
    subtasks JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_assignments_user_due ON public.assignments(user_id, due_date);

-- -----------------------------------------------------------------------------
-- 7. Exam Study Plans (AI Academic Planner)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.study_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    exam_date DATE NOT NULL,
    total_days INT NOT NULL,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.study_plan_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES public.study_plans(id) ON DELETE CASCADE,
    day_number INT NOT NULL,
    topics JSONB NOT NULL DEFAULT '[]'::jsonb,
    time_allocation_minutes INT DEFAULT 120,
    learning_objectives TEXT[] DEFAULT ARRAY[]::TEXT[],
    practice_questions JSONB DEFAULT '[]'::jsonb,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- -----------------------------------------------------------------------------
-- 8. Smart Knowledge Vault & Document Chunks (RAG)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    file_url TEXT,
    file_type TEXT,
    file_size_bytes BIGINT,
    status TEXT CHECK (status IN ('uploading', 'processing', 'ready', 'failed')) DEFAULT 'uploading',
    summary TEXT,
    key_points TEXT[] DEFAULT ARRAY[]::TEXT[],
    formulas_definitions JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_documents_user_id ON public.documents(user_id);

CREATE TABLE IF NOT EXISTS public.document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
    chunk_index INT NOT NULL,
    page_number INT,
    content TEXT NOT NULL,
    token_count INT,
    embedding vector(768)
);

CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON public.document_chunks(document_id);
-- HNSW Index for cosine similarity vector search
CREATE INDEX IF NOT EXISTS idx_chunks_embedding_hnsw 
ON public.document_chunks 
USING hnsw (embedding vector_cosine_ops);

-- -----------------------------------------------------------------------------
-- 9. YouTube Lecture Intelligence
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.youtube_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    url TEXT NOT NULL,
    video_id TEXT NOT NULL,
    title TEXT NOT NULL,
    thumbnail_url TEXT,
    duration_seconds INT DEFAULT 0,
    transcript TEXT,
    summary TEXT,
    key_concepts JSONB DEFAULT '[]'::jsonb,
    timestamps JSONB DEFAULT '[]'::jsonb,
    is_watched BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- -----------------------------------------------------------------------------
-- 10. Flashcards & Spaced Repetition (SM-2 Algorithm)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.flashcard_decks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.flashcards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deck_id UUID NOT NULL REFERENCES public.flashcard_decks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
    interval_days INT DEFAULT 1,
    repetition_count INT DEFAULT 0,
    ease_factor NUMERIC(4, 2) DEFAULT 2.50,
    next_review_date DATE DEFAULT CURRENT_DATE,
    last_reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_flashcards_user_review ON public.flashcards(user_id, next_review_date);

CREATE TABLE IF NOT EXISTS public.flashcard_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flashcard_id UUID NOT NULL REFERENCES public.flashcards(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating BETWEEN 0 AND 5),
    review_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- -----------------------------------------------------------------------------
-- 11. AI Quizzes & Mock Exams
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    topic TEXT,
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
    time_limit_minutes INT DEFAULT 15,
    is_mock_exam BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    question_type TEXT CHECK (question_type IN ('mcq', 'true_false', 'short_answer', 'coding')) DEFAULT 'mcq',
    question_text TEXT NOT NULL,
    options JSONB DEFAULT '[]'::jsonb,
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    points INT DEFAULT 1
);

CREATE TABLE IF NOT EXISTS public.quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    score NUMERIC(5, 2) DEFAULT 0,
    max_score NUMERIC(5, 2) DEFAULT 0,
    percentage NUMERIC(5, 2) DEFAULT 0,
    time_taken_seconds INT DEFAULT 0,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.quiz_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
    user_answer TEXT,
    is_correct BOOLEAN DEFAULT false,
    ai_feedback TEXT
);

-- -----------------------------------------------------------------------------
-- 12. Coding Practice Tracker & Mistake Notebook
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coding_problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    platform TEXT DEFAULT 'LeetCode',
    url TEXT,
    topic TEXT NOT NULL,
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) DEFAULT 'medium',
    language TEXT DEFAULT 'Python',
    status TEXT CHECK (status IN ('solved', 'attempted', 'to_revise')) DEFAULT 'solved',
    attempts_count INT DEFAULT 1,
    notes TEXT,
    solution_code TEXT,
    solved_at DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_coding_user_date ON public.coding_problems(user_id, solved_at);

CREATE TABLE IF NOT EXISTS public.mistake_notebook (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    source_type TEXT CHECK (source_type IN ('quiz', 'coding', 'flashcard')) DEFAULT 'quiz',
    question_or_problem TEXT NOT NULL,
    user_mistake TEXT NOT NULL,
    correct_solution TEXT NOT NULL,
    explanation TEXT,
    topic TEXT,
    mistake_count INT DEFAULT 1,
    mastered BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    last_reviewed_at TIMESTAMPTZ
);

-- -----------------------------------------------------------------------------
-- 13. AI Tutor Conversations & Messages
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL,
    title TEXT NOT NULL DEFAULT 'Academic Discussion',
    mode TEXT DEFAULT 'general',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('user', 'assistant', 'system')) NOT NULL,
    content TEXT NOT NULL,
    citations JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at);

-- -----------------------------------------------------------------------------
-- 14. Weekly Reviews & Notifications
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.weekly_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    planned_hours NUMERIC(5, 2) DEFAULT 0,
    completed_hours NUMERIC(5, 2) DEFAULT 0,
    completion_rate NUMERIC(5, 2) DEFAULT 0,
    most_studied_subject TEXT,
    weak_topics TEXT[] DEFAULT ARRAY[]::TEXT[],
    ai_insights TEXT,
    next_week_goals TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    read BOOLEAN DEFAULT false,
    link TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timetable_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_plan_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.youtube_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coding_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mistake_notebook ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Helper policy creation
DO $$ 
BEGIN
    -- Profiles
    CREATE POLICY "Users can manage own profile" ON public.profiles
        FOR ALL USING (auth.uid() = id);

    -- Academic Profiles
    CREATE POLICY "Users can manage own academic profile" ON public.academic_profiles
        FOR ALL USING (auth.uid() = user_id);

    -- Subjects
    CREATE POLICY "Users can manage own subjects" ON public.subjects
        FOR ALL USING (auth.uid() = user_id);

    -- Tasks
    CREATE POLICY "Users can manage own tasks" ON public.tasks
        FOR ALL USING (auth.uid() = user_id);

    -- Study sessions
    CREATE POLICY "Users can manage own study sessions" ON public.study_sessions
        FOR ALL USING (auth.uid() = user_id);

    -- Timetable
    CREATE POLICY "Users can manage own timetable events" ON public.timetable_events
        FOR ALL USING (auth.uid() = user_id);

    -- Assignments
    CREATE POLICY "Users can manage own assignments" ON public.assignments
        FOR ALL USING (auth.uid() = user_id);

    -- Study plans
    CREATE POLICY "Users can manage own study plans" ON public.study_plans
        FOR ALL USING (auth.uid() = user_id);

    CREATE POLICY "Users can view own study plan items" ON public.study_plan_items
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM public.study_plans 
                WHERE public.study_plans.id = public.study_plan_items.plan_id 
                AND public.study_plans.user_id = auth.uid()
            )
        );

    -- Documents & Chunks
    CREATE POLICY "Users can manage own documents" ON public.documents
        FOR ALL USING (auth.uid() = user_id);

    CREATE POLICY "Users can view own document chunks" ON public.document_chunks
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM public.documents 
                WHERE public.documents.id = public.document_chunks.document_id 
                AND public.documents.user_id = auth.uid()
            )
        );

    -- YouTube Resources
    CREATE POLICY "Users can manage own youtube resources" ON public.youtube_resources
        FOR ALL USING (auth.uid() = user_id);

    -- Flashcards
    CREATE POLICY "Users can manage own flashcard decks" ON public.flashcard_decks
        FOR ALL USING (auth.uid() = user_id);

    CREATE POLICY "Users can manage own flashcards" ON public.flashcards
        FOR ALL USING (auth.uid() = user_id);

    CREATE POLICY "Users can manage own flashcard reviews" ON public.flashcard_reviews
        FOR ALL USING (auth.uid() = user_id);

    -- Quizzes
    CREATE POLICY "Users can manage own quizzes" ON public.quizzes
        FOR ALL USING (auth.uid() = user_id);

    CREATE POLICY "Users can manage own quiz questions" ON public.quiz_questions
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM public.quizzes 
                WHERE public.quizzes.id = public.quiz_questions.quiz_id 
                AND public.quizzes.user_id = auth.uid()
            )
        );

    CREATE POLICY "Users can manage own quiz attempts" ON public.quiz_attempts
        FOR ALL USING (auth.uid() = user_id);

    CREATE POLICY "Users can manage own quiz answers" ON public.quiz_answers
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM public.quiz_attempts 
                WHERE public.quiz_attempts.id = public.quiz_answers.attempt_id 
                AND public.quiz_attempts.user_id = auth.uid()
            )
        );

    -- Coding & Mistakes
    CREATE POLICY "Users can manage own coding problems" ON public.coding_problems
        FOR ALL USING (auth.uid() = user_id);

    CREATE POLICY "Users can manage own mistake notebook" ON public.mistake_notebook
        FOR ALL USING (auth.uid() = user_id);

    -- AI Conversations & Messages
    CREATE POLICY "Users can manage own conversations" ON public.conversations
        FOR ALL USING (auth.uid() = user_id);

    CREATE POLICY "Users can manage own messages" ON public.messages
        FOR ALL USING (auth.uid() = user_id);

    -- Reviews & Notifications
    CREATE POLICY "Users can manage own weekly reviews" ON public.weekly_reviews
        FOR ALL USING (auth.uid() = user_id);

    CREATE POLICY "Users can manage own notifications" ON public.notifications
        FOR ALL USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- -----------------------------------------------------------------------------
-- Profile Auto-Creation Trigger on auth.users Signup
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', 'LifeOS Student'),
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO public.academic_profiles (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
