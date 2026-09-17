import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle2,
  Circle,
  Clock,
  Play,
  SkipForward,
  Lock,
  Unlock,
  RotateCcw,
  Plus,
  Flame,
  Calendar,
  Layers,
  ArrowRight,
  BookOpen,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { Task, AcademicAnalytics } from '../types';

export const Dashboard: React.FC = () => {
  const { onStartFocus } = useOutletContext<{ onStartFocus: (task?: Task) => void }>();
  const navigate = useNavigate();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [analytics, setAnalytics] = useState<AcademicAnalytics | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchMission = async () => {
    try {
      setLoadingTasks(true);
      const data = await api.getTodaysMission();
      if (data.length === 0) {
        // Auto-generate if empty today
        const generated = await api.generateMission(false);
        setTasks(generated);
      } else {
        setTasks(data);
      }
    } catch (err) {
      console.error('Failed to load mission', err);
    } finally {
      setLoadingTasks(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const data = await api.getAnalyticsOverview();
      setAnalytics(data);
    } catch (e) {
      console.warn('Analytics overview note', e);
    }
  };

  useEffect(() => {
    fetchMission();
    fetchAnalytics();

    const handleSync = () => {
      fetchMission();
      fetchAnalytics();
    };

    window.addEventListener('lifeos:subjects-changed', handleSync);
    window.addEventListener('lifeos:data-change', handleSync);
    return () => {
      window.removeEventListener('lifeos:subjects-changed', handleSync);
      window.removeEventListener('lifeos:data-change', handleSync);
    };
  }, []);

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const res = await api.generateMission(true);
      setTasks(res);
    } catch (err) {
      console.error('Error regenerating mission', err);
    } finally {
      setRegenerating(false);
    }
  };

  const toggleTaskStatus = async (task: Task) => {
    const nextStatus = task.status === 'completed' ? 'pending' : 'completed';
    try {
      const updated = await api.updateTask(task.id, { status: nextStatus });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
      fetchAnalytics();
    } catch (err) {
      console.error('Failed to toggle task', err);
    }
  };

  const toggleLock = async (task: Task) => {
    try {
      const updated = await api.updateTask(task.id, { is_locked: !task.is_locked });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    } catch (err) {
      console.error('Failed to lock task', err);
    }
  };

  const handleSkipTask = async (task: Task) => {
    try {
      const updated = await api.updateTask(task.id, { status: 'skipped' });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    } catch (err) {
      console.error('Failed to skip task', err);
    }
  };

  const handleCreateQuickTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    try {
      const created = await api.createTask({
        title: newTaskTitle,
        estimated_duration_minutes: 45,
        priority: 'high',
        status: 'pending',
      });
      setTasks((prev) => [...prev, created]);
      setNewTaskTitle('');
      setShowAddModal(false);
    } catch (err) {
      console.error('Failed to create quick task', err);
    }
  };

  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const completionPct = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Welcome Banner & Date */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
            <span>Academic Command Center</span>
            <span>•</span>
            <span>{todayFormatted}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-1">
            Today's Mission
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Dynamically balanced around your lectures, pending exams, and peak study rhythms.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-secondary-foreground text-xs font-semibold transition-colors border border-border"
          >
            <Plus className="h-4 w-4" />
            <span>Add Task</span>
          </button>
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-sm shadow-primary/25 disabled:opacity-50"
          >
            <RotateCcw className={`h-3.5 w-3.5 ${regenerating ? 'animate-spin' : ''}`} />
            <span>Regenerate Mission</span>
          </button>
        </div>
      </div>

      {/* Progress Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Progress Summary */}
        <div className="rounded-2xl bg-card border border-border p-4 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Mission Progress</span>
            <span className="font-bold text-foreground">{completionPct}%</span>
          </div>
          <div className="text-2xl font-extrabold text-foreground">
            {completedCount} / {tasks.length} <span className="text-xs font-normal text-muted-foreground">tasks</span>
          </div>
          <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500 rounded-full"
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>

        {/* Focus Hours Today */}
        <div className="rounded-2xl bg-card border border-border p-4 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Focus Deep Work</span>
            <Clock className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-extrabold text-foreground">
            {analytics?.weekly_study_hours || 0} <span className="text-xs font-normal text-muted-foreground">hrs this week</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Optimal daily target: 4.0 hours
          </p>
        </div>

        {/* Spaced Repetition Due */}
        <div className="rounded-2xl bg-card border border-border p-4 space-y-2 shadow-sm">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Spaced Repetition</span>
            <Layers className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-extrabold text-foreground">
            {analytics?.flashcards_reviewed_total || 0} <span className="text-xs font-normal text-muted-foreground">reviewed</span>
          </div>
          <button
            onClick={() => navigate('/flashcards')}
            className="flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
          >
            <span>Revise Due Cards</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {/* Active Streak */}
        <div className="rounded-2xl bg-card border border-border p-4 space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
            <span>Learning Consistency</span>
            <Flame className="h-4 w-4 text-amber-500 fill-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-foreground">
            {analytics?.study_streak_days || 1} <span className="text-xs font-normal text-muted-foreground">days streak</span>
          </div>
          <p className="text-[11px] text-emerald-500 font-medium">
            Streak active! Log a session today to retain.
          </p>
        </div>
      </div>

      {/* Today's Tasks Timeline */}
      <div className="rounded-3xl bg-card border border-border p-5 md:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">
            Study Schedule Timeline
          </h2>
          <span className="text-xs text-muted-foreground">
            Lock tasks to preserve their scheduled slots during rebalancing
          </span>
        </div>

        {loadingTasks ? (
          <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
            <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p>Loading Today's Mission...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
              <BookOpen className="h-6 w-6" />
            </div>
            <p className="text-sm font-medium text-foreground">No tasks scheduled for today yet.</p>
            <button
              onClick={handleRegenerate}
              className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold"
            >
              Generate Mission from Syllabus
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => {
              const isCompleted = task.status === 'completed';
              const isSkipped = task.status === 'skipped';

              return (
                <div
                  key={task.id}
                  className={`group relative flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border transition-all ${
                    isCompleted
                      ? 'bg-secondary/20 border-border/50 opacity-70'
                      : isSkipped
                      ? 'bg-secondary/10 border-dashed border-border/40 opacity-50'
                      : 'bg-card hover:bg-secondary/30 border-border shadow-sm'
                  }`}
                >
                  {/* Left Column: Status, Subject & Details */}
                  <div className="flex items-start gap-3.5 flex-1 min-w-0">
                    <button
                      onClick={() => toggleTaskStatus(task)}
                      className="mt-1 text-muted-foreground hover:text-primary transition-colors shrink-0"
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <Circle className="h-5 w-5" />
                      )}
                    </button>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {task.subject_name && (
                          <span
                            className="px-2 py-0.5 rounded-md text-[10px] font-semibold text-white"
                            style={{ backgroundColor: task.subject_color || '#3B82F6' }}
                          >
                            {task.subject_name}
                          </span>
                        )}
                        <span className={`text-sm font-bold truncate ${isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {task.title}
                        </span>
                        {task.priority === 'urgent' && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 text-[10px] font-semibold">
                            Urgent
                          </span>
                        )}
                      </div>

                      {task.learning_objective && (
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          Target: {task.learning_objective}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground pt-0.5">
                        {task.start_time && task.end_time ? (
                          <span className="flex items-center gap-1 font-mono font-medium text-foreground">
                            <Clock className="h-3 w-3 text-indigo-400" />
                            {task.start_time} – {task.end_time}
                          </span>
                        ) : (
                          <span>{task.estimated_duration_minutes} mins</span>
                        )}
                        <span>•</span>
                        <span className="capitalize">{task.difficulty}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex items-center gap-2 mt-3 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40 shrink-0">
                    {!isCompleted && !isSkipped && (
                      <button
                        onClick={() => onStartFocus(task)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold transition-colors"
                        title="Start Focus Session"
                      >
                        <Play className="h-3.5 w-3.5 fill-primary" />
                        <span>Focus</span>
                      </button>
                    )}

                    <button
                      onClick={() => toggleLock(task)}
                      className={`p-2 rounded-xl transition-colors ${
                        task.is_locked
                          ? 'text-amber-400 bg-amber-500/10'
                          : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                      }`}
                      title={task.is_locked ? 'Task locked (won’t reschedule)' : 'Lock task to current slot'}
                    >
                      {task.is_locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                    </button>

                    {!isCompleted && !isSkipped && (
                      <button
                        onClick={() => handleSkipTask(task)}
                        className="p-2 rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                        title="Skip task (adapts remaining schedule)"
                      >
                        <SkipForward className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-foreground">Add Custom Task</h3>
            <form onSubmit={handleCreateQuickTask} className="space-y-3">
              <input
                type="text"
                required
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="e.g. DBMS Normalization Practice Problems"
                className="w-full px-3.5 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground focus:outline-none focus:border-primary"
              />
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold"
                >
                  Add to Mission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
