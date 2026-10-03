import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { ApexLogo } from './ApexLogo';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Autonoma ErrorBoundary] Caught render failure:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    try {
      localStorage.removeItem('apex_autonoma_active_campaign_filter');
    } catch {}
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  private handleReload = () => {
    this.handleReset();
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col justify-between selection:bg-[#FF4500] selection:text-white p-4 sm:p-8">
          <header className="flex items-center justify-between border-b border-black/[0.08] pb-4 max-w-4xl mx-auto w-full">
            <div className="flex items-center space-x-3">
              <ApexLogo variant="lockup" size="md" />
              <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
                Workspace Recovery
              </span>
            </div>
            <span className="text-xs text-[#6E6E73] font-mono">
              Safe Recovery Active
            </span>
          </header>

          <main className="flex-1 flex items-center justify-center my-8 max-w-xl mx-auto w-full">
            <div className="w-full bg-white border border-black/[0.08] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mx-auto">
                <AlertTriangle className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1D1D1F]">
                  Workspace View Recovered
                </h2>
                <p className="text-xs sm:text-sm text-[#6E6E73] leading-relaxed max-w-md mx-auto">
                  A transient rendering assumption was caught while updating company workspace data. All saved campaigns and account credentials remain intact.
                </p>
              </div>

              {this.state.error?.message && (
                <div className="p-3 bg-white rounded-xl border border-black/[0.08] text-left">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#6E6E73] mb-1">
                    Diagnostic Trace
                  </div>
                  <div className="text-xs font-mono text-red-700 break-words line-clamp-3">
                    {this.state.error.message}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={this.handleReset}
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-[#FF4500] hover:bg-[#EA3E00] text-white text-xs font-semibold rounded-xl shadow-lg shadow-[#FF4500]/20 transition-all active:scale-95"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Resume Workspace</span>
                </button>

                <button
                  onClick={this.handleReload}
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-[#F5F5F7] hover:bg-black/[0.05] border border-black/[0.08] text-[#1D1D1F] text-xs font-semibold rounded-xl transition-all"
                >
                  <Home className="w-3.5 h-3.5 text-[#6E6E73]" />
                  <span>Refresh App</span>
                </button>
              </div>
            </div>
          </main>

          <footer className="text-center text-xs text-[#6E6E73] border-t border-black/[0.06] pt-4 max-w-4xl mx-auto w-full">
            Apex Autonoma · Robust Fault-Tolerant Workspace Session
          </footer>
        </div>
      );
    }

    return this.props.children;
  }
}
