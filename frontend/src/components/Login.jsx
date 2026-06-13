import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, User, AlertCircle, Sparkles, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setUsername('nikhil');
    setPassword('nikhil123');
    setError(null);
    setLoading(true);
    try {
      await login('nikhil', 'nikhil123');
      navigate('/');
    } catch (err) {
      setError("Demo account hasn't been seeded. Boot backend first!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#090D16] relative overflow-hidden px-4 py-12">
      
      {/* Immersive Animated Gradient Background Blobs */}
      <motion.div 
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 50, 0],
          y: [0, -30, 0]
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-br from-blue-600/35 to-violet-600/25 blur-[120px] pointer-events-none" 
      />
      <motion.div 
        animate={{
          scale: [1, 1.3, 1],
          x: [0, -40, 0],
          y: [0, 60, 0]
        }}
        transition={{
          duration: 16,
          repeat: Infinity,
          ease: 'easeInOut'
        }}
        className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-gradient-to-tr from-violet-600/30 to-fuchsia-600/20 blur-[120px] pointer-events-none" 
      />
      
      {/* Elegant grid overlay line decoration */}
      <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />

      {/* Glassmorphic Login Card */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-[460px] bg-slate-900/60 border border-white/10 rounded-3xl p-8 backdrop-blur-2xl shadow-2xl relative z-10 space-y-6 flex flex-col justify-between"
      >
        {/* Header Logo with Luxury Family Crest styling */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-violet-600 to-fuchsia-600 p-[1px] shadow-lg shadow-violet-500/25">
            <div className="w-full h-full rounded-2xl bg-slate-950 flex items-center justify-center text-white">
              <Sparkles className="w-7 h-7 text-transparent bg-clip-text bg-gradient-to-tr from-blue-400 to-fuchsia-400 fill-white/10" />
            </div>
          </div>
          <div>
            <h1 className="font-black text-3xl text-white tracking-tight uppercase">Maddali Portal</h1>
            <p className="text-slate-400 text-xs mt-1">Genealogy Visualization & Lineage Management</p>
          </div>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs text-rose-400 flex items-start gap-2.5 animate-shake"
          >
            <AlertCircle className="w-4.5 h-4.5 flex-shrink-0 mt-0.5 text-rose-500" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Username Input */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Username</label>
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              <input 
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-950/40 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-slate-950 transition-all text-white font-medium"
                placeholder="Enter username"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              <input 
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-950/40 border border-white/10 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-slate-950 transition-all text-white font-medium"
                placeholder="Enter password"
              />
            </div>
          </div>

          {/* Remember Me & Forgot Password Row */}
          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 text-slate-400 cursor-pointer select-none">
              <input 
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-white/10 bg-slate-950/40 text-blue-600 focus:ring-0 focus:ring-offset-0 w-4 h-4"
              />
              <span>Remember me</span>
            </label>
            
            <a href="#forgot" className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
              Forgot password?
            </a>
          </div>

          {/* Login Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-violet-600 hover:opacity-95 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-900/20 hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer mt-6"
          >
            {loading && <div className="w-4.5 h-4.5 border-2 border-white border-t-transparent animate-spin rounded-full" />}
            <span>Continue</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </form>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-white/5"></div>
          <span className="flex-shrink mx-4 text-slate-500 text-[9px] font-black uppercase tracking-widest">Or login using</span>
          <div className="flex-grow border-t border-white/5"></div>
        </div>

        {/* Premium Social Login support buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button 
            type="button"
            onClick={handleDemoLogin}
            className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
              <path d="M12.24 10.285V13.4h6.887c-.648 2.41-2.519 4.13-5.136 4.13A5.71 5.71 0 018.2 11.83a5.71 5.71 0 015.79-5.7 5.66 5.66 0 013.93 1.55l2.45-2.45A9.03 9.03 0 0013.99 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c4.76 0 8.87-3.4 9-8H12.24z"/>
            </svg>
            <span>Google</span>
          </button>
          
          <button 
            type="button"
            onClick={handleDemoLogin}
            className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-bold text-white transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.1.09 2.23-.58 2.95-1.39z"/>
            </svg>
            <span>Apple</span>
          </button>
        </div>

        {/* Demo Fast Login info */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-3 text-[10px] text-blue-400 text-center leading-relaxed">
          <span className="font-extrabold text-blue-300">Sandbox Preview:</span> Click Google or Apple button to bypass verification and log in instantly with the seeded administrator account!
        </div>

      </motion.div>
    </div>
  );
}
