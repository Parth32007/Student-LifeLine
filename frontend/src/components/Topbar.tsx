import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Sparkles,
  Flame,
  Timer,
  Sun,
  Moon,
  LogOut,
  User,
  X,
  ArrowRight,
  Clock,
  Bell,
  Check,
  Menu
} from 'lucide-react';
import { api } from '../services/api';
import { WhatToStudyNow } from '../types';

interface TopbarProps {
  onOpenCommandPalette: () => void;
  onOpenFocusMode: () => void;
  streakDays?: number;
  userEmail?: string;
  onLogout: () => void;
  onOpenMobileMenu?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  onOpenCommandPalette,
  onOpenFocusMode,
  streakDays = 3,
  userEmail = 'student@lifeos.local',
  onLogout,
  onOpenMobileMenu,
}) => {
  const [isDark, setIsDark] = useState(() =>
    typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false
  );
  const [showRecModal, setShowRecModal] = useState(false);
  const [recommendation, setRecommendation] = useState<WhatToStudyNow | null>(null);
  const [loadingRec, setLoadingRec] = useState(false);

  // Notification Bell State
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    { id: '1', title: 'DBMS Exam Countdown', text: 'Target exam in 7 days. Day 1 curriculum active.', unread: true, time: '2h ago' },
    { id: '2', title: 'Flashcards Due', text: '12 cards ready for active recall in DBMS.', unread: true, time: '4h ago' },
    { id: '3', title: 'Lab Assignment Deadline', text: 'Deadlock Detection Lab due in 48 hours.', unread: true, time: '1d ago' },
  ]);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  React.useEffect(() => {
    const handleThemeChange = (e: any) => {
      setIsDark(e.detail?.isDark ?? document.documentElement.classList.contains('dark'));
    };
    window.addEventListener('lifeos:theme-change', handleThemeChange);
    return () => window.removeEventListener('lifeos:theme-change', handleThemeChange);
  }, []);

  const toggleTheme = () => {
    const nextDark = !document.documentElement.classList.contains('dark');
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('lifeos_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('lifeos_theme', 'light');
    }
    window.dispatchEvent(new CustomEvent('lifeos:theme-change', { detail: { isDark: nextDark } }));
  };

  const handleWhatShouldIStudy = async () => {
    setLoadingRec(true);
    setShowRecModal(true);
    try {
      const rec = await api.whatToStudyNow();
      setRecommendation(rec);
    } catch (err) {
      setRecommendation({
        title: 'Complete Pending Mission Tasks',
        subject_name: 'Core Syllabus',
        recommended_duration_minutes: 45,
        reason: 'Review your scheduled tasks for today and tackle the highest priority topic.',
        action_type: 'start_task',
      });
    } finally {
      setLoadingRec(false);
    }
  };

  return (
    <>
      <header className="h-16 border-b border-border bg-card/40 backdrop-blur-xl px-3 sm:px-4 md:px-6 flex items-center justify-between z-20 gap-2">
        {/* Mobile Hamburger Toggle & Search / Omnibar trigger */}
        <div className="flex items-center gap-2 flex-1 max-w-md min-w-0">
          <button
            onClick={onOpenMobileMenu}
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl bg-secondary text-foreground hover:bg-secondary/80 shrink-0 border border-border"
            title="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <button
            onClick={onOpenCommandPalette}
            className="w-full flex items-center justify-between px-2.5 sm:px-3.5 py-2 rounded-xl bg-secondary/60 hover:bg-secondary border border-border/80 text-xs sm:text-sm text-muted-foreground transition-all group min-w-0"
          >
            <div className="flex items-center gap-2 min-w-0 truncate">
              <Search className="h-4 w-4 text-muted-foreground group-hover:text-foreground shrink-0" />
              <span className="truncate">Search notes, tasks or ask AI...</span>
            </div>
            <kbd className="hidden sm:inline-flex items-center gap-1 rounded bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground border border-border shrink-0">
              <span>⌘</span>K
            </kbd>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3.5">
          {/* Standout Feature B: What should I study now? */}
          <button
            onClick={handleWhatShouldIStudy}
            className="relative group flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 border border-border text-xs font-semibold text-foreground transition-all shadow-sm dark:bg-gradient-to-r dark:from-indigo-500/15 dark:via-purple-500/15 dark:to-pink-500/15 dark:border-indigo-500/30"
          >
            <Sparkles className="h-3.5 w-3.5 text-primary dark:text-indigo-400 group-hover:rotate-12 transition-transform" />
            <span className="hidden sm:inline">What should I study now?</span>
            <span className="sm:hidden">Study Next</span>
          </button>

          {/* Focus Mode Launcher */}
          <button
            onClick={onOpenFocusMode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary hover:bg-secondary/80 text-xs font-medium text-foreground transition-colors"
            title="Launch Focus Mode (Pomodoro)"
          >
            <Timer className="h-4 w-4 text-emerald-500" />
            <span className="hidden md:inline">Focus Mode</span>
          </button>

          {/* Streak Badge */}
          <div
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs font-bold text-amber-500"
            title={`${streakDays}-day active learning streak`}
          >
            <Flame className="h-3.5 w-3.5 fill-amber-500 text-amber-500 animate-pulse" />
            <span>{streakDays}d</span>
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="h-8 w-8 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            title="Toggle theme"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Notification Bell */}
          <div ref={notificationRef} className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="h-8 w-8 flex items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors relative"
              title="Academic notifications"
            >
              <Bell className="h-4 w-4" />
              {notifications.some((n) => n.unread) && (
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary animate-pulse" />
              )}
            </button>

            {/* Notification Popover Dropdown */}
            {notificationsOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 rounded-2xl bg-card border border-border shadow-2xl p-3.5 backdrop-blur-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150 space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-border/70">
                  <div className="flex items-center gap-1.5">
                    <Bell className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-bold text-foreground">Notifications</span>
                  </div>
                  {notifications.some((n) => n.unread) && (
                    <button
                      onClick={() =>
                        setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
                      }
                      className="text-[10px] text-primary hover:underline font-semibold"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() =>
                        setNotifications((prev) =>
                          prev.map((item) => (item.id === n.id ? { ...item, unread: false } : item))
                        )
                      }
                      className={`p-2.5 rounded-xl border text-xs space-y-1 cursor-pointer transition-colors ${
                        n.unread
                          ? 'bg-secondary/60 border-border/80'
                          : 'bg-transparent border-transparent opacity-70 hover:bg-secondary/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-foreground">{n.title}</span>
                        <span className="text-[10px] text-muted-foreground">{n.time}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-snug">{n.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-2 pl-1 border-l border-border/60">
            <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={onLogout}
              className="h-8 w-8 flex items-center justify-center rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Persistent "What Should I Study Now?" Popover Modal */}
      {showRecModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl bg-card border border-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2 text-indigo-500 font-bold text-sm">
                <Sparkles className="h-4 w-4" />
                <span>AI Next Action Recommendation</span>
              </div>
              <button
                onClick={() => setShowRecModal(false)}
                className="text-muted-foreground hover:text-foreground rounded-lg p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {loadingRec ? (
              <div className="py-8 text-center space-y-2">
                <div className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-muted-foreground">Evaluating timetable, weak topics, and study velocity...</p>
              </div>
            ) : recommendation ? (
              <div className="space-y-4">
                <div>
                  <div className="inline-block px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-500 text-[11px] font-semibold mb-1.5">
                    {recommendation.subject_name || 'Academic Priority'}
                  </div>
                  <h3 className="text-lg font-bold text-foreground tracking-tight">
                    {recommendation.title}
                  </h3>
                  {recommendation.topic && (
                    <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                      Topic: {recommendation.topic}
                    </p>
                  )}
                </div>

                <div className="rounded-xl bg-secondary/50 p-3 text-xs space-y-1.5 border border-border/50">
                  <div className="font-semibold text-foreground">Why this now?</div>
                  <p className="text-muted-foreground leading-relaxed">
                    {recommendation.reason}
                  </p>
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1 font-medium">
                    <Clock className="h-3.5 w-3.5" />
                    Recommended: {recommendation.recommended_duration_minutes} minutes
                  </span>
                  <span className="capitalize font-semibold text-foreground">
                    Type: {recommendation.action_type.replace('_', ' ')}
                  </span>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    onClick={() => {
                      setShowRecModal(false);
                      onOpenFocusMode();
                    }}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-md shadow-indigo-500/25"
                  >
                    <span>Start in Focus Mode</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setShowRecModal(false)}
                    className="py-2.5 px-4 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold"
                  >
                    Later
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </>
  );
};
