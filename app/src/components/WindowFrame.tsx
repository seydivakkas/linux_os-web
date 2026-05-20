// ============================================================
// WindowFrame — Draggable, resizable window chrome
// with open/close animations and snap zones
// ============================================================

import { useCallback, useRef, useState, memo, useEffect } from 'react';
import type { Window } from '@/types';
import { useOS } from '@/hooks/useOSStore';
import * as Icons from 'lucide-react';
import type { LucideProps } from 'lucide-react';

const TOP_PANEL_HEIGHT = 28;
const RESIZE_HANDLE = 8;
const MIN_W = 320;
const MIN_H = 200;
const SNAP_THRESHOLD = 16;

const DynamicIcon = ({ name, ...props }: { name: string } & LucideProps) => {
  const IconComp = (Icons as unknown as unknown as Record<string, React.ComponentType<LucideProps>>)[name];
  return IconComp ? <IconComp {...props} /> : <Icons.HelpCircle {...props} />;
};

type SnapZone = 'left' | 'right' | 'top' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | null;

interface WindowFrameProps {
  window: Window;
  children: React.ReactNode;
}

const WindowFrame = memo(function WindowFrame({ window: win, children }: WindowFrameProps) {
  const { dispatch } = useOS();
  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ isDragging: boolean; startX: number; startY: number; origX: number; origY: number } | null>(null);
  const resizeRef = useRef<{ isResizing: boolean; edge: string; startX: number; startY: number; origW: number; origH: number; origX: number; origY: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [snapZone, setSnapZone] = useState<SnapZone>(null);
  const [animState, setAnimState] = useState<'opening' | 'closing' | 'minimizing' | 'idle'>('opening');

  const isMaximized = win.state === 'maximized';
  const isMinimized = win.state === 'minimized';
  const isFocused = win.isFocused;

  // Opening animation
  useEffect(() => {
    if (animState === 'opening') {
      const timer = setTimeout(() => setAnimState('idle'), 200);
      return () => clearTimeout(timer);
    }
  }, [animState]);

  const focusThis = useCallback(() => {
    if (!win.isFocused && win.state !== 'minimized') {
      dispatch({ type: 'FOCUS_WINDOW', windowId: win.id });
    }
  }, [dispatch, win.id, win.isFocused, win.state]);

  const handleMouseDown = useCallback(() => {
    focusThis();
  }, [focusThis]);

  // ---- Snap Zone Detection ----
  const detectSnapZone = useCallback((clientX: number, clientY: number): SnapZone => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const nearLeft = clientX < SNAP_THRESHOLD;
    const nearRight = clientX > vw - SNAP_THRESHOLD;
    const nearTop = clientY < TOP_PANEL_HEIGHT + SNAP_THRESHOLD;
    const nearBottom = clientY > vh - SNAP_THRESHOLD;

    if (nearTop && nearLeft) return 'top-left';
    if (nearTop && nearRight) return 'top-right';
    if (nearBottom && nearLeft) return 'bottom-left';
    if (nearBottom && nearRight) return 'bottom-right';
    if (nearLeft) return 'left';
    if (nearRight) return 'right';
    if (nearTop) return 'top';
    return null;
  }, []);

  const applySnap = useCallback((zone: SnapZone) => {
    const vw = window.innerWidth;
    const vh = window.innerHeight - TOP_PANEL_HEIGHT - 48; // minus panel + dock
    const baseY = TOP_PANEL_HEIGHT;

    switch (zone) {
      case 'left':
        dispatch({ type: 'MOVE_WINDOW', windowId: win.id, position: { x: 0, y: baseY } });
        dispatch({ type: 'RESIZE_WINDOW', windowId: win.id, size: { width: vw / 2, height: vh } });
        break;
      case 'right':
        dispatch({ type: 'MOVE_WINDOW', windowId: win.id, position: { x: vw / 2, y: baseY } });
        dispatch({ type: 'RESIZE_WINDOW', windowId: win.id, size: { width: vw / 2, height: vh } });
        break;
      case 'top':
        dispatch({ type: 'MAXIMIZE_WINDOW', windowId: win.id });
        break;
      case 'top-left':
        dispatch({ type: 'MOVE_WINDOW', windowId: win.id, position: { x: 0, y: baseY } });
        dispatch({ type: 'RESIZE_WINDOW', windowId: win.id, size: { width: vw / 2, height: vh / 2 } });
        break;
      case 'top-right':
        dispatch({ type: 'MOVE_WINDOW', windowId: win.id, position: { x: vw / 2, y: baseY } });
        dispatch({ type: 'RESIZE_WINDOW', windowId: win.id, size: { width: vw / 2, height: vh / 2 } });
        break;
      case 'bottom-left':
        dispatch({ type: 'MOVE_WINDOW', windowId: win.id, position: { x: 0, y: baseY + vh / 2 } });
        dispatch({ type: 'RESIZE_WINDOW', windowId: win.id, size: { width: vw / 2, height: vh / 2 } });
        break;
      case 'bottom-right':
        dispatch({ type: 'MOVE_WINDOW', windowId: win.id, position: { x: vw / 2, y: baseY + vh / 2 } });
        dispatch({ type: 'RESIZE_WINDOW', windowId: win.id, size: { width: vw / 2, height: vh / 2 } });
        break;
    }
  }, [dispatch, win.id]);

  // ---- Drag ----
  const handleTitleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (isMaximized) return;
      const target = e.target as HTMLElement;
      if (target.closest('button')) return;
      e.preventDefault();
      dragRef.current = {
        isDragging: true,
        startX: e.clientX,
        startY: e.clientY,
        origX: win.position.x,
        origY: win.position.y,
      };
      setIsDragging(true);
    },
    [isMaximized, win.position.x, win.position.y]
  );

  // ---- Resize ----
  const handleResizeMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (isMaximized) return;
      const cursorStyle = (e.currentTarget as HTMLElement).style.cursor || '';
      const edge = cursorStyle.replace('-resize', '');
      if (!edge) return;
      e.preventDefault();
      e.stopPropagation();
      resizeRef.current = {
        isResizing: true,
        edge,
        startX: e.clientX,
        startY: e.clientY,
        origW: win.size.width,
        origH: win.size.height,
        origX: win.position.x,
        origY: win.position.y,
      };
      setIsResizing(true);
    },
    [isMaximized, win.size, win.position]
  );

  // ---- Global mouse events for drag/resize ----
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (dragRef.current?.isDragging) {
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        let nx = dragRef.current.origX + dx;
        let ny = dragRef.current.origY + dy;
        const vw = window.innerWidth;
        ny = Math.max(TOP_PANEL_HEIGHT, ny);
        nx = Math.min(Math.max(nx, -(win.size.width - 100)), vw - 100);
        dispatch({ type: 'MOVE_WINDOW', windowId: win.id, position: { x: nx, y: ny } });

        // Snap zone preview
        const zone = detectSnapZone(e.clientX, e.clientY);
        setSnapZone(zone);
      }
      if (resizeRef.current?.isResizing) {
        const { edge, startX, startY, origW, origH, origX, origY } = resizeRef.current;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        let nx = origX, ny = origY, nw = origW, nh = origH;
        if (edge.includes('e')) nw = Math.max(MIN_W, origW + dx);
        if (edge.includes('s')) nh = Math.max(MIN_H, origH + dy);
        if (edge.includes('w')) {
          nw = Math.max(MIN_W, origW - dx);
          nx = origX + (origW - nw);
        }
        if (edge.includes('n')) {
          nh = Math.max(MIN_H, origH - dy);
          ny = origY + (origH - nh);
          ny = Math.max(TOP_PANEL_HEIGHT, ny);
        }
        dispatch({ type: 'MOVE_WINDOW', windowId: win.id, position: { x: nx, y: ny } });
        dispatch({ type: 'RESIZE_WINDOW', windowId: win.id, size: { width: nw, height: nh } });
      }
    };
    const onUp = (e: MouseEvent) => {
      // Apply snap on drag end
      if (dragRef.current?.isDragging) {
        const zone = detectSnapZone(e.clientX, e.clientY);
        if (zone) applySnap(zone);
        setSnapZone(null);
      }
      dragRef.current = null;
      resizeRef.current = null;
      setIsDragging(false);
      setIsResizing(false);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dispatch, win.id, win.size.width, win.size.height, detectSnapZone, applySnap]);

  const handleMinimize = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setAnimState('minimizing');
      setTimeout(() => {
        dispatch({ type: 'MINIMIZE_WINDOW', windowId: win.id });
        setAnimState('idle');
      }, 200);
    },
    [dispatch, win.id]
  );

  const handleMaximize = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isMaximized) {
        dispatch({ type: 'RESTORE_WINDOW', windowId: win.id });
      } else {
        dispatch({ type: 'MAXIMIZE_WINDOW', windowId: win.id });
      }
    },
    [dispatch, win.id, isMaximized]
  );

  const handleClose = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setAnimState('closing');
      setTimeout(() => {
        dispatch({ type: 'CLOSE_WINDOW', windowId: win.id });
      }, 150);
    },
    [dispatch, win.id]
  );

  const handleDoubleClickTitle = useCallback(() => {
    if (isMaximized) {
      dispatch({ type: 'RESTORE_WINDOW', windowId: win.id });
    } else {
      dispatch({ type: 'MAXIMIZE_WINDOW', windowId: win.id });
    }
  }, [dispatch, win.id, isMaximized]);

  if (isMinimized) return null;

  // Animation styles
  const getAnimStyle = (): React.CSSProperties => {
    switch (animState) {
      case 'opening':
        return { animation: 'winOpen 200ms cubic-bezier(0, 0, 0.2, 1) forwards' };
      case 'closing':
        return { animation: 'winClose 150ms ease-in forwards', pointerEvents: 'none' };
      case 'minimizing':
        return { animation: 'winMinimize 200ms ease-in forwards', pointerEvents: 'none' };
      default:
        return {};
    }
  };

  // Snap preview overlay position
  const getSnapPreviewStyle = (): React.CSSProperties | null => {
    if (!snapZone) return null;
    const vw = window.innerWidth;
    const vh = window.innerHeight - TOP_PANEL_HEIGHT - 48;
    const baseY = TOP_PANEL_HEIGHT;
    const pad = 4;
    const map: Record<string, React.CSSProperties> = {
      left: { left: pad, top: baseY + pad, width: vw / 2 - pad * 2, height: vh - pad * 2 },
      right: { left: vw / 2 + pad, top: baseY + pad, width: vw / 2 - pad * 2, height: vh - pad * 2 },
      top: { left: pad, top: baseY + pad, width: vw - pad * 2, height: vh - pad * 2 },
      'top-left': { left: pad, top: baseY + pad, width: vw / 2 - pad * 2, height: vh / 2 - pad * 2 },
      'top-right': { left: vw / 2 + pad, top: baseY + pad, width: vw / 2 - pad * 2, height: vh / 2 - pad * 2 },
      'bottom-left': { left: pad, top: baseY + vh / 2 + pad, width: vw / 2 - pad * 2, height: vh / 2 - pad * 2 },
      'bottom-right': { left: vw / 2 + pad, top: baseY + vh / 2 + pad, width: vw / 2 - pad * 2, height: vh / 2 - pad * 2 },
    };
    return map[snapZone] || null;
  };

  const snapStyle = getSnapPreviewStyle();

  return (
    <>
      {/* Snap zone preview */}
      {snapStyle && (
        <div
          className="fixed z-[9998] rounded-xl pointer-events-none"
          style={{
            ...snapStyle,
            background: 'rgba(124, 77, 255, 0.12)',
            border: '2px dashed rgba(124, 77, 255, 0.4)',
            animation: 'snapPreview 150ms ease forwards',
          }}
        />
      )}

      <div
        ref={frameRef}
        className="absolute flex flex-col select-none"
        style={{
          left: win.position.x,
          top: win.position.y,
          width: win.size.width,
          height: win.size.height,
          zIndex: win.zIndex,
          borderRadius: isMaximized ? 0 : 12,
          border: `1px solid ${isFocused ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)'}`,
          boxShadow: isFocused
            ? '0 8px 32px rgba(0,0,0,0.5)'
            : '0 2px 8px rgba(0,0,0,0.3)',
          transition: isDragging || isResizing ? 'none' : 'box-shadow 150ms ease, border-color 150ms ease',
          overflow: 'hidden',
          ...getAnimStyle(),
        }}
        onMouseDown={handleMouseDown}
      >
        {/* Resize handles — only edges intercept events */}
        {!isMaximized && (
          <div className="absolute inset-0 z-50" style={{ pointerEvents: 'none' }}>
            <div onMouseDown={handleResizeMouseDown} style={{ position: 'absolute', top: 0, left: RESIZE_HANDLE, right: RESIZE_HANDLE, height: RESIZE_HANDLE, cursor: 'n-resize', pointerEvents: 'auto' }} />
            <div onMouseDown={handleResizeMouseDown} style={{ position: 'absolute', bottom: 0, left: RESIZE_HANDLE, right: RESIZE_HANDLE, height: RESIZE_HANDLE, cursor: 's-resize', pointerEvents: 'auto' }} />
            <div onMouseDown={handleResizeMouseDown} style={{ position: 'absolute', left: 0, top: RESIZE_HANDLE, bottom: RESIZE_HANDLE, width: RESIZE_HANDLE, cursor: 'w-resize', pointerEvents: 'auto' }} />
            <div onMouseDown={handleResizeMouseDown} style={{ position: 'absolute', right: 0, top: RESIZE_HANDLE, bottom: RESIZE_HANDLE, width: RESIZE_HANDLE, cursor: 'e-resize', pointerEvents: 'auto' }} />
            <div onMouseDown={handleResizeMouseDown} style={{ position: 'absolute', top: 0, left: 0, width: RESIZE_HANDLE * 2, height: RESIZE_HANDLE * 2, cursor: 'nw-resize', pointerEvents: 'auto' }} />
            <div onMouseDown={handleResizeMouseDown} style={{ position: 'absolute', top: 0, right: 0, width: RESIZE_HANDLE * 2, height: RESIZE_HANDLE * 2, cursor: 'ne-resize', pointerEvents: 'auto' }} />
            <div onMouseDown={handleResizeMouseDown} style={{ position: 'absolute', bottom: 0, left: 0, width: RESIZE_HANDLE * 2, height: RESIZE_HANDLE * 2, cursor: 'sw-resize', pointerEvents: 'auto' }} />
            <div onMouseDown={handleResizeMouseDown} style={{ position: 'absolute', bottom: 0, right: 0, width: RESIZE_HANDLE * 2, height: RESIZE_HANDLE * 2, cursor: 'se-resize', pointerEvents: 'auto' }} />
          </div>
        )}

        {/* Title bar */}
        <div
          className="relative z-10 flex items-center justify-between shrink-0"
          style={{
            height: 36,
            background: isFocused ? '#1A1A1A' : '#141414',
            borderRadius: isMaximized ? 0 : '12px 12px 0 0',
            transition: 'background 150ms ease',
            cursor: isMaximized ? 'default' : 'grab',
          }}
          onMouseDown={handleTitleMouseDown}
          onDoubleClick={handleDoubleClickTitle}
        >
          {/* Left: icon + title */}
          <div className="flex items-center gap-2 px-3 overflow-hidden">
            <DynamicIcon name={win.icon} size={16} className="text-[var(--text-secondary)] shrink-0" />
            <span
              className="text-xs font-semibold truncate"
              style={{
                color: isFocused ? '#E0E0E0' : '#9E9E9E',
                transition: 'color 150ms ease',
              }}
            >
              {win.title}
            </span>
          </div>

          {/* Right: window controls */}
          <div className="flex items-center shrink-0">
            <button
              onClick={handleMinimize}
              className="w-9 h-9 flex items-center justify-center text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)] transition-colors"
              title="Minimize"
            >
              <Icons.Minus size={14} />
            </button>
            <button
              onClick={handleMaximize}
              className="w-9 h-9 flex items-center justify-center text-[var(--text-secondary)] hover:bg-white/5 hover:text-[var(--text-primary)] transition-colors"
              title={isMaximized ? 'Restore' : 'Maximize'}
            >
              {isMaximized ? <Icons.Copy size={12} /> : <Icons.Square size={12} />}
            </button>
            <button
              onClick={handleClose}
              className="w-9 h-9 flex items-center justify-center text-[var(--text-secondary)] transition-colors"
              style={{ borderRadius: isMaximized ? 0 : '0 12px 0 0' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#F44336';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = 'var(--text-secondary)';
              }}
              title="Close"
            >
              <Icons.X size={14} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div
          className="relative z-10 flex-1 overflow-hidden"
          style={{
            background: 'var(--bg-window)',
            borderRadius: isMaximized ? 0 : '0 0 12px 12px',
          }}
        >
          {children}
        </div>
      </div>

      <style>{`
        @keyframes winOpen {
          from { opacity: 0; transform: scale(0.88) translateY(12px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes winClose {
          from { opacity: 1; transform: scale(1); }
          to { opacity: 0; transform: scale(0.88) translateY(12px); }
        }
        @keyframes winMinimize {
          from { opacity: 1; transform: scale(1) translateY(0); }
          to { opacity: 0; transform: scale(0.5) translateY(80px); }
        }
        @keyframes snapPreview {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
});

export default WindowFrame;
