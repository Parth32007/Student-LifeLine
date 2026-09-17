import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Sparkles,
  Brain,
  Calendar,
  Layers,
  BookOpen,
  CheckSquare,
  HelpCircle,
  BarChart3,
  ArrowRight,
  Zap,
  CheckCircle2,
  Clock,
  Target,
  ShieldCheck,
  FolderLock
} from 'lucide-react';
import { AuthModal, AuthTab } from '../components/auth/AuthModal';
import { getCurrentSession, setLocalMockSession, UserSession } from '../services/supabase';

export const Landing: React.FC = () => {
  const navigate = useNavigate();

  // Auth Modal State
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authTab, setAuthTab] = useState<AuthTab>('signup');
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);

  // Interactive Demo Widget State
  const [demoTab, setDemoTab] = useState<'tutor' | 'flashcard' | 'planner' | 'analytics'>('tutor');
  const [cardFlipped, setCardFlipped] = useState(false);
  const [tasksChecked, setTasksChecked] = useState<Record<number, boolean>>({
    0: true,
    1: false,
    2: false,
  });

  useEffect(() => {
    getCurrentSession().then((session) => {
      if (session) {
        setCurrentUser(session);
      }
    });
  }, []);

  const openAuth = (tab: AuthTab) => {
    setAuthTab(tab);
    setAuthModalOpen(true);
  };

  const handleInstantDemo = () => {
    setLocalMockSession({
      id: '00000000-0000-0000-0000-000000000001',
      email: 'alex.rivera@lifeos.academic',
      full_name: 'Alex Rivera',
    });
    navigate('/dashboard');
  };

  const features = [
    {
      icon: BookOpen,
      title: 'Course Subjects & Syllabus',
      description: 'Centralized semester curriculum management with structured unit topics directly powering all learning tools.',
      tag: 'Curriculum Base'
    },
    {
      icon: Brain,
      title: 'Gemini AI Tutor',
      description: 'Step-by-step Feynman explanations, concept breakdowns, and Q&A grounded strictly in your course syllabus.',
      tag: 'AI Learning'
    },
    {
      icon: Layers,
      title: 'SM-2 Active Recall Flashcards',
      description: 'Automated flashcard generation from syllabus units with SuperMemo-2 spaced repetition recall scheduling.',
      tag: 'Spaced Recall'
    },
    {
      icon: HelpCircle,
      title: 'Timed Quizzes & Mock Exams',
      description: 'Test your understanding with countdown timers, question navigation palettes, and automated answer scoring.',
      tag: 'Assessment Engine'
    },
    {
      icon: Calendar,
      title: 'Exam Countdown Planner',
      description: 'Structured day-by-day revision roadmap and study targets ahead of your upcoming exams.',
      tag: 'Study Planning'
    },
    {
      icon: CheckSquare,
      title: 'Tasks & Projects',
      description: 'Kanban and list tracking for coursework assignments alongside multi-week term project sprint milestones.',
      tag: 'Execution Hub'
    },
    {
      icon: BarChart3,
      title: 'Academic Analytics & Readiness',
      description: 'Evidence-based exam readiness forecasting, syllabus coverage percentages, and mistake recovery insights.',
      tag: 'Readiness Radar'
    },
    {
      icon: Target,
      title: 'Goal Tracker & Attendance',
      description: 'Track target semester GPA, weekly study hours, and monitor subject attendance against the 75% threshold.',
      tag: 'Academic Health'
    }
  ];

  const steps = [
    {
      step: '01',
      title: 'Configure Your Courses',
      description: 'Review your semester modules and syllabus units (DBMS, DSA, AI, Cloud Computing) or add custom courses.'
    },
    {
      step: '02',
      title: 'Learn with AI & Active Recall',
      description: 'Consult the AI Tutor, practice active recall with spaced repetition flashcards, and take timed assessments.'
    },
    {
      step: '03',
      title: 'Follow Daily Study Missions',
      description: 'Track your exam countdown roadmap, log attendance, and monitor exam readiness before test day.'
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 overflow-x-hidden font-sans">
      {/* ------------------------------------------------------------- */}
      {/* 1. Navigation Bar                                             */}
      {/* ------------------------------------------------------------- */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground shadow-sm flex items-center justify-center group-hover:scale-105 transition-transform">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight text-foreground">
                Student Lifeline
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-secondary text-secondary-foreground border border-border">
                AI Academic Platform
              </span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-7 text-xs font-semibold text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a>
            <a href="#preview" className="hover:text-foreground transition-colors">Live Preview</a>
          </div>

          <div className="flex items-center gap-2.5">
            {currentUser ? (
              <Link
                to="/dashboard"
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-sm"
              >
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Go to Workspace</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-foreground hover:bg-secondary transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-sm"
                >
                  <span>Get Started</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ------------------------------------------------------------- */}
      {/* 2. Concise Hero Section                                       */}
      {/* ------------------------------------------------------------- */}
      <section className="relative pt-32 pb-16 sm:pt-36 sm:pb-20 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-primary/5 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-foreground leading-[1.15]">
            Syllabus-Grounded Learning & Study Operating System
          </h1>

          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Organize course subjects, generate active recall flashcards, practice with timed mock exams,
            and follow an automated daily study countdown.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              to="/signup"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs sm:text-sm font-bold transition-all shadow-sm"
            >
              <span>Get Started Free</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <button
              type="button"
              onClick={handleInstantDemo}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs sm:text-sm font-bold border border-border transition-all cursor-pointer"
            >
              <Zap className="h-4 w-4 text-amber-500" />
              <span>⚡ 1-Click Instant Demo</span>
            </button>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 3. Core Features Section                                      */}
      {/* ------------------------------------------------------------- */}
      <section id="features" className="py-16 bg-secondary/30 border-y border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Application Features
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto">
              Everything built into Student Lifeline to manage your academic semester.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="rounded-3xl bg-card border border-border p-5 space-y-3 shadow-xs hover:border-primary/50 transition-all flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="h-10 w-10 rounded-2xl bg-secondary text-primary flex items-center justify-center font-bold">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground border border-border/60">
                        {feat.tag}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-foreground">{feat.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{feat.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 4. How It Works Section (Basic Info)                          */}
      {/* ------------------------------------------------------------- */}
      <section id="how-it-works" className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              How Student Lifeline Works
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
              Three simple steps from course enrollment to exam mastery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {steps.map((st, i) => (
              <div
                key={i}
                className="rounded-3xl bg-card border border-border p-6 space-y-3 shadow-xs"
              >
                <div className="text-2xl font-black text-primary font-mono">{st.step}</div>
                <h3 className="text-base font-bold text-foreground">{st.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{st.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 5. Live Interactive Preview                                   */}
      {/* ------------------------------------------------------------- */}
      <section id="preview" className="py-16 bg-secondary/20 border-t border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
              Interactive Component Preview
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Explore key learning modules directly before logging in.
            </p>
          </div>

          <div className="rounded-3xl bg-card border border-border shadow-md overflow-hidden">
            {/* Header Tabs */}
            <div className="flex items-center border-b border-border bg-secondary/40 p-2 overflow-x-auto gap-1">
              <button
                onClick={() => setDemoTab('tutor')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  demoTab === 'tutor'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Brain className="h-3.5 w-3.5" />
                <span>AI Tutor</span>
              </button>
              <button
                onClick={() => setDemoTab('flashcard')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  demoTab === 'flashcard'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Flashcards (SM-2)</span>
              </button>
              <button
                onClick={() => setDemoTab('planner')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  demoTab === 'planner'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Calendar className="h-3.5 w-3.5" />
                <span>Daily Mission</span>
              </button>
              <button
                onClick={() => setDemoTab('analytics')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  demoTab === 'analytics'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <BarChart3 className="h-3.5 w-3.5" />
                <span>Readiness Radar</span>
              </button>
            </div>

            {/* Tab 1: AI Tutor */}
            {demoTab === 'tutor' && (
              <div className="p-6 sm:p-8 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-xl bg-secondary flex items-center justify-center text-foreground font-bold text-xs shrink-0">
                    ST
                  </div>
                  <div className="p-3.5 rounded-2xl bg-secondary/60 text-xs text-foreground max-w-xl">
                    Why are B+ Trees preferred over standard Binary Search Trees for database indexing?
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-xs">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="p-4 rounded-2xl bg-secondary/40 border border-border text-xs text-foreground space-y-2 max-w-2xl leading-relaxed">
                    <p className="font-semibold text-primary">
                      B+ Trees in Relational Database Indexing (DBMS Unit 2):
                    </p>
                    <p className="text-muted-foreground">
                      1. <strong>Higher Fan-Out & Shallow Depth:</strong> B+ Trees have hundreds of child pointers per node, fitting an entire block in a single disk read (O(log_B N) instead of O(log_2 N)).
                    </p>
                    <p className="text-muted-foreground">
                      2. <strong>Sequential Leaf Linked List:</strong> All data pointers reside in doubly linked leaf nodes, making range queries (<code className="px-1 py-0.5 bg-secondary rounded text-[11px]">BETWEEN X AND Y</code>) linear scans without tree re-traversals.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 2: Flashcards */}
            {demoTab === 'flashcard' && (
              <div className="p-6 sm:p-8 space-y-4 text-center max-w-md mx-auto">
                <div
                  onClick={() => setCardFlipped(!cardFlipped)}
                  className="p-8 rounded-3xl bg-secondary/30 border border-border cursor-pointer select-none min-h-[180px] flex flex-col justify-between hover:border-primary/40 transition-colors"
                >
                  <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                    {cardFlipped ? 'Answer' : 'Active Recall Question (Click to Flip)'}
                  </span>
                  <div className="my-auto py-2">
                    {!cardFlipped ? (
                      <p className="text-sm font-bold text-foreground">
                        What is the time complexity of Dijkstra’s Algorithm using a Fibonacci Heap?
                      </p>
                    ) : (
                      <p className="text-sm font-bold text-foreground">
                        O(V log V + E) — due to O(1) amortized decrease-key operations.
                      </p>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground">SM-2 Spaced Interval: 6 Days</span>
                </div>
              </div>
            )}

            {/* Tab 3: Daily Mission */}
            {demoTab === 'planner' && (
              <div className="p-6 sm:p-8 space-y-3 max-w-md mx-auto">
                <div className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">
                  Today's Study Plan Tasks
                </div>
                {[
                  { title: 'DBMS: B+ Tree Range Scan Exercise', time: '30 mins' },
                  { title: 'DSA: Implement Dijkstra with Min-Heap', time: '45 mins' },
                  { title: 'Cloud Computing: Review Raft Leader Election Invariants', time: '35 mins' },
                ].map((t, idx) => (
                  <div
                    key={idx}
                    onClick={() => setTasksChecked((prev) => ({ ...prev, [idx]: !prev[idx] }))}
                    className="flex items-center justify-between p-3 rounded-2xl bg-secondary/30 border border-border cursor-pointer text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={!!tasksChecked[idx]}
                        onChange={() => {}}
                        className="h-3.5 w-3.5 accent-primary rounded"
                      />
                      <span className={tasksChecked[idx] ? 'line-through text-muted-foreground' : 'text-foreground font-medium'}>
                        {t.title}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono">{t.time}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Tab 4: Readiness Radar */}
            {demoTab === 'analytics' && (
              <div className="p-6 sm:p-8 space-y-4 max-w-lg mx-auto">
                <div className="text-center space-y-1">
                  <div className="text-3xl font-black text-primary">88%</div>
                  <div className="text-xs font-bold text-foreground">Overall Exam Readiness</div>
                  <p className="text-[11px] text-muted-foreground">Synthesized from syllabus coverage and quiz accuracy.</p>
                </div>

                <div className="space-y-2 pt-2 border-t border-border/60">
                  {[
                    { name: 'Database Management Systems (DBMS)', score: 92 },
                    { name: 'Data Structures & Algorithms (DSA)', score: 88 },
                    { name: 'Artificial Intelligence (AI)', score: 85 },
                    { name: 'Cloud Computing', score: 87 },
                  ].map((sub, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="text-foreground">{sub.name}</span>
                        <span className="font-bold text-primary">{sub.score}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${sub.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="p-4 bg-secondary/40 border-t border-border flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Ready to launch your workspace?</span>
              <button
                onClick={() => openAuth('signup')}
                className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs transition-all shadow-xs cursor-pointer"
              >
                Create Free Account
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- */}
      {/* 6. Clean Footer                                               */}
      {/* ------------------------------------------------------------- */}
      <footer className="py-8 border-t border-border bg-card text-muted-foreground text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs">
              S
            </div>
            <span className="font-bold text-foreground">Student Lifeline Academic System</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <Link to="/login" className="hover:text-foreground transition-colors">Sign In</Link>
            <Link to="/signup" className="hover:text-foreground transition-colors">Sign Up</Link>
            <button onClick={handleInstantDemo} className="hover:text-foreground transition-colors cursor-pointer">
              Instant Demo
            </button>
          </div>

          <div className="text-[11px] text-muted-foreground">
            © 2026 Student Lifeline. Academic study operating system.
          </div>
        </div>
      </footer>

      {/* Unified Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialTab={authTab}
        onSuccess={() => {
          setAuthModalOpen(false);
          navigate('/dashboard');
        }}
      />
    </div>
  );
};

export default Landing;
