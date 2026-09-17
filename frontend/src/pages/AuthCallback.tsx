import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase, saveUserProfileData, getPendingRegistration, clearPendingRegistration } from '../services/supabase';

export const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const handleAuthRedirect = async () => {
      try {
        // Check hash or query params
        const hash = window.location.hash;
        if (hash.includes('error=')) {
          const params = new URLSearchParams(hash.replace('#', '?'));
          const desc = params.get('error_description') || 'Email confirmation link is invalid or has expired.';
          setStatus('error');
          setErrorMessage(desc);
          return;
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (session && session.user) {
          // Persist gathered profile data to Supabase
          const pending = getPendingRegistration();
          if (pending) {
            await saveUserProfileData(session.user.id, pending);
            clearPendingRegistration();
          }

          setStatus('success');
          setTimeout(() => {
            navigate('/onboarding');
          }, 1500);
        } else {
          // Listen for onAuthStateChange in case session is being processed
          const { data: authListener } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
            if (currentSession && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
              const pending = getPendingRegistration();
              if (pending) {
                await saveUserProfileData(currentSession.user.id, pending);
                clearPendingRegistration();
              }
              setStatus('success');
              setTimeout(() => {
                navigate('/onboarding');
              }, 1200);
            }
          });

          // Fallback timeout
          setTimeout(() => {
            if (status === 'verifying') {
              navigate('/login');
            }
          }, 4000);

          return () => {
            authListener.subscription.unsubscribe();
          };
        }
      } catch (err: any) {
        setStatus('error');
        setErrorMessage(err.message || 'Authentication callback failed.');
      }
    };

    handleAuthRedirect();
  }, [navigate]);

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md p-8 rounded-3xl bg-card border border-border/80 shadow-2xl text-center space-y-6">
        {status === 'verifying' && (
          <div className="space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <div className="h-6 w-6 border-3 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Confirming Your Account</h2>
            <p className="text-xs text-muted-foreground">
              Verifying your email token with Supabase and preparing your academic workspace...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Email Confirmed!</h2>
            <p className="text-xs text-muted-foreground">
              Account successfully verified. Redirecting to your workspace...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
              <AlertCircle className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Verification Failed</h2>
            <p className="text-xs text-destructive font-medium">{errorMessage}</p>
            <button
              onClick={() => navigate('/login')}
              className="mt-4 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors"
            >
              Back to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
