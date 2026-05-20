// ============================================================
// DesktopWidgets — Mini widgets on the desktop surface
// Clock, Weather mini, CPU/FPS meter, Quick Note
// ============================================================

import { useState, useEffect, useRef, useCallback, memo } from 'react';
import { X, Grip, Cloud, Cpu, Zap, StickyNote, Clock, ChevronDown, ChevronUp } from 'lucide-react';

interface Widget {
  id: string;
  type: 'clock' | 'weather' | 'system' | 'quicknote';
  position: { x: number; y: number };
  collapsed: boolean;
}

const WIDGET_DEFAULTS: Widget[] = [
  { id: 'w1', type: 'clock', position: { x: 20, y: 40 }, collapsed: false },
  { id: 'w2', type: 'weather', position: { x: 20, y: 240 }, collapsed: false },
  { id: 'w3', type: 'system', position: { x: 20, y: 420 }, collapsed: false },
];

function loadWidgets(): Widget[] {
  try {
    const saved = localStorage.getItem('linuxos_widgets');
    if (saved) return JSON.parse(saved);
  } catch {}
  return WIDGET_DEFAULTS;
}

// ---- Clock Widget ----
const ClockWidget = memo(function ClockWidget() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const hours = now.getHours();
  const mins = now.getMinutes();
  const secs = now.getSeconds();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="flex flex-col items-center py-3 px-4">
      <div className="text-3xl font-light tracking-wider" style={{ color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
        {String(hours).padStart(2, '0')}:{String(mins).padStart(2, '0')}
        <span className="text-lg ml-1" style={{ color: 'var(--text-secondary)' }}>{String(secs).padStart(2, '0')}</span>
      </div>
      <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{dateStr}</div>
    </div>
  );
});

// ---- Weather Widget ----
const WeatherWidget = memo(function WeatherWidget() {
  const [data, setData] = useState<{ temp: number; desc: string; city: string } | null>(null);

  useEffect(() => {
    const key = localStorage.getItem('owm_api_key');
    if (!key) return;

    const fetchWeather = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
          try {
            const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&units=metric&appid=${key}`);
            const d = await res.json();
            setData({ temp: Math.round(d.main.temp), desc: d.weather[0].description, city: d.name });
          } catch {}
        }, async () => {
          try {
            const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=Istanbul&units=metric&appid=${key}`);
            const d = await res.json();
            setData({ temp: Math.round(d.main.temp), desc: d.weather[0].description, city: d.name });
          } catch {}
        });
      }
    };
    fetchWeather();
    const id = setInterval(fetchWeather, 600000); // 10min
    return () => clearInterval(id);
  }, []);

  if (!data) return (
    <div className="px-4 py-3 text-xs text-center" style={{ color: 'var(--text-disabled)' }}>
      Set API key in Weather app
    </div>
  );

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Cloud size={28} style={{ color: 'var(--accent-info)' }} />
      <div>
        <div className="text-xl font-light" style={{ color: 'var(--text-primary)' }}>{data.temp}°C</div>
        <div className="text-[10px] capitalize" style={{ color: 'var(--text-secondary)' }}>{data.desc}</div>
        <div className="text-[10px]" style={{ color: 'var(--text-disabled)' }}>{data.city}</div>
      </div>
    </div>
  );
});

// ---- System Widget ----
const SystemWidget = memo(function SystemWidget() {
  const [fps, setFps] = useState(0);
  const [heap, setHeap] = useState<number | null>(null);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());

  useEffect(() => {
    let animId: number;
    const tick = () => {
      frameCountRef.current++;
      const now = performance.now();
      if (now - lastTimeRef.current >= 1000) {
        setFps(Math.round((frameCountRef.current * 1000) / (now - lastTimeRef.current)));
        frameCountRef.current = 0;
        lastTimeRef.current = now;
        const mem = (performance as any).memory;
        if (mem) setHeap(Math.round(mem.usedJSHeapSize / 1024 / 1024));
      }
      animId = requestAnimationFrame(tick);
    };
    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div className="px-4 py-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}><Zap size={12} /> FPS</div>
        <span className="text-xs font-semibold" style={{ color: fps > 50 ? 'var(--accent-success)' : 'var(--accent-warning)' }}>{fps}</span>
      </div>
      {heap !== null && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}><Cpu size={12} /> Heap</div>
          <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{heap} MB</span>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}><Cpu size={12} /> Cores</div>
        <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{navigator.hardwareConcurrency || '?'}</span>
      </div>
    </div>
  );
});

