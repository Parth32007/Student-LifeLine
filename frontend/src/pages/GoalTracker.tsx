import React, { useState, useEffect } from 'react';
import {
  Target,
  Trophy,
  Flame,
  CheckCircle2,
  TrendingUp,
  Clock,
  BookOpen,
  Plus,
  Trash2,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useSubjects } from '../context/SubjectContext';
import { api } from '../services/api';

interface AcademicGoal {
  id: string;
  title: string;
  target_metric: string;
  current_val: number;
  target_val: number;
  category: 'gpa' | 'hours' | 'mastery' | 'habit';
  deadline: string;
}

export const GoalTracker: React.FC = () => {
  const { subjects } = useSubjects();
  const [targetGpa, setTargetGpa] = useState<number>(3.88);
  const [currentGpa, setCurrentGpa] = useState<number>(3.76);
  const [weeklyTargetHours, setWeeklyTargetHours] = useState<number>(25);
  const [weeklyCurrentHours, setWeeklyCurrentHours] = useState<number>(18.5);

  const [goals, setGoals] = useState<AcademicGoal[]>(() => {
    const saved = localStorage.getItem('lifeos_academic_goals');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [
      {
        id: 'g-1',
        title: 'Maintain Dean’s List GPA (Semester 4)',
        target_metric: 'GPA Score',
        current_val: 3.76,
        target_val: 3.88,
        category: 'gpa',
        deadline: 'End of Semester'
      },
      {
        id: 'g-2',
        title: 'Complete 25 Weekly Focused Study Hours',
        target_metric: 'Hours / Week',
        current_val: 18.5,
        target_val: 25.0,
        category: 'hours',
        deadline: 'Weekly Reset Sunday'
      },
      {
        id: 'g-3',
        title: 'Master All 5 Units in DBMS Syllabus',
        target_metric: 'Units Verified',
        current_val: 4,
        target_val: 5,
        category: 'mastery',
        deadline: 'Midterm Exam'
      },
      {
        id: 'g-4',
        title: 'Maintain 14-Day Consistent Study Streak',
        target_metric: 'Daily Streak',
        current_val: 6,
        target_val: 14,
        category: 'habit',
        deadline: 'Next 8 Days'
      }
    ];
  });

  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newMetric, setNewMetric] = useState('Units / Score');
  const [newCurrent, setNewCurrent] = useState(0);
  const [newTarget, setNewTarget] = useState(10);
  const [newCategory, setNewCategory] = useState<'gpa' | 'hours' | 'mastery' | 'habit'>('mastery');
  const [newDeadline, setNewDeadline] = useState('End of Month');

  useEffect(() => {
    localStorage.setItem('lifeos_academic_goals', JSON.stringify(goals));
  }, [goals]);

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newGoal: AcademicGoal = {
      id: `goal-${Date.now()}`,
      title: newTitle.trim(),
      target_metric: newMetric.trim(),
      current_val: Number(newCurrent),
      target_val: Number(newTarget),
      category: newCategory,
      deadline: newDeadline.trim()
    };

    setGoals((prev) => [newGoal, ...prev]);
    setShowAddModal(false);
    setNewTitle('');
    setNewCurrent(0);
    setNewTarget(10);
  };

  const handleDeleteGoal = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const handleIncrement = (id: string) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id !== id) return g;
        const next = Math.min(g.target_val, g.current_val + 1);
        return { ...g, current_val: next };
      })
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
            <Target className="h-4 w-4" />
            <span>Academic Target Setting</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-1">
            Goal Tracker & Milestones
          </h1>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-sm shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>Set New Goal</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Semester GPA Target Card */}
        <div className="p-5 rounded-3xl bg-card border border-border space-y-3 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase">
            <span>Target Semester GPA</span>
            <Trophy className="h-4 w-4 text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-foreground">{currentGpa.toFixed(2)}</span>
            <span className="text-xs text-muted-foreground">/ {targetGpa.toFixed(2)} Goal</span>
          </div>
          <div className="space-y-1">
            <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.round((currentGpa / targetGpa) * 100))}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>Current Pace</span>
              <span className="text-primary font-bold">{Math.round((currentGpa / targetGpa) * 100)}% on track</span>
            </div>
          </div>
        </div>

        {/* Weekly Study Commitment */}
        <div className="p-5 rounded-3xl bg-card border border-border space-y-3 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase">
            <span>Weekly Study Hours</span>
            <Clock className="h-4 w-4 text-primary" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-foreground">{weeklyCurrentHours}h</span>
            <span className="text-xs text-muted-foreground">/ {weeklyTargetHours}h Planned</span>
          </div>
          <div className="space-y-1">
            <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.round((weeklyCurrentHours / weeklyTargetHours) * 100))}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>{Math.max(0, weeklyTargetHours - weeklyCurrentHours)}h remaining</span>
              <span className="text-primary font-bold">{Math.round((weeklyCurrentHours / weeklyTargetHours) * 100)}%</span>
            </div>
          </div>
        </div>

        {/* Target Grade by Subject */}
        <div className="p-5 rounded-3xl bg-card border border-border space-y-3 shadow-sm">
          <div className="flex items-center justify-between text-xs font-bold text-muted-foreground uppercase">
            <span>Course Grade Targets</span>
            <BookOpen className="h-4 w-4 text-primary" />
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {subjects.slice(0, 4).map((s) => (
              <span
                key={s.id}
                className="px-2.5 py-1 rounded-xl bg-secondary text-secondary-foreground text-xs font-bold flex items-center gap-1.5"
              >
                <span>{s.name}</span>
                <span className="px-1.5 py-0.2 rounded bg-card text-primary text-[10px] font-black">
                  {s.target_grade || 'A'}
                </span>
              </span>
            ))}
          </div>
          <p className="text-[11px] text-muted-foreground pt-1">
            Synchronized with course subjects & syllabus credit weighting.
          </p>
        </div>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {goals.map((g) => {
          const pct = Math.min(100, Math.round((g.current_val / g.target_val) * 100));
          const isDone = pct >= 100;
          return (
            <div
              key={g.id}
              className="rounded-3xl bg-card border border-border p-5 space-y-3.5 hover:shadow-sm transition-all flex flex-col justify-between"
            >
              <div className="space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground text-[10px] font-bold uppercase tracking-wider">
                      {g.category}
                    </span>
                    <h3 className="text-base font-bold text-foreground mt-1">{g.title}</h3>
                  </div>
                  <button
                    onClick={() => handleDeleteGoal(g.id)}
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-muted-foreground">{g.target_metric}</span>
                  <span className="font-bold text-foreground">
                    {g.current_val} / {g.target_val}
                  </span>
                </div>

                <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isDone ? 'bg-emerald-500' : 'bg-primary'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                <span className="text-muted-foreground text-[11px]">Deadline: {g.deadline}</span>
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${isDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-primary'}`}>
                    {pct}%
                  </span>
                  {!isDone && (
                    <button
                      onClick={() => handleIncrement(g.id)}
                      className="px-2 py-0.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-bold transition-colors"
                    >
                      + Step
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Goal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-card border border-border p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-foreground">Set Academic Goal</h3>
            <form onSubmit={handleCreateGoal} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Goal Statement *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Master Graph Invariants in DSA"
                  className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-xs text-foreground focus:outline-none"
                  >
                    <option value="gpa">GPA Target</option>
                    <option value="hours">Study Hours</option>
                    <option value="mastery">Syllabus Mastery</option>
                    <option value="habit">Daily Habit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Target Metric Unit</label>
                  <input
                    type="text"
                    value={newMetric}
                    onChange={(e) => setNewMetric(e.target.value)}
                    placeholder="e.g. Hours, Problems, Units"
                    className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-xs text-foreground focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Current Value</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newCurrent}
                    onChange={(e) => setNewCurrent(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-xs text-foreground focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Target Goal Value</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newTarget}
                    onChange={(e) => setNewTarget(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-xs text-foreground focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Target Deadline</label>
                <input
                  type="text"
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  placeholder="e.g. End of Semester, Midterm Week"
                  className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-xs text-foreground focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-secondary text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-sm"
                >
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoalTracker;
