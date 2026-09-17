import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Clock, MapPin, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { TimetableEvent, Subject } from '../types';

export const Timetable: React.FC = () => {
  const [events, setEvents] = useState<TimetableEvent[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState(1); // 1 = Monday
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');
  const [location, setLocation] = useState('');

  const fetchTimetable = async () => {
    try {
      setLoading(true);
      const [eData, sData] = await Promise.all([
        api.listTimetable(),
        api.listSubjects(),
      ]);
      setEvents(eData);
      setSubjects(sData);
      if (sData.length > 0 && !subjectId) setSubjectId(sData[0].id);
    } catch (e) {
      console.warn('Timetable fetch notice', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimetable();
  }, []);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startTime || !endTime) return;

    try {
      const created = await api.createTimetableEvent({
        title,
        subject_id: subjectId || undefined,
        day_of_week: Number(dayOfWeek),
        start_time: startTime,
        end_time: endTime,
        location: location || undefined,
      });
      setEvents((prev) => [...prev, created]);
      setShowAddModal(false);
      setTitle('');
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

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-500 uppercase tracking-wider">
            <Calendar className="h-4 w-4" />
            <span>Academic Schedule & Fixed Commitments</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-1">
            College Timetable & Lectures
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Fixed classes are automatically protected so daily study missions never overlap with lectures.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-md shadow-indigo-500/25"
        >
          <Plus className="h-4 w-4" />
          <span>Add Lecture / Lab</span>
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-xs text-muted-foreground">Loading college timetable...</div>
      ) : (
        /* Weekly Grid (Monday through Friday/Saturday) */
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
                        className="p-3 rounded-2xl bg-secondary/40 border border-border/80 space-y-1.5 relative group"
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
                          <Clock className="h-3 w-3 text-indigo-400" />
                          <span>{ev.start_time} - {ev.end_time}</span>
                        </div>

                        {ev.location && (
                          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span>{ev.location}</span>
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

      {/* Add Class Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-card border border-border p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-foreground">Add Timetable Lecture / Lab</h3>
            <form onSubmit={handleCreateEvent} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Lecture Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. DBMS Lecture Unit 2"
                  className="w-full px-3.5 py-2 rounded-xl bg-secondary/50 border border-border text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Day of Week</label>
                  <select
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border text-xs text-foreground focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                      <option key={d} value={d}>{dayNames[d]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Subject</label>
                  <select
                    value={subjectId}
                    onChange={(e) => setSubjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border text-xs text-foreground focus:outline-none"
                  >
                    {subjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
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
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border text-xs text-foreground focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">End Time</label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border text-xs text-foreground focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Location / Classroom</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Block B, Room 302"
                  className="w-full px-3.5 py-2 rounded-xl bg-secondary/50 border border-border text-xs text-foreground focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
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