// ---- Quick Note Widget ----
const QuickNoteWidget = memo(function QuickNoteWidget() {
  const [text, setText] = useState(() => localStorage.getItem('linuxos_quicknote') || '');

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    localStorage.setItem('linuxos_quicknote', e.target.value);
  }, []);

  return (
    <textarea
      value={text}
      onChange={handleChange}
      placeholder="Quick note..."
      className="w-full h-20 px-3 py-2 text-xs bg-transparent outline-none resize-none"
      style={{ color: 'var(--text-primary)' }}
    />
  );
});

// ---- Widget Frame ----
const WIDGET_TITLES: Record<Widget['type'], { icon: React.ReactNode; label: string }> = {
  clock: { icon: <Clock size={12} />, label: 'Clock' },
  weather: { icon: <Cloud size={12} />, label: 'Weather' },
  system: { icon: <Cpu size={12} />, label: 'System' },
  quicknote: { icon: <StickyNote size={12} />, label: 'Quick Note' },
};

const WIDGET_CONTENT: Record<Widget['type'], React.FC> = {
  clock: ClockWidget,
  weather: WeatherWidget,
  system: SystemWidget,
  quicknote: QuickNoteWidget,
};

function WidgetFrame({
  widget, onClose, onToggle, onDragStart
}: {
  widget: Widget;
  onClose: (id: string) => void;
  onToggle: (id: string) => void;
  onDragStart: (id: string, e: React.MouseEvent) => void;
}) {
  const info = WIDGET_TITLES[widget.type];
  const Content = WIDGET_CONTENT[widget.type];

  return (
    <div
      className="absolute rounded-xl overflow-hidden shadow-lg"
      style={{
        left: widget.position.x,
        top: widget.position.y,
        width: 200,
        background: 'rgba(30,30,30,0.75)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.08)',
        zIndex: 15,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-1.5 px-3 py-1.5 cursor-grab select-none"
        style={{ borderBottom: widget.collapsed ? 'none' : '1px solid rgba(255,255,255,0.06)' }}
        onMouseDown={(e) => onDragStart(widget.id, e)}
      >
        <Grip size={10} style={{ color: 'var(--text-disabled)' }} />
        <span style={{ color: 'var(--text-secondary)' }}>{info.icon}</span>
        <span className="flex-1 text-[10px] font-medium" style={{ color: 'var(--text-secondary)' }}>{info.label}</span>
        <button onClick={() => onToggle(widget.id)} className="p-0.5 rounded hover:bg-white/10">
          {widget.collapsed ? <ChevronDown size={10} style={{ color: 'var(--text-disabled)' }} /> : <ChevronUp size={10} style={{ color: 'var(--text-disabled)' }} />}
        </button>
        <button onClick={() => onClose(widget.id)} className="p-0.5 rounded hover:bg-white/10">
          <X size={10} style={{ color: 'var(--text-disabled)' }} />
        </button>
      </div>
      {!widget.collapsed && <Content />}
    </div>
  );
}

// ---- Main Component ----
export default function DesktopWidgets() {
  const [widgets, setWidgets] = useState<Widget[]>(loadWidgets);
  const [dragging, setDragging] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    localStorage.setItem('linuxos_widgets', JSON.stringify(widgets));
  }, [widgets]);

  const handleClose = useCallback((id: string) => {
    setWidgets(prev => prev.filter(w => w.id !== id));
  }, []);

  const handleToggle = useCallback((id: string) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, collapsed: !w.collapsed } : w));
  }, []);

  const handleDragStart = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDragging(id);
    setDragStart({ x: e.clientX, y: e.clientY });
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setWidgets(prev => prev.map(w => {
      if (w.id !== dragging) return w;
      return { ...w, position: { x: Math.max(0, w.position.x + dx), y: Math.max(0, w.position.y + dy) } };
    }));
    setDragStart({ x: e.clientX, y: e.clientY });
  }, [dragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 12 }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {widgets.map(w => (
        <div key={w.id} className="pointer-events-auto">
          <WidgetFrame widget={w} onClose={handleClose} onToggle={handleToggle} onDragStart={handleDragStart} />
        </div>
      ))}
    </div>
  );
}
