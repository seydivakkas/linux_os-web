// ============================================================
// BootSequence — 5-phase animated boot with kernel-style logs
// Phase 0: BIOS/UEFI splash (SVG logo)
// Phase 1: Kernel log stream (dmesg-style)
// Phase 2: Loading bar with service init
// Phase 3: Transition (circle clip)
// Phase 4: Desktop reveal
// ============================================================

import { useEffect, useState, memo, useRef } from 'react';

const PHASE_BIOS = 0;
const PHASE_KERNEL = 1;
const PHASE_LOADING = 2;
const PHASE_TRANSITION = 3;
const PHASE_DESKTOP = 4;
const PHASE_DONE = 5;

const KERNEL_LOGS = [
  '[    0.000000] LinuxOS Web kernel 6.2.0-web (info@linuxos.dev)',
  '[    0.000001] BIOS-e820: [mem 0x0000000000000000-0x000000000009ffff] usable',
  '[    0.000012] ACPI: RSDP 0x00000000000F0490 000024 (v02 VBOX  )',
  '[    0.000045] CPU: Virtual Web Core @ 3.40GHz',
  '[    0.000078] Memory: 4096MB/4096MB available (browser allocated)',
  '[    0.000123] Calibrating delay loop... 6800.00 BogoMIPS (lpj=3400000)',
  '[    0.000234] pid_max: default: 32768 minimum: 301',
  '[    0.000456] Mount-cache hash table entries: 1024',
  '[    0.000678] CPU: x86_64 Virtual (1 CPU)',
  '[    0.001000] Initializing IndexedDB subsystem...',
  '[    0.001200] [VFS] Mounting virtual filesystem...',
  '[    0.001500] [VFS] Registering file associations...',
  '[    0.002000] [NET] Initializing network stack (Service Workers)...',
  '[    0.002500] [GPU] WebGL 2.0 renderer initialized',
  '[    0.003000] [AUDIO] Web Audio API context created',
  '[    0.003500] [I18N] Loading locale: auto-detect...',
  '[    0.004000] [WM] Window Manager ready (tiling + floating)',
  '[    0.004500] [DOCK] Application dock initialized',
  '[    0.005000] systemd[1]: Starting LinuxOS Web Desktop...',
  '[    0.005500] systemd[1]: Started 57 application services.',
  '[    0.006000] systemd[1]: Reached target Graphical Interface.',
];

