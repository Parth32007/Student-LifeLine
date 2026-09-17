import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookmarkX,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  HelpCircle,
  Filter,
  Check
} from 'lucide-react';
import { api } from '../services/api';
import { MistakeEntry } from '../types';

export const Mistakes: React.FC = () => {
  const [mistakes, setMistakes] = useState<MistakeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMastered, setFilterMastered] = useState<boolean | undefined>(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const navigate = useNavigate();

  const fetchMistakes = async () => {
    try {
      setLoading(true);
      const data = await api.listMistakes(filterMastered);
      setMistakes(data);
    } catch (e) {
      console.warn('Mistakes fetch notice', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMistakes();
  }, [filterMastered]);

  const toggleMastered = async (m: MistakeEntry) => {
    try {
      const updated = await api.updateMistake(m.id, !m.mastered);
      setMistakes((prev) => prev.map((item) => (item.id === m.id ? updated : item)));
    } catch (err) {
      console.error('Failed to toggle mistake status', err);
    }
  };

  const handleGenerateTargetedQuiz = async () => {
    setGeneratingQuiz(true);
    try {
      await api.generateTargetedQuiz();
      navigate('/quizzes');
    } catch (err: any) {
      alert(`Notice: ${err.message || 'Error generating quiz'}`);
    } finally {
      setGeneratingQuiz(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-500 uppercase tracking-wider">
            <BookmarkX className="h-4 w-4" />
            <span>Targeted Weakness Elimination</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-1">
            AI Mistake Notebook
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Errors from quizzes and coding practice are automatically indexed so you never repeat the same mistake.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Filter */}
          <div className="flex items-center bg-secondary rounded-xl p-1 text-xs">
            <button
              onClick={() => setFilterMastered(false)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                filterMastered === false ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              Active Mistakes
            </button>
            <button
              onClick={() => setFilterMastered(true)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                filterMastered === true ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground'
              }`}
            >
              Mastered
            </button>
          </div>

          <button
            onClick={handleGenerateTargetedQuiz}
            disabled={generatingQuiz || mistakes.length === 0}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-md shadow-indigo-500/25 disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            <span>{generatingQuiz ? 'Generating...' : 'Retake Targeted Quiz'}</span>
          </button>
        </div>
      </div>

      {/* Mistake Entries List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-muted-foreground">Loading mistake notebook...</div>
      ) : mistakes.length === 0 ? (
        <div className="py-16 text-center space-y-3 rounded-3xl bg-card border border-border">
          <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
          <h3 className="text-base font-bold text-foreground">
            {filterMastered ? 'No mastered mistakes yet.' : 'All clear! No unmastered mistakes.'}
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            When you take quizzes or mock exams, questions answered incorrectly will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mistakes.map((m) => (
            <div
              key={m.id}
              className={`p-5 rounded-3xl border space-y-3 transition-all ${
                m.mastered
                  ? 'bg-secondary/20 border-border/60 opacity-70'
                  : 'bg-card border-border hover:border-rose-500/40 shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-secondary text-[10px] font-bold uppercase text-foreground">
                    {m.source_type}
                  </span>
                  {m.topic && (
                    <span className="text-xs font-semibold text-rose-400">
                      {m.topic}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => toggleMastered(m)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                    m.mastered
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>{m.mastered ? 'Mastered' : 'Mark Mastered'}</span>
                </button>
              </div>

              {/* Problem Text */}
              <div className="text-sm font-bold text-foreground leading-snug">
                {m.question_or_problem}
              </div>

              {/* Your Error vs Correct Solution */}
              <div className="space-y-2 text-xs pt-1">
                <div className="p-2.5 rounded-xl bg-rose-500/5 border border-rose-500/20 text-rose-300">
                  <span className="font-bold text-rose-400">Your mistake:</span> {m.user_mistake}
                </div>
                <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-300">
                  <span className="font-bold text-emerald-400">Correct solution:</span> {m.correct_solution}
                </div>
              </div>

              {m.explanation && (
                <div className="text-xs text-muted-foreground pt-1 border-t border-border/40">
                  💡 {m.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
