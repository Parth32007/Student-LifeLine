import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { Topbar } from '../components/Topbar';
import { CommandPalette } from '../components/CommandPalette';
import { FocusModeModal } from '../components/FocusModeModal';
import { logoutUser } from '../services/supabase';
import { Task } from '../types';

import { getActiveSession } from '../services/staticStorage';

export const MainLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [focusModeOpen, setFocusModeOpen] = useState(false);
  const [activeFocusTask, setActiveFocusTask] = useState<Task | null>(null);
  const session = getActiveSession();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutUser();
    navigate('/login');
  };

  const handleStartFocus = (task?: Task) => {
    if (task) setActiveFocusTask(task);
    setFocusModeOpen(true);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
      {/* Sidebar with Mobile Drawer & Desktop Collapsible Support */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        onLogout={handleLogout}
        onOpenFocusMode={() => handleStartFocus()}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Viewport */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Topbar
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          onOpenFocusMode={() => handleStartFocus()}
          userEmail={session?.user?.email || 'student@lifeos.academic'}
          onLogout={handleLogout}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">
            <Outlet context={{ onStartFocus: handleStartFocus }} />
          </div>
        </main>
      </div>

      {/* Global Command Center (Cmd+K) */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />

      {/* Global Focus Mode (Pomodoro) */}
      <FocusModeModal
        isOpen={focusModeOpen}
        onClose={() => {
          setFocusModeOpen(false);
          setActiveFocusTask(null);
        }}
        activeTask={activeFocusTask}
      />
    </div>
  );
};
