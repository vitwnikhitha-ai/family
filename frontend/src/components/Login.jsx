import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, User, AlertCircle, Sparkles, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SignatureSplash from './SignatureSplash';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 4500); // 3s draw + 1s hold + 0.5s fade
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(username, password);
      navigate('/dashboard');
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
      navigate('/dashboard');
    } catch (err) {
      setError("Demo account hasn't been seeded. Boot backend first!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-transparent relative overflow-hidden px-4 py-12 font-sans selection:bg-purple-500/30">
      
      <AnimatePresence>
        {showSplash && <SignatureSplash key="splash" />}
      </AnimatePresence>
      
      {/* Liquid Glass Login Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[420px] bg-white/[0.02] border border-white/[0.08] rounded-[32px] p-10 backdrop-blur-[40px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] relative z-10 flex flex-col"
      >
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-[20px] bg-gradient-to-b from-white/10 to-white/0 p-[1px] shadow-[0_8px_16px_rgba(0,0,0,0.2)] mb-5 backdrop-blur-md overflow-hidden">
            <img src="/c47f1eaa-908f-416d-a75d-130098af05d7.png" alt="Maddali Logo" className="w-full h-full object-cover rounded-[20px]" />
          </div>
          <h1 className="font-semibold text-2xl text-black/90 tracking-[-0.02em]">MADDALI PORTAL</h1>
          <p className="text-black/40 text-sm mt-1.5 font-medium tracking-wide">Enterprise Authentication</p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-sm text-red-200/90 flex items-start gap-3 backdrop-blur-md"
          >
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-400" />
            <span className="leading-relaxed">{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Glass Capsule Input */}
          <div className="space-y-2">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-black/40 group-focus-within:text-black/80 transition-colors" />
              <input 
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.08] focus:border-white/20 rounded-full text-sm focus:outline-none transition-all text-black/90 font-medium placeholder:text-black/20 backdrop-blur-md"
                placeholder="Username"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 pointer-events-none" />
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-black/40 group-focus-within:text-black/80 transition-colors" />
              <input 
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-12 py-3.5 bg-white/[0.03] hover:bg-white/[0.05] border border-white/[0.08] focus:border-white/20 rounded-full text-sm focus:outline-none transition-all text-black/90 font-medium placeholder:text-black/20 backdrop-blur-md"
                placeholder="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-black/40 hover:text-black/80 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-[13px] pt-1 px-1">
            <label className="flex items-center gap-2.5 text-black/50 hover:text-black/70 cursor-pointer select-none transition-colors">
              <div className="relative flex items-center justify-center">
                <input 
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="peer appearance-none w-4 h-4 rounded border border-white/20 bg-white/5 checked:bg-white/20 checked:border-white/30 transition-all cursor-pointer"
                />
                <svg className="absolute w-2.5 h-2.5 pointer-events-none opacity-0 peer-checked:opacity-100 text-black transition-opacity" viewBox="0 0 14 14" fill="none">
                  <path d="M3 8L6 11L11 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="font-medium tracking-wide">Remember me</span>
            </label>
            
            <a href="#forgot" className="text-black/50 hover:text-black/90 font-medium transition-colors tracking-wide">
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full py-3.5 mt-4 rounded-full overflow-hidden transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            {/* Button Background Layers */}
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/80 via-purple-500/80 to-blue-500/80 backdrop-blur-md" />
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-indigo-400 via-purple-400 to-blue-400 transition-opacity duration-500" />
            <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
            
            <div className="relative flex items-center justify-center gap-2 text-black font-semibold text-[15px] tracking-wide">
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white animate-spin rounded-full" />
              ) : (
                <>
                  <span>Continue</span>
                  <ChevronRight className="w-4.5 h-4.5 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </div>
          </button>
        </form>


      </motion.div>
    </div>
  );
}
