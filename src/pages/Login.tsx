import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useConfig } from '../context/ConfigContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, User, Eye, EyeOff, Activity, ShoppingCart, Sparkles, ShieldAlert } from 'lucide-react';

const Login: React.FC = () => {
  const { login } = useAuth();
  const { config } = useConfig();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const usernameRef = useRef<HTMLInputElement>(null);

  // Auto-focus username field on mount
  useEffect(() => {
    usernameRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please fill in all credential fields.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Small timeout to allow visual feedback for the cryptographic hash computation
      await new Promise(resolve => setTimeout(resolve, 600));
      const result = await login(username, password);
      if (!result.success) {
        setError(result.error || 'Invalid credentials. Please try again.');
      }
    } catch (err) {
      setError('An unexpected system transaction error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dynamically select shop type icon for premium feel
  const renderShopIcon = () => {
    const type = config?.shop_info.type?.toLowerCase();
    const style = { color: 'var(--primary, #2563eb)' };

    if (type === 'pharmacy' || type === 'medical') {
      return <Activity className="w-10 h-10 animate-pulse" style={style} />;
    }
    return <ShoppingCart className="w-10 h-10" style={style} />;
  };

  return (
    <div className="relative flex min-h-screen w-screen items-center justify-center overflow-hidden bg-slate-950 px-4">
      {/* Dynamic Background Neon Blobs for Rich Visual Aesthetics */}
      <div className="absolute top-1/4 left-1/4 -z-10 h-96 w-96 rounded-full bg-blue-600/10 blur-[120px] transition-all duration-1000"></div>
      <div className="absolute bottom-1/4 right-1/4 -z-10 h-96 w-96 rounded-full bg-emerald-600/10 blur-[120px] transition-all duration-1000"></div>

      {/* Main Glassmorphic Login Card container */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-xl p-8 shadow-2xl shadow-black/50"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <motion.div
            initial={{ scale: 0.8, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
            className="flex h-16 w-16 items-center justify-center rounded-xl bg-slate-950 border border-slate-800 shadow-inner"
          >
            {renderShopIcon()}
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-5 text-2xl font-bold tracking-tight text-white"
          >
            {config?.shop_info.name || 'Billing Pro 2026'}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-slate-400"
          >
            <Sparkles className="w-3.5 h-3.5" style={{ color: 'var(--primary, #2563eb)' }} />
            {config?.shop_info.type || 'RETAIL TERMINAL'} OPERATOR BOOT
          </motion.p>
        </div>

        {/* Dynamic validation error display */}
        <AnimatePresence mode="wait">
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0, y: -10 }}
              animate={{ opacity: 1, height: 'auto', y: 0 }}
              exit={{ opacity: 0, height: 0, y: -10 }}
              className="mt-6 flex items-start gap-3 rounded-lg border border-red-500/20 bg-red-500/10 p-3.5 text-sm text-red-200"
            >
              <ShieldAlert className="w-5 h-5 shrink-0 text-red-400" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Username Field */}
          <div className="space-y-2">
            <label className="text-xs font-semibold tracking-wide text-slate-300 uppercase">
              Operator Username
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500 group-focus-within:text-blue-400 transition-colors">
                <User className="w-4 h-4" />
              </div>
              <input
                ref={usernameRef}
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. admin"
                disabled={isSubmitting}
                className="w-full rounded-lg border border-slate-800 bg-slate-950/80 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none ring-offset-slate-900 transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold tracking-wide text-slate-300 uppercase">
                Access Password
              </label>
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-500 group-focus-within:text-blue-400 transition-colors">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isSubmitting}
                className="w-full rounded-lg border border-slate-800 bg-slate-950/80 py-3 pl-10 pr-12 text-sm text-white placeholder-slate-500 outline-none ring-offset-slate-900 transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isSubmitting}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500 hover:text-slate-300 transition-colors outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Action Submit Button */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 flex items-center justify-center rounded-lg py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/10 transition-all duration-300 focus:ring-2 focus:ring-blue-500/20 cursor-pointer disabled:opacity-50 select-none uppercase tracking-wider"
            style={{
              background: 'linear-gradient(135deg, var(--primary, #2563eb) 0%, rgba(37,99,235,0.85) 100%)',
            }}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Decrypting Hash...</span>
              </div>
            ) : (
              <span>Verify & Boot</span>
            )}
          </motion.button>
        </form>

        {/* Footer Secure Offline Notice */}
        <div className="mt-6 border-t border-slate-800/80 pt-4 text-center">
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
            🛡️ High Security Sandbox • 100% Local Offline Sync
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
