// ============================================================
// Web Browser — Real iframe browser with tabs & bookmarks
// ============================================================

import { useState, useRef, useCallback, useEffect, memo } from 'react';
import {
  ArrowLeft, ArrowRight, RefreshCw, Home, Star, Plus, X, Lock, Search,
  Globe, ExternalLink
} from 'lucide-react';

interface Tab {
  id: string;
  url: string;
  title: string;
  history: string[];
  historyIndex: number;
  loading: boolean;
}

interface Bookmark {
  url: string;
  title: string;
}

const QUICK_LINKS = [
  { name: 'Wikipedia', url: 'https://en.m.wikipedia.org', color: '#636466', emoji: '📚' },
  { name: 'DuckDuckGo', url: 'https://duckduckgo.com', color: '#DE5833', emoji: '🦆' },
  { name: 'MDN Docs', url: 'https://developer.mozilla.org', color: '#1B1B1B', emoji: '📖' },
  { name: 'W3Schools', url: 'https://www.w3schools.com', color: '#04AA6D', emoji: '🎓' },
  { name: 'Hacker News', url: 'https://news.ycombinator.com', color: '#FF6600', emoji: '📰' },
  { name: 'Example.com', url: 'https://example.com', color: '#0066CC', emoji: '🌐' },
  { name: 'Archive.org', url: 'https://archive.org', color: '#428BCA', emoji: '🏛️' },
  { name: 'HTTPBin', url: 'https://httpbin.org', color: '#73DC8C', emoji: '⚡' },
];

const generateId = () => Math.random().toString(36).slice(2);

const normalizeUrl = (input: string): string => {
  const trimmed = input.trim();
  if (!trimmed) return '';
  if (trimmed === 'home') return 'home';
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.includes(' ') || (!trimmed.includes('.') && !trimmed.startsWith('localhost'))) {
    return `https://duckduckgo.com/?q=${encodeURIComponent(trimmed)}`;
  }
  return `https://${trimmed}`;
};

const getHostname = (url: string): string => {
  try { return new URL(url).hostname; } catch { return url; }
};

