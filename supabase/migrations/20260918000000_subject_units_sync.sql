-- =============================================================================
-- LifeOS — Subject Units & Syllabus Synchronization Migration
-- Migration: 20260918000000_subject_units_sync.sql
-- =============================================================================

-- 1. Subject Units Table
CREATE TABLE IF NOT EXISTS public.subject_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    unit_number INT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    topics JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_subject_units_subject ON public.subject_units(subject_id, unit_number);
CREATE INDEX IF NOT EXISTS idx_subject_units_user ON public.subject_units(user_id);

-- Enable RLS on subject_units
ALTER TABLE public.subject_units ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    CREATE POLICY "Users can manage own subject units" ON public.subject_units
        FOR ALL USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 2. Add unit_id to Flashcard Decks & Flashcards if not present
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'flashcard_decks' AND column_name = 'unit_id'
    ) THEN
        ALTER TABLE public.flashcard_decks ADD COLUMN unit_id UUID REFERENCES public.subject_units(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'flashcards' AND column_name = 'unit_id'
    ) THEN
        ALTER TABLE public.flashcards ADD COLUMN unit_id UUID REFERENCES public.subject_units(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'flashcards' AND column_name = 'subject_id'
    ) THEN
        ALTER TABLE public.flashcards ADD COLUMN subject_id UUID REFERENCES public.subjects(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 3. Add unit_id to Quizzes and Quiz Questions if not present
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'quizzes' AND column_name = 'unit_id'
    ) THEN
        ALTER TABLE public.quizzes ADD COLUMN unit_id UUID REFERENCES public.subject_units(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'quiz_questions' AND column_name = 'unit_id'
    ) THEN
        ALTER TABLE public.quiz_questions ADD COLUMN unit_id UUID REFERENCES public.subject_units(id) ON DELETE SET NULL;
    END IF;
END $$;
