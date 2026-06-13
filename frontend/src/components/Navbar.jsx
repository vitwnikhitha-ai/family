import React from 'react';
import { Menu, Bell, Settings, Plus, User, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate } from 'react-router-dom';

export default function Navbar({ onMenuClick }) {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-saas-border bg-saas-card/70 backdrop-blur-md px-6 md:px-8">
      
      {/* Left side: Mobile menu toggle + Page title placeholder */}
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-saas-text-secondary hover:bg-saas-bg hover:text-saas-text-primary transition-all"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="hidden sm:inline text-xs font-bold text-saas-text-secondary tracking-wide uppercase bg-saas-bg px-3 py-1.5 rounded-lg border border-saas-border">
          Enterprise Portal
        </span>
      </div>

      {/* Right side controls */}
      <div className="flex items-center gap-4">
        
        {/* Dark/Light mode toggle */}
        <button 
          onClick={toggleTheme}
          className="w-9 h-9 rounded-xl border border-saas-border bg-saas-card hover:bg-saas-bg text-saas-text-secondary hover:text-saas-text-primary flex items-center justify-center transition-all shadow-sm"
          title="Toggle Light/Dark Theme"
        >
          {theme === 'light' ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5" />}
        </button>

        {/* Settings circular button */}
        <button 
          onClick={() => navigate('/settings')}
          className="w-9 h-9 rounded-xl border border-saas-border bg-saas-card hover:bg-saas-bg text-saas-text-secondary hover:text-saas-text-primary flex items-center justify-center transition-all shadow-sm"
          title="Settings"
        >
          <Settings className="w-4.5 h-4.5" />
        </button>

        {/* Notification bell (Sky background with badge) */}
        <button className="relative w-9 h-9 rounded-xl border border-saas-border bg-saas-card hover:bg-saas-bg text-saas-text-secondary hover:text-saas-text-primary flex items-center justify-center transition-all shadow-sm">
          <Bell className="w-4.5 h-4.5" />
          <span className="absolute -top-1 -right-1 bg-saas-primary text-white font-extrabold text-[8px] rounded-full w-4 h-4 flex items-center justify-center ring-2 ring-saas-card">
            2
          </span>
        </button>

        {/* Create a Tree pill button */}
        <button 
          onClick={() => navigate('/members?action=add')}
          className="bg-gradient-to-r from-saas-primary to-saas-accent hover:opacity-95 text-white text-xs font-semibold px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-md shadow-saas-primary/15 transition-all hover:-translate-y-0.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Member</span>
        </button>

        <div className="h-6 w-px bg-saas-border hidden sm:block" />

        {/* User profile dropdown info */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-saas-accent/20 to-saas-primary/20 border border-saas-border overflow-hidden flex items-center justify-center">
            <User className="w-4.5 h-4.5 text-saas-primary" />
          </div>
          <span className="text-xs font-bold text-saas-text-primary uppercase tracking-wide hidden sm:block">
            {user?.username || 'Guest'}
          </span>
        </div>

      </div>

    </header>
  );
}
