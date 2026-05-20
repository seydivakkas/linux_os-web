// ============================================================
// SpotlightSearch — Cmd/Ctrl+Space global search overlay
// Searches apps, files, and commands
// ============================================================

import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { Search, ArrowRight, Terminal, Folder, FileText, Settings, Globe, Sparkles, Calculator } from 'lucide-react';
import { APP_REGISTRY } from '@/apps/registry';
import { useOS } from '@/hooks/useOSStore';
import { useFileSystem } from '@/hooks/useFileSystem';
import type { LucideIcon } from 'lucide-react';

interface SearchResult {
  id: string;
  label: string;
  sublabel: string;
  icon: LucideIcon;
  category: 'app' | 'file' | 'command' | 'calc';
  action: () => void;
}

const ICON_MAP: Record<string, LucideIcon> = {
  Terminal, Folder, FileText, Settings, Globe, Sparkles, Calculator,
};

const SpotlightSearch = memo(function SpotlightSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { dispatch } = useOS();
  const fs = useFileSystem();

  // Ctrl+Space / Cmd+Space to toggle
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === ' ') {
        e.preventDefault();
        setOpen(prev => {
          if (!prev) setTimeout(() => inputRef.current?.focus(), 50);
          return !prev;
        });
        setQuery('');
        setSelectedIdx(0);
      }
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  const openApp = useCallback((appId: string) => {
    dispatch({ type: 'OPEN_WINDOW', appId });
    setOpen(false);
  }, [dispatch]);

  const results: SearchResult[] = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase().trim();
    const res: SearchResult[] = [];

    // Math expression
    if (/^[\d+\-*/().%\s]+$/.test(q)) {
      try {
        const sanitized = q.replace(/[^0-9+\-*/().%\s]/g, '');
        // eslint-disable-next-line no-new-func
        const result = new Function('return ' + sanitized)();
        if (typeof result === 'number' && !isNaN(result)) {
          res.push({
            id: 'calc', label: `= ${result}`, sublabel: q,
            icon: Calculator, category: 'calc', action: () => {
              navigator.clipboard.writeText(String(result));
            },
          });
        }
      } catch {}
    }

    // Apps
    APP_REGISTRY.forEach(app => {
      if (app.name.toLowerCase().includes(q) || app.id.includes(q) || app.category.toLowerCase().includes(q)) {
        res.push({
          id: `app-${app.id}`, label: app.name, sublabel: `${app.category} • ${app.description}`,
          icon: ICON_MAP[app.icon] || Globe, category: 'app',
          action: () => openApp(app.id),
        });
      }
    });

    // Files
    Object.values(fs.fs.nodes).forEach(node => {
      if (node.name.toLowerCase().includes(q) && !node.isHidden) {
        const path = fs.getNodePath(node.id);
        res.push({
          id: `file-${node.id}`, label: node.name, sublabel: path,
          icon: node.type === 'folder' ? Folder : FileText, category: 'file',
          action: () => {
            if (node.type === 'folder') openApp('filemanager');
            else openApp('texteditor');
            setOpen(false);
          },
        });
      }
    });

    // Terminal commands
    const commands = ['help', 'ls', 'cd', 'pwd', 'mkdir', 'rm', 'cat', 'echo', 'clear', 'whoami', 'date', 'uname', 'neofetch', 'calc', 'history', 'open', 'fetch', 'weather', 'theme', 'screenfetch'];
    commands.forEach(cmd => {
      if (cmd.includes(q)) {
        res.push({
          id: `cmd-${cmd}`, label: cmd, sublabel: 'Terminal command',
          icon: Terminal, category: 'command',
          action: () => openApp('terminal'),
        });
      }
    });

    return res.slice(0, 12);
  }, [query, openApp, fs]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIdx(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIdx(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIdx]) {
      results[selectedIdx].action();
      setOpen(false);
    }
  }, [results, selectedIdx]);

  useEffect(() => setSelectedIdx(0), [query]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 flex items-start justify-center pt-[15vh]"
      style={{ zIndex: 6000, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={() => setOpen(false)}
    >
      <div
        className="w-[520px] rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: 'rgba(30,30,30,0.95)', backdropFilter: 'blur(20px)', border: '1px solid rgba(255,255,255,0.1)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: results.length > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
          <Search size={20} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search apps, files, commands..."
            className="flex-1 bg-transparent outline-none text-base"
            style={{ color: 'var(--text-primary)' }}
            autoFocus
          />
          <kbd className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-disabled)' }}>ESC</kbd>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="max-h-[360px] overflow-y-auto custom-scrollbar py-1">
            {results.map((r, i) => {
              const Icon = r.icon;
              return (
                <button
                  key={r.id}
                  onClick={() => { r.action(); setOpen(false); }}
                  onMouseEnter={() => setSelectedIdx(i)}
                  className="w-full flex items-center gap-3 px-5 py-2.5 transition-colors"
                  style={{ background: i === selectedIdx ? 'rgba(124,77,255,0.12)' : 'transparent' }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{
                    background: r.category === 'app' ? 'rgba(124,77,255,0.15)' :
                      r.category === 'file' ? 'rgba(33,150,243,0.15)' :
                      r.category === 'calc' ? 'rgba(76,175,80,0.15)' : 'rgba(255,255,255,0.06)',
                  }}>
                    <Icon size={16} style={{
                      color: r.category === 'app' ? 'var(--accent-primary)' :
                        r.category === 'file' ? 'var(--accent-info)' :
                        r.category === 'calc' ? 'var(--accent-success)' : 'var(--text-secondary)',
                    }} />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>{r.label}</div>
                    <div className="text-[10px] truncate" style={{ color: 'var(--text-disabled)' }}>{r.sublabel}</div>
                  </div>
                  {i === selectedIdx && <ArrowRight size={14} style={{ color: 'var(--accent-primary)' }} />}
                </button>
              );
            })}
          </div>
        )}

        {/* Empty state */}
        {query && results.length === 0 && (
          <div className="px-5 py-6 text-center text-xs" style={{ color: 'var(--text-disabled)' }}>
            No results for "{query}"
          </div>
        )}

        {/* Hint */}
        {!query && (
          <div className="px-5 py-4 text-center text-[11px]" style={{ color: 'var(--text-disabled)' }}>
            Type to search apps, files, or math expressions
          </div>
        )}
      </div>
    </div>
  );
});

export default SpotlightSearch;
