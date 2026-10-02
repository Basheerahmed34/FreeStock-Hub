import React, { useState } from 'react';
import { X, Database, Copy, Check, Terminal, ExternalLink } from 'lucide-react';
import { POSTGRES_MIGRATION_SQL } from '../server/services/postgres-schema.js';

interface SchemaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SchemaModal: React.FC<SchemaModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(POSTGRES_MIGRATION_SQL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-4xl rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <Database className="h-5 w-5 text-cyan-400" />
            <div>
              <h2 className="text-base font-semibold text-white">
                PostgreSQL Database Architecture (Supabase / Neon)
              </h2>
              <p className="text-xs text-slate-400">
                Normalized Assets Schema · GIN Trigram Search · Row Level Security (RLS) · Quota Logs
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied SQL</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Copy SQL</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5">
              <span className="text-slate-500 block">Architecture</span>
              <span className="text-white font-semibold">Normalized Adapter Cache</span>
              <p className="text-slate-400 mt-1">Composite key deduplication (provider + provider_asset_id)</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5">
              <span className="text-slate-500 block">Security Model</span>
              <span className="text-white font-semibold">Row Level Security (RLS)</span>
              <p className="text-slate-400 mt-1">Supabase auth.uid() isolation for user collections</p>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-3.5">
              <span className="text-slate-500 block">Search Performance</span>
              <span className="text-white font-semibold">GIN Trigram Indexes</span>
              <p className="text-slate-400 mt-1">pg_trgm indexing for lightning fast sub-string search</p>
            </div>
          </div>

          <div className="relative rounded-xl border border-slate-800 bg-slate-950 p-4">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-mono">
                <Terminal className="h-3.5 w-3.5 text-cyan-400" />
                schema_migrations.sql
              </span>
              <span>Ready for Supabase SQL Editor or psql</span>
            </div>
            <pre className="font-mono text-xs text-slate-300 overflow-x-auto p-2 bg-slate-900/90 rounded border border-slate-800 leading-relaxed max-h-[380px]">
              {POSTGRES_MIGRATION_SQL}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-800 bg-slate-950 px-6 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-xs font-semibold text-slate-950 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
