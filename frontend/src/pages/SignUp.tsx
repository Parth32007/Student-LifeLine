import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Lock,
  Mail,
  User,
  GraduationCap,
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Shield,
  Eye,
  EyeOff,
  AlertCircle,
  Zap,
  BookOpen,
  BrainCircuit,
  Layers,
  Flame,
  Award
} from 'lucide-react';
import {
  signUpWithProfile,
  skipVerificationAndLogin,
  signInWithGoogle,
  isSupabaseConfigured
} from '../services/supabase';
import { deriveNameFromEmail } from '../services/staticStorage';

export const SignUp: React.FC<{ onSuccess?: () => void; isModal?: boolean }> = ({
  onSuccess,
  isModal = false,
}) => {
  // Step 1: Account Credentials, Step 2: Academic Profile & Preferences
  const [step, setStep] = useState<1 | 2>(1);

  // Required Account Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Required Academic Profile Fields
  const [university, setUniversity] = useState('Stanford University');
  const [course, setCourse] = useState('Computer Science');
  const [semester, setSemester] = useState(4);
  const [educationLevel, setEducationLevel] = useState('Undergraduate');

  // Optional Academic & Study Preference Fields
  const [dailyHours, setDailyHours] = useState<number>(4.0);
  const [preferredStudyStart, setPreferredStudyStart] = useState('09:00');
  const [preferredStudyEnd, setPreferredStudyEnd] = useState('22:00');
  const [goals, setGoals] = useState('Maintain 3.88 GPA & master AI architectures');
  const [subjectsText, setSubjectsText] = useState(
    'Database Management Systems, Data Structures & Algorithms, Operating Systems'
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Password strength calculation
  const getPasswordStrength = (pass: string): { score: number; label: string; color: string } => {
    if (!pass) return { score: 0, label: 'None', color: 'bg-muted' };
    let s = 0;
    if (pass.length >= 6) s += 1;
    if (pass.length >= 8) s += 1;
    if (/[0-9]/.test(pass)) s += 1;
    if (/[^A-Za-z0-9]/.test(pass)) s += 1;

    if (s <= 1) return { score: 25, label: 'Weak', color: 'bg-rose-500' };
    if (s === 2 || s === 3) return { score: 65, label: 'Good', color: 'bg-amber-500' };
    return { score: 100, label: 'Strong', color: 'bg-emerald-500' };
  };

  const pwdStrength = getPasswordStrength(password);

  const handleStepOneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid student email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter your confirm password.');
      return;
    }

    setStep(2);
  };

  const handleFinalSubmit = async (e?: React.FormEvent, skipVerification = false) => {
    if (e) e.preventDefault();
    setError(null);

    if (!university.trim()) {
      setError('College or university name is required.');
      return;
    }

    if (!course.trim()) {
      setError('Degree or course major is required.');
      return;
    }

    setLoading(true);

    const subjectsArray = subjectsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((name, idx) => ({
        name,
        code: `CS40${idx + 1}`,
        color: ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899'][idx % 5],
        target_grade: 'A',
      }));

    const cleanEmail = email.trim().toLowerCase() || 'student@university.edu';
    const payload = {
      fullName: fullName.trim() || deriveNameFromEmail(cleanEmail),
      email: cleanEmail,
      password: password || 'password123',
      educationLevel,
      university: university.trim(),
      course: course.trim(),
      semester: Number(semester),
      dailyHours: Number(dailyHours),
      preferredStudyStart,
      preferredStudyEnd,
      goals: goals.trim(),
      subjects: subjectsArray,
    };

    try {
      await signUpWithProfile(payload);
      window.dispatchEvent(new Event('storage'));
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Sign up failed. Please review your information.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignUp = async () => {
    setLoading(true);
    setError(null);
    try {
      await skipVerificationAndLogin({
        fullName: 'Alex Rivera',
        email: 'alex.rivera@lifeos.academic',
        university: 'Stanford University',
        course: 'B.Tech Computer Science',
        semester: 4,
        dailyHours: 4.5,
        goals: 'Maintain 3.88 GPA & master AI architectures',
      });
      window.dispatchEvent(new Event('storage'));
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initialize demo student account.');
    } finally {
      setLoading(false);
    }
  };

  const formContent = (
    <div className="w-full max-w-lg space-y-6 rounded-3xl bg-card/90 border border-border/80 p-6 sm:p-8 shadow-2xl relative overflow-hidden backdrop-blur-2xl">
      {/* Ambient glowing orbs */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="text-center space-y-2 relative">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/20 dark:bg-gradient-to-tr dark:from-indigo-600 dark:via-indigo-500 dark:to-purple-600 dark:text-white dark:shadow-indigo-500/25">
          <Sparkles className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Sign Up for Student Lifeline
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {step === 1 ? 'Step 1 of 2: Create Account Credentials' : 'Step 2 of 2: Personalize Your Academic Profile'}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="pt-2">
          <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 dark:bg-gradient-to-r dark:from-indigo-500 dark:via-purple-500 dark:to-pink-500"
              style={{ width: step === 1 ? '50%' : '100%' }}
            />
          </div>
        </div>
      </div>

      {/* 1-Click Demo Quick Sign In Banner */}
      {step === 1 && (
        <div className="rounded-2xl border border-primary/20 bg-secondary/70 dark:border-indigo-500/30 dark:bg-gradient-to-r dark:from-indigo-500/10 dark:via-purple-500/10 dark:to-pink-500/10 p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-foreground flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-amber-400 fill-amber-400" />
              Instant Sandbox Access
            </span>
            <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
              Zero Config
            </span>
          </div>
          <button
            type="button"
            onClick={handleDemoSignUp}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all shadow-md shadow-primary/20 dark:bg-gradient-to-r dark:from-indigo-600 dark:to-purple-600 dark:hover:from-indigo-500 dark:hover:to-purple-500 cursor-pointer disabled:opacity-50"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>⚡ Test Drive as Alex Rivera (Stanford CS)</span>
          </button>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step 1: Account Credentials */}
      {step === 1 && (
        <form onSubmit={handleStepOneSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Full Name <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Alex Rivera"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Email Address <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@university.edu"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Password <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 chars"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Confirm Password <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat password"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-3 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Live Password Strength Meter */}
          {password && (
            <div className="space-y-1 pt-0.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Security Strength:</span>
                <span className="font-semibold text-foreground">{pwdStrength.label}</span>
              </div>
              <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full ${pwdStrength.color} transition-all duration-300`}
                  style={{ width: `${pwdStrength.score}%` }}
                />
              </div>
            </div>
          )}

          {/* Continue button */}
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm transition-all shadow-md shadow-indigo-500/25 cursor-pointer mt-2"
          >
            <span>Continue to Academic Profile</span>
            <ArrowRight className="h-4 w-4" />
          </button>

          {/* Social Sign Up */}
          {isSupabaseConfigured && (
            <div className="pt-2">
              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-border"></div>
                <span className="flex-shrink mx-4 text-[11px] uppercase font-semibold text-muted-foreground tracking-wider">
                  or sign up with
                </span>
                <div className="flex-grow border-t border-border"></div>
              </div>
              <button
                type="button"
                onClick={() => signInWithGoogle()}
                className="w-full flex items-center justify-center gap-2.5 py-2.5 rounded-xl border border-border hover:bg-secondary/60 text-foreground text-xs font-semibold transition-colors"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.6 14.8c-.3-.8-.4-1.8-.4-2.8s.1-2 .4-2.8L1.9 6.3C.7 8.7 0 11.3 0 14s.7 5.3 1.9 7.7l3.7-2.9z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>
          )}
        </form>
      )}

      {/* Step 2: Academic Profile */}
      {step === 2 && (
        <form onSubmit={(e) => handleFinalSubmit(e, false)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                University / College <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <GraduationCap className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  required
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="Stanford University"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Major / Course <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                required
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                placeholder="B.Tech Computer Science"
                className="w-full px-4 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Current Semester
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground focus:outline-none focus:border-primary"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                  <option key={s} value={s}>
                    Semester {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Level
              </label>
              <select
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground focus:outline-none focus:border-primary"
              >
                <option value="Undergraduate">Undergraduate</option>
                <option value="Postgraduate">Postgraduate</option>
                <option value="High School">High School</option>
                <option value="Self-Learner">Self-Learner</option>
              </select>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Daily Study Target
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max="16"
                  value={dailyHours}
                  onChange={(e) => setDailyHours(Number(e.target.value))}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              Current Enrolled Courses / Subjects (Comma-separated)
            </label>
            <div className="relative">
              <BookOpen className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={subjectsText}
                onChange={(e) => setSubjectsText(e.target.value)}
                placeholder="DBMS, Data Structures, Operating Systems"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm transition-all shadow-md shadow-primary/20 dark:shadow-indigo-500/25 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Create Account & Launch Workspace</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Step 1</span>
            </button>
          </div>
        </form>
      )}

      {/* Switch to Sign In */}
      <div className="pt-4 border-t border-border/60 text-center text-xs text-muted-foreground">
        Already have a Student Lifeline account?{' '}
        <Link to="/login" className="font-bold text-primary hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );

  if (isModal) {
    return formContent;
  }

  return (
    <div className="min-h-screen w-full bg-background flex flex-col justify-between p-4 sm:p-6 lg:p-12 relative overflow-hidden selection:bg-primary/20">
      {/* Background Decorative Gradients */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-primary/5 dark:bg-indigo-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[600px] h-[600px] bg-secondary/40 dark:bg-purple-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Navbar */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between z-10">
        <Link to="/" className="flex items-center space-x-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm dark:bg-gradient-to-tr dark:from-indigo-600 dark:via-indigo-500 dark:to-purple-500 dark:text-white dark:shadow-indigo-500/25">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight text-foreground dark:bg-gradient-to-r dark:from-indigo-500 dark:via-purple-500 dark:to-pink-500 dark:bg-clip-text dark:text-transparent">
              Student Lifeline
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline text-xs text-muted-foreground">
            Already registered?
          </span>
          <Link
            to="/login"
            className="px-4 py-2 rounded-xl bg-secondary hover:bg-secondary/80 text-xs font-semibold text-foreground transition-colors border border-border"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Main Grid: Form + Student Feature Showcase */}
      <main className="max-w-6xl w-full mx-auto my-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center z-10 py-8">
        {/* Left Column: Sign Up Card */}
        <div className="lg:col-span-6 flex justify-center lg:justify-start">
          {formContent}
        </div>

        {/* Right Column: Student Superpowers Feature Highlights */}
        <div className="hidden lg:flex lg:col-span-6 flex-col space-y-6 pl-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border text-secondary-foreground text-xs font-semibold">
              <Award className="h-3.5 w-3.5" />
              <span>Built for High-Performing University Students</span>
            </div>
            <h2 className="text-3xl lg:text-4xl font-black text-foreground tracking-tight leading-tight">
              One Unified Workspace to{' '}
              <span className="text-primary dark:bg-gradient-to-r dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 dark:bg-clip-text dark:text-transparent">
                Ace Your Semester.
              </span>
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Say goodbye to juggling 6 different study apps. Student Lifeline organizes your lecture notes, designs intelligent study plans, and tutors you with Google Gemini AI.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-card/60 border border-border/80 backdrop-blur-md space-y-2">
              <div className="h-8 w-8 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
                <BrainCircuit className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-foreground">Gemini AI Tutor</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Step-by-step Feynman explanations, live code mentoring, and direct answers grounded in your course notes.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-card/60 border border-border/80 backdrop-blur-md space-y-2">
              <div className="h-8 w-8 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center">
                <Layers className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-foreground">SM-2 Spaced Repetition</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                SuperMemo-2 retention algorithms predict when memory decays and schedule flashcards at peak recall moments.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-card/60 border border-border/80 backdrop-blur-md space-y-2">
              <div className="h-8 w-8 rounded-xl bg-pink-500/15 text-pink-400 flex items-center justify-center">
                <Clock className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-foreground">7-Day Study Planner</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Dynamically balances exam deadlines, weekly credits, and target daily hours to avoid all-nighter panics.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-card/60 border border-border/80 backdrop-blur-md space-y-2">
              <div className="h-8 w-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                <Flame className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-foreground">Exam Readiness Engine</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Calculates weighted syllabus readiness, highlights weak areas in your mistake notebook, and predicts outcomes.
              </p>
            </div>
          </div>

          {/* Social Proof */}
          <div className="p-4 rounded-2xl bg-secondary/40 border border-border/60 flex items-center gap-4">
            <div className="flex -space-x-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 border-2 border-card flex items-center justify-center text-[10px] font-bold text-white">
                AR
              </div>
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 border-2 border-card flex items-center justify-center text-[10px] font-bold text-white">
                SK
              </div>
              <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-pink-500 to-rose-500 border-2 border-card flex items-center justify-center text-[10px] font-bold text-white">
                ML
              </div>
            </div>
            <div className="text-xs">
              <span className="font-bold text-foreground">Joined by CS & Engineering students</span>
              <p className="text-muted-foreground">Stanford, MIT, Berkeley, Georgia Tech & more.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto text-center text-xs text-muted-foreground py-4 z-10">
        © 2026 Student Lifeline Academic AI Platform. Free for university students.
      </footer>
    </div>
  );
};

export default SignUp;
