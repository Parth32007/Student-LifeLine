import { createClient } from '@supabase/supabase-js';
import {
  registerUser,
  loginUser,
  getActiveSession,
  setActiveSession,
  logoutCurrentUser,
  updateActiveUserProfile,
  DEMO_USER,
  RegisteredUser,
  UserSession,
} from './staticStorage';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mock-supabase.local';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'mock-anon-key';

export const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL &&
  import.meta.env.VITE_SUPABASE_ANON_KEY &&
  import.meta.env.VITE_SUPABASE_URL !== 'https://your-project.supabase.co' &&
  !import.meta.env.VITE_SUPABASE_URL.includes('mock-supabase')
);

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type { UserSession };

export interface SignUpPayload {
  email: string;
  password?: string;
  fullName: string;
  university?: string;
  course?: string;
  semester?: number;
  educationLevel?: string;
  dailyHours?: number;
  goals?: string;
  subjects?: Array<{ name: string; code?: string; color?: string; target_grade?: string }>;
}

const PENDING_REGISTRATION_KEY = 'lifeos_pending_registration';
const MOCK_OTP_KEY = 'lifeos_mock_verification_code';

export function getPendingRegistration(): SignUpPayload | null {
  const data = localStorage.getItem(PENDING_REGISTRATION_KEY);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function clearPendingRegistration(): void {
  localStorage.removeItem(PENDING_REGISTRATION_KEY);
  localStorage.removeItem(MOCK_OTP_KEY);
}

/**
 * Persist gathered profile & academic profile data directly
 */
export async function saveUserProfileData(userId: string, data: Partial<SignUpPayload>): Promise<void> {
  updateActiveUserProfile({
    full_name: data.fullName,
    email: data.email,
    university: data.university,
    course: data.course,
    semester: data.semester,
    daily_hours: data.dailyHours,
    goals: data.goals,
  });

  if (isSupabaseConfigured) {
    try {
      if (data.fullName) {
        await supabase.from('profiles').upsert({
          id: userId,
          full_name: data.fullName,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });
      }

      await supabase.from('academic_profiles').upsert({
        user_id: userId,
        education_level: data.educationLevel || 'Undergraduate',
        college_university: data.university || null,
        course: data.course || null,
        semester: Number(data.semester || 1),
        daily_available_hours: Number(data.dailyHours || 4.0),
        goals: data.goals ? [data.goals] : ['Master course curriculum and ace exams'],
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });
    } catch (err) {
      console.warn('Supabase sync note:', err);
    }
  }
}

/**
 * Sign Up with full academic data collection and immediate session creation on the spot
 */
export async function signUpWithProfile(payload: SignUpPayload): Promise<{
  needsEmailVerification: boolean;
  session: UserSession;
  user: any;
}> {
  clearPendingRegistration();

  // Register in local static storage engine
  const { user, session } = registerUser({
    fullName: payload.fullName,
    email: payload.email,
    password: payload.password,
    university: payload.university,
    course: payload.course,
    semester: payload.semester,
    educationLevel: payload.educationLevel,
    dailyHours: payload.dailyHours,
    goals: payload.goals,
    subjects: payload.subjects,
  });

  if (isSupabaseConfigured) {
    try {
      const { data } = await supabase.auth.signUp({
        email: payload.email,
        password: payload.password || 'password123',
        options: {
          data: {
            full_name: payload.fullName,
            university: payload.university,
            course: payload.course,
            semester: payload.semester,
          },
        },
      });
      if (data?.user) {
        await saveUserProfileData(data.user.id, payload);
      }
    } catch (e) {
      console.warn('Supabase cloud signup note:', e);
    }
  }

  return {
    needsEmailVerification: false,
    session,
    user,
  };
}

/**
 * Verify Email with 6-digit OTP token (Mock / Supabase)
 */
export async function verifyEmailOtp(email: string, token: string): Promise<UserSession> {
  const pending = getPendingRegistration();
  clearPendingRegistration();
  return loginUser(email);
}

/**
 * Skip email verification and proceed directly to workspace
 */
export async function skipVerificationAndLogin(payload?: Partial<SignUpPayload>): Promise<UserSession> {
  const pending = payload || getPendingRegistration();
  const res = registerUser({
    fullName: pending?.fullName || 'Student',
    email: pending?.email || 'student@university.edu',
    university: pending?.university || 'University of Science & Tech',
    course: pending?.course || 'Computer Science',
    semester: pending?.semester || 4,
    dailyHours: pending?.dailyHours || 4,
    goals: pending?.goals,
  });
  clearPendingRegistration();
  return res.session;
}

/**
 * Resend Email Verification Code
 */
export async function resendVerificationEmail(email: string): Promise<{ success: boolean; message: string }> {
  return { success: true, message: 'Demo verification code sent! (Code: 123456)' };
}

/**
 * Create a full preloaded demo user session (Alex Rivera)
 */
export function createDemoUserSession(): UserSession {
  return loginUser(DEMO_USER.email, DEMO_USER.password);
}

/**
 * Standard Sign In with email and password
 */
export async function signInUser(email: string, password?: string): Promise<UserSession> {
  const cleanEmail = email.trim().toLowerCase();

  // If Supabase is configured, attempt cloud auth first
  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password || 'password123',
      });
      if (!error && data.session && data.user) {
        const session: UserSession = {
          user: {
            id: data.user.id,
            email: data.user.email || cleanEmail,
            full_name: data.user.user_metadata?.full_name,
          },
          access_token: data.session.access_token,
        };
        setActiveSession(session);
        return session;
      }
    } catch {
      // fallback to local static authentication
    }
  }

  // Local static authentication (or auto-register on the spot)
  return loginUser(cleanEmail, password);
}

/**
 * Sign in with Google using Supabase OAuth or instant demo
 */
export async function signInWithGoogle(): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      return;
    } catch {
      // fallback
    }
  }
  createDemoUserSession();
  window.location.href = '/dashboard';
}

/**
 * Send password reset email
 */
export async function resetUserPassword(email: string): Promise<{ success: boolean; message: string }> {
  return { success: true, message: `Password reset instructions sent to ${email} (Static Mode).` };
}

/**
 * Check and return the current active session
 */
export async function getCurrentSession(): Promise<UserSession | null> {
  return getActiveSession();
}

export function setLocalMockSession(user: {
  id: string;
  email: string;
  full_name?: string;
  university?: string;
  course?: string;
  semester?: number;
}): UserSession {
  const session: UserSession = {
    user,
    access_token: `token_${user.id}_${Date.now()}`,
  };
  setActiveSession(session);
  return session;
}

export async function logoutUser(): Promise<void> {
  if (isSupabaseConfigured) {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Sign out warning:', err);
    }
  }
  clearPendingRegistration();
  logoutCurrentUser();
}
