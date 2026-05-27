// ============================================================
// CommandPalette — VS Code-style command palette (Ctrl+Shift+P)
// Fuzzy search across apps, commands, themes, and actions
// ============================================================

import { useState, useCallback, useEffect, useRef, memo, useMemo } from 'react';
import { useOS } from '@/hooks/useOSStore';
import { APP_REGISTRY } from '@/apps/registry';
import {
  Search, Moon, Sun, Monitor, Palette, Lock, LogOut,
  Maximize2, MinusSquare, LayoutGrid, Trash2, RefreshCw,
} from 'lucide-react';
import * as Icons from 'lucide-react';
import type { LucideProps } from 'lucide-react';
import type { ColorTheme } from '@/types';

const DynamicIcon = ({ name, ...props }: { name: string } & LucideProps) => {
  const IconComp = (Icons as unknown as Record<string, React.ComponentType<LucideProps>>)[name];
  return IconComp ? <IconComp {...props} /> : <Icons.HelpCircle {...props} />;
};

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: string | React.ReactNode;
  category: 'app' | 'action' | 'theme' | 'window';
  action: () => void;
  keywords?: string[];
}

// Simple fuzzy match
function fuzzyMatch(query: string, text: string): boolean {
  if (!query) return true;
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (t.includes(q)) return true;
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  return qi === q.length;
}

function fuzzyScore(query: string, text: string): number {
  if (!query) return 0;
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (t === q) return 100;
  if (t.startsWith(q)) return 80;
  if (t.includes(q)) return 60;
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  return qi === q.length ? 40 : 0;
}

const RECENT_KEY = 'linuxos_cmd_recent';

