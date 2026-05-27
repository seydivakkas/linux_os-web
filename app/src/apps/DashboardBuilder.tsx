// ============================================================
// DashboardBuilder — KPI Dashboard with customizable widgets
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Trash2, Edit3, X, BarChart3, TrendingUp, TrendingDown,
  PieChart, Activity, Target, FileText, GripVertical, Settings,
  Maximize2, Minimize2, Download,
} from 'lucide-react';

const generateId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

// ─── Types ───
type WidgetType = 'counter' | 'bar' | 'line' | 'pie' | 'progress' | 'table' | 'note';

interface WidgetDataPoint {
  label: string;
  value: number;
  color?: string;
}

interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  size: 'sm' | 'md' | 'lg';
  data: WidgetDataPoint[];
  config: {
    prefix?: string;
    suffix?: string;
    trend?: number;
    target?: number;
    noteContent?: string;
    color?: string;
  };
}

interface Dashboard {
  id: string;
  name: string;
  widgets: Widget[];
}

const WIDGET_TYPES: { type: WidgetType; label: string; icon: React.ReactNode }[] = [
  { type: 'counter', label: 'Sayaç', icon: <TrendingUp size={14} /> },
  { type: 'bar', label: 'Çubuk Grafik', icon: <BarChart3 size={14} /> },
  { type: 'line', label: 'Çizgi Grafik', icon: <Activity size={14} /> },
  { type: 'pie', label: 'Pasta Grafik', icon: <PieChart size={14} /> },
  { type: 'progress', label: 'İlerleme', icon: <Target size={14} /> },
  { type: 'table', label: 'Tablo', icon: <FileText size={14} /> },
  { type: 'note', label: 'Not', icon: <Edit3 size={14} /> },
];

const CHART_COLORS = ['#7C4DFF', '#00BCD4', '#4CAF50', '#FF9800', '#F44336', '#E91E63', '#3F51B5', '#8BC34A'];

const STORAGE_KEY = 'linuxos_dashboards';

const createSampleDashboard = (): Dashboard => ({
  id: generateId(),
  name: 'İş Dashboard',
  widgets: [
    {
      id: generateId(), type: 'counter', title: 'Aylık Gelir', size: 'sm',
      data: [{ label: 'Gelir', value: 125400 }],
      config: { prefix: '₺', trend: 12.5, color: '#4CAF50' },
    },
    {
      id: generateId(), type: 'counter', title: 'Aktif Müşteri', size: 'sm',
      data: [{ label: 'Müşteri', value: 1245 }],
      config: { trend: 8.2, color: '#2196F3' },
    },
    {
      id: generateId(), type: 'counter', title: 'Açık Destek', size: 'sm',
      data: [{ label: 'Ticket', value: 23 }],
      config: { trend: -15, color: '#FF9800' },
    },
    {
      id: generateId(), type: 'counter', title: 'Dönüşüm Oranı', size: 'sm',
      data: [{ label: 'Oran', value: 4.7 }],
      config: { suffix: '%', trend: 2.1, color: '#7C4DFF' },
    },
    {
      id: generateId(), type: 'bar', title: 'Aylık Satışlar', size: 'lg',
      data: [
        { label: 'Oca', value: 42 }, { label: 'Şub', value: 38 }, { label: 'Mar', value: 55 },
        { label: 'Nis', value: 47 }, { label: 'May', value: 62 }, { label: 'Haz', value: 58 },
      ],
      config: { color: '#7C4DFF' },
    },
    {
      id: generateId(), type: 'progress', title: 'Çeyrek Hedefi', size: 'md',
      data: [{ label: 'Hedef', value: 72 }],
      config: { target: 100, suffix: '%', color: '#4CAF50' },
    },
    {
      id: generateId(), type: 'pie', title: 'Ürün Dağılımı', size: 'md',
      data: [
        { label: 'Ürün A', value: 45, color: '#7C4DFF' },
        { label: 'Ürün B', value: 32, color: '#00BCD4' },
        { label: 'Ürün C', value: 23, color: '#4CAF50' },
      ],
      config: {},
    },
    {
      id: generateId(), type: 'table', title: 'Son İşlemler', size: 'lg',
      data: [
        { label: 'Firma A — Yazılım Lisansı', value: 12500 },
        { label: 'Firma B — Danışmanlık', value: 8400 },
        { label: 'Firma C — Destek Paketi', value: 3200 },
        { label: 'Firma D — Eğitim', value: 5600 },
        { label: 'Firma E — Bakım Sözleşmesi', value: 9800 },
      ],
      config: { prefix: '₺' },
    },
  ],
});

