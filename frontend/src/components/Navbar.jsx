import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Home, Users, Network, Menu, User, Settings, LogOut, X } from 'lucide-react';

export default function Navbar() {
  const { logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Members', path: '/members' },
    { name: 'Profile', path: '/profile' },
    { name: 'Tree', path: '/tree' },
    { name: 'Settings', path: '/settings' },
  ];

  const mobileNavItems = [
    { name: 'Dashboard', path: '/dashboard', icon: Home },
    { name: 'Members', path: '/members', icon: Users },
    { name: 'Tree', path: '/tree', icon: Network },
  ];

  const mobileMenuSheetItems = [
    { name: 'Profile', path: '/profile', icon: User },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  return (
    <>
      <style>{`
        .desktop-nav { display: none; }
        .mobile-nav { display: block; }
        @media (min-width: 768px) {
          .desktop-nav { display: block; }
          .mobile-nav { display: none; }
        }
      `}</style>

      {/* ---------------- DESKTOP NAVBAR ---------------- */}
      <div className="desktop-nav fixed top-6 left-1/2 -translate-x-1/2 z-[9999] w-auto">
        <header className="flex items-center h-[52px] px-2 bg-saas-card rounded-full shadow-2xl border border-white/10">
          {/* Nav Links */}
          <nav className="flex items-center h-full px-4 gap-6">
            {menuItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) => `
                  relative h-full flex items-center justify-center transition-all text-[15px] font-bold tracking-wide
                  ${isActive ? 'text-cyan-400' : 'text-black/80 hover:text-black'}
                `}
              >
                {({ isActive }) => (
                  <>
                    <span>{item.name}</span>
                    {isActive && (
                      <motion.div 
                        layoutId="nav-pill-underline-desktop"
                        className="absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r from-cyan-400 to-blue-500 rounded-t-full shadow-[0_-2px_10px_rgba(34,211,238,0.6)]"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Right side controls (Signout) */}
          <div className="flex items-center ml-2 mr-1">
            <button
              onClick={logout}
              className="px-6 py-2 bg-saas-card border border-white/10 hover:border-white/30 transition-all rounded-full text-black font-bold text-[14px] shadow-saas-hover"
            >
              Sign Out
            </button>
          </div>
        </header>
      </div>

      {/* ---------------- MOBILE NAVBAR ---------------- */}
      <div className="mobile-nav fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-[400px]">
        <header className="flex items-center justify-between h-[64px] px-2 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.2)]">
          <nav className="flex items-center h-full gap-2 w-full px-1">
            {mobileNavItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) => `
                  relative h-[48px] flex-1 flex flex-col items-center justify-center transition-all rounded-full group
                  ${isActive ? 'bg-white/10 text-cyan-400 shadow-[inset_0_0_15px_rgba(255,255,255,0.05),0_0_15px_rgba(34,211,238,0.2)]' : 'text-black/60 hover:text-black hover:bg-white/5'}
                `}
              >
                {({ isActive }) => (
                  <>
                    <item.icon className={`w-[22px] h-[22px] mb-0.5 ${isActive ? 'text-cyan-400' : 'text-black/60'}`} />
                    <span className="text-[9px] font-bold tracking-widest uppercase mt-0.5">{item.name}</span>
                    {isActive && (
                      <motion.div 
                        layoutId="nav-pill-mobile"
                        className="absolute inset-0 border border-white/20 rounded-full -z-10"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}

            {/* Hamburger Button */}
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="relative h-[48px] w-[48px] flex-shrink-0 flex items-center justify-center transition-all rounded-full bg-white/5 border border-white/10 text-black/80 hover:text-black hover:bg-white/10 shadow-[0_0_10px_rgba(255,255,255,0.05)] ml-1"
            >
              <Menu className="w-5 h-5" />
            </button>
          </nav>
        </header>
      </div>

      {/* ---------------- MOBILE SHEET MENU ---------------- */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="mobile-nav fixed inset-0 z-[10000] bg-black/40 backdrop-blur-sm"
            />
            
            {/* Sheet */}
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="mobile-nav fixed bottom-0 left-0 right-0 z-[10001] bg-[#1a1b26]/90 backdrop-blur-3xl border-t border-white/10 rounded-t-[32px] p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.3)] pb-8"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-black tracking-tight">More Options</h3>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-black transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {mobileMenuSheetItems.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-black font-bold"
                  >
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-cyan-400">
                      <item.icon className="w-5 h-5" />
                    </div>
                    {item.name}
                  </NavLink>
                ))}

                {/* Sign Out Button in Sheet */}
                <button 
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    logout();
                  }}
                  className="flex items-center gap-4 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 transition-all text-rose-400 font-bold mt-2"
                >
                  <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-500">
                    <LogOut className="w-5 h-5" />
                  </div>
                  Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
