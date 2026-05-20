// ============================================================
// Terminal — Bash-like command processing
// ============================================================

import { useState, useRef, useEffect, useCallback } from 'react';
import { useFileSystem } from '@/hooks/useFileSystem';
import { useOS } from '@/hooks/useOSStore';
import { getAppById } from '@/apps/registry';

interface TerminalLine {
  type: 'input' | 'output' | 'error' | 'system';
  text: string;
}

const COMMANDS: Record<string, (args: string[], ctx: TerminalContext, pipeInput?: string) => string | string[]> = {
  help: () => [
    'Available commands:',
    '  ls [path]        - List directory contents',
    '  cd [path]        - Change directory',
    '  pwd              - Print working directory',
    '  mkdir <name>     - Create directory',
    '  rm <name>        - Remove file or directory',
    '  cat <file>       - Display file contents',
    '  echo <text>      - Print text',
    '  clear            - Clear terminal',
    '  whoami           - Print current user',
    '  date             - Print current date and time',
    '  uname            - Print system info',
    '  neofetch         - Display system information',
    '  calc <expr>      - Calculate expression',
    '  touch <file>     - Create empty file',
    '  history          - Show command history',
    '  open <app>       - Open an application',
    '  fetch <url>      - HTTP GET request',
    '  weather [city]   - Real weather data',
    '  theme [name]     - Change color theme',
    '  screenfetch      - Browser system info',
    '  grep <pattern>   - Filter lines (pipe-friendly)',
    '  head [n]         - Show first n lines',
    '  tail [n]         - Show last n lines',
    '  wc               - Count lines, words, chars',
    '  sort             - Sort lines',
    '  uniq             - Remove duplicate lines',
    '  env              - Environment variables',
    '  uptime           - System uptime',
    '  df               - Disk usage',
    '  free             - Memory usage',
    '  cmd1 | cmd2      - Pipe output between commands',
    '  ai <description> - Translate natural language to command',
    '  help             - Show this help message',
  ],

  ls: (args, ctx) => {
    const targetPath = args[0] || ctx.currentPath;
    const node = ctx.findNodeByPath(targetPath);
    if (!node) return `ls: cannot access '${targetPath}': No such file or directory`;
    if (node.type === 'file') return node.name;
    const children = ctx.getChildren(node.id);
    if (children.length === 0) return '';
    return children.map((c) => {
      const prefix = c.type === 'folder' ? '\x1b[34m' : '\x1b[0m';
      const suffix = '\x1b[0m';
      return `${prefix}${c.name}${suffix}`;
    });
  },

  cd: (args, ctx) => {
    if (!args[0] || args[0] === '~') {
      ctx.setCurrentPath('/home/user');
      return '';
    }
    let target = args[0];
    if (target.startsWith('/')) {
      const node = ctx.findNodeByPath(target);
      if (!node) return `cd: no such file or directory: ${target}`;
      if (node.type !== 'folder') return `cd: not a directory: ${target}`;
      ctx.setCurrentPath(target);
      return '';
    }
    // Relative path
    const currentParts = ctx.currentPath.split('/').filter(Boolean);
    const parts = target.split('/').filter(Boolean);
    for (const part of parts) {
      if (part === '..') {
        currentParts.pop();
      } else if (part !== '.') {
        currentParts.push(part);
      }
    }
    const newPath = '/' + currentParts.join('/');
    const node = ctx.findNodeByPath(newPath);
    if (!node) return `cd: no such file or directory: ${target}`;
    if (node.type !== 'folder') return `cd: not a directory: ${target}`;
    ctx.setCurrentPath(newPath);
    return '';
  },

  pwd: (_args, ctx) => ctx.currentPath,

  mkdir: (args, ctx) => {
    if (!args[0]) return 'mkdir: missing operand';
    const currentNode = ctx.findNodeByPath(ctx.currentPath);
    if (!currentNode) return 'mkdir: cannot create directory';
    ctx.createFolder(currentNode.id, args[0]);
    return '';
  },

  touch: (args, ctx) => {
    if (!args[0]) return 'touch: missing file operand';
    const currentNode = ctx.findNodeByPath(ctx.currentPath);
    if (!currentNode) return 'touch: cannot create file';
    ctx.createFile(currentNode.id, args[0]);
    return '';
  },

  rm: (args, ctx) => {
    if (!args[0]) return 'rm: missing operand';
    const currentNode = ctx.findNodeByPath(ctx.currentPath);
    if (!currentNode) return 'rm: cannot remove';
    const children = ctx.getChildren(currentNode.id);
    const target = children.find((c) => c.name === args[0]);
    if (!target) return `rm: cannot remove '${args[0]}': No such file or directory`;
    ctx.deleteNode(target.id);
    return '';
  },

  cat: (args, ctx) => {
    if (!args[0]) return 'cat: missing file operand';
    const currentNode = ctx.findNodeByPath(ctx.currentPath);
    if (!currentNode) return 'cat: cannot read file';
    const children = ctx.getChildren(currentNode.id);
    const target = children.find((c) => c.name === args[0]);
    if (!target) return `cat: '${args[0]}': No such file or directory`;
    if (target.type === 'folder') return `cat: '${args[0]}': Is a directory`;
    const content = ctx.readFile(target.id);
    return content || '';
  },

  echo: (args) => args.join(' '),

  clear: (_args, ctx) => {
    ctx.clear();
    return '';
  },

  whoami: () => 'user',

  date: () => new Date().toString(),

  uname: () => 'UbuntuOS Web 1.0.0-generic x86_64',

  neofetch: () => [
    '\x1b[35m       _    _  _   _  ____   ___  ____   _____ \x1b[0m',
    '\x1b[35m      / \\  | || | / \\|  _ \\ / _ \\|  _ \\ / ____|\x1b[0m',
    '\x1b[35m     / _ \\ | || |/ _ \\ | | | | | | |_) | (___  \x1b[0m',
    '\x1b[35m    / ___ \\|__   _/ ___ \\| |_| |  _ < \\___ \\ \x1b[0m',
    '\x1b[35m   /_/   \\_\\_| |_/_/   \\_\\____/|_| \\_\\____/ \x1b[0m',
    '',
    '\x1b[36mOS:\x1b[0m UbuntuOS Web 1.0.0',
    '\x1b[36mKernel:\x1b[0m browser-engine-20.0',
    '\x1b[36mShell:\x1b[0m ubuntushell 1.0',
    '\x1b[36mDE:\x1b[0m GNOME-like Web Desktop',
    '\x1b[36mTheme:\x1b[0m Adwaita-dark [GTK2/3]',
    '\x1b[36mIcons:\x1b[0m Ubuntu-mono-dark [GTK2/3]',
    '\x1b[36mTerminal:\x1b[0m ubuntuterminal',
    '\x1b[36mCPU:\x1b[0m Virtual Web Core',
    '\x1b[36mMemory:\x1b[0m Browser Allocated',
  ],

  calc: (args) => {
    if (!args.length) return 'calc: missing expression';
    const expr = args.join('');
    try {
      // Safe evaluation - only allow numbers and basic operators
      const sanitized = expr.replace(/[^0-9+\-*/().\s]/g, '');
      if (sanitized !== expr) return 'calc: invalid characters in expression';
      // eslint-disable-next-line no-new-func
      const result = new Function('return ' + sanitized)();
      return String(result);
    } catch {
      return 'calc: invalid expression';
    }
  },

  history: (_args, ctx) => {
    return ctx.history.map((cmd, i) => `${i + 1}  ${cmd}`);
  },

  open: (args, ctx) => {
    if (!args[0]) return 'open: usage: open <app-name>';
    const appId = args[0].toLowerCase();
    const app = getAppById(appId);
    if (!app) return `open: unknown app '${appId}'. Try: terminal, browser, calculator, settings, aichat, weather, clock, etc.`;
    ctx.dispatch({ type: 'OPEN_WINDOW', appId });
    return `Opening ${app.name}...`;
  },

  screenfetch: () => {
    const mem = (navigator as any).deviceMemory || '?';
    const cores = navigator.hardwareConcurrency || '?';
    const lang = navigator.language;
    const ua = navigator.userAgent;
    const screen = `${window.screen.width}x${window.screen.height}`;
    return [
      '\x1b[35m   _     _                   ___  ____  \x1b[0m',
      '\x1b[35m  | |   (_)_ __  _   ___  __/ _ \\/ ___| \x1b[0m',
      '\x1b[35m  | |   | | \'_ \\| | | \\ \\/ / | | \\___ \\ \x1b[0m',
      '\x1b[35m  | |___| | | | | |_| |>  <| |_| |___) |\x1b[0m',
      '\x1b[35m  |_____|_|_| |_|\\__,_/_/\\_\\\\___/|____/ \x1b[0m',
      '',
      `\x1b[36mOS:\x1b[0m LinuxOS Web 2.0`,
      `\x1b[36mKernel:\x1b[0m browser-engine ${navigator.appVersion?.split(' ')[0] || 'unknown'}`,
      `\x1b[36mCPU:\x1b[0m ${cores} cores`,
      `\x1b[36mMemory:\x1b[0m ${mem} GB`,
      `\x1b[36mResolution:\x1b[0m ${screen}`,
      `\x1b[36mLanguage:\x1b[0m ${lang}`,
      `\x1b[36mBrowser:\x1b[0m ${ua.includes('Chrome') ? 'Chrome' : ua.includes('Firefox') ? 'Firefox' : 'Unknown'}`,
      `\x1b[36mShell:\x1b[0m linuxsh 3.0`,
      `\x1b[36mDE:\x1b[0m GNOME Web Desktop`,
    ];
  },

  // ---- Phase 3: Pipe-friendly text commands ----
  grep: (args, _ctx, pipeInput) => {
    if (!args[0]) return 'grep: usage: grep <pattern> [text]';
    const pattern = args[0];
    const lines = pipeInput ? pipeInput.split('\n') : (args.slice(1).join(' ') || '').split('\n');
    const regex = new RegExp(pattern, 'i');
    const matched = lines.filter(l => regex.test(l));
    return matched.length > 0 ? matched : 'grep: no match';
  },

  head: (args, _ctx, pipeInput) => {
    const n = parseInt(args[0]) || 10;
    const text = pipeInput || '';
    return text.split('\n').slice(0, n);
  },

  tail: (args, _ctx, pipeInput) => {
    const n = parseInt(args[0]) || 10;
    const text = pipeInput || '';
    const lines = text.split('\n');
    return lines.slice(Math.max(0, lines.length - n));
  },

  wc: (_args, _ctx, pipeInput) => {
    const text = pipeInput || '';
    const lines = text.split('\n').length;
    const words = text.split(/\s+/).filter(Boolean).length;
    const chars = text.length;
    return `  ${lines}  ${words}  ${chars}`;
  },

  sort: (_args, _ctx, pipeInput) => {
    if (!pipeInput) return 'sort: no input';
    return pipeInput.split('\n').sort().join('\n');
  },

  uniq: (_args, _ctx, pipeInput) => {
    if (!pipeInput) return 'uniq: no input';
    const lines = pipeInput.split('\n');
    return lines.filter((l, i) => i === 0 || l !== lines[i - 1]);
  },

  env: () => {
    return [
      `USER=user`,
      `HOME=/home/user`,
      `SHELL=/bin/linuxsh`,
      `LANG=${navigator.language}`,
      `TERM=xterm-256color`,
      `PATH=/usr/bin:/bin:/usr/local/bin`,
      `DISPLAY=:0`,
      `DESKTOP_SESSION=gnome`,
      `XDG_CURRENT_DESKTOP=LinuxOS`,
      `BROWSER=chromium`,
      `EDITOR=nano`,
    ];
  },

  uptime: () => {
    const ms = performance.now();
    const secs = Math.floor(ms / 1000);
    const mins = Math.floor(secs / 60);
    const hrs = Math.floor(mins / 60);
    return `up ${hrs}h ${mins % 60}m ${secs % 60}s`;
  },

  df: () => {
    return [
      'Filesystem     Size   Used  Avail Use% Mounted on',
      '/dev/sda1      256G    89G   167G  35% /',
      '/dev/sda2      512G   201G   311G  39% /home',
      'tmpfs          4.0G   128M   3.9G   3% /tmp',
      'IndexedDB       50M     2M    48M   4% /storage',
    ];
  },

  free: () => {
    const mem = (performance as any).memory;
    const heapUsed = mem ? Math.round(mem.usedJSHeapSize / 1024 / 1024) : '?';
    const heapTotal = mem ? Math.round(mem.totalJSHeapSize / 1024 / 1024) : '?';
    const devMem = (navigator as any).deviceMemory || '?';
    return [
      '             total   used   free',
      `Mem:       ${devMem}GB    ${heapUsed}MB   --`,
      `JS Heap:   ${heapTotal}MB  ${heapUsed}MB   ${typeof heapTotal === 'number' && typeof heapUsed === 'number' ? heapTotal - heapUsed : '?'}MB`,
    ];
  },

  export: (args) => {
    if (!args[0]) return 'export: usage: export VAR=value';
    return `(simulated) ${args.join(' ')}`;
  },
};

