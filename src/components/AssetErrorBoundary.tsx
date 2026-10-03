import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class AssetErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.warn('AssetErrorBoundary caught an isolated card error:', error, errorInfo);
  }

  private handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    this.setState({ hasError: false, error: undefined });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-red-500/30 bg-slate-900/60 p-4 text-xs text-slate-300">
          <div className="flex items-center gap-2 text-amber-400">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <span className="font-semibold">{this.props.fallbackTitle || 'Asset Display Interrupted'}</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400 leading-relaxed">
            This individual item encountered a rendering issue. Other items remain active and unaffected.
          </p>
          <button
            onClick={this.handleRetry}
            className="mt-3 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors cursor-pointer"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Retry Card</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
