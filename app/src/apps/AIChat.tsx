// ============================================================
// AI Chat — Gemini / OpenAI API chat assistant
// Supports markdown rendering, code blocks, conversation history
// ============================================================

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send, Trash2, Key, Bot, User, Copy, Check, Settings2, Loader2, Sparkles, AlertCircle,
} from 'lucide-react';

type Provider = 'gemini' | 'openai';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

const generateId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

// Simple markdown-like rendering
const renderContent = (text: string) => {
  const parts: React.ReactNode[] = [];
  const lines = text.split('\n');
  let inCodeBlock = false;
  let codeLang = '';
  let codeLines: string[] = [];
  let key = 0;

  for (const line of lines) {
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        // Close code block
        const code = codeLines.join('\n');
        parts.push(
          <div key={key++} className="my-2 rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-default)' }}>
            <div className="flex items-center justify-between px-3 py-1.5" style={{ background: 'var(--bg-titlebar)', fontSize: '10px', color: 'var(--text-disabled)' }}>
              <span>{codeLang || 'code'}</span>
              <CopyButton text={code} />
            </div>
            <pre className="px-3 py-2 overflow-x-auto text-xs" style={{ background: 'var(--bg-input)', color: 'var(--text-primary)', margin: 0, fontFamily: "'JetBrains Mono', monospace" }}>
              <code>{code}</code>
            </pre>
          </div>
        );
        codeLines = [];
        inCodeBlock = false;
        codeLang = '';
      } else {
        inCodeBlock = true;
        codeLang = line.slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    // Headers
    if (line.startsWith('### ')) {
      parts.push(<h4 key={key++} className="font-semibold mt-2 mb-1" style={{ fontSize: '13px', color: 'var(--text-primary)' }}>{line.slice(4)}</h4>);
    } else if (line.startsWith('## ')) {
      parts.push(<h3 key={key++} className="font-bold mt-3 mb-1" style={{ fontSize: '14px', color: 'var(--text-primary)' }}>{line.slice(3)}</h3>);
    } else if (line.startsWith('# ')) {
      parts.push(<h2 key={key++} className="font-bold mt-3 mb-1" style={{ fontSize: '16px', color: 'var(--text-primary)' }}>{line.slice(2)}</h2>);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      parts.push(<li key={key++} className="ml-4 text-xs" style={{ color: 'var(--text-primary)' }}>{renderInline(line.slice(2))}</li>);
    } else if (line.trim() === '') {
      parts.push(<br key={key++} />);
    } else {
      parts.push(<p key={key++} className="text-xs leading-relaxed" style={{ color: 'var(--text-primary)' }}>{renderInline(line)}</p>);
    }
  }

  return parts;
};

const renderInline = (text: string): React.ReactNode => {
  // Bold
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="px-1 py-0.5 rounded text-[11px]" style={{ background: 'var(--bg-input)', color: 'var(--accent-primary)', fontFamily: "'JetBrains Mono', monospace" }}>{part.slice(1, -1)}</code>;
    }
    return part;
  });
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={handleCopy} className="flex items-center gap-1 text-[10px] hover:text-[var(--text-primary)] transition-colors" style={{ color: 'var(--text-disabled)' }}>
      {copied ? <><Check size={10} /> Copied</> : <><Copy size={10} /> Copy</>}
    </button>
  );
}

