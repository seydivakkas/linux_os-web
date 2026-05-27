// ============================================================
// App Router — Maps appId to component (Lazy Loaded)
// Each app loads as a separate chunk for optimal performance.
// ErrorBoundary catches crashes per-window (not globally).
// ============================================================

import { lazy, Suspense } from 'react';
import type { FC } from 'react';
import ErrorBoundary from '@/components/ErrorBoundary';

// Lazy-loaded app imports — each app is a separate chunk
const FileManager = lazy(() => import('./FileManager'));
const Terminal = lazy(() => import('./Terminal'));
const Calculator = lazy(() => import('./Calculator'));
const TextEditor = lazy(() => import('./TextEditor'));
const Settings = lazy(() => import('./Settings'));
const SystemMonitor = lazy(() => import('./SystemMonitor'));
const Calendar = lazy(() => import('./Calendar'));
const Notes = lazy(() => import('./Notes'));
const Todo = lazy(() => import('./Todo'));
const Clock = lazy(() => import('./Clock'));
const Spreadsheet = lazy(() => import('./Spreadsheet'));
const ArchiveManager = lazy(() => import('./ArchiveManager'));
const Browser = lazy(() => import('./Browser'));
const Email = lazy(() => import('./Email'));
const Chat = lazy(() => import('./Chat'));
const Weather = lazy(() => import('./Weather'));
const MusicPlayer = lazy(() => import('./MusicPlayer'));
const VideoPlayer = lazy(() => import('./VideoPlayer'));
const ImageViewer = lazy(() => import('./ImageViewer'));
const PhotoEditor = lazy(() => import('./PhotoEditor'));
const VoiceRecorder = lazy(() => import('./VoiceRecorder'));
const ScreenRecorder = lazy(() => import('./ScreenRecorder'));
const Minesweeper = lazy(() => import('./Minesweeper'));
const Snake = lazy(() => import('./Snake'));
const Tetris = lazy(() => import('./Tetris'));
const TicTacToe = lazy(() => import('./TicTacToe'));
const Game2048 = lazy(() => import('./Game2048'));
const Sudoku = lazy(() => import('./Sudoku'));
const Chess = lazy(() => import('./Chess'));
const Memory = lazy(() => import('./Memory'));
const Pong = lazy(() => import('./Pong'));
const Solitaire = lazy(() => import('./Solitaire'));
const CodeEditor = lazy(() => import('./CodeEditor'));
const JsonFormatter = lazy(() => import('./JsonFormatter'));
const RegexTester = lazy(() => import('./RegexTester'));
const MarkdownPreview = lazy(() => import('./MarkdownPreview'));
const GitClient = lazy(() => import('./GitClient'));
const ApiTester = lazy(() => import('./ApiTester'));
const Base64Tool = lazy(() => import('./Base64Tool'));
const ColorPalette = lazy(() => import('./ColorPalette'));
const Drawing = lazy(() => import('./Drawing'));
const ColorPicker = lazy(() => import('./ColorPicker'));
const ImageGallery = lazy(() => import('./ImageGallery'));
const AsciiArt = lazy(() => import('./AsciiArt'));
const DocumentViewer = lazy(() => import('./DocumentViewer'));
const Reminders = lazy(() => import('./Reminders'));
const Contacts = lazy(() => import('./Contacts'));
const PasswordManager = lazy(() => import('./PasswordManager'));
const Whiteboard = lazy(() => import('./Whiteboard'));
const RssReader = lazy(() => import('./RssReader'));
const FtpClient = lazy(() => import('./FtpClient'));
const NetworkTools = lazy(() => import('./NetworkTools'));
const MediaConverter = lazy(() => import('./MediaConverter'));
const FlappyBird = lazy(() => import('./FlappyBird'));
const MatrixRain = lazy(() => import('./MatrixRain'));
const AIChat = lazy(() => import('./AIChat'));

// Business apps
const KanbanBoard = lazy(() => import('./KanbanBoard'));
const DashboardBuilder = lazy(() => import('./DashboardBuilder'));
const InvoiceGenerator = lazy(() => import('./InvoiceGenerator'));
const TimeTracker = lazy(() => import('./TimeTracker'));
const Wiki = lazy(() => import('./Wiki'));

