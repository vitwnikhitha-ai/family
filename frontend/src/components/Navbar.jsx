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
        


      </div>

    </header>
  );
}
