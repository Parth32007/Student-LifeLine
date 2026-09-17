import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Sparkles, Eye, EyeOff, Lock, Mail, ArrowRight, Zap, 
  Shield, AlertCircle, CheckCircle2, X 
} from 'lucide-react';
import { 
  signInUser, 
  createDemoUserSession, 
  signInWithGoogle, 
  resetUserPassword 
} from '../services/supabase';
import { getRegisteredUsers, RegisteredUser } from '../services/staticStorage';

interface LoginProps {
  onSuccess?: () => void;
  isModal?: boolean;
}

export const Login: React.FC<LoginProps> = ({ onSuccess, isModal = false }) => {
  const registeredUsers = getRegisteredUsers();
  // Default to the first registered user or Alex Rivera
  const defaultUser = registeredUsers[0];
  const [email, setEmail] = useState(defaultUser ? defaultUser.email : 'alex.rivera@lifeos.academic');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forgot password dialog state
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [forgotError, setForgotError] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await signInUser(email, password);
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Google authentication failed.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleDemoLogin = () => {
    createDemoUserSession();
    if (onSuccess) {
      onSuccess();
    } else {
      navigate('/dashboard');
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError(null);
    setForgotSuccess(null);

    try {
      const res = await resetUserPassword(forgotEmail);
      setForgotSuccess(res.message);
    } catch (err: any) {
      setForgotError(err.message || 'Failed to send password reset email.');
    } finally {
      setForgotLoading(false);
    }
  };

  const loginCard = (
    <div className="w-full max-w-md space-y-5 rounded-3xl bg-card border border-border/80 p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
      {/* Ambient background blur */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="text-center space-y-1.5 relative">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/20 dark:bg-gradient-to-tr dark:from-indigo-600 dark:via-indigo-500 dark:to-purple-600 dark:text-white dark:shadow-indigo-500/30">
          <Sparkles className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-foreground">
          Welcome to Student Lifeline
        </h1>
        <p className="text-xs text-muted-foreground max-w-xs mx-auto">
          Your personal academic study operating system
        </p>
      </div>

      {/* Registered Accounts Selector / Preset Card */}
      <div className="space-y-2">
        <div className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
          <span>Active Accounts on this Browser</span>
          <span className="text-[10px] text-primary">{registeredUsers.length} available</span>
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
          {registeredUsers.map((u) => {
            const isSelected = email.toLowerCase() === u.email.toLowerCase();
            const initials = (u.full_name || 'ST')
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            return (
              <div
                key={u.id}
                onClick={() => {
                  setEmail(u.email);
                  setPassword(u.password || 'password123');
                }}
                className={`p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-indigo-500/15 border-indigo-500/40 shadow-sm'
                    : 'bg-secondary/40 border-border/60 hover:bg-secondary/80'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-8 w-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-sm">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-foreground truncate">
                      {u.full_name}
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      {u.email} • {u.university || 'University'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEmail(u.email);
                    setPassword(u.password || 'password123');
                  }}
                  className="px-2 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-bold shrink-0 ml-2"
                >
                  {isSelected ? 'Selected' : 'Select'}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Google Sign In Option */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={googleLoading}
        className="w-full flex items-center justify-center gap-2.5 py-2.5 px-4 rounded-xl bg-secondary/70 hover:bg-secondary border border-border text-foreground text-xs font-semibold transition-all cursor-pointer shadow-sm"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path
            fill="#EA4335"
            d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.3 8.8 5 12 5z"
          />
          <path
            fill="#4285F4"
            d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
          />
          <path
            fill="#FBBC05"
            d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.7s.1-2 .4-2.7L1.6 6.4C.6 8.3 0 10.1 0 12s.6 3.7 1.6 5.6l3.7-2.9z"
          />
          <path
            fill="#34A853"
            d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.2 0-5.8-2.3-6.7-5.3L1.6 16C3.5 19.8 7.4 23 12 23z"
          />
        </svg>
        <span>Continue with Google (OAuth)</span>
      </button>

      <div className="flex items-center gap-2 my-2 text-[11px] text-muted-foreground uppercase">
        <div className="h-px bg-border flex-1" />
        <span>Or sign in with email</span>
        <div className="h-px bg-border flex-1" />
      </div>

      {/* Email / Password Form */}
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            University / Personal Email
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

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-foreground">
              Password
            </label>
            <button
              type="button"
              onClick={() => {
                setForgotEmail(email);
                setForgotPasswordOpen(true);
              }}
              className="text-[11px] text-primary hover:underline font-medium cursor-pointer"
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
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

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold transition-all shadow-md shadow-primary/20 dark:bg-gradient-to-r dark:from-indigo-600 dark:via-indigo-500 dark:to-purple-600 dark:text-white dark:shadow-indigo-500/25 disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <div className="h-5 w-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span>Sign In to Workspace</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      {/* Demo Fast Login */}
      <div className="pt-2 border-t border-border/60">
        <button
          type="button"
          onClick={handleDemoLogin}
          className="w-full py-2.5 px-4 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold transition-colors flex items-center justify-center gap-2 border border-border/50 cursor-pointer"
        >
          <Zap className="h-3.5 w-3.5 text-amber-500" />
          <span>⚡ One-Click Direct Sign In as Alex Rivera</span>
        </button>
      </div>

      <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground pt-1 border-t border-border/50">
        <Shield className="h-3.5 w-3.5 text-primary" />
        <span>Secured with Supabase Authentication</span>
      </div>

      {!isModal && (
        <div className="text-center text-xs text-muted-foreground">
          Don't have an academic workspace yet?{' '}
          <Link to="/signup" className="font-bold text-primary hover:underline">
            Sign Up for Student Lifeline
          </Link>
        </div>
      )}

      {/* Forgot Password Dialog */}
      {forgotPasswordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-card border border-border p-6 shadow-2xl space-y-4 relative">
            <button
              onClick={() => setForgotPasswordOpen(false)}
              className="absolute right-4 top-4 p-1.5 rounded-full bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-foreground">Reset Your Password</h3>
              <p className="text-xs text-muted-foreground">
                Enter your university email to receive a password reset link.
              </p>
            </div>

            {forgotSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>{forgotSuccess}</span>
              </div>
            )}

            {forgotError && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
                {forgotError}
              </div>
            )}

            <form onSubmit={handleForgotPasswordSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="student@university.edu"
                  className="w-full px-3 py-2 rounded-xl bg-secondary/50 border border-border text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <button
                type="submit"
                disabled={forgotLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
              >
                {forgotLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );

  if (isModal) {
    return loginCard;
  }

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-background px-4 py-12 relative">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(47,107,69,0.06),rgba(255,255,255,0))] dark:bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] pointer-events-none" />
      {loginCard}
    </div>
  );
};

export default Login;
