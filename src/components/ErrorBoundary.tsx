import React, { Component, ErrorInfo, ReactNode } from 'react';
import { OFFICIAL_APP_ICON } from '../constants/appIcon';
import { RotateCw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('NABIOSOS Hub Uncaught Error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center shadow-2xl space-y-4">
            <div className="relative inline-block mx-auto mb-2">
              <img
                src={OFFICIAL_APP_ICON}
                alt="NABIOSOS Hub"
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-emerald-500/50 shadow-lg"
              />
              <div className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 rounded-full p-1 shadow">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
            </div>

            <div>
              <h2 className="text-lg font-black text-white">Something went wrong</h2>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                NABIOSOS Hub encountered a display error. Please reload to restore your live chat session.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-left overflow-auto max-h-24">
                <p className="text-[11px] font-mono text-rose-300 break-words">
                  {this.state.error.message || String(this.state.error)}
                </p>
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-md shadow-emerald-900/30"
            >
              <RotateCw className="w-4 h-4" />
              <span>Reload NABIOSOS Hub</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
