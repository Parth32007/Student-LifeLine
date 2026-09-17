import React, { useState, useEffect } from 'react';
import {
  Award,
  CalendarCheck2,
  AlertTriangle,
  CheckCircle2,
  Trophy,
  Flame,
  Star,
  Plus,
  Minus,
  Sparkles,
  Zap,
  BookOpen
} from 'lucide-react';
import { useSubjects } from '../context/SubjectContext';

interface AttendanceRecord {
  subjectId: string;
  attended: number;
  total: number;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedDate?: string;
  category: 'streak' | 'mastery' | 'assessment' | 'focus';
}

export const AttendanceAchievements: React.FC = () => {
  const { subjects } = useSubjects();
  const [activeTab, setActiveTab] = useState<'attendance' | 'achievements'>('attendance');

  // Attendance state backed by localStorage
  const [attendance, setAttendance] = useState<Record<string, { attended: number; total: number }>>(() => {
    const saved = localStorage.getItem('lifeos_subject_attendance');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return {};
  });

  // Achievements state
  const achievements: Achievement[] = [
    {
      id: 'a1',
      title: '7-Day Academic Streak',
      description: 'Logged focused study missions for 7 consecutive days without interruption.',
      icon: '🔥',
      unlocked: true,
      unlockedDate: 'Unlocked yesterday',
      category: 'streak'
    },
    {
      id: 'a2',
      title: 'Syllabus Conqueror',
      description: 'Completed 100% of syllabus topics for at least one full core subject.',
      icon: '🏆',
      unlocked: true,
      unlockedDate: 'Unlocked 3 days ago',
      category: 'mastery'
    },
    {
      id: 'a3',
      title: 'Active Recall Ace',
      description: 'Achieved 90%+ recall accuracy across 50 spaced repetition flashcard reviews.',
      icon: '🧠',
      unlocked: true,
      unlockedDate: 'Unlocked this week',
      category: 'assessment'
    },
    {
      id: 'a4',
      title: 'Exam Ready Invariant',
      description: 'Reached 85%+ evidence-based exam readiness score on the readiness engine.',
      icon: '🎯',
      unlocked: false,
      category: 'mastery'
    },
    {
      id: 'a5',
      title: 'Deep Focus Marathon',
      description: 'Completed four 25-minute Pomodoro focus blocks in a single study session.',
      icon: '⚡',
      unlocked: false,
      category: 'focus'
    },
    {
      id: 'a6',
      title: 'Mock Exam Champion',
      description: 'Completed a 30-minute timed mock exam under test conditions with 0 mistakes.',
      icon: '🎖️',
      unlocked: false,
      category: 'assessment'
    }
  ];

  // Initialize attendance for loaded subjects if missing
  useEffect(() => {
    if (subjects.length > 0) {
      setAttendance((prev) => {
        const next = { ...prev };
        subjects.forEach((s, idx) => {
          if (!next[s.id]) {
            const defaults = [
              { attended: 26, total: 30 },
              { attended: 24, total: 28 },
              { attended: 22, total: 25 },
              { attended: 18, total: 26 },
            ];
            next[s.id] = defaults[idx % defaults.length];
          }
        });
        localStorage.setItem('lifeos_subject_attendance', JSON.stringify(next));
        return next;
      });
    }
  }, [subjects]);

  const updateAttendance = (subjectId: string, deltaAttended: number, deltaTotal: number) => {
    setAttendance((prev) => {
      const current = prev[subjectId] || { attended: 0, total: 0 };
      const nextAttended = Math.max(0, current.attended + deltaAttended);
      const nextTotal = Math.max(nextAttended, current.total + deltaTotal);
      const next = {
        ...prev,
        [subjectId]: { attended: nextAttended, total: nextTotal }
      };
      localStorage.setItem('lifeos_subject_attendance', JSON.stringify(next));
      return next;
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
            <Award className="h-4 w-4" />
            <span>Academic Performance Tracking</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-1">
            Attendance & Achievements
          </h1>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center bg-secondary rounded-2xl p-1 border border-border shrink-0">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'attendance'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <CalendarCheck2 className="h-3.5 w-3.5" />
            <span>Attendance Tracker</span>
          </button>
          <button
            onClick={() => setActiveTab('achievements')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'achievements'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Trophy className="h-3.5 w-3.5" />
            <span>Badges & Badges</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: Attendance Tracker                                     */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subjects.map((sub) => {
              const record = attendance[sub.id] || { attended: 0, total: 0 };
              const pct = record.total > 0 ? Math.round((record.attended / record.total) * 100) : 0;
              const isSafe = pct >= 75;

              // Calculate how many more classes can be missed without falling below 75%
              // or how many consecutive classes must be attended to recover 75%
              const safeMargin = Math.max(0, Math.floor(record.attended / 0.75 - record.total));
              const recoverNeeded = Math.max(0, Math.ceil((0.75 * record.total - record.attended) / 0.25));

              return (
                <div
                  key={sub.id}
                  className="rounded-3xl bg-card border border-border p-5 space-y-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <span
                          className="px-2.5 py-0.5 rounded-md text-[10px] font-bold text-white inline-block mb-1"
                          style={{ backgroundColor: sub.color || '#3B82F6' }}
                        >
                          {sub.credits || 4} Credits
                        </span>
                        <h3 className="text-lg font-bold text-foreground">{sub.name}</h3>
                      </div>

                      <div className="text-right">
                        <div
                          className={`text-2xl font-extrabold ${
                            isSafe ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
                          }`}
                        >
                          {pct}%
                        </div>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider ${
                            isSafe ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'
                          }`}
                        >
                          {isSafe ? 'Safe (≥75%)' : 'Warning (<75%)'}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isSafe ? 'bg-primary' : 'bg-rose-500'
                          }`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{record.attended} attended / {record.total} classes total</span>
                        <span>Min required: 75%</span>
                      </div>
                    </div>

                    {/* Advisory Note */}
                    <div className="p-3 rounded-2xl bg-secondary/40 border border-border text-xs flex items-center gap-2">
                      {isSafe ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="text-muted-foreground">
                            You can safely miss <strong className="text-foreground">{safeMargin}</strong> upcoming lecture(s) and remain above 75%.
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-4 w-4 text-rose-500 shrink-0" />
                          <span className="text-muted-foreground">
                            Must attend next <strong className="text-foreground">{recoverNeeded}</strong> consecutive class(es) to restore 75% attendance.
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Increment / Decrement controls */}
                  <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Log Class</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateAttendance(sub.id, 1, 1)}
                        className="px-2.5 py-1 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 flex items-center gap-1 text-[11px]"
                      >
                        <Plus className="h-3 w-3" />
                        <span>Attended</span>
                      </button>
                      <button
                        onClick={() => updateAttendance(sub.id, 0, 1)}
                        className="px-2.5 py-1 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground font-semibold flex items-center gap-1 text-[11px]"
                      >
                        <span>Missed</span>
                      </button>
                      <button
                        onClick={() => updateAttendance(sub.id, -1, -1)}
                        disabled={record.total === 0}
                        className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                        title="Undo last entry"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: Badges & Achievements                                  */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'achievements' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((badge) => (
              <div
                key={badge.id}
                className={`p-5 rounded-3xl border transition-all flex flex-col justify-between ${
                  badge.unlocked
                    ? 'bg-card border-border shadow-sm hover:border-primary/40'
                    : 'bg-card/50 border-border/50 opacity-60'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="text-3xl">{badge.icon}</div>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        badge.unlocked
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      {badge.unlocked ? 'Unlocked ✓' : 'In Progress'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-foreground">{badge.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{badge.description}</p>
                </div>

                <div className="pt-3 mt-2 border-t border-border/60 text-[11px] text-muted-foreground">
                  {badge.unlocked ? (
                    <span className="text-primary font-semibold">{badge.unlockedDate}</span>
                  ) : (
                    <span>Criterion not yet reached</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceAchievements;