function loadRecent(): string[] {
  try {
    const saved = localStorage.getItem(RECENT_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
}

function saveRecent(ids: string[]) {
  localStorage.setItem(RECENT_KEY, JSON.stringify(ids.slice(0, 8)));
}

const CommandPalette = memo(function CommandPalette() {
  const { state, dispatch } = useOS();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentIds, setRecentIds] = useState<string[]>(loadRecent);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Build command list
  const commands: CommandItem[] = useMemo(() => {
    const items: CommandItem[] = [];

    // Apps
    APP_REGISTRY.forEach(app => {
      items.push({
        id: `app:${app.id}`,
        label: `Open ${app.name}`,
        description: app.description,
        icon: <DynamicIcon name={app.icon} size={16} />,
        category: 'app',
        action: () => dispatch({ type: 'OPEN_WINDOW', appId: app.id }),
        keywords: [app.name, app.category, app.id],
      });
    });

    // Theme actions
    items.push({
      id: 'theme:toggle',
      label: 'Toggle Dark/Light Mode',
      icon: state.theme.mode === 'dark' ? <Sun size={16} /> : <Moon size={16} />,
      category: 'theme',
      action: () => dispatch({ type: 'TOGGLE_THEME' }),
      keywords: ['dark', 'light', 'theme', 'mode'],
    });

    const themes: { id: ColorTheme; label: string }[] = [
      { id: 'default', label: 'Default' },
      { id: 'nord', label: 'Nord' },
      { id: 'dracula', label: 'Dracula' },
      { id: 'solarized', label: 'Solarized' },
      { id: 'gruvbox', label: 'Gruvbox' },
      { id: 'tokyo-night', label: 'Tokyo Night' },
    ];
    themes.forEach(t => {
      items.push({
        id: `theme:${t.id}`,
        label: `Theme: ${t.label}`,
        description: `Switch to ${t.label} color theme`,
        icon: <Palette size={16} />,
        category: 'theme',
        action: () => dispatch({ type: 'SET_THEME', theme: { colorTheme: t.id } }),
        keywords: ['theme', 'color', t.label.toLowerCase()],
      });
    });

    // System actions
    items.push(
      {
        id: 'action:minimize-all',
        label: 'Minimize All Windows',
        icon: <MinusSquare size={16} />,
        category: 'action',
        action: () => dispatch({ type: 'MINIMIZE_ALL' }),
        keywords: ['minimize', 'show desktop', 'hide'],
      },
      {
        id: 'action:cascade',
        label: 'Cascade Windows',
        icon: <LayoutGrid size={16} />,
        category: 'action',
        action: () => dispatch({ type: 'CASCADE_WINDOWS' }),
        keywords: ['cascade', 'arrange', 'organize'],
      },
      {
        id: 'action:launcher',
        label: 'Open App Launcher',
        icon: <LayoutGrid size={16} />,
        category: 'action',
        action: () => dispatch({ type: 'SET_APP_LAUNCHER', open: true }),
        keywords: ['launcher', 'apps', 'menu'],
      },
      {
        id: 'action:notifications',
        label: 'Toggle Notification Center',
        icon: <Monitor size={16} />,
        category: 'action',
        action: () => dispatch({ type: 'TOGGLE_NOTIFICATION_CENTER' }),
        keywords: ['notification', 'alerts'],
      },
      {
        id: 'action:lock',
        label: 'Lock Screen',
        icon: <Lock size={16} />,
        category: 'action',
        action: () => {
          // Lock screen is handled via the App component
          window.dispatchEvent(new CustomEvent('linuxos:lock'));
        },
        keywords: ['lock', 'security', 'password'],
      },
      {
        id: 'action:logout',
        label: 'Log Out',
        icon: <LogOut size={16} />,
        category: 'action',
        action: () => dispatch({ type: 'LOGOUT' }),
        keywords: ['logout', 'sign out', 'exit'],
      },
      {
        id: 'action:fullscreen',
        label: 'Toggle Fullscreen',
        icon: <Maximize2 size={16} />,
        category: 'action',
        action: () => {
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            document.documentElement.requestFullscreen();
          }
        },
        keywords: ['fullscreen', 'maximize', 'f11'],
      },
      {
        id: 'action:clear-storage',
        label: 'Clear All Data',
        description: 'Reset desktop to default state',
        icon: <Trash2 size={16} />,
        category: 'action',
        action: () => {
          if (confirm('This will clear all saved data. Continue?')) {
            localStorage.clear();
            location.reload();
          }
        },
        keywords: ['clear', 'reset', 'data', 'storage'],
      },
      {
        id: 'action:reload',
        label: 'Reload Desktop',
        icon: <RefreshCw size={16} />,
        category: 'action',
        action: () => location.reload(),
        keywords: ['reload', 'refresh', 'restart'],
      },
    );

    // Close active window
    if (state.activeWindowId) {
      const activeWin = state.windows.find(w => w.id === state.activeWindowId);
      if (activeWin) {
        items.push({
          id: 'window:close-active',
          label: `Close "${activeWin.title}"`,
          icon: <Icons.X size={16} />,
          category: 'window',
          action: () => dispatch({ type: 'CLOSE_WINDOW', windowId: activeWin.id }),
          keywords: ['close', 'window'],
        });
      }
    }

    return items;
  }, [dispatch, state.theme.mode, state.activeWindowId, state.windows]);

  // Filter and sort results
  const filteredCommands = useMemo(() => {
    if (!query) {
      // Show recent first, then popular actions
      const recent = recentIds
        .map(id => commands.find(c => c.id === id))
        .filter(Boolean) as CommandItem[];
      const rest = commands.filter(c => !recentIds.includes(c.id)).slice(0, 12);
      return [...recent, ...rest];
    }

    return commands
      .filter(cmd => {
        const searchText = [cmd.label, cmd.description, ...(cmd.keywords || [])].join(' ');
        return fuzzyMatch(query, searchText);
      })
      .sort((a, b) => {
        const scoreA = Math.max(
          fuzzyScore(query, a.label),
          ...(a.keywords || []).map(k => fuzzyScore(query, k))
        );
        const scoreB = Math.max(
          fuzzyScore(query, b.label),
          ...(b.keywords || []).map(k => fuzzyScore(query, k))
        );
        return scoreB - scoreA;
      })
      .slice(0, 20);
  }, [query, commands, recentIds]);

  // Keyboard shortcut to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'P') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  // Scroll selected into view
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const selected = list.children[selectedIndex] as HTMLElement;
    if (selected) {
      selected.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const executeCommand = useCallback((cmd: CommandItem) => {
    cmd.action();
    setIsOpen(false);
    // Update recent
    const newRecent = [cmd.id, ...recentIds.filter(id => id !== cmd.id)].slice(0, 8);
    setRecentIds(newRecent);
    saveRecent(newRecent);
  }, [recentIds]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = filteredCommands[selectedIndex];
      if (cmd) executeCommand(cmd);
    }
  }, [filteredCommands, selectedIndex, executeCommand]);

  if (!isOpen) return null;

  const categoryLabels: Record<string, string> = {
    app: 'Applications',
    action: 'System Actions',
    theme: 'Appearance',
    window: 'Windows',
  };

  // Group by category
  const grouped: { category: string; items: CommandItem[] }[] = [];
  const seen = new Set<string>();
  for (const cmd of filteredCommands) {
    if (!seen.has(cmd.category)) {
      seen.add(cmd.category);
      grouped.push({ category: cmd.category, items: [] });
    }
    grouped.find(g => g.category === cmd.category)!.items.push(cmd);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[6000]"
        style={{
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(4px)',
          animation: 'cmdFadeIn 100ms ease',
        }}
        onClick={() => setIsOpen(false)}
      />

      {/* Palette */}
      <div
        className="fixed z-[6001] left-1/2 top-[15%]"
        style={{
          transform: 'translateX(-50%)',
          width: 560,
          maxWidth: 'calc(100vw - 32px)',
          animation: 'cmdSlideDown 150ms cubic-bezier(0, 0, 0.2, 1)',
        }}
      >
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'var(--bg-panel)',
            border: '1px solid var(--border-default)',
            boxShadow: 'var(--shadow-xl)',
          }}
        >
          {/* Search input */}
          <div
            className="flex items-center gap-3 px-4"
            style={{
              height: 52,
              borderBottom: '1px solid var(--border-subtle)',
            }}
          >
            <Search size={18} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Type a command or search…"
              className="flex-1 bg-transparent border-none outline-none text-sm"
              style={{
                color: 'var(--text-primary)',
                fontFamily: 'inherit',
              }}
              autoComplete="off"
              spellCheck={false}
            />
            <kbd
              className="px-1.5 py-0.5 rounded text-[10px] font-medium"
              style={{
                background: 'var(--bg-hover)',
                color: 'var(--text-disabled)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div
            ref={listRef}
            className="overflow-y-auto custom-scrollbar"
            style={{ maxHeight: 360, padding: '4px 0' }}
          >
            {filteredCommands.length === 0 && (
              <div className="py-8 text-center">
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  No results found
                </p>
              </div>
            )}

            {grouped.map((group) => (
              <div key={group.category}>
                <div
                  className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wider"
                  style={{ color: 'var(--text-disabled)' }}
                >
                  {categoryLabels[group.category] || group.category}
                </div>
                {group.items.map((cmd) => {
                  const idx = filteredCommands.indexOf(cmd);
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={cmd.id}
                      className="w-full flex items-center gap-3 px-4 py-2 text-left transition-colors"
                      style={{
                        background: isSelected ? 'var(--bg-selected)' : 'transparent',
                        borderLeft: isSelected ? '2px solid var(--accent-primary)' : '2px solid transparent',
                      }}
                      onClick={() => executeCommand(cmd)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                    >
                      <span
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          background: isSelected ? 'var(--accent-primary)' : 'var(--bg-hover)',
                          color: isSelected ? '#fff' : 'var(--text-secondary)',
                          transition: 'all 100ms ease',
                        }}
                      >
                        {typeof cmd.icon === 'string' ? (
                          <DynamicIcon name={cmd.icon} size={16} />
                        ) : (
                          cmd.icon
                        )}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-sm font-medium truncate"
                          style={{ color: 'var(--text-primary)' }}
                        >
                          {cmd.label}
                        </div>
                        {cmd.description && (
                          <div
                            className="text-[11px] truncate"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            {cmd.description}
                          </div>
                        )}
                      </div>
                      {recentIds.includes(cmd.id) && !query && (
                        <span
                          className="text-[9px] px-1.5 py-0.5 rounded-full shrink-0"
                          style={{
                            background: 'var(--bg-hover)',
                            color: 'var(--text-disabled)',
                          }}
                        >
                          Recent
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-between px-4 py-2"
            style={{
              borderTop: '1px solid var(--border-subtle)',
            }}
          >
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-disabled)' }}>
                <kbd className="px-1 py-0.5 rounded" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)', fontSize: 9 }}>↑↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--text-disabled)' }}>
                <kbd className="px-1 py-0.5 rounded" style={{ background: 'var(--bg-hover)', border: '1px solid var(--border-subtle)', fontSize: 9 }}>↵</kbd>
                Execute
              </span>
            </div>
            <span className="text-[10px]" style={{ color: 'var(--text-disabled)' }}>
              {filteredCommands.length} command{filteredCommands.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes cmdFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes cmdSlideDown {
          from { opacity: 0; transform: translateX(-50%) translateY(-12px) scale(0.96); }
          to { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
});

export default CommandPalette;
