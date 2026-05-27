// ============================================================
// App.tsx — Main UbuntuOS Shell
// ============================================================

import { useState, useCallback, useEffect, useRef } from 'react';
import { OSProvider, useOS } from '@/hooks/useOSStore';
import BootSequence from '@/components/BootSequence';
import LoginScreen from '@/components/LoginScreen';
import Desktop from '@/components/Desktop';
import TopPanel from '@/components/TopPanel';
import Dock from '@/components/Dock';
import AppLauncher from '@/components/AppLauncher';
import WindowManager from '@/components/WindowManager';
import ContextMenu from '@/components/ContextMenu';
import NotificationSystem from '@/components/NotificationSystem';
import NotificationCenter from '@/components/NotificationCenter';
import DesktopWidgets from '@/components/DesktopWidgets';
import SpotlightSearch from '@/components/SpotlightSearch';
import LockScreen from '@/components/LockScreen';
import CommandPalette from '@/components/CommandPalette';

function AppShell() {
  const { state, dispatch } = useOS();
  const { bootPhase, auth } = state;
  const [bootComplete, setBootComplete] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const altTabRef = useRef<{ holding: boolean }>({ holding: false });
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Listen for lock screen events from CommandPalette
  useEffect(() => {
    const handleLock = () => setIsLocked(true);
    window.addEventListener('linuxos:lock', handleLock);
    return () => window.removeEventListener('linuxos:lock', handleLock);
  }, []);

  // Dynamically apply accent color CSS variables based on OS store accent color state
  useEffect(() => {
    const root = document.documentElement;
    if (state.theme.accent) {
      root.style.setProperty('--accent-primary', state.theme.accent);
      root.style.setProperty('--accent-primary-hover', `${state.theme.accent}dd`);
      root.style.setProperty('--accent-primary-active', `${state.theme.accent}bb`);
      root.style.setProperty('--border-focus', state.theme.accent);
    }
  }, [state.theme.accent]);

  // Load and apply accessibility settings from localStorage
  useEffect(() => {
    const applySettings = () => {
      try {
        const root = document.documentElement;
        const settings = JSON.parse(localStorage.getItem('ubuntuos_settings') || '{}');

        // Apply high contrast
        const highContrast = !!settings.high_contrast;
        root.classList.toggle('high-contrast-mode', highContrast);

        // Apply large text
        const largeText = !!settings.large_text;
        root.style.fontSize = largeText ? '18px' : '14px';

        // Apply reduce motion
        const reduceMotion = !!settings.reduce_motion;
        root.style.setProperty('--reduce-motion', reduceMotion ? 'reduce' : 'no-preference');
      } catch (e) {
        console.error(e);
      }
    };

    applySettings();

    window.addEventListener('ubuntuos:settings-updated', applySettings);
    window.addEventListener('storage', applySettings);

    return () => {
      window.removeEventListener('ubuntuos:settings-updated', applySettings);
      window.removeEventListener('storage', applySettings);
    };
  }, []);

  // Boot sequence
  useEffect(() => {
    if (bootPhase === 'off') {
      dispatch({ type: 'SET_BOOT_PHASE', phase: 'logo' });
    }
  }, [bootPhase, dispatch]);

  const handleBootComplete = useCallback(() => {
    setBootComplete(true);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Super key toggles app launcher
      if (e.key === 'Meta' && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        dispatch({ type: 'TOGGLE_APP_LAUNCHER' });
        return;
      }

      // Ctrl+Alt+T opens Terminal
      if (e.ctrlKey && e.altKey && e.key === 't') {
        e.preventDefault();
        dispatch({ type: 'OPEN_WINDOW', appId: 'terminal' });
        return;
      }

      // Super+D minimize all
      if ((e.metaKey || e.key === 'Meta') && e.key === 'd') {
        e.preventDefault();
        dispatch({ type: 'MINIMIZE_ALL' });
        return;
      }

      // Super+L lock screen
      if ((e.metaKey || e.key === 'Meta') && e.key === 'l') {
        e.preventDefault();
        setIsLocked(true);
        return;
      }

      // Alt+Tab window switching
      if (e.key === 'Alt') {
        altTabRef.current.holding = true;
      }
      if (e.key === 'Tab' && e.altKey) {
        e.preventDefault();
        if (!state.isAltTabbing) {
          dispatch({ type: 'START_ALT_TAB' });
        } else {
          dispatch({ type: 'CYCLE_ALT_TAB' });
        }
      }

      // Escape closes app launcher
      if (e.key === 'Escape') {
        if (state.appLauncherOpen) {
          dispatch({ type: 'SET_APP_LAUNCHER', open: false });
        }
        if (state.notificationCenterOpen) {
          dispatch({ type: 'TOGGLE_NOTIFICATION_CENTER' });
        }
      }

      // Ctrl+W closes active window
      if (e.ctrlKey && e.key === 'w' && state.activeWindowId) {
        e.preventDefault();
        dispatch({ type: 'CLOSE_WINDOW', windowId: state.activeWindowId });
      }

      // F11 fullscreen toggle
      if (e.key === 'F11') {
        e.preventDefault();
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          document.documentElement.requestFullscreen().catch(() => {});
        }
      }

      // Ctrl+/ keyboard shortcuts help
      if (e.ctrlKey && e.key === '/') {
        e.preventDefault();
        setShowShortcuts(prev => !prev);
      }

      // Ctrl+Shift+Left/Right window snap
      if (e.ctrlKey && e.shiftKey && state.activeWindowId) {
        const vw = window.innerWidth;
        const vh = window.innerHeight - 28 - 48; // minus panel + dock
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          dispatch({ type: 'MOVE_WINDOW', windowId: state.activeWindowId, position: { x: 0, y: 28 } });
          dispatch({ type: 'RESIZE_WINDOW', windowId: state.activeWindowId, size: { width: vw / 2, height: vh } });
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          dispatch({ type: 'MOVE_WINDOW', windowId: state.activeWindowId, position: { x: vw / 2, y: 28 } });
          dispatch({ type: 'RESIZE_WINDOW', windowId: state.activeWindowId, size: { width: vw / 2, height: vh } });
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          dispatch({ type: 'MAXIMIZE_WINDOW', windowId: state.activeWindowId });
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          dispatch({ type: 'RESTORE_WINDOW', windowId: state.activeWindowId });
        }
      }

      // Tiling layouts: Ctrl+Shift+1/2/3/4
      if (e.ctrlKey && e.shiftKey && ['1', '2', '3', '4'].includes(e.key)) {
        e.preventDefault();
        const vw = window.innerWidth;
        const vh = window.innerHeight - 28 - 48;
        const topY = 28;
        const visibleWindows = state.windows.filter(w => w.state !== 'minimized');
        if (visibleWindows.length === 0) return;

        if (e.key === '1') {
          // 2-column split
          visibleWindows.forEach((w, i) => {
            const col = i % 2;
            dispatch({ type: 'RESTORE_WINDOW', windowId: w.id });
            dispatch({ type: 'MOVE_WINDOW', windowId: w.id, position: { x: col * (vw / 2), y: topY } });
            dispatch({ type: 'RESIZE_WINDOW', windowId: w.id, size: { width: vw / 2, height: vh } });
          });
        } else if (e.key === '2') {
          // 3-column
          visibleWindows.forEach((w, i) => {
            const col = i % 3;
            dispatch({ type: 'RESTORE_WINDOW', windowId: w.id });
            dispatch({ type: 'MOVE_WINDOW', windowId: w.id, position: { x: col * (vw / 3), y: topY } });
            dispatch({ type: 'RESIZE_WINDOW', windowId: w.id, size: { width: vw / 3, height: vh } });
          });
        } else if (e.key === '3') {
          // Quad grid (2x2)
          visibleWindows.forEach((w, i) => {
            const col = i % 2;
            const row = Math.floor(i / 2) % 2;
            dispatch({ type: 'RESTORE_WINDOW', windowId: w.id });
            dispatch({ type: 'MOVE_WINDOW', windowId: w.id, position: { x: col * (vw / 2), y: topY + row * (vh / 2) } });
            dispatch({ type: 'RESIZE_WINDOW', windowId: w.id, size: { width: vw / 2, height: vh / 2 } });
          });
        } else if (e.key === '4') {
          // Master + stack (first window 60%, rest stacked 40%)
          visibleWindows.forEach((w, i) => {
            dispatch({ type: 'RESTORE_WINDOW', windowId: w.id });
            if (i === 0) {
              dispatch({ type: 'MOVE_WINDOW', windowId: w.id, position: { x: 0, y: topY } });
              dispatch({ type: 'RESIZE_WINDOW', windowId: w.id, size: { width: vw * 0.6, height: vh } });
            } else {
              const stackCount = visibleWindows.length - 1;
              const stackH = vh / stackCount;
              dispatch({ type: 'MOVE_WINDOW', windowId: w.id, position: { x: vw * 0.6, y: topY + (i - 1) * stackH } });
              dispatch({ type: 'RESIZE_WINDOW', windowId: w.id, size: { width: vw * 0.4, height: stackH } });
            }
          });
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Alt' && state.isAltTabbing) {
        dispatch({ type: 'END_ALT_TAB' });
        altTabRef.current.holding = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [dispatch, state.appLauncherOpen, state.notificationCenterOpen, state.isAltTabbing, state.activeWindowId]);

  // Determine what to render
  const showBoot = bootPhase !== 'complete' && !bootComplete;
  const showLogin = bootComplete && !auth.isAuthenticated;
  const showDesktop = bootComplete && auth.isAuthenticated;

  const themeClasses = [
    state.theme.mode === 'light' ? 'light' : '',
    state.theme.colorTheme !== 'default' ? `theme-${state.theme.colorTheme}` : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={themeClasses} style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* Boot Sequence */}
      {showBoot && <BootSequence onComplete={handleBootComplete} />}

      {/* Login Screen */}
      {showLogin && <LoginScreen />}

      {/* Desktop Shell */}
      {showDesktop && (
        <div className="relative w-full h-full" style={{ background: 'var(--bg-desktop)' }}>
          {/* Wallpaper layer */}
          <div
            className="absolute inset-0"
            style={{
              ...(state.theme.wallpaper.startsWith('linear-gradient') || state.theme.wallpaper.startsWith('radial-gradient')
                ? { background: state.theme.wallpaper }
                : { backgroundImage: `url(${state.theme.wallpaper})`, backgroundSize: 'cover', backgroundPosition: 'center' }),
              zIndex: 0,
            }}
          />

          {/* Desktop Icons layer */}
          <Desktop />

          {/* Desktop widgets */}
          <DesktopWidgets />

          {/* Windows layer */}
          <WindowManager />

          {/* Top panel */}
          <TopPanel />

          {/* Dock */}
          <Dock />

          {/* Overlays */}
          <AppLauncher />
          <ContextMenu />
          <NotificationSystem />
          <NotificationCenter />
          <SpotlightSearch />
          <CommandPalette />

          {/* Lock screen */}
          {isLocked && <LockScreen onUnlock={() => setIsLocked(false)} userName={auth.userName || 'user'} />}

          {/* Alt+Tab switcher */}
          {state.isAltTabbing && (
            <div
              className="fixed inset-0 z-[5000] flex items-center justify-center pointer-events-none"
              style={{ background: 'rgba(0,0,0,0.3)' }}
            >
              <div
                className="flex items-center gap-3 px-6 py-4 rounded-2xl pointer-events-auto"
                style={{
                  background: 'rgba(30,30,30,0.9)',
                  backdropFilter: 'blur(16px)',
                  animation: 'alttabAppear 150ms ease',
                }}
              >
                {state.windows
                  .filter((w) => w.state !== 'minimized')
                  .map((w, i) => {
                    const app = state.apps.find((a) => a.id === w.appId);
                    const isSelected = i === state.altTabIndex;
                    return (
                      <div
                        key={w.id}
                        className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all"
                        style={{
                          background: isSelected ? 'var(--bg-hover)' : 'transparent',
                          border: isSelected ? '2px solid var(--accent-primary)' : '2px solid transparent',
                          width: 80,
                        }}
                      >
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{ background: 'var(--bg-hover)' }}>
                          {app?.icon && (
                            <img
                              src={`data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%237C4DFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>`}
                              alt=""
                              className="w-6 h-6 opacity-0"
                            />
                          )}
                          <span className="text-xl absolute">{app?.icon === 'Folder' && '📁'}</span>
                          <span className="text-xl absolute">{app?.icon === 'Terminal' && '⌨'}</span>
                          <span className="text-xl absolute">{app?.icon === 'Globe' && '🌐'}</span>
                          <span className="text-xl absolute">{app?.icon === 'Settings' && '⚙'}</span>
                          <span className="text-xl absolute">{app?.icon === 'FileText' && '📄'}</span>
                          <span className="text-xl absolute">
                            {!['Folder', 'Terminal', 'Globe', 'Settings', 'FileText'].includes(app?.icon || '') && '📱'}
                          </span>
                        </div>
                        <span className="text-[10px] text-[var(--text-primary)] text-center truncate max-w-[64px]">
                          {w.title}
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          <style>{`
            @keyframes alttabAppear {
              from { opacity: 0; transform: scale(0.9); }
              to { opacity: 1; transform: scale(1); }
            }
          `}</style>

          {/* Keyboard Shortcuts Help */}
          {showShortcuts && (
            <div className="fixed inset-0 z-[6000] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }}
              onClick={() => setShowShortcuts(false)}>
              <div className="rounded-2xl p-6 max-w-[480px] w-full" style={{ background: 'rgba(30,30,30,0.95)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)', animation: 'alttabAppear 150ms ease' }}
                onClick={e => e.stopPropagation()}>
                <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">⌨️ Klavye Kısayolları</h2>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-xs">
                  {[
                    ['Ctrl+Alt+T', 'Terminal aç'],
                    ['Ctrl+W', 'Pencereyi kapat'],
                    ['Alt+Tab', 'Pencere değiştir'],
                    ['Super+D', 'Tümünü küçült'],
                    ['Super+L', 'Ekranı kilitle'],
                    ['F11', 'Tam ekran'],
                    ['Ctrl+Shift+←', 'Sola yapıştır'],
                    ['Ctrl+Shift+→', 'Sağa yapıştır'],
                    ['Ctrl+Shift+↑', 'Maksimize et'],
                    ['Ctrl+Shift+↓', 'Geri küçült'],
                    ['Ctrl+/', 'Bu menü'],
                    ['Escape', 'Menüleri kapat'],
                    ['Ctrl+Space', 'Spotlight Arama'],
                    ['Ctrl+Shift+P', 'Komut Paleti'],
                    ['Ctrl+Shift+1', '2 sütun tiling'],
                    ['Ctrl+Shift+2', '3 sütun tiling'],
                    ['Ctrl+Shift+3', 'Quad (2x2) tiling'],
                    ['Ctrl+Shift+4', 'Master+Stack'],
                  ].map(([key, desc]) => (
                    <div key={key} className="flex items-center justify-between py-1" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <span className="text-[var(--text-secondary)]">{desc}</span>
                      <kbd className="px-1.5 py-0.5 rounded text-[10px] font-mono" style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--accent-primary)' }}>{key}</kbd>
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <button onClick={() => setShowShortcuts(false)} className="px-4 py-1.5 rounded-lg text-xs font-medium text-white" style={{ background: 'var(--accent-primary)' }}>Kapat</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <OSProvider>
      <AppShell />
    </OSProvider>
  );
}
