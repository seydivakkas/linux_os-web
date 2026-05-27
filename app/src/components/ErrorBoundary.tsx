// ============================================================
// ErrorBoundary — Catches render errors in app windows
// ============================================================

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  appId?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[ErrorBoundary] App "${this.props.appId}" crashed:`, error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 p-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'rgba(244, 67, 54, 0.1)' }}
          >
            <AlertTriangle size={32} style={{ color: 'var(--accent-error)' }} />
          </div>

          <div className="text-center">
            <h3
              className="text-sm font-semibold mb-1"
              style={{ color: 'var(--text-primary)' }}
            >
              Application Error
            </h3>
            <p
              className="text-xs max-w-[300px]"
              style={{ color: 'var(--text-secondary)' }}
            >
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
          </div>

          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all"
            style={{
              background: 'var(--accent-primary)',
              color: '#fff',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9';
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <RefreshCw size={14} />
            Restart App
          </button>

          {/* Collapsible stack trace for dev */}
          <details className="w-full max-w-[400px] mt-2">
            <summary
              className="text-[10px] cursor-pointer select-none"
              style={{ color: 'var(--text-disabled)' }}
            >
              Stack trace
            </summary>
            <pre
              className="mt-2 p-3 rounded-lg text-[10px] overflow-auto max-h-[200px] custom-scrollbar"
              style={{
                background: 'var(--bg-input)',
                color: 'var(--text-secondary)',
                fontFamily: "'JetBrains Mono', monospace",
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}
            >
              {this.state.error?.stack}
            </pre>
          </details>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
