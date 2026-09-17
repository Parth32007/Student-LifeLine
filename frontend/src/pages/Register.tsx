import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Sparkles, Lock, Mail, User, GraduationCap, 
  Clock, ArrowRight, ArrowLeft, Target, BookOpen, CheckCircle2, Shield,
  Eye, EyeOff, AlertCircle, Sun, Moon
} from 'lucide-react';
import { signUpWithProfile, skipVerificationAndLogin } from '../services/supabase';

export const Register: React.FC<{ onSuccess?: () => void; isModal?: boolean }> = ({ 
  onSuccess, 
  isModal = false 
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
  const [university, setUniversity] = useState('');
  const [course, setCourse] = useState('Computer Science');
  const [semester, setSemester] = useState(4);
  const [educationLevel, setEducationLevel] = useState('Undergraduate');

  // Optional Academic & Study Preference Fields
  const [dailyHours, setDailyHours] = useState<number>(4.0);
  const [preferredStudyStart, setPreferredStudyStart] = useState('09:00');
  const [preferredStudyEnd, setPreferredStudyEnd] = useState('22:00');
  const [goals, setGoals] = useState('Master core CS fundamentals & achieve 3.8+ GPA');
  const [subjectsText, setSubjectsText] = useState('Database Management Systems, Data Structures & Algorithms, Operating Systems');

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
    if (s === 2 || s === 3) return { score: 65, label: 'Medium', color: 'bg-amber-500' };
    return { score: 100, label: 'Strong', color: 'bg-emerald-500' };
  };

  const pwdStrength = getPasswordStrength(password);

  const handleStepOneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-check your confirm password.');
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
      setError('Degree or course is required.');
      return;
    }

    setLoading(true);

    // Parse subjects list
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

    const payload = {
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      password,
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
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const formCard = (
    <div className="w-full max-w-lg space-y-6 rounded-3xl bg-card border border-border/80 p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
      {/* Ambient background blur */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="text-center space-y-1 relative">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/20 dark:bg-gradient-to-tr dark:from-indigo-600 dark:via-indigo-500 dark:to-purple-600 dark:text-white dark:shadow-indigo-500/25">
          <Sparkles className="h-6 w-6" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-foreground">
          Create Your Student Lifeline Account
        </h1>
        <p className="text-xs text-muted-foreground">
          {step === 1 ? 'Step 1 of 2: Account & Security' : 'Step 2 of 2: Academic Profile & Preferences'}
        </p>

        {/* Progress Bar */}
        <div className="pt-2">
          <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300 dark:bg-gradient-to-r dark:from-indigo-500 dark:to-purple-500"
              style={{ width: step === 1 ? '50%' : '100%' }}
            />
          </div>
        </div>
      </div>

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
                placeholder="Alex Rivera"
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
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
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
                  className={`w-full pl-10 pr-10 py-2.5 rounded-xl bg-secondary/50 border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none transition-colors ${
                    confirmPassword && password !== confirmPassword 
                      ? 'border-destructive/80 focus:border-destructive' 
                      : 'border-border focus:border-primary'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3.5 top-3 text-muted-foreground hover:text-foreground cursor-pointer"
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Password Strength Meter */}
          {password && (
            <div className="space-y-1 pt-1">
              <div className="flex justify-between items-center text-[10px] text-muted-foreground font-semibold">
                <span>Password Strength</span>
                <span className={pwdStrength.score >= 65 ? 'text-emerald-500' : 'text-amber-500'}>
                  {pwdStrength.label}
                </span>
              </div>
              <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                <div 
                  className={`h-full ${pwdStrength.color} transition-all duration-300`} 
                  style={{ width: `${pwdStrength.score}%` }}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold transition-all shadow-md shadow-primary/20 dark:bg-gradient-to-r dark:from-indigo-600 dark:via-indigo-500 dark:to-purple-600 dark:text-white dark:shadow-indigo-500/25 cursor-pointer mt-2"
          >
            <span>Continue to Academic Profile</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      )}

      {/* Step 2: Academic Profile & Preferences */}
      {step === 2 && (
        <form onSubmit={(e) => handleFinalSubmit(e, false)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                College or University <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <GraduationCap className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  required
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="Stanford / State Tech"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Degree Level
              </label>
              <select
                value={educationLevel}
                onChange={(e) => setEducationLevel(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
              >
                <option value="Undergraduate">Undergraduate (B.Tech / B.S.)</option>
                <option value="Postgraduate">Postgraduate (M.S. / M.Tech)</option>
                <option value="HighSchool">High School / Prep</option>
                <option value="Doctorate">PhD / Doctorate</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Degree / Course <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <BookOpen className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  required
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  placeholder="Computer Science"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                Current Semester / Year <span className="text-destructive">*</span>
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(Number(e.target.value))}
                className="w-full px-3 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <option key={sem} value={sem}>Semester {sem}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Optional Fields Accordion / Grid */}
          <div className="pt-1 border-t border-border/60 space-y-3">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
              Study Preferences (Optional)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Daily Available Study Hours
                </label>
                <div className="relative">
                  <Clock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="14"
                    value={dailyHours}
                    onChange={(e) => setDailyHours(Number(e.target.value))}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Preferred Study Window
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="relative">
                    <Sun className="absolute left-2.5 top-3 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      type="time"
                      value={preferredStudyStart}
                      onChange={(e) => setPreferredStudyStart(e.target.value)}
                      className="w-full pl-8 pr-1 py-2.5 rounded-xl bg-secondary/50 border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="relative">
                    <Moon className="absolute left-2.5 top-3 h-3.5 w-3.5 text-muted-foreground" />
                    <input
                      type="time"
                      value={preferredStudyEnd}
                      onChange={(e) => setPreferredStudyEnd(e.target.value)}
                      className="w-full pl-8 pr-1 py-2.5 rounded-xl bg-secondary/50 border border-border text-xs text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Academic Goals
              </label>
              <div className="relative">
                <Target className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={goals}
                  onChange={(e) => setGoals(e.target.value)}
                  placeholder="Master Tree Algorithms, score 3.9+ GPA"
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Current Subjects (Comma-separated)
              </label>
              <input
                type="text"
                value={subjectsText}
                onChange={(e) => setSubjectsText(e.target.value)}
                placeholder="DBMS, Data Structures, Operating Systems"
                className="w-full px-3 py-2.5 rounded-xl bg-secondary/50 border border-border text-sm text-foreground focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-3 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold transition-all shadow-md shadow-primary/20 dark:bg-gradient-to-r dark:from-indigo-600 dark:via-indigo-500 dark:to-purple-600 dark:hover:opacity-95 dark:text-white dark:shadow-indigo-500/25 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="h-5 w-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Account & Launch Workspace</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* Supabase Storage reassurance */}
      <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground pt-1 border-t border-border/50">
        <Shield className="h-3.5 w-3.5 text-primary" />
        <span>Academic profile securely stored in Supabase PostgreSQL</span>
      </div>

      {!isModal && (
        <div className="text-center text-xs text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-primary hover:underline">
            Sign In
          </Link>
        </div>
      )}
    </div>
  );

  if (isModal) {
    return formCard;
  }

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-background px-4 py-12 relative">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(47,107,69,0.06),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] pointer-events-none" />
      {formCard}
    </div>
  );
};

export default Register;
