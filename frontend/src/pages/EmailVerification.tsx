import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
  Mail, CheckCircle2, AlertCircle, ArrowRight, RefreshCw, 
  ExternalLink, Sparkles, ArrowLeft, ShieldCheck 
} from 'lucide-react';
import { 
  verifyEmailOtp, 
  resendVerificationEmail, 
  getPendingRegistration, 
  isSupabaseConfigured,
  skipVerificationAndLogin
} from '../services/supabase';

interface EmailVerificationProps {
  onSuccess?: () => void;
  targetEmail?: string;
  isModal?: boolean;
}

export const EmailVerification: React.FC<EmailVerificationProps> = ({ 
  onSuccess, 
  targetEmail: propEmail,
  isModal = false 
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Determine target email
  const queryParams = new URLSearchParams(location.search);
  const emailFromUrl = queryParams.get('email');
  const pending = getPendingRegistration();
  const email = propEmail || location.state?.email || emailFromUrl || pending?.email || 'student@university.edu';

  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [resending, setResending] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleDigitChange = (index: number, value: string) => {
    // Only accept numbers
    const cleanVal = value.replace(/[^0-9]/g, '');
    if (!cleanVal && value !== '') return;

    const newOtp = [...otp];
    newOtp[index] = cleanVal.slice(-1); // Take last character
    setOtp(newOtp);

    // Auto-focus next input
    if (cleanVal && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto submit if all 6 digits are filled
    if (cleanVal && index === 5 && newOtp.every((d) => d.length === 1)) {
      handleVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (!pasted) return;

    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pasted[i] || '';
    }
    setOtp(newOtp);

    // Focus on the next unfilled input or the last one
    const nextIdx = Math.min(pasted.length, 5);
    inputRefs.current[nextIdx]?.focus();

    if (pasted.length === 6) {
      handleVerify(pasted);
    }
  };

  const handleVerify = async (codeToVerify?: string) => {
    const fullCode = codeToVerify || otp.join('');
    if (fullCode.length !== 6) {
      setError('Please enter all 6 digits of your verification code.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await verifyEmailOtp(email, fullCode);
      setSuccessMsg('Email verified successfully! Preparing your academic workspace...');
      setTimeout(() => {
        if (onSuccess) {
          onSuccess();
        } else {
          navigate('/onboarding');
        }
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Invalid or expired verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resending) return;
    setResending(true);
    setError(null);
    try {
      const res = await resendVerificationEmail(email);
      setSuccessMsg(res.message);
      setResendCooldown(60);
      setOtp(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.message || 'Failed to resend verification code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const handleSkip = async () => {
    setLoading(true);
    try {
      await skipVerificationAndLogin();
      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/onboarding');
      }
    } catch (err: any) {
      console.warn('Skip notice:', err);
      navigate('/onboarding');
    } finally {
      setLoading(false);
    }
  };

  const containerContent = (
    <div className="w-full max-w-md space-y-6 rounded-3xl bg-card border border-border/80 p-8 shadow-2xl relative overflow-hidden backdrop-blur-xl">
      {/* Decorative background glow */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="text-center space-y-2 relative">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-xl shadow-indigo-500/30">
          <Mail className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-foreground">
          Verify Your Email
        </h1>
        <p className="text-xs text-muted-foreground max-w-xs mx-auto">
          We sent a 6-digit confirmation code to
        </p>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>{email}</span>
        </div>
        <div className="text-[11px] text-muted-foreground font-medium pt-0.5">
          (Verification is optional — you can enter your code or skip directly)
        </div>
      </div>

      {/* Status Badges */}
      {isSupabaseConfigured ? (
        <div className="text-[11px] text-center text-muted-foreground bg-secondary/60 rounded-xl py-2 px-3 border border-border/50">
          ⚡ Supabase Cloud Auth is active. Check your inbox and spam folder.
        </div>
      ) : (
        <div className="text-[11px] text-center text-amber-600 dark:text-amber-400 bg-amber-500/10 rounded-xl py-2 px-3 border border-amber-500/20 font-medium">
          💡 Dev Mode Preview: Enter code <span className="font-mono font-bold underline">123456</span> to verify.
        </div>
      )}

      {/* Alert Messages */}
      {error && (
        <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* 6-Digit OTP Input */}
      <div className="space-y-3">
        <label className="block text-xs font-semibold text-center text-foreground uppercase tracking-wider">
          Enter 6-Digit Verification Code
        </label>
        <div className="flex justify-center items-center gap-2 sm:gap-2.5">
          {otp.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => (inputRefs.current[idx] = el)}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={1}
              value={digit}
              onChange={(e) => handleDigitChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              onPaste={handlePaste}
              disabled={loading}
              className={`w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-xl border bg-secondary/40 text-foreground transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                digit ? 'border-primary/80 bg-primary/5 text-primary shadow-sm' : 'border-border'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Verify Button */}
      <button
        type="button"
        onClick={() => handleVerify()}
        disabled={loading || otp.join('').length !== 6}
        className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:opacity-95 text-white text-sm font-bold transition-all shadow-lg shadow-indigo-500/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        {loading ? (
          <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            <span>Verify & Complete Registration</span>
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>

      {/* Skip for now / Optional Button */}
      <button
        type="button"
        onClick={handleSkip}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-secondary/80 hover:bg-secondary text-foreground text-xs font-bold transition-all border border-border/80 cursor-pointer -mt-1"
      >
        <Sparkles className="h-3.5 w-3.5 text-primary" />
        <span>Skip for Now & Launch Workspace</span>
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
      </button>

      {/* Resend & Webmail Shortcuts */}
      <div className="space-y-3 pt-2 border-t border-border/60">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Didn't receive the email?</span>
          <button
            type="button"
            onClick={handleResend}
            disabled={resendCooldown > 0 || resending}
            className="font-semibold text-primary hover:underline flex items-center gap-1 disabled:opacity-50 disabled:no-underline cursor-pointer"
          >
            {resending && <RefreshCw className="h-3 w-3 animate-spin" />}
            <span>
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
            </span>
          </button>
        </div>

        {/* Quick Email Providers */}
        <div className="grid grid-cols-2 gap-2">
          <a
            href="https://mail.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground text-xs font-medium transition-colors"
          >
            <span>Open Gmail</span>
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          </a>
          <a
            href="https://outlook.live.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-secondary hover:bg-secondary/80 text-foreground text-xs font-medium transition-colors"
          >
            <span>Open Outlook</span>
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          </a>
        </div>
      </div>

      {/* Back Link */}
      {!isModal && (
        <div className="text-center pt-2">
          <Link
            to="/register"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-medium transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Wrong email? Change registration details</span>
          </Link>
        </div>
      )}
    </div>
  );

  if (isModal) {
    return containerContent;
  }

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-background px-4 py-12 relative">
      {/* Background Ambience */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))] pointer-events-none" />
      {containerContent}
    </div>
  );
};

export default EmailVerification;