// ---- API Callers ----
async function callGemini(apiKey: string, messages: Message[]): Promise<string> {
  const contents = messages.filter(m => m.role !== 'system').map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }));

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents,
        generationConfig: { maxOutputTokens: 4096, temperature: 0.7 },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gemini API error (${res.status})`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
}

async function callOpenAI(apiKey: string, messages: Message[]): Promise<string> {
  const msgs = messages.map(m => ({ role: m.role, content: m.content }));

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: msgs,
      max_tokens: 4096,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `OpenAI API error (${res.status})`);
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content || 'No response';
}

// ---- Main Component ----
export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>(() => {
    try { return JSON.parse(localStorage.getItem('aichat_history') || '[]'); } catch { return []; }
  });
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [provider, setProvider] = useState<Provider>(() => (localStorage.getItem('aichat_provider') as Provider) || 'gemini');
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(`aichat_key_${localStorage.getItem('aichat_provider') || 'gemini'}`) || '');
  const [showSettings, setShowSettings] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    localStorage.setItem('aichat_history', JSON.stringify(messages.slice(-100)));
  }, [messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    const key = localStorage.getItem(`aichat_key_${provider}`) || '';
    setApiKey(key);
  }, [provider]);

  const saveSettings = () => {
    localStorage.setItem('aichat_provider', provider);
    localStorage.setItem(`aichat_key_${provider}`, apiKey);
    setShowSettings(false);
    setError('');
  };

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;
    if (!apiKey) { setError('Set your API key in settings (⚙️)'); return; }

    const userMsg: Message = { id: generateId(), role: 'user', content: text, timestamp: Date.now() };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const reply = provider === 'gemini' ? await callGemini(apiKey, newMsgs) : await callOpenAI(apiKey, newMsgs);
      const assistantMsg: Message = { id: generateId(), role: 'assistant', content: reply, timestamp: Date.now() };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      setError(err.message || 'Failed to get response');
    } finally {
      setLoading(false);
    }
  }, [input, loading, apiKey, messages, provider]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearHistory = () => {
    setMessages([]);
    localStorage.removeItem('aichat_history');
  };

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-window)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 shrink-0" style={{ height: 44, borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-titlebar)' }}>
        <div className="flex items-center gap-2">
          <Sparkles size={16} style={{ color: 'var(--accent-primary)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>AI Assistant</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>
            {provider === 'gemini' ? 'Gemini 2.0 Flash' : 'GPT-4o Mini'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={clearHistory} className="p-1.5 rounded hover:bg-[var(--bg-hover)] transition-colors" title="Clear history">
            <Trash2 size={14} style={{ color: 'var(--text-secondary)' }} />
          </button>
          <button onClick={() => setShowSettings(!showSettings)} className="p-1.5 rounded hover:bg-[var(--bg-hover)] transition-colors" title="Settings">
            <Settings2 size={14} style={{ color: apiKey ? 'var(--text-secondary)' : 'var(--accent-warning)' }} />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="px-4 py-3 space-y-3" style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-titlebar)' }}>
          <div className="flex gap-2">
            {(['gemini', 'openai'] as Provider[]).map(p => (
              <button key={p} onClick={() => setProvider(p)}
                className="px-3 py-1.5 rounded text-xs font-medium transition-colors"
                style={{
                  background: provider === p ? 'var(--accent-primary)' : 'var(--bg-input)',
                  color: provider === p ? 'white' : 'var(--text-secondary)',
                }}>
                {p === 'gemini' ? '🔷 Gemini' : '🟢 OpenAI'}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Key size={14} style={{ color: 'var(--text-secondary)' }} />
            <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)}
              placeholder={provider === 'gemini' ? 'Gemini API Key (aistudio.google.com)' : 'OpenAI API Key (platform.openai.com)'}
              className="flex-1 bg-transparent outline-none text-xs" style={{ color: 'var(--text-primary)' }} />
            <button onClick={saveSettings} className="px-3 py-1 rounded text-xs font-medium text-white" style={{ background: 'var(--accent-primary)' }}>Save</button>
          </div>
          <p className="text-[10px]" style={{ color: 'var(--text-disabled)' }}>
            {provider === 'gemini' ? '🔑 Free at aistudio.google.com/apikey' : '🔑 Get key at platform.openai.com/api-keys'}
            {' • Key stored locally only'}
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-2 text-xs" style={{ color: 'var(--accent-error)', background: 'rgba(244,67,54,0.08)' }}>
          <AlertCircle size={14} /> <span>{error}</span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-3">
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bot size={48} className="mb-4" style={{ color: 'var(--text-disabled)' }} />
            <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>AI Assistant</h2>
            <p className="text-xs mb-4 max-w-[280px]" style={{ color: 'var(--text-secondary)' }}>
              Ask anything — code questions, file analysis, creative writing, or general knowledge.
            </p>
            <div className="flex flex-wrap gap-2 justify-center max-w-sm">
              {['Explain async/await', 'Write a Python script', 'Linux commands cheat sheet', 'Regex for email validation'].map(q => (
                <button key={q} onClick={() => { setInput(q); inputRef.current?.focus(); }}
                  className="px-3 py-1.5 rounded-full text-[11px] transition-colors hover:bg-[var(--bg-active)]"
                  style={{ background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-3 mb-4 ${msg.role === 'user' ? 'justify-end' : ''}`}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'var(--accent-primary)' }}>
                <Bot size={14} color="white" />
              </div>
            )}
            <div className="max-w-[85%] px-3 py-2 rounded-xl" style={{
              background: msg.role === 'user' ? 'var(--accent-primary)' : 'var(--bg-titlebar)',
              color: msg.role === 'user' ? 'white' : undefined,
              borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
            }}>
              {msg.role === 'user' ? (
                <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              ) : (
                <div>{renderContent(msg.content)}</div>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'var(--bg-hover)' }}>
                <User size={14} style={{ color: 'var(--text-secondary)' }} />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 mb-4">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'var(--accent-primary)' }}>
              <Bot size={14} color="white" />
            </div>
            <div className="px-4 py-3 rounded-xl flex items-center gap-2" style={{ background: 'var(--bg-titlebar)' }}>
              <Loader2 size={14} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Thinking...</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 shrink-0" style={{ borderTop: '1px solid var(--border-subtle)' }}>
        <div className="flex items-end gap-2 px-3 py-2 rounded-xl" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-default)' }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Enter to send, Shift+Enter for newline)"
            rows={1}
            className="flex-1 bg-transparent outline-none resize-none text-xs"
            style={{ color: 'var(--text-primary)', maxHeight: 120, minHeight: 20, lineHeight: '1.5' }}
          />
          <button onClick={sendMessage} disabled={loading || !input.trim()}
            className="flex items-center justify-center rounded-lg transition-all shrink-0"
            style={{
              width: 32, height: 32,
              background: input.trim() ? 'var(--accent-primary)' : 'transparent',
              opacity: input.trim() ? 1 : 0.3,
            }}>
            <Send size={14} color={input.trim() ? 'white' : 'var(--text-secondary)'} />
          </button>
        </div>
      </div>
    </div>
  );
}
