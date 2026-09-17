import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, CheckCircle, X, Maximize2, Minimize2, BookOpen, Volume2, VolumeX } from 'lucide-react';
import { api } from '../services/api';
import { Task } from '../types';

interface FocusModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTask?: Task | null;
  onSessionComplete?: () => void;
}

export const FocusModeModal: React.FC<FocusModeModalProps> = ({
  isOpen,
  onClose,
  activeTask,
  onSessionComplete,
}) => {
  const DEFAULT_STUDY_SECS = 25 * 60;
  const [secondsRemaining, setSecondsRemaining] = useState(DEFAULT_STUDY_SECS);
  const [isActive, setIsActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [notes, setNotes] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [completedObjective, setCompletedObjective] = useState(true);
  const [ambientSound, setAmbientSound] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isActive && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining((sec) => sec - 1);
      }, 1000);
    } else if (secondsRemaining === 0 && isActive) {
      setIsActive(false);
      // Play ding notification
    }
    return () => clearInterval(interval);
  }, [isActive, secondsRemaining]);

  const toggleTimer = async () => {
    if (!isActive && !sessionId) {
      // Start session on backend
      try {
        const sess = await api.startStudySession(activeTask?.id, activeTask?.subject_id, notes);
        setSessionId(sess.id);
      } catch (e) {
        console.error('Failed to log study session start', e);
      }
    }
    setIsActive(!isActive);
  };

  const resetTimer = (mins = 25) => {
    setIsActive(false);
    setSecondsRemaining(mins * 60);
  };

  const handleFinish = async () => {
    const elapsedMinutes = Math.max(1, Math.round((DEFAULT_STUDY_SECS - secondsRemaining) / 60));
    if (sessionId) {
      try {
        await api.endStudySession(sessionId, elapsedMinutes, notes, completedObjective);
      } catch (e) {
        console.error('Failed to log session end', e);
      }
    }
    if (onSessionComplete) onSessionComplete();
    setIsActive(false);
    setSessionId(null);
    onClose();
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-2xl p-4 sm:p-6 text-slate-100 animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl bg-card/40 border border-white/10 p-8 shadow-2xl backdrop-blur-3xl flex flex-col items-center text-center space-y-6">
        {/* Top Controls */}
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Distraction-Free Focus
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAmbientSound(!ambientSound)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
              title={ambientSound ? 'Mute ambient sound' : 'Enable ambient focus audio'}
            >
              {ambientSound ? <Volume2 className="h-4 w-4 text-indigo-400" /> : <VolumeX className="h-4 w-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Current Objective */}
        <div className="space-y-2 max-w-lg">
          <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
            {activeTask?.subject_name || 'Academic Deep Work'}
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            {activeTask?.title || 'Focused Study Session'}
          </h2>
          {activeTask?.learning_objective && (
            <p className="text-sm text-slate-400 flex items-center justify-center gap-1.5">
              <BookOpen className="h-4 w-4 shrink-0 text-slate-500" />
              <span>{activeTask.learning_objective}</span>
            </p>
          )}
        </div>

        {/* Large Timer Display */}
        <div className="relative py-4">
          <div className="text-7xl sm:text-8xl font-mono font-extrabold tracking-tight bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent select-none drop-shadow-sm">
            {formatTime(secondsRemaining)}
          </div>
        </div>

        {/* Interval presets */}
        <div className="flex gap-2 text-xs font-medium text-slate-400">
          {[15, 25, 45, 60].map((m) => (
            <button
              key={m}
              onClick={() => resetTimer(m)}
              className="px-3 py-1 rounded-lg bg-white/5 hover:bg-white/10 hover:text-white transition-colors"
            >
              {m}m
            </button>
          ))}
        </div>

        {/* Timer Action Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleTimer}
            className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-600/30 active:scale-95"
          >
            {isActive ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 fill-white" />}
            <span>{isActive ? 'Pause' : 'Start Focus'}</span>
          </button>
          <button
            onClick={() => resetTimer(25)}
            className="p-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
            title="Reset timer"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
        </div>

        {/* Session Quick Notes */}
        <div className="w-full text-left space-y-2 pt-2 border-t border-white/10">
          <label className="text-xs font-medium text-slate-400">Session Notes / Insights</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Write key takeaway, page reached, or breakthrough idea..."
            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        {/* Finish / Log Completion */}
        <div className="w-full flex items-center justify-between pt-2">
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={completedObjective}
              onChange={(e) => setCompletedObjective(e.target.checked)}
              className="rounded border-white/20 text-indigo-600 focus:ring-indigo-500 bg-white/10"
            />
            <span>Mark task learning objective as completed</span>
          </label>

          <button
            onClick={handleFinish}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-md shadow-emerald-600/25"
          >
            <CheckCircle className="h-4 w-4" />
            <span>Finish Session</span>
          </button>
        </div>
      </div>
    </div>
  );
};