// ---- Homepage ----
const Homepage = memo(function Homepage({ onNavigate }: { onNavigate: (url: string) => void }) {
  const [query, setQuery] = useState('');
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) onNavigate(`https://duckduckgo.com/?q=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div className="h-full flex flex-col items-center justify-start pt-12 custom-scrollbar overflow-auto" style={{ background: 'var(--bg-window)' }}>
      <div className="flex items-center gap-3 mb-8">
        <Globe size={36} style={{ color: 'var(--accent-primary)' }} />
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'var(--text-primary)' }}>LinuxOS Browser</h1>
      </div>

      <form onSubmit={handleSearch} className="w-full flex justify-center px-4 mb-10">
        <div className="flex items-center gap-2 px-4" style={{
          width: '480px', height: '44px', borderRadius: '22px',
          background: 'var(--bg-input)', border: '1px solid var(--border-default)',
        }}>
          <Search size={18} style={{ color: 'var(--text-disabled)', flexShrink: 0 }} />
          <input
            type="text" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Search with DuckDuckGo or enter URL"
            className="flex-1 bg-transparent outline-none"
            style={{ color: 'var(--text-primary)', fontSize: '14px' }}
          />
        </div>
      </form>

      <div className="grid grid-cols-4 gap-4 mb-10" style={{ maxWidth: '420px' }}>
        {QUICK_LINKS.map((link) => (
          <button key={link.name} onClick={() => onNavigate(link.url)}
            className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all hover:scale-105 hover:bg-[var(--bg-hover)]">
            <div className="flex items-center justify-center text-2xl" style={{ width: 48, height: 48, borderRadius: 12, background: link.color + '18' }}>
              {link.emoji}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{link.name}</span>
          </button>
        ))}
      </div>

      <div className="text-center px-6 max-w-md">
        <p style={{ fontSize: '11px', color: 'var(--text-disabled)', lineHeight: 1.5 }}>
          💡 Some sites block iframe embedding. Sites like Wikipedia, DuckDuckGo, W3Schools, and Archive.org work well.
          Type any URL or search term in the address bar.
        </p>
      </div>
    </div>
  );
});

// ---- Main Browser ----
export default function Browser() {
  const [tabs, setTabs] = useState<Tab[]>([
    { id: generateId(), url: 'home', title: 'New Tab', history: ['home'], historyIndex: 0, loading: false },
  ]);
  const [activeTabId, setActiveTabId] = useState(tabs[0].id);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    try { return JSON.parse(localStorage.getItem('ubuntuos_browser_bookmarks') || '[]'); } catch { return []; }
  });
  const [addressBarValue, setAddressBarValue] = useState('');
  const [iframeError, setIframeError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  useEffect(() => {
    localStorage.setItem('ubuntuos_browser_bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  const updateActiveTab = useCallback((updates: Partial<Tab>) => {
    setTabs((prev) => prev.map((t) => (t.id === activeTabId ? { ...t, ...updates } : t)));
  }, [activeTabId]);

  const navigateTo = useCallback((url: string) => {
    const normalized = normalizeUrl(url);
    if (!normalized) return;
    setIframeError(false);

    updateActiveTab({ loading: true });
    setTimeout(() => {
      setTabs((prev) => prev.map((t) => {
        if (t.id !== activeTabId) return t;
        const newHistory = t.history.slice(0, t.historyIndex + 1);
        if (newHistory[newHistory.length - 1] !== normalized) newHistory.push(normalized);
        const title = normalized === 'home' ? 'New Tab' : getHostname(normalized);
        return { ...t, url: normalized, title, history: newHistory, historyIndex: newHistory.length - 1, loading: false };
      }));
      setAddressBarValue(normalized === 'home' ? '' : normalized);
    }, 200);
  }, [activeTabId, updateActiveTab]);

  const addTab = useCallback(() => {
    const newTab: Tab = { id: generateId(), url: 'home', title: 'New Tab', history: ['home'], historyIndex: 0, loading: false };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
    setAddressBarValue('');
  }, []);

  const closeTab = useCallback((tabId: string) => {
    setTabs((prev) => {
      if (prev.length === 1) return [{ id: generateId(), url: 'home', title: 'New Tab', history: ['home'], historyIndex: 0, loading: false }];
      const filtered = prev.filter((t) => t.id !== tabId);
      if (activeTabId === tabId) {
        const idx = prev.findIndex((t) => t.id === tabId);
        const newActive = prev[idx - 1] || prev[idx + 1];
        if (newActive) setActiveTabId(newActive.id);
      }
      return filtered;
    });
  }, [activeTabId]);

  const goBack = useCallback(() => {
    setTabs((prev) => prev.map((t) => {
      if (t.id !== activeTabId || t.historyIndex <= 0) return t;
      const ni = t.historyIndex - 1;
      return { ...t, url: t.history[ni], historyIndex: ni };
    }));
    setIframeError(false);
  }, [activeTabId]);

  const goForward = useCallback(() => {
    setTabs((prev) => prev.map((t) => {
      if (t.id !== activeTabId || t.historyIndex >= t.history.length - 1) return t;
      const ni = t.historyIndex + 1;
      return { ...t, url: t.history[ni], historyIndex: ni };
    }));
    setIframeError(false);
  }, [activeTabId]);

  const refresh = useCallback(() => {
    if (iframeRef.current && activeTab.url !== 'home') {
      setIframeError(false);
      iframeRef.current.src = activeTab.url;
    }
  }, [activeTab]);

  const toggleBookmark = useCallback(() => {
    if (activeTab.url === 'home') return;
    setBookmarks((prev) => {
      const exists = prev.find((b) => b.url === activeTab.url);
      if (exists) return prev.filter((b) => b.url !== activeTab.url);
      return [...prev, { url: activeTab.url, title: activeTab.title }];
    });
  }, [activeTab]);

  const isBookmarked = bookmarks.some((b) => b.url === activeTab.url);
  const canGoBack = activeTab.historyIndex > 0;
  const canGoForward = activeTab.historyIndex < activeTab.history.length - 1;

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigateTo(addressBarValue);
  };

  const renderContent = () => {
    if (activeTab.loading) {
      return (
        <div className="h-full flex items-center justify-center" style={{ background: 'var(--bg-window)' }}>
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-1 rounded-full overflow-hidden" style={{ background: 'var(--border-subtle)', width: '200px' }}>
              <div className="h-full rounded-full" style={{
                background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-primary-hover))',
                animation: 'shimmer 1.5s infinite', width: '100%',
              }} />
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-disabled)' }}>Loading...</span>
          </div>
        </div>
      );
    }

    if (activeTab.url === 'home') return <Homepage onNavigate={navigateTo} />;

    return (
      <div className="relative w-full h-full">
        <iframe
          ref={iframeRef}
          src={activeTab.url}
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
          title={activeTab.title}
          referrerPolicy="no-referrer"
          onError={() => setIframeError(true)}
        />
        {iframeError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ background: 'var(--bg-window)' }}>
            <Globe size={48} className="mb-4" style={{ color: 'var(--text-disabled)' }} />
            <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Cannot load this page</h2>
            <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>This site blocks iframe embedding.</p>
            <a href={activeTab.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-white"
              style={{ background: 'var(--accent-primary)' }}>
              <ExternalLink size={14} /> Open in new tab
            </a>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-window)' }}>
      {/* Tab Bar */}
      <div className="flex items-center gap-1 px-2 shrink-0 overflow-x-auto"
        style={{ height: 36, background: 'var(--bg-titlebar)', borderBottom: '1px solid var(--border-subtle)' }}>
        {tabs.map((tab) => (
          <div key={tab.id}
            onClick={() => { setActiveTabId(tab.id); setAddressBarValue(tab.url === 'home' ? '' : tab.url); setIframeError(false); }}
            className="flex items-center gap-2 px-3 py-1.5 rounded-t-lg cursor-pointer transition-all shrink-0"
            style={{
              maxWidth: 180, minWidth: 100,
              background: tab.id === activeTabId ? 'var(--bg-window)' : 'transparent',
              borderTop: tab.id === activeTabId ? '2px solid var(--accent-primary)' : '2px solid transparent',
            }}>
            <Globe size={14} style={{ color: 'var(--text-secondary)', flexShrink: 0 }} />
            <span className="truncate flex-1" style={{ fontSize: '11px', color: 'var(--text-primary)' }}>{tab.title}</span>
            <button onClick={(e) => { e.stopPropagation(); closeTab(tab.id); }}
              className="flex items-center justify-center rounded-full transition-all hover:bg-[var(--bg-hover)]"
              style={{ width: 16, height: 16, flexShrink: 0 }}>
              <X size={12} style={{ color: 'var(--text-secondary)' }} />
            </button>
          </div>
        ))}
        <button onClick={addTab}
          className="flex items-center justify-center rounded-lg transition-all hover:bg-[var(--bg-hover)] ml-1"
          style={{ width: 28, height: 28, flexShrink: 0 }}>
          <Plus size={16} style={{ color: 'var(--text-secondary)' }} />
        </button>
      </div>

      {/* Address Bar */}
      <div className="flex items-center gap-2 px-3 shrink-0"
        style={{ height: 44, background: 'var(--bg-titlebar)', borderBottom: '1px solid var(--border-subtle)' }}>
        <button onClick={goBack} disabled={!canGoBack} className="flex items-center justify-center rounded-lg" style={{ width: 32, height: 32, opacity: canGoBack ? 1 : 0.3 }}>
          <ArrowLeft size={16} style={{ color: 'var(--text-primary)' }} />
        </button>
        <button onClick={goForward} disabled={!canGoForward} className="flex items-center justify-center rounded-lg" style={{ width: 32, height: 32, opacity: canGoForward ? 1 : 0.3 }}>
          <ArrowRight size={16} style={{ color: 'var(--text-primary)' }} />
        </button>
        <button onClick={refresh} className="flex items-center justify-center rounded-lg" style={{ width: 32, height: 32 }}>
          <RefreshCw size={16} style={{ color: 'var(--text-primary)' }} />
        </button>
        <button onClick={() => navigateTo('home')} className="flex items-center justify-center rounded-lg" style={{ width: 32, height: 32 }}>
          <Home size={16} style={{ color: 'var(--text-primary)' }} />
        </button>

        <form onSubmit={handleAddressSubmit} className="flex-1 flex items-center">
          <div className="flex items-center gap-2 px-3 flex-1" style={{
            height: 32, borderRadius: 16, background: 'var(--bg-input)', border: '1px solid var(--border-default)',
          }}>
            {activeTab.url.startsWith('https://') && <Lock size={14} style={{ color: 'var(--accent-success)', flexShrink: 0 }} />}
            <input type="text" value={addressBarValue}
              onChange={(e) => setAddressBarValue(e.target.value)}
              onFocus={() => setAddressBarValue(activeTab.url === 'home' ? '' : activeTab.url)}
              placeholder="Search or enter address"
              className="flex-1 bg-transparent outline-none"
              style={{ color: 'var(--text-primary)', fontSize: '13px' }} />
          </div>
        </form>

        <button onClick={toggleBookmark} className="flex items-center justify-center rounded-lg" style={{ width: 32, height: 32 }}>
          <Star size={16} style={{ color: isBookmarked ? 'var(--accent-secondary)' : 'var(--text-secondary)' }}
            fill={isBookmarked ? 'var(--accent-secondary)' : 'none'} />
        </button>
      </div>

      {/* Bookmark bar */}
      {bookmarks.length > 0 && (
        <div className="flex items-center gap-1 px-3 shrink-0 overflow-hidden"
          style={{ height: 32, background: 'var(--bg-titlebar)', borderBottom: '1px solid var(--border-subtle)' }}>
          {bookmarks.map((bm) => (
            <button key={bm.url} onClick={() => navigateTo(bm.url)}
              className="flex items-center gap-1.5 px-2 py-1 rounded transition-all hover:bg-[var(--bg-hover)]" style={{ maxWidth: 140 }}>
              <Star size={12} style={{ color: 'var(--accent-secondary)', flexShrink: 0 }} fill="var(--accent-secondary)" />
              <span className="truncate" style={{ fontSize: '11px', color: 'var(--text-primary)' }}>{bm.title}</span>
            </button>
          ))}
        </div>
      )}

      {/* Viewport */}
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
}
