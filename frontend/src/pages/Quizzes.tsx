import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Sparkles,
  Timer,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  RotateCcw,
  BookOpen,
  Award,
  Bookmark,
  BookmarkX,
  Play,
  BrainCircuit,
  AlertCircle,
  Flag,
  ListOrdered,
  ChevronLeft,
  ChevronRight,
  TrendingDown,
  Layers
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSubjects } from '../context/SubjectContext';
import { api } from '../services/api';
import { Quiz, SubjectUnit, QuizResult } from '../types';

export const Quizzes: React.FC = () => {
  const navigate = useNavigate();
  const { subjects, loading: subjectsLoading } = useSubjects();

  // Configuration Controls
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('all');
  const [assessmentType, setAssessmentType] = useState<'quiz' | 'mock_exam'>('quiz');
  const [numQuestions, setNumQuestions] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<string>('medium');
  const [questionTypes, setQuestionTypes] = useState<string[]>(['multiple_choice', 'true_false', 'short_answer']);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<number>(15);

  // Active Assessment State
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);

  // History & List
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [generating, setGenerating] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Auto-select first subject
  useEffect(() => {
    if (subjects.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(subjects[0].id);
      setSelectedUnitId('all');
    }
  }, [subjects, selectedSubjectId]);

  // Adjust time limit default when switching assessment type
  useEffect(() => {
    if (assessmentType === 'mock_exam') {
      setTimeLimitMinutes(30);
      setNumQuestions(10);
    } else {
      setTimeLimitMinutes(15);
      setNumQuestions(5);
    }
  }, [assessmentType]);

  // Load existing quizzes
  const fetchQuizzes = async () => {
    try {
      const data = await api.listQuizzes();
      setQuizzes(data);
    } catch (err) {
      console.warn('Failed to load quizzes', err);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  // Compute available units for selected subject
  const currentSubject = subjects.find((s) => s.id === selectedSubjectId);
  const availableUnits: SubjectUnit[] = currentSubject?.units || [];

  const handleSubjectChange = (newSubId: string) => {
    setSelectedSubjectId(newSubId);
    setSelectedUnitId('all');
  };

  // Timer countdown with Auto-Submit
  useEffect(() => {
    let timer: any = null;
    if (activeQuiz && secondsLeft > 0 && !quizResult) {
      timer = setInterval(() => {
        setSecondsLeft((s) => s - 1);
      }, 1000);
    } else if (activeQuiz && secondsLeft === 0 && !quizResult) {
      // Auto-submit on expiration
      handleSubmitAssessment(true);
    }
    return () => clearInterval(timer);
  }, [activeQuiz, secondsLeft, quizResult]);

  // Generate Assessment with Gemini
  const handleGenerateAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId || !currentSubject) {
      setStatusMessage({ type: 'error', text: 'Please select a course subject first.' });
      return;
    }

    const hasSyllabus = availableUnits.length > 0 || (currentSubject.syllabus_topics && currentSubject.syllabus_topics.length > 0);
    if (!hasSyllabus) {
      setStatusMessage({
        type: 'error',
        text: `Subject "${currentSubject.name}" has no syllabus or units. Please add or update its syllabus in the Subjects page first.`
      });
      return;
    }

    setGenerating(true);
    setStatusMessage(null);

    try {
      const quiz = await api.generateQuiz({
        subject_id: currentSubject.id,
        unit_id: selectedUnitId === 'all' ? undefined : selectedUnitId,
        difficulty,
        num_questions: numQuestions,
        question_count: numQuestions,
        is_mock_exam: assessmentType === 'mock_exam',
        time_limit_minutes: timeLimitMinutes,
        question_types: questionTypes,
      });

      setQuizzes((prev) => [quiz, ...prev]);
      startAssessment(quiz);
      setStatusMessage({
        type: 'success',
        text: `Gemini has generated a ${assessmentType === 'mock_exam' ? 'Mock Exam' : 'Mastery Quiz'} for ${currentSubject.name}!`
      });
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Assessment generation failed. Please verify your connection or syllabus.'
      });
    } finally {
      setGenerating(false);
    }
  };

  const startAssessment = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setCurrentQIndex(0);
    setAnswers({});
    setMarkedForReview(new Set());
    setQuizResult(null);
    setSecondsLeft((quiz.time_limit_minutes || timeLimitMinutes) * 60);
  };

  const handleSelectAnswer = (qId: string, val: string) => {
    setAnswers((prev) => ({ ...prev, [qId]: val }));
  };

  const toggleMarkForReview = (qId: string) => {
    setMarkedForReview((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) {
        next.delete(qId);
      } else {
        next.add(qId);
      }
      return next;
    });
  };

  const handleSubmitAssessment = async (isAutoSubmit = false) => {
    if (!activeQuiz || submitting) return;

    if (!isAutoSubmit) {
      const answeredCount = Object.keys(answers).length;
      const totalCount = activeQuiz.questions.length;
      if (answeredCount < totalCount) {
        const confirmSubmit = confirm(
          `You have answered ${answeredCount} of ${totalCount} questions. Are you sure you want to submit?`
        );
        if (!confirmSubmit) return;
      }
    }

    setSubmitting(true);
    const totalSecs = (activeQuiz.time_limit_minutes || timeLimitMinutes) * 60;
    const timeTaken = Math.max(1, totalSecs - secondsLeft);

    const submissionPayload = activeQuiz.questions.map((q) => ({
      question_id: q.id,
      user_answer: answers[q.id] || '',
    }));

    try {
      const result = await api.submitQuiz(activeQuiz.id, timeTaken, submissionPayload);
      setQuizResult(result);
    } catch (err: any) {
      alert(`Error evaluating assessment: ${err?.message || 'Failed'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const currentQuestion = activeQuiz?.questions[currentQIndex];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-500 uppercase tracking-wider">
            <HelpCircle className="h-4 w-4" />
            <span>Academic Assessment Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-1">
            Quizzes & Mock Exam Simulator
          </h1>
        </div>
      </div>

      {/* Notification Banner */}
      {statusMessage && (
        <div
          className={`flex items-center justify-between p-4 rounded-2xl border text-xs font-semibold backdrop-blur-md transition-all ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs opacity-70 hover:opacity-100 ml-4 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Configuration Form Bar (visible when no active assessment or quizResult) */}
      {!activeQuiz && !quizResult && (
        <div className="rounded-3xl bg-card border border-border p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-foreground uppercase tracking-wider">
              <BrainCircuit className="h-4 w-4 text-indigo-400" />
              <span>Assessment & Exam Configuration</span>
            </div>

            {/* Assessment Type Switcher */}
            <div className="flex rounded-xl bg-secondary p-1 border border-border">
              <button
                type="button"
                onClick={() => setAssessmentType('quiz')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  assessmentType === 'quiz'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Unit Quiz
              </button>
              <button
                type="button"
                onClick={() => setAssessmentType('mock_exam')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  assessmentType === 'mock_exam'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Timed Mock Exam
              </button>
            </div>
          </div>

          <form onSubmit={handleGenerateAssessment} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* 1. Subject Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Course Subject *
                </label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  disabled={subjectsLoading}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-secondary border border-border text-xs sm:text-sm text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="" disabled>Select Subject</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Unit Dropdown */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5 flex items-center justify-between">
                  <span>Syllabus Unit *</span>
                  {!selectedSubjectId && <span className="text-[10px] text-muted-foreground">(Select subject first)</span>}
                </label>
                <select
                  value={selectedUnitId}
                  onChange={(e) => setSelectedUnitId(e.target.value)}
                  disabled={!selectedSubjectId || availableUnits.length === 0}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-secondary border border-border text-xs sm:text-sm text-foreground focus:outline-none focus:border-primary disabled:opacity-50"
                >
                  <option value="all">All Units ({availableUnits.length > 0 ? `${availableUnits.length} Units` : 'Full Syllabus'})</option>
                  {availableUnits.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Number of Questions */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Questions
                </label>
                <select
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-secondary border border-border text-xs sm:text-sm text-foreground focus:outline-none focus:border-primary"
                >
                  <option value={5}>5 Questions</option>
                  <option value={10}>10 Questions</option>
                  <option value={15}>15 Questions</option>
                  <option value={20}>20 Questions</option>
                </select>
              </div>

              {/* 4. Difficulty */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-secondary border border-border text-xs sm:text-sm text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="mixed">Mixed (Curriculum Standard)</option>
                  <option value="easy">Easy (Definitions & Syntax)</option>
                  <option value="medium">Medium (Analytical & Scenarios)</option>
                  <option value="hard">Hard (Proofs & Edge Cases)</option>
                </select>
              </div>
            </div>

            {/* Secondary Controls: Question Types & Time Limit */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2 border-t border-border/60 items-end">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Time Limit (Minutes)
                </label>
                <select
                  value={timeLimitMinutes}
                  onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-secondary border border-border text-xs sm:text-sm text-foreground focus:outline-none focus:border-primary"
                >
                  <option value={10}>10 Minutes</option>
                  <option value={15}>15 Minutes</option>
                  <option value={30}>30 Minutes</option>
                  <option value={45}>45 Minutes</option>
                  <option value={60}>60 Minutes (Standard Exam)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Question Formats
                </label>
                <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 text-foreground font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    MCQ
                  </span>
                  <span className="flex items-center gap-1 text-foreground font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    True/False
                  </span>
                  <span className="flex items-center gap-1 text-foreground font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    Short Answer
                  </span>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={generating || !selectedSubjectId}
                  className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm font-bold shadow-md shadow-indigo-500/25 transition-all disabled:opacity-50"
                >
                  {generating ? (
                    <>
                      <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                      <span>Gemini Generating...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 text-amber-300" />
                      <span>Generate {assessmentType === 'mock_exam' ? 'Mock Exam' : 'Assessment'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Active Assessment View */}
      {activeQuiz && !quizResult && (
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Sticky Header Bar */}
          <div className="sticky top-2 z-20 flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-card/90 backdrop-blur-md border border-border shadow-md">
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                {activeQuiz.is_mock_exam ? 'Timed Mock Exam' : 'Mastery Quiz'}
              </span>
              <h2 className="text-sm sm:text-base font-bold text-foreground">
                {activeQuiz.title}
              </h2>
            </div>

            <div className="flex items-center gap-3">
              {/* Countdown Timer */}
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-mono font-bold text-xs sm:text-sm border transition-colors ${
                  secondsLeft < 120
                    ? 'bg-rose-500/20 border-rose-500 text-rose-400 animate-pulse'
                    : 'bg-secondary border-border text-foreground'
                }`}
              >
                <Timer className="h-4 w-4" />
                <span>{formatTimer(secondsLeft)}</span>
              </div>

              {/* Submit Button */}
              <button
                onClick={() => handleSubmitAssessment(false)}
                disabled={submitting}
                className="px-4 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-md shadow-indigo-500/25 transition-all disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Finish & Submit'}
              </button>
            </div>
          </div>

          {/* Question & Palette Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Question Panel (2 cols) */}
            <div className="lg:col-span-2 space-y-4">
              {currentQuestion && (
                <div className="rounded-3xl bg-card border border-border p-6 sm:p-8 space-y-6 shadow-sm">
                  <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                      Question {currentQIndex + 1} of {activeQuiz.questions.length}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-secondary text-muted-foreground uppercase">
                        {currentQuestion.question_type.replace('_', ' ')}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleMarkForReview(currentQuestion.id)}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-colors ${
                          markedForReview.has(currentQuestion.id)
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            : 'bg-secondary text-muted-foreground hover:text-foreground'
                        }`}
                        title="Mark question to revisit before final submission"
                      >
                        <Flag className="h-3.5 w-3.5" />
                        <span>{markedForReview.has(currentQuestion.id) ? 'Marked' : 'Mark for Review'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Question Text */}
                  <div className="text-base sm:text-lg font-bold text-foreground leading-relaxed">
                    {currentQuestion.question_text}
                  </div>

                  {/* Answer Input Options */}
                  <div className="space-y-2.5 pt-2">
                    {currentQuestion.question_type === 'short_answer' ? (
                      <div>
                        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                          Type your concise theoretical response (evaluated by Gemini):
                        </label>
                        <textarea
                          rows={4}
                          value={answers[currentQuestion.id] || ''}
                          onChange={(e) => handleSelectAnswer(currentQuestion.id, e.target.value)}
                          placeholder="State the core principle, formal definition, or invariant properties..."
                          className="w-full p-3.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground focus:outline-none focus:border-primary"
                        />
                      </div>
                    ) : (
                      currentQuestion.options?.map((opt, oIdx) => {
                        const isSelected = answers[currentQuestion.id] === opt;
                        return (
                          <div
                            key={oIdx}
                            onClick={() => handleSelectAnswer(currentQuestion.id, opt)}
                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                              isSelected
                                ? 'bg-indigo-500/15 border-indigo-500 text-foreground font-semibold shadow-sm'
                                : 'bg-secondary/40 border-border/70 hover:bg-secondary text-foreground'
                            }`}
                          >
                            <div className="flex items-center gap-3 text-xs sm:text-sm">
                              <span className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold ${
                                isSelected ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-border text-muted-foreground'
                              }`}>
                                {String.fromCharCode(65 + oIdx)}
                              </span>
                              <span>{opt}</span>
                            </div>
                            {isSelected && <CheckCircle2 className="h-4 w-4 text-indigo-400 shrink-0" />}
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Navigation Buttons */}
                  <div className="pt-4 border-t border-border/60 flex items-center justify-between">
                    <button
                      onClick={() => setCurrentQIndex((i) => Math.max(0, i - 1))}
                      disabled={currentQIndex === 0}
                      className="flex items-center gap-1 px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold transition-all disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span>Previous</span>
                    </button>

                    <button
                      onClick={() =>
                        setCurrentQIndex((i) =>
                          Math.min(activeQuiz.questions.length - 1, i + 1)
                        )
                      }
                      disabled={currentQIndex === activeQuiz.questions.length - 1}
                      className="flex items-center gap-1 px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold transition-all disabled:opacity-40"
                    >
                      <span>Next</span>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Question Navigation Palette (1 col) */}
            <div className="space-y-4">
              <div className="rounded-3xl bg-card border border-border p-5 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-border/60 pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground uppercase tracking-wider">
                    <ListOrdered className="h-4 w-4 text-indigo-400" />
                    <span>Question Palette</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">
                    {Object.keys(answers).length}/{activeQuiz.questions.length} Answered
                  </span>
                </div>

                {/* Status Counters */}
                <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <div>{Object.keys(answers).length}</div>
                    <div className="font-normal opacity-80">Answered</div>
                  </div>
                  <div className="p-2 rounded-xl bg-secondary text-muted-foreground border border-border">
                    <div>{activeQuiz.questions.length - Object.keys(answers).length}</div>
                    <div className="font-normal opacity-80">Unanswered</div>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <div>{markedForReview.size}</div>
                    <div className="font-normal opacity-80">Marked</div>
                  </div>
                </div>

                {/* Number Grid */}
                <div className="grid grid-cols-5 gap-2 pt-1">
                  {activeQuiz.questions.map((q, idx) => {
                    const isCurrent = currentQIndex === idx;
                    const isAnswered = !!answers[q.id];
                    const isMarked = markedForReview.has(q.id);

                    return (
                      <button
                        key={q.id}
                        type="button"
                        onClick={() => setCurrentQIndex(idx)}
                        className={`h-9 w-full rounded-xl text-xs font-bold transition-all relative flex items-center justify-center ${
                          isCurrent
                            ? 'ring-2 ring-indigo-500 text-foreground font-black scale-105'
                            : ''
                        } ${
                          isMarked
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            : isAnswered
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-secondary text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        <span>{idx + 1}</span>
                        {isMarked && (
                          <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-amber-400" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-3 border-t border-border/60">
                  <button
                    type="button"
                    onClick={() => handleSubmitAssessment(false)}
                    className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-md shadow-indigo-500/20"
                  >
                    Submit Assessment Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assessment Results Screen */}
      {quizResult && activeQuiz && (
        <div className="space-y-6 animate-in zoom-in-95 duration-200">
          <div className="rounded-3xl bg-card border border-border p-6 sm:p-8 space-y-6 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
              <div>
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  Assessment Report & AI Diagnostics
                </span>
                <h2 className="text-2xl font-extrabold text-foreground tracking-tight mt-1">
                  {activeQuiz.title}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Completed in {Math.round(quizResult.time_taken_seconds / 60)} minutes • Objective & Gemini Short-Answer Evaluation
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setActiveQuiz(null);
                    setQuizResult(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-bold transition-all"
                >
                  Return to Quizzes
                </button>
                <button
                  onClick={() => navigate('/flashcards')}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold shadow-md shadow-indigo-500/25 transition-all"
                >
                  <Layers className="h-4 w-4" />
                  <span>Review Flashcards</span>
                </button>
              </div>
            </div>

            {/* Score & Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/25 space-y-1">
                <span className="text-xs font-semibold text-muted-foreground">Accuracy Score</span>
                <div className="text-3xl font-black text-indigo-400">
                  {quizResult.percentage}%
                </div>
                <div className="text-xs text-muted-foreground">
                  {quizResult.score} / {quizResult.max_score} Marks Achieved
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 space-y-1">
                <span className="text-xs font-semibold text-muted-foreground">Status</span>
                <div className="text-2xl font-black text-emerald-400">
                  {quizResult.percentage >= 75 ? 'Mastered' : quizResult.percentage >= 50 ? 'Review Needed' : 'Requires Revision'}
                </div>
                <div className="text-xs text-muted-foreground">
                  Logged to Learning Analytics
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-1">
                <span className="text-xs font-semibold text-muted-foreground">Weak Focus Areas</span>
                <div className="text-sm font-bold text-amber-400 line-clamp-1">
                  {quizResult.weak_topics && quizResult.weak_topics.length > 0
                    ? quizResult.weak_topics[0]
                    : 'None detected! Solid recall.'}
                </div>
                <div className="text-xs text-muted-foreground">
                  Indexed into Mistake Notebook
                </div>
              </div>
            </div>

            {/* Question by Question Detailed Diagnostics */}
            <div className="space-y-4 pt-2">
              <h3 className="text-base font-bold text-foreground">
                Question Review & Concept Solutions
              </h3>

              <div className="space-y-3">
                {quizResult.results.map((res, rIdx) => (
                  <div
                    key={res.question_id || rIdx}
                    className={`p-4 sm:p-5 rounded-2xl border space-y-3 transition-all ${
                      res.is_correct
                        ? 'bg-emerald-500/5 border-emerald-500/25'
                        : 'bg-rose-500/5 border-rose-500/25'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        {res.is_correct ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <span className="text-xs font-mono font-bold text-muted-foreground">
                            Question #{rIdx + 1}
                          </span>
                          <h4 className="text-sm font-bold text-foreground mt-0.5">
                            {res.question_text}
                          </h4>
                        </div>
                      </div>

                      <span
                        className={`text-xs font-bold px-2.5 py-0.5 rounded-md shrink-0 ${
                          res.is_correct
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-rose-500/20 text-rose-400'
                        }`}
                      >
                        {res.is_correct ? 'Correct' : 'Incorrect'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pl-7">
                      <div className="p-3 rounded-xl bg-secondary/50 border border-border space-y-1">
                        <span className="font-semibold text-muted-foreground block">Your Submission:</span>
                        <p className={res.is_correct ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'}>
                          {res.user_answer || '(No answer entered)'}
                        </p>
                      </div>

                      <div className="p-3 rounded-xl bg-secondary/50 border border-border space-y-1">
                        <span className="font-semibold text-muted-foreground block">Correct Syllabus Answer:</span>
                        <p className="text-emerald-400 font-semibold">{res.correct_answer}</p>
                      </div>
                    </div>

                    {/* Explanation */}
                    {res.explanation && (
                      <div className="text-xs text-muted-foreground pl-7 border-l-2 border-indigo-500/40 ml-7 space-y-1">
                        <span className="font-bold text-foreground">Syllabus Invariant: </span>
                        <span>{res.explanation}</span>
                      </div>
                    )}

                    {/* AI Feedback for short answer */}
                    {(res as any).ai_feedback && (
                      <div className="text-xs text-indigo-300 pl-7 italic">
                        Gemini Feedback: {(res as any).ai_feedback}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History & Past Assessments List */}
      {!activeQuiz && !quizResult && quizzes.length > 0 && (
        <div className="rounded-3xl bg-card border border-border p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">
              Recent Assessment History ({quizzes.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quizzes.slice(0, 6).map((q) => (
              <div
                key={q.id}
                className="p-4 rounded-2xl bg-secondary/30 border border-border/60 hover:bg-secondary/60 transition-all space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="px-2 py-0.5 rounded bg-secondary font-mono capitalize">
                      {q.is_mock_exam ? 'Mock Exam' : 'Quiz'}
                    </span>
                    <span>{q.questions.length} Questions</span>
                  </div>
                  <h4 className="text-sm font-bold text-foreground mt-2 line-clamp-2">
                    {q.title}
                  </h4>
                </div>

                <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground capitalize">{q.difficulty} Difficulty</span>
                  <button
                    onClick={() => startAssessment(q)}
                    className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1"
                  >
                    <Play className="h-3.5 w-3.5" />
                    <span>Retake</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
