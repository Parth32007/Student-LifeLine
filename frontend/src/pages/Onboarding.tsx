import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, BookOpen, Upload, Calendar, Clock, CheckCircle, ArrowRight, SkipForward } from 'lucide-react';
import { api } from '../services/api';

export const Onboarding: React.FC = () => {
  const [step, setStep] = useState(1);
  const [subjectsText, setSubjectsText] = useState('Database Management Systems, Data Structures & Algorithms, Operating Systems, Computer Networks');
  const [examSubject, setExamSubject] = useState('Database Management Systems');
  const [examDate, setExamDate] = useState('2026-10-15');
  const [studyStartTime, setStudyStartTime] = useState('09:00');
  const [studyEndTime, setStudyEndTime] = useState('22:00');
  const [breakDuration, setBreakDuration] = useState(15);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleFinish = async () => {
    setLoading(true);
    try {
      const subjectNames = subjectsText.split(',').map((s) => s.trim()).filter(Boolean);
      const subjectsPayload = subjectNames.map((name, i) => ({
        name,
        color: ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899'][i % 5],
        target_grade: 'A',
      }));

      await api.submitOnboarding({
        preferred_study_hours_start: `${studyStartTime}:00`,
        preferred_study_hours_end: `${studyEndTime}:00`,
        break_duration_minutes: breakDuration,
        subjects: subjectsPayload,
      });

      // Generate initial Today's Mission
      await api.generateMission(true);
    } catch (err) {
      console.warn('Onboarding save notice:', err);
    } finally {
      setLoading(false);
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-xl space-y-8 rounded-3xl bg-card border border-border p-8 shadow-2xl">
        {/* Step Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground">
            <span>Step {step} of 4</span>
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground font-medium"
            >
              <span>Skip for now</span>
              <SkipForward className="h-3 w-3" />
            </button>
          </div>
          <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: Subjects Setup */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-500">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Current Semester Subjects</h2>
                <p className="text-xs text-muted-foreground">Enter the courses you are studying this semester</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Subjects (comma separated)
              </label>
              <textarea
                rows={3}
                value={subjectsText}
                onChange={(e) => setSubjectsText(e.target.value)}
                className="w-full p-3 rounded-xl bg-secondary/50 border border-border text-sm text-foreground focus:outline-none focus:border-primary"
                placeholder="Database Management Systems, Data Structures & Algorithms..."
              />
              <p className="text-[11px] text-muted-foreground mt-1">
                Student Lifeline will create subject hubs, flashcard decks, and syllabus trackers for each.
              </p>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold shadow-md shadow-indigo-500/25"
            >
              <span>Continue to Exam Dates</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Step 2: Upcoming Exams */}
        {step === 2 && (
          <div className="space-y-5 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-500">
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Next Upcoming Exam</h2>
                <p className="text-xs text-muted-foreground">Power the AI Academic Planner countdown engine</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Exam Course</label>
                <input
                  type="text"
                  value={examSubject}
                  onChange={(e) => setExamSubject(e.target.value)}
                  className="w-full p-3 rounded-xl bg-secondary/50 border border-border text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Exam Date</label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full p-3 rounded-xl bg-secondary/50 border border-border text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep(1)}
                className="py-3 px-4 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-sm font-semibold"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold shadow-md shadow-indigo-500/25"
              >
                <span>Continue to Study Hours</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Study Hours Availability */}
        {step === 3 && (
          <div className="space-y-5 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-500">
                <Clock className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Study Availability & Rhythm</h2>
                <p className="text-xs text-muted-foreground">Student Lifeline schedules daily missions within these hours</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Earliest Study Time</label>
                <input
                  type="time"
                  value={studyStartTime}
                  onChange={(e) => setStudyStartTime(e.target.value)}
                  className="w-full p-3 rounded-xl bg-secondary/50 border border-border text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">Latest Study Time</label>
                <input
                  type="time"
                  value={studyEndTime}
                  onChange={(e) => setStudyEndTime(e.target.value)}
                  className="w-full p-3 rounded-xl bg-secondary/50 border border-border text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Break Interval (Minutes between tasks)
              </label>
              <select
                value={breakDuration}
                onChange={(e) => setBreakDuration(Number(e.target.value))}
                className="w-full p-3 rounded-xl bg-secondary/50 border border-border text-sm text-foreground focus:outline-none focus:border-primary"
              >
                <option value={10}>10 minutes</option>
                <option value={15}>15 minutes (Recommended)</option>
                <option value={20}>20 minutes</option>
                <option value={30}>30 minutes</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep(2)}
                className="py-3 px-4 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-sm font-semibold"
              >
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold shadow-md shadow-indigo-500/25"
              >
                <span>Final Step</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Ready & Generate Mission */}
        {step === 4 && (
          <div className="space-y-6 text-center animate-in fade-in">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
              <CheckCircle className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">You're All Set!</h2>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Student Lifeline is assembling your academic digital twin, timetable constraints, and generating Today's Mission.
              </p>
            </div>

            <button
              onClick={handleFinish}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold shadow-lg shadow-indigo-500/30 disabled:opacity-50"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Launch Student Lifeline Dashboard</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
