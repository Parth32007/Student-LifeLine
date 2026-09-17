import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CalendarDays,
  Plus,
  Clock,
  MapPin,
  Trash2,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Layers,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { TimetableEvent, Subject, StudyPlan } from '../types';

export const CalendarExams: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'calendar' | 'planner'>('calendar');

  // Timetable State
  const [events, setEvents] = useState<TimetableEvent[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loadingTimetable, setLoadingTimetable] = useState(true);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventSubjectId, setEventSubjectId] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');
  const [location, setLocation] = useState('');

  // Study Planner State
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [activePlan, setActivePlan] = useState<StudyPlan | null>(null);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [examDate, setExamDate] = useState('');
  const [dailyHours, setDailyHours] = useState(3.0);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [loadingPlanner, setLoadingPlanner] = useState(true);

  // Fetch data
  const fetchData = async () => {
    try {
      setLoadingTimetable(true);
      setLoadingPlanner(true);
      const [eData, sData, pData] = await Promise.all([
        api.listTimetable(),
        api.listSubjects(),
        api.listStudyPlans(),
      ]);
      setEvents(eData);
      setSubjects(sData);
      setPlans(pData);
      if (sData.length > 0) {
        if (!eventSubjectId) setEventSubjectId(sData[0].id);
        if (!selectedSubjectId) setSelectedSubjectId(sData[0].id);
      }
      if (pData.length > 0) {
        setActivePlan(pData[0]);
      }
    } catch (e) {
      console.warn('CalendarExams fetch notice', e);
    } finally {
      setLoadingTimetable(false);
      setLoadingPlanner(false);
    }
  };

  useEffect(() => {
    fetchData();
    const future = new Date();
    future.setDate(future.getDate() + 7);
    setExamDate(future.toISOString().split('T')[0]);
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim() || !startTime || !endTime) return;

    try {
      const created = await api.createTimetableEvent({
        title: eventTitle,
        subject_id: eventSubjectId || undefined,
        day_of_week: Number(dayOfWeek),
        start_time: startTime,
        end_time: endTime,
        location: location || undefined,
      });
      setEvents((prev) => [...prev, created]);
      setShowAddEventModal(false);
      setEventTitle('');
      setLocation('');
    } catch (err) {
      console.error('Failed to create timetable event', err);
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      await api.deleteTimetableEvent(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      console.error('Failed to delete event', err);
    }
  };

  const handleGeneratePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId || !examDate || generatingPlan) return;

    setGeneratingPlan(true);
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
      setGeneratingPlan(false);
    }
  };

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header & Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wider">
            <Calendar className="h-4 w-4" />
            <span>Planning & Focus Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-1">
            Calendar & Exam Planner
          </h1>
        </div>

        {/* Tab Controls & Primary Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-secondary rounded-2xl p-1 border border-border">
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'calendar'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Calendar className="h-3.5 w-3.5" />
              <span>College Schedule ({events.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('planner')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'planner'
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <CalendarDays className="h-3.5 w-3.5" />
              <span>Exam Countdown ({plans.length})</span>
            </button>
          </div>

          {activeTab === 'calendar' && (
            <button
              onClick={() => setShowAddEventModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Add Class / Lab</span>
            </button>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB 1: College Timetable & Schedule                           */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'calendar' && (
        <div className="space-y-4">
          {loadingTimetable ? (
            <div className="py-12 text-center text-xs text-muted-foreground">Loading college timetable...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {[1, 2, 3, 4, 5].map((dayIdx) => {
                const dayEvents = events.filter((e) => e.day_of_week === dayIdx);
                return (
                  <div key={dayIdx} className="rounded-3xl bg-card border border-border p-4 space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-border/60">
                      <span className="text-sm font-bold text-foreground">{dayNames[dayIdx]}</span>
                      <span className="text-xs font-semibold text-muted-foreground">
                        {dayEvents.length} class(es)
                      </span>
                    </div>

                    <div className="space-y-2.5 min-h-[220px]">
                      {dayEvents.length === 0 ? (
                        <div className="py-12 text-center text-[11px] text-muted-foreground">
                          No classes scheduled. Available for self-study.
                        </div>
                      ) : (
                        dayEvents.map((ev) => (
                          <div
                            key={ev.id}
                            className="p-3 rounded-2xl bg-secondary/40 border border-border space-y-1.5 relative group hover:border-primary/40 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-1">
                              <span className="text-xs font-bold text-foreground truncate">{ev.title}</span>
                              <button
                                onClick={() => handleDeleteEvent(ev.id)}
                                className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-destructive transition-opacity"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>

                            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground font-mono">
                              <Clock className="h-3 w-3 text-primary" />
                              <span>{ev.start_time} - {ev.end_time}</span>
                            </div>

                            {ev.location && (
                              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                <span className="truncate">{ev.location}</span>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB 2: Exam Countdown Planner                                 */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'planner' && (
        <div className="space-y-6">
          {/* Plan Generator Form Card */}
          <div className="rounded-3xl bg-card border border-border p-6 shadow-sm">
            <form onSubmit={handleGeneratePlan} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Target Course</label>
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
                <label className="block text-xs font-semibold text-foreground mb-1.5">Exam Date</label>
                <input
                  type="date"
                  required
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Daily Hours Committed</label>
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
                disabled={generatingPlan}
                className="flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold transition-all shadow-sm disabled:opacity-50"
              >
                {generatingPlan ? (
                  <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    <span>Generate Countdown Plan</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Active Plan Roadmap */}
          {loadingPlanner ? (
            <div className="py-12 text-center text-xs text-muted-foreground">Loading study plans...</div>
          ) : activePlan ? (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-5 rounded-3xl bg-secondary/40 border border-border gap-3">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs font-bold border border-border">
                    {activePlan.total_days}-Day Strategic Plan
                  </span>
                  <h2 className="text-xl font-bold text-foreground mt-1">{activePlan.title}</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">Target Exam Date: {activePlan.exam_date}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activePlan.items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl bg-card border border-border p-5 space-y-3.5 hover:border-primary/50 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="px-2.5 py-0.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold">
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

                      {item.practice_questions && item.practice_questions.length > 0 && (
                        <div className="mt-3 rounded-xl bg-secondary/40 p-2.5 border border-border/50 text-xs space-y-1">
                          <div className="font-semibold text-foreground flex items-center gap-1 text-[11px]">
                            <HelpCircle className="h-3.5 w-3.5 text-primary" />
                            <span>Practice Challenge</span>
                          </div>
                          <p className="text-muted-foreground text-[11px]">{item.practice_questions[0]}</p>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-border/40 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
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
                Select a course and upcoming exam date above to generate an intelligent day-by-day countdown plan.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Add Class / Timetable Event Modal */}
      {showAddEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-card border border-border p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-foreground">Add Class / Lab</h3>
            <form onSubmit={handleCreateEvent} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Class Title *</label>
                <input
                  type="text"
                  required
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="e.g. Distributed Systems Lecture"
                  className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Subject</label>
                  <select
                    value={eventSubjectId}
                    onChange={(e) => setEventSubjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-xs text-foreground focus:outline-none"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Day of Week</label>
                  <select
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-xs text-foreground focus:outline-none"
                  >
                    <option value={1}>Monday</option>
                    <option value={2}>Tuesday</option>
                    <option value={3}>Wednesday</option>
                    <option value={4}>Thursday</option>
                    <option value={5}>Friday</option>
                    <option value={6}>Saturday</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Start Time</label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-xs text-foreground focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-xs text-foreground focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Location / Classroom</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Hall 4B or Zoom Link"
                  className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-sm text-foreground focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddEventModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-secondary text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-sm"
                >
                  Save Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const Timetable = CalendarExams;
export const Planner = CalendarExams;
export default CalendarExams;
