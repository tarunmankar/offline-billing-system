import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useConfig } from '../context/ConfigContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, User, Eye, EyeOff, Activity, ShoppingCart, ShieldAlert, Zap, WifiOff } from 'lucide-react';

const Login: React.FC = () => {
  const { login } = useAuth();
  const { config } = useConfig();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userFocused, setUserFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);
  const usernameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { usernameRef.current?.focus(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) { setError('Please fill in both fields.'); return; }
    setIsSubmitting(true);
    setError(null);
    try {
      await new Promise(r => setTimeout(r, 700));
      const result = await login(username, password);
      if (!result.success) setError(result.error || 'Invalid credentials. Please try again.');
    } catch { setError('Unexpected error. Please restart the app.'); }
    finally { setIsSubmitting(false); }
  };

  const shopType = config?.shop_info?.type?.toLowerCase();
  const ShopIcon = (shopType === 'pharmacy' || shopType === 'medical') ? Activity : ShoppingCart;

  /* ── Styles ─────────────────────────────────────────── */
  const inputStyle = (focused: boolean): React.CSSProperties => ({
    width: '100%', boxSizing: 'border-box',
    padding: '13px 14px 13px 44px',
    fontSize: 14, borderRadius: 12,
    background: 'hsla(222,47%,4%,0.9)',
    border: `1px solid ${focused ? 'var(--primary)' : 'hsla(220,30%,25%,0.6)'}`,
    color: 'var(--text-primary)',
    outline: 'none',
    boxShadow: focused ? '0 0 0 4px var(--primary-subtle)' : 'none',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
  });

  return (
    /* ── Full Page Wrapper ── */
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'hsl(222, 47%, 5%)',
      overflow: 'hidden',
    }}>

      {/* ── Background Gradient Blobs ── */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {/* Top-left blob */}
        <div style={{
          position: 'absolute', top: '-10%', left: '-5%',
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, hsla(221,83%,53%,0.22) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'blobFloat 8s ease-in-out infinite',
        }} />
        {/* Bottom-right blob */}
        <div style={{
          position: 'absolute', bottom: '-10%', right: '-5%',
          width: 460, height: 460, borderRadius: '50%',
          background: 'radial-gradient(circle, hsla(262,80%,65%,0.18) 0%, transparent 70%)',
          filter: 'blur(60px)',
          animation: 'blobFloat 8s ease-in-out 3s infinite',
        }} />
        {/* Center emerald blob */}
        <div style={{
          position: 'absolute', top: '45%', left: '45%',
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, hsla(158,64%,52%,0.08) 0%, transparent 70%)',
          filter: 'blur(80px)', transform: 'translate(-50%,-50%)',
        }} />
        {/* Grid overlay */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.03,
          backgroundImage: 'linear-gradient(hsla(220,30%,70%,1) 1px, transparent 1px), linear-gradient(90deg, hsla(220,30%,70%,1) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
      </div>

      {/* ── Glass Login Card ── */}
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        style={{
          position: 'relative', zIndex: 10,
          width: 420, maxWidth: 'calc(100vw - 32px)',
          background: 'hsla(222, 40%, 8%, 0.75)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid hsla(220,30%,30%,0.4)',
          borderRadius: 24,
          boxShadow: '0 32px 80px -12px hsla(222,47%,2%,0.75), 0 0 0 1px hsla(220,30%,30%,0.3)',
          overflow: 'hidden',
        }}
      >
        {/* Top glow bar */}
        <div style={{
          height: 2, width: '100%',
          background: 'linear-gradient(90deg, transparent 0%, var(--primary) 50%, transparent 100%)',
        }} />

        <div style={{ padding: '36px 36px 32px' }}>

          {/* ── Brand ── */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 32 }}>
            {/* Icon */}
            <motion.div
              initial={{ scale: 0.6, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
              style={{ marginBottom: 18, position: 'relative' }}
            >
              <div style={{
                width: 68, height: 68, borderRadius: 18,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(135deg, var(--primary-subtle), hsla(262,80%,65%,0.1))',
                border: '1px solid var(--border-glow)',
                boxShadow: '0 0 24px -6px var(--primary-glow)',
              }}>
                <ShopIcon size={30} color="var(--primary)" />
              </div>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--text-primary)', marginBottom: 12 }}
            >
              {config?.shop_info?.name || 'Billing Pro 2026'}
            </motion.h1>

            {/* Badges */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em',
                padding: '4px 10px', borderRadius: 999,
                background: 'var(--primary-subtle)', color: 'var(--primary)',
                border: '1px solid hsla(221,83%,53%,0.3)',
              }}>
                <Zap size={9} /> {config?.shop_info?.type || 'Retail'} Terminal
              </span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em',
                padding: '4px 10px', borderRadius: 999,
                background: 'hsla(158,64%,52%,0.1)', color: 'hsl(158,64%,55%)',
                border: '1px solid hsla(158,64%,52%,0.25)',
              }}>
                <WifiOff size={9} /> Offline
              </span>
            </motion.div>
          </div>

          {/* ── Error ── */}
          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 20 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '14px 16px', borderRadius: 12,
                  background: 'hsla(4,86%,58%,0.08)',
                  border: '1px solid hsla(4,86%,58%,0.25)',
                  color: 'hsl(4,86%,75%)', fontSize: 13,
                }}
              >
                <ShieldAlert size={17} color="hsl(4,86%,65%)" style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Form ── */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Username */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'hsla(215,20%,55%,1)', marginBottom: 8 }}>
                Username
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: userFocused ? 'var(--primary)' : 'hsla(215,15%,40%,1)', transition: 'color 0.2s', pointerEvents: 'none' }} />
                <input
                  ref={usernameRef}
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  onFocus={() => setUserFocused(true)}
                  onBlur={() => setUserFocused(false)}
                  placeholder="e.g. admin"
                  disabled={isSubmitting}
                  style={{ ...inputStyle(userFocused), paddingRight: 14 }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'hsla(215,20%,55%,1)', marginBottom: 8 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: passFocused ? 'var(--primary)' : 'hsla(215,15%,40%,1)', transition: 'color 0.2s', pointerEvents: 'none' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onFocus={() => setPassFocused(true)}
                  onBlur={() => setPassFocused(false)}
                  placeholder="••••••••"
                  disabled={isSubmitting}
                  style={{ ...inputStyle(passFocused), paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'hsla(215,15%,40%,1)', display: 'flex', padding: 0 }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'hsla(215,15%,40%,1)')}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%', padding: '15px 24px', marginTop: 4,
                fontSize: 14, fontWeight: 700, letterSpacing: '0.04em',
                color: '#fff', borderRadius: 14, border: 'none',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1,
                background: 'linear-gradient(135deg, var(--primary) 0%, hsl(221,83%,45%) 100%)',
                boxShadow: '0 4px 20px -4px var(--primary-glow)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                transition: 'opacity 0.2s, box-shadow 0.2s',
              }}
            >
              {isSubmitting ? (
                <>
                  <svg style={{ animation: 'spin 1s linear infinite', width: 18, height: 18 }} fill="none" viewBox="0 0 24 24">
                    <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Verifying Access...
                </>
              ) : (
                <>
                  <Lock size={15} />
                  Sign In Securely
                </>
              )}
            </motion.button>
          </form>

          {/* ── Footer ── */}
          <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid hsla(220,30%,25%,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'hsl(158,64%,52%)', animation: 'pulse 2s infinite' }} />
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'hsla(215,15%,40%,1)' }}>
              100% Offline · Encrypted Local Storage
            </p>
          </div>

        </div>
      </motion.div>
    </div>
  );
};

export default Login;
