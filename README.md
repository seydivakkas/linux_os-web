# 🐧 LinuxOS Web — Browser-Based Linux Desktop

A fully functional Linux desktop environment running entirely in the browser. Built with React, TypeScript, and Vite.

![LinuxOS Web](https://img.shields.io/badge/LinuxOS-Web%20Desktop-7C4DFF?style=for-the-badge&logo=linux&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white)

## ✨ Features

### 🖥️ Desktop Environment
- **Window Management** — Drag, resize, minimize, maximize, close
- **Desktop Icons** — Draggable grid-based icons
- **Dock** — macOS-style application dock with hover animations
- **Top Panel** — GNOME-style with clock, system tray, power menu
- **Context Menu** — Right-click everywhere with contextual actions
- **Desktop Widgets** — Clock, weather, system monitor, quick notes
- **Spotlight Search** — `Ctrl+Space` global app/file/command search
- **Lock Screen** — `Super+L` with password protection
- **Boot Sequence** — Animated Linux boot splash
- **Theme System** — Dark/Light mode + Nord, Dracula, Solarized, Gruvbox, Tokyo Night

### 📦 57+ Applications

| Category | Apps |
|----------|------|
| **System (7)** | File Manager, Terminal, Text Editor, Calculator, Settings, System Monitor, Archive Manager |
| **Productivity (10)** | Calendar, Notes, Todo, Clock/Pomodoro, Spreadsheet, Document Viewer, Reminders, Contacts, Password Manager, Whiteboard |
| **Internet (7)** | Browser (iframe), Email, Chat, Weather (real API), RSS Reader, FTP Client, Network Tools |
| **Media (7)** | Music Player, Video Player, Image Viewer, Photo Editor, Voice Recorder, Screen Recorder, Media Converter |
| **Games (11)** | Minesweeper, Snake, Tetris, Tic-Tac-Toe, 2048, Sudoku, Chess, Memory, Pong, Solitaire, Flappy Bird |
| **DevTools (8)** | Code Editor, JSON Formatter, Regex Tester, Markdown Preview, Git Client, API Tester, Base64 Tool, Color Palette |
| **Creative (4)** | Drawing, Color Picker, Image Gallery, ASCII Art |
| **AI (1)** | AI Chat (Gemini + OpenAI) |

### 🔥 Real-World Integrations
- **AI Terminal** — Natural language → command translation with auto-execute
- **Weather** — OpenWeatherMap API with geolocation
- **Browser** — Real iframe web browsing via DuckDuckGo
- **AI Chat** — Gemini 2.0 Flash & GPT-4o Mini
- **File System** — IndexedDB-backed persistent storage with drag-drop upload/download
- **System Monitor** — Real FPS, JS Heap, CPU cores, network info

### ⌨️ Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Ctrl+Space` | Spotlight Search |
| `Super+L` | Lock Screen |
| `Super+D` | Show Desktop |
| `Ctrl+Alt+T` | Open Terminal |
| `Alt+Tab` | Switch Windows |
| `Ctrl+W` | Close Window |

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/seydivakkas/linuxos-web.git
cd linuxos-web/app

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Tech Stack

- **Framework:** React 19 + TypeScript 5
- **Build:** Vite 7
- **Styling:** Tailwind CSS 4 + CSS Variables
- **Storage:** IndexedDB (Dexie.js pattern) + localStorage
- **Icons:** Lucide React
- **State:** React Context + useReducer

## 📁 Project Structure

```
app/
├── src/
│   ├── apps/           # 57+ application components
│   │   ├── registry.ts # App registry & metadata
│   │   └── ...
│   ├── components/     # Shell components
│   │   ├── Desktop.tsx
│   │   ├── Dock.tsx
│   │   ├── TopPanel.tsx
│   │   ├── WindowFrame.tsx
│   │   ├── DesktopWidgets.tsx
│   │   ├── SpotlightSearch.tsx
│   │   ├── LockScreen.tsx
│   │   └── ...
│   ├── hooks/          # Custom hooks
│   │   ├── useOSStore.ts
│   │   ├── useFileSystem.ts
│   │   └── useIndexedDB.ts
│   └── types/          # TypeScript types
├── index.html
├── vite.config.ts
└── package.json
```

## 🔑 API Keys (Optional)

Set these in-app for enhanced features:
- **OpenWeatherMap** — Weather app → Settings
- **Gemini API** — AI Chat → Settings
- **OpenAI API** — AI Chat → Settings (alternative)

> All keys are stored in browser localStorage only. No server-side storage.

## 📄 License

MIT License — Feel free to use, modify, and distribute.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

**Built with ❤️ using React + TypeScript**