// Loading skeleton shown while an app chunk loads
const AppLoading = () => (
  <div className="flex flex-col items-center justify-center h-full gap-4">
    {/* Animated shimmer skeleton */}
    <div className="w-full max-w-[320px] space-y-3 p-6">
      <div
        className="h-4 rounded-md"
        style={{
          background: 'linear-gradient(90deg, var(--bg-hover) 25%, var(--bg-active) 50%, var(--bg-hover) 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s ease-in-out infinite',
        }}
      />
      <div
        className="h-3 w-3/4 rounded-md"
        style={{
          background: 'linear-gradient(90deg, var(--bg-hover) 25%, var(--bg-active) 50%, var(--bg-hover) 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s ease-in-out infinite 0.1s',
        }}
      />
      <div
        className="h-3 w-1/2 rounded-md"
        style={{
          background: 'linear-gradient(90deg, var(--bg-hover) 25%, var(--bg-active) 50%, var(--bg-hover) 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.5s ease-in-out infinite 0.2s',
        }}
      />
    </div>
    <div className="flex items-center gap-2">
      <div
        className="w-5 h-5 rounded-full border-2 border-transparent"
        style={{
          borderTopColor: 'var(--accent-primary)',
          animation: 'spin 600ms linear infinite',
        }}
      />
      <span className="text-xs text-[var(--text-secondary)]">Loading…</span>
    </div>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// Map appId → component
const APP_MAP: Record<string, FC> = {
  filemanager: FileManager,
  terminal: Terminal,
  calculator: Calculator,
  texteditor: TextEditor,
  settings: Settings,
  systemmonitor: SystemMonitor,
  calendar: Calendar,
  notes: Notes,
  todo: Todo,
  clock: Clock,
  spreadsheet: Spreadsheet,
  archivemanager: ArchiveManager,
  browser: Browser,
  email: Email,
  chat: Chat,
  weather: Weather,
  musicplayer: MusicPlayer,
  videoplayer: VideoPlayer,
  imageviewer: ImageViewer,
  photoeditor: PhotoEditor,
  voicerecorder: VoiceRecorder,
  screenrecorder: ScreenRecorder,
  minesweeper: Minesweeper,
  snake: Snake,
  tetris: Tetris,
  tictactoe: TicTacToe,
  game2048: Game2048,
  sudoku: Sudoku,
  chess: Chess,
  memory: Memory,
  pong: Pong,
  solitaire: Solitaire,
  codeeditor: CodeEditor,
  jsonformatter: JsonFormatter,
  regextester: RegexTester,
  markdownpreview: MarkdownPreview,
  gitclient: GitClient,
  apitester: ApiTester,
  base64tool: Base64Tool,
  colorpalette: ColorPalette,
  drawing: Drawing,
  colorpicker: ColorPicker,
  imagegallery: ImageGallery,
  asciiart: AsciiArt,
  documentviewer: DocumentViewer,
  reminders: Reminders,
  contacts: Contacts,
  passwordmanager: PasswordManager,
  whiteboard: Whiteboard,
  rssreader: RssReader,
  ftpclient: FtpClient,
  networktools: NetworkTools,
  mediaconverter: MediaConverter,
  flappybird: FlappyBird,
  matrixrain: MatrixRain,
  aichat: AIChat,
  kanban: KanbanBoard,
  dashboard: DashboardBuilder,
  invoice: InvoiceGenerator,
  timetracker: TimeTracker,
  wiki: Wiki,
};

interface AppRouterProps {
  appId: string;
  windowId: string;
}

const NotImplementedLazy = lazy(() => import('@/components/NotImplemented'));

const AppRouter: FC<AppRouterProps> = ({ appId, windowId }) => {
  const AppComponent = APP_MAP[appId];

  return (
    <ErrorBoundary appId={appId} key={windowId}>
      <Suspense fallback={<AppLoading />}>
        {AppComponent ? <AppComponent /> : <NotImplementedLazy appId={appId} />}
      </Suspense>
    </ErrorBoundary>
  );
};

export default AppRouter;