const BootSequence = memo(function BootSequence({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<number>(PHASE_BIOS);
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('Loading system...');
  const [visibleLogs, setVisibleLogs] = useState<number>(0);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Phase 0 → 1: BIOS to Kernel (after 600ms)
    timers.push(setTimeout(() => setPhase(PHASE_KERNEL), 600));

    // Phase 1: Stream kernel logs
    KERNEL_LOGS.forEach((_, i) => {
      timers.push(setTimeout(() => {
        setVisibleLogs(i + 1);
      }, 600 + i * 80));
    });

    // Phase 1 → 2: Kernel to Loading (after all logs)
    const kernelEnd = 600 + KERNEL_LOGS.length * 80 + 200;
    timers.push(setTimeout(() => setPhase(PHASE_LOADING), kernelEnd));

    // Phase 2: Progress bar
    timers.push(setTimeout(() => {
      let p = 0;
      const interval = setInterval(() => {
        p += Math.random() * 18 + 6;
        if (p >= 100) {
          p = 100;
          clearInterval(interval);
        }
        setProgress(p);
        if (p > 30) setLoadingText('Initializing services...');
        if (p > 60) setLoadingText('Starting window manager...');
        if (p > 85) setLoadingText('Preparing desktop...');
      }, 100);
      timers.push(interval as unknown as ReturnType<typeof setTimeout>);
    }, kernelEnd));

    // Phase 2 → 3: Loading to Transition
    timers.push(setTimeout(() => setPhase(PHASE_TRANSITION), kernelEnd + 1400));

    // Phase 3 → 4: Transition to Desktop
    timers.push(setTimeout(() => setPhase(PHASE_DESKTOP), kernelEnd + 2200));

    // Phase 4 → Done
    timers.push(setTimeout(() => {
      setPhase(PHASE_DONE);
      onComplete();
    }, kernelEnd + 3000));

    return () => timers.forEach((t) => clearTimeout(t));
  }, [onComplete]);

  // Auto-scroll kernel logs
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [visibleLogs]);

  if (phase === PHASE_DONE) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black"
      style={{
        transition: 'clip-path 800ms cubic-bezier(0, 0, 0.2, 1)',
        clipPath:
          phase === PHASE_DESKTOP || phase === PHASE_TRANSITION
            ? phase === PHASE_DESKTOP
              ? 'circle(150% at 50% 50%)'
              : 'circle(0% at 50% 50%)'
            : undefined,
      }}
    >
      {phase === PHASE_TRANSITION && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: 'url(/wallpaper-default.jpg)' }}
        />
      )}

      {/* BIOS Phase — Logo */}
      {phase === PHASE_BIOS && (
        <div
          className="flex flex-col items-center gap-6"
          style={{ animation: 'fadeIn 400ms ease' }}
        >
          <div style={{ animation: 'logoPulse 1.2s ease-in-out infinite' }}>
            <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
              <defs>
                <linearGradient id="bootGrad1" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#7C4DFF" />
                  <stop offset="100%" stopColor="#E040FB" />
                </linearGradient>
                <linearGradient id="bootGrad2" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#FF9800" />
                  <stop offset="100%" stopColor="#FF5722" />
                </linearGradient>
              </defs>
              <circle cx="48" cy="48" r="46" fill="url(#bootGrad1)" opacity="0.9" />
              <circle cx="34" cy="40" r="16" fill="url(#bootGrad2)" opacity="0.85" />
              <circle cx="58" cy="56" r="14" fill="#E91E63" opacity="0.7" />
            </svg>
          </div>
          <h1 className="text-[32px] font-bold tracking-[0.12em] text-white/90">
            LinuxOS
          </h1>
          <p className="text-[10px] text-white/30 tracking-widest uppercase">
            Web Desktop Environment
          </p>
        </div>
      )}

      {/* Kernel Log Phase */}
      {phase === PHASE_KERNEL && (
        <div
          ref={logRef}
          className="w-full max-w-[700px] h-[300px] overflow-hidden px-6"
          style={{ animation: 'fadeIn 200ms ease' }}
        >
          {KERNEL_LOGS.slice(0, visibleLogs).map((log, i) => (
            <div
              key={i}
              className="text-[11px] leading-[1.6] font-mono whitespace-pre"
              style={{
                color: log.includes('[VFS]') || log.includes('[NET]') || log.includes('[GPU]')
                  ? '#4CAF50'
                  : log.includes('systemd')
                    ? '#7C4DFF'
                    : log.includes('[I18N]') || log.includes('[WM]') || log.includes('[DOCK]') || log.includes('[AUDIO]')
                      ? '#00BCD4'
                      : '#8a8a8a',
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                animation: 'logLine 150ms ease',
              }}
            >
              {log}
            </div>
          ))}
          <div
            className="inline-block w-2 h-4 bg-white/60 ml-1"
            style={{ animation: 'blink 800ms step-end infinite' }}
          />
        </div>
      )}

      {/* Loading Phase — Progress Bar */}
      {(phase === PHASE_LOADING) && (
        <div
          className="flex flex-col items-center gap-6"
          style={{ animation: 'fadeIn 300ms ease' }}
        >
          <div style={{ animation: 'logoPulse 1.6s ease-in-out infinite' }}>
            <svg width="72" height="72" viewBox="0 0 96 96" fill="none">
              <defs>
                <linearGradient id="loadGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#7C4DFF" />
                  <stop offset="100%" stopColor="#E040FB" />
                </linearGradient>
              </defs>
              <circle cx="48" cy="48" r="46" fill="url(#loadGrad)" opacity="0.9" />
              <circle cx="34" cy="40" r="16" fill="#FF9800" opacity="0.85" />
              <circle cx="58" cy="56" r="14" fill="#E91E63" opacity="0.7" />
            </svg>
          </div>

          <h1 className="text-[24px] font-bold tracking-[0.1em] text-white/90">
            LinuxOS
          </h1>

          <div
            className="w-[240px] h-[3px] rounded-full overflow-hidden"
            style={{ background: 'rgba(124,77,255,0.2)' }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #7C4DFF, #E040FB)',
                transition: 'width 100ms linear',
              }}
            />
          </div>

          <p className="text-[10px] text-white/40 tracking-wider">
            {loadingText}
          </p>
        </div>
      )}

      <style>{`
        @keyframes logoPulse {
          0%, 100% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.04); filter: brightness(1.1); }
        }
        @keyframes logLine {
          from { opacity: 0; transform: translateY(2px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
});

export default BootSequence;
