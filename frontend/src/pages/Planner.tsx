import React, { useState, useEffect } from 'react';
import {
  CalendarDays,
  Sparkles,
  Clock,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  Calendar,
  Layers,
  HelpCircle
} from 'lucide-react';
import { api } from '../services/api';
import { StudyPlan, Subject } from '../types';

export const Planner: React.FC = () => {
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [activePlan, setActivePlan] = useState<StudyPlan | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [examDate, setExamDate] = useState('');
  const [dailyHours, setDailyHours] = useState(3.0);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchPlansAndSubjects = async () => {
    try {
      setLoading(true);
      const [pData, sData] = await Promise.all([
        api.listStudyPlans(),
        api.listSubjects(),
      ]);
      setPlans(pData);
      setSubjects(sData);

      if (pData.length > 0) {
        setActivePlan(pData[0]);
      }
      if (sData.length > 0) {
        setSelectedSubjectId(sData[0].id);
      }
    } catch (e) {
      console.warn('Planner fetch notice', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlansAndSubjects();
    // Set default exam date 7 days from now
    const future = new Date();
    future.setDate(future.getDate() + 7);
    setExamDate(future.toISOString().split('T')[0]);
  }, []);

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId || !examDate || generating) return;

    setGenerating(true);
    try {
      const newPlan = await api.generateStudyPlan({
        subject_id: selectedSubjectId,
        exam_date: examDate,
        daily_available_hours: Number(dailyHours),
        convert_to_tasks: true,
      });
      setPlans((prev) => [newPlan, ...prev]);
      setActivePlan(newPlan);
    } catch (err: any) {
      alert(`Could not generate study plan: ${err.message || 'Error'}`);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-500 uppercase tracking-wider">
            <CalendarDays className="h-4 w-4" />
            <span>AI Academic Planning Engine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-1">
            Exam Countdown Planner
          </h1>
        </div>
      </div>

      {/* Generator Form Card */}
      <div className="rounded-3xl bg-card border border-border p-6 shadow-sm">
        <form onSubmit={handleGeneratePlan} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Target Course
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Exam Date
            </label>
            <input
              type="date"
              required
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Daily Hours Committed
            </label>
            <input
              type="number"
              step="0.5"
              min="1"
              max="10"
              value={dailyHours}
              onChange={(e) => setDailyHours(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary"
            />
          </div>

          <button
            type="submit"
            disabled={generating}
            className="flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold transition-all shadow-md shadow-indigo-500/25 disabled:opacity-50"
          >
            {generating ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Generate Plan</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Plans Display */}
      {loading ? (
        <div className="py-12 text-center text-xs text-muted-foreground">
          Loading academic study plans...
        </div>
      ) : activePlan ? (
        <div className="space-y-6">
          {/* Plan Header Info */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-5 rounded-3xl bg-secondary/40 border border-border gap-3">
            <div>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold">
                {activePlan.total_days}-Day Strategic Plan
              </span>
              <h2 className="text-xl font-bold text-foreground mt-1">{activePlan.title}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Target Exam Date: {activePlan.exam_date}
              </p>
            </div>
          </div>

          {/* Day-by-Day Roadmap Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activePlan.items.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl bg-card border border-border p-5 space-y-3.5 hover:border-primary/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-lg bg-indigo-600 text-white text-xs font-bold">
                      Day {item.day_number}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground font-mono font-medium">
                      <Clock className="h-3.5 w-3.5" />
                      {item.time_allocation_minutes}m
                    </span>
                  </div>

                  <div className="mt-3 space-y-1">
                    <div className="text-sm font-bold text-foreground">
                      {item.topics.join(', ') || 'Comprehensive Revision'}
                    </div>
                  </div>

                  {/* Learning Objectives */}
                  {item.learning_objectives && item.learning_objectives.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <div className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
                        Key Objectives
                      </div>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {item.learning_objectives.map((obj, oIdx) => (
                          <li key={oIdx} className="flex items-start gap-1.5">
                            <span className="text-primary mt-0.5">•</span>
                            <span>{obj}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Practice Questions */}
                  {item.practice_questions && item.practice_questions.length > 0 && (
                    <div className="mt-3 rounded-xl bg-secondary/40 p-2.5 border border-border/50 text-xs space-y-1">
                      <div className="font-semibold text-foreground flex items-center gap-1 text-[11px]">
                        <HelpCircle className="h-3.5 w-3.5 text-purple-400" />
                        <span>Practice Challenge</span>
                      </div>
                      <p className="text-muted-foreground text-[11px]">
                        {item.practice_questions[0]}
                      </p>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-border/40 text-[11px] text-emerald-500 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Integrated into Today's Mission</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="py-16 text-center space-y-2 rounded-3xl bg-card border border-border">
          <CalendarDays className="h-10 w-10 text-muted-foreground mx-auto" />
          <h3 className="text-base font-bold text-foreground">No study plans created yet</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Select a subject and upcoming exam date above to generate an intelligent day-by-day countdown plan.
          </p>
        </div>
      )}
    </div>
  );
};
