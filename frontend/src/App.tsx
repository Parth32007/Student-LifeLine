import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getCurrentSession } from './services/supabase';
import { MainLayout } from './layouts/MainLayout';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { SignUp } from './pages/SignUp';
import { EmailVerification } from './pages/EmailVerification';
import { AuthCallback } from './pages/AuthCallback';
import { Onboarding } from './pages/Onboarding';
import { Dashboard } from './pages/Dashboard';
import { Tutor } from './pages/Tutor';
import { Planner } from './pages/Planner';
import { KnowledgeVault } from './pages/KnowledgeVault';
import { Subjects } from './pages/Subjects';
import { Flashcards } from './pages/Flashcards';
import { Quizzes } from './pages/Quizzes';
import { Assignments } from './pages/Assignments';
import { TasksProjects } from './pages/TasksProjects';
import { Timetable } from './pages/Timetable';
import { CalendarExams } from './pages/CalendarExams';
import { GoalTracker } from './pages/GoalTracker';
import { AttendanceAchievements } from './pages/AttendanceAchievements';
import { ExportReports } from './pages/ExportReports';
import { Analytics } from './pages/Analytics';
import { Mistakes } from './pages/Mistakes';
import { Settings } from './pages/Settings';
import { SubjectProvider } from './context/SubjectContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

/**
 * Root Route:
 * If authenticated -> renders MainLayout with Dashboard
 * If unauthenticated -> renders Landing Page
 */
const RootRoute: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      getCurrentSession().then((session) => {
        setAuthenticated(!!session);
        setLoading(false);
      });
    };

    checkAuth();
    window.addEventListener('storage', checkAuth);
    window.addEventListener('lifeos:auth-change', checkAuth);
    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('lifeos:auth-change', checkAuth);
    };
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background text-foreground text-xs">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!authenticated) {
    return <Landing />;
  }

  return <Navigate to="/dashboard" replace />;
};

/**
 * Protected Route wrapper for workspace pages
 */
const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      getCurrentSession().then((session) => {
        setAuthenticated(!!session);
        setLoading(false);
      });
    };

    checkAuth();
    window.addEventListener('storage', checkAuth);
    window.addEventListener('lifeos:auth-change', checkAuth);
    return () => {
      window.removeEventListener('storage', checkAuth);
      window.removeEventListener('lifeos:auth-change', checkAuth);
    };
  }, []);

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background text-foreground text-xs">
        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <SubjectProvider>
        <BrowserRouter>
          <Routes>
            {/* Root Route: Landing Page / Dashboard if authenticated */}
            <Route path="/" element={<RootRoute />} />

            {/* Public Landing & Authentication Routes */}
            <Route path="/landing" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/register" element={<SignUp />} />
            <Route path="/verify-email" element={<Navigate to="/dashboard" replace />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/onboarding" element={<Onboarding />} />

            {/* Protected Main Academic Workspace */}
            <Route
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/tutor" element={<Tutor />} />
              <Route path="/ask-student-lifeline" element={<Tutor />} />
              <Route path="/ask-lifeos" element={<Tutor />} />
              <Route path="/planner" element={<CalendarExams />} />
              <Route path="/vault" element={<KnowledgeVault />} />
              <Route path="/subjects" element={<Subjects />} />
              <Route path="/flashcards" element={<Flashcards />} />
              <Route path="/quizzes" element={<Quizzes />} />
              <Route path="/coding" element={<Navigate to="/dashboard" replace />} />
              <Route path="/tasks-projects" element={<TasksProjects />} />
              <Route path="/assignments" element={<TasksProjects />} />
              <Route path="/calendar-exams" element={<CalendarExams />} />
              <Route path="/timetable" element={<CalendarExams />} />
              <Route path="/goals" element={<GoalTracker />} />
              <Route path="/achievements" element={<AttendanceAchievements />} />
              <Route path="/mentor" element={<Navigate to="/analytics" replace />} />
              <Route path="/export" element={<ExportReports />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/mistakes" element={<Mistakes />} />
              <Route path="/settings" element={<Settings />} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </SubjectProvider>
    </QueryClientProvider>
  );
};

export default App;
