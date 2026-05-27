// ============================================================
// LoginScreen — Cloud Auth + Offline Mode Login
// Supports: Google, GitHub, Email/Password, Guest (offline)
// ============================================================

import { useState, useCallback, memo, useEffect } from 'react';
import { LogOut, Moon, Power, User, Cloud, CloudOff, Mail, Chrome, Github, AlertCircle } from 'lucide-react';
import { useOS } from '@/hooks/useOSStore';
import {
  isSupabaseConfigured, signInWithGoogle, signInWithGitHub,
  signInWithEmail, signUpWithEmail, getSupabase,
} from '@/lib/supabase';

const LoginScreen = memo(function LoginScreen() {
  const { dispatch } = useOS();
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [showEmailForm, setShowEmailForm] = useState(false);
  const cloudMode = isSupabaseConfigured();

  // Check for existing session on mount (cloud mode)
  useEffect(() => {
    if (!cloudMode) return;
    const sb = getSupabase();
    if (!sb) return;

    sb.auth.getSession().then(({ data }) => {
      if (data.session) {
        const name = data.session.user.user_metadata?.full_name
          || data.session.user.email?.split('@')[0]
          || 'User';
        dispatch({ type: 'LOGIN', isGuest: false, userName: name });
      }
    });

    // Listen for auth state changes (OAuth redirects)
    const { data: { subscription } } = sb.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const name = session.user.user_metadata?.full_name
          || session.user.email?.split('@')[0]
          || 'User';
        dispatch({ type: 'LOGIN', isGuest: false, userName: name });
      }
    });

    return () => { subscription.unsubscribe(); };
  }, [cloudMode, dispatch]);

  // ---- Cloud Auth Handlers ----
  const handleGoogleLogin = useCallback(async () => {
    setIsUnlocking(true);
    setError('');
    const result = await signInWithGoogle();
    if (result.error) {
      setError(result.error);
      setIsUnlocking(false);
    }
    // Auth redirect will handle the rest
  }, []);

  const handleGitHubLogin = useCallback(async () => {
    setIsUnlocking(true);
    setError('');
    const result = await signInWithGitHub();
    if (result.error) {
      setError(result.error);
      setIsUnlocking(false);
    }
  }, []);

  const handleEmailAuth = useCallback(async () => {
    if (!email.trim() || !password.trim()) {
      setError('Email and password required');
      return;
    }
    setIsUnlocking(true);
    setError('');
    const result = mode === 'signup'
      ? await signUpWithEmail(email, password)
      : await signInWithEmail(email, password);
    if (result.error) {
      setError(result.error);
      setIsUnlocking(false);
    }
  }, [email, password, mode]);

  // ---- Offline login (original behavior) ----
  const handleOfflineUnlock = useCallback(() => {
    setIsUnlocking(true);
    setError('');
    setTimeout(() => {
      dispatch({ type: 'LOGIN', isGuest: false });
    }, 800);
  }, [dispatch]);

  const handleGuest = useCallback(() => {
    dispatch({ type: 'LOGIN', isGuest: true });
  }, [dispatch]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        if (cloudMode && showEmailForm) handleEmailAuth();
        else handleOfflineUnlock();
      }
    },
    [cloudMode, showEmailForm, handleEmailAuth, handleOfflineUnlock]
  );

  return (
    <div
      className="fixed inset-0 z-[9998] flex items-center justify-center"
      style={{
        backgroundImage: 'url(/wallpaper-default.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Blur overlay */}
      <div
        className="absolute inset-0"
        style={{
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          background: 'rgba(0,0,0,0.4)',
        }}
      />

      {/* Login card */}
      <div
        className="relative z-10 w-[400px] rounded-[20px] p-10 flex flex-col items-center"
        style={{
          background: 'rgba(45,45,45,0.85)',
          boxShadow: '0 16px 48px rgba(0,0,0,0.6)',
          animation: 'loginEnter 400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* Cloud status badge */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium"
          style={{
            background: cloudMode ? 'rgba(76,175,80,0.15)' : 'rgba(255,152,0,0.15)',
            color: cloudMode ? '#4CAF50' : '#FF9800',
          }}
        >
          {cloudMode ? <Cloud size={10} /> : <CloudOff size={10} />}
          {cloudMode ? 'Cloud' : 'Offline'}
        </div>

        {/* Avatar */}
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center border-[3px] border-[#7C4DFF] mb-4"
          style={{ background: 'linear-gradient(135deg, #7C4DFF, #4A148C)' }}
        >
          <User size={36} className="text-white" />
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold text-[#E0E0E0]">LinuxOS</h2>
        <p className="text-xs text-[#9E9E9E] mt-1">
          {cloudMode ? 'Sign in to your cloud workspace' : 'Enter any password to continue'}
        </p>

        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-lg text-xs w-full"
            style={{ background: 'rgba(244,67,54,0.12)', color: '#F44336' }}>
            <AlertCircle size={12} />
            {error}
          </div>
        )}

        {/* ===== CLOUD MODE ===== */}
        {cloudMode && !showEmailForm && (
          <div className="w-full mt-6 space-y-2.5">
            {/* Google */}
            <button
              onClick={handleGoogleLogin}
              disabled={isUnlocking}
              className="w-full h-11 rounded-full flex items-center justify-center gap-3 text-sm font-medium transition-all hover:brightness-110"
              style={{ background: '#4285F4', color: 'white' }}
            >
              <Chrome size={16} />
              Continue with Google
            </button>

            {/* GitHub */}
            <button
              onClick={handleGitHubLogin}
              disabled={isUnlocking}
              className="w-full h-11 rounded-full flex items-center justify-center gap-3 text-sm font-medium transition-all hover:brightness-110"
              style={{ background: '#24292e', color: 'white' }}
            >
              <Github size={16} />
              Continue with GitHub
            </button>

            {/* Email option */}
            <button
              onClick={() => setShowEmailForm(true)}
              className="w-full h-11 rounded-full flex items-center justify-center gap-3 text-sm font-medium transition-all hover:brightness-110"
              style={{ background: 'rgba(255,255,255,0.08)', color: '#E0E0E0' }}
            >
              <Mail size={16} />
              Continue with Email
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 pt-1">
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
              <span className="text-[10px] text-[#9E9E9E]">OR</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
            </div>

            {/* Guest login */}
            <button
              onClick={handleGuest}
              className="w-full h-10 rounded-full text-sm text-[#7C4DFF] hover:text-[#9575FF] hover:bg-white/[0.04] transition-colors"
            >
              Continue as Guest (offline)
            </button>
          </div>
        )}

        {/* ===== CLOUD EMAIL FORM ===== */}
        {cloudMode && showEmailForm && (
          <div className="w-full mt-6 space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              onKeyDown={handleKeyDown}
              placeholder="Email address"
              className="w-full h-11 rounded-full px-5 text-sm text-[#E0E0E0] outline-none transition-all"
              style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)' }}
              autoFocus
            />
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              onKeyDown={handleKeyDown}
              placeholder="Password"
              className="w-full h-11 rounded-full px-5 text-sm text-[#E0E0E0] outline-none transition-all"
              style={{ background: '#1A1A1A', border: '1px solid rgba(255,255,255,0.1)' }}
            />
            <button
              onClick={handleEmailAuth}
              disabled={isUnlocking}
              className="w-full h-11 rounded-full text-sm font-semibold text-white transition-colors"
              style={{ background: isUnlocking ? '#673AB7' : '#7C4DFF' }}
            >
              {isUnlocking ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>Signing in...</span>
                </div>
              ) : (
                mode === 'signup' ? 'Create Account' : 'Sign In'
              )}
            </button>
            <div className="flex items-center justify-between text-xs">
              <button
                onClick={() => setShowEmailForm(false)}
                className="text-[#9E9E9E] hover:text-[#E0E0E0] transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={() => setMode(m => m === 'login' ? 'signup' : 'login')}
                className="text-[#7C4DFF] hover:text-[#9575FF] transition-colors"
              >
                {mode === 'login' ? 'Create account' : 'Already have an account?'}
              </button>
            </div>
          </div>
        )}

        {/* ===== OFFLINE MODE ===== */}
        {!cloudMode && (
          <>
            {/* Password input */}
            <div className="w-full mt-6 relative">
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                onKeyDown={handleKeyDown}
                placeholder="Password (any)"
                className="w-full h-11 rounded-full px-5 text-sm text-[#E0E0E0] outline-none transition-all"
                style={{
                  background: '#1A1A1A',
                  border: `1px solid ${error ? '#F44336' : 'rgba(255,255,255,0.1)'}`,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#7C4DFF';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,77,255,0.15)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              />
            </div>

            {/* Unlock button */}
            <button
              onClick={handleOfflineUnlock}
              disabled={isUnlocking}
              className="w-full h-11 rounded-full mt-4 text-sm font-semibold text-white transition-colors"
              style={{
                background: isUnlocking ? '#673AB7' : '#7C4DFF',
                transform: 'scale(1)',
                transition: 'all 150ms ease',
              }}
              onMouseEnter={(e) => { if (!isUnlocking) e.currentTarget.style.background = '#9575FF'; }}
              onMouseLeave={(e) => { if (!isUnlocking) e.currentTarget.style.background = '#7C4DFF'; }}
              onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.97)'; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              {isUnlocking ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  <span>Unlocking...</span>
                </div>
              ) : (
                'Unlock'
              )}
            </button>

            {/* Guest login */}
            <button
              onClick={handleGuest}
              className="mt-3 text-sm text-[#7C4DFF] hover:text-[#9575FF] transition-colors"
            >
              Log in as Guest
            </button>

            {/* Cloud hint */}
            <div className="mt-4 pt-3 text-center w-full" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-[10px] text-[#616161]">
                ☁️ Cloud sync available — Configure in Settings → Cloud
              </p>
            </div>
          </>
        )}

        {/* Power options */}
        <div className="flex items-center gap-4 mt-4 pt-4 w-full justify-center"
          style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
        >
          <button className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9E9E9E] hover:text-[#E0E0E0] hover:bg-white/[0.06] transition-all">
            <Power size={16} />
          </button>
          <button className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9E9E9E] hover:text-[#E0E0E0] hover:bg-white/[0.06] transition-all">
            <Moon size={16} />
          </button>
          <button className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9E9E9E] hover:text-[#E0E0E0] hover:bg-white/[0.06] transition-all">
            <LogOut size={16} />
          </button>
        </div>
      </div>

      <style>{`
        @keyframes loginEnter {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes loginShake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          50% { transform: translateX(8px); }
          75% { transform: translateX(-8px); }
        }
      `}</style>
    </div>
  );
});

export default LoginScreen;
