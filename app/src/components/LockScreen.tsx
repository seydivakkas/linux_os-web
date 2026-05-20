// ============================================================
// LockScreen — Screen locker with clock, date, and password
// ============================================================

import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { Lock, User } from 'lucide-react';

interface LockScreenProps {
  onUnlock: () => void;
  userName?: string;
}

const LockScreen = memo(function LockScreen({ onUnlock, userName = 'user' }: LockScreenProps) {
  const [now, setNow] = useState(new Date());
  const [password, setPassword] = useState('');
  const [showInput, setShowInput] = useState(false);
  const [error, setError] = useState(false);
  const [unlocking, setUnlocking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const handleUnlock = useCallback(() => {
    // Empty password or correct password unlocks
    if (!password || password === '1234') {
      setUnlocking(true);
      setTimeout(onUnlock, 500);
    } else {
      setError(true);
      setPassword('');
      setTimeout(() => setError(false), 1500);
    }
  }, [password, onUnlock]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleUnlock();
  }, [handleUnlock]);

  const handleShowInput = useCallback(() => {
    setShowInput(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  // Any key press shows password input
  useEffect(() => {
    if (showInput) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return;
      handleShowInput();
    };
    const clickHandler = () => handleShowInput();
    window.addEventListener('keydown', handler);
    window.addEventListener('click', clickHandler);
    return () => {
      window.removeEventListener('keydown', handler);
      window.removeEventListener('click', clickHandler);
    };
  }, [showInput, handleShowInput]);

  const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center transition-opacity duration-500"
      style={{
        zIndex: 9000,
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 70%, #533483 100%)',
        opacity: unlocking ? 0 : 1,
      }}
    >
      {/* Blurred overlay */}
      <div className="absolute inset-0" style={{ backdropFilter: 'blur(2px)', background: 'rgba(0,0,0,0.3)' }} />

      <div className="relative z-10 flex flex-col items-center" style={{ animation: 'lockAppear 600ms ease' }}>
        {/* Time */}
        <div className="text-7xl font-extralight tracking-wider text-white mb-2" style={{ fontVariantNumeric: 'tabular-nums', textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}>
          {timeStr}
        </div>
        <div className="text-lg font-light text-white/70 mb-12">{dateStr}</div>

        {/* User */}
        {showInput && (
          <div className="flex flex-col items-center gap-4" style={{ animation: 'lockSlideUp 300ms ease' }}>
            <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.2)' }}>
              <User size={36} className="text-white/80" />
            </div>
            <span className="text-base font-medium text-white/90">{userName}</span>

            {/* Password */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{
              background: 'rgba(255,255,255,0.08)',
              border: error ? '1px solid rgba(244,67,54,0.5)' : '1px solid rgba(255,255,255,0.15)',
              width: 260,
              animation: error ? 'lockShake 400ms ease' : undefined,
            }}>
              <Lock size={14} className="text-white/40 shrink-0" />
              <input
                ref={inputRef}
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Password (Enter to unlock)"
                className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-white/30"
              />
            </div>
            <button
              onClick={handleUnlock}
              className="px-6 py-2 rounded-full text-sm font-medium text-white transition-all hover:scale-105"
              style={{ background: 'rgba(124,77,255,0.6)', backdropFilter: 'blur(4px)' }}
            >
              Unlock
            </button>
            {error && <span className="text-xs text-red-400">Incorrect password</span>}
            <span className="text-[10px] text-white/30 mt-2">Press Enter with empty password or use "1234"</span>
          </div>
        )}

        {!showInput && (
          <div className="flex flex-col items-center gap-3 text-white/40 text-sm" style={{ animation: 'lockPulse 2s infinite' }}>
            <Lock size={24} />
            <span>Press any key or click to unlock</span>
          </div>
        )}
      </div>

      <style>{`
        @keyframes lockAppear {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes lockSlideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes lockShake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        @keyframes lockPulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
});

export default LockScreen;