interface TerminalContext {
  currentPath: string;
  setCurrentPath: (path: string) => void;
  findNodeByPath: ReturnType<typeof useFileSystem>['findNodeByPath'];
  getChildren: ReturnType<typeof useFileSystem>['getChildren'];
  createFolder: ReturnType<typeof useFileSystem>['createFolder'];
  createFile: ReturnType<typeof useFileSystem>['createFile'];
  deleteNode: ReturnType<typeof useFileSystem>['deleteNode'];
  readFile: ReturnType<typeof useFileSystem>['readFile'];
  clear: () => void;
  history: string[];
  dispatch: (action: any) => void;
  addLines: (lines: TerminalLine[]) => void;
}

export default function Terminal() {
  const fs = useFileSystem();
  const { dispatch: osDispatch } = useOS();
  const [lines, setLines] = useState<TerminalLine[]>([
    { type: 'system', text: 'Welcome to UbuntuOS Terminal' },
    { type: 'system', text: 'Type "help" for available commands.' },
    { type: 'output', text: '' },
  ]);
  const [input, setInput] = useState('');
  const [currentPath, setCurrentPath] = useState('/home/user');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [savedInput, setSavedInput] = useState('');
  const [pendingAiCmd, setPendingAiCmd] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  const clear = useCallback(() => {
    setLines([]);
  }, []);

  const executeCommand = useCallback(
    (cmdLine: string) => {
      const trimmed = cmdLine.trim();
      if (!trimmed) {
        setLines((prev) => [...prev, { type: 'input', text: `${currentPath}$ ` }, { type: 'output', text: '' }]);
        return;
      }

      setLines((prev) => [...prev, { type: 'input', text: `${currentPath}$ ${trimmed}` }]);
      setHistory((prev) => [...prev, trimmed]);
      setHistoryIndex(-1);

      // ---- Pipe support ----
      const pipeParts = trimmed.split(/\s*\|\s*/);

      const ctx: TerminalContext = {
        currentPath,
        setCurrentPath,
        findNodeByPath: fs.findNodeByPath,
        getChildren: fs.getChildren,
        createFolder: fs.createFolder,
        createFile: fs.createFile,
        deleteNode: fs.deleteNode,
        readFile: fs.readFile,
        clear,
        history,
        dispatch: osDispatch,
        addLines: (newLines) => setLines(prev => [...prev, ...newLines]),
      };

      // Execute pipe chain
      if (pipeParts.length > 1) {
        let pipeData = '';
        for (const part of pipeParts) {
          const parts = part.trim().split(/\s+/);
          const cmd = parts[0].toLowerCase();
          const args = parts.slice(1);
          const handler = COMMANDS[cmd];
          if (handler) {
            const result = handler(args, ctx, pipeData);
            if (Array.isArray(result)) pipeData = result.join('\n');
            else pipeData = String(result);
          } else {
            setLines(prev => [...prev, { type: 'error', text: `${cmd}: command not found` }]);
            return;
          }
        }
        pipeData.split('\n').forEach(line => {
          setLines(prev => [...prev, { type: 'output', text: line }]);
        });
        return;
      }

      const parts = trimmed.split(/\s+/);
      const cmd = parts[0].toLowerCase();
      const args = parts.slice(1);

      const handler = COMMANDS[cmd];
      if (handler) {
        try {
          const result = handler(args, ctx);
          if (result !== '') {
            if (Array.isArray(result)) {
              result.forEach((line) => {
                setLines((prev) => [...prev, { type: 'output', text: line }]);
              });
            } else {
              setLines((prev) => [...prev, { type: 'output', text: result }]);
            }
          }
        } catch (err) {
          setLines((prev) => [...prev, { type: 'error', text: `Error: ${err}` }]);
        }
      } else if (cmd === 'fetch') {
        // Async HTTP fetch
        const url = args[0];
        if (!url) {
          setLines(prev => [...prev, { type: 'error', text: 'fetch: usage: fetch <url>' }]);
        } else {
          setLines(prev => [...prev, { type: 'system', text: `Fetching ${url}...` }]);
          const targetUrl = url.startsWith('http') ? url : `https://${url}`;
          fetch(targetUrl).then(res => res.text()).then(text => {
            const preview = text.slice(0, 500) + (text.length > 500 ? '...' : '');
            setLines(prev => [...prev, { type: 'output', text: `Status: 200 OK | ${text.length} bytes` }, { type: 'output', text: preview }]);
          }).catch(err => {
            setLines(prev => [...prev, { type: 'error', text: `fetch: ${err.message}` }]);
          });
        }
      } else if (cmd === 'weather') {
        // Async weather
        const city = args.join(' ') || 'Istanbul';
        const owmKey = localStorage.getItem('owm_api_key');
        if (!owmKey) {
          setLines(prev => [...prev, { type: 'error', text: 'weather: No API key. Set it in the Weather app first.' }]);
        } else {
          setLines(prev => [...prev, { type: 'system', text: `Fetching weather for ${city}...` }]);
          fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${owmKey}`)
            .then(r => r.json())
            .then(d => {
              if (d.cod !== 200) throw new Error(d.message);
              setLines(prev => [...prev,
                { type: 'output', text: `\x1b[36m${d.name}, ${d.sys.country}\x1b[0m` },
                { type: 'output', text: `🌡️  ${Math.round(d.main.temp)}°C (feels ${Math.round(d.main.feels_like)}°C)` },
                { type: 'output', text: `☁️  ${d.weather[0].description}` },
                { type: 'output', text: `💧 Humidity: ${d.main.humidity}%  |  💨 Wind: ${Math.round(d.wind.speed * 3.6)} km/h` },
              ]);
            }).catch(err => {
              setLines(prev => [...prev, { type: 'error', text: `weather: ${err.message}` }]);
            });
        }
      } else if (cmd === 'theme') {
        const themes = ['default', 'nord', 'dracula', 'solarized', 'gruvbox', 'tokyo-night'];
        if (!args[0]) {
          setLines(prev => [...prev, { type: 'output', text: `Available themes: ${themes.join(', ')}` }]);
        } else if (themes.includes(args[0])) {
          osDispatch({ type: 'SET_THEME', theme: { colorTheme: args[0] } });
          setLines(prev => [...prev, { type: 'system', text: `Theme changed to ${args[0]}` }]);
        } else {
          setLines(prev => [...prev, { type: 'error', text: `theme: unknown theme '${args[0]}'. Options: ${themes.join(', ')}` }]);
        }
      } else if (cmd === 'ai') {
        // AI → Command translator
        const prompt = args.join(' ');
        if (!prompt) {
          setLines(prev => [...prev,
            { type: 'error', text: 'ai: usage: ai <what you want to do>' },
            { type: 'system', text: 'Example: ai list all files in current directory' },
            { type: 'system', text: 'Example: ai create a folder called projects' },
            { type: 'system', text: 'Example: ai show system info' },
          ]);
        } else {
          const geminiKey = localStorage.getItem('aichat_gemini_key');
          const openaiKey = localStorage.getItem('aichat_openai_key');

          if (!geminiKey && !openaiKey) {
            setLines(prev => [...prev,
              { type: 'error', text: 'ai: No API key found.' },
              { type: 'system', text: 'Set your key in the AI Chat app first (Gemini or OpenAI).' },
            ]);
          } else {
            setLines(prev => [...prev, { type: 'system', text: '\x1b[35m🤖 Translating to command...\x1b[0m' }]);

            const systemPrompt = `You are a terminal command translator for LinuxOS Web (a browser-based Linux desktop).
The user describes what they want in natural language. You must respond with ONLY a JSON object:
{"command": "the exact terminal command", "explanation": "brief explanation of what it does"}

Available commands: ls, cd, pwd, mkdir, rm, cat, echo, clear, whoami, date, uname, neofetch, calc, touch, history, open, fetch, weather, theme, screenfetch, grep, head, tail, wc, sort, uniq, env, uptime, df, free.
Pipe support: cmd1 | cmd2.
"open" can open apps: terminal, browser, calculator, settings, aichat, weather, clock, notes, todo, codeeditor, filemanager, systemmonitor.
"theme" can set: default, nord, dracula, solarized, gruvbox, tokyo-night.

Rules:
- Return ONLY valid JSON, no markdown, no explanation outside JSON.
- If the task can be done with available commands, compose them.
- If not possible, set command to "" and explain why.`;

            const doTranslate = async () => {
              try {
                let reply = '';
                if (geminiKey) {
                  const res = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
                    {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        contents: [{ parts: [{ text: `${systemPrompt}\n\nUser request: ${prompt}` }] }],
                        generationConfig: { maxOutputTokens: 256 },
                      }),
                    }
                  );
                  const data = await res.json();
                  reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                } else if (openaiKey) {
                  const res = await fetch('https://api.openai.com/v1/chat/completions', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
                    body: JSON.stringify({
                      model: 'gpt-4o-mini',
                      messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: prompt },
                      ],
                      max_tokens: 256,
                    }),
                  });
                  const data = await res.json();
                  reply = data.choices?.[0]?.message?.content || '';
                }

                // Parse JSON response
                const jsonMatch = reply.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                  const parsed = JSON.parse(jsonMatch[0]);
                  const suggestedCmd = parsed.command || '';
                  const explanation = parsed.explanation || '';

                  if (suggestedCmd) {
                    setPendingAiCmd(suggestedCmd);
                    setLines(prev => [...prev,
                      { type: 'output', text: '' },
                      { type: 'output', text: `\x1b[36m💡 Suggested command:\x1b[0m` },
                      { type: 'output', text: `\x1b[33m   $ ${suggestedCmd}\x1b[0m` },
                      { type: 'output', text: '' },
                      { type: 'output', text: `\x1b[36m📝 ${explanation}\x1b[0m` },
                      { type: 'output', text: '' },
                      { type: 'system', text: '\x1b[32m→ Type \x1b[1my\x1b[0m\x1b[32m to execute, \x1b[1mn\x1b[0m\x1b[32m to cancel, or edit and run manually\x1b[0m' },
                    ]);
                  } else {
                    setLines(prev => [...prev,
                      { type: 'output', text: `\x1b[33m⚠ ${explanation || 'Cannot translate this request to a command.'}\x1b[0m` },
                    ]);
                  }
                } else {
                  // Fallback: try to extract command directly
                  const lines = reply.trim().split('\n');
                  setLines(prev => [...prev,
                    ...lines.map(l => ({ type: 'output' as const, text: `\x1b[32m${l}\x1b[0m` })),
                  ]);
                }
              } catch (err: any) {
                setLines(prev => [...prev, { type: 'error', text: `ai: ${err.message}` }]);
              }
            };
            doTranslate();
          }
        }
      } else {
        // ---- Unknown command → auto AI translate ----
        const geminiKey = localStorage.getItem('aichat_gemini_key');
        const openaiKey = localStorage.getItem('aichat_openai_key');

        if (!geminiKey && !openaiKey) {
          setLines(prev => [...prev,
            { type: 'error', text: `${cmd}: command not found` },
            { type: 'system', text: '\x1b[35mTip: Set an API key in AI Chat app to auto-translate natural language \u2192 commands\x1b[0m' },
          ]);
        } else {
          setLines(prev => [...prev, { type: 'system', text: `\x1b[35m\ud83e\udd16 "${trimmed}" \u2192 translating...\x1b[0m` }]);

          const aiSystemPrompt = `You are a terminal command translator for LinuxOS Web (a browser-based Linux desktop).
The user typed something that isn't a recognized command. Translate their intent into a valid command.
Respond with ONLY a JSON object: {"command": "the exact terminal command", "explanation": "brief explanation"}

Available commands: ls, cd, pwd, mkdir, rm, cat, echo, clear, whoami, date, uname, neofetch, calc, touch, history, open, fetch, weather, theme, screenfetch, grep, head, tail, wc, sort, uniq, env, uptime, df, free, ai.
Pipe support: cmd1 | cmd2.
"open" can open apps: terminal, browser, calculator, settings, aichat, weather, clock, notes, todo, codeeditor, filemanager, systemmonitor, music, video, drawing, chess, snake, tetris, minesweeper, contacts, calendar, email.
"theme" can set: default, nord, dracula, solarized, gruvbox, tokyo-night.

Rules:
- Return ONLY valid JSON, no markdown.
- If it looks like a programming language name (python, node, gcc, java, etc.), suggest: open codeeditor
- If it looks like a natural language request, translate to the closest command.
- If truly impossible, set command to "" and explain.`;

          const doAutoTranslate = async () => {
            try {
              let reply = '';
              if (geminiKey) {
                const res = await fetch(
                  `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
                  {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      contents: [{ parts: [{ text: `${aiSystemPrompt}\n\nUser typed: ${trimmed}` }] }],
                      generationConfig: { maxOutputTokens: 200 },
                    }),
                  }
                );
                const data = await res.json();
                reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
              } else if (openaiKey) {
                const res = await fetch('https://api.openai.com/v1/chat/completions', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
                  body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                      { role: 'system', content: aiSystemPrompt },
                      { role: 'user', content: trimmed },
                    ],
                    max_tokens: 200,
                  }),
                });
                const data = await res.json();
                reply = data.choices?.[0]?.message?.content || '';
              }

              const jsonMatch = reply.match(/\{[\s\S]*\}/);
              if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                const suggestedCmd = parsed.command || '';
                const explanation = parsed.explanation || '';

                if (suggestedCmd) {
                  setPendingAiCmd(suggestedCmd);
                  setLines(prev => [...prev,
                    { type: 'output', text: `\x1b[36m\ud83d\udca1 Did you mean:\x1b[0m` },
                    { type: 'output', text: `\x1b[33m   $ ${suggestedCmd}\x1b[0m` },
                    { type: 'output', text: `\x1b[36m   ${explanation}\x1b[0m` },
                    { type: 'system', text: '\x1b[32m\u2192 y = execute, n = cancel\x1b[0m' },
                  ]);
                } else {
                  setLines(prev => [...prev,
                    { type: 'output', text: `\x1b[33m\u26a0 ${explanation || 'Cannot translate to a command.'}\x1b[0m` },
                  ]);
                }
              } else {
                setLines(prev => [...prev, { type: 'error', text: `${cmd}: command not found` }]);
              }
            } catch {
              setLines(prev => [...prev, { type: 'error', text: `${cmd}: command not found` }]);
            }
          };
          doAutoTranslate();
        }
      }
    },
    [currentPath, fs, clear, history, osDispatch, pendingAiCmd]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        // Handle pending AI command confirmation
        if (pendingAiCmd && (input.toLowerCase() === 'y' || input.toLowerCase() === 'yes')) {
          setLines(prev => [...prev, { type: 'input', text: `${currentPath}$ ${input}` }]);
          setLines(prev => [...prev, { type: 'system', text: `\x1b[32m✓ Executing: ${pendingAiCmd}\x1b[0m` }]);
          const cmdToRun = pendingAiCmd;
          setPendingAiCmd(null);
          setInput('');
          setHistoryIndex(-1);
          // Execute the suggested command
          setTimeout(() => executeCommand(cmdToRun), 100);
          return;
        } else if (pendingAiCmd && (input.toLowerCase() === 'n' || input.toLowerCase() === 'no')) {
          setLines(prev => [...prev, { type: 'input', text: `${currentPath}$ ${input}` }]);
          setLines(prev => [...prev, { type: 'system', text: '\x1b[33m✗ Cancelled\x1b[0m' }]);
          setPendingAiCmd(null);
          setInput('');
          setHistoryIndex(-1);
          return;
        } else if (pendingAiCmd && !input.trim()) {
          // Empty enter clears pending
          setPendingAiCmd(null);
        }
        executeCommand(input);
        setInput('');
        setHistoryIndex(-1);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (historyIndex === -1) {
          setSavedInput(input);
        }
        const newIndex = historyIndex + 1;
        if (newIndex < history.length) {
          setHistoryIndex(newIndex);
          setInput(history[history.length - 1 - newIndex]);
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (historyIndex <= 0) {
          setHistoryIndex(-1);
          setInput(savedInput);
        } else {
          const newIndex = historyIndex - 1;
          setHistoryIndex(newIndex);
          setInput(history[history.length - 1 - newIndex]);
        }
      }
    },
    [input, executeCommand, history, historyIndex, savedInput]
  );

  // Click on terminal to focus input
  const handleTerminalClick = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  // Parse ANSI color codes for display
  const parseAnsi = (text: string): React.ReactNode[] => {
    if (!text.includes('\x1b[')) return [text];
    const parts: React.ReactNode[] = [];
    const regex = /\x1b\[(\d+)m/g;
    let lastIndex = 0;
    let currentColor = '';
    let match;
    let key = 0;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(
          <span key={key++} style={{ color: currentColor }}>
            {text.slice(lastIndex, match.index)}
          </span>
        );
      }
      const code = parseInt(match[1], 10);
      switch (code) {
        case 30: currentColor = '#000'; break;
        case 31: currentColor = '#F44336'; break;
        case 32: currentColor = '#4CAF50'; break;
        case 33: currentColor = '#FF9800'; break;
        case 34: currentColor = '#2196F3'; break;
        case 35: currentColor = '#7C4DFF'; break;
        case 36: currentColor = '#00BCD4'; break;
        case 37: currentColor = '#E0E0E0'; break;
        case 0: currentColor = ''; break;
        default: currentColor = '';
      }
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) {
      parts.push(
        <span key={key++} style={{ color: currentColor }}>
          {text.slice(lastIndex)}
        </span>
      );
    }
    return parts;
  };

  return (
    <div
      className="flex flex-col h-full font-mono text-xs select-text cursor-text"
      style={{
        background: '#0C0C0C',
        color: '#E0E0E0',
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
      }}
      onClick={handleTerminalClick}
    >
      {/* Terminal output */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 custom-scrollbar">
        {lines.map((line, i) => (
          <div key={i} className="whitespace-pre-wrap break-all leading-5">
            {line.type === 'input' && (
              <span>
                <span className="text-[#4CAF50]">{currentPath}</span>
                <span className="text-[#E0E0E0]">$ </span>
                <span className="text-[#E0E0E0]">{line.text.slice(line.text.indexOf('$') + 2)}</span>
              </span>
            )}
            {line.type === 'output' && <span className="text-[#E0E0E0]">{parseAnsi(line.text)}</span>}
            {line.type === 'error' && <span className="text-[#F44336]">{line.text}</span>}
            {line.type === 'system' && <span className="text-[#9E9E9E]">{line.text}</span>}
          </div>
        ))}

        {/* Input line */}
        <div className="flex items-center gap-1 mt-1">
          <span className="text-[#4CAF50] shrink-0">{currentPath}$</span>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent outline-none text-[#E0E0E0] min-w-0"
            autoFocus
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
          />
        </div>
      </div>
    </div>
  );
}
