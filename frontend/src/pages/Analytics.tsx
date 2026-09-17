import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Sparkles,
  Flame,
  CheckCircle2,
  Clock,
  Layers,
  Code2,
  HelpCircle,
  AlertTriangle,
  Award,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { api } from '../services/api';
import { AcademicAnalytics, ExamReadiness, Subject } from '../types';

export const Analytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<AcademicAnalytics | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [examReadiness, setExamReadiness] = useState<ExamReadiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingReadiness, setLoadingReadiness] = useState(false);
  const [weeklyReview, setWeeklyReview] = useState<any>(null);
  const [generatingReview, setGeneratingReview] = useState(false);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [aData, sData] = await Promise.all([
        api.getAnalyticsOverview(),
        api.listSubjects(),
      ]);
      setAnalytics(aData);
      setSubjects(sData);

      if (sData.length > 0) {
        setSelectedSubjectId(sData[0].id);
        fetchReadiness(sData[0].id);
      }
    } catch (e) {
      console.warn('Analytics fetch notice', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchReadiness = async (subjectId: string) => {
    try {
      setLoadingReadiness(true);
      const rData = await api.getExamReadiness(subjectId);
      setExamReadiness(rData);
    } catch (e) {
      console.warn('Exam readiness notice', e);
    } finally {
      setLoadingReadiness(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();

    const handleSync = () => {
      fetchAnalytics();
    };

    window.addEventListener('lifeos:subjects-changed', handleSync);
    window.addEventListener('lifeos:data-change', handleSync);
    return () => {
      window.removeEventListener('lifeos:subjects-changed', handleSync);
      window.removeEventListener('lifeos:data-change', handleSync);
    };
  }, []);

  const handleSelectSubject = (sId: string) => {
    setSelectedSubjectId(sId);
    fetchReadiness(sId);
  };

  const handleGenerateWeeklyReview = async () => {
    setGeneratingReview(true);
    try {
      const review = await api.generateWeeklyReview();
      setWeeklyReview(review);
    } catch (e) {
      console.error('Weekly review error', e);
    } finally {
      setGeneratingReview(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-500 uppercase tracking-wider">
            <BarChart3 className="h-4 w-4" />
            <span>Academic Intelligence & Readiness</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-1">
            Learning Progress & Exam Readiness
          </h1>
        </div>

        <button
          onClick={handleGenerateWeeklyReview}
          disabled={generatingReview}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-md shadow-indigo-500/25 disabled:opacity-50"
        >
          <Sparkles className="h-4 w-4" />
          <span>{generatingReview ? 'Synthesizing...' : 'Generate Weekly Review'}</span>
        </button>
      </div>

      {/* High-level KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-card border border-border space-y-1">
          <div className="text-xs text-muted-foreground font-semibold">Total Study Hours</div>
          <div className="text-2xl font-extrabold text-foreground">{analytics?.total_study_hours || 0}h</div>
          <div className="text-[11px] text-muted-foreground">{analytics?.weekly_study_hours || 0}h this week</div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border space-y-1">
          <div className="text-xs text-muted-foreground font-semibold">Task Completion Rate</div>
          <div className="text-2xl font-extrabold text-foreground">{analytics?.tasks_completion_rate || 0}%</div>
          <div className="text-[11px] text-emerald-400 font-semibold">Healthy velocity</div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border space-y-1">
          <div className="text-xs text-muted-foreground font-semibold">Assessment Average</div>
          <div className="text-2xl font-extrabold text-foreground">{analytics?.average_quiz_score || 0}%</div>
          <div className="text-[11px] text-muted-foreground">{analytics?.quizzes_taken || 0} quizzes taken</div>
        </div>

        <div className="p-4 rounded-2xl bg-card border border-border space-y-1">
          <div className="text-xs text-muted-foreground font-semibold">Active Daily Streak</div>
          <div className="text-2xl font-extrabold text-amber-400 flex items-center gap-1">
            <Flame className="h-6 w-6 fill-amber-400" />
            <span>{analytics?.study_streak_days || 1} days</span>
          </div>
          <div className="text-[11px] text-muted-foreground">Keep momentum going!</div>
        </div>
      </div>

      {/* Standout Feature C: Exam Readiness Dashboard */}
      <div className="rounded-3xl bg-card border border-border p-6 md:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-border">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
              <Award className="h-4 w-4" />
              <span>Standout Feature C: Evidence-Based Exam Readiness</span>
            </div>
            <h2 className="text-xl font-bold text-foreground mt-1">
              Readiness Dashboard: {examReadiness?.subject_name || 'Subject'}
            </h2>
          </div>

          <div className="flex gap-2">
            <select
              value={selectedSubjectId}
              onChange={(e) => handleSelectSubject(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-secondary border border-border text-xs text-foreground focus:outline-none"
            >
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {loadingReadiness ? (
          <div className="py-12 text-center text-xs text-muted-foreground">Evaluating exam evidence...</div>
        ) : examReadiness ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            {/* Readiness Gauge / Score */}
            <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-secondary/30 text-center space-y-2">
              <div className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                Readiness Score
              </div>
              <div className="text-5xl font-black bg-gradient-to-tr from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                {examReadiness.readiness_percentage}%
              </div>
              <div className="text-xs text-muted-foreground font-medium">
                {examReadiness.days_remaining} days until exam
              </div>
              <p className="text-[11px] text-muted-foreground pt-2 max-w-xs leading-relaxed">
                {examReadiness.explanation}
              </p>
            </div>

            {/* Evidence Breakdown Bars */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-foreground">Syllabus Coverage</span>
                  <span className="font-bold">{examReadiness.syllabus_coverage_pct}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full"
                    style={{ width: `${examReadiness.syllabus_coverage_pct}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-foreground">Quiz & Assessment Accuracy</span>
                  <span className="font-bold">{examReadiness.quiz_accuracy_pct}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full bg-purple-500 rounded-full"
                    style={{ width: `${examReadiness.quiz_accuracy_pct}%` }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-foreground">Revision Health (Mistake Recovery)</span>
                  <span className="font-bold">{examReadiness.revision_completion_pct}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${examReadiness.revision_completion_pct}%` }}
                  />
                </div>
              </div>

              {/* Identified Weak Topics */}
              {examReadiness.weak_topics.length > 0 && (
                <div className="pt-2">
                  <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5 mb-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    <span>Identified Weak Concepts:</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {examReadiness.weak_topics.map((t, idx) => (
                      <span key={idx} className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-300 text-[11px]">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Recommended High-Yield Next Actions */}
            <div className="p-5 rounded-2xl bg-secondary/40 border border-border/80 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                Next Strategic Actions
              </div>
              <div className="space-y-2 text-xs">
                {examReadiness.suggested_actions.map((act, i) => (
                  <div key={i} className="flex items-start gap-2 text-foreground font-medium">
                    <ArrowRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <span>{act}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>

      {/* Study Hours Trend Chart */}
      <div className="rounded-3xl bg-card border border-border p-6 space-y-4">
        <h3 className="text-base font-bold text-foreground">
          Study Hours Distribution (Past 7 Days)
        </h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics?.daily_study_history || []}>
              <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} unit="h" />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem' }}
                itemStyle={{ color: '#818cf8' }}
              />
              <Bar dataKey="hours" fill="#6366f1" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Standout Feature I: Smart Weekly Review Output */}
      {weeklyReview && (
        <div className="rounded-3xl bg-secondary/40 border border-border p-6 space-y-4 animate-in fade-in">
          <div className="flex items-center gap-2 text-sm font-bold text-indigo-400">
            <Sparkles className="h-5 w-5" />
            <span>AI Weekly Retrospective</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-card border border-border space-y-1">
              <div className="text-muted-foreground">Planned vs Completed</div>
              <div className="text-lg font-bold text-foreground">
                {weeklyReview.completed_hours}h / {weeklyReview.planned_hours}h
              </div>
              <div className="text-emerald-400 font-semibold">{weeklyReview.completion_rate}% hit rate</div>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border space-y-1">
              <div className="text-muted-foreground">Most Focused Subject</div>
              <div className="text-lg font-bold text-foreground">{weeklyReview.most_studied_subject}</div>
            </div>

            <div className="p-4 rounded-2xl bg-card border border-border space-y-1">
              <div className="text-muted-foreground">Recommended Next Week Goal</div>
              <div className="text-foreground font-medium">{weeklyReview.next_week_goals?.[0] || 'Keep consistent'}</div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-card border border-border text-xs text-foreground leading-relaxed">
            <span className="font-bold text-indigo-400">AI Synthesis: </span>
            {weeklyReview.ai_insights}
          </div>
        </div>
      )}
    </div>
  );
};
