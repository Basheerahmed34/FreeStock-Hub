import React, { useState, useEffect } from 'react';
import { ProviderDebugInfo } from '../types/unified-asset.js';
import {
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Database,
  Key,
  X,
  RefreshCw,
  Search,
  Zap,
  HelpCircle
} from 'lucide-react';

interface SearchDebugPanelProps {
  isOpen: boolean;
  onClose: () => void;
  debugInfo: ProviderDebugInfo[];
  currentQuery: string;
  executionTimeMs?: number;
  isCached?: boolean;
}

export const SearchDebugPanel: React.FC<SearchDebugPanelProps> = ({
  isOpen,
  onClose,
  debugInfo,
  currentQuery,
  executionTimeMs,
  isCached
}) => {
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'SUCCESS' | 'ERROR' | 'DISABLED_NO_KEY'>('ALL');

  // Close on Escape key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const totalProviders = debugInfo.length;
  const successProviders = debugInfo.filter((p) => p.status === 'SUCCESS').length;
  const disabledProviders = debugInfo.filter((p) => p.status === 'DISABLED_NO_KEY').length;
  const errorProviders = debugInfo.filter((p) => p.status === 'ERROR').length;
  const totalItemsFetched = debugInfo.reduce((acc, p) => acc + (p.resultsFetched || 0), 0);

  const displayedProviders = debugInfo.filter((p) => {
    if (filterStatus === 'ALL') return true;
    return p.status === filterStatus;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl sm:rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 sm:p-5 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 mr-2">
            <div className="p-2 sm:p-2.5 rounded-2xl bg-lime-400/10 border border-lime-400/20 text-lime-400 flex-shrink-0">
              <Activity className="h-4 w-4 sm:h-5 sm:w-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white truncate">Diagnostics & Telemetry</h2>
                {isCached && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex-shrink-0">
                    RAM Cached
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                Multi-provider execution logs, HTTP statuses & result counts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer flex-shrink-0"
            aria-label="Close diagnostics panel"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Global Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-950/40 border-b border-slate-800 text-xs">
          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-2.5">
            <Search className="h-4 w-4 text-slate-400 flex-shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] text-slate-500 block uppercase font-mono">Current Query</span>
              <span className="font-semibold text-white truncate block">
                {currentQuery ? `"${currentQuery}"` : 'None (Broad)'}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-2.5">
            <Clock className="h-4 w-4 text-cyan-400 flex-shrink-0" />
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-mono">Latency</span>
              <span className="font-mono font-bold text-cyan-300">
                {executionTimeMs !== undefined ? `${executionTimeMs}ms` : '--'}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-2.5">
            <Database className="h-4 w-4 text-lime-400 flex-shrink-0" />
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-mono">Total Fetched</span>
              <span className="font-mono font-bold text-lime-300">
                {totalItemsFetched} items
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center gap-2.5">
            <Zap className="h-4 w-4 text-purple-400 flex-shrink-0" />
            <div>
              <span className="text-[10px] text-slate-500 block uppercase font-mono">Providers Active</span>
              <span className="font-mono font-bold text-purple-300">
                {successProviders} / {totalProviders}
              </span>
            </div>
          </div>
        </div>

        {/* Status Filter Buttons */}
        <div className="px-5 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 bg-slate-900/40">
          <div className="flex items-center gap-1.5 text-xs">
            <button
              onClick={() => setFilterStatus('ALL')}
              className={`px-3 py-1 rounded-xl font-medium transition-colors cursor-pointer ${
                filterStatus === 'ALL'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              All ({totalProviders})
            </button>
            <button
              onClick={() => setFilterStatus('SUCCESS')}
              className={`px-3 py-1 rounded-xl font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                filterStatus === 'SUCCESS'
                  ? 'bg-lime-400/20 text-lime-300 border border-lime-400/30'
                  : 'text-slate-400 hover:text-lime-300 hover:bg-slate-800'
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-lime-400" />
              <span>Active ({successProviders})</span>
            </button>
            <button
              onClick={() => setFilterStatus('DISABLED_NO_KEY')}
              className={`px-3 py-1 rounded-xl font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                filterStatus === 'DISABLED_NO_KEY'
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                  : 'text-slate-400 hover:text-amber-300 hover:bg-slate-800'
              }`}
            >
              <Key className="h-3.5 w-3.5 text-amber-400" />
              <span>Needs Key ({disabledProviders})</span>
            </button>
            {errorProviders > 0 && (
              <button
                onClick={() => setFilterStatus('ERROR')}
                className={`px-3 py-1 rounded-xl font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                  filterStatus === 'ERROR'
                    ? 'bg-pink-500/20 text-pink-300 border border-pink-500/30'
                    : 'text-slate-400 hover:text-pink-300 hover:bg-slate-800'
                }`}
              >
                <XCircle className="h-3.5 w-3.5 text-pink-400" />
                <span>Errors ({errorProviders})</span>
              </button>
            )}
          </div>

          <span className="text-[11px] text-slate-500 font-mono hidden sm:inline">
            Zero Mock Data: Real API Feeds
          </span>
        </div>

        {/* Provider Breakdown Table / Cards */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {displayedProviders.map((p) => {
            const isSuccess = p.status === 'SUCCESS';
            const isDisabled = p.status === 'DISABLED_NO_KEY';
            const isError = p.status === 'ERROR';

            return (
              <div
                key={p.provider}
                className={`p-4 rounded-2xl border transition-all ${
                  isSuccess
                    ? 'bg-slate-950/60 border-slate-800 hover:border-lime-500/30'
                    : isDisabled
                    ? 'bg-amber-950/10 border-amber-500/20'
                    : 'bg-pink-950/10 border-pink-500/20'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Provider & Status Badge */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-xl flex items-center justify-center ${
                        isSuccess
                          ? 'bg-lime-400/10 text-lime-400 border border-lime-400/20'
                          : isDisabled
                          ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                          : 'bg-pink-400/10 text-pink-400 border border-pink-400/20'
                      }`}
                    >
                      {isSuccess ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : isDisabled ? (
                        <Key className="h-4 w-4" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm capitalize">
                          {p.provider}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full uppercase font-bold tracking-wider ${
                            isSuccess
                              ? 'bg-lime-400/10 text-lime-400 border border-lime-400/30'
                              : isDisabled
                              ? 'bg-amber-400/10 text-amber-400 border border-amber-400/30'
                              : 'bg-pink-500/10 text-pink-400 border border-pink-500/30'
                          }`}
                        >
                          {p.status}
                        </span>
                        {p.httpStatus && (
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                            HTTP {p.httpStatus}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">
                        Query: {p.query ? `"${p.query}"` : 'empty'}
                      </span>
                    </div>
                  </div>

                  {/* Metrics */}
                  <div className="flex items-center gap-4 text-xs font-mono">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Fetched</span>
                      <span className={`font-bold ${isSuccess ? 'text-lime-300' : 'text-slate-500'}`}>
                        {p.resultsFetched} items
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Total Available</span>
                      <span className="text-slate-300 font-bold">
                        {p.totalAvailable !== null ? (
                          p.totalAvailable.toLocaleString()
                        ) : (
                          <span className="text-slate-500 font-normal italic text-[11px]">
                            Not provided by API
                          </span>
                        )}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 uppercase block">Response Time</span>
                      <span className="text-cyan-300">
                        {p.responseTimeMs > 0 ? `${p.responseTimeMs}ms` : '--'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Error/Notice Details if any */}
                {p.error && (
                  <div
                    className={`mt-3 p-2.5 rounded-xl text-xs flex items-center gap-2 ${
                      isDisabled
                        ? 'bg-amber-500/10 border border-amber-500/20 text-amber-300'
                        : 'bg-pink-500/10 border border-pink-500/20 text-pink-300'
                    }`}
                  >
                    <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                    <span className="font-mono text-[11px]">{p.error}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2 text-[11px]">
            <HelpCircle className="h-4 w-4 text-lime-400" />
            <span>
              All APIs run via parallel isolated requests (<code className="text-lime-300">Promise.allSettled</code>). An unconfigured key never interrupts other providers.
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors cursor-pointer"
          >
            Close Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
};
