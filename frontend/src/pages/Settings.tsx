import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, User, GraduationCap, Clock, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
import { api } from '../services/api';
import { getActiveSession, updateActiveUserProfile } from '../services/staticStorage';
import { AcademicProfile } from '../types';

export const Settings: React.FC = () => {
  const session = getActiveSession();

  // Student Identity Fields
  const [fullName, setFullName] = useState(session?.user?.full_name || 'Student');
  const [email, setEmail] = useState(session?.user?.email || 'student@lifeos.academic');
  const [university, setUniversity] = useState(session?.user?.university || 'University of Science & Tech');
  const [course, setCourse] = useState(session?.user?.course || 'Computer Science');
  const [semester, setSemester] = useState(session?.user?.semester || 4);
  const [goals, setGoals] = useState('Maintain 3.88 GPA & master AI architectures');

  // Study Rhythm Fields
  const [dailyHours, setDailyHours] = useState(4.0);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('22:00');
  const [breakMins, setBreakMins] = useState(15);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const userProf = await api.getProfile();
        if (userProf?.full_name) setFullName(userProf.full_name);

        const data = await api.getAcademicProfile();
        if (data.college_university) setUniversity(data.college_university);
        if (data.course) setCourse(data.course);
        if (data.semester) setSemester(data.semester);
        if (data.goals?.[0]) setGoals(data.goals[0]);
        if (data.daily_available_hours) setDailyHours(data.daily_available_hours);
        if (data.preferred_study_hours_start) setStartTime(data.preferred_study_hours_start.slice(0, 5));
        if (data.preferred_study_hours_end) setEndTime(data.preferred_study_hours_end.slice(0, 5));
        if (data.break_duration_minutes) setBreakMins(data.break_duration_minutes);
      } catch (e) {
        console.warn('Profile load notice', e);
      }
    };
    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSavedSuccess(false);
    try {
      // 1. Update identity profile
      await api.updateProfile({ full_name: fullName });

      // 2. Update academic profile
      await api.updateAcademicProfile({
        college_university: university,
        course,
        semester: Number(semester),
        goals: [goals],
        daily_available_hours: Number(dailyHours),
        preferred_study_hours_start: `${startTime}:00`,
        preferred_study_hours_end: `${endTime}:00`,
        break_duration_minutes: Number(breakMins),
      });

      // 3. Update session & registry
      updateActiveUserProfile({
        full_name: fullName,
        email,
        university,
        course,
        semester: Number(semester),
        daily_hours: Number(dailyHours),
        goals,
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (e) {
      console.error('Save error', e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-indigo-500 uppercase tracking-wider">
          <SettingsIcon className="h-4 w-4" />
          <span>System & Student Profile</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mt-1">
          Student Lifeline Account & Academic Settings
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Configure your student identity, daily available study windows, and academic goals.
        </p>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Student Identity Card */}
        <div className="rounded-3xl bg-card border border-border p-6 md:p-8 space-y-5 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                <User className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">Student Identity & Credentials</h2>
                <p className="text-xs text-muted-foreground">Personal details displayed on your dashboard & sidebar</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold flex items-center gap-1">
              <Zap className="h-3 w-3" /> Live Sync
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary"
                placeholder="e.g. John Doe"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary"
                placeholder="john123@gmail.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                College / University
              </label>
              <input
                type="text"
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary"
                placeholder="e.g. Stanford University / State Tech"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Degree / Major
                </label>
                <input
                  type="text"
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary"
                  placeholder="e.g. B.Tech CS"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Semester
                </label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Academic Goal / Target
            </label>
            <input
              type="text"
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary"
              placeholder="e.g. Maintain 3.88 GPA & master AI architectures"
            />
          </div>
        </div>

        {/* Study Availability & Rhythm */}
        <div className="rounded-3xl bg-card border border-border p-6 md:p-8 space-y-5 shadow-sm">
          <div className="flex items-center gap-2.5 pb-3 border-b border-border">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Study Availability & Rhythm</h2>
              <p className="text-xs text-muted-foreground">Used by Today's Mission generator to balance schedule</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Earliest Study Time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Latest Study Time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Target Daily Hours
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                max="14"
                value={dailyHours}
                onChange={(e) => setDailyHours(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="max-w-xs">
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Break Duration Between Tasks
            </label>
            <select
              value={breakMins}
              onChange={(e) => setBreakMins(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-secondary border border-border text-sm text-foreground focus:outline-none focus:border-primary"
            >
              <option value={10}>10 minutes</option>
              <option value={15}>15 minutes (Standard)</option>
              <option value={20}>20 minutes</option>
              <option value={30}>30 minutes</option>
            </select>
          </div>

          <div className="flex items-center gap-3 pt-3">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-md shadow-indigo-500/25 disabled:opacity-50 cursor-pointer"
            >
              <Save className="h-4 w-4" />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
            {savedSuccess && (
              <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 animate-in fade-in">
                <CheckCircle2 className="h-4 w-4" /> Settings saved successfully!
              </span>
            )}
          </div>
        </div>

        {/* Pure Static Operating Mode Card */}
        <div className="rounded-3xl bg-card border border-border p-6 md:p-8 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">Static Progressive Engine</h2>
                <p className="text-xs text-muted-foreground">Self-contained browser workspace with instant zero-latency reactivity</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
              100% Client-Side Active
            </span>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Student Lifeline is operating in fully isolated static storage mode. All your subjects, timetable, flashcards, study sessions, quizzes, and code analyses are persisted directly into your local browser storage.
          </p>
        </div>
      </form>
    </div>
  );
};
