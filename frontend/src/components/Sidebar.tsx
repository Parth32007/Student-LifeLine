import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  CheckSquare,
  Sparkles,
  Bot,
  FolderLock,
  Layers,
  HelpCircle,
  CalendarDays,
  Calendar,
  Target,
  Timer,
  BarChart3,
  Award,
  Download,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Sun,
  Moon,
  User,
  Settings,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';
import { getCurrentSession, logoutUser } from '../services/supabase';
import { getActiveSession, deriveNameFromEmail } from '../services/staticStorage';
import { api } from '../services/api';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onLogout?: () => void;
  onOpenFocusMode?: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

interface NavSubItem {
  to?: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  onClick?: () => void;
}

interface NavSection {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavSubItem[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggle,
  onLogout,
  onOpenFocusMode,
  mobileOpen = false,
  onMobileClose,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const initialSession = getActiveSession();

  const [userName, setUserName] = useState(
    initialSession?.user?.full_name ||
      (initialSession?.user?.email ? deriveNameFromEmail(initialSession.user.email) : 'LifeOS Student')
  );
  const [userEmail, setUserEmail] = useState(initialSession?.user?.email || 'student@lifeos.academic');
  const [userCourse, setUserCourse] = useState(initialSession?.user?.course || 'Computer Science');
  const [userUniversity, setUserUniversity] = useState(
    initialSession?.user?.university || 'University of Science & Tech'
  );
  const [userSemester, setUserSemester] = useState(initialSession?.user?.semester || 4);

  const [isDark, setIsDark] = useState(() =>
    typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false
  );

  // Four collapsible sections, ALL COLLAPSED BY DEFAULT as requested
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    academics: false,
    aiHub: false,
    planning: false,
    performance: false,
  });

  const profileRef = useRef<HTMLDivElement>(null);

  // Synchronize theme with global events and storage
  useEffect(() => {
    const handleThemeChange = (e: any) => {
      setIsDark(e.detail?.isDark ?? document.documentElement.classList.contains('dark'));
    };
    window.addEventListener('lifeos:theme-change', handleThemeChange);
    return () => window.removeEventListener('lifeos:theme-change', handleThemeChange);
  }, []);

  // Load active student profile details
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const session = await getCurrentSession();
        if (session?.user) {
          const name = session.user.full_name || deriveNameFromEmail(session.user.email);
          setUserName(name);
          setUserEmail(session.user.email);
          if (session.user.course) setUserCourse(session.user.course);
          if (session.user.university) setUserUniversity(session.user.university);
          if (session.user.semester) setUserSemester(Number(session.user.semester));
        }

        try {
          const profile = await api.getProfile();
          if (profile?.full_name) {
            setUserName(profile.full_name);
          }
          const academic = await api.getAcademicProfile();
          if (academic?.college_university) {
            setUserUniversity(academic.college_university);
          }
          if (academic?.course) {
            setUserCourse(academic.course);
          }
          if (academic?.semester) {
            setUserSemester(Number(academic.semester));
          }
        } catch {
          // fallback
        }
      } catch {
        // fallback
      }
    };

    loadUserData();
    window.addEventListener('storage', loadUserData);
    window.addEventListener('lifeos:auth-change', loadUserData);
    window.addEventListener('lifeos:data-change', loadUserData);
    return () => {
      window.removeEventListener('storage', loadUserData);
      window.removeEventListener('lifeos:auth-change', loadUserData);
      window.removeEventListener('lifeos:data-change', loadUserData);
    };
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setProfileMenuOpen(false);
    if (onLogout) {
      onLogout();
    } else {
      await logoutUser();
      navigate('/login');
    }
  };

  const toggleTheme = (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const getInitials = (name: string): string => {
    if (!name) return 'ST';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const toggleSection = (sectionId: string) => {
    if (collapsed) {
      onToggle(); // expand sidebar if user clicks a section header while collapsed
    }
    setOpenSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  // The four organized categories
  const sections: NavSection[] = [
    {
      id: 'academics',
      title: 'Academics',
      icon: GraduationCap,
      items: [
        { to: '/subjects', label: 'Subjects & Syllabus', icon: BookOpen },
        { to: '/tasks-projects', label: 'Tasks & Projects', icon: CheckSquare },
      ],
    },
    {
      id: 'aiHub',
      title: 'AI Study Hub',
      icon: Sparkles,
      items: [
        { to: '/tutor', label: 'Ask Student Lifeline', icon: Bot, badge: 'AI' },
        { to: '/vault', label: 'Knowledge Vault', icon: FolderLock },
        { to: '/flashcards', label: 'Flashcards', icon: Layers, badge: 'SM-2' },
        { to: '/quizzes', label: 'Quizzes & Exams', icon: HelpCircle },
      ],
    },
    {
      id: 'planning',
      title: 'Planning & Focus',
      icon: CalendarDays,
      items: [
        { to: '/calendar-exams', label: 'Calendar & Exams', icon: Calendar },
        { to: '/goals', label: 'Goal Tracker', icon: Target },
        {
          label: 'Focus Pomodoro',
          icon: Timer,
          badge: '25m',
          onClick: () => {
            if (onOpenFocusMode) onOpenFocusMode();
          },
        },
      ],
    },
    {
      id: 'performance',
      title: 'Performance & Reports',
      icon: BarChart3,
      items: [
        { to: '/analytics', label: 'Analytics', icon: BarChart3 },
        { to: '/achievements', label: 'Attendance & Badges', icon: Award },
        { to: '/export', label: 'Export Reports', icon: Download },
      ],
    },
  ];

  // Helper to check if any sub-item in section is active
  const isSectionActive = (section: NavSection): boolean => {
    return section.items.some((item) => item.to && location.pathname.startsWith(item.to));
  };

  return (
    <>
      {/* Mobile Drawer Backdrop Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          'flex flex-col border-r border-border bg-card/95 backdrop-blur-2xl transition-all duration-300 z-50 select-none',
          'fixed inset-y-0 left-0 max-w-[285px] w-full transform md:relative md:translate-x-0',
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0',
          collapsed ? 'md:w-20' : 'md:w-64'
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-border/60 shrink-0">
          {(!collapsed || mobileOpen) && (
            <div className="flex items-center space-x-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm dark:bg-gradient-to-tr dark:from-indigo-600 dark:via-indigo-500 dark:to-purple-500 dark:text-white">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <span className="text-base font-bold tracking-tight text-foreground dark:bg-gradient-to-r dark:from-indigo-500 dark:via-purple-500 dark:to-pink-500 dark:bg-clip-text dark:text-transparent">
                  Student Lifeline
                </span>
              </div>
            </div>
          )}

          {collapsed && !mobileOpen && (
            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm dark:bg-gradient-to-tr dark:from-indigo-600 dark:to-purple-500 dark:text-white">
              <Sparkles className="h-5 w-5" />
            </div>
          )}

          {/* Desktop Toggle Button */}
          <button
            onClick={onToggle}
            className="hidden md:flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>

          {/* Mobile Close Button */}
          {mobileOpen && (
            <button
              onClick={onMobileClose}
              className="md:hidden flex h-8 w-8 items-center justify-center rounded-xl text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              title="Close navigation menu"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Nav List with Standalone Dashboard & 4 Collapsible Categories */}
        <div className="flex-1 overflow-y-auto py-3 px-2.5 space-y-3 scrollbar-thin">
          {/* 1. Standalone Dashboard */}
          <div>
            <NavLink
              to="/dashboard"
              onClick={() => onMobileClose?.()}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )
              }
            >
              <LayoutDashboard className="h-5 w-5 shrink-0 transition-transform group-hover:scale-105" />
              {(!collapsed || mobileOpen) && <span className="flex-1 font-semibold truncate">Dashboard</span>}
            </NavLink>
          </div>

          {/* Divider */}
          <div className="border-t border-border/50 my-2" />

          {/* 2. Four Collapsible Categories */}
          <div className="space-y-1.5">
            {sections.map((section) => {
              const isOpen = !!openSections[section.id];
              const hasActiveRoute = isSectionActive(section);
              const SectionIcon = section.icon;

              return (
                <div key={section.id} className="space-y-1">
                  {/* Collapsible Section Header Trigger */}
                  <button
                    onClick={() => toggleSection(section.id)}
                    className={cn(
                      'w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-xs font-bold transition-colors text-left group',
                      hasActiveRoute && !isOpen
                        ? 'text-primary bg-secondary/50'
                        : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground'
                    )}
                    title={collapsed && !mobileOpen ? section.title : undefined}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <SectionIcon className="h-4 w-4 shrink-0 group-hover:scale-105 transition-transform text-primary/80" />
                      {(!collapsed || mobileOpen) && (
                        <span className="truncate tracking-wide">{section.title}</span>
                      )}
                    </div>

                    {(!collapsed || mobileOpen) && (
                      <div className="flex items-center gap-1.5">
                        {hasActiveRoute && !isOpen && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        )}
                        <ChevronDown
                          className={cn(
                            'h-3.5 w-3.5 text-muted-foreground transition-transform duration-200',
                            isOpen && 'rotate-180 text-foreground'
                          )}
                        />
                      </div>
                    )}
                  </button>

                  {/* Sub-items (Expandable Drawer) */}
                  {isOpen && (!collapsed || mobileOpen) && (
                    <div className="pl-3.5 pr-1 space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-150 border-l border-border/60 ml-3.5 my-1">
                      {section.items.map((item, idx) => {
                        const ItemIcon = item.icon;

                        if (item.to) {
                          return (
                            <NavLink
                              key={item.to || idx}
                              to={item.to}
                              onClick={() => onMobileClose?.()}
                              className={({ isActive }) =>
                                cn(
                                  'flex items-center justify-between gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors',
                                  isActive
                                    ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                                )
                              }
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <ItemIcon className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">{item.label}</span>
                              </div>
                              {item.badge && (
                                <span className="rounded-md bg-secondary/90 px-1 py-0.2 text-[9px] font-bold text-primary">
                                  {item.badge}
                                </span>
                              )}
                            </NavLink>
                          );
                        }

                        return (
                          <button
                            key={idx}
                            onClick={() => {
                              item.onClick?.();
                              onMobileClose?.();
                            }}
                            className="w-full flex items-center justify-between gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors text-left"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <ItemIcon className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                              <span className="truncate">{item.label}</span>
                            </div>
                            {item.badge && (
                              <span className="rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-1 py-0.2 text-[9px] font-bold">
                                {item.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
          })}
        </div>
      </div>

      {/* Profile & Settings at Bottom Left Corner */}
      <div ref={profileRef} className="p-2.5 border-t border-border/60 relative shrink-0">
        {/* Floating Profile Popover Menu */}
        {profileMenuOpen && (
          <div
            className={cn(
              'absolute bottom-full mb-2 z-50 rounded-2xl bg-card border border-border shadow-2xl p-3 backdrop-blur-2xl animate-in fade-in slide-in-from-bottom-2 duration-150 space-y-2',
              collapsed ? 'left-2 w-64' : 'left-2 right-2'
            )}
          >
            <div className="pb-2.5 mb-1 border-b border-border/60 space-y-1">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shadow-sm">
                  {getInitials(userName)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs text-foreground truncate">{userName}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{userEmail}</div>
                </div>
              </div>
            </div>

            <div className="space-y-1 text-xs">
              <NavLink
                to="/settings"
                onClick={() => setProfileMenuOpen(false)}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-secondary text-foreground text-left transition-colors"
              >
                <Settings className="h-3.5 w-3.5 text-muted-foreground" />
                <span>Account & Preferences</span>
              </NavLink>

              <button
                type="button"
                onClick={toggleTheme}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-secondary text-foreground text-left transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  {isDark ? <Sun className="h-3.5 w-3.5 text-amber-400" /> : <Moon className="h-3.5 w-3.5 text-primary" />}
                  <span>Theme</span>
                </span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase">
                  {isDark ? 'Dark' : 'Light'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 text-left transition-colors cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}

        {/* Compact Bottom Profile Trigger */}
        <div
          onClick={() => setProfileMenuOpen(!profileMenuOpen)}
          className="flex items-center gap-2.5 p-2 rounded-2xl hover:bg-secondary/70 transition-colors cursor-pointer"
        >
          <div className="h-8 w-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
            {getInitials(userName)}
          </div>
          {(!collapsed || mobileOpen) && (
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-foreground truncate">{userName}</div>
              <div className="text-[10px] text-muted-foreground truncate">{userCourse}</div>
            </div>
          )}
        </div>
      </div>
    </aside>
    </>
  );
};

export default Sidebar;
