// ============================================================
// TimeTracker — Project-based time tracking with reports
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Play, Pause, Square, Plus, Trash2, Clock, BarChart3,
  Calendar, Tag, ChevronDown, Download, DollarSign,
} from 'lucide-react';

const generateId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

interface TimeEntry {
  id: string;
  projectId: string;
  description: string;
  startTime: number;
  endTime: number | null; // null = running
  tags: string[];
}

interface Project {
  id: string;
  name: string;
  color: string;
  hourlyRate: number;
}

const PROJECT_COLORS = ['#7C4DFF', '#00BCD4', '#4CAF50', '#FF9800', '#F44336', '#E91E63', '#3F51B5', '#8BC34A'];
const STORAGE_KEY = 'linuxos_timetracker';

interface TimeTrackerState {
  projects: Project[];
  entries: TimeEntry[];
}

const loadState = (): TimeTrackerState => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* ignore */ }
  return {
    projects: [
      { id: 'p1', name: 'LinuxOS Web', color: '#7C4DFF', hourlyRate: 100 },
      { id: 'p2', name: 'API Geliştirme', color: '#00BCD4', hourlyRate: 120 },
      { id: 'p3', name: 'Toplantılar', color: '#FF9800', hourlyRate: 0 },
    ],
    entries: [
      { id: generateId(), projectId: 'p1', description: 'Dashboard bileşeni', startTime: Date.now() - 7200000, endTime: Date.now() - 3600000, tags: ['frontend'] },
      { id: generateId(), projectId: 'p2', description: 'Auth endpoint', startTime: Date.now() - 86400000 - 3600000, endTime: Date.now() - 86400000, tags: ['backend'] },
      { id: generateId(), projectId: 'p1', description: 'Kanban modülü', startTime: Date.now() - 172800000, endTime: Date.now() - 172800000 + 5400000, tags: ['frontend', 'feature'] },
    ],
  };
};

