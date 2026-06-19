import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  Settings, 
  User, 
  Network, 
  HelpCircle, 
  Mail, 
  FileText, 
  Power,
  ChevronLeft,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ isOpen, setIsOpen }) {
  const { logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: Home },
    { name: 'Family Members', path: '/members', icon: FileText },
    { name: 'Family Tree', path: '/tree', icon: Network },
    { name: 'Profile', path: '/members?profileId=root', icon: User },
    { name: 'MailBox', path: '/mail', icon: Mail },
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  const sidebarWidth = isCollapsed ? 'w-20' : 'w-64';

  return (
    <>
      {/* Mobile Menu Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-sm lg:hidden transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Floating Modern Collapsible Sidebar */}
      <aside 
        className={`fixed top-4 bottom-4 left-4 z-40 ${sidebarWidth} bg-saas-card/85 border border-saas-border rounded-2xl flex flex-col justify-between py-6 px-4 shadow-saas-premium backdrop-blur-lg transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:z-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="flex flex-col gap-6">
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-2`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden shadow-md shadow-saas-primary/20 flex items-center justify-center bg-white/5">
                <img src="/c47f1eaa-908f-416d-a75d-130098af05d7.png" alt="Maddali Logo" className="w-full h-full object-cover" />
              </div>
              {!isCollapsed && (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="font-black text-sm text-black tracking-wider uppercase"
                >
                  Maddali
                </motion.div>
              )}
            </div>

            {/* Collapse Button (large screens only) */}
            {!isCollapsed && (
              <button 
                onClick={() => setIsCollapsed(true)}
                className="hidden lg:flex p-1.5 rounded-lg border border-saas-border hover:bg-saas-bg text-black/70 hover:text-black transition-all"
                title="Collapse Sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5 mt-4">
            {menuItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={({ isActive }) => `
                  w-full h-11 px-3 rounded-xl flex items-center gap-3.5 transition-all relative group
                  ${isActive 
                    ? 'text-black font-semibold' 
                    : 'text-black/70 hover:text-black hover:bg-saas-bg/50'
                  }
                `}
              >
                {({ isActive }) => (
                  <>
                    {/* Active Route background animation */}
                    {isActive && (
                      <motion.div 
                        layoutId="sidebar-active"
                        className="absolute inset-0 bg-gradient-to-r from-saas-primary to-saas-accent rounded-xl -z-10 shadow-sm shadow-saas-primary/10"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    
                    <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-black' : 'text-black/70 group-hover:text-black'}`} />
                    
                    {!isCollapsed && (
                      <motion.span 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs font-semibold"
                      >
                        {item.name}
                      </motion.span>
                    )}

                    {/* Collapsed Tooltip */}
                    {isCollapsed && (
                      <div className="absolute left-20 top-2.5 z-50 bg-slate-900 text-black text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 shadow-lg whitespace-nowrap">
                        {item.name}
                      </div>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Footer controls */}
        <div className="flex flex-col gap-3">
          {/* Expand toggler when collapsed */}
          {isCollapsed && (
            <button 
              onClick={() => setIsCollapsed(false)}
              className="hidden lg:flex w-10 h-10 mx-auto items-center justify-center rounded-xl border border-saas-border hover:bg-saas-bg text-black/70 transition-all"
              title="Expand Sidebar"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {/* Logout button */}
          <button
            onClick={logout}
            className={`w-full h-11 px-3 rounded-xl flex items-center gap-3.5 transition-all text-rose-500 hover:bg-rose-500/10 relative group ${isCollapsed ? 'justify-center' : ''}`}
            title="Sign Out"
          >
            <Power className="w-5 h-5 flex-shrink-0" />
            {!isCollapsed && (
              <span className="text-xs font-bold">Sign Out</span>
            )}
            {isCollapsed && (
              <div className="absolute left-20 top-2.5 z-50 bg-slate-900 text-black text-[10px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 shadow-lg">
                Logout
              </div>
            )}
          </button>
        </div>

      </aside>
    </>
  );
}