const loadDashboards = (): Dashboard[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return [createSampleDashboard()];
};

// ─── Widget Renderers ───
const CounterWidget: React.FC<{ widget: Widget }> = ({ widget }) => {
  const val = widget.data[0]?.value ?? 0;
  const trend = widget.config.trend ?? 0;
  const isUp = trend >= 0;
  return (
    <div className="flex flex-col justify-between h-full p-4">
      <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">{widget.title}</span>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-[var(--text-primary)]">
          {widget.config.prefix}{typeof val === 'number' && val > 999 ? `${(val / 1000).toFixed(1)}K` : val}{widget.config.suffix}
        </span>
      </div>
      {trend !== 0 && (
        <div className="flex items-center gap-1">
          {isUp ? <TrendingUp size={12} style={{ color: '#4CAF50' }} /> : <TrendingDown size={12} style={{ color: '#F44336' }} />}
          <span className="text-[10px] font-medium" style={{ color: isUp ? '#4CAF50' : '#F44336' }}>
            {isUp ? '+' : ''}{trend}%
          </span>
          <span className="text-[10px] text-[var(--text-disabled)]">vs geçen ay</span>
        </div>
      )}
    </div>
  );
};

const BarWidget: React.FC<{ widget: Widget }> = ({ widget }) => {
  const max = Math.max(...widget.data.map(d => d.value), 1);
  return (
    <div className="flex flex-col h-full p-4">
      <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-3">{widget.title}</span>
      <div className="flex-1 flex items-end gap-1.5">
        {widget.data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[9px] text-[var(--text-secondary)]">{d.value}</span>
            <div className="w-full rounded-t transition-all hover:opacity-80" style={{
              height: `${(d.value / max) * 100}%`,
              minHeight: 4,
              background: d.color || widget.config.color || CHART_COLORS[i % CHART_COLORS.length],
            }} />
            <span className="text-[8px] text-[var(--text-disabled)]">{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const LineWidget: React.FC<{ widget: Widget }> = ({ widget }) => {
  const max = Math.max(...widget.data.map(d => d.value), 1);
  const min = Math.min(...widget.data.map(d => d.value));
  const range = max - min || 1;
  const points = widget.data.map((d, i) => ({
    x: (i / Math.max(widget.data.length - 1, 1)) * 100,
    y: 100 - ((d.value - min) / range) * 80 - 10,
  }));
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <div className="flex flex-col h-full p-4">
      <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-2">{widget.title}</span>
      <div className="flex-1 relative">
        <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`grad-${widget.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={widget.config.color || '#7C4DFF'} stopOpacity="0.3" />
              <stop offset="100%" stopColor={widget.config.color || '#7C4DFF'} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={`${pathD} L 100 100 L 0 100 Z`} fill={`url(#grad-${widget.id})`} />
          <path d={pathD} fill="none" stroke={widget.config.color || '#7C4DFF'} strokeWidth="2" vectorEffect="non-scaling-stroke" />
          {points.map((p, i) => (
            <circle key={i} cx={p.x} cy={p.y} r="2" fill={widget.config.color || '#7C4DFF'} />
          ))}
        </svg>
        <div className="absolute bottom-0 left-0 right-0 flex justify-between">
          {widget.data.map((d, i) => <span key={i} className="text-[7px] text-[var(--text-disabled)]">{d.label}</span>)}
        </div>
      </div>
    </div>
  );
};

const PieWidget: React.FC<{ widget: Widget }> = ({ widget }) => {
  const total = widget.data.reduce((s, d) => s + d.value, 0) || 1;
  let cumAngle = -90;
  const slices = widget.data.map((d, i) => {
    const angle = (d.value / total) * 360;
    const startAngle = cumAngle;
    cumAngle += angle;
    const endAngle = cumAngle;
    const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
    const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
    const x2 = 50 + 40 * Math.cos((endAngle * Math.PI) / 180);
    const y2 = 50 + 40 * Math.sin((endAngle * Math.PI) / 180);
    const large = angle > 180 ? 1 : 0;
    return { d: `M 50 50 L ${x1} ${y1} A 40 40 0 ${large} 1 ${x2} ${y2} Z`, color: d.color || CHART_COLORS[i % CHART_COLORS.length], label: d.label, pct: Math.round((d.value / total) * 100) };
  });

  return (
    <div className="flex flex-col h-full p-4">
      <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-2">{widget.title}</span>
      <div className="flex-1 flex items-center gap-3">
        <svg viewBox="0 0 100 100" className="w-24 h-24 shrink-0">
          {slices.map((s, i) => <path key={i} d={s.d} fill={s.color} className="hover:opacity-80 transition-opacity" />)}
          <circle cx="50" cy="50" r="20" fill="var(--bg-window)" />
        </svg>
        <div className="flex-1 space-y-1">
          {slices.map((s, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.color }} />
              <span className="text-[10px] text-[var(--text-primary)] flex-1 truncate">{s.label}</span>
              <span className="text-[10px] text-[var(--text-secondary)]">{s.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ProgressWidget: React.FC<{ widget: Widget }> = ({ widget }) => {
  const value = widget.data[0]?.value ?? 0;
  const target = widget.config.target ?? 100;
  const pct = Math.min(100, (value / target) * 100);
  return (
    <div className="flex flex-col justify-between h-full p-4">
      <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">{widget.title}</span>
      <div>
        <div className="flex items-end justify-between mb-2">
          <span className="text-xl font-bold text-[var(--text-primary)]">{value}{widget.config.suffix}</span>
          <span className="text-xs text-[var(--text-secondary)]">/ {target}{widget.config.suffix}</span>
        </div>
        <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'var(--bg-hover)' }}>
          <div className="h-full rounded-full transition-all duration-500" style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${widget.config.color || '#7C4DFF'}, ${widget.config.color || '#7C4DFF'}aa)`,
          }} />
        </div>
      </div>
      <span className="text-[10px] text-[var(--text-secondary)]">{Math.round(pct)}% tamamlandı</span>
    </div>
  );
};

const TableWidget: React.FC<{ widget: Widget }> = ({ widget }) => (
  <div className="flex flex-col h-full p-4">
    <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-2">{widget.title}</span>
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      {widget.data.map((d, i) => (
        <div key={i} className="flex items-center justify-between py-1.5 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <span className="text-xs text-[var(--text-primary)] truncate flex-1">{d.label}</span>
          <span className="text-xs font-mono font-medium text-[var(--text-primary)] shrink-0 ml-2">
            {widget.config.prefix}{d.value.toLocaleString()}{widget.config.suffix}
          </span>
        </div>
      ))}
    </div>
  </div>
);

const NoteWidget: React.FC<{ widget: Widget; onUpdate: (w: Widget) => void }> = ({ widget, onUpdate }) => (
  <div className="flex flex-col h-full p-4">
    <span className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider mb-2">{widget.title}</span>
    <textarea
      value={widget.config.noteContent || ''}
      onChange={e => onUpdate({ ...widget, config: { ...widget.config, noteContent: e.target.value } })}
      placeholder="Not yazın..."
      className="flex-1 text-xs bg-transparent text-[var(--text-primary)] outline-none resize-none custom-scrollbar"
    />
  </div>
);

// ─── Widget Edit Modal ───
const WidgetEditor: React.FC<{
  widget: Widget;
  onSave: (w: Widget) => void;
  onClose: () => void;
}> = ({ widget, onSave, onClose }) => {
  const [w, setW] = useState<Widget>({ ...widget });
  const [newLabel, setNewLabel] = useState('');
  const [newValue, setNewValue] = useState('');

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="w-full max-w-[480px] max-h-[70vh] rounded-xl overflow-hidden flex flex-col"
        style={{ background: 'var(--bg-window)', border: '1px solid var(--border-default)' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <span className="text-sm font-semibold text-[var(--text-primary)]">Widget Düzenle</span>
          <button onClick={onClose} className="p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]"><X size={14} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          <div>
            <label className="text-[10px] text-[var(--text-secondary)] uppercase mb-1 block">Başlık</label>
            <input value={w.title} onChange={e => setW({ ...w, title: e.target.value })}
              className="w-full text-xs px-2 py-1.5 rounded bg-[var(--bg-input)] text-[var(--text-primary)] outline-none border border-[var(--border-subtle)]" />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[10px] text-[var(--text-secondary)] uppercase mb-1 block">Boyut</label>
              <select value={w.size} onChange={e => setW({ ...w, size: e.target.value as Widget['size'] })}
                className="w-full text-xs px-2 py-1.5 rounded bg-[var(--bg-input)] text-[var(--text-primary)] outline-none border border-[var(--border-subtle)]">
                <option value="sm">Küçük</option>
                <option value="md">Orta</option>
                <option value="lg">Büyük</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-[var(--text-secondary)] uppercase mb-1 block">Renk</label>
              <input type="color" value={w.config.color || '#7C4DFF'} onChange={e => setW({ ...w, config: { ...w.config, color: e.target.value } })}
                className="w-full h-8 rounded border border-[var(--border-subtle)] cursor-pointer" />
            </div>
          </div>
          {w.type === 'counter' && (
            <>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[10px] text-[var(--text-secondary)] uppercase mb-1 block">Değer</label>
                  <input type="number" value={w.data[0]?.value ?? 0} onChange={e => setW({ ...w, data: [{ ...w.data[0], value: parseFloat(e.target.value) || 0 }] })}
                    className="w-full text-xs px-2 py-1.5 rounded bg-[var(--bg-input)] text-[var(--text-primary)] outline-none border border-[var(--border-subtle)]" />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] text-[var(--text-secondary)] uppercase mb-1 block">Trend %</label>
                  <input type="number" value={w.config.trend ?? 0} onChange={e => setW({ ...w, config: { ...w.config, trend: parseFloat(e.target.value) || 0 } })}
                    className="w-full text-xs px-2 py-1.5 rounded bg-[var(--bg-input)] text-[var(--text-primary)] outline-none border border-[var(--border-subtle)]" />
                </div>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[10px] text-[var(--text-secondary)] uppercase mb-1 block">Ön Ek</label>
                  <input value={w.config.prefix || ''} onChange={e => setW({ ...w, config: { ...w.config, prefix: e.target.value } })}
                    placeholder="₺, $" className="w-full text-xs px-2 py-1.5 rounded bg-[var(--bg-input)] text-[var(--text-primary)] outline-none border border-[var(--border-subtle)]" />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] text-[var(--text-secondary)] uppercase mb-1 block">Son Ek</label>
                  <input value={w.config.suffix || ''} onChange={e => setW({ ...w, config: { ...w.config, suffix: e.target.value } })}
                    placeholder="%, adet" className="w-full text-xs px-2 py-1.5 rounded bg-[var(--bg-input)] text-[var(--text-primary)] outline-none border border-[var(--border-subtle)]" />
                </div>
              </div>
            </>
          )}
          {['bar', 'line', 'pie', 'table'].includes(w.type) && (
            <div>
              <label className="text-[10px] text-[var(--text-secondary)] uppercase mb-1 block">Veri Noktaları</label>
              <div className="space-y-1 mb-2">
                {w.data.map((d, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <input value={d.label} onChange={e => { const data = [...w.data]; data[i] = { ...data[i], label: e.target.value }; setW({ ...w, data }); }}
                      className="flex-1 text-xs px-2 py-1 rounded bg-[var(--bg-input)] text-[var(--text-primary)] outline-none border border-[var(--border-subtle)]" />
                    <input type="number" value={d.value} onChange={e => { const data = [...w.data]; data[i] = { ...data[i], value: parseFloat(e.target.value) || 0 }; setW({ ...w, data }); }}
                      className="w-20 text-xs px-2 py-1 rounded bg-[var(--bg-input)] text-[var(--text-primary)] outline-none border border-[var(--border-subtle)]" />
                    <button onClick={() => setW({ ...w, data: w.data.filter((_, j) => j !== i) })}
                      className="p-1 text-[var(--text-disabled)] hover:text-[var(--accent-error)]"><Trash2 size={10} /></button>
                  </div>
                ))}
              </div>
              <div className="flex gap-1">
                <input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Etiket"
                  className="flex-1 text-xs px-2 py-1 rounded bg-[var(--bg-input)] text-[var(--text-primary)] outline-none border border-[var(--border-subtle)]" />
                <input value={newValue} onChange={e => setNewValue(e.target.value)} placeholder="Değer" type="number"
                  className="w-20 text-xs px-2 py-1 rounded bg-[var(--bg-input)] text-[var(--text-primary)] outline-none border border-[var(--border-subtle)]" />
                <button onClick={() => { if (newLabel.trim()) { setW({ ...w, data: [...w.data, { label: newLabel.trim(), value: parseFloat(newValue) || 0 }] }); setNewLabel(''); setNewValue(''); } }}
                  className="px-2 py-1 rounded text-xs text-white" style={{ background: 'var(--accent-primary)' }}>+</button>
              </div>
            </div>
          )}
          {w.type === 'progress' && (
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[10px] text-[var(--text-secondary)] uppercase mb-1 block">Mevcut Değer</label>
                <input type="number" value={w.data[0]?.value ?? 0} onChange={e => setW({ ...w, data: [{ ...w.data[0], value: parseFloat(e.target.value) || 0 }] })}
                  className="w-full text-xs px-2 py-1.5 rounded bg-[var(--bg-input)] text-[var(--text-primary)] outline-none border border-[var(--border-subtle)]" />
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-[var(--text-secondary)] uppercase mb-1 block">Hedef</label>
                <input type="number" value={w.config.target ?? 100} onChange={e => setW({ ...w, config: { ...w.config, target: parseFloat(e.target.value) || 100 } })}
                  className="w-full text-xs px-2 py-1.5 rounded bg-[var(--bg-input)] text-[var(--text-primary)] outline-none border border-[var(--border-subtle)]" />
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 p-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
          <button onClick={onClose} className="px-3 py-1.5 rounded text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]">İptal</button>
          <button onClick={() => { onSave(w); onClose(); }} className="px-3 py-1.5 rounded text-xs text-white font-medium" style={{ background: 'var(--accent-primary)' }}>Kaydet</button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───
const DashboardBuilderApp: React.FC = () => {
  const [dashboards, setDashboards] = useState<Dashboard[]>(loadDashboards);
  const [activeDash, setActiveDash] = useState(0);
  const [editingWidget, setEditingWidget] = useState<string | null>(null);
  const [addMenuOpen, setAddMenuOpen] = useState(false);

  const dash = dashboards[activeDash];

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(dashboards)); }, [dashboards]);

  const updateDash = useCallback((updater: (d: Dashboard) => Dashboard) => {
    setDashboards(prev => prev.map((d, i) => i === activeDash ? updater(d) : d));
  }, [activeDash]);

  const addWidget = (type: WidgetType) => {
    const widget: Widget = {
      id: generateId(), type, title: WIDGET_TYPES.find(t => t.type === type)?.label || 'Widget',
      size: type === 'counter' ? 'sm' : 'md',
      data: type === 'counter' ? [{ label: 'Değer', value: 0 }] : type === 'progress' ? [{ label: 'İlerleme', value: 50 }] : [],
      config: { color: CHART_COLORS[dash.widgets.length % CHART_COLORS.length] },
    };
    updateDash(d => ({ ...d, widgets: [...d.widgets, widget] }));
    setAddMenuOpen(false);
    setEditingWidget(widget.id);
  };

  const updateWidget = (widget: Widget) => {
    updateDash(d => ({ ...d, widgets: d.widgets.map(w => w.id === widget.id ? widget : w) }));
  };

  const deleteWidget = (id: string) => {
    updateDash(d => ({ ...d, widgets: d.widgets.filter(w => w.id !== id) }));
  };

  const getSizeClass = (size: Widget['size']) => {
    if (size === 'sm') return 'col-span-1';
    if (size === 'md') return 'col-span-2';
    return 'col-span-4';
  };

  const renderWidget = (widget: Widget) => {
    switch (widget.type) {
      case 'counter': return <CounterWidget widget={widget} />;
      case 'bar': return <BarWidget widget={widget} />;
      case 'line': return <LineWidget widget={widget} />;
      case 'pie': return <PieWidget widget={widget} />;
      case 'progress': return <ProgressWidget widget={widget} />;
      case 'table': return <TableWidget widget={widget} />;
      case 'note': return <NoteWidget widget={widget} onUpdate={updateWidget} />;
      default: return null;
    }
  };

  const editWidget = editingWidget ? dash.widgets.find(w => w.id === editingWidget) : null;

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-window)' }}>
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b shrink-0" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-titlebar)' }}>
        <div className="flex items-center gap-1 flex-1">
          {dashboards.map((d, i) => (
            <button key={d.id} onClick={() => setActiveDash(i)}
              className="px-3 py-1 rounded text-xs transition-colors"
              style={{
                background: activeDash === i ? 'var(--accent-primary)' : 'transparent',
                color: activeDash === i ? '#fff' : 'var(--text-secondary)',
              }}>
              {d.name}
            </button>
          ))}
          <button onClick={() => setDashboards(prev => [...prev, { id: generateId(), name: `Dashboard ${dashboards.length + 1}`, widgets: [] }])}
            className="p-1 rounded hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]"><Plus size={14} /></button>
        </div>

        {/* Add Widget */}
        <div className="relative">
          <button onClick={() => setAddMenuOpen(!addMenuOpen)}
            className="flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium text-white"
            style={{ background: 'var(--accent-primary)' }}>
            <Plus size={12} /> Widget Ekle
          </button>
          {addMenuOpen && (
            <div className="absolute right-0 top-full mt-1 rounded-lg shadow-lg py-1 z-50"
              style={{ background: 'var(--bg-popover)', border: '1px solid var(--border-default)', minWidth: 180 }}>
              {WIDGET_TYPES.map(wt => (
                <button key={wt.type} onClick={() => addWidget(wt.type)}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-hover)] transition-colors">
                  {wt.icon} {wt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Widget Grid */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="grid grid-cols-4 gap-3 auto-rows-[160px]">
          {dash.widgets.map(widget => (
            <div key={widget.id} className={`${getSizeClass(widget.size)} rounded-xl overflow-hidden group relative transition-shadow hover:shadow-lg`}
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-subtle)',
                gridRow: widget.size === 'lg' ? 'span 1' : undefined,
              }}>
              {/* Actions overlay */}
              <div className="absolute top-1.5 right-1.5 flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button onClick={() => setEditingWidget(widget.id)}
                  className="p-1 rounded hover:bg-[var(--bg-hover)]" style={{ background: 'var(--bg-window)', border: '1px solid var(--border-subtle)' }}>
                  <Settings size={10} className="text-[var(--text-secondary)]" />
                </button>
                <button onClick={() => deleteWidget(widget.id)}
                  className="p-1 rounded hover:bg-[var(--bg-hover)]" style={{ background: 'var(--bg-window)', border: '1px solid var(--border-subtle)' }}>
                  <Trash2 size={10} className="text-[var(--accent-error)]" />
                </button>
              </div>
              {/* Widget color indicator */}
              <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: widget.config.color || 'var(--accent-primary)' }} />
              {renderWidget(widget)}
            </div>
          ))}
        </div>

        {dash.widgets.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-[var(--text-disabled)]">
            <BarChart3 size={48} />
            <span className="text-sm">Dashboard'a widget ekleyerek başlayın</span>
            <button onClick={() => setAddMenuOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium text-white"
              style={{ background: 'var(--accent-primary)' }}>
              <Plus size={12} /> Widget Ekle
            </button>
          </div>
        )}
      </div>

      {/* Widget Editor Modal */}
      {editWidget && (
        <WidgetEditor
          widget={editWidget}
          onSave={updateWidget}
          onClose={() => setEditingWidget(null)}
        />
      )}
    </div>
  );
};

export default DashboardBuilderApp;