const formatDuration = (ms: number): string => {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const formatHours = (ms: number): string => {
  const h = ms / 3600000;
  return h.toFixed(1);
};

const dayStart = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
const weekStart = (d: Date) => { const day = d.getDay() || 7; return dayStart(new Date(d.getFullYear(), d.getMonth(), d.getDate() - day + 1)); };

const TimeTracker: React.FC = () => {
  const [state, setState] = useState<TimeTrackerState>(loadState);
  const [now, setNow] = useState(Date.now());
  const [view, setView] = useState<'timer' | 'report'>('timer');
  const [newProject, setNewProject] = useState('');
  const [activeProject, setActiveProject] = useState(state.projects[0]?.id || '');
  const [activeDesc, setActiveDesc] = useState('');
  const [reportRange, setReportRange] = useState<'today' | 'week' | 'month' | 'all'>('week');
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }, [state]);

  // Timer tick
  const running = state.entries.find(e => e.endTime === null);
  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setNow(Date.now()), 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const startTimer = () => {
    if (running) return;
    const entry: TimeEntry = {
      id: generateId(), projectId: activeProject, description: activeDesc,
      startTime: Date.now(), endTime: null, tags: [],
    };
    setState(prev => ({ ...prev, entries: [entry, ...prev.entries] }));
  };

  const stopTimer = () => {
    if (!running) return;
    setState(prev => ({
      ...prev,
      entries: prev.entries.map(e => e.id === running.id ? { ...e, endTime: Date.now() } : e),
    }));
  };

  const deleteEntry = (id: string) => {
    setState(prev => ({ ...prev, entries: prev.entries.filter(e => e.id !== id) }));
  };

  const addProject = () => {
    if (!newProject.trim()) return;
    const project: Project = { id: generateId(), name: newProject.trim(), color: PROJECT_COLORS[state.projects.length % PROJECT_COLORS.length], hourlyRate: 0 };
    setState(prev => ({ ...prev, projects: [...prev.projects, project] }));
    setActiveProject(project.id);
    setNewProject('');
  };

  const getProject = (id: string) => state.projects.find(p => p.id === id);

  // ─── Report Data ───
  const getFilteredEntries = () => {
    const now = new Date();
    const rangeStart = reportRange === 'today' ? dayStart(now)
      : reportRange === 'week' ? weekStart(now)
      : reportRange === 'month' ? new Date(now.getFullYear(), now.getMonth(), 1).getTime()
      : 0;
    return state.entries.filter(e => e.endTime && e.startTime >= rangeStart);
  };

  const reportEntries = getFilteredEntries();
  const totalMs = reportEntries.reduce((s, e) => s + (e.endTime! - e.startTime), 0);

  const projectTotals = state.projects.map(p => {
    const entries = reportEntries.filter(e => e.projectId === p.id);
    const ms = entries.reduce((s, e) => s + (e.endTime! - e.startTime), 0);
    return { ...p, ms, hours: ms / 3600000, earnings: (ms / 3600000) * p.hourlyRate, entries: entries.length };
  }).filter(p => p.ms > 0).sort((a, b) => b.ms - a.ms);

  const exportCSV = () => {
    let csv = 'Tarih,Proje,Açıklama,Süre (saat),Tutar (₺)\n';
    reportEntries.forEach(e => {
      const project = getProject(e.projectId);
      const hours = (e.endTime! - e.startTime) / 3600000;
      csv += `${new Date(e.startTime).toLocaleDateString('tr')},${project?.name || ''},${e.description},${hours.toFixed(2)},${(hours * (project?.hourlyRate || 0)).toFixed(2)}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'zaman-raporu.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-window)' }}>
      {/* Tab bar */}
      <div className="flex items-center gap-1 px-3 py-2 border-b shrink-0" style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-titlebar)' }}>
        <button onClick={() => setView('timer')} className="flex items-center gap-1 px-3 py-1 rounded text-xs transition-colors"
          style={{ background: view === 'timer' ? 'var(--accent-primary)' : 'transparent', color: view === 'timer' ? '#fff' : 'var(--text-secondary)' }}>
          <Clock size={12} /> Zamanlayıcı
        </button>
        <button onClick={() => setView('report')} className="flex items-center gap-1 px-3 py-1 rounded text-xs transition-colors"
          style={{ background: view === 'report' ? 'var(--accent-primary)' : 'transparent', color: view === 'report' ? '#fff' : 'var(--text-secondary)' }}>
          <BarChart3 size={12} /> Rapor
        </button>
      </div>

      {view === 'timer' ? (
        <>
          {/* Timer Controls */}
          <div className="p-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
            <div className="flex items-center gap-2 mb-3">
              <input value={activeDesc} onChange={e => setActiveDesc(e.target.value)} placeholder="Ne üzerinde çalışıyorsun?"
                className="flex-1 text-xs px-3 py-2 rounded-lg bg-[var(--bg-input)] text-[var(--text-primary)] outline-none border border-[var(--border-subtle)]"
                onKeyDown={e => e.key === 'Enter' && !running && startTimer()} />
              <select value={activeProject} onChange={e => setActiveProject(e.target.value)}
                className="text-xs px-2 py-2 rounded-lg bg-[var(--bg-input)] text-[var(--text-primary)] outline-none border border-[var(--border-subtle)]">
                {state.projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              {running ? (
                <button onClick={stopTimer} className="p-2.5 rounded-lg text-white transition-colors" style={{ background: '#F44336' }}><Square size={16} /></button>
              ) : (
                <button onClick={startTimer} className="p-2.5 rounded-lg text-white transition-colors" style={{ background: '#4CAF50' }}><Play size={16} /></button>
              )}
            </div>
            {/* Running timer display */}
            {running && (
              <div className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'rgba(76,175,80,0.1)', border: '1px solid rgba(76,175,80,0.3)' }}>
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#4CAF50' }} />
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: getProject(running.projectId)?.color }} />
                <span className="text-xs text-[var(--text-primary)] flex-1">{running.description || getProject(running.projectId)?.name}</span>
                <span className="text-lg font-mono font-bold text-[#4CAF50]">{formatDuration(now - running.startTime)}</span>
              </div>
            )}
            {/* Add project */}
            <div className="flex gap-1 mt-2">
              <input value={newProject} onChange={e => setNewProject(e.target.value)} placeholder="Yeni proje ekle..."
                className="flex-1 text-[10px] px-2 py-1 rounded bg-[var(--bg-input)] text-[var(--text-primary)] outline-none border border-[var(--border-subtle)]"
                onKeyDown={e => e.key === 'Enter' && addProject()} />
              <button onClick={addProject} className="px-2 py-1 rounded text-[10px] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"><Plus size={10} /></button>
            </div>
          </div>

          {/* Entry List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {state.entries.filter(e => e.endTime).slice(0, 50).map(entry => {
              const project = getProject(entry.projectId);
              const duration = entry.endTime! - entry.startTime;
              return (
                <div key={entry.id} className="flex items-center gap-2 px-4 py-2.5 border-b hover:bg-[var(--bg-hover)] transition-colors group" style={{ borderColor: 'var(--border-subtle)' }}>
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: project?.color || '#999' }} />
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-[var(--text-primary)] block truncate">{entry.description || project?.name || '—'}</span>
                    <span className="text-[10px] text-[var(--text-secondary)]">{project?.name} · {new Date(entry.startTime).toLocaleDateString('tr')}</span>
                  </div>
                  <span className="text-xs font-mono text-[var(--text-primary)] shrink-0">{formatDuration(duration)}</span>
                  {project && project.hourlyRate > 0 && (
                    <span className="text-[10px] font-mono text-[var(--text-secondary)] shrink-0">₺{((duration / 3600000) * project.hourlyRate).toFixed(0)}</span>
                  )}
                  <button onClick={() => deleteEntry(entry.id)} className="p-1 rounded opacity-0 group-hover:opacity-100 text-[var(--text-disabled)] hover:text-[var(--accent-error)]"><Trash2 size={11} /></button>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        /* Report View */
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {/* Report Controls */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {(['today', 'week', 'month', 'all'] as const).map(r => (
                <button key={r} onClick={() => setReportRange(r)}
                  className="px-2.5 py-1 rounded text-xs transition-colors"
                  style={{ background: reportRange === r ? 'var(--accent-primary)' : 'transparent', color: reportRange === r ? '#fff' : 'var(--text-secondary)' }}>
                  {{ today: 'Bugün', week: 'Hafta', month: 'Ay', all: 'Tümü' }[r]}
                </button>
              ))}
            </div>
            <button onClick={exportCSV} className="flex items-center gap-1 px-2 py-1 rounded text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]">
              <Download size={12} /> CSV
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
              <span className="text-[10px] text-[var(--text-secondary)] uppercase">Toplam Süre</span>
              <div className="text-lg font-mono font-bold text-[var(--text-primary)] mt-1">{formatHours(totalMs)} saat</div>
            </div>
            <div className="p-3 rounded-lg" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
              <span className="text-[10px] text-[var(--text-secondary)] uppercase">Giriş Sayısı</span>
              <div className="text-lg font-mono font-bold text-[var(--text-primary)] mt-1">{reportEntries.length}</div>
            </div>
            <div className="p-3 rounded-lg" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
              <span className="text-[10px] text-[var(--text-secondary)] uppercase">Toplam Gelir</span>
              <div className="text-lg font-mono font-bold text-[#4CAF50] mt-1">₺{projectTotals.reduce((s, p) => s + p.earnings, 0).toFixed(0)}</div>
            </div>
          </div>

          {/* Project Breakdown */}
          <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-subtle)' }}>
            <div className="px-3 py-2 text-[10px] text-[var(--text-secondary)] uppercase" style={{ background: 'var(--bg-secondary)' }}>Proje Dağılımı</div>
            {projectTotals.map(p => (
              <div key={p.id} className="flex items-center gap-2 px-3 py-2.5 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <span className="w-3 h-3 rounded shrink-0" style={{ background: p.color }} />
                <span className="text-xs text-[var(--text-primary)] flex-1">{p.name}</span>
                <span className="text-xs font-mono text-[var(--text-secondary)]">{p.entries} giriş</span>
                <span className="text-xs font-mono font-semibold text-[var(--text-primary)]">{p.hours.toFixed(1)}h</span>
                {p.hourlyRate > 0 && <span className="text-xs font-mono text-[#4CAF50]">₺{p.earnings.toFixed(0)}</span>}
                <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-hover)' }}>
                  <div className="h-full rounded-full" style={{ width: `${totalMs > 0 ? (p.ms / totalMs) * 100 : 0}%`, background: p.color }} />
                </div>
              </div>
            ))}
          </div>

          {/* Project Hourly Rates */}
          <div className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-subtle)' }}>
            <div className="px-3 py-2 text-[10px] text-[var(--text-secondary)] uppercase flex items-center gap-1" style={{ background: 'var(--bg-secondary)' }}><DollarSign size={10} /> Saatlik Ücretler</div>
            {state.projects.map(p => (
              <div key={p.id} className="flex items-center gap-2 px-3 py-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: p.color }} />
                <span className="text-xs text-[var(--text-primary)] flex-1">{p.name}</span>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-[var(--text-secondary)]">₺</span>
                  <input type="number" min={0} value={p.hourlyRate}
                    onChange={e => setState(prev => ({ ...prev, projects: prev.projects.map(pp => pp.id === p.id ? { ...pp, hourlyRate: parseFloat(e.target.value) || 0 } : pp) }))}
                    className="w-16 text-xs text-right font-mono bg-transparent text-[var(--text-primary)] outline-none border-b border-[var(--border-subtle)]" />
                  <span className="text-[10px] text-[var(--text-secondary)]">/saat</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeTracker;
